import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/baseQuery';

export interface Section {
  id: string;
  name: string;
  imageUrl?: string;
  categories?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seo_title?: string;
  seo_description?: string;
}

export interface Category {
  id: string;
  name: string;
  sectionId?: string | null;
  sectionIds?: string[];
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  minOrderQuantity?: number | null;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string;
  imageUrl: string;
  name: string;
  extraInfo: { amount: number; unit: string }[];
  priceInfo: { oldPrice?: number; price: number };
  description?: string;
  options?: ProductOption[];
  minOrderQuantity?: number | null;
}

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: axiosBaseQuery(),
  // Refetch when the network connection is restored.
  refetchOnReconnect: true,
  // Keep cached data for five minutes after the component unmounts.
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
    getSections: builder.query<Section[], void>({
      query: () => ({ url: 'catalog/sections/' }),
    }),
    getCategories: builder.query<Category[], void>({
      query: () => ({ url: 'catalog/categories/' }),
    }),
    getProducts: builder.query<Product[], { category?: string; section?: string; is_featured?: boolean }>({
      query: (params) => ({
        url: 'catalog/products/',
        params,
      }),
    }),
  }),
});

export const { useGetSectionsQuery, useGetCategoriesQuery, useGetProductsQuery } = catalogApi;
