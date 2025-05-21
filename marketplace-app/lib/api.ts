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
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

// Assets API
export const fetchAssets = async (assetType?: string) => {
  try {
    const url = assetType ? `/assets?type=${assetType}` : "/assets";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching assets:", error);
    throw error;
  }
};

export const fetchAssetById = async (assetId: string) => {
  try {
    const response = await api.get(`/assets/${assetId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching asset ${assetId}:`, error);
    throw error;
  }
};

// Market Data API
export const fetchMarketData = async (assetType?: string) => {
  try {
    const url = assetType ? `/market/data?type=${assetType}` : "/market/data";
    const response = await api.get(url);
    return response.data;
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
    const response = await api.get(
      `/market/history/${assetId}?timeframe=${timeframe}`
    );
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
    const response = await api.post("/trading/buy", {
      asset_id: assetId,
      quantity,
      price,
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
    const response = await api.post("/trading/sell", {
      asset_id: assetId,
      quantity,
      price,
    });
    return response.data;
  } catch (error) {
    console.error("Error placing sell order:", error);
    throw error;
  }
};

export const fetchUserOrders = async (status?: string) => {
  try {
    const url = status ? `/trading/orders?status=${status}` : "/trading/orders";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

export const fetchUserTrades = async () => {
  try {
    const response = await api.get("/trading/trades");
    return response.data;
  } catch (error) {
    console.error("Error fetching user trades:", error);
    throw error;
  }
};

export const fetchUserPortfolio = async () => {
  try {
    const response = await api.get("/trading/portfolio");
    return response.data;
  } catch (error) {
    console.error("Error fetching user portfolio:", error);
    throw error;
  }
};

// Watchlist API
export const fetchUserWatchlist = async () => {
  try {
    const response = await api.get("/users/watchlist");
    return response.data;
  } catch (error) {
    console.error("Error fetching user watchlist:", error);
    throw error;
  }
};

export const addToWatchlist = async (assetId: string) => {
  try {
    const response = await api.post("/users/watchlist", { asset_id: assetId });
    return response.data;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw error;
  }
};

export const removeFromWatchlist = async (assetId: string) => {
  try {
    const response = await api.delete(`/users/watchlist/${assetId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw error;
  }
};
