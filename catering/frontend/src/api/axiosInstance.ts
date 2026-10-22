import axios from 'axios';

const isDev = process.env.NODE_ENV === 'development';

const axiosInstance = axios.create({
  baseURL: '/api/v1/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request and response interceptors.
axiosInstance.interceptors.request.use(
  (config) => {
    // An authorization token can be added here if authentication is introduced.
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Response bodies and request objects may contain contact details. Never log them.
    return Promise.reject(error);
  }
);

export default axiosInstance;
