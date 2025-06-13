import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";
import { Role } from "./roles";

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
  role: Role | null;
  created_at: string;
  updated_at: string;

  // Computed properties from backend
  is_admin?: boolean;
  role_level?: number;
  role_name?: string;
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

  // Create new user
  createUser: async (userData: {
    email: string;
    full_name: string;
    password: string;
    role_id: number;
    is_active: boolean;
    kyc_verified: boolean;
    subscription_type: string;
  }): Promise<User> => {
    const response = await fetchWithAuth(`${API_URL}/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create user");
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
    userData: Partial<User> & { password?: string }
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

  // Make user super admin (super admin only)
  makeSuperAdmin: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/${userId}/make-super-admin`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to make user super admin");
    }

    return response.json();
  },

  // Remove super admin privileges (super admin only)
  removeSuperAdmin: async (userId: number): Promise<User> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/${userId}/remove-super-admin`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "Failed to remove super admin privileges"
      );
    }

    return response.json();
  },

  // Assign role to user
  assignRole: async (userId: number, roleId: number | null): Promise<User> => {
    const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role_id: roleId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to assign role");
    }

    return response.json();
  },

  // Make user admin (assign admin role)
  makeAdmin: async (userId: number): Promise<User> => {
    // Get admin role ID (assuming level 50)
    const rolesResponse = await fetchWithAuth(`${API_URL}/roles/`);
    if (!rolesResponse.ok) {
      throw new Error("Failed to fetch roles");
    }
    const roles = await rolesResponse.json();
    const adminRole = roles.find((role: any) => role.level >= 50);

    if (!adminRole) {
      throw new Error("Admin role not found");
    }

    return UserApi.assignRole(userId, adminRole.id);
  },

  // Remove admin privileges (assign user role)
  removeAdmin: async (userId: number): Promise<User> => {
    // Get user role ID (assuming level < 50)
    const rolesResponse = await fetchWithAuth(`${API_URL}/roles/`);
    if (!rolesResponse.ok) {
      throw new Error("Failed to fetch roles");
    }
    const roles = await rolesResponse.json();
    const userRole = roles.find((role: any) => role.name === "user");

    if (!userRole) {
      throw new Error("User role not found");
    }

    return UserApi.assignRole(userId, userRole.id);
  },

  // Delete user
  deleteUser: async (userId: number): Promise<{ message: string }> => {
    const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete user");
    }

    return response.json();
  },
};
