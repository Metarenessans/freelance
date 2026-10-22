"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "main_page_scroll_pos";
const FROM_MAIN_KEY = "from_main_page";

export const useMainScrollRestoration = () => {
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Remove the #catalog hash from the address bar if present.
    const cleanHashIfCatalog = () => {
      if (window.location.hash === "#catalog") {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", cleanUrl);
      }
    };
    cleanHashIfCatalog();
    window.addEventListener("popstate", cleanHashIfCatalog);
    window.addEventListener("hashchange", cleanHashIfCatalog);

    // 2. Mark the home page as active.
    sessionStorage.setItem(FROM_MAIN_KEY, "true");

    // 3. Restore the scroll position.
    const savedPos = sessionStorage.getItem(STORAGE_KEY);
    const targetY = savedPos ? parseInt(savedPos, 10) : 0;

    let cleanupListeners: (() => void) | null = null;

    if (targetY > 0) {
      isRestoringRef.current = true;

      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      // Try scrolling immediately.
      window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });

      // Next.js components and images may load asynchronously and increase page height.
      // Retry at short intervals until the document is tall enough for the saved position.
      let attempts = 0;
      const maxAttempts = 24; // 24 * 50ms = 1200ms

      const interval = setInterval(() => {
        attempts++;
        const currentY = window.scrollY;

        if (Math.abs(currentY - targetY) <= 10 || attempts >= maxAttempts) {
          window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });
          clearInterval(interval);
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        } else {
          window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });
        }
      }, 50);

      // Stop forced restoration when the user scrolls or swipes.
      const handleUserInteraction = () => {
        clearInterval(interval);
        isRestoringRef.current = false;
      };

      window.addEventListener("wheel", handleUserInteraction, { passive: true, once: true });
      window.addEventListener("touchstart", handleUserInteraction, { passive: true, once: true });

      cleanupListeners = () => {
        clearInterval(interval);
        window.removeEventListener("wheel", handleUserInteraction);
        window.removeEventListener("touchstart", handleUserInteraction);
      };
    }

    // 4. Track and save the scroll position as the user scrolls.
    let ticking = false;

    const handleScroll = () => {
      if (isRestoringRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!isRestoringRef.current) {
            const currentY = window.scrollY;
            sessionStorage.setItem(STORAGE_KEY, String(Math.round(currentY)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleSaveImmediate = () => {
      if (!isRestoringRef.current) {
        sessionStorage.setItem(STORAGE_KEY, String(Math.round(window.scrollY)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", handleSaveImmediate);
    window.addEventListener("beforeunload", handleSaveImmediate);

    return () => {
      handleSaveImmediate();
      if (cleanupListeners) cleanupListeners();
      window.removeEventListener("popstate", cleanHashIfCatalog);
      window.removeEventListener("hashchange", cleanHashIfCatalog);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", handleSaveImmediate);
      window.removeEventListener("beforeunload", handleSaveImmediate);
    };
  }, []);
};
