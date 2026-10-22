import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/baseQuery';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    createOrder: builder.mutation<any, any>({
      query: (orderData) => ({
        url: 'orders/',
        method: 'POST',
        data: orderData,
      }),
    }),
  }),
});

export const { useCreateOrderMutation } = ordersApi;
