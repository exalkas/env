"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/shared";
import {
  PaymentGateway,
  PaymentGatewayCreate,
  PaymentGatewayUpdate,
  createPaymentGateway,
  updatePaymentGateway,
} from "@/lib/api/payments";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gateway?: PaymentGateway | null;
}

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  onSuccess,
  gateway,
}: PaymentGatewayModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "stripe" as "stripe" | "paypal" | "bank_transfer" | "adyen",
    is_active: true,
    is_live: false,
    description: "",
  });

  const isEditing = !!gateway;

  useEffect(() => {
    if (gateway) {
      setFormData({
        name: gateway.name,
        type: gateway.type,
        is_active: gateway.is_active,
        is_live: gateway.is_live,
        description: gateway.description || "",
      });
    } else {
      setFormData({
        name: "",
        type: "stripe",
        is_active: true,
        is_live: false,
        description: "",
      });
    }
  }, [gateway]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && gateway) {
        await updatePaymentGateway(
          gateway.id,
          formData as PaymentGatewayUpdate
        );
      } else {
        await createPaymentGateway(formData as PaymentGatewayCreate);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving payment gateway:", error);
      alert("Error saving payment gateway. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Payment Gateway" : "Add Payment Gateway"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g., Stripe Production"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            >
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="adyen">Adyen</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Optional description for this gateway"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Status Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Active
              </span>
            </label>
            <p className="text-xs text-gray-500">
              Enable this gateway for transactions
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_live}
                onChange={(e) =>
                  setFormData({ ...formData, is_live: e.target.checked })
                }
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Live Mode
              </span>
            </label>
            <p className="text-xs text-gray-500">Use live API credentials</p>
          </div>
        </div>

        {/* Configuration Note */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> API key configuration will be available after
            creating the gateway. You can edit the gateway to add API keys and
            other configuration details.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Gateway"
              : "Create Gateway"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
