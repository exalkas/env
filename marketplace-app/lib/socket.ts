import { io, Socket } from "socket.io-client";
import { getAuthHeader } from "./auth";

let socket: Socket | null = null;

// Connection URL
const SOCKET_URL = "http://localhost:8000";

// Market data event types
export enum MarketDataEvents {
  PRICE_UPDATE = "price_update",
  TRADE_EXECUTED = "trade_executed",
  MARKET_NEWS = "market_news",
  ORDER_BOOK_UPDATE = "order_book_update",
}

// Initialize the socket connection
export const initializeSocket = (): Socket => {
  if (!socket) {
    const authHeader = getAuthHeader();

    socket = io(SOCKET_URL, {
      autoConnect: true,
      extraHeaders: authHeader || {},
    });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socket;
};

// Close the socket connection
export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Subscribe to market data updates for specific assets
export const subscribeToAsset = (assetId: string): void => {
  const socket = initializeSocket();
  socket.emit("subscribe_asset", { asset_id: assetId });
};

// Unsubscribe from market data updates for specific assets
export const unsubscribeFromAsset = (assetId: string): void => {
  if (socket) {
    socket.emit("unsubscribe_asset", { asset_id: assetId });
  }
};

// Subscribe to all market data updates
export const subscribeToMarket = (): void => {
  const socket = initializeSocket();
  socket.emit("subscribe_market");
};

// Subscribe to user's own order updates
export const subscribeToUserOrders = (): void => {
  const socket = initializeSocket();
  socket.emit("subscribe_user_orders");
};

// Add a listener for a specific event
export const addSocketListener = (
  event: string,
  callback: (data: any) => void
): void => {
  const socket = initializeSocket();
  socket.on(event, callback);
};

// Remove a listener for a specific event
export const removeSocketListener = (
  event: string,
  callback: (data: any) => void
): void => {
  if (socket) {
    socket.off(event, callback);
  }
};

// Handle reconnection after authentication
export const reconnectWithAuth = (): void => {
  closeSocket();
  initializeSocket();
};
