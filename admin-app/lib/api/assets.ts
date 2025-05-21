import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

export interface Asset {
  id: number;
  name: string;
  type: string;
  description: string;
  total_supply: number;
  available_supply: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_id: number | null;
  metadata: Record<string, any>;
}

export interface AssetCreateData {
  name: string;
  type: string;
  description: string;
  total_supply: number;
  price: number;
  metadata?: Record<string, any>;
}

export interface AssetUpdateData {
  name?: string;
  description?: string;
  total_supply?: number;
  price?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

// Asset API Service
export const AssetApi = {
  // Get all assets
  getAssets: async (): Promise<Asset[]> => {
    const response = await fetchWithAuth(`${API_URL}/assets/`);
    if (!response.ok) {
      throw new Error("Failed to fetch assets");
    }
    return response.json();
  },

  // Get asset by ID
  getAsset: async (assetId: number): Promise<Asset> => {
    const response = await fetchWithAuth(`${API_URL}/assets/${assetId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch asset");
    }
    return response.json();
  },

  // Create a new asset
  createAsset: async (assetData: AssetCreateData): Promise<Asset> => {
    const response = await fetchWithAuth(`${API_URL}/assets/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assetData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create asset");
    }

    return response.json();
  },

  // Update an asset
  updateAsset: async (
    assetId: number,
    assetData: AssetUpdateData
  ): Promise<Asset> => {
    const response = await fetchWithAuth(`${API_URL}/assets/${assetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assetData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update asset");
    }

    return response.json();
  },

  // Activate asset
  activateAsset: async (assetId: number): Promise<Asset> => {
    const response = await fetchWithAuth(
      `${API_URL}/assets/${assetId}/activate`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to activate asset");
    }

    return response.json();
  },

  // Deactivate asset
  deactivateAsset: async (assetId: number): Promise<Asset> => {
    const response = await fetchWithAuth(
      `${API_URL}/assets/${assetId}/deactivate`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to deactivate asset");
    }

    return response.json();
  },

  // Get asset transaction history
  getAssetTransactions: async (assetId: number): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/assets/${assetId}/transactions`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch asset transactions");
    }
    return response.json();
  },

  // Get asset price history
  getAssetPriceHistory: async (assetId: number): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/assets/${assetId}/price-history`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch asset price history");
    }
    return response.json();
  },
};
