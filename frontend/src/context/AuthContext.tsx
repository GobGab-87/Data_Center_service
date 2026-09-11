import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; password: string; fullName: string; department?: string }) => Promise<string>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('dc_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('dc_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('dc_user');
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await authApi.login(credentials);
    const { token: newToken, user: loggedUser } = res.data;
    setToken(newToken);
    setUser(loggedUser);
    localStorage.setItem('dc_token', newToken);
    localStorage.setItem('dc_user', JSON.stringify(loggedUser));
  };

  const register = async (data: { username: string; password: string; fullName: string; department?: string }) => {
    const res = await authApi.register(data);
    return res.data.message;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
      localStorage.setItem('dc_user', JSON.stringify(res.data.user));
    } catch (e) {
      console.error('Refresh profile failed', e);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
