import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/baseQuery';

export interface CompanyApiResponse {
  company_name: string;
  legal_name?: string;
  city?: string;
  address: string;
  latitude?: string | number;
  longitude?: string | number;
  price_range?: string;
  serves_cuisine?: string;
  inn: string;
  ogrn: string;
  phone_number: string;
  email: string;
  telegram: string;
  max_messenger: string;
  vk?: string;
  vk_group?: string;
  reviews_url: string;
  rkn_registry_url?: string;
  rkn_registry_number?: string;
  working_hours?: string;
  postal_code?: string;
  country?: string;
  min_order_amount: string | number;
  free_delivery_threshold: string | number;
  delivery_cost: string | number;
  hero_image_top?: string;
  hero_image_top_mobile?: string;
  hero_image_bottom?: string;
  og_image?: string;
  updated_at?: string;
}

export interface CompanyInfo {
  companyName: string;
  legalName?: string;
  city?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  priceRange?: string;
  servesCuisine?: string | string[];
  inn: string;
  ogrn: string;
  phoneNumber: string;
  email: string;
  telegram: string;
  maxMessenger?: string;
  max: string;
  vk?: string;
  vkGroup?: string;
  reviewsUrl: string;
  rknRegistryUrl?: string;
  rknRegistryNumber?: string;
  workingHours?: string;
  postalCode?: string;
  country?: string;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
  deliveryCost: number;
  heroImageTop?: string;
  heroImageTopMobile?: string;
  heroImageBottom?: string;
  ogImage?: string;
}

export interface FooterNavItem {
  id: number;
  name: string;
  category_slug: string;
  order: number;
}

export interface PrivacyPolicyData {
  id: number;
  title: string;
  content_html: string;
  updated_at: string;
}

export interface LegalDocument {
  id: number;
  slug: string;
  title: string;
  content_html: string;
  order?: number;
  updated_at: string;
}

export const companyApi = createApi({
  reducerPath: 'companyApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getCompanyInfo: builder.query<CompanyInfo, void>({
      query: () => ({ url: 'company/' }),
      transformResponse: (response: CompanyApiResponse): CompanyInfo => {
        return {
          companyName: response.company_name,
          legalName: response.legal_name,
          city: response.city,
          address: response.address,
          latitude: response.latitude ? (typeof response.latitude === 'number' ? response.latitude : parseFloat(response.latitude)) : undefined,
          longitude: response.longitude ? (typeof response.longitude === 'number' ? response.longitude : parseFloat(response.longitude)) : undefined,
          priceRange: response.price_range,
          servesCuisine: response.serves_cuisine,
          inn: response.inn,
          ogrn: response.ogrn,
          phoneNumber: response.phone_number,
          email: response.email,
          telegram: response.telegram,
          max: response.max_messenger,
          maxMessenger: response.max_messenger,
          vk: response.vk,
          vkGroup: response.vk_group,
          reviewsUrl: response.reviews_url,
          rknRegistryUrl: response.rkn_registry_url,
          rknRegistryNumber: response.rkn_registry_number,
          workingHours: response.working_hours,
          postalCode: response.postal_code,
          country: response.country,
          minOrderAmount: parseFloat(String(response.min_order_amount)) || 5000,
          freeDeliveryThreshold: parseFloat(String(response.free_delivery_threshold)) || 10000,
          deliveryCost: parseFloat(String(response.delivery_cost)) || 1500,
          heroImageTop: response.hero_image_top,
          heroImageTopMobile: response.hero_image_top_mobile,
          heroImageBottom: response.hero_image_bottom,
          ogImage: response.og_image,
        };
      }
    }),
    getFooterNav: builder.query<FooterNavItem[], void>({
      query: () => ({ url: 'company/footer/' }),
    }),
    getPrivacyPolicy: builder.query<PrivacyPolicyData, void>({
      query: () => ({ url: 'company/privacy-policy/' }),
    }),
    getLegalDocument: builder.query<LegalDocument, string>({
      query: (slug) => ({ url: `company/documents/${slug}/` }),
    }),
    getLegalDocuments: builder.query<LegalDocument[], void>({
      query: () => ({ url: 'company/documents/' }),
    }),
  }),
});

export const {
  useGetCompanyInfoQuery,
  useGetFooterNavQuery,
  useGetPrivacyPolicyQuery,
  useGetLegalDocumentQuery,
  useGetLegalDocumentsQuery,
} = companyApi;


