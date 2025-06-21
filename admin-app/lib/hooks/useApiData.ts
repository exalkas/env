import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/utils/auth";

interface UseApiDataOptions {
  immediate?: boolean;
  dependencies?: any[];
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useApiData = <T = any>(
  url: string | (() => string),
  options: UseApiDataOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { immediate = true, dependencies = [], onSuccess, onError } = options;

  const fetchData = async () => {
    const endpoint = typeof url === "function" ? url() : url;
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(endpoint);

      if (response.ok) {
        const result = await response.json();
        setData(result);

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        const errorMsg = `Failed to fetch data (${response.status})`;
        setError(errorMsg);

        if (onError) {
          onError(new Error(errorMsg));
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Network error occurred";
      setError(errorMsg);

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchData();
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch,
    reset,
  };
};
