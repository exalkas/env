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
import {
  Card,
  Button,
  FormInput,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from "@/components/shared";

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

      // Auto-fill price field with current price only if it's not set
      if (price === 0 && data.asset.current_price) {
        setPrice(data.asset.current_price);
      }
    } catch (err: any) {
      console.error("Error fetching order book:", err);
    }
  }, [assetId]); // Remove price dependency to prevent infinite loop

  // Handle real-time price updates
  const handlePriceUpdate = useCallback(
    (data: AssetPriceUpdate) => {
      if (data.asset_id === assetId) {
        setAsset((prevAsset) => {
          if (!prevAsset) return null;
          return {
            ...prevAsset,
            current_price: data.price,
            last_updated: data.last_updated,
          };
        });
      }
    },
    [assetId] // Remove asset dependency to prevent infinite loop
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

    // Clean up when component unmounts
    return () => {
      websocketService.unsubscribeFromAsset(assetId);
    };
  }, [assetId]); // Only depend on assetId to prevent infinite loop

  // Update event listeners when callbacks change
  useEffect(() => {
    websocketService.onAssetPriceUpdate(handlePriceUpdate);
    websocketService.onOrderBookUpdate(handleOrderBookUpdate);

    return () => {
      websocketService.removeEventListener(
        "asset_price_update",
        handlePriceUpdate
      );
      websocketService.removeEventListener(
        "order_book_update",
        handleOrderBookUpdate
      );
    };
  }, [handlePriceUpdate, handleOrderBookUpdate]);

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
        <LoadingSpinner size="lg" />
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

      <Card className="mb-8">
        <div className="flex flex-wrap justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <p className="text-gray-500">{asset.symbol}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge
              status={asset.asset_type}
              variant="success"
              size="sm"
            />
            {asset.requires_kyc && (
              <StatusBadge status="KYC Required" variant="neutral" size="sm" />
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Book */}
        <div className="lg:col-span-2">
          <Card>
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
                      <div className="py-4">
                        <p className="text-gray-500 text-sm text-center">
                          No buy orders
                        </p>
                      </div>
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
                      <div className="py-4">
                        <p className="text-gray-500 text-sm text-center">
                          No sell orders
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Form */}
        <div>
          <Card>
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
                  <Button
                    type="button"
                    variant={orderType === "BUY" ? "primary" : "secondary"}
                    onClick={() => setOrderType("BUY")}
                  >
                    Buy
                  </Button>
                  <Button
                    type="button"
                    variant={orderType === "SELL" ? "danger" : "secondary"}
                    onClick={() => setOrderType("SELL")}
                  >
                    Sell
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quantity
                </label>
                <FormInput
                  type="number"
                  id="quantity"
                  min={0.01}
                  step={0.01}
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
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
                <FormInput
                  type="number"
                  id="price"
                  min={0.01}
                  step={0.01}
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
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

              <Button
                type="submit"
                variant={orderType === "BUY" ? "primary" : "danger"}
                size="lg"
                className="w-full"
                disabled={
                  isSubmitting ||
                  isTrialUser ||
                  (asset.requires_kyc && !kycVerified)
                }
              >
                {isSubmitting
                  ? "Processing..."
                  : `Place ${orderType === "BUY" ? "Buy" : "Sell"} Order`}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
