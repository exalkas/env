"use client";

import { useState, useEffect } from "react";
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "../../../lib/utils/auth";

interface RFQ {
  id: number;
  user_id: number;
  asset_id: number;
  rfq_type: string;
  quantity: number;
  requested_price: number | null;
  quoted_price: number | null;
  total_amount: number | null;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  quoted_at: string | null;
  executed_at: string | null;
  quoted_by: number | null;
  executed_by: number | null;
  user_email: string | null;
  asset_name: string | null;
  asset_symbol: string | null;
}

interface QuoteFormData {
  quoted_price: number;
  admin_notes: string;
  expires_at: string;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  QUOTED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXECUTED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function RFQPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [filter, setFilter] = useState({
    status: "",
    user_id: "",
    asset_id: "",
  });

  const [quoteFormData, setQuoteFormData] = useState<QuoteFormData>({
    quoted_price: 0,
    admin_notes: "",
    expires_at: "",
  });

  useEffect(() => {
    fetchRFQs();
  }, [filter]);

  const fetchRFQs = async () => {
    try {
      const params = new URLSearchParams({
        ...(filter.status && { status: filter.status }),
        ...(filter.user_id && { user_id: filter.user_id }),
        ...(filter.asset_id && { asset_id: filter.asset_id }),
      });

      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/rfq/admin/all?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setRfqs(data.rfqs);
      }
    } catch (error) {
      console.error("Error fetching RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvideQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRfq) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/rfq/admin/${selectedRfq.id}/quote`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoted_price: quoteFormData.quoted_price,
            admin_notes: quoteFormData.admin_notes,
            expires_at: quoteFormData.expires_at
              ? new Date(quoteFormData.expires_at).toISOString()
              : null,
          }),
        }
      );

      if (response.ok) {
        await fetchRFQs();
        setShowQuoteForm(false);
        setSelectedRfq(null);
        setQuoteFormData({
          quoted_price: 0,
          admin_notes: "",
          expires_at: "",
        });
      }
    } catch (error) {
      console.error("Error providing quote:", error);
    }
  };

  const handleExecuteTrade = async (rfqId: number) => {
    if (!confirm("Are you sure you want to execute this trade?")) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/rfq/admin/${rfqId}/execute`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_notes: "Trade executed successfully",
          }),
        }
      );

      if (response.ok) {
        await fetchRFQs();
      }
    } catch (error) {
      console.error("Error executing trade:", error);
    }
  };

  const handleUpdateStatus = async (
    rfqId: number,
    status: string,
    notes?: string
  ) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/rfq/admin/${rfqId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            admin_notes: notes || "",
          }),
        }
      );

      if (response.ok) {
        await fetchRFQs();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openQuoteForm = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    setQuoteFormData({
      quoted_price: rfq.requested_price || 0,
      admin_notes: "",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16), // 24 hours from now
    });
    setShowQuoteForm(true);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">RFQ Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="QUOTED">Quoted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXECUTED">Executed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="number"
              value={filter.user_id}
              onChange={(e) =>
                setFilter({ ...filter, user_id: e.target.value })
              }
              placeholder="Filter by user ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset ID
            </label>
            <input
              type="number"
              value={filter.asset_id}
              onChange={(e) =>
                setFilter({ ...filter, asset_id: e.target.value })
              }
              placeholder="Filter by asset ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && selectedRfq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Provide Quote
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2 text-gray-900">RFQ Details</h3>
              <p className="text-gray-700">
                <strong>User:</strong> {selectedRfq.user_email}
              </p>
              <p className="text-gray-700">
                <strong>Asset:</strong> {selectedRfq.asset_name} (
                {selectedRfq.asset_symbol})
              </p>
              <p className="text-gray-700">
                <strong>Type:</strong> {selectedRfq.rfq_type}
              </p>
              <p className="text-gray-700">
                <strong>Quantity:</strong> {selectedRfq.quantity}
              </p>
              <p className="text-gray-700">
                <strong>Requested Price:</strong> $
                {selectedRfq.requested_price || "Not specified"}
              </p>
              {selectedRfq.notes && (
                <p className="text-gray-700">
                  <strong>Notes:</strong> {selectedRfq.notes}
                </p>
              )}
            </div>

            <form onSubmit={handleProvideQuote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Quote Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quoteFormData.quoted_price}
                  onChange={(e) =>
                    setQuoteFormData({
                      ...quoteFormData,
                      quoted_price: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Admin Notes
                </label>
                <textarea
                  value={quoteFormData.admin_notes}
                  onChange={(e) =>
                    setQuoteFormData({
                      ...quoteFormData,
                      admin_notes: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Internal notes or quote details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Quote Expires At
                </label>
                <input
                  type="datetime-local"
                  value={quoteFormData.expires_at}
                  onChange={(e) =>
                    setQuoteFormData({
                      ...quoteFormData,
                      expires_at: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuoteForm(false);
                    setSelectedRfq(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Provide Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFQ List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                RFQ ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Requested Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Quoted Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rfqs.map((rfq) => (
              <tr key={rfq.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  #{rfq.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {rfq.user_email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {rfq.asset_name} ({rfq.asset_symbol})
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      rfq.rfq_type === "BUY"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {rfq.rfq_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {rfq.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {rfq.requested_price
                    ? `$${rfq.requested_price}`
                    : "Not specified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {rfq.quoted_price ? `$${rfq.quoted_price}` : "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      statusColors[rfq.status as keyof typeof statusColors]
                    }`}
                  >
                    {rfq.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(rfq.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {rfq.status === "PENDING" && (
                      <button
                        onClick={() => openQuoteForm(rfq)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Provide Quote"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}

                    {rfq.status === "ACCEPTED" && (
                      <button
                        onClick={() => handleExecuteTrade(rfq.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Execute Trade"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    )}

                    {(rfq.status === "PENDING" || rfq.status === "QUOTED") && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            rfq.id,
                            "CANCELLED",
                            "Cancelled by admin"
                          )
                        }
                        className="text-red-600 hover:text-red-800"
                        title="Cancel RFQ"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rfqs.length === 0 && (
          <div className="text-center py-8 text-gray-500">No RFQs found</div>
        )}
      </div>
    </div>
  );
}
