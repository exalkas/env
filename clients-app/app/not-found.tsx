"use client";

import React from "react";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-9xl font-bold text-gray-200 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Oops! The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <p className="text-gray-500">
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/market"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Market
            </Link>
            <Link
              href="/news"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              News
            </Link>
            <Link
              href="/orders"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/education"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Education
            </Link>
            <Link
              href="/upgrade"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Need help?{" "}
            <a
              href="mailto:support@greentrade.com"
              className="text-green-600 hover:text-green-700 transition-colors"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
