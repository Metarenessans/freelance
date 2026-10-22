"use client";

import { useEffect } from "react";

let lockCount = 0;

/**
 * Hook to lock body scroll when a modal or overlay is open.
 * Supports multiple nested locks using a global counter.
 * Also handles scrollbar width compensation.
 */
export const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Measure the scrollbar width and lock scrolling only for the first open modal.
    // When opening a nested modal, the scrollbar is already hidden.
    // Measuring again with the lock-scroll class applied returns zero.
    // Reusing the first measurement prevents a layout shift.
    if (lockCount === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
      document.documentElement.classList.add("lock-scroll");
    }

    lockCount++;

    return () => {
      lockCount--;

      // Unlock scrolling only after the last active modal closes.
      if (lockCount <= 0) {
        document.documentElement.classList.remove("lock-scroll");
        document.documentElement.style.removeProperty("--scrollbar-width");
        lockCount = 0;
      }
    };
  }, [isOpen]);
};
