"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { getAuthHeader } from "@/lib/auth";
import {
  CalendarIcon,
  CogIcon,
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  StatusBadge,
  LoadingSpinner,
  DataTable,
  Modal,
} from "@/components/shared";
import type { Column, ActionButton } from "@/components/shared";

interface Asset {
  id: number;
  name: string;
  symbol: string;
  asset_type: string;
  current_price: number;
  description: string;
}

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
  asset_name: string | null;
  asset_symbol: string | null;
  is_expired: boolean | null;
  days_to_expiry: number | null;
}

interface OrderFormData {
  asset_id: number;
  side: "BUY" | "SELL";
  order_type: "MARKET" | "LIMIT";
  quantity: number;
  unit: string;
  requested_price: number | null;
  delivery_start: string;
  delivery_end: string;
  vintage_year: number | null;
  registry: string;
  notes: string;
  special_instructions: string;
  expires_at: string;
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sideFilter, setSideFilter] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<OrderFormData>({
    asset_id: 0,
    side: "BUY",
    order_type: "LIMIT",
    quantity: 1,
    unit: "MT",
    requested_price: null,
    delivery_start: "",
    delivery_end: "",
    vintage_year: new Date().getFullYear(),
    registry: "EU Registry",
    notes: "",
    special_instructions: "",
    expires_at: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetchAssets();
    fetchOrders();
  }, [user, router]);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, sideFilter]);

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

  const fetchOrders = async () => {
    try {
      const authHeader = getAuthHeader();
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (sideFilter) params.append("side", sideFilter);

      const response = await fetch(
        `http://localhost:8000/api/v1/orders/?${params}`,
        {
          headers: {
            ...(authHeader && { Authorization: authHeader.Authorization }),
          },
        }
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id) {
      alert("Please select an asset");
      return;
    }

    try {
      const authHeader = getAuthHeader();

      // Prepare the order data
      const orderData = {
        ...formData,
        requested_price: formData.requested_price || null,
        delivery_start: formData.delivery_start || null,
        delivery_end: formData.delivery_end || null,
        vintage_year: formData.vintage_year || null,
        registry: formData.registry || null,
        expires_at: formData.expires_at
          ? new Date(formData.expires_at).toISOString()
          : null,
      };

      const response = await fetch("http://localhost:8000/api/v1/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader.Authorization }),
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        await fetchOrders();
        setShowForm(false);
        resetForm();
        alert("Order submitted successfully!");
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to submit order");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to submit order");
    }
  };

  const handleAcceptQuote = async (orderId: number) => {
    if (!confirm("Are you sure you want to accept this quote?")) return;

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://localhost:8000/api/v1/orders/${orderId}/accept`,
        {
          method: "PATCH",
          headers: {
            ...(authHeader && { Authorization: authHeader.Authorization }),
          },
        }
      );

      if (response.ok) {
        await fetchOrders();
        alert("Quote accepted! Waiting for execution.");
      }
    } catch (error) {
      console.error("Error accepting quote:", error);
    }
  };

  const handleRejectQuote = async (orderId: number) => {
    if (!confirm("Are you sure you want to reject this quote?")) return;

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://localhost:8000/api/v1/orders/${orderId}/reject`,
        {
          method: "PATCH",
          headers: {
            ...(authHeader && { Authorization: authHeader.Authorization }),
          },
        }
      );

      if (response.ok) {
        await fetchOrders();
        alert("Quote rejected.");
      }
    } catch (error) {
      console.error("Error rejecting quote:", error);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://localhost:8000/api/v1/orders/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            ...(authHeader && { Authorization: authHeader.Authorization }),
          },
        }
      );

      if (response.ok) {
        await fetchOrders();
        alert("Order cancelled successfully.");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      asset_id: 0,
      side: "BUY",
      order_type: "LIMIT",
      quantity: 1,
      unit: "MT",
      requested_price: null,
      delivery_start: "",
      delivery_end: "",
      vintage_year: new Date().getFullYear(),
      registry: "EU Registry",
      notes: "",
      special_instructions: "",
      expires_at: "",
    });
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const getActionButtons = (order: Order) => {
    switch (order.status) {
      case "QUOTED":
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAcceptQuote(order.id)}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => handleRejectQuote(order.id)}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        );
      case "SUBMITTED":
      case "PROCESSING":
        return (
          <button
            onClick={() => handleCancelOrder(order.id)}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        );
      default:
        return null;
    }
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

  // DataTable Configuration
  const columns: Column<Order>[] = [
    {
      key: "id",
      label: "Order Details",
      render: (order) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">#{order.id}</div>
          <div className="flex items-center space-x-2">
            <StatusBadge
              status={order.side}
              variant={order.side === "BUY" ? "success" : "error"}
              size="sm"
            />
            <span className="text-gray-500 text-xs">{order.order_type}</span>
          </div>
          {order.vintage_year && (
            <div className="text-xs text-gray-500">
              Vintage: {order.vintage_year}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "asset_name",
      label: "Asset & Quantity",
      render: (order) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{order.asset_name}</div>
          <div className="text-gray-500">{order.asset_symbol}</div>
          <div className="text-gray-500">
            {order.quantity} {order.unit}
          </div>
        </div>
      ),
    },
    {
      key: "requested_price",
      label: "Pricing",
      render: (order) => (
        <div className="text-sm">
          {order.requested_price && (
            <div className="text-gray-900">Req: €{order.requested_price}</div>
          )}
          {order.quoted_price && (
            <div className="text-green-600 font-medium">
              Quote: €{order.quoted_price}
            </div>
          )}
          {order.total_amount && (
            <div className="text-gray-600">
              Total: €{order.total_amount.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (order) => (
        <div className="flex flex-col space-y-1">
          <StatusBadge status={order.status} size="sm" />
          {order.is_expired && (
            <StatusBadge status="Expired" variant="error" size="sm" />
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (order) => (
        <span className="text-sm text-gray-500">
          {formatDate(order.created_at)}
        </span>
      ),
    },
  ];

  const actions: ActionButton<Order>[] = [
    {
      type: "view",
      onClick: (order) => openOrderDetails(order),
      show: () => true,
    },
    {
      type: "custom",
      label: "Accept Quote",
      icon: CheckIcon,
      onClick: (order) => handleAcceptQuote(order.id),
      className: "text-green-600 hover:text-green-900",
      show: (order) => order.status === "QUOTED" && !order.is_expired,
    },
    {
      type: "custom",
      label: "Reject Quote",
      icon: XMarkIcon,
      onClick: (order) => handleRejectQuote(order.id),
      className: "text-red-600 hover:text-red-900",
      show: (order) => order.status === "QUOTED" && !order.is_expired,
    },
    {
      type: "custom",
      label: "Cancel Order",
      icon: XMarkIcon,
      onClick: (order) => handleCancelOrder(order.id),
      className: "text-gray-600 hover:text-gray-900",
      show: (order) => ["SUBMITTED", "PROCESSING"].includes(order.status),
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <LoadingSpinner size="lg" message="Loading orders..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <Button
          onClick={() => setShowForm(true)}
          variant="success"
          icon={PlusIcon}
        >
          New Order
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PROCESSING">Processing</option>
              <option value="QUOTED">Quoted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="EXECUTED">Executed</option>
              <option value="SETTLED">Settled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Side Filter
            </label>
            <select
              value={sideFilter}
              onChange={(e) => setSideFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Sides</option>
              <option value="BUY">Buy Orders</option>
              <option value="SELL">Sell Orders</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setStatusFilter("");
                setSideFilter("");
              }}
              variant="secondary"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        data={orders}
        columns={columns}
        actions={actions}
        emptyState={{
          title: "No orders found",
          description: "No orders match your current filters.",
        }}
        pagination={{ pageSize: 10 }}
      />

      {/* Order Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title="Create New Order"
        size="lg"
      >
        <form onSubmit={handleSubmitOrder} className="space-y-6">
          {/* Basic Order Details */}
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value={0}>Select an asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.symbol}) - €{asset.current_price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side
              </label>
              <FormSelect
                value={formData.side}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    side: e.target.value as "BUY" | "SELL",
                  })
                }
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </FormSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Type
              </label>
              <select
                value={formData.order_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_type: e.target.value as "MARKET" | "LIMIT",
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="LIMIT">Limit Order</option>
                <option value="MARKET">Market Order</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex">
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
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="border border-l-0 border-gray-300 rounded-r-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="MT">MT</option>
                  <option value="MWh">MWh</option>
                  <option value="tCO2e">tCO2e</option>
                </select>
              </div>
            </div>

            {formData.order_type === "LIMIT" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Price (€)
                </label>
                <FormInput
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.requested_price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requested_price: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="Leave blank for market price"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vintage Year
              </label>
              <FormInput
                type="number"
                min={2020}
                max={2030}
                value={formData.vintage_year || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vintage_year: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="e.g., 2024"
              />
            </div>
          </div>

          {/* Delivery Period */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Delivery Period
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Start
                </label>
                <input
                  type="date"
                  value={formData.delivery_start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_start: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery End
                </label>
                <input
                  type="date"
                  value={formData.delivery_end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_end: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registry
              </label>
              <input
                type="text"
                value={formData.registry}
                onChange={(e) =>
                  setFormData({ ...formData, registry: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., EU Registry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Expires At
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expires_at: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Any additional notes or requirements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions
            </label>
            <textarea
              value={formData.special_instructions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  special_instructions: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Special trading instructions..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Submit Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetails && selectedOrder !== null}
        onClose={() => setShowDetails(false)}
        title={
          selectedOrder ? `Order Details #${selectedOrder.id}` : "Order Details"
        }
        size="lg"
      >
        {selectedOrder && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Order Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> #{selectedOrder.id}
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
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        statusColors[
                          selectedOrder.status as keyof typeof statusColors
                        ]
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Pricing & Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedOrder.requested_price && (
                    <div>
                      <span className="font-medium">Requested Price:</span> €
                      {selectedOrder.requested_price}
                    </div>
                  )}
                  {selectedOrder.quoted_price && (
                    <div>
                      <span className="font-medium">Quoted Price:</span> €
                      {selectedOrder.quoted_price}
                    </div>
                  )}
                  {selectedOrder.total_amount && (
                    <div>
                      <span className="font-medium">Total Amount:</span> €
                      {selectedOrder.total_amount.toLocaleString()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {formatDate(selectedOrder.created_at)}
                  </div>
                  {selectedOrder.quoted_at && (
                    <div>
                      <span className="font-medium">Quoted:</span>{" "}
                      {formatDate(selectedOrder.quoted_at)}
                    </div>
                  )}
                  {selectedOrder.expires_at && (
                    <div>
                      <span className="font-medium">Expires:</span>{" "}
                      {formatDate(selectedOrder.expires_at)}
                    </div>
                  )}
                </div>
              </div>

              {(selectedOrder.notes ||
                selectedOrder.special_instructions ||
                selectedOrder.admin_notes) && (
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Notes & Instructions
                  </h4>
                  {selectedOrder.notes && (
                    <div>
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="mt-1 p-2 bg-gray-50 rounded text-sm">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}
                  {selectedOrder.special_instructions && (
                    <div>
                      <span className="font-medium text-sm">
                        Special Instructions:
                      </span>
                      <p className="mt-1 p-2 bg-gray-50 rounded text-sm">
                        {selectedOrder.special_instructions}
                      </p>
                    </div>
                  )}
                  {selectedOrder.admin_notes && (
                    <div>
                      <span className="font-medium text-sm">Admin Notes:</span>
                      <p className="mt-1 p-2 bg-blue-50 rounded text-sm">
                        {selectedOrder.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="flex space-x-3">
                {getActionButtons(selectedOrder)}
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
