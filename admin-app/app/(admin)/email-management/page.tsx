"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/shared";
import {
  getSystemStats,
  EmailSystemStats,
  CATEGORY_COLORS,
} from "@/lib/api/email-management";
import {
  EnvelopeIcon,
  BoltIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function EmailManagementPage() {
  const [stats, setStats] = useState<EmailSystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getSystemStats();
      setStats(data);
    } catch (err) {
      setError("Failed to load email system statistics");
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
        <p className="mt-2 text-gray-600">
          Manage email templates, actions, and monitor system performance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Templates
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats?.total_templates || 0}
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BoltIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Actions
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats?.active_actions || 0}
                  <span className="text-sm text-gray-500 ml-1">
                    / {stats?.total_actions || 0}
                  </span>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Recent Logs
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats?.recent_logs_count || 0}
                  <span className="text-sm text-gray-500 ml-1">(7 days)</span>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartPieIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Categories
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats?.categories_stats?.length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/email-management/templates"
          className="group block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center">
            <EnvelopeIcon className="h-10 w-10 text-blue-600 group-hover:text-blue-700" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                Manage Templates
              </h3>
              <p className="text-sm text-gray-500">
                Create and edit email templates
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/email-management/actions"
          className="group block p-6 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center">
            <BoltIcon className="h-10 w-10 text-green-600 group-hover:text-green-700" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700">
                Email Actions
              </h3>
              <p className="text-sm text-gray-500">
                Configure automated email triggers
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/email-management/logs"
          className="group block p-6 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-10 w-10 text-purple-600 group-hover:text-purple-700" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700">
                View Logs
              </h3>
              <p className="text-sm text-gray-500">
                Monitor email delivery status
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Categories Overview
            </h3>
            <div className="space-y-4">
              {stats?.categories_stats?.map((category) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        CATEGORY_COLORS[
                          category.category as keyof typeof CATEGORY_COLORS
                        ] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {category.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{category.templates_count} templates</span>
                    <span>
                      {category.active_actions_count}/{category.actions_count}{" "}
                      actions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">Email Service</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Template Rendering
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  Operational
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Action Processing
                  </span>
                </div>
                <span className="text-sm font-medium text-yellow-600">
                  Monitoring
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/email-management/settings"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-500"
                >
                  <CogIcon className="h-4 w-4 mr-1" />
                  System Settings
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity Preview */}
      <Card className="mt-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <Link
              href="/email-management/logs"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all logs →
            </Link>
          </div>
          <div className="text-center py-8 text-gray-500">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Recent email activity will appear here</p>
            <p className="text-sm">Set up email actions to start monitoring</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
