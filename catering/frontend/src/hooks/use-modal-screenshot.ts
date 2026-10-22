import { useCallback } from "react";
import { toast } from "react-hot-toast";

interface UseModalScreenshotOptions {
  filename?: string | (() => string);
  scale?: number;
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

export const useModalScreenshot = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: UseModalScreenshotOptions = {}
) => {
  const { filename, scale = 2 } = options;

  const capture = useCallback(async () => {
    const element = elementRef.current;
    if (!element) {
      console.warn("Modal screenshot capture failed: element is null");
      return;
    }

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
      const elementRect = element.getBoundingClientRect();
      const clientWidth = Math.ceil(
        elementRect.width || element.offsetWidth || element.clientWidth
      );

      let targetHeight = Math.ceil(
        elementRect.height || element.offsetHeight || element.clientHeight
      );

      // Dynamically measure where the add button ends to ensure generous room below it
      const addBtn = element.querySelector<HTMLElement>('button[class*="addBtn"]');
      if (addBtn) {
        const btnRect = addBtn.getBoundingClientRect();
        // Distance from top of modal element to bottom of button + 32px bottom breathing room
        const btnBottom = Math.ceil(btnRect.bottom - elementRect.top + 32);
        if (btnBottom > targetHeight) {
          targetHeight = btnBottom;
        }
      }

      // Also ensure innerModal is fully encompassed
      const innerModal = element.querySelector<HTMLElement>('[class*="innerModal"]');
      if (innerModal) {
        const innerRect = innerModal.getBoundingClientRect();
        const innerBottom = Math.ceil(innerRect.bottom - elementRect.top + 24);
        if (innerBottom > targetHeight) {
          targetHeight = innerBottom;
        }
      }

      const { toBlob } = await import("html-to-image");
      // Leaving backgroundColor undefined ensures transparent background around rounded corners
      const blob = await toBlob(element, {
        pixelRatio: scale,
        skipFonts: true,
        width: clientWidth,
        height: targetHeight,
        style: {
          width: `${clientWidth}px`,
          height: `${targetHeight}px`,
          minHeight: `${targetHeight}px`,
          maxHeight: "none",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "none",
          margin: "0",
          transform: "none",
          position: "relative",
          top: "0",
          left: "0",
          bottom: "auto",
          right: "auto",
        },
        filter: (node: Node) => {
          // Filter out mobile sheet drag handle bar so the card top starts cleanly
          if (node instanceof HTMLElement) {
            if (
              node.className &&
              typeof node.className === "string" &&
              node.className.includes("dragHandle")
            ) {
              return false;
            }
          }
          return true;
        },
      });

      if (!blob) {
        toast.error("Could not generate the image", { id: toastId });
        return;
      }

      // Download the screenshot PNG file with sanitized name
      const rawName =
        typeof filename === "function" ? filename() : filename || "product-modal";
      const cleanName = rawName
        .replace(/[\\/:*?"<>|]+/g, "")
        .replace(/[^\p{L}\p{N}\s.,_-]/gu, "")
        .trim()
        .slice(0, 80);
      const downloadName = cleanName
        ? (cleanName.endsWith(".png") ? cleanName : `${cleanName}.png`)
        : "product-modal.png";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Product screenshot saved!", { id: toastId });
    } catch (err) {
      console.error("Modal screenshot capture failed with html-to-image:", err);
      toast.error(
        `Could not capture the screenshot: ${err instanceof Error ? err.message : String(err)}`,
        { id: toastId }
      );
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
  }, [elementRef, filename, scale]);

  return capture;
};