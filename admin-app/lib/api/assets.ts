import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

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

export interface AssetCreateData {
  name: string;
  symbol: string;
  asset_type: string;
  description: string;
  current_price: number;
  requires_kyc?: boolean;
}

export interface AssetUpdateData {
  name?: string;
  description?: string;
  current_price?: number;
  is_active?: boolean;
  requires_kyc?: boolean;
}

// Asset API Service
export const AssetApi = {
  // Get all assets (admin endpoint - includes inactive assets)
  getAssets: async (): Promise<Asset[]> => {
    const response = await fetchWithAuth(`${API_URL}/market/assets/admin/`);
    if (!response.ok) {
      throw new Error("Failed to fetch assets");
    }
    return response.json();
  },

  // Get asset by ID
  getAsset: async (assetId: number): Promise<Asset> => {
    const response = await fetchWithAuth(`${API_URL}/market/assets/${assetId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch asset");
    }
    return response.json();
  },

  // Create a new asset
  createAsset: async (assetData: AssetCreateData): Promise<Asset> => {
    const response = await fetchWithAuth(`${API_URL}/market/assets/`, {
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
    const response = await fetchWithAuth(
      `${API_URL}/market/assets/${assetId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assetData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update asset");
    }

    return response.json();
  },

  // Activate asset
  activateAsset: async (assetId: number): Promise<Asset> => {
    return AssetApi.updateAsset(assetId, { is_active: true });
  },

  // Deactivate asset
  deactivateAsset: async (assetId: number): Promise<Asset> => {
    return AssetApi.updateAsset(assetId, { is_active: false });
  },

  // Get asset transaction history
  getAssetTransactions: async (assetId: number): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/market/assets/${assetId}/transactions`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch asset transactions");
    }
    return response.json();
  },

  // Get asset price history
  getAssetPriceHistory: async (assetId: number): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/market/assets/${assetId}/price-history`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch asset price history");
    }
    return response.json();
  },
};
