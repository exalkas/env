"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserApi, User } from "../../../lib/api/users";
import { isAuthenticated } from "../../../lib/utils/auth";

interface UserDetailProps {
  params: {
    id: string;
  };
}

export default function UserDetailPage({ params }: UserDetailProps) {
  const userId = parseInt(params.id);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    subscription_type: "",
  });

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await UserApi.getUser(userId);
        setUser(userData);
        setFormData({
          full_name: userData.full_name,
          email: userData.email,
          subscription_type: userData.subscription_type,
        });
      } catch (err) {
        setError("Failed to load user data. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const updatedUser = await UserApi.updateUser(userId, formData);
      setUser(updatedUser);
      setSuccessMessage("User information updated successfully.");

      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError("Failed to update user information. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let updatedUser;

      if (user.is_active) {
        updatedUser = await UserApi.deactivateUser(userId);
      } else {
        updatedUser = await UserApi.activateUser(userId);
      }

      setUser(updatedUser);
      setSuccessMessage(
        `User ${
          updatedUser.is_active ? "activated" : "deactivated"
        } successfully.`
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError("Failed to update user status. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKycVerification = async () => {
    if (!user || user.kyc_verified) return;

    try {
      setLoading(true);
      const updatedUser = await UserApi.verifyKyc(userId);
      setUser(updatedUser);
      setSuccessMessage("User KYC verified successfully.");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError("Failed to verify KYC. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminStatusChange = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let updatedUser;

      if (user.is_admin) {
        updatedUser = await UserApi.removeAdmin(userId);
      } else {
        updatedUser = await UserApi.makeAdmin(userId);
      }

      setUser(updatedUser);
      setSuccessMessage(
        `User ${
          updatedUser.is_admin ? "granted admin rights" : "admin rights removed"
        } successfully.`
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError("Failed to update admin status. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-blue-500 hover:text-blue-700"
      >
        <span>← Back to Users</span>
      </button>

      <h1 className="text-2xl font-bold mb-6">User Details</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              Edit User Information
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Subscription Type
                </label>
                <select
                  name="subscription_type"
                  value={formData.subscription_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">None</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">User Status</h2>

            <div className="space-y-4">
              <div>
                <p className="text-gray-700 mb-2">Account Status</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={handleStatusChange}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-gray-700 mb-2">KYC Status</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.kyc_verified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.kyc_verified ? "Verified" : "Pending"}
                  </span>
                  {!user.kyc_verified && (
                    <button
                      onClick={handleKycVerification}
                      disabled={loading}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Verify KYC
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-gray-700 mb-2">Role</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.is_admin
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.is_admin ? "Admin" : "User"}
                  </span>
                  <button
                    onClick={handleAdminStatusChange}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {user.is_admin ? "Remove Admin" : "Make Admin"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-gray-700 mb-2">Created At</p>
                <p className="text-sm">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-2">Last Updated</p>
                <p className="text-sm">
                  {new Date(user.updated_at).toLocaleString()}
                </p>
              </div>

              {user.subscription_end_date && (
                <div>
                  <p className="text-gray-700 mb-2">Subscription Ends</p>
                  <p className="text-sm">
                    {new Date(user.subscription_end_date).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
