"use client";

import { useState, useEffect } from "react";

/**
 * Hook to check if the viewport width is below a specific breakpoint.
 * Uses highly optimized native CSS media queries (matchMedia) instead of resize event listeners.
 */
export const useMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Use a media query so the browser efficiently tracks breakpoint changes.
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);
    
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Subscribe through the standard media query change event.
    mediaQuery.addEventListener("change", handler);
    
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [breakpoint]);

  return isMobile;
};
