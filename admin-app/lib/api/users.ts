import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  kyc_verified: boolean;
  subscription_type: string;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

// User API Service
export const UserApi = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    const response = await fetchWithAuth(`${API_URL}/users/`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  },

  // Get user by ID
  getUser: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(`${API_URL}/users/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }
    return response.json();
  },

  // Update user
  updateUser: async (
    userId: number,
    userData: Partial<User>
  ): Promise<User> => {
    const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update user");
    }

    return response.json();
  },

  // Verify user KYC
  verifyKyc: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/${userId}/verify-kyc`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to verify KYC");
    }

    return response.json();
  },

  // Deactivate user
  deactivateUser: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/${userId}/deactivate`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to deactivate user");
    }

    return response.json();
  },

  // Activate user
  activateUser: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/${userId}/activate`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to activate user");
    }

    return response.json();
  },

  // Make user admin
  makeAdmin: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/${userId}/make-admin`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to make user admin");
    }

    return response.json();
  },

  // Remove admin privileges
  removeAdmin: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/${userId}/remove-admin`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to remove admin privileges");
    }

    return response.json();
  },
};
