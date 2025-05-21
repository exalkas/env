"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    router.push("/auth");
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Your Profile
            </h2>
            <div className="flex items-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <p className="text-lg font-medium">
                  {user.full_name || "User"}
                </p>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
            <Link
              href="/profile"
              className="mt-4 inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Edit Profile
            </Link>
          </div>

          {/* Subscription Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Subscription
            </h2>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-medium capitalize">
                  {user.subscription_type || "No Subscription"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>

            {user.subscription_type === "trial" && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-yellow-700 text-sm">
                  You are currently on a 7-day trial. You can view market data,
                  but cannot execute trades.
                </p>
                <Link
                  href="/pricing"
                  className="mt-2 inline-block text-sm text-green-600 font-medium hover:text-green-800"
                >
                  Upgrade your plan
                </Link>
              </div>
            )}

            {user.subscription_type === "standard" && (
              <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded">
                <p className="text-green-700 text-sm">
                  You have full access to trading features.
                </p>
              </div>
            )}
          </div>

          {/* KYC Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              KYC Verification
            </h2>
            {user.kyc_verified ? (
              <div>
                <div className="bg-green-50 border border-green-200 p-3 rounded mb-4">
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="ml-2 text-green-700">Verified</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Your identity has been verified. You can trade all asset
                  types, including EU regulated assets.
                </p>
              </div>
            ) : (
              <div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="ml-2 text-yellow-700">Not Verified</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  KYC verification is required to trade EU regulated assets.
                </p>
                <Link
                  href="/kyc"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Complete Verification
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity and Market Overview would go here in a real app */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Activity
            </h2>
            <p className="text-gray-500 italic">
              No recent activity to display.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Market Overview
            </h2>
            <p className="text-gray-500 italic">
              Market data will appear here once you access the trading platform.
            </p>
            <Link
              href="#"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Go to Trading Platform
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
