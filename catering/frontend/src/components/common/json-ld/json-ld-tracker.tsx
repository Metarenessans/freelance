"use client";

import { useEffect } from "react";
import { ENABLE_DEBUG_JSON_FILE } from "./json-ld-config";

interface JsonLdTrackerProps {
  jsonLd: Record<string, any>;
}

export const JsonLdClientTracker = ({ jsonLd }: JsonLdTrackerProps) => {
  useEffect(() => {
    if (ENABLE_DEBUG_JSON_FILE && jsonLd) {
      fetch("/api/debug-jsonld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonLd),
      }).catch((err) => {
        console.error("Failed to send debug JSON-LD from client:", err);
      });
    }
  }, [jsonLd]);

  return null;
};
