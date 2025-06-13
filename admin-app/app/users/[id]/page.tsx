"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  // Password change state
  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching user with ID:", userId);

        if (isNaN(userId)) {
          throw new Error("Invalid user ID");
        }

        const userData = await UserApi.getUser(userId);
        console.log("User data received:", userData);
        setUser(userData);
        setFormData({
          full_name: userData.full_name,
          email: userData.email,
          subscription_type: userData.subscription_type,
        });
      } catch (err: any) {
        console.error("Error fetching user:", err);
        setError(`Failed to load user data: ${err.message}`);
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

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      await UserApi.updateUser(userId, { password: passwordData.new_password });
      setPasswordData({ new_password: "", confirm_password: "" });
      setShowPasswordSection(false);
      setSuccessMessage("Password updated successfully.");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError("Failed to update password. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    if (
      !confirm(
        `Are you sure you want to delete user ${user.email}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await UserApi.deleteUser(user.id);
      router.push("/users");
    } catch (err: any) {
      setError(err.message || "Failed to delete user. Please try again.");
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
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="text-blue-500 hover:text-blue-700 mr-4"
          >
            ← Back to Users
          </button>
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Edit User Information
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User ID
                    </label>
                    <div className="text-gray-900 font-semibold">
                      #{user.id}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created At
                    </label>
                    <div className="text-gray-900">
                      {new Date(user.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  {/* Only show subscription type for non-admin users */}
                  {!user.is_admin && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subscription Type
                      </label>
                      <select
                        name="subscription_type"
                        value={formData.subscription_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select subscription type</option>
                        <option value="trial">Trial</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  )}

                  {/* Show admin notice for admin users */}
                  {user.is_admin && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Account
                      </label>
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600">
                        Admin users do not require subscription types
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Status & Actions Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                User Status & Actions
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                    {!user.is_super_admin && (
                      <button
                        onClick={handleStatusChange}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </div>
                  {user.is_super_admin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Super Admin status cannot be changed
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KYC Status
                  </label>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
                      >
                        Verify KYC
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                  </label>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.is_super_admin
                          ? "bg-red-100 text-red-800"
                          : user.is_admin
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.is_super_admin
                        ? "SA"
                        : user.role?.display_name ||
                          (user.is_admin ? "Administrator" : "User")}
                    </span>
                    {!user.is_super_admin && (
                      <button
                        onClick={handleAdminStatusChange}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition"
                      >
                        {user.is_admin ? "Remove Admin" : "Make Admin"}
                      </button>
                    )}
                  </div>
                  {user.is_super_admin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Super Admin privileges cannot be modified
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      User Permissions
                    </h3>
                    <Link
                      href={`/users/${user.id}/permissions`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Manage Permissions
                    </Link>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(user.updated_at).toLocaleString()}
                      </p>
                    </div>

                    {user.subscription_end_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subscription Ends
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(
                            user.subscription_end_date
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Password Management
                      </h3>
                      <button
                        onClick={() =>
                          setShowPasswordSection(!showPasswordSection)
                        }
                        className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                      >
                        {showPasswordSection ? "Cancel" : "Change Password"}
                      </button>
                    </div>

                    {showPasswordSection && (
                      <form
                        onSubmit={handlePasswordChange}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordInputChange}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            name="confirm_password"
                            value={passwordData.confirm_password}
                            onChange={handlePasswordInputChange}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
                          >
                            {loading ? "Updating..." : "Update Password"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordSection(false);
                              setPasswordData({
                                new_password: "",
                                confirm_password: "",
                              });
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {!user.is_super_admin && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          Danger Zone
                        </h3>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-red-800">
                              Delete User Account
                            </h4>
                            <p className="text-sm text-red-600 mt-1">
                              This action cannot be undone. All user data will
                              be permanently deleted.
                            </p>
                          </div>
                          <button
                            onClick={handleDeleteUser}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition"
                          >
                            {loading ? "Deleting..." : "Delete User"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
