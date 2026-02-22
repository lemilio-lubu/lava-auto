'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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
const USER_KEY  = 'lava_auto_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tracks whether the current token was just set by login/register
  // (needs verification) vs loaded from storage (already trusted).
  const needsVerify = useRef(false);

  /**
   * Single initialization effect.
   * - Reads localStorage once.
   * - If both token AND user exist in storage → restore them immediately,
   *   mark as NOT needing verification (skip the getMe round-trip).
   * - If token exists but user is missing → verify with getMe.
   * - Either way, isLoading becomes false as soon as we know the answer.
   */
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser  = localStorage.getItem(USER_KEY);

    if (!storedToken) {
      // No session at all — done immediately
      setIsLoading(false);
      return;
    }

    if (storedUser) {
      // We have a cached user — restore directly, no network call needed.
      // The token will be re-verified lazily on the next mutation.
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
      return;
    }

    // Token exists but user cache is missing — verify once.
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

  /**
   * Verification effect — only runs when login/register explicitly
   * flag a fresh token via needsVerify.current.
   * This does NOT run on every token change (avoids the waterfall).
   */
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

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    needsVerify.current = false; // login already returns trusted user data
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
