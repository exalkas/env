"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { startKycVerification } from "../lib/api";

const KycVerificationForm: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    dateOfBirth: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    idType: "passport",
    idNumber: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await startKycVerification(formData);
      setSuccess(true);
      await refreshUserData(); // Refresh user data to get updated KYC status
    } catch (error) {
      setError("Failed to submit KYC verification. Please try again.");
      console.error("KYC verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  // If user is already KYC verified, show success message
  if (user?.kyc_verified) {
    return (
      <div className="bg-green-50 border border-green-500 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          KYC Verification Complete
        </h3>
        <p className="text-green-700">
          Your identity has been verified. You can now trade all asset types on
          our platform, including EU regulated assets.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        KYC Verification
      </h2>
      <p className="mb-6 text-gray-600">
        To trade EU regulated assets, we need to verify your identity. Please
        provide the following information.
      </p>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <p className="text-green-700">
            Your KYC verification request has been submitted successfully. We
            will review your information and update your account status.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="postalCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Postal Code
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              required
              value={formData.postalCode}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            required
            value={formData.country}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="idType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ID Type
          </label>
          <select
            id="idType"
            name="idType"
            required
            value={formData.idType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="passport">Passport</option>
            <option value="drivingLicense">Driving License</option>
            <option value="nationalId">National ID Card</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="idNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ID Number
          </label>
          <input
            id="idNumber"
            name="idNumber"
            type="text"
            required
            value={formData.idNumber}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Verification"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Your personal information is encrypted and securely stored. We comply
          with GDPR and other data protection regulations.
        </p>
      </div>
    </div>
  );
};

export default KycVerificationForm;
