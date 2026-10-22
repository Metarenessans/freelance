import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { catalogApi } from '@/store/services/catalogApi';
import { ordersApi } from '@/store/services/ordersApi';
import { menuRequestsApi } from '@/store/services/menuRequestsApi';
import { faqApi } from '@/store/services/faqApi';
import { companyApi } from '@/store/services/companyApi';
import { blogApi } from '@/store/services/blogApi';

export const store = configureStore({
  reducer: {
    [catalogApi.reducerPath]: catalogApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [menuRequestsApi.reducerPath]: menuRequestsApi.reducer,
    [faqApi.reducerPath]: faqApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [blogApi.reducerPath]: blogApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      catalogApi.middleware,
      ordersApi.middleware,
      menuRequestsApi.middleware,
      faqApi.middleware,
      companyApi.middleware,
      blogApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
