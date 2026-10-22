import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/baseQuery';
import { ProductData } from '@/components/blocks/catalog/product/product';

export interface EventFormat {
  id: string;
  name: string;
  order: number;
}

export interface AdditionalService {
  id: string;
  label: string;
  description: string;
  linked_product: ProductData | null;
  order: number;
}

export const menuRequestsApi = createApi({
  reducerPath: 'menuRequestsApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    createMenuRequest: builder.mutation<any, any>({
      query: (requestData) => ({
        url: 'menu-requests/',
        method: 'POST',
        data: requestData,
      }),
    }),
    getEventFormats: builder.query<EventFormat[], void>({
      query: () => ({ url: 'menu-requests/formats/' }),
    }),
    getAdditionalServices: builder.query<AdditionalService[], void>({
      query: () => ({ url: 'menu-requests/services/' }),
    }),
    getCalculateSettings: builder.query<any, void>({
      query: () => ({ url: 'menu-requests/calculate-settings/' }),
    }),
  }),
});

export const { 
  useCreateMenuRequestMutation, 
  useGetEventFormatsQuery, 
  useGetAdditionalServicesQuery,
  useGetCalculateSettingsQuery
} = menuRequestsApi;
