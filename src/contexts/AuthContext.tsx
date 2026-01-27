/**
 * Authentication Context for Microservices
 * Manages JWT tokens and user state
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'WASHER';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'lava_auto_token';
const USER_KEY = 'lava_auto_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      authApi.getMe(token)
        .then((userData) => {
          setUser(userData as User);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
        })
        .catch(() => {
          // Token is invalid, clear everything
          logout();
        });
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    
    setToken(response.token);
    setUser(response.user as User);
    
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; phone?: string; role?: string }) => {
    const response = await authApi.register(data);
    
    setToken(response.token);
    setUser(response.user as User);
    
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) {
      const userData = await authApi.getMe(token);
      setUser(userData as User);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get token for API calls
export function useToken() {
  const { token } = useAuth();
  return token;
}
