import type { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/',
          '/media/',
          '/static/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/cart',
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
    ],
  };
}
