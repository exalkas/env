"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { getAuthHeader } from "@/lib/auth";

interface Asset {
  id: number;
  name: string;
  symbol: string;
  asset_type: string;
  current_price: number;
  description: string;
}

interface RFQ {
  id: number;
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
  asset_name: string | null;
  asset_symbol: string | null;
}

interface RFQFormData {
  asset_id: number;
  rfq_type: "BUY" | "SELL";
  quantity: number;
  requested_price: number | null;
  notes: string;
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<RFQFormData>({
    asset_id: 0,
    rfq_type: "BUY",
    quantity: 1,
    requested_price: null,
    notes: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetchAssets();
    fetchRFQs();
  }, [user, router]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/market/assets"
      );
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const fetchRFQs = async () => {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("http://localhost:8000/api/v1/rfq/", {
        headers: {
          ...(authHeader && { Authorization: authHeader.Authorization }),
        },
      });

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

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id) {
      alert("Please select an asset");
      return;
    }

    try {
      const authHeader = getAuthHeader();
      const response = await fetch("http://localhost:8000/api/v1/rfq/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader.Authorization }),
        },
        body: JSON.stringify({
          ...formData,
          requested_price: formData.requested_price || null,
        }),
      });

      if (response.ok) {
        await fetchRFQs();
        setShowForm(false);
        setFormData({
          asset_id: 0,
          rfq_type: "BUY",
          quantity: 1,
          requested_price: null,
          notes: "",
        });
        alert("RFQ submitted successfully!");
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to submit RFQ");
      }
    } catch (error) {
      console.error("Error submitting RFQ:", error);
      alert("Failed to submit RFQ");
    }
  };

  const handleAcceptQuote = async (rfqId: number) => {
    if (!confirm("Are you sure you want to accept this quote?")) return;

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://localhost:8000/api/v1/rfq/${rfqId}/accept`,
        {
          method: "PATCH",
          headers: {
            ...(authHeader && { Authorization: authHeader.Authorization }),
          },
        }
      );

      if (response.ok) {
        await fetchRFQs();
        alert("Quote accepted! Waiting for execution.");
      }
    } catch (error) {
      console.error("Error accepting quote:", error);
    }
  };

  const handleRejectQuote = async (rfqId: number) => {
    if (!confirm("Are you sure you want to reject this quote?")) return;

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://localhost:8000/api/v1/rfq/${rfqId}/reject`,
        {
          method: "PATCH",
          headers: {
            ...(authHeader && { Authorization: authHeader.Authorization }),
          },
        }
      );

      if (response.ok) {
        await fetchRFQs();
        alert("Quote rejected.");
      }
    } catch (error) {
      console.error("Error rejecting quote:", error);
    }
  };

  const handleCancelRFQ = async (rfqId: number) => {
    if (!confirm("Are you sure you want to cancel this RFQ?")) return;

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://localhost:8000/api/v1/rfq/${rfqId}`,
        {
          method: "DELETE",
          headers: {
            ...(authHeader && { Authorization: authHeader.Authorization }),
          },
        }
      );

      if (response.ok) {
        await fetchRFQs();
        alert("RFQ cancelled.");
      }
    } catch (error) {
      console.error("Error cancelling RFQ:", error);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access RFQ features.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Request for Quote (RFQ)
          </h1>
          <p className="text-gray-600">
            Submit a request for quote on green energy assets and get
            personalized pricing
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 text-white px-6 py-3 rounded-md font-medium hover:bg-green-600 transition-colors"
        >
          New RFQ
        </button>
      </div>

      {/* RFQ Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit RFQ</h2>

            <form onSubmit={handleSubmitRFQ} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset
                  </label>
                  <select
                    value={formData.asset_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        asset_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select an asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol}) - ${asset.current_price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.rfq_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rfq_type: e.target.value as "BUY" | "SELL",
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Price (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.requested_price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requested_price: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Leave blank for market price"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any specific requirements or notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Submit RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFQ List */}
      <div className="space-y-4">
        {rfqs.map((rfq) => (
          <div key={rfq.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    RFQ #{rfq.id} - {rfq.asset_name} ({rfq.asset_symbol})
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      rfq.rfq_type === "BUY"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {rfq.rfq_type}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      statusColors[rfq.status as keyof typeof statusColors]
                    }`}
                  >
                    {rfq.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Quantity:</span>{" "}
                    {rfq.quantity}
                  </div>
                  <div>
                    <span className="font-medium">Requested Price:</span>{" "}
                    {rfq.requested_price
                      ? `$${rfq.requested_price}`
                      : "Market Price"}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(rfq.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {rfq.status === "QUOTED" && (
                  <>
                    <button
                      onClick={() => handleAcceptQuote(rfq.id)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectQuote(rfq.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </>
                )}

                {(rfq.status === "PENDING" || rfq.status === "QUOTED") && (
                  <button
                    onClick={() => handleCancelRFQ(rfq.id)}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={() => setSelectedRfq(rfq)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Details
                </button>
              </div>
            </div>

            {rfq.notes && (
              <div className="mb-3 p-3 bg-gray-50 rounded">
                <h4 className="font-medium text-gray-900 mb-1">Your Notes:</h4>
                <p className="text-gray-700 text-sm">{rfq.notes}</p>
              </div>
            )}

            {rfq.status === "QUOTED" && rfq.quoted_price && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Quote Received
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">
                      Quoted Price:
                    </span>{" "}
                    ${rfq.quoted_price}
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">
                      Total Amount:
                    </span>{" "}
                    ${rfq.total_amount}
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Expires:</span>{" "}
                    {rfq.expires_at
                      ? new Date(rfq.expires_at).toLocaleDateString()
                      : "No expiration"}
                  </div>
                </div>
                {rfq.admin_notes && (
                  <div className="mt-2">
                    <span className="font-medium text-blue-800">
                      Broker Notes:
                    </span>
                    <p className="text-blue-700 text-sm mt-1">
                      {rfq.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {rfq.status === "EXECUTED" && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  Trade Executed
                </h4>
                <p className="text-green-700 text-sm">
                  Your RFQ has been successfully executed. The trade has been
                  completed.
                </p>
              </div>
            )}
          </div>
        ))}

        {rfqs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              No RFQs submitted yet
            </div>
            <p className="text-gray-400 mb-4">
              Submit your first RFQ to get started with personalized quotes
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-500 text-white px-6 py-2 rounded-md font-medium hover:bg-green-600"
            >
              Submit RFQ
            </button>
          </div>
        )}
      </div>

      {/* RFQ Details Modal */}
      {selectedRfq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                RFQ #{selectedRfq.id} Details
              </h2>
              <button
                onClick={() => setSelectedRfq(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Asset</h4>
                  <p className="text-gray-700">
                    {selectedRfq.asset_name} ({selectedRfq.asset_symbol})
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Type</h4>
                  <p className="text-gray-700">{selectedRfq.rfq_type}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Quantity</h4>
                  <p className="text-gray-700">{selectedRfq.quantity}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      statusColors[
                        selectedRfq.status as keyof typeof statusColors
                      ]
                    }`}
                  >
                    {selectedRfq.status}
                  </span>
                </div>
              </div>

              {selectedRfq.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Your Notes</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedRfq.notes}
                  </p>
                </div>
              )}

              {selectedRfq.admin_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Broker Notes
                  </h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded">
                    {selectedRfq.admin_notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900">Created</h4>
                  <p>{new Date(selectedRfq.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Last Updated</h4>
                  <p>{new Date(selectedRfq.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
