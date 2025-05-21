import { getToken } from "../utils/auth";
import { WS_URL } from "../config";

export interface WebSocketMessage {
  event: string;
  [key: string]: any;
}

export interface AssetPriceUpdate {
  asset_id: number;
  price: number;
  last_updated: string;
}

export interface OrderBookUpdate {
  asset_id: number;
  order_book: any;
}

export interface OrderStatusUpdate {
  order_id: number;
  status: string;
}

export interface TransactionNotification {
  transaction: any;
  role: "buyer" | "seller";
}

type WebSocketEventCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, WebSocketEventCallback[]> = new Map();
  private subscribedAssets: Set<number> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize event listeners map with empty arrays
    [
      "asset_price_update",
      "order_book_update",
      "order_status_update",
      "transaction_created",
      "connected",
      "disconnected",
    ].forEach((event) => {
      this.eventListeners.set(event, []);
    });
  }

  public connect(): void {
    if (this.socket) {
      return;
    }

    const token = getToken();
    let url = `${WS_URL}/ws`;

    // Add auth token if available
    if (token) {
      url += `?token=${token}`;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
        this.resetReconnectTimer();
        this.startPingInterval();

        // Notify connected listeners
        this.notifyEventListeners("connected", {});

        // Resubscribe to assets
        this.subscribedAssets.forEach((assetId) => {
          this.subscribeToAsset(assetId);
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle event-specific listeners
          if (message.event && this.eventListeners.has(message.event)) {
            this.notifyEventListeners(message.event, message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("WebSocket disconnected");
        this.isConnected = false;
        this.stopPingInterval();

        // Notify disconnected listeners
        this.notifyEventListeners("disconnected", {});

        // Attempt to reconnect
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.socket?.close();
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnected = false;
    this.resetReconnectTimer();
    this.stopPingInterval();
  }

  private notifyEventListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer === null) {
      this.reconnectTimer = setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        this.reconnectTimer = null;
        this.connect();
      }, 5000); // Reconnect after 5 seconds
    }
  }

  private resetReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.send(JSON.stringify({ action: "ping" }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Subscribe to an asset's updates
  public subscribeToAsset(assetId: number): void {
    if (!this.isConnected || !this.socket) {
      // Add to set for when connection is established
      this.subscribedAssets.add(assetId);
      return;
    }

    this.subscribedAssets.add(assetId);
    this.socket.send(
      JSON.stringify({
        action: "subscribe",
        asset_id: assetId,
      })
    );
  }

  // Unsubscribe from an asset's updates
  public unsubscribeFromAsset(assetId: number): void {
    this.subscribedAssets.delete(assetId);

    if (!this.isConnected || !this.socket) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        action: "unsubscribe",
        asset_id: assetId,
      })
    );
  }

  // Event listener registration
  public onAssetPriceUpdate(callback: (data: AssetPriceUpdate) => void): void {
    this.addEventListener("asset_price_update", callback);
  }

  public onOrderBookUpdate(callback: (data: OrderBookUpdate) => void): void {
    this.addEventListener("order_book_update", callback);
  }

  public onOrderStatusUpdate(
    callback: (data: OrderStatusUpdate) => void
  ): void {
    this.addEventListener("order_status_update", callback);
  }

  public onTransactionCreated(
    callback: (data: TransactionNotification) => void
  ): void {
    this.addEventListener("transaction_created", callback);
  }

  public onConnected(callback: () => void): void {
    this.addEventListener("connected", callback);
  }

  public onDisconnected(callback: () => void): void {
    this.addEventListener("disconnected", callback);
  }

  // Generic method to add event listeners
  private addEventListener(
    event: string,
    callback: WebSocketEventCallback
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.push(callback);
  }

  // Generic method to remove event listeners
  public removeEventListener(
    event: string,
    callback: WebSocketEventCallback
  ): void {
    if (!this.eventListeners.has(event)) {
      return;
    }

    const listeners = this.eventListeners.get(event)!;
    const index = listeners.indexOf(callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
