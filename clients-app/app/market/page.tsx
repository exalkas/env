"use client";

import { useEffect, useState } from "react";
import { Asset, MarketApi } from "@/lib/api/market";
import { isAuthenticated, getSubscriptionType } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  Button,
} from "@/components/shared";

export default function MarketPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    assetType: "",
    search: "",
  });
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch assets
    fetchAssets();
  }, [router, filter]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await MarketApi.getAssets();
      setAssets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const subscriptionType = getSubscriptionType();
  const isTrialUser = subscriptionType === "trial";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAssetTypeColor = (assetType: string) => {
    const colors: { [key: string]: string } = {
      EUA: "bg-blue-100 text-blue-800",
      EUA2: "bg-indigo-100 text-indigo-800",
      GOO: "bg-green-100 text-green-800",
      GEO: "bg-emerald-100 text-emerald-800",
      VOLUNTARY: "bg-purple-100 text-purple-800",
      BIOFUELS: "bg-yellow-100 text-yellow-800",
    };
    return colors[assetType] || "bg-gray-100 text-gray-800";
  };

  // Filter assets based on current filters
  const filteredAssets = assets.filter((asset) => {
    if (filter.assetType && asset.asset_type !== filter.assetType) return false;
    if (
      filter.search &&
      !asset.name.toLowerCase().includes(filter.search.toLowerCase()) &&
      !asset.symbol.toLowerCase().includes(filter.search.toLowerCase())
    )
      return false;
    return true;
  });

  const assetTypes = [
    { value: "", label: "All Asset Types" },
    { value: "EUA", label: "EUA" },
    { value: "EUA2", label: "EUA2" },
    { value: "GOO", label: "GOO" },
    { value: "GEO", label: "GEO" },
    { value: "VOLUNTARY", label: "Voluntary" },
    { value: "BIOFUELS", label: "Biofuels" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Green Energy Marketplace
          </h1>
          <p className="text-gray-600">
            Trade green energy assets and carbon credits in real-time
          </p>
        </div>

        {isTrialUser && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg">
            <p className="text-yellow-700">
              You are currently on a trial subscription. You can view market
              data but cannot trade.
              <Link
                href="/upgrade"
                className="underline ml-2 font-medium hover:text-yellow-800"
              >
                Upgrade your subscription
              </Link>{" "}
              to start trading.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Type
              </label>
              <select
                value={filter.assetType}
                onChange={(e) =>
                  setFilter({ ...filter, assetType: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {assetTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Assets
              </label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
                placeholder="Search by name or symbol..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Assets Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {filter.assetType || filter.search
              ? "Filtered Assets"
              : "Available Assets"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${getAssetTypeColor(
                        asset.asset_type
                      )}`}
                    >
                      {asset.asset_type}
                    </span>
                    {asset.requires_kyc && (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        KYC Required
                      </span>
                    )}
                  </div>

                  {/* Fixed height title section */}
                  <div className="mb-4 h-24 flex flex-col justify-start">
                    <h3
                      className="text-xl font-semibold text-gray-900 mb-2 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        lineHeight: "1.3em",
                        maxHeight: "3.9em",
                      }}
                    >
                      {asset.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{asset.symbol}</p>
                  </div>

                  {/* Price section */}
                  <div className="mb-4 flex-grow">
                    <p className="text-3xl font-bold text-gray-900">
                      {formatPrice(asset.current_price || 0)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Last updated: {formatDate(asset.last_updated)}
                    </p>
                  </div>

                  {/* Button always at bottom */}
                  <div className="mt-auto">
                    <Link
                      href={`/market/${asset.id}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAssets.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {filter.assetType || filter.search
                  ? "No assets found matching your criteria."
                  : "No assets are available at the moment. Please check back later."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
