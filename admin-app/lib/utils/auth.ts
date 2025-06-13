import { API_URL } from "../config";

// Define user interface to match backend
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_super_admin: boolean;
  kyc_verified: boolean;
  subscription_type: string;
  subscription_end_date: string | null;
  role_id: number | null;
  role: {
    id: number;
    name: string;
    display_name: string;
    level: number;
  } | null;
  created_at: string;
  updated_at: string;

  // Computed properties from backend
  is_admin?: boolean;
  role_level?: number;
  role_name?: string;
}

// Function to handle token storage
export const setToken = (token: string) => {
  localStorage.setItem("admin_token", token);
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_token");
  }
  return null;
};

export const removeToken = () => {
  localStorage.removeItem("admin_token");
};

// Function to handle user data storage
export const setUser = (user: User) => {
  localStorage.setItem("admin_user", JSON.stringify(user));
};

export const getUser = (): User | null => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("admin_user");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const removeUser = () => {
  localStorage.removeItem("admin_user");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Check if user is admin
export const isAdmin = (): boolean => {
  const user = getUser();
  return user ? user.is_admin || user.is_super_admin || false : false;
};

// Login function
export const login = async (email: string, password: string): Promise<void> => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Login failed");
  }

  const data = await response.json();

  // Store token using consistent key
  setToken(data.access_token);

  // Store user info if provided
  if (data.user) {
    setUser(data.user);
  }
};

// Logout function
export const logout = (showSessionExpiredMessage = false) => {
  removeToken();
  removeUser();

  // Also clear any legacy storage keys
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }

  // Show session expired message if needed
  if (showSessionExpiredMessage && typeof window !== "undefined") {
    // Store a message in sessionStorage to show on the login page
    sessionStorage.setItem(
      "auth_message",
      "Your session has expired. Please log in again."
    );
  }

  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Fetch with authentication token
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check for 401 Unauthorized response (expired/invalid token)
  if (response.status === 401) {
    console.log("Token expired or invalid, logging out user");
    logout(true); // Show session expired message
    throw new Error("Session expired. Please log in again.");
  }

  return response;
};

// Refresh user data
export const refreshUserData = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL}/users/me`);
    if (!response.ok) {
      throw new Error("Failed to refresh user data");
    }

    const userData = await response.json();

    // Check if user is admin
    if (!userData.is_admin && !userData.is_super_admin) {
      logout();
      throw new Error("Access denied. Admin privileges required.");
    }

    setUser(userData);
    return userData;
  } catch (error) {
    console.error("Error refreshing user data:", error);
    logout();
    return null;
  }
};
