"use client";

import React, { useEffect } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface NotificationProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

export default function NotificationToast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}: NotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          containerClass: "bg-green-50 border-green-200",
          iconClass: "text-green-600",
          titleClass: "text-green-800",
          messageClass: "text-green-700",
          icon: CheckCircleIcon,
        };
      case "error":
        return {
          containerClass: "bg-red-50 border-red-200",
          iconClass: "text-red-600",
          titleClass: "text-red-800",
          messageClass: "text-red-700",
          icon: XCircleIcon,
        };
      case "warning":
        return {
          containerClass: "bg-yellow-50 border-yellow-200",
          iconClass: "text-yellow-600",
          titleClass: "text-yellow-800",
          messageClass: "text-yellow-700",
          icon: ExclamationTriangleIcon,
        };
      case "info":
        return {
          containerClass: "bg-blue-50 border-blue-200",
          iconClass: "text-blue-600",
          titleClass: "text-blue-800",
          messageClass: "text-blue-700",
          icon: InformationCircleIcon,
        };
      default:
        return {
          containerClass: "bg-gray-50 border-gray-200",
          iconClass: "text-gray-600",
          titleClass: "text-gray-800",
          messageClass: "text-gray-700",
          icon: InformationCircleIcon,
        };
    }
  };

  const {
    containerClass,
    iconClass,
    titleClass,
    messageClass,
    icon: Icon,
  } = getTypeStyles();

  return (
    <div
      className={`border rounded-lg p-4 shadow-md ${containerClass} transition-all duration-300 ease-in-out`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${titleClass}`}>{title}</h3>
          {message && (
            <div className={`mt-1 text-sm ${messageClass}`}>{message}</div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onDismiss(id)}
            className={`inline-flex rounded-md p-1.5 transition-colors ${
              type === "success"
                ? "text-green-600 hover:bg-green-100"
                : type === "error"
                ? "text-red-600 hover:bg-red-100"
                : type === "warning"
                ? "text-yellow-600 hover:bg-yellow-100"
                : "text-blue-600 hover:bg-blue-100"
            }`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Container component for managing multiple notifications
interface NotificationContainerProps {
  notifications: NotificationProps[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({
  notifications,
  onDismiss,
}: NotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          {...notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
