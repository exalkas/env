import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

export interface Transaction {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_type: string;
  seller_id: number;
  seller_name: string;
  buyer_id: number;
  buyer_name: string;
  quantity: number;
  price: number;
  total_amount: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface TransactionFilter {
  asset_id?: number;
  user_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}

// Transaction API Service
export const TransactionApi = {
  // Get all transactions
  getTransactions: async (
    filters?: TransactionFilter
  ): Promise<Transaction[]> => {
    let url = `${API_URL}/transactions/`;

    if (filters) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const response = await fetchWithAuth(url);
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }
    return response.json();
  },

  // Get transaction by ID
  getTransaction: async (transactionId: number): Promise<Transaction> => {
    const response = await fetchWithAuth(
      `${API_URL}/transactions/${transactionId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch transaction");
    }
    return response.json();
  },

  // Get transaction statistics
  getTransactionStats: async (filters?: TransactionFilter): Promise<any> => {
    let url = `${API_URL}/transactions/stats`;

    if (filters) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const response = await fetchWithAuth(url);
    if (!response.ok) {
      throw new Error("Failed to fetch transaction statistics");
    }
    return response.json();
  },

  // Approve a transaction (if needed for certain transaction flows)
  approveTransaction: async (transactionId: number): Promise<Transaction> => {
    const response = await fetchWithAuth(
      `${API_URL}/transactions/${transactionId}/approve`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to approve transaction");
    }

    return response.json();
  },

  // Reject a transaction (if needed for certain transaction flows)
  rejectTransaction: async (
    transactionId: number,
    reason: string
  ): Promise<Transaction> => {
    const response = await fetchWithAuth(
      `${API_URL}/transactions/${transactionId}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to reject transaction");
    }

    return response.json();
  },

  // Get recent transactions (for dashboard)
  getRecentTransactions: async (limit: number = 10): Promise<Transaction[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/transactions/recent?limit=${limit}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch recent transactions");
    }
    return response.json();
  },
};
