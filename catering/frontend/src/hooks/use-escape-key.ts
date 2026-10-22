"use client";

import { useEffect, useRef } from "react";

// Global stack to track active Escape key handlers.
// The topmost (last active) handler will be the only one executed on Escape keydown.
const escapeHandlers: (() => void)[] = [];

const globalKeyDownHandler = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    const topmostHandler = escapeHandlers[escapeHandlers.length - 1];
    if (topmostHandler) {
      topmostHandler();
    }
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("keydown", globalKeyDownHandler);
}

/**
 * Hook to handle Escape keydown to close modals/popups.
 * Safe for nested/stacked modals as it uses a global stack to only close the topmost active element.
 * 
 * @param onClose Callback to run when Escape is pressed
 * @param isOpen Condition whether the listener is active
 */
export const useEscapeKey = (onClose: () => void, isOpen: boolean) => {
  const onCloseRef = useRef(onClose);

  // Keep the ref updated with the latest onClose function
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Define a stable handler wrapper that executes the current onClose ref.
    // This handler identity is stable throughout the lifetime of the active state,
    // which prevents the element from losing its position in the stack on re-render.
    const stableHandler = () => {
      onCloseRef.current();
    };

    escapeHandlers.push(stableHandler);

    return () => {
      const index = escapeHandlers.indexOf(stableHandler);
      if (index !== -1) {
        escapeHandlers.splice(index, 1);
      }
    };
  }, [isOpen]);
};
