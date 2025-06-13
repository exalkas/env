"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AssetApi, AssetCreateData } from "../../../lib/api/assets";
import { ASSET_TYPES } from "../../../lib/config";

export default function CreateAssetPage() {
  const [formData, setFormData] = useState<AssetCreateData>({
    name: "",
    symbol: "",
    asset_type: "EUA",
    description: "",
    current_price: 0,
    requires_kyc: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.symbol || !formData.asset_type) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.current_price < 0) {
        throw new Error("Price cannot be negative");
      }

      await AssetApi.createAsset(formData);
      router.push("/assets");
    } catch (err: any) {
      setError(err.message || "Failed to create asset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/assets" className="text-blue-500 hover:text-blue-700 mr-4">
          ← Back to Assets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Asset</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Asset Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                placeholder="e.g., European Union Allowance Q1 2024"
              />
            </div>

            <div>
              <label
                htmlFor="symbol"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Symbol *
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                placeholder="e.g., EUA-Q1-24"
              />
            </div>

            <div>
              <label
                htmlFor="asset_type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Asset Type *
              </label>
              <select
                id="asset_type"
                name="asset_type"
                value={formData.asset_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                {Object.entries(ASSET_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="current_price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Price (€) *
              </label>
              <input
                type="number"
                id="current_price"
                name="current_price"
                value={formData.current_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                placeholder="0.00"
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
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              placeholder="Asset description, terms, and conditions..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requires_kyc"
              name="requires_kyc"
              checked={formData.requires_kyc}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="requires_kyc"
              className="ml-2 block text-sm text-gray-700"
            >
              Requires KYC verification for trading
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/assets"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
