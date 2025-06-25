"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/shared";
import {
  BankTransferDetails,
  BankTransferDetailsCreate,
  BankTransferDetailsUpdate,
  createBankTransferDetails,
  updateBankTransferDetails,
} from "@/lib/api/payments";

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bankDetails?: BankTransferDetails | null;
}

export default function BankDetailsModal({
  isOpen,
  onClose,
  onSuccess,
  bankDetails,
}: BankDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    routing_number: "",
    iban: "",
    swift_code: "",
    is_active: true,
    is_primary: false,
    currency: "EUR",
    country: "",
    payment_instructions: "",
    reference_format: "",
  });

  const isEditing = !!bankDetails;

  useEffect(() => {
    if (bankDetails) {
      setFormData({
        bank_name: bankDetails.bank_name,
        account_name: bankDetails.account_name,
        account_number: bankDetails.account_number,
        routing_number: bankDetails.routing_number || "",
        iban: bankDetails.iban || "",
        swift_code: bankDetails.swift_code || "",
        is_active: bankDetails.is_active,
        is_primary: bankDetails.is_primary,
        currency: bankDetails.currency,
        country: bankDetails.country || "",
        payment_instructions: bankDetails.payment_instructions || "",
        reference_format: bankDetails.reference_format || "",
      });
    } else {
      setFormData({
        bank_name: "",
        account_name: "",
        account_number: "",
        routing_number: "",
        iban: "",
        swift_code: "",
        is_active: true,
        is_primary: false,
        currency: "EUR",
        country: "",
        payment_instructions: "",
        reference_format: "",
      });
    }
  }, [bankDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && bankDetails) {
        await updateBankTransferDetails(
          bankDetails.id,
          formData as BankTransferDetailsUpdate
        );
      } else {
        await createBankTransferDetails(formData as BankTransferDetailsCreate);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving bank details:", error);
      alert("Error saving bank details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Bank Details" : "Add Bank Details"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name *
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) =>
                setFormData({ ...formData, bank_name: e.target.value })
              }
              required
              placeholder="e.g., Deutsche Bank"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) =>
                setFormData({ ...formData, account_name: e.target.value })
              }
              required
              placeholder="Green Energy Trading Ltd."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) =>
                setFormData({ ...formData, account_number: e.target.value })
              }
              required
              placeholder="1234567890"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IBAN
            </label>
            <input
              type="text"
              value={formData.iban}
              onChange={(e) =>
                setFormData({ ...formData, iban: e.target.value })
              }
              placeholder="DE89 3704 0044 0532 0130 00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SWIFT/BIC Code
            </label>
            <input
              type="text"
              value={formData.swift_code}
              onChange={(e) =>
                setFormData({ ...formData, swift_code: e.target.value })
              }
              placeholder="DEUTDEFF"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Routing Number (US)
            </label>
            <input
              type="text"
              value={formData.routing_number}
              onChange={(e) =>
                setFormData({ ...formData, routing_number: e.target.value })
              }
              placeholder="021000021"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Location and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              placeholder="Germany"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Instructions
          </label>
          <textarea
            value={formData.payment_instructions}
            onChange={(e) =>
              setFormData({ ...formData, payment_instructions: e.target.value })
            }
            placeholder="Include your user ID in the payment reference"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Format
          </label>
          <input
            type="text"
            value={formData.reference_format}
            onChange={(e) =>
              setFormData({ ...formData, reference_format: e.target.value })
            }
            placeholder="USER-{user_id}-{timestamp}"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use {"{user_id}"} and {"{timestamp}"} as placeholders
          </p>
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
              Show this bank account to users
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_primary}
                onChange={(e) =>
                  setFormData({ ...formData, is_primary: e.target.checked })
                }
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Primary Account
              </span>
            </label>
            <p className="text-xs text-gray-500">
              Default account for this currency
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
              ? "Update Bank Details"
              : "Create Bank Details"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
