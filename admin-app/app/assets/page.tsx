"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AssetApi, Asset } from "../../lib/api/assets";
import { isAuthenticated } from "../../lib/utils/auth";
import { useRouter } from "next/navigation";
import { ASSET_TYPES } from "../../lib/config";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchAssets = async () => {
      try {
        setLoading(true);
        const assetData = await AssetApi.getAssets();
        setAssets(assetData);
        setError(null);
      } catch (err) {
        setError("Failed to load assets. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [router]);

  const handleStatusChange = async (assetId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await AssetApi.deactivateAsset(assetId);
      } else {
        await AssetApi.activateAsset(assetId);
      }

      // Refresh the asset list
      const updatedAssets = await AssetApi.getAssets();
      setAssets(updatedAssets);
    } catch (err) {
      setError("Failed to update asset status. Please try again.");
      console.error(err);
    }
  };

  const getAssetTypeName = (type: string) => {
    return ASSET_TYPES[type as keyof typeof ASSET_TYPES] || type;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Asset Management</h1>
        <Link
          href="/assets/create"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition"
        >
          Create New Asset
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Type</th>
                <th className="py-2 px-4 border-b text-left">Price</th>
                <th className="py-2 px-4 border-b text-left">Supply</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{asset.id}</td>
                  <td className="py-2 px-4 border-b">{asset.name}</td>
                  <td className="py-2 px-4 border-b">
                    {getAssetTypeName(asset.type)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    ${asset.price.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {asset.available_supply} / {asset.total_supply}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        asset.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {asset.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex space-x-2">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View
                      </Link>
                      <button
                        onClick={() =>
                          handleStatusChange(asset.id, asset.is_active)
                        }
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {asset.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
