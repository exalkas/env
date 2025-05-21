"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserApi, User } from "../../lib/api/users";
import { isAuthenticated } from "../../lib/utils/auth";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userData = await UserApi.getUsers();
        setUsers(userData);
        setError(null);
      } catch (err) {
        setError("Failed to load users. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await UserApi.deactivateUser(userId);
      } else {
        await UserApi.activateUser(userId);
      }

      // Refresh the user list
      const updatedUsers = await UserApi.getUsers();
      setUsers(updatedUsers);
    } catch (err) {
      setError("Failed to update user status. Please try again.");
      console.error(err);
    }
  };

  const handleKycVerification = async (userId: number) => {
    try {
      await UserApi.verifyKyc(userId);

      // Refresh the user list
      const updatedUsers = await UserApi.getUsers();
      setUsers(updatedUsers);
    } catch (err) {
      setError("Failed to verify KYC. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">KYC Status</th>
                <th className="py-2 px-4 border-b text-left">Role</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{user.id}</td>
                  <td className="py-2 px-4 border-b">{user.full_name}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.kyc_verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.kyc_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.is_admin
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex space-x-2">
                      <Link
                        href={`/users/${user.id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View
                      </Link>
                      <button
                        onClick={() =>
                          handleStatusChange(user.id, user.is_active)
                        }
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                      {!user.kyc_verified && (
                        <button
                          onClick={() => handleKycVerification(user.id)}
                          className="text-green-500 hover:text-green-700"
                        >
                          Verify KYC
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
