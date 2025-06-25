"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  initializeSocket,
  addSocketListener,
  removeSocketListener,
  subscribeToMarket,
  MarketDataEvents,
} from "./socket";
import { fetchMarketData } from "./api";

// Asset price data type
interface AssetPrice {
  id: string;
  symbol: string;
  name: string;
  type: string;
  price: number;
  change_24h: number;
  change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  updated_at: string;
}

// Market news item type
interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  assets: string[]; // Asset IDs related to this news
}

// Trade data type
interface TradeData {
  id: string;
  asset_id: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  executed_at: string;
}

// Order book entry type
interface OrderBookEntry {
  price: number;
  quantity: number;
}

// Order book data type
interface OrderBook {
  asset_id: string;
  bids: OrderBookEntry[]; // Buy orders
  asks: OrderBookEntry[]; // Sell orders
  updated_at: string;
}

// Market context type
interface MarketContextType {
  assetPrices: Record<string, AssetPrice>;
  latestNews: MarketNews[];
  recentTrades: Record<string, TradeData[]>;
  orderBooks: Record<string, OrderBook>;
  loading: boolean;
  error: string | null;
  refreshMarketData: () => Promise<void>;
  initializeMarketData: () => Promise<void>;
}

// Create context
const MarketContext = createContext<MarketContextType | undefined>(undefined);

// Provider component
export const MarketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [assetPrices, setAssetPrices] = useState<Record<string, AssetPrice>>(
    {}
  );
  const [latestNews, setLatestNews] = useState<MarketNews[]>([]);
  const [recentTrades, setRecentTrades] = useState<Record<string, TradeData[]>>(
    {}
  );
  const [orderBooks, setOrderBooks] = useState<Record<string, OrderBook>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize market data only when requested
  const initializeMarketData = async () => {
    if (isInitialized) return;

    console.log("Initializing market data...");
    setLoading(true);
    setError(null);

    try {
      // Fetch initial market data
      const marketData = await fetchMarketData();
      console.log("Market data received:", marketData);

      // Update state with initial data
      if (marketData.prices) {
        const pricesMap: Record<string, AssetPrice> = {};
        marketData.prices.forEach((price: AssetPrice) => {
          pricesMap[price.id] = price;
        });
        setAssetPrices(pricesMap);
        console.log(
          "Asset prices updated:",
          Object.keys(pricesMap).length,
          "assets"
        );
      }

      if (marketData.news) {
        setLatestNews(marketData.news);
        console.log("Latest news updated:", marketData.news.length, "articles");
      } else {
        console.warn("No news data in market response");
      }

      if (marketData.trades) {
        setRecentTrades(marketData.trades);
      }

      if (marketData.orderBooks) {
        setOrderBooks(marketData.orderBooks);
      }

      // Initialize socket connection
      initializeSocket();

      // Subscribe to market updates
      subscribeToMarket();

      // Set up socket listeners for real-time updates
      setupSocketListeners();

      setIsInitialized(true);
      console.log("Market data initialization complete");
    } catch (err) {
      console.error("Error initializing market data:", err);
      setError("Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        cleanupSocketListeners();
      }
    };
  }, [isInitialized]);

  // Set up socket listeners for real-time data
  const setupSocketListeners = () => {
    // Price updates
    addSocketListener(MarketDataEvents.PRICE_UPDATE, (data: AssetPrice) => {
      setAssetPrices((prev) => ({
        ...prev,
        [data.id]: data,
      }));
    });

    // Trade execution updates
    addSocketListener(MarketDataEvents.TRADE_EXECUTED, (data: TradeData) => {
      setRecentTrades((prev) => {
        const assetTrades = prev[data.asset_id] || [];
        const updatedTrades = [data, ...assetTrades].slice(0, 50); // Keep last 50 trades

        return {
          ...prev,
          [data.asset_id]: updatedTrades,
        };
      });
    });

    // Market news updates
    addSocketListener(MarketDataEvents.MARKET_NEWS, (data: MarketNews) => {
      setLatestNews((prev) => [data, ...prev].slice(0, 20)); // Keep last 20 news items
    });

    // Order book updates
    addSocketListener(MarketDataEvents.ORDER_BOOK_UPDATE, (data: OrderBook) => {
      setOrderBooks((prev) => ({
        ...prev,
        [data.asset_id]: data,
      }));
    });
  };

  // Clean up socket listeners
  const cleanupSocketListeners = () => {
    Object.values(MarketDataEvents).forEach((event) => {
      removeSocketListener(event, () => {});
    });
  };

  // Refresh market data
  const refreshMarketData = async () => {
    setLoading(true);
    setError(null);

    try {
      const marketData = await fetchMarketData();

      // Update state with fresh data
      if (marketData.prices) {
        const pricesMap: Record<string, AssetPrice> = {};
        marketData.prices.forEach((price: AssetPrice) => {
          pricesMap[price.id] = price;
        });
        setAssetPrices(pricesMap);
      }

      if (marketData.news) {
        setLatestNews(marketData.news);
      }

      if (marketData.trades) {
        setRecentTrades(marketData.trades);
      }

      if (marketData.orderBooks) {
        setOrderBooks(marketData.orderBooks);
      }
    } catch (err) {
      console.error("Error refreshing market data:", err);
      setError("Failed to refresh market data");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    assetPrices,
    latestNews,
    recentTrades,
    orderBooks,
    loading,
    error,
    refreshMarketData,
    initializeMarketData,
  };

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  );
};

// Hook for using the market context
export const useMarket = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error("useMarket must be used within a MarketProvider");
  }

  // Initialize market data when the hook is first used
  useEffect(() => {
    context.initializeMarketData();
  }, []);

  return context;
};
