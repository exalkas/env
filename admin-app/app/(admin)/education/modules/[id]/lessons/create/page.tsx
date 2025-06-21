"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/utils/auth";
import { RichTextEditor } from "@/components/shared";

const lessonTypes = [
  { value: "TEXT", label: "Text Lesson", icon: "📖" },
  { value: "VIDEO", label: "Video Lesson", icon: "🎥" },
  { value: "INTERACTIVE", label: "Interactive Content", icon: "🎮" },
  { value: "QUIZ", label: "Quiz/Assessment", icon: "❓" },
];

interface Module {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  learning_path?: {
    id: number;
    title: string;
  };
}

export default function CreateLesson() {
  const { id } = useParams(); // Module ID
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    lesson_type: "TEXT",
    video_url: "",
    video_description: "",
    estimated_duration: 15, // in minutes
    sort_order: 1,
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchModule();
      fetchLessonCount();
    }
  }, [id]);

  const fetchModule = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setModule(data);
      }
    } catch (error) {
      console.error("Error fetching module:", error);
    }
  };

  const fetchLessonCount = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${id}/lessons`
      );
      if (response.ok) {
        const lessons = await response.json();
        setFormData((prev) => ({
          ...prev,
          sort_order: lessons.length + 1,
        }));
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
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

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (formData.estimated_duration < 1) {
      newErrors.estimated_duration = "Duration must be at least 1 minute";
    }

    if (formData.sort_order < 1) {
      newErrors.sort_order = "Sort order must be at least 1";
    }

    // Validate video URL for VIDEO type lessons
    if (formData.lesson_type === "VIDEO") {
      if (!formData.video_url.trim()) {
        newErrors.video_url = "Video URL is required for video lessons";
      } else {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(formData.video_url)) {
          newErrors.video_url =
            "Please enter a valid URL starting with http:// or https://";
        }
      }
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
      // Only send fields that the backend expects
      const submitData = {
        module_id: parseInt(id as string),
        title: formData.title,
        content: formData.content,
        lesson_type: formData.lesson_type,
        estimated_duration: formData.estimated_duration,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${id}/lessons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        router.push(`/education/modules/${id}`);
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
          setErrors({ submit: "Failed to create lesson" });
        }
      }
    } catch (error) {
      console.error("Error creating lesson:", error);
      setErrors({ submit: "Network error occurred" });
    } finally {
      setSaving(false);
    }
  };

  if (!module) {
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
            href={`/education/modules/${id}`}
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
              {module.learning_path && (
                <>
                  <Link
                    href={`/education/learning-paths/${module.learning_path.id}`}
                    className="hover:text-gray-700"
                  >
                    {module.learning_path.title}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              )}
              <Link
                href={`/education/modules/${id}`}
                className="hover:text-gray-700"
              >
                {module.title}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Create Lesson</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Lesson
            </h1>
            <p className="mt-2 text-gray-600">
              Add a new lesson to &ldquo;{module.title}&rdquo;
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
            {/* Lesson Type */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lesson Type *
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {lessonTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      formData.lesson_type === type.value
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="lesson_type"
                      value={type.value}
                      checked={formData.lesson_type === type.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <span className="flex flex-1 flex-col">
                      <span className="text-2xl mb-2">{type.icon}</span>
                      <span className="block text-sm font-medium text-gray-900">
                        {type.label}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.lesson_type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lesson_type}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="lg:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Lesson Title *
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
                placeholder="Enter lesson title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Content */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Content *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, content: value }));
                  // Clear errors when user starts typing
                  if (errors.content) {
                    setErrors((prev) => ({ ...prev, content: "" }));
                  }
                }}
                placeholder={
                  formData.lesson_type === "VIDEO"
                    ? "Write a description or transcript of the video content..."
                    : formData.lesson_type === "QUIZ"
                    ? "Write the quiz instructions or explanation..."
                    : formData.lesson_type === "INTERACTIVE"
                    ? "Write the interactive content or instructions..."
                    : "Write the lesson content here..."
                }
                height="300px"
                error={errors.content}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.lesson_type === "VIDEO"
                  ? "Provide context, key points, or transcription for the video content."
                  : formData.lesson_type === "QUIZ"
                  ? "Include quiz instructions, objectives, or additional information."
                  : formData.lesson_type === "INTERACTIVE"
                  ? "Describe the interactive elements and learning objectives."
                  : "Use the rich text editor to format your content with headers, lists, and styling."}
              </p>
            </div>

            {/* Video Fields - Only show for VIDEO type */}
            {formData.lesson_type === "VIDEO" && (
              <>
                <div className="lg:col-span-2">
                  <label
                    htmlFor="video_url"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Video URL *
                  </label>
                  <input
                    type="url"
                    id="video_url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.video_url ? "border-red-300" : ""
                    }`}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required={formData.lesson_type === "VIDEO"}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the URL for the video content (YouTube, Vimeo, etc.)
                  </p>
                  {errors.video_url && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.video_url}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label
                    htmlFor="video_description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Video Description (Optional)
                  </label>
                  <textarea
                    id="video_description"
                    name="video_description"
                    rows={3}
                    value={formData.video_description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what viewers will learn from this video..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Additional context or summary for the video content
                  </p>
                </div>
              </>
            )}

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
                How long should it take to complete this lesson?
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
                Determines the order of lessons in the module
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
                  Lesson is active
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Inactive lessons won&apos;t be visible to users
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/education/modules/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating..." : "Create Lesson"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
