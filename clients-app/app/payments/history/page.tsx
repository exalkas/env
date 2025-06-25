"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { fetchUserPaymentHistory } from "@/lib/api/payments";

interface PaymentTransaction {
  id: number;
  amount: number;
  currency: string;
  status: string;
  payment_method: {
    name: string;
    type: string;
  };
  subscription?: {
    name: string;
    display_name?: string;
  };
  created_at: string;
  processed_at?: string;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadPaymentHistory();
  }, [filter]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const data = await fetchUserPaymentHistory(params);
      setTransactions(data.transactions);
    } catch (err) {
      setError("Failed to load payment history");
      console.error("Error loading payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "succeeded":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status.toLowerCase()) {
      case "completed":
      case "succeeded":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "failed":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "credit_card":
      case "debit_card":
        return <CreditCardIcon className="h-5 w-5 text-gray-400" />;
      case "bank_transfer":
        return <BanknotesIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <CreditCardIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment History
          </h1>
          <p className="text-gray-600">
            View all your payment transactions and their status
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: "all", label: "All Payments" },
                { key: "completed", label: "Completed" },
                { key: "pending", label: "Pending" },
                { key: "failed", label: "Failed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {transaction.payment_method ? (
                        getPaymentMethodIcon(transaction.payment_method.type)
                      ) : (
                        <BanknotesIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {formatCurrency(
                            transaction.amount,
                            transaction.currency
                          )}
                        </h3>
                        <span className={getStatusBadge(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-1 space-y-1">
                        {transaction.subscription && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Subscription:</span>{" "}
                            {transaction.subscription.display_name ||
                              transaction.subscription.name}
                          </p>
                        )}

                        {transaction.payment_method && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Payment Method:</span>{" "}
                            {transaction.payment_method.name}
                          </p>
                        )}

                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Date:</span>{" "}
                          {formatDate(transaction.created_at)}
                        </p>

                        {transaction.processed_at && (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Processed:</span>{" "}
                            {formatDate(transaction.processed_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {getStatusIcon(transaction.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Payment History
            </h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "You haven't made any payments yet."
                : `No ${filter} payments found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
