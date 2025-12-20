// frontend/src/services/api.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../config/constants';

/**
 * Axios instance với cấu hình mặc định
 */
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Có thể thêm token sau này
 */
api.interceptors.request.use(
  (config) => {
    // Có thể thêm authentication token ở đây sau này
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Xử lý lỗi tập trung
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Xử lý lỗi tập trung
    if (error.response) {
      // Server trả về lỗi
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('Network Error:', error.message);
    } else {
      // Lỗi khác
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
