"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Order, MarketApi } from "@/lib/api/market";
import { isAuthenticated, getUser } from "@/lib/utils/auth";
import Link from "next/link";
import websocketService, { OrderStatusUpdate } from "@/lib/services/websocket";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await MarketApi.getOrders(activeTab);
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Handle order status updates via WebSocket
  const handleOrderStatusUpdate = useCallback((data: OrderStatusUpdate) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === data.order_id ? { ...order, status: data.status } : order
      )
    );
  }, []);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch orders
    fetchOrders();

    // Connect to WebSocket for real-time updates
    websocketService.connect();

    // Add event listener for order status updates
    websocketService.onOrderStatusUpdate(handleOrderStatusUpdate);

    // Clean up when component unmounts
    return () => {
      websocketService.removeEventListener(
        "order_status_update",
        handleOrderStatusUpdate
      );
    };
  }, [router, activeTab, fetchOrders, handleOrderStatusUpdate]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: number) => {
    try {
      await MarketApi.cancelOrder(orderId);

      // Refresh the orders list
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: "CANCELLED" } : order
      );

      setOrders(updatedOrders);
    } catch (err: any) {
      setError(err.message || "Failed to cancel order");
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "MATCHED":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Orders</h1>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab(undefined)}
          className={`px-4 py-2 rounded-md text-sm ${
            activeTab === undefined
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setActiveTab("OPEN")}
          className={`px-4 py-2 rounded-md text-sm ${
            activeTab === "OPEN"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`px-4 py-2 rounded-md text-sm ${
            activeTab === "COMPLETED"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab("CANCELLED")}
          className={`px-4 py-2 rounded-md text-sm ${
            activeTab === "CANCELLED"
              ? "bg-gray-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading orders...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/market/${order.asset_id}`}
                          className="text-green-600 hover:text-green-700 hover:underline"
                        >
                          Asset #{order.asset_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={
                            order.order_type === "BUY"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {order.order_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${order.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${(order.quantity * order.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.status === "OPEN" && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-red-600 hover:text-red-800 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                {activeTab
                  ? `No ${activeTab.toLowerCase()} orders found.`
                  : "No orders found."}
              </p>
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
