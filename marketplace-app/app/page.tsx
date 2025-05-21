"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMarket } from "@/lib/MarketContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  const { user } = useAuth();
  const { assetPrices, latestNews, loading, error, refreshMarketData } =
    useMarket();
  const [assetType, setAssetType] = useState<string>("all");

  useEffect(() => {
    // Refresh market data when component mounts
    refreshMarketData();
    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      refreshMarketData();
    }, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshMarketData]);

  // Filter assets by type
  const filteredAssets = Object.values(assetPrices).filter((asset) => {
    if (assetType === "all") return true;
    return asset.type === assetType;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user
                ? `Welcome, ${user.full_name || "Trader"}`
                : "Welcome to Green Energy Trading"}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {user
                ? "Monitor market prices, manage your portfolio, and trade green energy assets."
                : "Join the platform to start trading green energy assets and contribute to a sustainable future."}
            </p>
            {!user && (
              <div className="mt-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>

          {/* Asset Type Filter */}
          <div className="mb-6">
            <div className="flex space-x-2 overflow-x-auto">
              <button
                onClick={() => setAssetType("all")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  assetType === "all"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All Assets
              </button>
              <button
                onClick={() => setAssetType("EUA")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  assetType === "EUA"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                EUA
              </button>
              <button
                onClick={() => setAssetType("EUA2")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  assetType === "EUA2"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                EUA2
              </button>
              <button
                onClick={() => setAssetType("GOO")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  assetType === "GOO"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                GOO
              </button>
              <button
                onClick={() => setAssetType("GEO")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  assetType === "GEO"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                GEO
              </button>
              <button
                onClick={() => setAssetType("BIOFUEL")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  assetType === "BIOFUEL"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Biofuels
              </button>
            </div>
          </div>

          {/* Market Data Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Market Overview
            </h2>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => refreshMarketData()}
                  className="mt-2 text-sm text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Asset
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        24h Change
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Volume
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {asset.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {asset.symbol}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {asset.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            €{asset.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <span
                              className={
                                asset.change_percentage_24h >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {asset.change_percentage_24h >= 0 ? "+" : ""}
                              {asset.change_percentage_24h.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {asset.volume_24h.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/trading/${asset.id}`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Trade
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No assets found for the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Market News Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Latest News
            </h2>
            {latestNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestNews.slice(0, 3).map((news) => (
                  <div
                    key={news.id}
                    className="bg-white shadow rounded-lg overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {news.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {news.summary}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(news.published_at).toLocaleDateString()}
                        </span>
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Read more
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent news available.</p>
            )}
            <div className="mt-6 text-center">
              <Link
                href="/news"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View All News
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
