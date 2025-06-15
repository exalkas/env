"use client";

import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  getPrompts,
  deletePrompt,
  togglePromptStatus,
  type PromptTemplate,
  type PromptsFilter,
} from "../../../lib/api/prompts";
import PromptModal from "../../../components/PromptModal";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(
    null
  );

  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation modal states
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: PromptsFilter = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter === "active") filters.is_active = true;
      if (statusFilter === "inactive") filters.is_active = false;

      const data = await getPrompts(filters);
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPrompts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter]);

  // Handle delete
  const handleDelete = (prompt: PromptTemplate) => {
    setConfirmationModal({
      isOpen: true,
      title: "Delete Prompt",
      message: `Are you sure you want to delete "${prompt.name}"? This action cannot be undone.`,
      onConfirm: () => performDelete(prompt),
      isLoading: false,
    });
  };

  const performDelete = async (prompt: PromptTemplate) => {
    setConfirmationModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await deletePrompt(prompt.id);
      setPrompts(prompts.filter((p) => p.id !== prompt.id));
      showSuccessMessage("Prompt deleted successfully");
      setConfirmationModal((prev) => ({
        ...prev,
        isOpen: false,
        isLoading: false,
      }));
    } catch (err) {
      showErrorMessage(
        err instanceof Error ? err.message : "Failed to delete prompt"
      );
      setConfirmationModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (prompt: PromptTemplate) => {
    try {
      const result = await togglePromptStatus(prompt.id);
      setPrompts(
        prompts.map((p) =>
          p.id === prompt.id ? { ...p, is_active: result.is_active } : p
        )
      );
      showSuccessMessage(result.message);
    } catch (err) {
      showErrorMessage(
        err instanceof Error ? err.message : "Failed to toggle status"
      );
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedPrompt(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openViewModal = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchPrompts();
    showSuccessMessage(
      modalMode === "create"
        ? "Prompt created successfully"
        : "Prompt updated successfully"
    );
  };

  // Notification helpers
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Templates</h1>
          <p className="text-gray-600">
            Manage AI prompt templates for news generation
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Prompt
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPrompts}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No prompts found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create First Prompt
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prompts.map((prompt) => (
                  <tr key={prompt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {prompt.name}
                        </div>
                        {prompt.is_default && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {prompt.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(prompt)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          prompt.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        } transition-colors`}
                      >
                        {prompt.is_active ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(prompt.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openViewModal(prompt)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(prompt)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {!prompt.is_default && (
                        <button
                          onClick={() => handleDelete(prompt)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <PromptModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          prompt={selectedPrompt}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        isLoading={confirmationModal.isLoading}
      />
    </div>
  );
}
