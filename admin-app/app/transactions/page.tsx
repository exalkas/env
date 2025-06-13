"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TransactionApi,
  Transaction,
  TransactionFilter,
} from "../../lib/api/transactions";
import { isAuthenticated } from "../../lib/utils/auth";
import { useRouter } from "next/navigation";
import { ORDER_STATUS } from "../../lib/config";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Filter state
  const [filters, setFilters] = useState<TransactionFilter>({
    status: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);

        // Remove empty filters
        const activeFilters: TransactionFilter = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            activeFilters[key as keyof TransactionFilter] = value;
          }
        });

        const transactionData = await TransactionApi.getTransactions(
          Object.keys(activeFilters).length > 0 ? activeFilters : undefined
        );
        setTransactions(transactionData);
        setError(null);
      } catch (err) {
        setError("Failed to load transactions. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [router, filters]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      start_date: "",
      end_date: "",
    });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Transaction Management
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">All Statuses</option>
              {Object.entries(ORDER_STATUS).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mr-2 transition"
          >
            Clear Filters
          </button>
        </div>
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
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  ID
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Asset
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Seller
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Buyer
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Quantity
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Price
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Total
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Status
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Date
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <Link
                        href={`/assets/${transaction.asset_id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {transaction.asset_name}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <Link
                        href={`/users/${transaction.seller_id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {transaction.seller_name}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <Link
                        href={`/users/${transaction.buyer_id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {transaction.buyer_name}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b text-gray-900">
                      {transaction.quantity}
                    </td>
                    <td className="py-2 px-4 border-b text-gray-900">
                      {formatCurrency(transaction.price)}
                    </td>
                    <td className="py-2 px-4 border-b text-gray-900">
                      {formatCurrency(transaction.total_amount)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b text-gray-900">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <Link
                        href={`/transactions/${transaction.id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="py-4 px-4 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
