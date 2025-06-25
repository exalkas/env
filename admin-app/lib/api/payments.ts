import { fetchWithAuth } from "../utils/auth";

const API_BASE_URL = "http://localhost:8000/api/v1";

// Types
export interface PaymentGateway {
  id: number;
  name: string;
  type: "stripe" | "paypal" | "bank_transfer" | "adyen";
  is_active: boolean;
  is_live: boolean;
  config?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type:
    | "credit_card"
    | "debit_card"
    | "sepa_debit"
    | "bank_transfer"
    | "paypal"
    | "bancontact";
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
  created_at: string;
  updated_at?: string;
  gateway?: PaymentGateway;
}

export interface PaymentTransaction {
  id: number;
  user_id: number;
  subscription_id?: number;
  gateway_id: number;
  payment_method_id: number;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded";
  gateway_transaction_id?: string;
  gateway_reference?: string;
  transaction_metadata?: string;
  failure_reason?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
  gateway?: PaymentGateway;
  payment_method?: PaymentMethod;
}

export interface BankTransferDetails {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string;
  iban?: string;
  swift_code?: string;
  is_active: boolean;
  is_primary: boolean;
  currency: string;
  country?: string;
  payment_instructions?: string;
  reference_format?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentStats {
  total_transactions: number;
  pending_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  total_amount: number;
  completed_amount: number;
  success_rate: number;
}

// Create/Update types
export type PaymentGatewayCreate = Omit<
  PaymentGateway,
  "id" | "created_at" | "updated_at"
>;
export type PaymentGatewayUpdate = Partial<
  Omit<PaymentGateway, "id" | "created_at" | "updated_at">
>;

export type PaymentMethodCreate = Omit<
  PaymentMethod,
  "id" | "created_at" | "updated_at" | "gateway"
>;
export type PaymentMethodUpdate = Partial<
  Omit<
    PaymentMethod,
    "id" | "created_at" | "updated_at" | "gateway" | "gateway_id"
  >
>;

export type PaymentTransactionUpdate = {
  status?: PaymentTransaction["status"];
  gateway_transaction_id?: string;
  gateway_reference?: string;
  transaction_metadata?: string;
  failure_reason?: string;
  notes?: string;
  processed_at?: string;
};

export type BankTransferDetailsCreate = Omit<
  BankTransferDetails,
  "id" | "created_at" | "updated_at"
>;
export type BankTransferDetailsUpdate = Partial<
  Omit<BankTransferDetails, "id" | "created_at" | "updated_at">
>;

// ============================================================================
// PAYMENT GATEWAYS API
// ============================================================================

export const fetchPaymentGateways = async (params?: {
  skip?: number;
  limit?: number;
}): Promise<{ gateways: PaymentGateway[]; total: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append("skip", params.skip.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const url = `${API_BASE_URL}/payments/gateways?${searchParams.toString()}`;
  const response = await fetchWithAuth(url);
  return response.json();
};

export const fetchPaymentGateway = async (
  id: number
): Promise<PaymentGateway> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/gateways/${id}`
  );
  return response.json();
};

export const createPaymentGateway = async (
  data: PaymentGatewayCreate
): Promise<PaymentGateway> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/payments/gateways`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updatePaymentGateway = async (
  id: number,
  data: PaymentGatewayUpdate
): Promise<PaymentGateway> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/gateways/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deletePaymentGateway = async (id: number): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/payments/gateways/${id}`, {
    method: "DELETE",
  });
};

// ============================================================================
// PAYMENT METHODS API
// ============================================================================

export const fetchPaymentMethods = async (params?: {
  skip?: number;
  limit?: number;
  gateway_id?: number;
  is_active?: boolean;
}): Promise<{ methods: PaymentMethod[]; total: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append("skip", params.skip.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.gateway_id)
    searchParams.append("gateway_id", params.gateway_id.toString());
  if (params?.is_active !== undefined)
    searchParams.append("is_active", params.is_active.toString());

  const url = `${API_BASE_URL}/payments/methods?${searchParams.toString()}`;
  const response = await fetchWithAuth(url);
  return response.json();
};

export const fetchPaymentMethod = async (
  id: number
): Promise<PaymentMethod> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/methods/${id}`
  );
  return response.json();
};

export const createPaymentMethod = async (
  data: PaymentMethodCreate
): Promise<PaymentMethod> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/payments/methods`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updatePaymentMethod = async (
  id: number,
  data: PaymentMethodUpdate
): Promise<PaymentMethod> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/methods/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deletePaymentMethod = async (id: number): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/payments/methods/${id}`, {
    method: "DELETE",
  });
};

// ============================================================================
// PAYMENT TRANSACTIONS API
// ============================================================================

export const fetchPaymentTransactions = async (params?: {
  skip?: number;
  limit?: number;
  status?: string;
  user_id?: number;
  gateway_id?: number;
}): Promise<{
  transactions: PaymentTransaction[];
  total: number;
  stats: PaymentStats;
}> => {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append("skip", params.skip.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.status) searchParams.append("status", params.status);
  if (params?.user_id)
    searchParams.append("user_id", params.user_id.toString());
  if (params?.gateway_id)
    searchParams.append("gateway_id", params.gateway_id.toString());

  const url = `${API_BASE_URL}/payments/transactions?${searchParams.toString()}`;
  const response = await fetchWithAuth(url);
  return response.json();
};

export const fetchPaymentTransaction = async (
  id: number
): Promise<PaymentTransaction> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/transactions/${id}`
  );
  return response.json();
};

export const updatePaymentTransaction = async (
  id: number,
  data: PaymentTransactionUpdate
): Promise<PaymentTransaction> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/transactions/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

// ============================================================================
// BANK TRANSFER DETAILS API
// ============================================================================

export const fetchBankTransferDetails = async (params?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  currency?: string;
}): Promise<{ bank_details: BankTransferDetails[]; total: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append("skip", params.skip.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.is_active !== undefined)
    searchParams.append("is_active", params.is_active.toString());
  if (params?.currency) searchParams.append("currency", params.currency);

  const url = `${API_BASE_URL}/payments/bank-details?${searchParams.toString()}`;
  const response = await fetchWithAuth(url);
  return response.json();
};

export const createBankTransferDetails = async (
  data: BankTransferDetailsCreate
): Promise<BankTransferDetails> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/bank-details`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const updateBankTransferDetails = async (
  id: number,
  data: BankTransferDetailsUpdate
): Promise<BankTransferDetails> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/payments/bank-details/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deleteBankTransferDetails = async (id: number): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/payments/bank-details/${id}`, {
    method: "DELETE",
  });
};

// ============================================================================
// STATISTICS API
// ============================================================================

export const fetchPaymentStatistics = async (): Promise<PaymentStats> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/payments/stats`);
  return response.json();
};
