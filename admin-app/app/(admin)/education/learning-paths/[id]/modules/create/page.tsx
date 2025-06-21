"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/utils/auth";

interface LearningPath {
  id: number;
  title: string;
  description: string;
}

export default function CreateModule() {
  const { id } = useParams(); // Learning path ID
  const router = useRouter();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    estimated_duration: 60, // in minutes
    sort_order: 1,
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchLearningPath();
      fetchModuleCount();
    }
  }, [id]);

  const fetchLearningPath = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/learning-paths/${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setLearningPath(data);
      }
    } catch (error) {
      console.error("Error fetching learning path:", error);
    }
  };

  const fetchModuleCount = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/learning-paths/${id}/modules`
      );
      if (response.ok) {
        const modules = await response.json();
        setFormData((prev) => ({
          ...prev,
          sort_order: modules.length + 1,
        }));
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.estimated_duration < 1) {
      newErrors.estimated_duration = "Duration must be at least 1 minute";
    }

    if (formData.sort_order < 1) {
      newErrors.sort_order = "Sort order must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/learning-paths/${id}/modules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        router.push(`/education/learning-paths/${id}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.detail) {
          // Handle string details
          if (typeof errorData.detail === "string") {
            setErrors({ submit: errorData.detail });
          } else if (Array.isArray(errorData.detail)) {
            // Handle array of error objects
            const errorMessages = errorData.detail
              .map((err: any) =>
                typeof err === "string" ? err : err.msg || "Validation error"
              )
              .join(", ");
            setErrors({ submit: errorMessages });
          } else {
            setErrors({ submit: "Validation error occurred" });
          }
        } else if (errorData.errors) {
          // Handle field-specific errors
          const fieldErrors: Record<string, string> = {};
          if (typeof errorData.errors === "object") {
            Object.keys(errorData.errors).forEach((key) => {
              const error = errorData.errors[key];
              if (typeof error === "string") {
                fieldErrors[key] = error;
              } else if (Array.isArray(error)) {
                fieldErrors[key] = error.join(", ");
              } else if (error && error.msg) {
                fieldErrors[key] = error.msg;
              }
            });
            setErrors(fieldErrors);
          } else {
            setErrors({ submit: "Validation errors occurred" });
          }
        } else {
          setErrors({ submit: "Failed to create module" });
        }
      }
    } catch (error) {
      console.error("Error creating module:", error);
      setErrors({ submit: "Network error occurred" });
    } finally {
      setSaving(false);
    }
  };

  if (!learningPath) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/education/learning-paths/${id}`}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <nav className="text-sm text-gray-500 mb-2">
              <Link
                href="/education/learning-paths"
                className="hover:text-gray-700"
              >
                Learning Paths
              </Link>
              <span className="mx-2">/</span>
              <Link
                href={`/education/learning-paths/${id}`}
                className="hover:text-gray-700"
              >
                {learningPath.title}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Create Module</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Module
            </h1>
            <p className="mt-2 text-gray-600">
              Add a new module to &ldquo;{learningPath.title}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div className="lg:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Module Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? "border-red-300" : ""
                }`}
                placeholder="Enter module title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? "border-red-300" : ""
                }`}
                placeholder="Describe what this module covers..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="estimated_duration"
                className="block text-sm font-medium text-gray-700"
              >
                Estimated Duration (minutes) *
              </label>
              <input
                type="number"
                id="estimated_duration"
                name="estimated_duration"
                min="1"
                value={formData.estimated_duration}
                onChange={handleInputChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.estimated_duration ? "border-red-300" : ""
                }`}
              />
              <p className="mt-1 text-sm text-gray-500">
                Approximately {Math.floor(formData.estimated_duration / 60)}h{" "}
                {formData.estimated_duration % 60}m
              </p>
              {errors.estimated_duration && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.estimated_duration}
                </p>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sort_order"
                className="block text-sm font-medium text-gray-700"
              >
                Sort Order *
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                min="1"
                value={formData.sort_order}
                onChange={handleInputChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.sort_order ? "border-red-300" : ""
                }`}
              />
              <p className="mt-1 text-sm text-gray-500">
                Determines the order of modules in the learning path
              </p>
              {errors.sort_order && (
                <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="lg:col-span-2">
              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Module is active
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Inactive modules won't be visible to users
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/education/learning-paths/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating..." : "Create Module"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
