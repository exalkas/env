"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isAuthenticated } from "../../lib/utils/auth";
import { useRouter } from "next/navigation";
import { TransactionApi, Transaction } from "../../lib/api/transactions";
import { UserApi } from "../../lib/api/users";
import { AssetApi } from "../../lib/api/assets";

interface DashboardStats {
  totalUsers: number;
  totalAssets: number;
  totalTransactions: number;
  totalVolume: number;
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch data in parallel
        const [users, assets, transactionStats, recentTransactions] =
          await Promise.all([
            UserApi.getUsers(),
            AssetApi.getAssets(),
            TransactionApi.getTransactionStats(),
            TransactionApi.getRecentTransactions(5),
          ]);

        setStats({
          totalUsers: users.length,
          totalAssets: assets.length,
          totalTransactions: transactionStats.total_count || 0,
          totalVolume: transactionStats.total_volume || 0,
          recentTransactions,
        });

        setError(null);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-600 mb-2">
                Total Users
              </h2>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <Link href="/users" className="text-blue-500 text-sm mt-4 block">
                View all users →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-600 mb-2">
                Total Assets
              </h2>
              <p className="text-3xl font-bold">{stats.totalAssets}</p>
              <Link href="/assets" className="text-blue-500 text-sm mt-4 block">
                View all assets →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-600 mb-2">
                Total Transactions
              </h2>
              <p className="text-3xl font-bold">{stats.totalTransactions}</p>
              <Link
                href="/transactions"
                className="text-blue-500 text-sm mt-4 block"
              >
                View all transactions →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-600 mb-2">
                Trading Volume
              </h2>
              <p className="text-3xl font-bold">
                {formatCurrency(stats.totalVolume)}
              </p>
              <Link
                href="/transactions"
                className="text-blue-500 text-sm mt-4 block"
              >
                View details →
              </Link>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <Link href="/transactions" className="text-blue-500">
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">ID</th>
                    <th className="py-2 px-4 text-left">Asset</th>
                    <th className="py-2 px-4 text-left">Buyer</th>
                    <th className="py-2 px-4 text-left">Seller</th>
                    <th className="py-2 px-4 text-left">Amount</th>
                    <th className="py-2 px-4 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            #{transaction.id}
                          </Link>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {transaction.asset_name}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {transaction.buyer_name}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {transaction.seller_name}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {formatCurrency(transaction.total_amount)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {formatDate(transaction.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-4 text-center text-gray-500"
                      >
                        No recent transactions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/assets/create"
                className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <h3 className="font-semibold">Create New Asset</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add a new green energy asset to the platform
                </p>
              </Link>

              <Link
                href="/users"
                className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-gray-600 mt-1">
                  View, edit, and manage user accounts
                </p>
              </Link>

              <Link
                href="/transactions"
                className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <h3 className="font-semibold">Review Transactions</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor and review recent transactions
                </p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
