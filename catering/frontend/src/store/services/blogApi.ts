import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/baseQuery';
import type { Product } from './catalogApi';
import { toPublicMediaUrl } from '@/utils/seo';

export interface BlogArticleBlock {
  id: string;
  image: string | null;
  image_height_unlimited?: boolean;
  image_alt?: string | null;
  image_source_link?: string | null;
  text: string;
  order: number;
}

export interface SimpleBlogArticle {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  is_cover_like_block_image?: boolean;
  cover_alt?: string | null;
  cover_source_link?: string | null;
  created_date: string;
  created_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface BlogArticle extends SimpleBlogArticle {
  updated_at?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  blocks: BlogArticleBlock[];
  products: Product[];
  related_articles: SimpleBlogArticle[];
}

const getBackendInternalUrl = (): string => {
  const rawUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';
  return rawUrl.replace(/\/+$/, '');
};

export async function getArticles(): Promise<SimpleBlogArticle[]> {
  try {
    const baseUrl = getBackendInternalUrl();
    const url = `${baseUrl}/api/v1/blog/articles/`;
    const res = await fetch(url, {
      next: { revalidate: 3600, tags: ['blog'] },
      headers: {
      },
    });
    if (!res.ok) {
      console.error(`[getArticles] Failed to fetch articles from ${url}, status: ${res.status}`);
      return [];
    }
    const data: SimpleBlogArticle[] = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((a) => ({
      ...a,
      cover: toPublicMediaUrl(a.cover),
    }));
  } catch (err) {
    console.error('[getArticles] Error fetching articles:', err);
    return [];
  }
}

export async function getArticle(slug: string): Promise<BlogArticle | null> {
  try {
    const baseUrl = getBackendInternalUrl();
    const url = `${baseUrl}/api/v1/blog/articles/${slug}/`;
    const res = await fetch(url, {
      next: { revalidate: 3600, tags: ['blog', `blog-${slug}`] },
      headers: {
      },
    });
    if (!res.ok) {
      console.error(`[getArticle] Failed to fetch article ${slug} from ${url}, status: ${res.status}`);
      return null;
    }
    const data: BlogArticle = await res.json();
    return {
      ...data,
      cover: toPublicMediaUrl(data.cover),
      blocks: Array.isArray(data.blocks)
        ? data.blocks.map((b) => ({
            ...b,
            image: toPublicMediaUrl(b.image),
          }))
        : [],
      related_articles: Array.isArray(data.related_articles)
        ? data.related_articles.map((ra) => ({
            ...ra,
            cover: toPublicMediaUrl(ra.cover),
          }))
        : [],
    };
  } catch (err) {
    console.error(`Error fetching article ${slug}:`, err);
    return null;
  }
}

export const blogApi = createApi({
  reducerPath: 'blogApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getArticles: builder.query<SimpleBlogArticle[], void>({
      query: () => ({ url: 'blog/articles/' }),
    }),
    getArticleBySlug: builder.query<BlogArticle, string>({
      query: (slug) => ({ url: `blog/articles/${slug}/` }),
    }),
  }),
});

export const { useGetArticlesQuery, useGetArticleBySlugQuery } = blogApi;
