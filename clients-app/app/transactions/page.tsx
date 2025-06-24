"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Transaction, MarketApi } from "@/lib/api/market";
import { isAuthenticated } from "@/lib/utils/auth";
import Link from "next/link";
import websocketService, {
  TransactionNotification,
} from "@/lib/services/websocket";

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await MarketApi.getTransactions();
      setTransactions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle new transactions via WebSocket
  const handleTransactionCreated = useCallback(
    (data: TransactionNotification) => {
      const newTransaction = data.transaction;

      // Check if the transaction is already in the list
      setTransactions((prevTransactions) => {
        const exists = prevTransactions.some(
          (tx) => tx.id === newTransaction.id
        );
        if (exists) {
          return prevTransactions;
        }
        return [newTransaction, ...prevTransactions];
      });
    },
    []
  );

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch transactions
    fetchTransactions();

    // Connect to WebSocket
    websocketService.connect();

    // Listen for new transactions
    websocketService.onTransactionCreated(handleTransactionCreated);

    // Cleanup on unmount
    return () => {
      websocketService.removeEventListener(
        "transaction_created",
        handleTransactionCreated
      );
    };
  }, [router, fetchTransactions, handleTransactionCreated]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Transactions</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/market/${transaction.asset_id}`}
                          className="text-green-600 hover:text-green-700 hover:underline"
                        >
                          Asset #{transaction.asset_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={
                            transaction.buyer_id === transaction.seller_id
                              ? "text-purple-600"
                              : transaction.buyer_id === transaction.buyer_id
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.buyer_id === transaction.buyer_id
                            ? "BUY"
                            : "SELL"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${transaction.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        ${transaction.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No transactions found.</p>
              <Link
                href="/market"
                className="mt-4 inline-block text-green-600 hover:text-green-700 hover:underline"
              >
                Go to Market
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
