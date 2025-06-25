import { fetchWithAuth } from "../utils/auth";

export interface EmailTemplate {
  id: number;
  name: string;
  category: string;
  display_name: string;
  description?: string;
  subject: string;
  html_content: string;
  variables?: string[];
  is_active: boolean;
  is_default: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateWithStats extends EmailTemplate {
  actions_count: number;
  usage_count: number;
  last_used?: string;
}

export interface EmailAction {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  trigger_event: string;
  is_active: boolean;
  template_id?: number;
  send_immediately: boolean;
  delay_minutes: number;
  conditions?: Record<string, any>;
  created_at: string;
  updated_at: string;
  template?: EmailTemplate;
}

export interface EmailActionWithStats extends EmailAction {
  logs_count: number;
  success_rate: number;
  last_sent?: string;
}

export interface EmailActionLog {
  id: number;
  action_id: number;
  user_id: number;
  template_id?: number;
  recipient_email: string;
  subject: string;
  trigger_data?: Record<string, any>;
  sent_at?: string;
  status: string;
  error_message?: string;
  created_at: string;
  action?: EmailAction;
  template?: EmailTemplate;
}

export interface EmailCategoryStats {
  category: string;
  templates_count: number;
  actions_count: number;
  active_actions_count: number;
}

export interface EmailSystemStats {
  total_templates: number;
  total_actions: number;
  active_actions: number;
  categories_stats: EmailCategoryStats[];
  recent_logs_count: number;
}

export interface CreateTemplateData {
  name: string;
  category: string;
  display_name: string;
  description?: string;
  subject: string;
  html_content: string;
  variables?: string[];
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  category?: string;
  display_name?: string;
  description?: string;
  subject?: string;
  html_content?: string;
  variables?: string[];
  is_active?: boolean;
  is_default?: boolean;
}

export interface CreateActionData {
  name: string;
  display_name: string;
  description?: string;
  category: string;
  trigger_event: string;
  is_active?: boolean;
  template_id?: number;
  send_immediately?: boolean;
  delay_minutes?: number;
  conditions?: Record<string, any>;
}

export interface UpdateActionData {
  name?: string;
  display_name?: string;
  description?: string;
  category?: string;
  trigger_event?: string;
  is_active?: boolean;
  template_id?: number;
  send_immediately?: boolean;
  delay_minutes?: number;
  conditions?: Record<string, any>;
}

export interface TriggerEmailRequest {
  user_id: number;
  trigger_event: string;
  trigger_data?: Record<string, any>;
}

export interface SendTemplateEmailRequest {
  template_id: number;
  recipient_email: string;
  variables?: Record<string, any>;
}

export interface BulkEmailRequest {
  template_id: number;
  recipient_emails: string[];
  variables?: Record<string, any>;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Email Templates
export const getTemplates = async (
  category?: string,
  is_active?: boolean,
  skip: number = 0,
  limit: number = 100
): Promise<EmailTemplateWithStats[]> => {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (is_active !== undefined) params.append("is_active", is_active.toString());
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());

  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/templates?${params}`
  );
  return response.json();
};

export const getTemplate = async (id: number): Promise<EmailTemplate> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/templates/${id}`
  );
  return response.json();
};

export const createTemplate = async (
  data: CreateTemplateData
): Promise<EmailTemplate> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/templates`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const updateTemplate = async (
  id: number,
  data: UpdateTemplateData
): Promise<EmailTemplate> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/templates/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await fetchWithAuth(`${BASE_URL}/api/v1/email-management/templates/${id}`, {
    method: "DELETE",
  });
};

// Email Actions
export const getActions = async (
  category?: string,
  is_active?: boolean,
  trigger_event?: string,
  skip: number = 0,
  limit: number = 100
): Promise<EmailActionWithStats[]> => {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (is_active !== undefined) params.append("is_active", is_active.toString());
  if (trigger_event) params.append("trigger_event", trigger_event);
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());

  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/actions?${params}`
  );
  return response.json();
};

export const getAction = async (id: number): Promise<EmailAction> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/actions/${id}`
  );
  return response.json();
};

export const createAction = async (
  data: CreateActionData
): Promise<EmailAction> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/actions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const updateAction = async (
  id: number,
  data: UpdateActionData
): Promise<EmailAction> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/actions/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deleteAction = async (id: number): Promise<void> => {
  await fetchWithAuth(`${BASE_URL}/api/v1/email-management/actions/${id}`, {
    method: "DELETE",
  });
};

// Email Action Logs
export const getLogs = async (
  action_id?: number,
  user_id?: number,
  status?: string,
  skip: number = 0,
  limit: number = 100
): Promise<EmailActionLog[]> => {
  const params = new URLSearchParams();
  if (action_id) params.append("action_id", action_id.toString());
  if (user_id) params.append("user_id", user_id.toString());
  if (status) params.append("status", status);
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());

  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/logs?${params}`
  );
  return response.json();
};

// System Management
export const getSystemStats = async (): Promise<EmailSystemStats> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/stats`
  );
  return response.json();
};

export const triggerEmailAction = async (
  data: TriggerEmailRequest
): Promise<any> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/trigger`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const sendTemplateEmail = async (
  data: SendTemplateEmailRequest
): Promise<any> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/send-template`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const sendBulkEmail = async (data: BulkEmailRequest): Promise<any> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/send-bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

// Configuration
export const getCategories = async (): Promise<{ categories: string[] }> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/categories`
  );
  return response.json();
};

export const getTriggerEvents = async (): Promise<{
  trigger_events: string[];
}> => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/v1/email-management/trigger-events`
  );
  return response.json();
};

// Constants
export const EMAIL_CATEGORIES = [
  "authentication",
  "kyc",
  "subscription",
  "trading",
  "system",
  "marketing",
  "notifications",
];

export const TRIGGER_EVENTS = [
  "after_user_signup",
  "before_user_login",
  "after_password_reset",
  "kyc_status_change",
  "subscription_activated",
  "subscription_cancelled",
  "subscription_upgraded",
  "order_placed",
  "order_filled",
  "payment_received",
  "payment_failed",
  "system_maintenance",
  "weekly_report",
  "monthly_summary",
];

export const EMAIL_STATUS_COLORS = {
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  skipped: "bg-gray-100 text-gray-800",
};

export const CATEGORY_COLORS = {
  authentication: "bg-blue-100 text-blue-800",
  kyc: "bg-purple-100 text-purple-800",
  subscription: "bg-green-100 text-green-800",
  trading: "bg-orange-100 text-orange-800",
  system: "bg-gray-100 text-gray-800",
  marketing: "bg-pink-100 text-pink-800",
  notifications: "bg-indigo-100 text-indigo-800",
};
