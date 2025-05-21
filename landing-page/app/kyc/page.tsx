"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import KycVerificationForm from "../../components/KycVerificationForm";

export default function KycPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    router.push("/auth");
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          KYC Verification
        </h1>

        <div className="bg-white shadow rounded-lg mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Why KYC is Required
          </h2>
          <p className="text-gray-600 mb-4">
            Know Your Customer (KYC) verification is required by EU regulations
            for trading certain regulated energy assets. This helps prevent
            fraud, money laundering, and ensures compliance with international
            financial regulations.
          </p>
          <p className="text-gray-600">
            Without KYC verification, you can still trade in non-regulated
            markets and assets, but your access to EU regulated assets will be
            restricted.
          </p>
        </div>

        <KycVerificationForm />
      </div>
    </div>
  );
}
