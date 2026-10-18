// Re-export hooks from admin-app lib/hooks
export { useNotifications } from "../../../admin-app/lib/hooks/useNotifications";
export type { Notification } from "../../../admin-app/lib/hooks/useNotifications";

export { useAsyncOperation } from "../../../admin-app/lib/hooks/useAsyncOperation";

// Local hooks for clients-app
export { useConfirmationModal } from "./useConfirmationModal";
