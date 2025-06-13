import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface RoleCreateData {
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_active?: boolean;
}

export interface RoleUpdateData {
  name?: string;
  display_name?: string;
  description?: string;
  level?: number;
  is_active?: boolean;
}

// Role API Service
export const RoleApi = {
  // Get all roles (super admin only)
  getRoles: async (): Promise<Role[]> => {
    const response = await fetchWithAuth(`${API_URL}/roles/`);
    if (!response.ok) {
      throw new Error("Failed to fetch roles");
    }
    return response.json();
  },

  // Get role by ID
  getRole: async (roleId: number): Promise<Role> => {
    const response = await fetchWithAuth(`${API_URL}/roles/${roleId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch role");
    }
    return response.json();
  },

  // Create a new role
  createRole: async (roleData: RoleCreateData): Promise<Role> => {
    const response = await fetchWithAuth(`${API_URL}/roles/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create role");
    }

    return response.json();
  },

  // Update a role
  updateRole: async (
    roleId: number,
    roleData: RoleUpdateData
  ): Promise<Role> => {
    const response = await fetchWithAuth(`${API_URL}/roles/${roleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update role");
    }

    return response.json();
  },

  // Delete a role
  deleteRole: async (roleId: number): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/roles/${roleId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete role");
    }
  },
};
