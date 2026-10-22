export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

/**
 * When enabled, write schema_markup_debug.json for local debugging.
 * Keep debug output disabled on public deployments.
 */
export const ENABLE_DEBUG_JSON_FILE =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ENABLE_DEBUG_JSON === "true";
