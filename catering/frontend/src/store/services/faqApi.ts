import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/baseQuery';

export interface FaqItem {
  question: string;
  answerItems: string[];
}


export const faqApi = createApi({
  reducerPath: 'faqApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getFaq: builder.query<FaqItem[], void>({
      query: () => ({ url: 'faq/' }),
    }),
  }),
});

export const { useGetFaqQuery } = faqApi;
