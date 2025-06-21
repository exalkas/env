"use client";

import { useState, useEffect } from "react";
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  CogIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "../../../lib/utils/auth";

interface Order {
  id: number;
  user_id: number;
  asset_id: number;
  side: string;
  order_type: string;
  quantity: number;
  unit: string;
  requested_price: number | null;
  indicative_price: number | null;
  quoted_price: number | null;
  markup_amount: number | null;
  total_amount: number | null;
  delivery_start: string | null;
  delivery_end: string | null;
  vintage_year: number | null;
  registry: string | null;
  status: string;
  priority: string;
  notes: string | null;
  admin_notes: string | null;
  special_instructions: string | null;
  external_trade_ref: string | null;
  settlement_ref: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  quoted_at: string | null;
  accepted_at: string | null;
  executed_at: string | null;
  settled_at: string | null;
  quoted_by: number | null;
  executed_by: number | null;
  settled_by: number | null;
  user_email: string | null;
  asset_name: string | null;
  asset_symbol: string | null;
  quoted_by_name: string | null;
  executed_by_name: string | null;
  settled_by_name: string | null;
  is_expired: boolean | null;
  days_to_expiry: number | null;
}

interface QuoteFormData {
  quoted_price: number;
  markup_amount: number;
  admin_notes: string;
  expires_at: string;
  external_trade_ref: string;
}

const statusColors = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  QUOTED: "bg-indigo-100 text-indigo-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXECUTED: "bg-purple-100 text-purple-800",
  SETTLED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState({
    status: "",
    side: "",
    priority: "",
    user_id: "",
    asset_id: "",
  });

  const [quoteFormData, setQuoteFormData] = useState<QuoteFormData>({
    quoted_price: 0,
    markup_amount: 0,
    admin_notes: "",
    expires_at: "",
    external_trade_ref: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        ...(filter.status && { status: filter.status }),
        ...(filter.side && { side: filter.side }),
        ...(filter.priority && { priority: filter.priority }),
        ...(filter.user_id && { user_id: filter.user_id }),
        ...(filter.asset_id && { asset_id: filter.asset_id }),
      });

      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/orders/admin/all?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvideQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/orders/admin/${selectedOrder.id}/quote`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoted_price: quoteFormData.quoted_price,
            markup_amount: quoteFormData.markup_amount,
            admin_notes: quoteFormData.admin_notes,
            external_trade_ref: quoteFormData.external_trade_ref,
            expires_at: quoteFormData.expires_at
              ? new Date(quoteFormData.expires_at).toISOString()
              : null,
          }),
        }
      );

      if (response.ok) {
        await fetchOrders();
        setShowQuoteForm(false);
        setSelectedOrder(null);
        resetQuoteForm();
      }
    } catch (error) {
      console.error("Error providing quote:", error);
    }
  };

  const handleExecuteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to execute this order?")) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/orders/admin/${orderId}/execute`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_notes: "Order executed successfully",
          }),
        }
      );

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error executing order:", error);
    }
  };

  const handleSettleOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to settle this order?")) return;

    const settlementRef = prompt("Enter settlement reference:");
    if (!settlementRef) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/orders/admin/${orderId}/settle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settlement_ref: settlementRef,
            admin_notes: "Order settled successfully",
          }),
        }
      );

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error settling order:", error);
    }
  };

  const handleUpdateStatus = async (
    orderId: number,
    status: string,
    notes?: string
  ) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/orders/admin/${orderId}/status`,
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
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openQuoteForm = (order: Order) => {
    setSelectedOrder(order);
    setQuoteFormData({
      quoted_price: order.requested_price || order.indicative_price || 0,
      markup_amount: 0.5, // Default markup
      admin_notes: "",
      external_trade_ref: "",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16), // 24 hours from now
    });
    setShowQuoteForm(true);
  };

  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const resetQuoteForm = () => {
    setQuoteFormData({
      quoted_price: 0,
      markup_amount: 0,
      admin_notes: "",
      expires_at: "",
      external_trade_ref: "",
    });
  };

  const getActionButtons = (order: Order) => {
    switch (order.status) {
      case "SUBMITTED":
        return (
          <>
            <button
              onClick={() => handleUpdateStatus(order.id, "PROCESSING")}
              className="text-orange-600 hover:text-orange-900 mr-3"
              title="Mark as Processing"
            >
              <CogIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => openQuoteForm(order)}
              className="text-blue-600 hover:text-blue-900"
              title="Provide Quote"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </>
        );
      case "PROCESSING":
        return (
          <button
            onClick={() => openQuoteForm(order)}
            className="text-blue-600 hover:text-blue-900"
            title="Provide Quote"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        );
      case "ACCEPTED":
        return (
          <button
            onClick={() => handleExecuteOrder(order.id)}
            className="text-purple-600 hover:text-purple-900"
            title="Execute Order"
          >
            <PlayIcon className="h-5 w-5" />
          </button>
        );
      case "EXECUTED":
        return (
          <button
            onClick={() => handleSettleOrder(order.id)}
            className="text-green-600 hover:text-green-900"
            title="Settle Order"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Order Management
        </h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PROCESSING">Processing</option>
                <option value="QUOTED">Quoted</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="EXECUTED">Executed</option>
                <option value="SETTLED">Settled</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side
              </label>
              <select
                value={filter.side}
                onChange={(e) => setFilter({ ...filter, side: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sides</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filter.priority}
                onChange={(e) =>
                  setFilter({ ...filter, priority: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="User email or asset symbol..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  User & Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Status & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">#{order.id}</div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            order.side === "BUY"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.side}
                        </span>
                        <span className="text-gray-500">
                          {order.order_type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.quantity} {order.unit}
                        {order.vintage_year && ` (${order.vintage_year})`}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{order.user_email}</div>
                      <div className="text-gray-500">
                        {order.asset_name} ({order.asset_symbol})
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.requested_price && (
                        <div>Requested: €{order.requested_price}</div>
                      )}
                      {order.quoted_price && (
                        <div>Quoted: €{order.quoted_price}</div>
                      )}
                      {order.total_amount && (
                        <div className="font-medium">
                          Total: €{order.total_amount}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          statusColors[
                            order.status as keyof typeof statusColors
                          ]
                        }`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          priorityColors[
                            order.priority as keyof typeof priorityColors
                          ]
                        }`}
                      >
                        {order.priority}
                      </span>
                      {order.is_expired && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">
                          <ClockIcon className="h-3 w-3 inline mr-1" />
                          Expired
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openDetailsModal(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {getActionButtons(order)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Provide Quote for Order #{selectedOrder.id}
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User:</span>{" "}
                    {selectedOrder.user_email}
                  </div>
                  <div>
                    <span className="font-medium">Asset:</span>{" "}
                    {selectedOrder.asset_name}
                  </div>
                  <div>
                    <span className="font-medium">Side:</span>{" "}
                    {selectedOrder.side}
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span>{" "}
                    {selectedOrder.quantity} {selectedOrder.unit}
                  </div>
                  <div>
                    <span className="font-medium">Requested Price:</span> €
                    {selectedOrder.requested_price || "Market"}
                  </div>
                  <div>
                    <span className="font-medium">Indicative Price:</span> €
                    {selectedOrder.indicative_price || "N/A"}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProvideQuote} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quote Price (€)
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Markup Amount (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quoteFormData.markup_amount}
                      onChange={(e) =>
                        setQuoteFormData({
                          ...quoteFormData,
                          markup_amount: parseFloat(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External Trade Reference
                  </label>
                  <input
                    type="text"
                    value={quoteFormData.external_trade_ref}
                    onChange={(e) =>
                      setQuoteFormData({
                        ...quoteFormData,
                        external_trade_ref: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="External provider reference..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuoteForm(false);
                      setSelectedOrder(null);
                      resetQuoteForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Provide Quote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details #{selectedOrder.id}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Order Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">ID:</span> #
                      {selectedOrder.id}
                    </div>
                    <div>
                      <span className="font-medium">User:</span>{" "}
                      {selectedOrder.user_email}
                    </div>
                    <div>
                      <span className="font-medium">Asset:</span>{" "}
                      {selectedOrder.asset_name} ({selectedOrder.asset_symbol})
                    </div>
                    <div>
                      <span className="font-medium">Side:</span>{" "}
                      {selectedOrder.side}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {selectedOrder.order_type}
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span>{" "}
                      {selectedOrder.quantity} {selectedOrder.unit}
                    </div>
                    {selectedOrder.vintage_year && (
                      <div>
                        <span className="font-medium">Vintage:</span>{" "}
                        {selectedOrder.vintage_year}
                      </div>
                    )}
                    {selectedOrder.registry && (
                      <div>
                        <span className="font-medium">Registry:</span>{" "}
                        {selectedOrder.registry}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Pricing & Settlement
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.requested_price && (
                      <div>
                        <span className="font-medium">Requested Price:</span> €
                        {selectedOrder.requested_price}
                      </div>
                    )}
                    {selectedOrder.indicative_price && (
                      <div>
                        <span className="font-medium">Indicative Price:</span> €
                        {selectedOrder.indicative_price}
                      </div>
                    )}
                    {selectedOrder.quoted_price && (
                      <div>
                        <span className="font-medium">Quoted Price:</span> €
                        {selectedOrder.quoted_price}
                      </div>
                    )}
                    {selectedOrder.markup_amount && (
                      <div>
                        <span className="font-medium">Markup:</span> €
                        {selectedOrder.markup_amount}
                      </div>
                    )}
                    {selectedOrder.total_amount && (
                      <div>
                        <span className="font-medium">Total Amount:</span> €
                        {selectedOrder.total_amount}
                      </div>
                    )}
                    {selectedOrder.external_trade_ref && (
                      <div>
                        <span className="font-medium">External Ref:</span>{" "}
                        {selectedOrder.external_trade_ref}
                      </div>
                    )}
                    {selectedOrder.settlement_ref && (
                      <div>
                        <span className="font-medium">Settlement Ref:</span>{" "}
                        {selectedOrder.settlement_ref}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </div>
                    {selectedOrder.quoted_at && (
                      <div>
                        <span className="font-medium">Quoted:</span>{" "}
                        {new Date(selectedOrder.quoted_at).toLocaleString()}
                      </div>
                    )}
                    {selectedOrder.accepted_at && (
                      <div>
                        <span className="font-medium">Accepted:</span>{" "}
                        {new Date(selectedOrder.accepted_at).toLocaleString()}
                      </div>
                    )}
                    {selectedOrder.executed_at && (
                      <div>
                        <span className="font-medium">Executed:</span>{" "}
                        {new Date(selectedOrder.executed_at).toLocaleString()}
                      </div>
                    )}
                    {selectedOrder.settled_at && (
                      <div>
                        <span className="font-medium">Settled:</span>{" "}
                        {new Date(selectedOrder.settled_at).toLocaleString()}
                      </div>
                    )}
                    {selectedOrder.expires_at && (
                      <div>
                        <span className="font-medium">Expires:</span>{" "}
                        {new Date(selectedOrder.expires_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Notes & Instructions
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.notes && (
                      <div>
                        <span className="font-medium">User Notes:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded">
                          {selectedOrder.notes}
                        </p>
                      </div>
                    )}
                    {selectedOrder.special_instructions && (
                      <div>
                        <span className="font-medium">
                          Special Instructions:
                        </span>
                        <p className="mt-1 p-2 bg-gray-50 rounded">
                          {selectedOrder.special_instructions}
                        </p>
                      </div>
                    )}
                    {selectedOrder.admin_notes && (
                      <div>
                        <span className="font-medium">Admin Notes:</span>
                        <p className="mt-1 p-2 bg-blue-50 rounded">
                          {selectedOrder.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
