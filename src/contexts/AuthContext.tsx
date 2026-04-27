'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
  phone?: string;
  mustChangePassword?: boolean;
  totpEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requires2FA: boolean;
  pendingCredentials: { email: string; password: string } | null;
  login: (email: string, password: string, totpToken?: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'lava_auto_token';
const USER_KEY  = 'lava_auto_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  const needsVerify = useRef(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser  = localStorage.getItem(USER_KEY);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    if (storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
      return;
    }

    authApi.getMe(storedToken)
      .then((userData) => {
        setToken(storedToken);
        setUser(userData as User);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!token || !needsVerify.current) return;
    needsVerify.current = false;

    authApi.getMe(token)
      .then((userData) => {
        setUser(userData as User);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      })
      .catch(() => logout());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email: string, password: string, totpToken?: string) => {
    const response = await authApi.login(email, password, totpToken);

    if ('requires2FA' in response) {
      setRequires2FA(true);
      setPendingCredentials({ email, password });
      return;
    }

    setRequires2FA(false);
    setPendingCredentials(null);
    needsVerify.current = false;
    setToken(response.token);
    setUser(response.user as User);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; phone?: string; role?: string }) => {
    const response = await authApi.register(data);
    needsVerify.current = false;
    setToken(response.token);
    setUser(response.user as User);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRequires2FA(false);
    setPendingCredentials(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const userData = await authApi.getMe(token);
    setUser(userData as User);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    requires2FA,
    pendingCredentials,
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

export function useToken() {
  const { token } = useAuth();
  return token;
}
