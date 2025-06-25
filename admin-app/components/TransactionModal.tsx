"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/shared";
import {
  PaymentTransaction,
  PaymentTransactionUpdate,
  updatePaymentTransaction,
} from "@/lib/api/payments";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: PaymentTransaction | null;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "pending" as
      | "pending"
      | "processing"
      | "completed"
      | "failed"
      | "cancelled"
      | "refunded",
    gateway_transaction_id: "",
    gateway_reference: "",
    failure_reason: "",
    notes: "",
  });

  useEffect(() => {
    if (transaction) {
      setUpdateData({
        status: transaction.status,
        gateway_transaction_id: transaction.gateway_transaction_id || "",
        gateway_reference: transaction.gateway_reference || "",
        failure_reason: transaction.failure_reason || "",
        notes: transaction.notes || "",
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);

    try {
      const payload: PaymentTransactionUpdate = {
        ...updateData,
        processed_at:
          updateData.status === "completed"
            ? new Date().toISOString()
            : undefined,
      };

      await updatePaymentTransaction(transaction.id, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Error updating transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
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

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transaction #${transaction.id}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Transaction Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(transaction.amount)} {transaction.currency}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                User ID
              </label>
              <p className="text-gray-900">{transaction.user_id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gateway
              </label>
              <p className="text-gray-900">{transaction.gateway?.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <p className="text-gray-900">
                {transaction.payment_method?.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Created
              </label>
              <p className="text-gray-900">
                {formatDate(transaction.created_at)}
              </p>
            </div>

            {transaction.processed_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Processed
                </label>
                <p className="text-gray-900">
                  {formatDate(transaction.processed_at)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Gateway Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gateway Transaction ID
              </label>
              <p className="text-gray-900 break-all">
                {transaction.gateway_transaction_id || "Not set"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gateway Reference
              </label>
              <p className="text-gray-900 break-all">
                {transaction.gateway_reference || "Not set"}
              </p>
            </div>

            {transaction.transaction_metadata && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Metadata
                </label>
                <pre className="text-sm bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {transaction.transaction_metadata}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Update Form */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Update Transaction
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      status: e.target.value as typeof updateData.status,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway Transaction ID
                </label>
                <input
                  type="text"
                  value={updateData.gateway_transaction_id}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      gateway_transaction_id: e.target.value,
                    })
                  }
                  placeholder="Transaction ID from payment gateway"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gateway Reference
              </label>
              <input
                type="text"
                value={updateData.gateway_reference}
                onChange={(e) =>
                  setUpdateData({
                    ...updateData,
                    gateway_reference: e.target.value,
                  })
                }
                placeholder="Reference from payment gateway"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {updateData.status === "failed" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Failure Reason
                </label>
                <input
                  type="text"
                  value={updateData.failure_reason}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      failure_reason: e.target.value,
                    })
                  }
                  placeholder="Reason for failure"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>
              <textarea
                value={updateData.notes}
                onChange={(e) =>
                  setUpdateData({ ...updateData, notes: e.target.value })
                }
                placeholder="Internal notes about this transaction"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </Button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Transaction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
