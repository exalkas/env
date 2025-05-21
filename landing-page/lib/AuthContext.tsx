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
  signup as authSignup,
  isAuthenticated,
  getUserFromToken,
} from "./auth";
import { fetchUserData } from "./api";

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  kyc_verified: boolean;
  subscription_type: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to get complete user data from API
  const getUserData = async () => {
    try {
      const userData = await fetchUserData();
      setUser(userData);
    } catch (error) {
      // If API call fails, use the basic data from token
      const tokenUser = getUserFromToken();
      setUser(tokenUser);
    }
  };

  useEffect(() => {
    // Check if user is authenticated on mount
    const initializeAuth = async () => {
      if (isAuthenticated()) {
        try {
          // Try to get full user data from API
          await getUserData();
        } catch (error) {
          // If API call fails, use the basic data from token
          const tokenUser = getUserFromToken();
          setUser(tokenUser);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const refreshUserData = async () => {
    if (isAuthenticated()) {
      setLoading(true);
      await getUserData();
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const basicUser = await authLogin(email, password);
      if (basicUser) {
        // Get complete user data from API
        try {
          await getUserData();
        } catch (error) {
          // If API call fails, use the basic data from token
          setUser(basicUser);
        }
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const basicUser = await authSignup(email, password, fullName);
      if (basicUser) {
        // Get complete user data from API
        try {
          await getUserData();
        } catch (error) {
          // If API call fails, use the basic data from token
          setUser(basicUser);
        }
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
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
