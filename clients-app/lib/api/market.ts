import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

// Asset interfaces
export interface Asset {
  id: number;
  name: string;
  symbol: string;
  asset_type: string;
  description: string | null;
  current_price: number;
  last_updated: string;
  is_active: boolean;
  requires_kyc: boolean;
}

// Order interfaces
export interface Order {
  id: number;
  user_id: number;
  asset_id: number;
  order_type: string; // "BUY" | "SELL"
  quantity: number;
  price: number;
  status: string; // "OPEN" | "MATCHED" | "CANCELLED" | "COMPLETED"
  created_at: string;
  updated_at: string;
}

export interface OrderWithAsset extends Order {
  asset: Asset;
}

// Transaction interfaces
export interface Transaction {
  id: number;
  order_id: number;
  buyer_id: number;
  seller_id: number;
  asset_id: number;
  quantity: number;
  price: number;
  total_amount: number;
  timestamp: string;
}

// Orderbook interface
export interface OrderBook {
  asset: {
    id: number;
    name: string;
    symbol: string;
    current_price: number;
  };
  buy_orders: {
    price: number;
    quantity: number;
    created_at: string;
  }[];
  sell_orders: {
    price: number;
    quantity: number;
    created_at: string;
  }[];
}

// Create Order payload
export interface CreateOrderPayload {
  asset_id: number;
  order_type: string;
  quantity: number;
  price: number;
}

// Market API Service
export const MarketApi = {
  // Asset endpoints
  getAssets: async (): Promise<Asset[]> => {
    const response = await fetchWithAuth(`${API_URL}/market/assets/`);
    if (!response.ok) {
      throw new Error("Failed to fetch assets");
    }
    return response.json();
  },

  getAsset: async (assetId: number): Promise<Asset> => {
    const response = await fetchWithAuth(`${API_URL}/market/assets/${assetId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch asset");
    }
    return response.json();
  },

  // Order endpoints
  getOrders: async (status?: string): Promise<Order[]> => {
    const url = status
      ? `${API_URL}/market/orders/?status=${status}`
      : `${API_URL}/market/orders/`;

    const response = await fetchWithAuth(url);
    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }
    return response.json();
  },

  getOrder: async (orderId: number): Promise<Order> => {
    const response = await fetchWithAuth(`${API_URL}/market/orders/${orderId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch order");
    }
    return response.json();
  },

  createOrder: async (order: CreateOrderPayload): Promise<Order> => {
    const response = await fetchWithAuth(`${API_URL}/market/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create order");
    }

    return response.json();
  },

  cancelOrder: async (orderId: number): Promise<Order> => {
    const response = await fetchWithAuth(
      `${API_URL}/market/orders/${orderId}/cancel`,
      {
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to cancel order");
    }

    return response.json();
  },

  // Market data endpoints
  getOrderBook: async (assetId: number): Promise<OrderBook> => {
    const response = await fetchWithAuth(
      `${API_URL}/market/market/orderbook/${assetId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch order book");
    }
    return response.json();
  },

  // Transaction endpoints
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await fetchWithAuth(`${API_URL}/market/transactions/`);
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }
    return response.json();
  },
};
