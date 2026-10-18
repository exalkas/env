"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  NotificationContainer,
  NotificationProps,
} from "@/components/shared/NotificationToast";

interface NotificationContextType {
  showNotification: (
    notification: Omit<NotificationProps, "id" | "onDismiss">
  ) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const showNotification = useCallback(
    (notification: Omit<NotificationProps, "id" | "onDismiss">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: NotificationProps = {
        ...notification,
        id,
        onDismiss: dismissNotification,
      };

      setNotifications((prev) => [...prev, newNotification]);
    },
    [dismissNotification]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "success", title, message });
    },
    [showNotification]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "error", title, message });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "warning", title, message });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "info", title, message });
    },
    [showNotification]
  );

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
