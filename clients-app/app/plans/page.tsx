"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
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

export default function PlansPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        const data = await fetchPublicSubscriptions();
        setSubscriptions(data);
      } catch (err) {
        setError("Failed to load subscription plans");
        console.error("Error loading subscriptions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  const parseFeatures = (featuresString: string | null): string[] => {
    if (!featuresString) return [];
    try {
      return JSON.parse(featuresString);
    } catch {
      return featuresString.split(",").map((f) => f.trim());
    }
  };

  const handleSelectPlan = (planName: string) => {
    if (user) {
      // If logged in, redirect to upgrade/payment
      window.location.href = `/upgrade?plan=${planName}`;
    } else {
      // If not logged in, redirect to signup with plan selection
      window.location.href = `/signup?plan=${planName}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the perfect plan for your green energy trading needs. Start
              with our free trial or upgrade to access premium features.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-md mx-auto">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subscriptions.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 ${
                    plan.name === "standard" ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  {plan.name === "standard" && (
                    <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.display_name}
                    </h3>

                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        €{parseFloat(plan.price.toString()).toFixed(0)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{plan.duration_days} days
                      </span>
                    </div>

                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    <ul className="space-y-3 mb-8">
                      {parseFeatures(plan.features).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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

                    <button
                      onClick={() => handleSelectPlan(plan.name)}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                        plan.name === "standard"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : plan.name === "trial"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-800 text-white hover:bg-gray-900"
                      }`}
                    >
                      {plan.name === "trial"
                        ? "Start Free Trial"
                        : "Choose Plan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 mb-2">
                  What's included in the free trial?
                </h3>
                <p className="text-gray-600">
                  The 7-day free trial includes access to news viewing and
                  view-only access to marketplace offers. You can browse current
                  market prices but cannot place orders.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I upgrade or downgrade my plan?
                </h3>
                <p className="text-gray-600">
                  Yes, you can change your subscription plan at any time.
                  Changes will take effect at the start of your next billing
                  cycle.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Do I need KYC verification?
                </h3>
                <p className="text-gray-600">
                  KYC verification is only required for trading EU assets (EUA,
                  EUA2). You can register and access other features without KYC.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
