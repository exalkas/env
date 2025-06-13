"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PermissionApi,
  Permission,
  MyPermissionsResponse,
} from "../../../lib/api/permissions";
import { RoleApi, Role } from "../../../lib/api/roles";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function PermissionsOverviewPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [myPermissions, setMyPermissions] =
    useState<MyPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "matrix" | "my-permissions"
  >("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [permsData, rolesData, myPermsData] = await Promise.all([
          PermissionApi.getPermissions(),
          RoleApi.getRoles(),
          PermissionApi.getMyPermissions(),
        ]);

        setPermissions(permsData);
        setRoles(rolesData);
        setMyPermissions(myPermsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group permissions by module
  const groupedPermissions = permissions.reduce((groups, permission) => {
    const module = permission.module;
    if (!groups[module]) {
      groups[module] = [];
    }
    groups[module].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const getModuleColor = (module: string): string => {
    const colors: { [key: string]: string } = {
      users: "bg-blue-100 text-blue-800",
      news: "bg-green-100 text-green-800",
      assets: "bg-purple-100 text-purple-800",
      subscriptions: "bg-yellow-100 text-yellow-800",
      roles: "bg-red-100 text-red-800",
      rfq: "bg-indigo-100 text-indigo-800",
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Permission Management
          </h1>
          <p className="text-gray-600">
            Manage system permissions and access controls
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/users"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserGroupIcon className="mr-2 h-4 w-4" />
            Manage Users
          </Link>
          <Link
            href="/roles"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CogIcon className="mr-2 h-4 w-4" />
            Manage Roles
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "matrix"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Permission Matrix
          </button>
          <button
            onClick={() => setActiveTab("my-permissions")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "my-permissions"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            My Permissions
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Total Permissions
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {permissions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Roles</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {roles.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CogIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Modules</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.keys(groupedPermissions).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <EyeIcon className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    My Permissions
                  </h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {myPermissions?.permissions.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions by Module */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Permissions by Module
            </h2>
            {Object.entries(groupedPermissions).map(
              ([module, modulePermissions]) => (
                <div
                  key={module}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuleColor(
                            module
                          )}`}
                        >
                          {module.toUpperCase()}
                        </span>
                        <h3 className="ml-3 text-lg font-medium text-gray-900 capitalize">
                          {module} Permissions
                        </h3>
                      </div>
                      <span className="text-sm text-gray-500">
                        {modulePermissions.length} permissions
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {modulePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {permission.display_name}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                permission.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {permission.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {permission.name}
                          </p>
                          {permission.description && (
                            <p className="text-xs text-gray-600">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Matrix Tab */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Role Permission Matrix
            </h2>
            <p className="text-gray-600 mb-6">
              This matrix shows which permissions are assigned to each role. Use
              the individual role management pages to modify permissions.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    {Object.keys(groupedPermissions).map((module) => (
                      <th
                        key={module}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {module}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              role.level >= 100
                                ? "bg-red-100 text-red-800"
                                : role.level >= 50
                                ? "bg-purple-100 text-purple-800"
                                : role.level >= 30
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {role.display_name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            Level {role.level}
                          </span>
                        </div>
                      </td>
                      {Object.entries(groupedPermissions).map(
                        ([module, modulePermissions]) => {
                          const modulePermCount = modulePermissions.length;
                          // This would require additional API calls to get role permissions
                          // For now, show placeholder
                          return (
                            <td
                              key={module}
                              className="px-6 py-4 whitespace-nowrap text-center"
                            >
                              <Link
                                href={`/roles/${role.id}/permissions`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                              >
                                View Details
                              </Link>
                            </td>
                          );
                        }
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* My Permissions Tab */}
      {activeTab === "my-permissions" && myPermissions && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Current Permissions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  User Information
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>User ID: {myPermissions.user_id}</p>
                  <p>Role: {myPermissions.role || "No Role"}</p>
                  <p>Role Level: {myPermissions.role_level}</p>
                  <p>Admin Status: {myPermissions.is_admin ? "Yes" : "No"}</p>
                  <p>
                    Super Admin: {myPermissions.is_super_admin ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Permission Summary
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Total Permissions: {myPermissions.permissions.length}</p>
                  <p>
                    Unique Modules:{" "}
                    {
                      new Set(
                        myPermissions.permissions.map((p) => p.split(".")[0])
                      ).size
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Detailed Permissions
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(
                  myPermissions.permissions.reduce((groups, permission) => {
                    const module = permission.split(".")[0];
                    if (!groups[module]) {
                      groups[module] = [];
                    }
                    groups[module].push(permission);
                    return groups;
                  }, {} as Record<string, string[]>)
                ).map(([module, modulePermissions]) => (
                  <div
                    key={module}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuleColor(
                          module
                        )}`}
                      >
                        {module.toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {modulePermissions.length} permissions
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {modulePermissions.map((permission) => (
                        <div key={permission} className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {permission}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
