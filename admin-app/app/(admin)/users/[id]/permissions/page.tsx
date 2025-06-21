"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserApi, User } from "../../../../../lib/api/users";
import {
  PermissionApi,
  Permission,
  UserPermissionsResponse,
  GrantPermissionRequest,
  RevokePermissionRequest,
} from "../../../../../lib/api/permissions";
import {
  PlusIcon,
  MinusIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export default function UserPermissionsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] =
    useState<UserPermissionsResponse | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Grant/Revoke modal states
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, userPermsData, allPermsData] = await Promise.all([
          UserApi.getUser(parseInt(params.id)),
          PermissionApi.getUserPermissions(parseInt(params.id)),
          PermissionApi.getPermissions(),
        ]);

        setUser(userData);
        setUserPermissions(userPermsData);
        setAllPermissions(allPermsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleGrantPermission = async () => {
    if (!selectedPermission) return;

    try {
      setActionLoading("grant");
      const request: GrantPermissionRequest = {
        permission_name: selectedPermission,
        reason: reason || undefined,
        expires_at: expiresAt || undefined,
      };

      await PermissionApi.grantUserPermission(parseInt(params.id), request);

      // Refresh user permissions
      const updatedPerms = await PermissionApi.getUserPermissions(
        parseInt(params.id)
      );
      setUserPermissions(updatedPerms);

      // Reset modal
      setShowGrantModal(false);
      setSelectedPermission(null);
      setReason("");
      setExpiresAt("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to grant permission"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokePermission = async () => {
    if (!selectedPermission) return;

    try {
      setActionLoading("revoke");
      const request: RevokePermissionRequest = {
        permission_name: selectedPermission,
        reason: reason || undefined,
      };

      await PermissionApi.revokeUserPermission(parseInt(params.id), request);

      // Refresh user permissions
      const updatedPerms = await PermissionApi.getUserPermissions(
        parseInt(params.id)
      );
      setUserPermissions(updatedPerms);

      // Reset modal
      setShowRevokeModal(false);
      setSelectedPermission(null);
      setReason("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke permission"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Group permissions by module
  const groupedPermissions: PermissionGroup[] = allPermissions.reduce(
    (groups, permission) => {
      const existingGroup = groups.find((g) => g.module === permission.module);
      if (existingGroup) {
        existingGroup.permissions.push(permission);
      } else {
        groups.push({
          module: permission.module,
          permissions: [permission],
        });
      }
      return groups;
    },
    [] as PermissionGroup[]
  );

  const hasPermission = (permissionName: string): boolean => {
    return userPermissions?.permissions.includes(permissionName) || false;
  };

  const hasIndividualPermission = (permissionName: string): boolean => {
    return (
      userPermissions?.individual_permissions.some(
        (p) => p.permission?.name === permissionName && p.granted
      ) || false
    );
  };

  const hasRolePermission = (permissionName: string): boolean => {
    return userPermissions?.role_permissions.includes(permissionName) || false;
  };

  const getPermissionSource = (
    permissionName: string
  ): "role" | "individual" | "none" => {
    if (hasIndividualPermission(permissionName)) return "individual";
    if (hasRolePermission(permissionName)) return "role";
    return "none";
  };

  const getModuleColor = (module: string): string => {
    const colors: { [key: string]: string } = {
      users: "bg-blue-100 text-blue-800",
      news: "bg-green-100 text-green-800",
      assets: "bg-purple-100 text-purple-800",
      subscriptions: "bg-yellow-100 text-yellow-800",
      roles: "bg-red-100 text-red-800",
      order: "bg-indigo-100 text-indigo-800",
      transactions: "bg-pink-100 text-pink-800",
      analytics: "bg-gray-100 text-gray-800",
      system: "bg-orange-100 text-orange-800",
    };
    return colors[module] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!user || !userPermissions) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">User not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/users/${params.id}`}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to User
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Permissions
            </h1>
            <p className="text-gray-600">
              Manage permissions for {user.full_name || user.email}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 rounded-full p-3">
            <UserIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {user.full_name || user.email}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Role: {user.role?.display_name || "No Role"}</span>
              <span>Level: {user.role?.level || 0}</span>
              <span>
                Status:{" "}
                {user.is_super_admin
                  ? "Super Admin"
                  : user.is_admin
                  ? "Admin"
                  : "User"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Total Permissions
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {userPermissions.permissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Role Permissions
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {userPermissions.role_permissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <PlusIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Individual Overrides
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {userPermissions.individual_permissions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions by Module */}
      <div className="space-y-6">
        {groupedPermissions.map((group) => (
          <div
            key={group.module}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuleColor(
                      group.module
                    )}`}
                  >
                    {group.module.toUpperCase()}
                  </span>
                  <h3 className="ml-3 text-lg font-medium text-gray-900 capitalize">
                    {group.module} Permissions
                  </h3>
                </div>
                <div className="text-sm text-gray-500">
                  {
                    group.permissions.filter((p) => hasPermission(p.name))
                      .length
                  }{" "}
                  / {group.permissions.length} granted
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                {group.permissions.map((permission) => {
                  const hasAccess = hasPermission(permission.name);
                  const source = getPermissionSource(permission.name);
                  const individualPerm =
                    userPermissions.individual_permissions.find(
                      (p) => p.permission?.name === permission.name
                    );

                  return (
                    <div
                      key={permission.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        hasAccess
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              hasAccess ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {permission.display_name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {permission.description || permission.name}
                            </p>
                            {source !== "none" && (
                              <div className="flex items-center mt-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    source === "role"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {source === "role"
                                    ? "From Role"
                                    : "Individual Override"}
                                </span>
                                {individualPerm?.expires_at && (
                                  <span className="ml-2 inline-flex items-center text-xs text-orange-600">
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    Expires:{" "}
                                    {new Date(
                                      individualPerm.expires_at
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!hasAccess && (
                          <button
                            onClick={() => {
                              setSelectedPermission(permission.name);
                              setShowGrantModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Grant
                          </button>
                        )}

                        {hasAccess && source === "individual" && (
                          <button
                            onClick={() => {
                              setSelectedPermission(permission.name);
                              setShowRevokeModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <MinusIcon className="h-3 w-3 mr-1" />
                            Revoke
                          </button>
                        )}

                        {hasAccess && source === "role" && (
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                            From Role
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grant Permission Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Grant Permission
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission
                </label>
                <input
                  type="text"
                  value={selectedPermission || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Why is this permission being granted?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedPermission(null);
                  setReason("");
                  setExpiresAt("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantPermission}
                disabled={actionLoading === "grant"}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {actionLoading === "grant" ? "Granting..." : "Grant Permission"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Permission Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Revoke Permission
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission
                </label>
                <input
                  type="text"
                  value={selectedPermission || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Why is this permission being revoked?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setSelectedPermission(null);
                  setReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokePermission}
                disabled={actionLoading === "revoke"}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {actionLoading === "revoke"
                  ? "Revoking..."
                  : "Revoke Permission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
