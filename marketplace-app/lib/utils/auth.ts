import { API_URL } from "../config";

// Function to handle token storage
export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

// Function to handle user data storage
export const setUser = (user: any) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const removeUser = () => {
  localStorage.removeItem("user");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Check if user has KYC verified
export const isKycVerified = (): boolean => {
  const user = getUser();
  return user ? user.kyc_verified : false;
};

// Check subscription type
export const getSubscriptionType = (): string => {
  const user = getUser();
  return user ? user.subscription_type : "none";
};

// Login function
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Authentication failed");
  }

  const data = await response.json();
  setToken(data.access_token);
  setUser(data.user);
  return data;
};

// Logout function
export const logout = () => {
  removeToken();
  removeUser();
  // Redirect to login page if needed
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Fetch with authentication token
export const fetchWithAuth = (url: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// Refresh user data
export const refreshUserData = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL}/users/me`);
    if (!response.ok) {
      throw new Error("Failed to refresh user data");
    }

    const userData = await response.json();
    setUser(userData);
    return userData;
  } catch (error) {
    console.error("Error refreshing user data:", error);
    return null;
  }
};
