import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

export interface Subscription {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
  features: string | null;
  max_concurrent_users: number;
  created_at: string;
  updated_at: string | null;
}

// Subscription API Service
export const SubscriptionApi = {
  // Get all subscriptions
  getSubscriptions: async (): Promise<Subscription[]> => {
    const response = await fetchWithAuth(`${API_URL}/subscriptions/`);
    if (!response.ok) {
      throw new Error("Failed to fetch subscriptions");
    }
    return response.json();
  },

  // Get subscription by ID
  getSubscription: async (subscriptionId: number): Promise<Subscription> => {
    const response = await fetchWithAuth(
      `${API_URL}/subscriptions/${subscriptionId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch subscription");
    }
    return response.json();
  },

  // Create new subscription
  createSubscription: async (subscriptionData: {
    name: string;
    display_name: string;
    description: string | null;
    price: number;
    duration_days: number;
    is_active: boolean;
    features: string | null;
    max_concurrent_users: number;
  }): Promise<Subscription> => {
    const response = await fetchWithAuth(`${API_URL}/subscriptions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create subscription");
    }

    return response.json();
  },

  // Update subscription
  updateSubscription: async (
    subscriptionId: number,
    subscriptionData: Partial<Subscription>
  ): Promise<Subscription> => {
    const response = await fetchWithAuth(
      `${API_URL}/subscriptions/${subscriptionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update subscription");
    }

    return response.json();
  },

  // Delete subscription
  deleteSubscription: async (subscriptionId: number): Promise<void> => {
    const response = await fetchWithAuth(
      `${API_URL}/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete subscription");
    }
  },
};
