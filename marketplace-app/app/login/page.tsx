"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { login, error: authError, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = searchParams?.get("redirect");
  const planParam = searchParams?.get("plan");
  const registered = searchParams?.get("registered");

  // Show registration success message
  useEffect(() => {
    if (registered === "true") {
      setSuccessMessage(
        "Account created successfully! Please log in to continue."
      );
    }
  }, [registered]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (redirectPath && planParam) {
        router.push(`${redirectPath}?plan=${planParam}`);
      } else if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router, redirectPath, planParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!email || !password) {
      setFormError("Please enter both email and password");
      return;
    }

    const success = await login(email, password);

    if (success) {
      // Handle redirect after successful login
      if (redirectPath && planParam) {
        router.push(`${redirectPath}?plan=${planParam}`);
      } else if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push("/dashboard");
      }
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
              Log in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{" "}
              <Link
                href="/signup"
                className="font-medium text-green-600 hover:text-green-500"
              >
                create a new account
              </Link>
            </p>
            {planParam && (
              <p className="mt-2 text-center text-sm text-blue-600">
                Log in to continue with your plan selection
              </p>
            )}
          </div>

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
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
                <p className="text-green-700">{successMessage}</p>
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
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
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
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
