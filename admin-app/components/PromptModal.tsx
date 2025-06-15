"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  createPrompt,
  updatePrompt,
  type PromptTemplate,
  type PromptTemplateCreate,
  type PromptTemplateUpdate,
} from "../lib/api/prompts";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  prompt?: PromptTemplate | null;
  onSuccess: () => void;
}

export default function PromptModal({
  isOpen,
  onClose,
  mode,
  prompt,
  onSuccess,
}: PromptModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    template: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or prompt changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        setFormData({
          name: "",
          template: "",
          description: "",
        });
      } else if (prompt) {
        setFormData({
          name: prompt.name,
          template: prompt.template,
          description: prompt.description || "",
        });
      }
      setError(null);
    }
  }, [isOpen, mode, prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "view") return;

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.template.trim()) {
      setError("Template content is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "create") {
        const createData: PromptTemplateCreate = {
          name: formData.name.trim(),
          template: formData.template.trim(),
          description: formData.description.trim() || undefined,
        };
        await createPrompt(createData);
      } else if (mode === "edit" && prompt) {
        const updateData: PromptTemplateUpdate = {
          name: formData.name.trim(),
          template: formData.template.trim(),
          description: formData.description.trim() || undefined,
        };
        await updatePrompt(prompt.id, updateData);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const modalTitle =
    mode === "create"
      ? "Create Prompt Template"
      : mode === "edit"
      ? "Edit Prompt Template"
      : "View Prompt Template";

  const isReadOnly = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                placeholder="Enter prompt name"
                readOnly={isReadOnly}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                placeholder="Brief description of the prompt"
                readOnly={isReadOnly}
              />
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Content *
              </label>
              <textarea
                value={formData.template}
                onChange={(e) => handleInputChange("template", e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-900"
                placeholder="Enter your prompt template here..."
                readOnly={isReadOnly}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use variables like {"{date_range}"}, {"{news_content}"}, etc. as
                placeholders
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </button>

          {mode !== "view" && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {mode === "create" ? "Create" : "Update"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
