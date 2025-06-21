import { fetchWithAuth } from "../utils/auth";

export interface QuestionCategory {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateQuestionCategoryData {
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface UpdateQuestionCategoryData {
  name?: string;
  display_name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Public endpoints (for dropdowns)
export const getQuestionCategories = async (): Promise<QuestionCategory[]> => {
  const response = await fetch(`${API_BASE}/api/v1/question-categories/`);
  if (!response.ok) {
    throw new Error("Failed to fetch question categories");
  }
  return response.json();
};

// Admin endpoints
export const getQuestionCategoriesAdmin = async (): Promise<
  QuestionCategory[]
> => {
  const response = await fetchWithAuth(
    `${API_BASE}/api/v1/question-categories/admin/`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch question categories");
  }
  return response.json();
};

export const createQuestionCategory = async (
  data: CreateQuestionCategoryData
): Promise<QuestionCategory> => {
  const response = await fetchWithAuth(
    `${API_BASE}/api/v1/question-categories/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create question category");
  }

  return response.json();
};

export const updateQuestionCategory = async (
  id: number,
  data: UpdateQuestionCategoryData
): Promise<QuestionCategory> => {
  const response = await fetchWithAuth(
    `${API_BASE}/api/v1/question-categories/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update question category");
  }

  return response.json();
};

export const deleteQuestionCategory = async (id: number): Promise<void> => {
  const response = await fetchWithAuth(
    `${API_BASE}/api/v1/question-categories/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete question category");
  }
};
