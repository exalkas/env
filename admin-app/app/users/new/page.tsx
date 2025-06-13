"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserApi } from "../../../lib/api/users";
import { RoleApi, Role } from "../../../lib/api/roles";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface UserCreateData {
  email: string;
  full_name: string;
  password: string;
  role_id: number;
  is_active: boolean;
  kyc_verified: boolean;
  subscription_type: string;
}

export default function NewUserPage() {
  const [formData, setFormData] = useState<UserCreateData>({
    email: "",
    full_name: "",
    password: "",
    role_id: 0,
    is_active: true,
    kyc_verified: false,
    subscription_type: "trial",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const roleData = await RoleApi.getRoles();
      setRoles(roleData);
      // Set default role to 'user' if available
      const userRole = roleData.find((role) => role.name === "user");
      if (userRole) {
        setFormData((prev) => ({ ...prev, role_id: userRole.id }));
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.full_name || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.role_id) {
      setError("Please select a role");
      return;
    }

    try {
      setLoading(true);
      await UserApi.createUser(formData);
      router.push("/users");
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseInt(value)
          : value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link
          href="/users"
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.display_name} (Level {role.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Only show subscription type for non-admin users */}
            {(() => {
              const selectedRole = roles.find(
                (role) => role.id === formData.role_id
              );
              const isAdminRole = selectedRole && selectedRole.level >= 50;

              if (!isAdminRole) {
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subscription Type
                    </label>
                    <select
                      name="subscription_type"
                      value={formData.subscription_type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="trial">Trial</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                );
              }

              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Account
                  </label>
                  <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-600">
                    Admin users do not require subscription types
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Account Active</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="kyc_verified"
                checked={formData.kyc_verified}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">KYC Verified</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/users"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
