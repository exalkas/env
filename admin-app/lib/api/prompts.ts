import { fetchWithAuth } from "../utils/auth";
import { API_URL } from "../config";

export interface PromptTemplate {
  id: number;
  name: string;
  template: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface PromptTemplateCreate {
  name: string;
  template: string;
  description?: string;
}

export interface PromptTemplateUpdate {
  name?: string;
  template?: string;
  description?: string;
  is_active?: boolean;
}

export interface PromptsFilter {
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

// Get all prompts with filtering
export const getPrompts = async (
  filters: PromptsFilter = {}
): Promise<PromptTemplate[]> => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.is_active !== undefined)
    params.append("is_active", filters.is_active.toString());
  if (filters.skip !== undefined)
    params.append("skip", filters.skip.toString());
  if (filters.limit !== undefined)
    params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const url = `${API_URL}/prompts${queryString ? `?${queryString}` : ""}`;

  const response = await fetchWithAuth(url);
  if (!response.ok) {
    throw new Error("Failed to fetch prompts");
  }

  return response.json();
};

// Get single prompt by ID
export const getPrompt = async (id: number): Promise<PromptTemplate> => {
  const response = await fetchWithAuth(`${API_URL}/prompts/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch prompt");
  }

  return response.json();
};

// Create new prompt
export const createPrompt = async (
  data: PromptTemplateCreate
): Promise<PromptTemplate> => {
  const response = await fetchWithAuth(`${API_URL}/prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create prompt");
  }

  return response.json();
};

// Update existing prompt
export const updatePrompt = async (
  id: number,
  data: PromptTemplateUpdate
): Promise<PromptTemplate> => {
  const response = await fetchWithAuth(`${API_URL}/prompts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update prompt");
  }

  return response.json();
};

// Delete prompt
export const deletePrompt = async (id: number): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/prompts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete prompt");
  }
};

// Toggle prompt status (active/inactive)
export const togglePromptStatus = async (
  id: number
): Promise<{ message: string; is_active: boolean }> => {
  const response = await fetchWithAuth(
    `${API_URL}/prompts/${id}/toggle-status`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to toggle prompt status");
  }

  return response.json();
};
