import { getAuthHeader } from "./auth";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Create an axios instance with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor to include auth header when available
api.interceptors.request.use((config) => {
  const authHeader = getAuthHeader();
  if (authHeader && config.headers) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

// User API
export const fetchUserData = async () => {
  try {
    const response = await api.get("/v1/users/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

// Assets API
export const fetchAssets = async (assetType?: string) => {
  try {
    const url = assetType
      ? `/v1/market/assets?type=${assetType}`
      : "/v1/market/assets";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching assets:", error);
    throw error;
  }
};

export const fetchAssetById = async (assetId: string) => {
  try {
    const response = await api.get(`/v1/market/assets/${assetId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching asset ${assetId}:`, error);
    throw error;
  }
};

// Market Data API
export const fetchMarketData = async (assetType?: string) => {
  try {
    // Fetch assets
    const assetsUrl = assetType
      ? `/v1/market/assets?type=${assetType}`
      : "/v1/market/assets";
    const assetsResponse = await api.get(assetsUrl);

    // Fetch latest news for dashboard
    const newsResponse = await api.get(
      "/v1/news/?published_only=true&limit=10"
    );

    return {
      prices: assetsResponse.data || [],
      news: newsResponse.data?.news || [],
      trades: {}, // placeholder for trade data
      orderBooks: {}, // placeholder for order book data
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw error;
  }
};

export const fetchAssetPriceHistory = async (
  assetId: string,
  timeframe: string = "1d"
) => {
  try {
    // Note: This endpoint may not exist yet, returning mock data for now
    const response = await api.get(`/v1/market/assets/${assetId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching price history for ${assetId}:`, error);
    throw error;
  }
};

// Trading API
export const placeBuyOrder = async (
  assetId: string,
  quantity: number,
  price: number
) => {
  try {
    const response = await api.post("/v1/market/orders", {
      asset_id: assetId,
      quantity,
      price,
      order_type: "BUY",
    });
    return response.data;
  } catch (error) {
    console.error("Error placing buy order:", error);
    throw error;
  }
};

export const placeSellOrder = async (
  assetId: string,
  quantity: number,
  price: number
) => {
  try {
    const response = await api.post("/v1/market/orders", {
      asset_id: assetId,
      quantity,
      price,
      order_type: "SELL",
    });
    return response.data;
  } catch (error) {
    console.error("Error placing sell order:", error);
    throw error;
  }
};

export const fetchUserOrders = async (status?: string) => {
  try {
    const url = status
      ? `/v1/market/orders?status=${status}`
      : "/v1/market/orders";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

export const fetchUserTrades = async () => {
  try {
    const response = await api.get("/v1/market/transactions");
    return response.data;
  } catch (error) {
    console.error("Error fetching user trades:", error);
    throw error;
  }
};

export const fetchUserPortfolio = async () => {
  try {
    // Note: This endpoint may not exist yet, using orders for now
    const response = await api.get("/v1/market/orders");
    return response.data;
  } catch (error) {
    console.error("Error fetching user portfolio:", error);
    throw error;
  }
};

// Watchlist API
export const fetchUserWatchlist = async () => {
  try {
    const response = await api.get("/v1/users/watchlist");
    return response.data;
  } catch (error) {
    console.error("Error fetching user watchlist:", error);
    throw error;
  }
};

export const addToWatchlist = async (assetId: string) => {
  try {
    const response = await api.post("/v1/users/watchlist", {
      asset_id: assetId,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw error;
  }
};

export const removeFromWatchlist = async (assetId: string) => {
  try {
    const response = await api.delete(`/v1/users/watchlist/${assetId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw error;
  }
};

// Subscriptions API
export const fetchPublicSubscriptions = async () => {
  try {
    const response = await api.get("/v1/subscriptions/public");
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
};

// Dedicated news API function
export const fetchNews = async (params?: {
  category?: string;
  featured_only?: boolean;
  search?: string;
  published_only?: boolean;
  limit?: number;
}) => {
  try {
    const searchParams = new URLSearchParams();

    if (params?.category) searchParams.append("category", params.category);
    if (params?.featured_only) searchParams.append("featured_only", "true");
    if (params?.search) searchParams.append("search", params.search);
    if (params?.published_only) searchParams.append("published_only", "true");
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const url = `/v1/news/?${searchParams.toString()}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};

// KYC API
export const fetchKYCStatus = async () => {
  try {
    const response = await api.get("/v1/kyc/my-kyc");
    return response.data;
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    throw error;
  }
};
