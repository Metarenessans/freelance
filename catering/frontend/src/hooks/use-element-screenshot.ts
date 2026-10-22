import { useCallback, useRef } from "react";
import { toast } from "react-hot-toast";

interface UseElementScreenshotOptions {
  backgroundColor?: string;
  scale?: number;
  clipboardText?: string | (() => string);
}

/**
 * Converts any image URL to a Base64 data URL using our Next.js API proxy to bypass browser CORS.
 */
async function toBase64DataUrl(url: string): Promise<string> {
  if (!url || url.startsWith("data:")) return url;

  // 1. Fetch via our local Next.js proxy endpoint (same-origin, guarantees CORS bypass)
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Proxy fetch failed, attempting direct fetch:", err);
  }

  // 2. Direct fetch fallback
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Direct fetch failed for image:", url, err);
  }

  return "";
}

export const useElementScreenshot = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: UseElementScreenshotOptions = {}
) => {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const capture = useCallback(async (overrideClipboardText?: string) => {
    const element = elementRef.current;
    if (!element) {
      console.warn("Capture failed: element is null");
      return;
    }

    const { backgroundColor = "#ffffff", scale = 2, clipboardText } = optionsRef.current;

    const toastId = toast.loading("Creating screenshot...");

    // 1. Collect all images and store original attributes
    const liveImages = Array.from(element.getElementsByTagName("img"));
    const originalAttrs = liveImages.map((img) => ({
      src: img.src,
      srcset: img.getAttribute("srcset"),
      srcSet: img.getAttribute("srcSet"),
      loading: img.getAttribute("loading"),
      opacity: img.style.opacity,
      visibility: img.style.visibility,
    }));

    // 2. Pre-convert all images to Base64 in parallel via Next.js proxy
    const base64List = await Promise.all(
      liveImages.map((img) => toBase64DataUrl(img.src))
    );

    // 3. Temporarily apply Base64 data URLs and force visibility
    liveImages.forEach((img, idx) => {
      const base64 = base64List[idx];
      if (base64) {
        img.src = base64;
      }
      img.removeAttribute("srcset");
      img.removeAttribute("srcSet");
      img.removeAttribute("loading");
      img.style.opacity = "1";
      img.style.visibility = "visible";
    });

    // Small delay to ensure browser paints the Base64 images into the DOM
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const fullScrollHeight = element.scrollHeight;
      const fullClientWidth = element.clientWidth;

      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(element, {
        backgroundColor,
        pixelRatio: scale,
        skipFonts: true,
        width: fullClientWidth,
        height: fullScrollHeight,
        style: {
          height: `${fullScrollHeight}px`,
          maxHeight: "none",
          overflow: "visible",
        },
      });

      if (!blob) {
        toast.error("Could not generate the image", { id: toastId });
        return;
      }

      // 1. Always download the screenshot image file
      let isDownloaded = false;
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cart_${new Date().toISOString().slice(0, 10)}_${Math.floor(Date.now() / 1000)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        isDownloaded = true;
      } catch (downloadErr) {
        console.error("Download failed:", downloadErr);
      }

      // 2. Copy formatted text to clipboard (instead of copying the image)
      let isTextCopied = false;
      const textToCopy = overrideClipboardText ?? (typeof clipboardText === "function" ? clipboardText() : clipboardText);

      if (textToCopy) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToCopy);
            isTextCopied = true;
          } else {
            const textarea = document.createElement("textarea");
            textarea.value = textToCopy;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            isTextCopied = true;
          }
        } catch (clipErr) {
          console.warn("Clipboard writeText failed:", clipErr);
        }
      }

      if (isDownloaded && isTextCopied) {
        toast.success(`Screenshot downloaded, and “${textToCopy}” copied to clipboard!`, { id: toastId });
      } else if (isDownloaded) {
        toast.success("Screenshot saved to Downloads!", { id: toastId });
      } else if (isTextCopied) {
        toast.success(`Copied to clipboard: «${textToCopy}»`, { id: toastId });
      } else {
        toast.error("Could not download the screenshot.", { id: toastId });
      }
    } catch (err) {
      console.error("Screenshot capture failed with html-to-image:", err);
      toast.error(`Could not capture the screenshot: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    } finally {
      // 4. Always restore original image attributes and styles
      liveImages.forEach((img, idx) => {
        const attrs = originalAttrs[idx];
        img.src = attrs.src;
        if (attrs.srcset) img.setAttribute("srcset", attrs.srcset);
        else img.removeAttribute("srcset");

        if (attrs.srcSet) img.setAttribute("srcSet", attrs.srcSet);
        else img.removeAttribute("srcSet");

        if (attrs.loading) img.setAttribute("loading", attrs.loading);
        else img.removeAttribute("loading");

        img.style.opacity = attrs.opacity;
        img.style.visibility = attrs.visibility;
      });
    }
  }, [elementRef]);

  return capture;
};
