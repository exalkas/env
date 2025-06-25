"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  login as authLogin,
  logout as authLogout,
  isAuthenticated,
  getUserFromToken,
} from "./auth";
import { fetchUserData, fetchKYCStatus } from "./api";
import { reconnectWithAuth } from "./socket";

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  kyc_verified: boolean;
  subscription_type: string;
}

interface KYCStatus {
  status: string;
  kyc_level: string;
  submitted_at?: string;
  rejection_reason?: string;
  documents_count: number;
  can_submit: boolean;
  required_documents: string[];
  next_steps: string[];
}

interface AuthContextType {
  user: User | null;
  kycStatus: KYCStatus | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch complete user data from API
  const getUserData = async () => {
    try {
      const userData = await fetchUserData();
      setUser(userData);

      // Also fetch KYC status
      try {
        const kycData = await fetchKYCStatus();
        setKycStatus(kycData);
      } catch (kycError) {
        console.error("Error fetching KYC status:", kycError);
        setKycStatus(null);
      }

      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fall back to basic user data from token
      const tokenUser = getUserFromToken();
      setUser(tokenUser);
      setKycStatus(null);
      return tokenUser;
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        if (isAuthenticated()) {
          await getUserData();
        }
      } catch (err) {
        setError("Failed to authenticate user");
        console.error("Authentication error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const basicUser = await authLogin(email, password);

      if (basicUser) {
        // Get full user data
        await getUserData();
        // Reconnect socket with new authentication
        reconnectWithAuth();
        return true;
      }

      setError("Invalid email or password");
      return false;
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authLogout();
    setUser(null);
    setKycStatus(null);
    // Reconnect socket without authentication
    reconnectWithAuth();
  };

  // Refresh user data
  const refreshUserData = async () => {
    setLoading(true);
    try {
      await getUserData();
    } catch (err) {
      console.error("Error refreshing user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    kycStatus,
    loading,
    error,
    login,
    logout,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
