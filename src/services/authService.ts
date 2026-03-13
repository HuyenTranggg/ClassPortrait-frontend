import api from './api';
import { AUTH_CONFIG } from '../config/constants';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<string> => {
    const response = await api.post<LoginResponse>('/auth/login', payload);
    const token = response.data?.access_token;

    if (!token) {
      throw new Error('Phản hồi đăng nhập không hợp lệ, thiếu access token.');
    }

    window.localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);

    return token;
  },

  logout: (): void => {
    window.localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
  },

  getToken: (): string | null => {
    return window.localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
  },

  isAuthenticated: (): boolean => {
    return Boolean(window.localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY));
  },
};

export default authService;