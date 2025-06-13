"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubscriptionApi, Subscription } from "../../../lib/api/subscriptions";

export default function SubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await SubscriptionApi.getSubscription(parseInt(params.id));
        setSubscription(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch subscription"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [params.id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFeatures = (features: string | null) => {
    if (!features) return "No features defined";
    try {
      const parsed = JSON.parse(features);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return "Invalid JSON format";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Subscription Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The requested subscription could not be found."}
          </p>
          <Link
            href="/subscriptions"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {subscription.display_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ID: {subscription.id} • Name: {subscription.name}
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              href={`/subscriptions/${subscription.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Edit Subscription
            </Link>
            <Link
              href="/subscriptions"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Back to List
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Subscription Details
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Basic Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-900">
                      Display Name
                    </dt>
                    <dd className="text-sm text-gray-600">
                      {subscription.display_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">
                      Internal Name
                    </dt>
                    <dd className="text-sm text-gray-600">
                      {subscription.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">
                      Description
                    </dt>
                    <dd className="text-sm text-gray-600">
                      {subscription.description || "No description provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">
                      Status
                    </dt>
                    <dd>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscription.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {subscription.is_active ? "Active" : "Inactive"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Pricing & Limits
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Price</dt>
                    <dd className="text-sm text-gray-600">
                      {formatPrice(subscription.price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">
                      Duration
                    </dt>
                    <dd className="text-sm text-gray-600">
                      {subscription.duration_days} days
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">
                      Max Concurrent Users
                    </dt>
                    <dd className="text-sm text-gray-600">
                      {subscription.max_concurrent_users}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Features
              </h3>
              <div className="bg-gray-50 rounded-md p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {formatFeatures(subscription.features)}
                </pre>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Timestamps
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-900">Created</dt>
                  <dd className="text-sm text-gray-600">
                    {formatDate(subscription.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-900">
                    Last Updated
                  </dt>
                  <dd className="text-sm text-gray-600">
                    {subscription.updated_at
                      ? formatDate(subscription.updated_at)
                      : "Never"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
