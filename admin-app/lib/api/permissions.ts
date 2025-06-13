import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  module: string;
  action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface UserPermission {
  id: number;
  user_id: number;
  permission_id: number;
  granted: boolean;
  granted_by: number | null;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  permission?: Permission;
}

export interface UserPermissionsResponse {
  user_id: number;
  permissions: string[];
  role_permissions: string[];
  individual_permissions: UserPermission[];
}

export interface RolePermissionsResponse {
  role_id: number;
  role_name: string;
  permissions: string[];
  detailed_permissions: any[];
}

export interface GrantPermissionRequest {
  permission_name: string;
  reason?: string;
  expires_at?: string;
}

export interface RevokePermissionRequest {
  permission_name: string;
  reason?: string;
}

export interface SubscriptionFeatureResponse {
  feature: string;
  allowed: boolean;
  subscription_type: string;
  message?: string;
}

export interface MyPermissionsResponse {
  user_id: number;
  permissions: string[];
  is_admin: boolean;
  is_super_admin: boolean;
  role: string | null;
  role_level: number;
}

// Permission API Service
export const PermissionApi = {
  // Get all permissions (Super Admin only)
  getPermissions: async (): Promise<Permission[]> => {
    const response = await fetchWithAuth(`${API_URL}/permissions/`);
    if (!response.ok) {
      throw new Error("Failed to fetch permissions");
    }
    return response.json();
  },

  // Get permissions for a specific user
  getUserPermissions: async (
    userId: number
  ): Promise<UserPermissionsResponse> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/users/${userId}/permissions`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch user permissions");
    }
    return response.json();
  },

  // Grant permission to a user
  grantUserPermission: async (
    userId: number,
    request: GrantPermissionRequest
  ): Promise<void> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/users/${userId}/permissions/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          ...request,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to grant permission");
    }
  },

  // Revoke permission from a user
  revokeUserPermission: async (
    userId: number,
    request: RevokePermissionRequest
  ): Promise<void> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/users/${userId}/permissions/revoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          ...request,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to revoke permission");
    }
  },

  // Get permissions for a role
  getRolePermissions: async (
    roleId: number
  ): Promise<RolePermissionsResponse> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/roles/${roleId}/permissions`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch role permissions");
    }
    return response.json();
  },

  // Assign permission to role
  assignRolePermission: async (
    roleId: number,
    permissionName: string,
    granted: boolean = true
  ): Promise<void> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/roles/${roleId}/permissions/assign`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role_id: roleId,
          permission_name: permissionName,
          granted,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to assign role permission");
    }
  },

  // Check if current user has specific permission
  checkPermission: async (
    permissionName: string
  ): Promise<{ permission: string; granted: boolean; user_id: number }> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/check/${permissionName}`
    );
    if (!response.ok) {
      throw new Error("Failed to check permission");
    }
    return response.json();
  },

  // Check subscription feature access
  checkSubscriptionFeature: async (
    feature: string
  ): Promise<SubscriptionFeatureResponse> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/check/subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feature }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check subscription feature");
    }
    return response.json();
  },

  // Get current user's permissions
  getMyPermissions: async (): Promise<MyPermissionsResponse> => {
    const response = await fetchWithAuth(
      `${API_URL}/permissions/my-permissions`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch my permissions");
    }
    return response.json();
  },
};
