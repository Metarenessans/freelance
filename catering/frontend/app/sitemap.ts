import type { MetadataRoute } from 'next';
import { getProductPopupSlug } from '@/utils/slugify';

export const dynamic = 'force-dynamic';

interface SystemSettingsResponse {
  sitemap_cache_minutes?: number;
}

interface ProductItem {
  id: string;
  slug?: string;
  name: string;
}

interface SectionItem {
  id: string;
  name: string;
}

const DEFAULT_FALLBACK_MINUTES = 60; // Standard fallback: retry after 60 minutes if the backend is unavailable.

async function getSitemapCacheMinutes(): Promise<number> {
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    const res = await fetch(`${apiUrl}/api/v1/system-settings/`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return DEFAULT_FALLBACK_MINUTES;
    const data: SystemSettingsResponse = await res.json();
    if (data.sitemap_cache_minutes !== undefined && data.sitemap_cache_minutes !== null) {
      return Number(data.sitemap_cache_minutes);
    }
    return DEFAULT_FALLBACK_MINUTES;
  } catch (e) {
    console.warn(`Sitemap settings unavailable, fallback to ${DEFAULT_FALLBACK_MINUTES}m cache:`, e);
    return DEFAULT_FALLBACK_MINUTES;
  }
}

async function fetchFromApi<T>(endpoint: string, revalidateSeconds: number): Promise<T[]> {
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    const fetchOptions: RequestInit = {
      signal: AbortSignal.timeout(6000),
      ...(revalidateSeconds > 0
        ? { next: { revalidate: revalidateSeconds } }
        : { cache: 'no-store' }),
    };

    const res = await fetch(`${apiUrl}/api/v1/${endpoint}`, fetchOptions);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error(`Failed to fetch ${endpoint} for sitemap:`, e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

  const cacheMinutes = await getSitemapCacheMinutes();
  const revalidateSeconds = cacheMinutes > 0 ? cacheMinutes * 60 : 0;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/calculate`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  const [sections, products, articles] = await Promise.all([
    fetchFromApi<SectionItem>('catalog/sections/', revalidateSeconds),
    fetchFromApi<ProductItem>('catalog/products/', revalidateSeconds),
    fetchFromApi<{ slug?: string; id?: string; updated_at?: string }>('blog/articles/', revalidateSeconds),
  ]);

  const sectionRoutes: MetadataRoute.Sitemap = sections
    .filter((s) => Boolean(s.id))
    .map((section) => ({
      url: `${baseUrl}/catalog/${section.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

  const seenUrls = new Set<string>();
  const productRoutes: MetadataRoute.Sitemap = [];

  for (const product of products) {
    if (!product || !product.name) continue;
    const slug = product.slug || getProductPopupSlug(product);
    const url = `${baseUrl}/product/${slug}`;
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      productRoutes.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  const articleRoutes: MetadataRoute.Sitemap = (articles || [])
    .map((a) => a.slug || a.id)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticRoutes, ...sectionRoutes, ...productRoutes, ...articleRoutes];
}
