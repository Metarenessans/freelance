"use client";

import { useState, useEffect, useRef, memo } from "react";
import classNames from "classnames";
import styles from "./image.module.scss";
import NextImage from "next/image";
import { toPublicMediaUrl } from "@/utils/seo";

// Session-wide cache of image URLs that have already loaded.
// Avoid flicker and repeated placeholders when scrolling or remounting components.
const loadedImageUrls = new Set<string>();

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  isLoading?: boolean;
  priority?: boolean;
}

export const Image = memo(({
  className,
  wrapperClassName,
  alt,
  src,
  width,
  height,
  onLoad,
  onError,
  isLoading,
  priority,
  ...props
}: ImageProps) => {
  // Normalize internal image URLs to the configured public site origin.
  const rawSrc = typeof src === "string" ? src : undefined;
  const normalizedSrc = rawSrc ? toPublicMediaUrl(rawSrc) : src;

  const hasSrc = typeof normalizedSrc === "string"
    ? normalizedSrc.trim() !== "" && normalizedSrc !== "null" && normalizedSrc !== "undefined"
    : !!normalizedSrc;

  const isAlreadyLoaded = typeof normalizedSrc === "string" && loadedImageUrls.has(normalizedSrc);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);
  const [isLoaded, setIsLoaded] = useState(Boolean(priority) || isAlreadyLoaded || !hasSrc);
  const [isInView, setIsInView] = useState(Boolean(priority) || isAlreadyLoaded);

  // Start loading 800 px before the image enters the viewport to support fast scrolling.
  useEffect(() => {
    if (priority || isInView) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const element = wrapperRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "800px 0px", // Preload 800 px before the viewport.
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // Reset isLoaded when src prop changes
  useEffect(() => {
    if (normalizedSrc !== currentSrc) {
      setCurrentSrc(normalizedSrc);
      const cached = typeof normalizedSrc === "string" && loadedImageUrls.has(normalizedSrc);
      setIsLoaded(Boolean(priority) || cached || !hasSrc);
      if (cached) {
        setIsInView(true);
      }
    }
  }, [normalizedSrc, priority, hasSrc, currentSrc]);

  // Catch cached images that load instantly before React attaches the onLoad listener
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && hasSrc && isInView) {
      if (typeof normalizedSrc === "string") {
        loadedImageUrls.add(normalizedSrc);
      }
      setIsLoaded(true);
      if (onLoad && imgRef.current) {
        onLoad({ target: imgRef.current } as any);
      }
    }
  }, [normalizedSrc, hasSrc, isInView, onLoad]);

  const showImage = hasSrc && !isLoading && isInView;

  return (
    <div
      ref={wrapperRef}
      className={classNames(styles.wrapper, wrapperClassName, {
        [styles.loaded]: isLoaded && !isLoading,
      })}
    >
      {showImage ? (
        <NextImage
          ref={imgRef as any}
          className={classNames(styles.image, className, {
            [styles.imageVisible]: isLoaded,
          })}
          alt={alt || "Catering Chef Meal Catering"}
          src={normalizedSrc as string}
          fill={true}
          priority={priority}
          loading={priority || isInView ? "eager" : "lazy"}
          decoding="async"
          unoptimized={true}
          onLoad={(e) => {
            if (typeof normalizedSrc === "string") {
              loadedImageUrls.add(normalizedSrc);
            }
            setIsLoaded(true);
            if (onLoad) onLoad(e);
          }}
          onError={(e) => {
            setIsLoaded(true);
            if (onError) onError(e);
          }}
          {...props}
        />
      ) : (
        !hasSrc && !isLoading && (
          <div className={styles.placeholder}>
            <svg viewBox="0 0 94 70" xmlns="http://www.w3.org/2000/svg" className={styles.placeholderSvg}>
              <path fillRule="evenodd" clipRule="evenodd" d="M.588 16.967V1.994C.588.893 1.483 0 2.588 0c1.104 0 2 .893 2 1.994V16.25h.01c-.008.587-.007 1.199-.006 1.834l.001.683c0 3.607 2.838 6.253 5.995 6.253s5.995-2.646 5.995-6.253v-.683c.001-.635.002-1.247-.005-1.834h.01V1.994c0-1.101.895-1.994 2-1.994 1.104 0 2 .893 2 1.994v14.973c0 .335-.001.665-.003.988l-.002.811c0 4.557-2.957 8.413-7.03 9.696.023.148.035.3.035.454v35.896a2.996 2.996 0 0 1-3 2.991c-1.657 0-3-1.339-3-2.991V28.916c0-.154.012-.306.034-.454C3.55 27.179.593 23.323.593 18.766l-.002-.811c-.002-.323-.003-.653-.003-.988ZM92.553.247a1.993 1.993 0 0 1 1.035 1.747v40.882c0 .151-.017.3-.05.446.032.178.05.363.05.55v20.94a2.996 2.996 0 0 1-3 2.991c-1.657 0-3-1.339-3-2.991V44.47c-2.817-.599-4.97-1.823-6.555-3.329-2.216-2.105-3.213-4.661-3.431-6.508a1.993 1.993 0 0 1-.014-.233V16.452c0-.19.027-.38.081-.562 1.122-3.805 3.555-7.187 6.019-9.821 2.474-2.647 5.108-4.675 6.832-5.76a2.005 2.005 0 0 1 2.033-.061ZM81.588 16.75v17.52c.144.992.755 2.607 2.205 3.984 1.188 1.128 3.015 2.169 5.795 2.51V5.965a35.108 35.108 0 0 0-2.975 2.823c-2.178 2.33-4.11 5.082-5.025 7.962Zm-57.233-6.614A35.102 35.102 0 0 1 46.075.36 35.293 35.293 0 0 1 69.09 6.664a35.132 35.132 0 0 1 4.682 3.94c.78.783.775 2.045-.01 2.819a2.013 2.013 0 0 1-2.836-.016 31.118 31.118 0 0 0-4.147-3.49 31.26 31.26 0 0 0-20.385-5.585 31.09 31.09 0 0 0-19.238 8.66 2.014 2.014 0 0 1-2.835-.038 1.984 1.984 0 0 1 .033-2.818Zm-4.062 41.6a2.014 2.014 0 0 1 2.782.55 31.149 31.149 0 0 0 17.043 12.458 31.237 31.237 0 0 0 21.095-1.243 30.908 30.908 0 0 0 15.389-14.368 2.008 2.008 0 0 1 2.694-.873 1.99 1.99 0 0 1 .883 2.68 34.897 34.897 0 0 1-17.375 16.222 35.269 35.269 0 0 1-23.816 1.404A35.168 35.168 0 0 1 19.745 54.5a1.984 1.984 0 0 1 .548-2.764Zm8.671-10.746c-3.02-11.166 3.617-22.629 14.824-25.603 11.208-2.975 22.742 3.665 25.763 14.83 3.02 11.166-3.617 22.629-14.825 25.603-11.207 2.975-22.742-3.665-25.762-14.83Zm13.783-29.454c-13.343 3.541-21.244 17.187-17.648 30.48 3.595 13.292 17.326 21.196 30.67 17.655 13.342-3.541 21.243-17.187 17.647-30.48C69.82 15.9 56.09 7.996 42.746 11.537ZM37.62 38.308c-1.726-6.38 2.067-12.93 8.471-14.63a1.986 1.986 0 0 0 1.412-2.439 2.009 2.009 0 0 0-2.453-1.412c-8.54 2.266-13.597 11-11.295 19.507a2.009 2.009 0 0 0 2.453 1.412 1.986 1.986 0 0 0 1.412-2.438ZM10.588 18.945c-1.105 0-2-.893-2-1.994V1.994c0-1.101.895-1.994 2-1.994s2 .893 2 1.994v14.957a1.997 1.997 0 0 1-2 1.994Z" />
            </svg>
          </div>
        )
      )}
      {hasSrc && !priority && (
        <noscript>
          <img
            src={normalizedSrc as string}
            alt={alt || "Catering Chef Meal Catering"}
            className={classNames(styles.image, styles.imageVisible, className)}
            loading="lazy"
          />
        </noscript>
      )}
    </div>
  );
});

Image.displayName = "Image";
