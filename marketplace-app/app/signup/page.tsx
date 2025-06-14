"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { user, loading, error: authError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams?.get("plan");

  // Load plan information if plan parameter is provided
  useEffect(() => {
    const loadPlanInfo = async () => {
      if (planParam) {
        try {
          const plans = await fetchPublicSubscriptions();
          const plan = plans.find((p: Subscription) => p.name === planParam);
          if (plan) setSelectedPlan(plan);
        } catch (error) {
          console.error("Error loading plan info:", error);
        }
      }
    };

    loadPlanInfo();
  }, [planParam]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if (!email || !password || !fullName) {
      setFormError("Please fill out all required fields");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      setSubmitting(false);
      return;
    }

    try {
      // Call the signup API
      const response = await fetch("http://localhost:8000/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
        }),
      });

      if (response.ok) {
        // Show success message and redirect to login or payment
        if (selectedPlan && selectedPlan.name !== "trial") {
          // If they selected a paid plan, redirect to login with plan selection
          router.push(
            `/login?redirect=/upgrade&plan=${selectedPlan.name}&registered=true`
          );
        } else {
          // If trial or no plan selected, just redirect to login
          router.push("/login?registered=true");
        }
      } else {
        const error = await response.json();
        setFormError(
          error.detail || "Failed to create account. Please try again."
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      setFormError("Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if loading or already logged in
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Handled by the useEffect redirect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Selected Plan Display */}
          {selectedPlan && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Selected Plan: {selectedPlan.display_name}
                  </h3>
                  <div className="mt-1 text-sm text-green-700">
                    <p>
                      €{parseFloat(selectedPlan.price.toString()).toFixed(0)}{" "}
                      for {selectedPlan.duration_days} days
                      {selectedPlan.name === "trial" ? " - Free Trial" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(formError || authError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{formError || authError}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{" "}
                <a
                  href="#"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting
                  ? "Creating account..."
                  : selectedPlan
                  ? `Create account & Get ${selectedPlan.display_name}`
                  : "Create account"}
              </button>
            </div>

            {!selectedPlan && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Haven't chosen a plan yet?{" "}
                  <Link
                    href="/plans"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    View plans
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
