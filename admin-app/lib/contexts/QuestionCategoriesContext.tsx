"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  QuestionCategory,
  getQuestionCategories,
} from "../api/question-categories";

interface QuestionCategoriesContextType {
  categories: QuestionCategory[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  getCategoryOptions: () => Array<{
    value: string;
    label: string;
    color?: string;
  }>;
}

const QuestionCategoriesContext = createContext<
  QuestionCategoriesContextType | undefined
>(undefined);

export const useQuestionCategories = () => {
  const context = useContext(QuestionCategoriesContext);
  if (context === undefined) {
    throw new Error(
      "useQuestionCategories must be used within a QuestionCategoriesProvider"
    );
  }
  return context;
};

interface QuestionCategoriesProviderProps {
  children: ReactNode;
}

export const QuestionCategoriesProvider: React.FC<
  QuestionCategoriesProviderProps
> = ({ children }) => {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQuestionCategories();
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load question categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    await fetchCategories();
  };

  const getCategoryOptions = () => {
    const options = categories
      .filter((cat) => cat.is_active !== false)
      .map((cat) => ({
        value: cat.name,
        label: cat.display_name,
        color: cat.color,
      }));

    return [{ value: "", label: "All Categories" }, ...options];
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <QuestionCategoriesContext.Provider
      value={{
        categories,
        loading,
        error,
        refreshCategories,
        getCategoryOptions,
      }}
    >
      {children}
    </QuestionCategoriesContext.Provider>
  );
};
