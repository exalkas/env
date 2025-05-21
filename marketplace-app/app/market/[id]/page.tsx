"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Asset,
  OrderBook,
  CreateOrderPayload,
  MarketApi,
} from "@/lib/api/market";
import {
  isAuthenticated,
  getSubscriptionType,
  isKycVerified,
} from "@/lib/utils/auth";
import Link from "next/link";
import websocketService, {
  AssetPriceUpdate,
  OrderBookUpdate,
} from "@/lib/services/websocket";

export default function AssetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const assetId = parseInt(params.id);
  const router = useRouter();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order form state
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // User permissions
  const subscriptionType = getSubscriptionType();
  const isTrialUser = subscriptionType === "trial";
  const kycVerified = isKycVerified();

  // Get orderbook from API
  const fetchOrderBook = useCallback(async () => {
    try {
      const data = await MarketApi.getOrderBook(assetId);
      setOrderBook(data);

      // Auto-fill price field with current price
      if (!price && data.asset.current_price) {
        setPrice(data.asset.current_price);
      }
    } catch (err: any) {
      console.error("Error fetching order book:", err);
    }
  }, [assetId, price]);

  // Handle real-time price updates
  const handlePriceUpdate = useCallback(
    (data: AssetPriceUpdate) => {
      if (data.asset_id === assetId && asset) {
        setAsset({
          ...asset,
          current_price: data.price,
          last_updated: data.last_updated,
        });
      }
    },
    [assetId, asset]
  );

  // Handle real-time order book updates
  const handleOrderBookUpdate = useCallback(
    (data: OrderBookUpdate) => {
      if (data.asset_id === assetId) {
        fetchOrderBook();
      }
    },
    [assetId, fetchOrderBook]
  );

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch asset details and order book
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch asset details
        const assetData = await MarketApi.getAsset(assetId);
        setAsset(assetData);

        // Fetch order book
        await fetchOrderBook();

        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load asset details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Connect to WebSocket
    websocketService.connect();

    // Subscribe to price updates
    websocketService.subscribeToAsset(assetId);

    // Add event listeners
    websocketService.onAssetPriceUpdate(handlePriceUpdate);
    websocketService.onOrderBookUpdate(handleOrderBookUpdate);

    // Clean up when component unmounts
    return () => {
      websocketService.unsubscribeFromAsset(assetId);
      websocketService.removeEventListener(
        "asset_price_update",
        handlePriceUpdate
      );
      websocketService.removeEventListener(
        "order_book_update",
        handleOrderBookUpdate
      );
    };
  }, [
    assetId,
    router,
    fetchOrderBook,
    handlePriceUpdate,
    handleOrderBookUpdate,
  ]);

  // Handle order submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTrialUser) {
      setOrderError(
        "Trial users cannot place orders. Please upgrade your subscription."
      );
      return;
    }

    if (asset?.requires_kyc && !kycVerified) {
      setOrderError("KYC verification required to trade this asset.");
      return;
    }

    try {
      setIsSubmitting(true);
      setOrderError(null);
      setOrderSuccess(null);

      const orderData: CreateOrderPayload = {
        asset_id: assetId,
        order_type: orderType,
        quantity,
        price,
      };

      await MarketApi.createOrder(orderData);

      // Reset form
      setQuantity(1);

      // Refresh order book
      await fetchOrderBook();

      setOrderSuccess(
        `${orderType === "BUY" ? "Buy" : "Sell"} order placed successfully!`
      );
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error || "Asset not found"}</p>
          <Link
            href="/market"
            className="text-red-700 underline mt-2 inline-block"
          >
            Return to Market
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/market" className="text-green-600 hover:text-green-700">
          &larr; Back to Market
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-wrap justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <p className="text-gray-500">{asset.symbol}</p>
          </div>
          <div>
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded">
              {asset.asset_type}
            </span>
            {asset.requires_kyc && (
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded ml-2">
                KYC Required
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Current Price</h2>
          <p className="text-4xl font-bold text-green-600">
            ${asset.current_price.toFixed(2)}
          </p>
          <p className="text-gray-500 text-sm">
            Last updated: {new Date(asset.last_updated).toLocaleString()}
          </p>
        </div>

        {asset.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-700">{asset.description}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Book */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Book</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Buy Orders */}
              <div>
                <h3 className="text-green-600 font-medium mb-2">Buy Orders</h3>
                <div className="bg-gray-50 rounded p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm font-medium mb-2">
                    <div>Price</div>
                    <div>Quantity</div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {orderBook?.buy_orders &&
                    orderBook.buy_orders.length > 0 ? (
                      orderBook.buy_orders.map((order, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-2 text-sm py-1 border-b border-gray-200"
                        >
                          <div className="text-green-600">
                            ${order.price.toFixed(2)}
                          </div>
                          <div>{order.quantity}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm py-2">
                        No buy orders
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sell Orders */}
              <div>
                <h3 className="text-red-600 font-medium mb-2">Sell Orders</h3>
                <div className="bg-gray-50 rounded p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm font-medium mb-2">
                    <div>Price</div>
                    <div>Quantity</div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {orderBook?.sell_orders &&
                    orderBook.sell_orders.length > 0 ? (
                      orderBook.sell_orders.map((order, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-2 text-sm py-1 border-b border-gray-200"
                        >
                          <div className="text-red-600">
                            ${order.price.toFixed(2)}
                          </div>
                          <div>{order.quantity}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm py-2">
                        No sell orders
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Place Order</h2>

            {isTrialUser && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                <p className="text-yellow-700 text-sm">
                  Trial users can only view the market.
                  <Link href="/upgrade" className="underline ml-1 font-medium">
                    Upgrade
                  </Link>{" "}
                  to start trading.
                </p>
              </div>
            )}

            {asset.requires_kyc && !kycVerified && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                <p className="text-blue-700 text-sm">
                  KYC verification required to trade this asset.
                  <Link
                    href="/profile/kyc"
                    className="underline ml-1 font-medium"
                  >
                    Complete KYC
                  </Link>
                </p>
              </div>
            )}

            {orderError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
                <p className="text-red-700 text-sm">{orderError}</p>
              </div>
            )}

            {orderSuccess && (
              <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
                <p className="text-green-700 text-sm">{orderSuccess}</p>
              </div>
            )}

            <form onSubmit={handleSubmitOrder}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md text-center ${
                      orderType === "BUY"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setOrderType("BUY")}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md text-center ${
                      orderType === "SELL"
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setOrderType("SELL")}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
                  required
                />
              </div>

              <div className="mb-2">
                <p className="text-sm font-medium">
                  Total:{" "}
                  <span className="text-lg">
                    ${(price * quantity).toFixed(2)}
                  </span>
                </p>
              </div>

              <button
                type="submit"
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  orderType === "BUY"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={
                  isSubmitting ||
                  isTrialUser ||
                  (asset.requires_kyc && !kycVerified)
                }
              >
                {isSubmitting
                  ? "Processing..."
                  : `Place ${orderType === "BUY" ? "Buy" : "Sell"} Order`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
