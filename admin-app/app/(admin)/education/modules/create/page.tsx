"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  LoadingSpinner,
} from "@/components/shared";
import { useNotifications, useFormData, useAsyncOperation } from "@/lib/hooks";
import {
  getLearningPaths,
  createModule,
  type LearningPath,
} from "@/lib/api/education";

interface ModuleForm {
  learning_path_id: number;
  title: string;
  description: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
}

export default function CreateModule() {
  const router = useRouter();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(true);

  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  // Fetch learning paths on component mount
  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoadingPaths(true);
        const paths = await getLearningPaths({ is_active: true });
        setLearningPaths(paths);
      } catch (error: any) {
        addNotification(
          "error",
          error.message || "Failed to fetch learning paths"
        );
      } finally {
        setLoadingPaths(false);
      }
    };

    fetchLearningPaths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { formData, errors, updateField, validate } = useFormData<ModuleForm>({
    initialData: {
      learning_path_id: 0,
      title: "",
      description: "",
      estimated_duration: 60,
      sort_order: 1,
      is_active: true,
    },
    validator: (data: ModuleForm) => {
      const errors: Record<string, string> = {};
      if (data.learning_path_id === 0)
        errors.learning_path_id = "Please select a learning path";
      if (!data.title.trim()) errors.title = "Title is required";
      if (!data.description.trim())
        errors.description = "Description is required";
      if (data.estimated_duration <= 0)
        errors.estimated_duration = "Duration must be greater than 0";
      return errors;
    },
  });

  const { loading: submitting, execute: handleSubmit } = useAsyncOperation({
    onSuccess: (result) => {
      addNotification("success", "Module created successfully!");
      setTimeout(() => router.push("/education/modules"), 1500);
    },
    onError: (error: any) => {
      addNotification("error", error.message);
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await handleSubmit(async () => {
      if (!validate()) {
        throw new Error("Please fix validation errors");
      }

      return await createModule(formData.learning_path_id, {
        title: formData.title,
        description: formData.description,
        estimated_duration: formData.estimated_duration,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      });
    });
  };

  if (loadingPaths) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeLearningPaths =
    learningPaths?.filter((path) => path.is_active) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Notifications */}
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`mb-4 p-4 rounded-md ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : notification.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : notification.type === "warning"
              ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{notification.title}</span>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/education/modules"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Modules
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Module</h1>
        <p className="mt-2 text-gray-600">
          Create a new learning module within a learning path
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Learning Path Selection */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Learning Path
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Learning Path *
              </label>
              <FormSelect
                value={formData.learning_path_id}
                onChange={(e) =>
                  updateField("learning_path_id", parseInt(e.target.value))
                }
                error={errors.learning_path_id}
                required
              >
                <option value={0}>Choose a learning path...</option>
                {activeLearningPaths.map((path) => (
                  <option key={path.id} value={path.id}>
                    {path.title} ({path.level})
                  </option>
                ))}
              </FormSelect>
              {errors.learning_path_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.learning_path_id}
                </p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Module Information
            </h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module Title *
              </label>
              <FormInput
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter module title"
                error={errors.title}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <FormTextarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Enter module description"
                rows={4}
                error={errors.description}
                required
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (minutes) *
                </label>
                <FormInput
                  type="number"
                  min={1}
                  value={formData.estimated_duration.toString()}
                  onChange={(e) =>
                    updateField(
                      "estimated_duration",
                      parseInt(e.target.value) || 0
                    )
                  }
                  error={errors.estimated_duration}
                  required
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <FormInput
                  type="number"
                  min={0}
                  value={formData.sort_order.toString()}
                  onChange={(e) =>
                    updateField("sort_order", parseInt(e.target.value) || 0)
                  }
                />
                <p className="mt-1 text-sm text-gray-500">
                  Lower numbers appear first
                </p>
              </div>
            </div>

            {/* Active Status */}
            <div>
              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Module is active and visible to learners
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/education/modules"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Module"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
