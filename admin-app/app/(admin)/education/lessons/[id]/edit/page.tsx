"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  RichTextEditor,
  LoadingSpinner,
  FormInput,
  FormTextarea,
  FormSelect,
} from "@/components/shared";
import { useNotifications } from "@/lib/hooks";
import { fetchWithAuth } from "@/lib/utils/auth";
import { NotificationContainer } from "@/components/NotificationToast";

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;
  lesson_type?: string;
  video_url?: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  module?: {
    id: number;
    title: string;
    learning_path_id: number;
    learning_path?: {
      id: number;
      title: string;
    };
  };
}

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    lesson_type: "TEXT",
    video_url: "",
    video_description: "",
    estimated_duration: 15,
    sort_order: 1,
    is_active: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const lessonTypes = [
    { value: "TEXT", label: "Text Lesson", icon: "📖" },
    { value: "VIDEO", label: "Video Lesson", icon: "🎥" },
    { value: "INTERACTIVE", label: "Interactive Content", icon: "🎮" },
    { value: "QUIZ", label: "Quiz/Assessment", icon: "❓" },
  ];

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/lessons/${lessonId}`
      );
      if (response.ok) {
        const data = await response.json();
        setLesson(data);
        setFormData({
          title: data.title,
          content: data.content,
          lesson_type: data.lesson_type || "TEXT",
          video_url: data.video_url || "",
          video_description: "",
          estimated_duration: data.estimated_duration,
          sort_order: data.sort_order,
          is_active: data.is_active,
        });
      } else if (response.status === 404) {
        router.push("/education/learning-paths");
      }
    } catch (error) {
      console.error("Error fetching lesson:", error);
      addNotification("error", "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        title: formData.title,
        content: formData.content,
        lesson_type: formData.lesson_type,
        estimated_duration: formData.estimated_duration,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/lessons/${lessonId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        addNotification("success", "Lesson updated successfully!");
        setTimeout(() => {
          router.push(`/education/modules/${lesson?.module_id}`);
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update lesson");
      }
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      addNotification("error", error.message || "Failed to update lesson");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            Error loading lesson
          </h3>
          <p className="text-gray-500 mt-1">
            The lesson could not be found or loaded.
          </p>
          <Button href="/education/learning-paths" className="mt-4">
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/education/modules/${lesson.module_id}`}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <nav className="text-sm text-gray-500 mb-2">
              <Link
                href="/education/learning-paths"
                className="hover:text-gray-700"
              >
                Learning Paths
              </Link>
              {lesson.module?.learning_path && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/education/learning-paths/${lesson.module.learning_path.id}`}
                    className="hover:text-gray-700"
                  >
                    {lesson.module.learning_path.title}
                  </Link>
                </>
              )}
              {lesson.module && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/education/modules/${lesson.module.id}`}
                    className="hover:text-gray-700"
                  >
                    {lesson.module.title}
                  </Link>
                </>
              )}
              <span className="mx-2">/</span>
              <span className="text-gray-900">Edit Lesson</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">Edit Lesson</h1>
            <p className="text-gray-600 mt-1">
              Update the lesson details and content
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title *
              </label>
              <FormInput
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter lesson title"
                error={errors.title}
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Lesson Type */}
            <div>
              <label
                htmlFor="lesson_type"
                className="block text-sm font-medium text-gray-700"
              >
                Lesson Type *
              </label>
              <FormSelect
                id="lesson_type"
                value={formData.lesson_type}
                onChange={(e) => updateField("lesson_type", e.target.value)}
                required
              >
                {lessonTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="estimated_duration"
                className="block text-sm font-medium text-gray-700"
              >
                Duration (minutes) *
              </label>
              <FormInput
                id="estimated_duration"
                type="number"
                min={1}
                value={formData.estimated_duration}
                onChange={(e) =>
                  updateField(
                    "estimated_duration",
                    parseInt(e.target.value) || 1
                  )
                }
                error={errors.estimated_duration}
                required
              />
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
              <FormInput
                id="sort_order"
                type="number"
                min={1}
                value={formData.sort_order}
                onChange={(e) =>
                  updateField("sort_order", parseInt(e.target.value) || 1)
                }
                error={errors.sort_order}
                required
              />
              {errors.sort_order && (
                <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Active (lesson is available to learners)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Video Settings */}
        {formData.lesson_type === "VIDEO" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Video Settings
            </h2>

            <div className="space-y-4">
              {/* Video URL */}
              <div>
                <label
                  htmlFor="video_url"
                  className="block text-sm font-medium text-gray-700"
                >
                  Video URL *
                </label>
                <FormInput
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => updateField("video_url", e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  error={errors.video_url}
                  required
                />
                {errors.video_url && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.video_url}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enter the direct URL to the video file or streaming link
                </p>
              </div>

              {/* Video Description */}
              <div>
                <label
                  htmlFor="video_description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Video Description
                </label>
                <FormTextarea
                  id="video_description"
                  value={formData.video_description}
                  onChange={(e) =>
                    updateField("video_description", e.target.value)
                  }
                  placeholder="Brief description of the video content"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Lesson Content *
          </h2>
          <RichTextEditor
            value={formData.content}
            onChange={(value) => updateField("content", value)}
            placeholder="Enter the lesson content..."
            error={errors.content}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Use the rich text editor to format your lesson content with
            headings, lists, links, and more.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button type="submit" loading={saving} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            href={`/education/modules/${lesson.module_id}`}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
