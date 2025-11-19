import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, LoginCredentials, RegisterData } from '../services/auth.service';
import { setLogoutCallback } from '../services/api';
import { logger } from '../utils/logger';

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
    setLogoutCallback(() => {
      handleLogout();
    });
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      const token = await authService.getStoredToken();

      if (storedUser && token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error: any) {
          if (error.response?.status !== 401) {
            logger.debug('Token validation failed', { status: error.response?.status });
          }
          await authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error: any) {
      if (!error.isSilent) {
        logger.error('Auth check error', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
    } catch (error: any) {
      if (error.response?.data?.error) {
        const apiError = new Error(error.response.data.error);
        (apiError as any).response = error.response;
        throw apiError;
      }
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    const response = await authService.googleLogin(idToken);
    setUser(response.user);
  };

  const logout = async () => {
    await handleLogout();
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

