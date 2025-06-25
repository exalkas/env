"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/shared";
import {
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodUpdate,
  PaymentGateway,
  createPaymentMethod,
  updatePaymentMethod,
  fetchPaymentGateways,
} from "@/lib/api/payments";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  method?: PaymentMethod | null;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  method,
}: PaymentMethodModalProps) {
  const [loading, setLoading] = useState(false);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "credit_card" as const,
    gateway_id: 0,
    is_active: true,
    is_instant: true,
    processing_time: "",
    fee_percentage: 0,
    fee_fixed: 0,
    currency: "EUR",
    description: "",
    icon_url: "",
    display_order: 1,
  });

  const isEditing = !!method;

  useEffect(() => {
    if (isOpen) {
      loadGateways();
    }
  }, [isOpen]);

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name,
        type: method.type,
        gateway_id: method.gateway_id,
        is_active: method.is_active,
        is_instant: method.is_instant,
        processing_time: method.processing_time || "",
        fee_percentage: method.fee_percentage,
        fee_fixed: method.fee_fixed,
        currency: method.currency,
        description: method.description || "",
        icon_url: method.icon_url || "",
        display_order: method.display_order,
      });
    } else {
      setFormData({
        name: "",
        type: "credit_card",
        gateway_id: 0,
        is_active: true,
        is_instant: true,
        processing_time: "",
        fee_percentage: 0,
        fee_fixed: 0,
        currency: "EUR",
        description: "",
        icon_url: "",
        display_order: 1,
      });
    }
  }, [method]);

  const loadGateways = async () => {
    try {
      const data = await fetchPaymentGateways({ limit: 100 });
      setGateways(data.gateways.filter((g) => g.is_active));
    } catch (error) {
      console.error("Error loading gateways:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && method) {
        await updatePaymentMethod(method.id, formData as PaymentMethodUpdate);
      } else {
        await createPaymentMethod(formData as PaymentMethodCreate);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving payment method:", error);
      alert("Error saving payment method. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Payment Method" : "Add Payment Method"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Method Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g., Visa/Mastercard"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Gateway *
            </label>
            <select
              value={formData.gateway_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gateway_id: parseInt(e.target.value),
                })
              }
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            >
              <option value={0}>Select a gateway</option>
              {gateways.map((gateway) => (
                <option key={gateway.id} value={gateway.id}>
                  {gateway.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="sepa_debit">SEPA Debit</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="bancontact">Bancontact</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency *
            </label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Fee Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage Fee (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.fee_percentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fee_percentage: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="2.9"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Fee ({formData.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.fee_fixed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fee_fixed: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.25"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Processing Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Time
            </label>
            <input
              type="text"
              value={formData.processing_time}
              onChange={(e) =>
                setFormData({ ...formData, processing_time: e.target.value })
              }
              placeholder="e.g., Instant, 1-3 business days"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: parseInt(e.target.value) || 1,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
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
            placeholder="Optional description for this payment method"
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
            <p className="text-xs text-gray-500">Enable this payment method</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_instant}
                onChange={(e) =>
                  setFormData({ ...formData, is_instant: e.target.checked })
                }
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Instant Payment
              </span>
            </label>
            <p className="text-xs text-gray-500">
              Payment is processed immediately
            </p>
          </div>
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
              ? "Update Method"
              : "Create Method"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
