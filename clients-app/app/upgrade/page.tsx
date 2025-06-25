"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { fetchPublicSubscriptions } from "@/lib/api";

interface Subscription {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string;
  max_concurrent_users: number;
  is_active: boolean;
}

export default function UpgradePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams?.get("plan");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        const data = await fetchPublicSubscriptions();
        setSubscriptions(data);

        // Auto-select plan from URL parameter
        if (preselectedPlan) {
          const plan = data.find(
            (p: Subscription) => p.name === preselectedPlan
          );
          if (plan) setSelectedPlan(plan);
        }
      } catch (err) {
        setError("Failed to load subscription plans");
        console.error("Error loading subscriptions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [user, router, preselectedPlan]);

  const parseFeatures = (featuresString: string | null): string[] => {
    if (!featuresString) return [];
    try {
      const parsed = JSON.parse(featuresString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return featuresString
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    // Redirect to the new payment flow
    router.push(`/payments?subscription_id=${selectedPlan.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upgrade Your Plan
          </h1>
          <p className="text-gray-600">
            Choose a plan to unlock premium features and enhance your trading
            experience
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Current plan:{" "}
              <span className="font-medium">
                {user.subscription_type || "Free"}
              </span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 max-w-md mx-auto">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Plan
            </h2>
            <div className="space-y-4">
              {subscriptions.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPlan?.id === plan.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {plan.display_name}
                    </h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        €{parseFloat(plan.price.toString()).toFixed(0)}
                      </span>
                      <span className="text-gray-600 text-sm block">
                        /{plan.duration_days} days
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {plan.description}
                  </p>
                  <ul className="space-y-1 text-sm">
                    {(parseFeatures(plan.features) || [])
                      .slice(0, 3)
                      .map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment
            </h2>

            {selectedPlan ? (
              <div className="bg-white border rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Order Summary
                  </h3>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">
                      {selectedPlan.display_name}
                    </span>
                    <span className="font-medium">
                      €{parseFloat(selectedPlan.price.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">
                      €{parseFloat(selectedPlan.price.toString()).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Methods Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 text-blue-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">
                        Multiple Payment Options Available
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Choose from credit/debit cards (via Stripe) or bank
                          transfer. Secure payment processing with instant
                          activation for card payments.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Continue to Payment
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By proceeding with payment, you agree to our Terms of Service
                  and Privacy Policy.
                </p>
              </div>
            ) : (
              <div className="bg-white border rounded-lg p-6 text-center">
                <svg
                  className="h-12 w-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <p className="text-gray-600">
                  Select a plan to proceed with payment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
