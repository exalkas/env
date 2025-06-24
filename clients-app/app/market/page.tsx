"use client";

import { useEffect, useState } from "react";
import { Asset, MarketApi } from "@/lib/api/market";
import { isAuthenticated, getSubscriptionType } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  Button,
  Card,
} from "@/components/shared";

export default function MarketPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch assets
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const data = await MarketApi.getAssets();
        setAssets(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load assets");
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [router]);

  const subscriptionType = getSubscriptionType();
  const isTrialUser = subscriptionType === "trial";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Green Energy Marketplace</h1>

      {isTrialUser && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <p className="text-yellow-700">
            You are currently on a trial subscription. You can view market data
            but cannot trade.
            <Link href="/upgrade" className="underline ml-2 font-medium">
              Upgrade your subscription
            </Link>{" "}
            to start trading.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" message="Loading assets..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card
                key={asset.id}
                variant="interactive"
                padding="none"
                className="overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{asset.name}</h2>
                      <p className="text-gray-500 text-sm">{asset.symbol}</p>
                    </div>
                    <StatusBadge status={asset.asset_type} size="sm" />
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold">
                      ${asset.current_price.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Last updated:{" "}
                      {new Date(asset.last_updated).toLocaleString()}
                    </p>
                  </div>

                  {asset.requires_kyc && (
                    <div className="bg-blue-50 text-blue-700 text-sm p-2 rounded mb-4">
                      KYC verification required for trading
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      href={`/market/${asset.id}`}
                      variant="success"
                      fullWidth
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {assets.length === 0 && (
            <EmptyState
              title="No assets available"
              description="No assets are available at the moment. Please check back later."
            />
          )}
        </>
      )}
    </div>
  );
}
