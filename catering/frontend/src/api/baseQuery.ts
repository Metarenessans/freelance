import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { AxiosRequestConfig, AxiosError } from 'axios';
import axiosInstance from './axiosInstance';

export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
    },
    unknown,
    unknown
  > =>
  async ({ url, method = 'GET', data, params, headers }) => {
    // Sandbox opt-in permits only these two creation endpoints, never arbitrary writes.
    const sandboxPost = process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED === 'true'
      && String(method).toUpperCase() === 'POST'
      && ['orders/', 'menu-requests/'].includes(url);
    if ((process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' || process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED === 'true') && !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase()) && !sandboxPost) {
      return { error: { status: 'DEMO_READ_ONLY', data: { detail: 'Demo only: orders and quote requests are disabled.' } } };
    }
    try {
      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
