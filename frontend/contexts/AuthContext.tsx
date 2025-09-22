"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useUser, useClerk } from "@clerk/nextjs";

// Types
interface User {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
    id: string;
  }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  hasVerifiedEmailAddress: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  openSignIn: () => void;
  openSignUp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { signOut, openSignIn, openSignUp } = useClerk();

  const isLoading = !isLoaded;
  const isAuthenticated = !!user;

  // Transform Clerk user to our User interface
  const transformedUser: User | null = user ? {
    id: user.id,
    emailAddresses: user.emailAddresses,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    hasVerifiedEmailAddress: user.hasVerifiedEmailAddress,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } : null;

  const logout = async () => {
    try {
      await signOut();
      console.log("👋 User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    user: transformedUser,
    isLoading,
    isAuthenticated,
    logout,
    openSignIn,
    openSignUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
