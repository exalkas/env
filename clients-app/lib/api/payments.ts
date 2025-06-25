import { getAuthHeader } from "../auth";
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from "../config";
import axios from "axios";

// Create an axios instance with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor to include auth header when available
api.interceptors.request.use((config) => {
  const authHeader = getAuthHeader();
  if (authHeader && config.headers) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

// Types
export interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  gateway_id: number;
  is_active: boolean;
  is_instant: boolean;
  processing_time?: string;
  fee_percentage: number;
  fee_fixed: number;
  currency: string;
  description?: string;
  icon_url?: string;
  display_order: number;
  gateway?: {
    id: number;
    name: string;
    type: string;
    is_active: boolean;
    is_live: boolean;
  };
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_id: number;
  subscription_id?: number;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  payment_method_id: number;
  subscription_id?: number;
  return_url?: string;
}

export interface Subscription {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_months: number;
  features: string[];
  is_active: boolean;
  is_popular?: boolean;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  subscription_id: number;
  status: "active" | "cancelled" | "expired" | "pending";
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  subscription: Subscription;
}

// ============================================================================
// PAYMENT METHODS API (Client-facing)
// ============================================================================

export const fetchAvailablePaymentMethods = async (): Promise<
  PaymentMethod[]
> => {
  try {
    const response = await api.get(API_ENDPOINTS.payments.methods);
    return response.data.methods || [];
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }
};

// ============================================================================
// PAYMENT INTENT API (Stripe Integration)
// ============================================================================

export const createPaymentIntent = async (
  data: CreatePaymentIntentRequest
): Promise<PaymentIntent> => {
  try {
    const response = await api.post(API_ENDPOINTS.payments.createIntent, data);
    return response.data;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};

export const confirmPayment = async (
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<{ success: boolean; payment_intent: PaymentIntent }> => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.payments.confirm}/${paymentIntentId}`,
      {
        payment_method_id: paymentMethodId,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error confirming payment:", error);
    throw error;
  }
};

// ============================================================================
// SUBSCRIPTION API (Client-facing)
// ============================================================================

export const fetchAvailableSubscriptions = async (): Promise<
  Subscription[]
> => {
  try {
    const response = await api.get(API_ENDPOINTS.subscriptions.available);
    return response.data.subscriptions || [];
  } catch (error) {
    console.error("Error fetching available subscriptions:", error);
    throw error;
  }
};

export const fetchUserSubscription =
  async (): Promise<UserSubscription | null> => {
    try {
      const response = await api.get(API_ENDPOINTS.subscriptions.current);
      return response.data;
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      return null;
    }
  };

export const upgradeSubscription = async (
  subscriptionId: number,
  paymentMethodId: number
): Promise<{
  payment_intent?: PaymentIntent;
  subscription: UserSubscription;
}> => {
  try {
    const response = await api.post(API_ENDPOINTS.subscriptions.upgrade, {
      subscription_id: subscriptionId,
      payment_method_id: paymentMethodId,
    });
    return response.data;
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    throw error;
  }
};

export const cancelSubscription = async (): Promise<void> => {
  try {
    await api.post(API_ENDPOINTS.subscriptions.cancel);
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw error;
  }
};

// ============================================================================
// PAYMENT HISTORY API
// ============================================================================

export const fetchUserPaymentHistory = async (params?: {
  limit?: number;
  status?: string;
}): Promise<{
  transactions: Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    payment_method: PaymentMethod;
    subscription?: Subscription;
    created_at: string;
    processed_at?: string;
  }>;
  total: number;
}> => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) searchParams.append("status", params.status);

    const response = await api.get(
      `${API_ENDPOINTS.payments.history}?${searchParams.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching payment history:", error);
    throw error;
  }
};

// ============================================================================
// BANK TRANSFER API
// ============================================================================

export const fetchBankTransferDetails = async (): Promise<{
  bank_name: string;
  account_name: string;
  iban: string;
  swift_code: string;
  payment_instructions: string;
  reference_format: string;
}> => {
  try {
    const response = await api.get(API_ENDPOINTS.payments.bankDetails);
    return response.data;
  } catch (error) {
    console.error("Error fetching bank transfer details:", error);
    throw error;
  }
};

export const notifyBankTransfer = async (data: {
  amount: number;
  reference: string;
  transfer_date: string;
  subscription_id?: number;
}): Promise<void> => {
  try {
    await api.post(API_ENDPOINTS.payments.bankNotify, data);
  } catch (error) {
    console.error("Error notifying bank transfer:", error);
    throw error;
  }
};
