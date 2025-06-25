// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  payments: {
    methods: "/api/v1/payments/methods/available",
    createIntent: "/api/v1/payments/create-intent",
    confirm: "/api/v1/payments/confirm",
    history: "/api/v1/payments/history",
    bankDetails: "/api/v1/payments/bank-transfer-details",
    bankNotify: "/api/v1/payments/bank-transfer-notify",
  },
  subscriptions: {
    available: "/api/v1/subscriptions/available",
    current: "/api/v1/subscriptions/current",
    upgrade: "/api/v1/subscriptions/upgrade",
    cancel: "/api/v1/subscriptions/cancel",
  },
  auth: {
    login: "/api/v1/auth/login",
    signup: "/api/v1/auth/signup",
    refresh: "/api/v1/auth/refresh",
  },
} as const;

// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Environment checks
export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";

// WebSocket Configuration
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

// Asset Types
export const ASSET_TYPES = {
  EUA: "European Union Allowance",
  EUA2: "European Union Aviation Allowance",
  GOO: "Guarantee of Origin",
  GEO: "Green Energy Option",
  BIOFUEL: "Biofuel",
};

// Order Types
export const ORDER_TYPES = {
  BUY: "Buy",
  SELL: "Sell",
};

// Order Status
export const ORDER_STATUS = {
  OPEN: "Open",
  MATCHED: "Matched",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};
