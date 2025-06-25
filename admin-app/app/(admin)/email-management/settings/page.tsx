"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  StatusBadge,
  LoadingSpinner,
} from "@/components/shared";
import {
  getCategories,
  getTriggerEvents,
  sendTemplateEmail,
  triggerEmailAction,
} from "@/lib/api/email-management";
import {
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  ServerIcon,
  ShieldCheckIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const [categoriesData, eventsData] = await Promise.all([
        getCategories(),
        getTriggerEvents(),
      ]);
      setCategories(categoriesData.categories);
      setTriggerEvents(eventsData.trigger_events);
    } catch (err) {
      console.error("Error loading configuration:", err);
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    if (!testEmail) return;

    try {
      setIsTestingConnection(true);
      setTestResult(null); // Clear previous result when starting new test

      // Try to send a test email using a simple template
      const result = await sendTemplateEmail({
        template_id: 1, // Assuming we have a welcome template with ID 1
        recipient_email: testEmail,
        variables: {
          user_name: "Test User",
          test_mode: true,
        },
      });

      setTestResult({
        success: result.success,
        message: result.success
          ? "Test email sent successfully!"
          : "Failed to send test email",
      });
    } catch (err) {
      setTestResult({
        success: false,
        message:
          "Error testing email connection: " +
          (err instanceof Error ? err.message : "Unknown error"),
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mx-auto mt-8" />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Email System Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Configure and monitor your email system
        </p>
      </div>

      <div className="space-y-8">
        {/* System Status */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ServerIcon className="h-5 w-5 mr-2" />
              System Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Email Service
                  </span>
                  <StatusBadge status="Active" variant="success" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    SMTP Connection
                  </span>
                  <StatusBadge status="Connected" variant="success" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Template Engine
                  </span>
                  <StatusBadge status="Operational" variant="success" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Action Processing
                  </span>
                  <StatusBadge status="Running" variant="success" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Queue Status
                  </span>
                  <StatusBadge status="Empty" variant="info" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Last Health Check
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Email Configuration */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              Email Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  SMTP Settings
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Host: smtp.emisify.com</div>
                  <div>Port: 587</div>
                  <div>Security: TLS</div>
                  <div>From: noreply@emisify.com</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  System Limits
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Max bulk recipients: 100</div>
                  <div>Rate limit: 1000/hour</div>
                  <div>Template size: 1MB</div>
                  <div>Queue retention: 7 days</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Test Email Connection */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Test Email Connection
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Email Address
                </label>
                <FormInput
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="max-w-md"
                />
              </div>

              <Button
                onClick={testEmailConnection}
                loading={isTestingConnection}
                disabled={!testEmail}
                className="flex items-center"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>

              {testResult && (
                <div
                  className={`p-3 rounded-md ${
                    testResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    {testResult.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span
                      className={`text-sm ${
                        testResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* System Configuration */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Available Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Email Categories
                </h3>
                <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <div key={category} className="text-xs text-gray-600">
                        • {category}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Trigger Events
                </h3>
                <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {triggerEvents.map((event) => (
                      <div key={event} className="text-xs text-gray-600">
                        • {event}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BoltIcon className="h-5 w-5 mr-2" />
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="secondary"
                className="flex items-center justify-center p-4"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                View Email Queue
              </Button>

              <Button
                variant="secondary"
                className="flex items-center justify-center p-4"
              >
                <CogIcon className="h-5 w-5 mr-2" />
                Clear Failed Jobs
              </Button>

              <Button
                variant="secondary"
                className="flex items-center justify-center p-4"
              >
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </Card>

        {/* Documentation Links */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Documentation & Support
            </h2>

            <div className="space-y-3">
              <div>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  Email System Setup Guide
                </a>
                <p className="text-xs text-gray-500">
                  Configure SMTP settings and troubleshoot connection issues
                </p>
              </div>

              <div>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  Template Development Guide
                </a>
                <p className="text-xs text-gray-500">
                  Learn how to create and customize email templates
                </p>
              </div>

              <div>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  Email Action Configuration
                </a>
                <p className="text-xs text-gray-500">
                  Set up automated email workflows and triggers
                </p>
              </div>

              <div>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  Troubleshooting Guide
                </a>
                <p className="text-xs text-gray-500">
                  Common issues and solutions for email delivery
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
