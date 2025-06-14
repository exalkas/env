import { getAuthHeader } from "./auth";

let socket: WebSocket | null = null;
let eventListeners: { [key: string]: ((data: any) => void)[] } = {};

// Connection URL - using WebSocket instead of Socket.io
const SOCKET_URL = "ws://localhost:8000/ws";

// Market data event types
export enum MarketDataEvents {
  PRICE_UPDATE = "price_update",
  TRADE_EXECUTED = "trade_executed",
  MARKET_NEWS = "market_news",
  ORDER_BOOK_UPDATE = "order_book_update",
}

// Generate a random client ID
const generateClientId = (): number => {
  return Math.floor(Math.random() * 1000000);
};

// Initialize the socket connection
export const initializeSocket = (): WebSocket => {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const clientId = generateClientId();
    const wsUrl = `${SOCKET_URL}/${clientId}`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.type || data.event;

        if (eventType && eventListeners[eventType]) {
          eventListeners[eventType].forEach((callback) => callback(data));
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }

  return socket;
};

// Close the socket connection
export const closeSocket = (): void => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Send a message through WebSocket
const sendMessage = (message: any): void => {
  const ws = initializeSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn("WebSocket is not open. Message not sent:", message);
  }
};

// Subscribe to market data updates for specific assets
export const subscribeToAsset = (assetId: string): void => {
  sendMessage({ action: "subscribe_asset", asset_id: assetId });
};

// Unsubscribe from market data updates for specific assets
export const unsubscribeFromAsset = (assetId: string): void => {
  sendMessage({ action: "unsubscribe_asset", asset_id: assetId });
};

// Subscribe to all market data updates
export const subscribeToMarket = (): void => {
  sendMessage({ action: "subscribe_market" });
};

// Subscribe to user's own order updates
export const subscribeToUserOrders = (): void => {
  sendMessage({ action: "subscribe_user_orders" });
};

// Add a listener for a specific event
export const addSocketListener = (
  event: string,
  callback: (data: any) => void
): void => {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(callback);

  // Initialize socket to ensure connection
  initializeSocket();
};

// Remove a listener for a specific event
export const removeSocketListener = (
  event: string,
  callback: (data: any) => void
): void => {
  if (eventListeners[event]) {
    eventListeners[event] = eventListeners[event].filter(
      (cb) => cb !== callback
    );
  }
};

// Handle reconnection after authentication
export const reconnectWithAuth = (): void => {
  closeSocket();
  eventListeners = {}; // Clear all listeners
  initializeSocket();
};
