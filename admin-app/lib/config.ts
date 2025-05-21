// API Configuration
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

// Order Status
export const ORDER_STATUS = {
  OPEN: "Open",
  MATCHED: "Matched",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};
