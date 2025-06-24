"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMarket } from "@/lib/MarketContext";
import Link from "next/link";

interface DashboardStats {
  totalAssets: number;
  portfolioValue: number;
  activeOrders: number;
  recentTransactions: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { assetPrices, latestNews, loading } = useMarket();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    portfolioValue: 0,
    activeOrders: 0,
    recentTransactions: 0,
  });

  useEffect(() => {
    // Calculate dashboard stats
    const assetCount = Object.keys(assetPrices).length;
    setStats({
      totalAssets: assetCount,
      portfolioValue: 0, // This would come from user's portfolio API
      activeOrders: 0, // This would come from user's orders API
      recentTransactions: 0, // This would come from user's transactions API
    });
  }, [assetPrices]);

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.full_name || "Trader"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s what&apos;s happening in your green energy trading account
          today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg
                className="h-6 w-6"
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
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-600">
                Available Assets
              </h2>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalAssets}
              </p>
            </div>
          </div>
          <Link
            href="/market"
            className="text-blue-500 text-sm mt-4 block hover:text-blue-700"
          >
            View market →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-600">
                Portfolio Value
              </h2>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.portfolioValue)}
              </p>
            </div>
          </div>
          <Link
            href="/portfolio"
            className="text-green-500 text-sm mt-4 block hover:text-green-700"
          >
            View portfolio →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-600">
                Active Orders
              </h2>
              <p className="text-3xl font-bold text-gray-900">
                {stats.activeOrders}
              </p>
            </div>
          </div>
          <Link
            href="/rfq"
            className="text-yellow-500 text-sm mt-4 block hover:text-yellow-700"
          >
            View orders →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-600">
                Transactions
              </h2>
              <p className="text-3xl font-bold text-gray-900">
                {stats.recentTransactions}
              </p>
            </div>
          </div>
          <Link
            href="/transactions"
            className="text-purple-500 text-sm mt-4 block hover:text-purple-700"
          >
            View transactions →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Market Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Market Overview
            </h2>
            <Link href="/market" className="text-blue-500 hover:text-blue-700">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {Object.values(assetPrices)
              .slice(0, 5)
              .map((asset) => (
                <div
                  key={asset.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      €{asset.price.toFixed(2)}
                    </p>
                    <p
                      className={`text-sm ${
                        asset.change_percentage_24h >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {asset.change_percentage_24h >= 0 ? "+" : ""}
                      {asset.change_percentage_24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {Object.keys(assetPrices).length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No market data available
            </p>
          )}
        </div>

        {/* Latest News */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Latest News</h2>
            <Link href="/news" className="text-blue-500 hover:text-blue-700">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {latestNews.slice(0, 4).map((news) => (
              <div
                key={news.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                  {news.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {news.summary}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{news.source}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(news.published_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {latestNews.length === 0 && (
            <p className="text-gray-500 text-center py-8">No news available</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/orders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <svg
                className="h-6 w-6 text-green-600"
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
            <div>
              <h3 className="font-medium text-gray-900">Place Order</h3>
              <p className="text-sm text-gray-600">Submit trading orders</p>
            </div>
          </Link>

          <Link
            href="/market"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <svg
                className="h-6 w-6 text-blue-600"
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
            <div>
              <h3 className="font-medium text-gray-900">View Market</h3>
              <p className="text-sm text-gray-600">Browse available assets</p>
            </div>
          </Link>

          <Link
            href="/upgrade"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Upgrade Plan</h3>
              <p className="text-sm text-gray-600">Access premium features</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
