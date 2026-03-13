// src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => authService.isAuthenticated()
  );

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    await authService.login(credentials);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
  }, []);

  // Lắng nghe 401 từ axios interceptor — xử lý tại đây thay vì App
  useEffect(() => {
    const handleUnauthorized = () => {
      authService.logout();
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return ctx;
}
