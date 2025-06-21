import { fetchWithAuth } from "@/lib/utils/auth";

export interface NewsCategory {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface NewsCategoryCreate {
  name: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
}

export interface NewsCategoryUpdate {
  name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

// Get all categories (public endpoint)
export const getCategories = async (): Promise<NewsCategory[]> => {
  const response = await fetch("http://localhost:8000/api/v1/news-categories/");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
};

// Get all categories for admin (includes inactive)
export const getCategoriesAdmin = async (): Promise<NewsCategory[]> => {
  const response = await fetchWithAuth(
    "http://localhost:8000/api/v1/news-categories/admin/"
  );
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
};

// Create category (admin only)
export const createCategory = async (
  categoryData: NewsCategoryCreate
): Promise<NewsCategory> => {
  const response = await fetchWithAuth(
    "http://localhost:8000/api/v1/news-categories/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create category");
  }

  return response.json();
};

// Update category (admin only)
export const updateCategory = async (
  categoryId: number,
  categoryData: NewsCategoryUpdate
): Promise<NewsCategory> => {
  const response = await fetchWithAuth(
    `http://localhost:8000/api/v1/news-categories/${categoryId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update category");
  }

  return response.json();
};

// Delete category (admin only)
export const deleteCategory = async (categoryId: number): Promise<void> => {
  const response = await fetchWithAuth(
    `http://localhost:8000/api/v1/news-categories/${categoryId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete category");
  }
};
