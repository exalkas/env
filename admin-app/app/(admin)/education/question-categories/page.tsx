"use client";

import { useState, useEffect } from "react";
import {
  getQuestionCategoriesAdmin,
  createQuestionCategory,
  updateQuestionCategory,
  deleteQuestionCategory,
  QuestionCategory,
  CreateQuestionCategoryData,
  UpdateQuestionCategoryData,
} from "../../../../lib/api/question-categories";
import { useQuestionCategories } from "../../../../lib/contexts/QuestionCategoriesContext";
import {
  DataTable,
  Column,
  ActionButton,
  Button,
  LoadingSpinner,
  EmptyState,
} from "../../../../components/shared";
import { useNotifications } from "../../../../lib/hooks/useNotifications";
import { useConfirmationModal } from "../../../../lib/hooks/useConfirmationModal";
import ConfirmationModal from "../../../../components/ConfirmationModal";

interface CategoryModalData {
  id?: number;
  name: string;
  display_name: string;
  description: string;
  color: string;
  is_active: boolean;
}

const colorOptions = [
  { value: "#3B82F6", label: "Blue", color: "#3B82F6" },
  { value: "#10B981", label: "Green", color: "#10B981" },
  { value: "#F59E0B", label: "Orange", color: "#F59E0B" },
  { value: "#EF4444", label: "Red", color: "#EF4444" },
  { value: "#8B5CF6", label: "Purple", color: "#8B5CF6" },
  { value: "#06B6D4", label: "Cyan", color: "#06B6D4" },
  { value: "#6B7280", label: "Gray", color: "#6B7280" },
  { value: "#F97316", label: "Amber", color: "#F97316" },
];

export default function QuestionCategoriesPage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<QuestionCategory | null>(null);
  const [modalData, setModalData] = useState<CategoryModalData>({
    name: "",
    display_name: "",
    description: "",
    color: "#3B82F6",
    is_active: true,
  });

  const { refreshCategories } = useQuestionCategories();
  const { addNotification } = useNotifications();
  const {
    isOpen: confirmationOpen,
    title: confirmationTitle,
    message: confirmationMessage,
    loading: confirmationLoading,
    error: confirmationError,
    confirm,
    closeModal,
    showGenericConfirmation,
  } = useConfirmationModal({
    onConfirm: async (categoryId: number) => {
      try {
        await deleteQuestionCategory(categoryId);
        addNotification("success", "Question category deleted successfully");
        await fetchCategories();
        await refreshCategories(); // Refresh global context
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete question category";
        addNotification("error", message);
      }
    },
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getQuestionCategoriesAdmin();
      setCategories(data);
    } catch (error) {
      addNotification("error", "Failed to load question categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditingCategory(null);
    setModalData({
      name: "",
      display_name: "",
      description: "",
      color: "#3B82F6",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (category: QuestionCategory) => {
    setEditingCategory(category);
    setModalData({
      id: category.id,
      name: category.name,
      display_name: category.display_name,
      description: category.description || "",
      color: category.color || "#3B82F6",
      is_active: category.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        const updateData: UpdateQuestionCategoryData = {
          name: modalData.name,
          display_name: modalData.display_name,
          description: modalData.description,
          color: modalData.color,
          is_active: modalData.is_active,
        };
        await updateQuestionCategory(editingCategory.id, updateData);
        addNotification("success", "Question category updated successfully");
      } else {
        const createData: CreateQuestionCategoryData = {
          name: modalData.name,
          display_name: modalData.display_name,
          description: modalData.description,
          color: modalData.color,
          is_active: modalData.is_active,
        };
        await createQuestionCategory(createData);
        addNotification("success", "Question category created successfully");
      }

      setIsModalOpen(false);
      await fetchCategories();
      await refreshCategories(); // Refresh global context
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save question category";
      addNotification("error", message);
    }
  };

  const handleDelete = async (category: QuestionCategory) => {
    showGenericConfirmation(
      "Delete Question Category",
      `Are you sure you want to delete "${category.display_name}"? This action cannot be undone.`,
      category.id,
      "danger"
    );
  };

  const columns: Column<QuestionCategory>[] = [
    {
      key: "name",
      label: "Name",
      render: (category) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: category.color || "#3B82F6" }}
          />
          <span className="font-medium text-gray-900">{category.name}</span>
        </div>
      ),
    },
    {
      key: "display_name",
      label: "Display Name",
      render: (category) => (
        <span className="text-gray-900">{category.display_name}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (category) => (
        <span className="text-gray-600">
          {category.description || "No description"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (category) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            category.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {category.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (category) => (
        <span className="text-gray-600">
          {category.created_at
            ? new Date(category.created_at).toLocaleDateString()
            : "N/A"}
        </span>
      ),
    },
  ];

  const actions: ActionButton<QuestionCategory>[] = [
    {
      type: "edit",
      label: "Edit",
      onClick: handleEdit,
    },
    {
      type: "delete",
      label: "Delete",
      onClick: handleDelete,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Question Categories
          </h1>
          <p className="text-gray-600">
            Manage categories for organizing questions
          </p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No question categories found"
          description="Create your first question category to start organizing questions."
          action={{
            label: "Add Category",
            onClick: handleCreate,
          }}
        />
      ) : (
        <DataTable
          data={categories}
          columns={columns}
          actions={actions}
          searchPlaceholder="Search categories..."
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCategory
                ? "Edit Question Category"
                : "Add Question Category"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={modalData.name}
                  onChange={(e) =>
                    setModalData({
                      ...modalData,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="e.g., VCM"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={modalData.display_name}
                  onChange={(e) =>
                    setModalData({ ...modalData, display_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="e.g., Voluntary Carbon Markets"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={modalData.description}
                  onChange={(e) =>
                    setModalData({ ...modalData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  rows={3}
                  placeholder="Brief description of this category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setModalData({ ...modalData, color: option.value })
                      }
                      className={`w-8 h-8 rounded-full border-2 ${
                        modalData.color === option.value
                          ? "border-gray-800"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: option.color }}
                      title={option.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={modalData.is_active}
                  onChange={(e) =>
                    setModalData({ ...modalData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 text-sm text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setIsModalOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={!modalData.name || !modalData.display_name}
              >
                {editingCategory ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationOpen}
        onConfirm={confirm}
        onClose={closeModal}
        title={confirmationTitle}
        message={confirmationMessage}
        isLoading={confirmationLoading}
        error={confirmationError}
        confirmText="Delete"
        confirmButtonColor="red"
      />
    </div>
  );
}
