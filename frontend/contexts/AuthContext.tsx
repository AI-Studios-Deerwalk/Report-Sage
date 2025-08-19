"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { tokenStorage, type TokenData } from '@/lib/jwt';

// Types
interface User {
  uid: string;
  email: string;
  fname: string;
  lname: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    fname: string;
    lname: string;
    phone_number?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have stored authentication data
        if (tokenStorage.isAuthenticated()) {
          const storedToken = tokenStorage.getToken();
          const storedUser = tokenStorage.getUserData();

          if (storedToken && storedUser) {
            // Set auth state immediately from stored data
            setToken(storedToken);
            setUser(storedUser);
            
            // Try to verify token is still valid by fetching current user
            // But don't clear auth state if this fails (could be network issues)
            try {
              const response = await authAPI.getCurrentUser();
              setUser(response.data);
              
              // Update stored user data with fresh data
              tokenStorage.setToken({
                access_token: storedToken,
                token_type: 'bearer',
                expires_in: 86400, // Will be updated on next login
                user: response.data
              });
            } catch (error) {
              console.warn('Token validation failed during initialization (using cached data):', error);
              // Don't clear auth state on API failure - could be temporary network issues
              // The user remains logged in with cached data
              // If token is truly invalid, the API interceptor will handle logout
            }
          }
        } else {
          // No valid token found, clear any stale data
          tokenStorage.clearToken();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Only clear tokens if there's a critical error, not just API failures
        if (!tokenStorage.getToken()) {
          tokenStorage.clearToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const tokenData: TokenData = response.data;

      // Store auth data using JWT utilities
      tokenStorage.setToken(tokenData);
      
      setToken(tokenData.access_token);
      setUser(tokenData.user);
      
      console.log('✅ Login successful for user:', tokenData.user.email);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    fname: string;
    lname: string;
    phone_number?: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      const tokenData: TokenData = response.data;

      // Store auth data using JWT utilities
      tokenStorage.setToken(tokenData);
      
      setToken(tokenData.access_token);
      setUser(tokenData.user);
      
      console.log('✅ Registration successful for user:', tokenData.user.email);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    try {
      // Call logout endpoint (optional since JWT is stateless)
      authAPI.logout().catch(console.error);
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Clear local state and storage using JWT utilities
    tokenStorage.clearToken();
    setToken(null);
    setUser(null);
    
    console.log('👋 User logged out successfully');
  };

  const refreshUser = async () => {
    try {
      if (tokenStorage.isAuthenticated()) {
        const response = await authAPI.getCurrentUser();
        const userData = response.data;
        
        // Update stored user data
        const currentToken = tokenStorage.getToken();
        if (currentToken) {
          tokenStorage.setToken({
            access_token: currentToken,
            token_type: 'bearer',
            expires_in: 86400, // Will be updated on next login
            user: userData
          });
        }
        
        setUser(userData);
        console.log('🔄 User data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, logout user
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
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
};
