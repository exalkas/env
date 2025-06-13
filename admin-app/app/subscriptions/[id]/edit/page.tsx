"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SubscriptionApi,
  Subscription,
} from "../../../../lib/api/subscriptions";

interface SubscriptionFormData {
  name: string;
  display_name: string;
  description: string;
  price: string;
  duration_days: string;
  is_active: boolean;
  features: string;
  max_concurrent_users: string;
}

export default function EditSubscriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: "",
    display_name: "",
    description: "",
    price: "",
    duration_days: "",
    is_active: true,
    features: "",
    max_concurrent_users: "",
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await SubscriptionApi.getSubscription(parseInt(params.id));
        setSubscription(data);
        setFormData({
          name: data.name,
          display_name: data.display_name,
          description: data.description || "",
          price: data.price.toString(),
          duration_days: data.duration_days.toString(),
          is_active: data.is_active,
          features: data.features || "",
          max_concurrent_users: data.max_concurrent_users.toString(),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch subscription"
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchSubscription();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate features JSON if provided
      if (formData.features.trim()) {
        try {
          JSON.parse(formData.features);
        } catch {
          throw new Error("Features must be valid JSON");
        }
      }

      await SubscriptionApi.updateSubscription(parseInt(params.id), {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration_days: parseInt(formData.duration_days),
        is_active: formData.is_active,
        features: formData.features.trim() || null,
        max_concurrent_users: parseInt(formData.max_concurrent_users),
      });

      router.push(`/subscriptions/${params.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update subscription"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked! : value,
    }));
  };

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Subscription: {subscription?.display_name}
          </h1>
          <Link
            href={`/subscriptions/${params.id}`}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to Details
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name (Internal) *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  placeholder="e.g., premium"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Internal identifier (lowercase, no spaces)
                </p>
              </div>

              <div>
                <label
                  htmlFor="display_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Display Name *
                </label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  required
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  placeholder="e.g., Premium Subscription"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                placeholder="Describe what this subscription includes..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="price"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="duration_days"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Duration (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  id="duration_days"
                  name="duration_days"
                  required
                  value={formData.duration_days}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="max_concurrent_users"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Max Users *
                </label>
                <input
                  type="number"
                  min="1"
                  id="max_concurrent_users"
                  name="max_concurrent_users"
                  required
                  value={formData.max_concurrent_users}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="features"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Features (JSON)
              </label>
              <textarea
                id="features"
                name="features"
                rows={4}
                value={formData.features}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                placeholder='{"news_access": "full", "marketplace_access": "full", "max_orders": 100}'
              />
              <p className="mt-1 text-xs text-gray-500">
                JSON object describing subscription features
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_active"
                className="ml-2 block text-sm text-gray-700"
              >
                Active subscription (available for new users)
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/subscriptions/${params.id}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Updating..." : "Update Subscription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
