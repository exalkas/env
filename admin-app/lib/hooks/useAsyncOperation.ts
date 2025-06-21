import { useState } from "react";
import { useRouter } from "next/navigation";

interface UseAsyncOperationOptions {
  onSuccess?: (data?: any) => void;
  onError?: (error: any) => void;
  redirectTo?: string;
  redirectDelay?: number;
  showNotifications?: boolean;
  addNotification?: (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => void;
}

export const useAsyncOperation = (options: UseAsyncOperationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    onSuccess,
    onError,
    redirectTo,
    redirectDelay = 1500,
    showNotifications = false,
    addNotification,
  } = options;

  const execute = async (
    operation: () => Promise<any>,
    successMessage?: string,
    errorMessage?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();

      // Handle success
      if (onSuccess) {
        onSuccess(result);
      }

      if (showNotifications && addNotification && successMessage) {
        addNotification("success", successMessage);
      }

      if (redirectTo) {
        setTimeout(() => {
          router.push(redirectTo);
        }, redirectDelay);
      }

      return result;
    } catch (err: any) {
      const errorMsg = err?.message || errorMessage || "An error occurred";
      setError(errorMsg);

      if (onError) {
        onError(err);
      }

      if (showNotifications && addNotification) {
        addNotification("error", "Operation Failed", errorMsg);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
  };

  return {
    loading,
    error,
    execute,
    reset,
  };
};
