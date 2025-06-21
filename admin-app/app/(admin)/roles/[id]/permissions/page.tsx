"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleApi, Role } from "../../../../../lib/api/roles";
import {
  PermissionApi,
  Permission,
  RolePermissionsResponse,
} from "../../../../../lib/api/permissions";
import {
  PlusIcon,
  MinusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export default function RolePermissionsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] =
    useState<RolePermissionsResponse | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roleData, rolePermsData, allPermsData] = await Promise.all([
          RoleApi.getRole(parseInt(params.id)),
          PermissionApi.getRolePermissions(parseInt(params.id)),
          PermissionApi.getPermissions(),
        ]);

        setRole(roleData);
        setRolePermissions(rolePermsData);
        setAllPermissions(allPermsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleAssignPermission = async (permissionName: string) => {
    try {
      setActionLoading(permissionName);
      await PermissionApi.assignRolePermission(
        parseInt(params.id),
        permissionName,
        true
      );

      // Refresh role permissions
      const updatedPerms = await PermissionApi.getRolePermissions(
        parseInt(params.id)
      );
      setRolePermissions(updatedPerms);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to assign permission"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnassignPermission = async (permissionName: string) => {
    try {
      setActionLoading(permissionName);
      await PermissionApi.assignRolePermission(
        parseInt(params.id),
        permissionName,
        false
      );

      // Refresh role permissions
      const updatedPerms = await PermissionApi.getRolePermissions(
        parseInt(params.id)
      );
      setRolePermissions(updatedPerms);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to unassign permission"
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
    return rolePermissions?.permissions.includes(permissionName) || false;
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

  if (!role || !rolePermissions) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Role not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/roles/${params.id}`}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Role
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Role Permissions
            </h1>
            <p className="text-gray-600">
              Manage permissions for {role.display_name} role
            </p>
          </div>
        </div>
      </div>

      {/* Role Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 rounded-full p-3">
            <UserGroupIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {role.display_name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Name: {role.name}</span>
              <span>Level: {role.level}</span>
              <span>Status: {role.is_active ? "Active" : "Inactive"}</span>
            </div>
            {role.description && (
              <p className="text-sm text-gray-600 mt-1">{role.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Permission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Total Permissions
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {rolePermissions.permissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Coverage</h3>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(
                  (rolePermissions.permissions.length / allPermissions.length) *
                    100
                )}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for Super Admin role */}
      {role.level >= 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Super Admin Role
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This is a Super Admin role. Modifying permissions for this
                  role should be done with extreme caution as it affects system
                  security.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  / {group.permissions.length} assigned
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                {group.permissions.map((permission) => {
                  const hasAccess = hasPermission(permission.name);
                  const isLoading = actionLoading === permission.name;

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
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!hasAccess && (
                          <button
                            onClick={() =>
                              handleAssignPermission(permission.name)
                            }
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <PlusIcon className="h-3 w-3 mr-1" />
                            )}
                            Assign
                          </button>
                        )}

                        {hasAccess && (
                          <button
                            onClick={() =>
                              handleUnassignPermission(permission.name)
                            }
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <MinusIcon className="h-3 w-3 mr-1" />
                            )}
                            Unassign
                          </button>
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
    </div>
  );
}
