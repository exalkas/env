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

interface Module {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  learning_path?: {
    id: number;
    title: string;
    level: string;
  };
}

interface LearningPath {
  id: number;
  title: string;
  level: string;
  modules: Module[];
}

interface InteractiveLessonType {
  id: number;
  type_key: string;
  display_name: string;
  description: string;
  component_name: string;
  default_config: any;
  is_active: boolean;
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
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [interactiveTypes, setInteractiveTypes] = useState<
    InteractiveLessonType[]
  >([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    lesson_type: "TEXT",
    video_url: "",
    video_description: "",
    estimated_duration: 15,
    sort_order: 1,
    is_active: true,
    interactive_type_id: "",
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
      fetchLearningPathsAndModules();
      fetchInteractiveTypes();
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
        setSelectedModuleId(data.module_id?.toString() || "");
        setFormData({
          title: data.title,
          content: data.content,
          lesson_type: data.lesson_type || "TEXT",
          video_url: data.video_url || "",
          video_description: "",
          estimated_duration: data.estimated_duration,
          sort_order: data.sort_order,
          is_active: data.is_active,
          interactive_type_id: "",
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

  const fetchLearningPathsAndModules = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/v1/education/learning-paths/"
      );
      if (response.ok) {
        const paths = await response.json();

        // Fetch modules for each learning path
        const pathsWithModules: LearningPath[] = [];
        for (const path of paths) {
          const modulesResponse = await fetchWithAuth(
            `http://localhost:8000/api/v1/education/learning-paths/${path.id}/modules`
          );
          if (modulesResponse.ok) {
            const modules = await modulesResponse.json();
            pathsWithModules.push({
              ...path,
              modules: modules.map((moduleItem: any) => ({
                ...moduleItem,
                learning_path: {
                  id: path.id,
                  title: path.title,
                  level: path.level,
                },
              })),
            });
          }
        }
        setLearningPaths(pathsWithModules);
      }
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      addNotification("error", "Failed to load learning paths");
    }
  };

  const fetchInteractiveTypes = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/v1/interactive-content/types"
      );
      if (response.ok) {
        const data = await response.json();
        setInteractiveTypes(
          data.filter((type: InteractiveLessonType) => type.is_active)
        );
      }
    } catch (error) {
      console.error("Error fetching interactive types:", error);
      addNotification("error", "Failed to load interactive content types");
    }
  };

  const getSelectedModule = (): Module | null => {
    for (const path of learningPaths) {
      for (const moduleItem of path.modules) {
        if (moduleItem.id.toString() === selectedModuleId) {
          return moduleItem;
        }
      }
    }
    return null;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedModuleId) {
      newErrors.module = "Please select a module";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (
      formData.lesson_type === "INTERACTIVE" &&
      !formData.interactive_type_id
    ) {
      newErrors.interactive_type_id = "Please select an interactive type";
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
        // CRITICAL FIX: Use selected module_id to allow changing lesson's module
        module_id: selectedModuleId
          ? parseInt(selectedModuleId)
          : lesson?.module_id,
        // Include interactive type for INTERACTIVE lessons
        ...(formData.lesson_type === "INTERACTIVE" &&
          formData.interactive_type_id && {
            interactive_type_id: parseInt(formData.interactive_type_id),
          }),
        // Include video URL for VIDEO lessons
        ...(formData.lesson_type === "VIDEO" && {
          video_url: formData.video_url,
        }),
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
        const targetModuleId = selectedModuleId || lesson?.module_id;
        setTimeout(() => {
          router.push(`/education/modules/${targetModuleId}`);
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
        {/* Module Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Module Assignment
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module *
            </label>
            <FormSelect
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              error={errors.module}
              required
            >
              <option value="">Choose a module...</option>
              {learningPaths.map((path) => (
                <optgroup key={path.id} label={`${path.title} (${path.level})`}>
                  {path.modules.map((moduleItem) => (
                    <option key={moduleItem.id} value={moduleItem.id}>
                      {moduleItem.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </FormSelect>
            {errors.module && (
              <p className="mt-1 text-sm text-red-600">{errors.module}</p>
            )}
            {getSelectedModule() && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm">
                  <strong>Selected Module:</strong> {getSelectedModule()?.title}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Learning Path:</strong>{" "}
                  {getSelectedModule()?.learning_path?.title} (
                  {getSelectedModule()?.learning_path?.level})
                </div>
              </div>
            )}
          </div>
        </div>

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

        {/* Interactive Settings */}
        {formData.lesson_type === "INTERACTIVE" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Interactive Content Settings
            </h2>

            <div className="space-y-6">
              {/* Interactive Type Selection */}
              <div>
                <label
                  htmlFor="interactive_type_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Interactive Type *
                </label>
                <FormSelect
                  id="interactive_type_id"
                  value={formData.interactive_type_id}
                  onChange={(e) =>
                    updateField("interactive_type_id", e.target.value)
                  }
                  required
                >
                  <option value="">Select an interactive type...</option>
                  {interactiveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.display_name}
                    </option>
                  ))}
                </FormSelect>
                {errors.interactive_type_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.interactive_type_id}
                  </p>
                )}
              </div>

              {/* Interactive Type Description */}
              {formData.interactive_type_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    About This Interactive Type
                  </h4>
                  <p className="text-sm text-blue-700">
                    {
                      interactiveTypes.find(
                        (t) => t.id.toString() === formData.interactive_type_id
                      )?.description
                    }
                  </p>
                  <div className="mt-2 text-xs text-blue-600">
                    <strong>Component:</strong>{" "}
                    {
                      interactiveTypes.find(
                        (t) => t.id.toString() === formData.interactive_type_id
                      )?.component_name
                    }
                  </div>
                </div>
              )}

              {/* Configuration Preview */}
              {formData.interactive_type_id && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Default Configuration
                  </h4>
                  <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(
                      interactiveTypes.find(
                        (t) => t.id.toString() === formData.interactive_type_id
                      )?.default_config || {},
                      null,
                      2
                    )}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">
                    This shows the default configuration for this interactive
                    type. Advanced configuration options will be available in
                    the Interactive Builder.
                  </p>
                </div>
              )}

              {/* Link to Interactive Builder */}
              {formData.interactive_type_id && lessonId && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">
                    🎮 Interactive Builder
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    After saving these changes, you can use the Interactive
                    Builder to create and configure scenarios for this lesson.
                  </p>
                  <Link
                    href={`/education/lessons/${lessonId}/interactive-builder`}
                    className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    Open Interactive Builder
                  </Link>
                </div>
              )}
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
