import { useState } from "react";

interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  data?: any;
}

interface UseConfirmationModalOptions {
  onConfirm?: (data?: any) => Promise<void> | void;
  onCancel?: () => void;
}

export const useConfirmationModal = (
  options: UseConfirmationModalOptions = {}
) => {
  const [state, setState] = useState<ConfirmationModalState>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onConfirm, onCancel } = options;

  const openModal = (config: Omit<ConfirmationModalState, "isOpen">) => {
    setState({
      ...config,
      isOpen: true,
    });
    setError(null);
  };

  const closeModal = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    setError(null);
    setLoading(false);

    if (onCancel) {
      onCancel();
    }
  };

  const confirm = async () => {
    if (!onConfirm) {
      closeModal();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(state.data);
      closeModal();
    } catch (err: any) {
      setError(err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = (
    itemName: string,
    data?: any,
    customMessage?: string
  ) => {
    openModal({
      title: `Delete ${itemName}`,
      message:
        customMessage ||
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      data,
    });
  };

  const showGenericConfirmation = (
    title: string,
    message: string,
    data?: any,
    variant: "danger" | "warning" | "info" = "warning"
  ) => {
    openModal({
      title,
      message,
      variant,
      data,
    });
  };

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    loading,
    error,
    openModal,
    closeModal,
    confirm,
    showDeleteConfirmation,
    showGenericConfirmation,
  };
};
