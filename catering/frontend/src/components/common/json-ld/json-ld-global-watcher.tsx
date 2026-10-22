"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ENABLE_DEBUG_JSON_FILE } from "./json-ld-config";

export const JsonLdGlobalWatcher = () => {
  if (process.env.NODE_ENV === "production" || !ENABLE_DEBUG_JSON_FILE) {
    return null;
  }

  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string>("");

  const trackPath = (path: string) => {
    if (!path) return;
    if (lastTrackedPathRef.current === path) return;
    lastTrackedPathRef.current = path;

    const execute = () => {
      fetch(`/api/debug-jsonld?path=${encodeURIComponent(path)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.jsonLd) {
            // Update the dynamic <script type="application/ld+json"> tag in DOM for live inspection
            let scriptEl = document.getElementById("dynamic-jsonld") as HTMLScriptElement | null;
            if (!scriptEl) {
              scriptEl = document.createElement("script");
              scriptEl.type = "application/ld+json";
              scriptEl.id = "dynamic-jsonld";
              document.head.appendChild(scriptEl);
            }
            scriptEl.textContent = JSON.stringify(data.jsonLd);
          }
        })
        .catch((err) => {
          console.warn("Failed to auto-generate debug JSON-LD:", err);
        });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(execute);
    } else {
      setTimeout(execute, 100);
    }
  };

  // 1. Next.js router transitions (usePathname)
  useEffect(() => {
    if (typeof window !== "undefined") {
      trackPath(window.location.pathname);
    }
  }, [pathname]);

  // 2. Intercept window.history.pushState and replaceState (which modals and SPA routing use!), plus popstate
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      trackPath(window.location.pathname);
    };

    // Monkey-patch history.pushState & replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handleLocationChange();
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handleLocationChange();
      return result;
    };

    window.addEventListener("popstate", handleLocationChange);

    // Initial check on mount
    handleLocationChange();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  return null;
};
