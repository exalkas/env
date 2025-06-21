"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/utils/auth";
import { FormInput, FormTextarea, LoadingSpinner } from "@/components/shared";
import { useNotifications, useFormData, useAsyncOperation } from "@/lib/hooks";

interface Module {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  learning_path?: {
    id: number;
    title: string;
  };
}

interface ModuleForm {
  title: string;
  description: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
}

export default function EditModule() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<Module | null>(null);

  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  const { formData, errors, updateField, validate, reset } =
    useFormData<ModuleForm>({
      initialData: {
        title: "",
        description: "",
        estimated_duration: 60,
        sort_order: 1,
        is_active: true,
      },
      validator: (data: ModuleForm) => {
        const errors: Record<string, string> = {};
        if (!data.title.trim()) errors.title = "Title is required";
        if (!data.description.trim())
          errors.description = "Description is required";
        if (data.estimated_duration <= 0)
          errors.estimated_duration = "Duration must be greater than 0";
        return errors;
      },
    });

  const { loading: submitting, execute } = useAsyncOperation({
    onSuccess: () => {
      addNotification("success", "Module updated successfully!");
      setTimeout(() => router.push(`/education/modules/${moduleId}`), 1500);
    },
    onError: (error: any) => {
      addNotification("error", error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await execute(async () => {
      if (!validate()) {
        throw new Error("Please fix validation errors");
      }

      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${moduleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update module");
      }

      return response.json();
    });
  };

  useEffect(() => {
    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  const fetchModule = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${moduleId}`
      );
      if (response.ok) {
        const data: Module = await response.json();
        setModule(data);
        reset({
          title: data.title,
          description: data.description || "",
          estimated_duration: data.estimated_duration || 60,
          sort_order: data.sort_order,
          is_active: data.is_active,
        });
      } else if (response.status === 404) {
        addNotification("error", "Module not found");
        setTimeout(() => router.push("/education/learning-paths"), 2000);
      }
    } catch (error) {
      console.error("Error fetching module:", error);
      addNotification("error", "Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Module Not Found</h2>
          <p className="mt-2 text-gray-600">
            The module you're looking for doesn't exist.
          </p>
          <Link
            href="/education/learning-paths"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Back to Learning Paths
          </Link>
        </div>
      </div>
    );
  }

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
            <span>{notification.message}</span>
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
            href={`/education/modules/${moduleId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Module
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Module</h1>
        <p className="mt-2 text-gray-600">
          Update module "{module.title}"
          {module.learning_path && (
            <span className="text-gray-500">
              {" "}
              in {module.learning_path.title}
            </span>
          )}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
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
                  min="1"
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
                  min="0"
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
              href={`/education/modules/${moduleId}`}
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
                  Updating...
                </>
              ) : (
                "Update Module"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
