"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  UserIcon,
  LockClosedIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  updateUserProfile,
  changePassword,
  updateNotificationPreferences,
  fetchNotificationPreferences,
  deactivateAccount,
  exportUserData,
} from "@/lib/api";
import {
  Button,
  Card,
  FormInput,
  FormTextarea,
  LoadingSpinner,
} from "@/components/shared";

type TabType = "profile" | "security" | "notifications" | "account";

interface NotificationPreferences {
  email_marketing: boolean;
  email_price_alerts: boolean;
  email_order_updates: boolean;
  email_news_digest: boolean;
  sms_enabled: boolean;
}

const tabs = [
  { id: "profile" as TabType, name: "Profile", icon: UserIcon },
  { id: "security" as TabType, name: "Security", icon: LockClosedIcon },
  { id: "notifications" as TabType, name: "Notifications", icon: BellIcon },
  { id: "account" as TabType, name: "Account", icon: ExclamationTriangleIcon },
];

export default function SettingsPage() {
  const { user, kycStatus, loading: authLoading, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>({
      email_marketing: false,
      email_price_alerts: true,
      email_order_updates: true,
      email_news_digest: true,
      sms_enabled: false,
    });

  // Account deactivation state
  const [deactivationReason, setDeactivationReason] = useState("");
  const [showDeactivationConfirm, setShowDeactivationConfirm] = useState(false);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await fetchNotificationPreferences();
        setNotificationPrefs(prefs);
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
        // Use defaults if API fails
      }
    };

    if (user) {
      loadPreferences();
    }
  }, [user]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUserProfile(profileForm);
      await refreshUserData();
      showMessage("success", "Profile updated successfully!");
    } catch (error) {
      showMessage("error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showMessage("error", "New passwords do not match.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      showMessage("error", "Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordForm);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      showMessage("success", "Password changed successfully!");
    } catch (error) {
      showMessage(
        "error",
        "Failed to change password. Please check your current password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);

    try {
      await updateNotificationPreferences(notificationPrefs);
      showMessage("success", "Notification preferences updated successfully!");
    } catch (error) {
      showMessage("error", "Failed to update notification preferences.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeactivation = async () => {
    if (!deactivationReason.trim()) {
      showMessage("error", "Please provide a reason for deactivation.");
      return;
    }

    setLoading(true);

    try {
      await deactivateAccount(deactivationReason);
      showMessage(
        "success",
        "Account deactivation request submitted. You will be contacted by support."
      );
      setShowDeactivationConfirm(false);
      setDeactivationReason("");
    } catch (error) {
      showMessage("error", "Failed to submit deactivation request.");
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setLoading(true);

    try {
      const blob = await exportUserData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `greentrade-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showMessage("success", "Data exported successfully!");
    } catch (error) {
      showMessage("error", "Failed to export data.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading settings..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Please log in to access settings.</p>
        </Card>
      </div>
    );
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Personal Information
        </h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <FormInput
              id="full_name"
              type="text"
              value={profileForm.full_name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, full_name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <FormInput
              id="email"
              type="email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm({ ...profileForm, email: e.target.value })
              }
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <Button type="submit" loading={loading} disabled={loading}>
            Update Profile
          </Button>
        </form>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Account Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div
                className={`p-2 rounded-full mr-3 ${
                  user.subscription_type === "trial"
                    ? "bg-blue-100"
                    : user.subscription_type === "standard"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Subscription
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {user.subscription_type || "Free"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div
                className={`p-2 rounded-full mr-3 ${
                  kycStatus?.status === "approved"
                    ? "bg-green-100"
                    : kycStatus?.status === "submitted" ||
                      kycStatus?.status === "under_review"
                    ? "bg-yellow-100"
                    : kycStatus?.status === "rejected"
                    ? "bg-red-100"
                    : "bg-gray-100"
                }`}
              >
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">KYC Status</p>
                <p className="text-sm text-gray-600">
                  {kycStatus?.status === "approved"
                    ? "Verified"
                    : kycStatus?.status === "submitted"
                    ? "Pending Review"
                    : kycStatus?.status === "under_review"
                    ? "Under Review"
                    : kycStatus?.status === "rejected"
                    ? "Rejected"
                    : "Not Started"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label
              htmlFor="current_password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <FormInput
              id="current_password"
              type="password"
              value={passwordForm.current_password}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  current_password: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="new_password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <FormInput
              id="new_password"
              type="password"
              value={passwordForm.new_password}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  new_password: e.target.value,
                })
              }
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <FormInput
              id="confirm_password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirm_password: e.target.value,
                })
              }
              required
            />
          </div>

          <Button type="submit" loading={loading} disabled={loading}>
            Change Password
          </Button>
        </form>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Security Information
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Account Security
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Your account is protected with encrypted password storage
                  </li>
                  <li>All API communications use HTTPS encryption</li>
                  <li>Login sessions expire automatically for security</li>
                  <li>We recommend using a strong, unique password</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Email Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Price Alerts</p>
              <p className="text-sm text-gray-500">
                Get notified when asset prices change significantly
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs.email_price_alerts}
                onChange={(e) =>
                  setNotificationPrefs({
                    ...notificationPrefs,
                    email_price_alerts: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Order Updates</p>
              <p className="text-sm text-gray-500">
                Notifications about your trading orders
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs.email_order_updates}
                onChange={(e) =>
                  setNotificationPrefs({
                    ...notificationPrefs,
                    email_order_updates: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">News Digest</p>
              <p className="text-sm text-gray-500">
                Weekly summary of green energy market news
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs.email_news_digest}
                onChange={(e) =>
                  setNotificationPrefs({
                    ...notificationPrefs,
                    email_news_digest: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Marketing Emails
              </p>
              <p className="text-sm text-gray-500">
                Product updates and promotional content
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs.email_marketing}
                onChange={(e) =>
                  setNotificationPrefs({
                    ...notificationPrefs,
                    email_marketing: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            SMS Notifications
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">SMS Alerts</p>
              <p className="text-sm text-gray-500">
                Critical alerts via SMS (coming soon)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer opacity-50">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleNotificationUpdate}
            loading={loading}
            disabled={loading}
          >
            Save Notification Preferences
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download a copy of all your account data including trading history,
          orders, and profile information.
        </p>
        <Button
          onClick={handleDataExport}
          loading={loading}
          disabled={loading}
          variant="secondary"
          icon={ArrowDownTrayIcon}
        >
          Export My Data
        </Button>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>

        {!showDeactivationConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-red-800">
                  Account Deactivation
                </h4>
                <p className="mt-2 text-sm text-red-700">
                  Deactivating your account will prevent you from logging in and
                  trading. Your data will be preserved for regulatory
                  compliance.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => setShowDeactivationConfirm(true)}
                    variant="danger"
                    size="sm"
                  >
                    Request Account Deactivation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-4">
              Confirm Account Deactivation
            </h4>
            <div>
              <label
                htmlFor="deactivation_reason"
                className="block text-sm font-medium text-red-800 mb-1"
              >
                Reason for deactivation
              </label>
              <FormTextarea
                id="deactivation_reason"
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Please tell us why you're deactivating your account..."
                rows={3}
                required
              />
            </div>
            <div className="mt-4 flex space-x-3">
              <Button
                onClick={handleAccountDeactivation}
                variant="danger"
                loading={loading}
                disabled={loading || !deactivationReason.trim()}
              >
                Confirm Deactivation
              </Button>
              <Button
                onClick={() => {
                  setShowDeactivationConfirm(false);
                  setDeactivationReason("");
                }}
                variant="secondary"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex">
            {message.type === "success" ? (
              <CheckCircleIcon className="h-5 w-5 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 mt-0.5" />
            )}
            <p className="ml-3 text-sm">{message.text}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && renderProfileTab()}
          {activeTab === "security" && renderSecurityTab()}
          {activeTab === "notifications" && renderNotificationsTab()}
          {activeTab === "account" && renderAccountTab()}
        </div>
      </div>
    </div>
  );
}
