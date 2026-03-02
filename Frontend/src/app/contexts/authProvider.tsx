/**
 * Authentication Provider
 * Provides authentication state and methods throughout the app
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../types/auth';
import { AuthContext } from './auth.context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load user and token from localStorage on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useCallback((userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = useMemo(
    () => ({ user, token, login, logout, isAuthenticated }),
    [user, token, login, logout, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
