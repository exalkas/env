"use client";

import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  RoleApi,
  Role,
  RoleCreateData,
  RoleUpdateData,
} from "../../../lib/api/roles";
import { getUser } from "../../../lib/utils/auth";
import { useRouter } from "next/navigation";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleCreateData>({
    name: "",
    display_name: "",
    description: "",
    level: 10,
    is_active: true,
  });

  const router = useRouter();

  useEffect(() => {
    // Check if user is super admin
    const currentUser = getUser();
    if (!currentUser?.is_super_admin) {
      router.push("/dashboard");
      return;
    }

    fetchRoles();
  }, [router]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await RoleApi.getRoles();
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load roles");
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (editingRole) {
        const updatedRole = await RoleApi.updateRole(
          editingRole.id,
          formData as RoleUpdateData
        );
        setRoles(
          roles.map((role) => (role.id === updatedRole.id ? updatedRole : role))
        );
      } else {
        const newRole = await RoleApi.createRole(formData);
        setRoles([...roles, newRole]);
      }

      setShowForm(false);
      setEditingRole(null);
      setFormData({
        name: "",
        display_name: "",
        description: "",
        level: 10,
        is_active: true,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to save role");
      console.error("Error saving role:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || "",
      level: role.level,
      is_active: role.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      await RoleApi.deleteRole(id);
      setRoles(roles.filter((role) => role.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete role");
      console.error("Error deleting role:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  const getRoleLevelColor = (level: number) => {
    if (level >= 50) return "bg-red-100 text-red-800";
    if (level >= 30) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  if (loading && roles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600 transition"
        >
          <PlusIcon className="h-4 w-4" />
          Add Role
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b text-left text-gray-900 font-medium">
                Name
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-900 font-medium">
                Display Name
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-900 font-medium">
                Level
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-900 font-medium">
                Status
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-900 font-medium">
                Created
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-900 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b text-gray-900 font-medium">
                  {role.name}
                </td>
                <td className="py-3 px-4 border-b text-gray-900">
                  {role.display_name}
                </td>
                <td className="py-3 px-4 border-b">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleLevelColor(
                      role.level
                    )}`}
                  >
                    Level {role.level}
                  </span>
                </td>
                <td className="py-3 px-4 border-b">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      role.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {role.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-4 border-b text-gray-900">
                  {new Date(role.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 border-b">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(role)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Edit role"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete role"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingRole ? "Edit Role" : "Create New Role"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., manager"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Manager"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level (1-99)
                </label>
                <input
                  type="number"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  min="1"
                  max="99"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  1-29: User roles, 30-49: Moderator roles, 50+: Admin roles
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Role description..."
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Role is active
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRole(null);
                    setFormData({
                      name: "",
                      display_name: "",
                      description: "",
                      level: 10,
                      is_active: true,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading
                    ? "Saving..."
                    : editingRole
                    ? "Update Role"
                    : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
