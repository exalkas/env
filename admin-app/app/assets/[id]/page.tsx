"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AssetApi, Asset, AssetUpdateData } from "../../../lib/api/assets";
import { ASSET_TYPES } from "../../../lib/config";
import { isAuthenticated } from "../../../lib/utils/auth";

export default function AssetDetailPage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<AssetUpdateData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const assetId = parseInt(params.id as string);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchAsset = async () => {
      try {
        setLoading(true);
        const assetData = await AssetApi.getAsset(assetId);
        setAsset(assetData);
        setFormData({
          name: assetData.name,
          description: assetData.description || undefined,
          current_price: assetData.current_price,
          is_active: assetData.is_active,
          requires_kyc: assetData.requires_kyc,
        });
        setError(null);
      } catch (err: any) {
        setError("Failed to load asset. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      fetchAsset();
    }
  }, [assetId, router]);

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

  const handleSave = async () => {
    if (!asset) return;

    setSaving(true);
    setError(null);

    try {
      const updatedAsset = await AssetApi.updateAsset(asset.id, formData);
      setAsset(updatedAsset);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || "Failed to update asset. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (asset) {
      setFormData({
        name: asset.name,
        description: asset.description || undefined,
        current_price: asset.current_price,
        is_active: asset.is_active,
        requires_kyc: asset.requires_kyc,
      });
    }
    setEditMode(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Asset Not Found
          </h1>
          <Link href="/assets" className="text-blue-500 hover:text-blue-700">
            ← Back to Assets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href="/assets"
            className="text-blue-500 hover:text-blue-700 mr-4"
          >
            ← Back to Assets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Asset Details</h1>
        </div>
        <div className="flex space-x-3">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Asset
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset ID
            </label>
            <div className="text-gray-900 font-semibold">#{asset.id}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbol
            </label>
            <div className="text-gray-900 font-semibold">{asset.symbol}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Name
            </label>
            {editMode ? (
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            ) : (
              <div className="text-gray-900">{asset.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Type
            </label>
            <div className="text-gray-900">
              {ASSET_TYPES[asset.asset_type as keyof typeof ASSET_TYPES] ||
                asset.asset_type}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Price (€)
            </label>
            {editMode ? (
              <input
                type="number"
                name="current_price"
                value={formData.current_price || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            ) : (
              <div className="text-gray-900 font-semibold">
                €{asset.current_price.toFixed(2)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Updated
            </label>
            <div className="text-gray-900">
              {new Date(asset.last_updated).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          {editMode ? (
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              placeholder="Asset description..."
            />
          ) : (
            <div className="text-gray-900">
              {asset.description || "No description provided"}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KYC Required
            </label>
            {editMode ? (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="requires_kyc"
                  checked={formData.requires_kyc || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Requires KYC verification for trading
                </span>
              </div>
            ) : (
              <span
                className={`px-2 py-1 rounded text-xs ${
                  asset.requires_kyc
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {asset.requires_kyc ? "Yes" : "No"}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            {editMode ? (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Asset is active
                </span>
              </div>
            ) : (
              <span
                className={`px-2 py-1 rounded text-xs ${
                  asset.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {asset.is_active ? "Active" : "Inactive"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
