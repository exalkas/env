"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
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

export default function Home() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const parsed = JSON.parse(featuresString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return featuresString
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);
    }
  };

  const handleSelectPlan = (planName: string) => {
    if (user) {
      window.location.href = `/upgrade?plan=${planName}`;
    } else {
      window.location.href = `/signup?plan=${planName}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Green Energy Trading Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
              Access real-time market data, trade green energy assets, and
              contribute to a sustainable future. Join professional brokers and
              traders in the leading green energy marketplace.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!user ? (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex items-center px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-green-600 transition-colors"
                  >
                    Log In
                  </Link>
                </>
              ) : (
                <Link
                  href="/market"
                  className="inline-flex items-center px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Go to Trading Dashboard
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Professional tools and services for green energy trading
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Live Market Data
                </h3>
                <p className="text-gray-600">
                  Real-time pricing for EUA, EUA2, GOO, GEO, and biofuel markets
                  with professional-grade data feeds
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  RFQ Trading
                </h3>
                <p className="text-gray-600">
                  Request quotes from professional brokers for personalized
                  trading and competitive pricing
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Industry News
                </h3>
                <p className="text-gray-600">
                  Stay updated with the latest green energy market news, trends,
                  and regulatory changes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section id="plans-section" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Select the perfect plan for your green energy trading needs.
                Start with our free trial or upgrade to access premium features.
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
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about our platform
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What's included in the free trial?
                </h3>
                <p className="text-gray-600 text-lg">
                  The 7-day free trial includes access to news viewing and
                  view-only access to marketplace offers. You can browse current
                  market prices but cannot place orders or access RFQ features.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Can I upgrade or downgrade my plan?
                </h3>
                <p className="text-gray-600 text-lg">
                  Yes, you can change your subscription plan at any time.
                  Changes will take effect at the start of your next billing
                  cycle.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Do I need KYC verification?
                </h3>
                <p className="text-gray-600 text-lg">
                  KYC verification is only required for trading EU assets (EUA,
                  EUA2). You can register and access other features without KYC
                  verification.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What assets can I trade?
                </h3>
                <p className="text-gray-600 text-lg">
                  We support trading of EUA, EUA2, GOO, GEO certificates, and
                  biofuels. All trades are facilitated through our professional
                  broker network.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  How does RFQ trading work?
                </h3>
                <p className="text-gray-600 text-lg">
                  Request for Quote (RFQ) allows you to submit trading requests
                  to our professional brokers. They will provide competitive
                  quotes, and you can accept or reject them based on your
                  requirements.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-green-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Join thousands of traders already using our platform
            </p>
            {!user ? (
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Your Free Trial
              </Link>
            ) : (
              <Link
                href="/market"
                className="inline-flex items-center px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
