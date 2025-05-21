import { API_URL } from "../config";

// Define user interface
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
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
  return user ? user.is_admin : false;
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

  // Check if user is admin
  if (!data.user.is_admin) {
    throw new Error("Access denied. Admin privileges required.");
  }

  setToken(data.access_token);
  setUser(data.user);
  return data;
};

// Logout function
export const logout = () => {
  removeToken();
  removeUser();
  // Redirect to login page
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

    // Check if user is admin
    if (!userData.is_admin) {
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
