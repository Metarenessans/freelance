import { generateJsonLdForPath } from "./generate-json-ld-for-path";
import { invalidateCatalogDataCache } from "./server-catalog-cache";

interface CacheEntry {
  schema: Record<string, any>;
  timestamp: number;
}

// Global in-memory cache on the Next.js server instance
const globalForSchemaCache = globalThis as unknown as {
  schemaMemoryCache?: Map<string, CacheEntry>;
};

const cache =
  globalForSchemaCache.schemaMemoryCache || new Map<string, CacheEntry>();
if (!globalForSchemaCache.schemaMemoryCache) {
  globalForSchemaCache.schemaMemoryCache = cache;
}

/**
 * Read precomputed structured data from the server memory cache.
 * Map lookups have constant-time complexity.
 * If missing, generate the page schema once, cache it and return it.
 */
export async function getCachedJsonLd(
  pathname: string
): Promise<Record<string, any>> {
  const cleanPath =
    (pathname || "/").split("?")[0].split("#")[0].trim() || "/";
  const normalizedPath = cleanPath.startsWith("/")
    ? cleanPath
    : `/${cleanPath}`;

  const cached = cache.get(normalizedPath);
  let schema = cached?.schema;

  if (!schema) {
    // Generate on first access or after invalidation.
    schema = await generateJsonLdForPath(normalizedPath);
    cache.set(normalizedPath, {
      schema,
      timestamp: Date.now(),
    });
  }

  // Write the debug schema file only when explicitly enabled.
  try {
    const { isDebugJsonFileEnabled } = await import('./server-catalog-cache');
    if (await isDebugJsonFileEnabled()) {
      const fs = eval("require('fs')");
      const path = eval("require('path')");
      const filePath = path.join(process.cwd(), 'schema_markup_debug.json');
      fs.writeFileSync(filePath, JSON.stringify(schema, null, 2), 'utf-8');
    }
  } catch (err) {
    // ignore
  }

  return schema;
}

/**
 * Invalidate the cache following a Django webhook.
 * Company changes invalidate all pages because organization data is shared.
 * Product changes invalidate product and catalog schemas.
 */
export function invalidateSchemaCache(filter?: {
  type?: string;
  slug?: string;
}) {
  // 1. Clear catalog reference data.
  invalidateCatalogDataCache(filter);

  // 2. Clear computed Schema.org graphs.
  if (
    !filter ||
    !filter.type ||
    filter.type === "company" ||
    filter.type === "all"
  ) {
    const count = cache.size;
    cache.clear();
    return { cleared: "all", clearedCount: count, remaining: 0 };
  }

  if (filter.type === "product" && filter.slug) {
    cache.delete(`/product/${filter.slug}`);
    for (const key of Array.from(cache.keys())) {
      if (key.startsWith("/catalog/")) {
        cache.delete(key);
      }
    }
    return { cleared: filter.slug, remaining: cache.size };
  }

  if (filter.type === "section" && filter.slug) {
    cache.delete(`/catalog/${filter.slug}`);
    return { cleared: filter.slug, remaining: cache.size };
  }

  if (filter.type === "calculate") {
    cache.delete("/calculate");
    return { cleared: "calculate", remaining: cache.size };
  }

  if (filter.type === "category") {
    for (const key of Array.from(cache.keys())) {
      if (key.startsWith("/catalog/")) {
        cache.delete(key);
      }
    }
    return { cleared: "category_sections", remaining: cache.size };
  }

  if (filter.type === "blog") {
    cache.delete("/blog");
    if (filter.slug) {
      cache.delete(`/blog/${filter.slug}`);
    } else {
      for (const key of Array.from(cache.keys())) {
        if (key.startsWith("/blog/")) {
          cache.delete(key);
        }
      }
    }
    return { cleared: filter.slug || "all_blog", remaining: cache.size };
  }

  cache.clear();
  return { cleared: "all", remaining: 0 };
}
