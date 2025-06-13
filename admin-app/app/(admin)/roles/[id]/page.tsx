"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleApi, Role } from "../../../../lib/api/roles";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        const roleData = await RoleApi.getRole(parseInt(params.id));
        setRole(roleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch role");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [params.id]);

  const getRoleLevelColor = (level: number): string => {
    if (level >= 100) return "bg-red-100 text-red-800";
    if (level >= 50) return "bg-purple-100 text-purple-800";
    if (level >= 30) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const getRoleLevelDescription = (level: number): string => {
    if (level >= 100) return "Super Administrator";
    if (level >= 50) return "Administrator";
    if (level >= 30) return "Moderator";
    return "User";
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

  if (!role) {
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
            href="/roles"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Roles
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Details</h1>
            <p className="text-gray-600">View and manage role information</p>
          </div>
        </div>
      </div>

      {/* Role Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 rounded-full p-3">
              <UserGroupIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {role.display_name}
              </h2>
              <p className="text-gray-600">{role.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/roles/${role.id}/permissions`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ShieldCheckIcon className="mr-2 h-4 w-4" />
              Manage Permissions
            </Link>
            <button
              onClick={() => router.push(`/roles?edit=${role.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Role
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Level
            </label>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleLevelColor(
                  role.level
                )}`}
              >
                Level {role.level}
              </span>
              <span className="text-sm text-gray-500">
                ({getRoleLevelDescription(role.level)})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                role.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {role.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Created
            </label>
            <p className="text-sm text-gray-900">
              {new Date(role.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Updated
            </label>
            <p className="text-sm text-gray-900">
              {role.updated_at
                ? new Date(role.updated_at).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>

        {role.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">
              {role.description}
            </p>
          </div>
        )}
      </div>

      {/* Role Capabilities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Role Capabilities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Access Level
            </h4>
            <div className="space-y-2">
              {role.level >= 100 && (
                <div className="flex items-center text-sm text-red-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Super Administrator - Full system access
                </div>
              )}
              {role.level >= 50 && role.level < 100 && (
                <div className="flex items-center text-sm text-purple-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Administrator - Manage users and content
                </div>
              )}
              {role.level >= 30 && role.level < 50 && (
                <div className="flex items-center text-sm text-yellow-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Moderator - Content management and review
                </div>
              )}
              {role.level < 30 && (
                <div className="flex items-center text-sm text-blue-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  User - Subscription-based access
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Typical Permissions
            </h4>
            <div className="space-y-1">
              {role.level >= 50 && (
                <>
                  <p className="text-sm text-gray-600">• User management</p>
                  <p className="text-sm text-gray-600">• Content management</p>
                  <p className="text-sm text-gray-600">
                    • System administration
                  </p>
                </>
              )}
              {role.level >= 30 && role.level < 50 && (
                <>
                  <p className="text-sm text-gray-600">
                    • View assets and subscriptions
                  </p>
                  <p className="text-sm text-gray-600">
                    • Full news management
                  </p>
                  <p className="text-sm text-gray-600">• Content moderation</p>
                </>
              )}
              {role.level < 30 && (
                <>
                  <p className="text-sm text-gray-600">• Access paid modules</p>
                  <p className="text-sm text-gray-600">
                    • Subscription-based features
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href={`/roles/${role.id}/permissions`}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            View detailed permissions →
          </Link>
        </div>
      </div>
    </div>
  );
}
