"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export const useScrollDirection = (customEnabled?: boolean) => {
  const pathname = usePathname();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Hide the header on downward scroll only inside /catalog/[slug].
  const isCatalogSection =
    typeof customEnabled === "boolean"
      ? customEnabled
      : Boolean(pathname && /^\/catalog\/[^/]+/.test(pathname));

  useEffect(() => {
    // On other pages, keep the header fixed at the top.
    if (!isCatalogSection) {
      setIsHeaderVisible(true);
      document.documentElement.removeAttribute("data-header-hidden");
      return;
    }

    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      // Always show header at or near top of the page
      if (scrollY <= 60) {
        setIsHeaderVisible(true);
        document.documentElement.removeAttribute("data-header-hidden");
        lastScrollY = Math.max(0, scrollY);
        ticking = false;
        return;
      }

      const diff = scrollY - lastScrollY;

      // Threshold to avoid micro-jitters
      if (Math.abs(diff) > 8) {
        if (diff > 0 && scrollY > 80) {
          // Scrolling down -> hide header
          setIsHeaderVisible(false);
          document.documentElement.setAttribute("data-header-hidden", "true");
        } else if (diff < 0) {
          // Scrolling up -> show header
          setIsHeaderVisible(true);
          document.documentElement.removeAttribute("data-header-hidden");
        }
        lastScrollY = scrollY;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeAttribute("data-header-hidden");
    };
  }, [isCatalogSection]);

  return isCatalogSection ? isHeaderVisible : true;
};
