"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { fetchWithAuth } from "@/lib/utils/auth";
import {
  Button,
  FormInput,
  FormTextarea,
  FormSelect,
  LoadingSpinner,
  RichTextEditor,
} from "@/components/shared";
import { useNotifications, useFormData } from "@/lib/hooks";

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
    level: string;
  };
}

interface LearningPath {
  id: number;
  title: string;
  level: string;
  modules: Module[];
}

export default function CreateLesson() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  const { formData, errors, updateField, validate, reset } = useFormData({
    initialData: {
      title: "",
      content: "",
      lesson_type: "TEXT",
      video_url: "",
      video_description: "",
      estimated_duration: 15,
      sort_order: 1,
      is_active: true,
    },
    validator: (data) => {
      const newErrors: Record<string, string> = {};

      if (!selectedModuleId) {
        newErrors.module = "Please select a module";
      }

      if (!data.title.trim()) {
        newErrors.title = "Title is required";
      }

      if (!data.content.trim()) {
        newErrors.content = "Content is required";
      }

      if (data.estimated_duration < 1) {
        newErrors.estimated_duration = "Duration must be at least 1 minute";
      }

      if (data.sort_order < 1) {
        newErrors.sort_order = "Sort order must be at least 1";
      }

      // Validate video URL for VIDEO type lessons
      if (data.lesson_type === "VIDEO") {
        if (!data.video_url.trim()) {
          newErrors.video_url = "Video URL is required for video lessons";
        } else {
          const urlPattern = /^https?:\/\/.+/;
          if (!urlPattern.test(data.video_url)) {
            newErrors.video_url =
              "Please enter a valid URL starting with http:// or https://";
          }
        }
      }

      return newErrors;
    },
  });

  useEffect(() => {
    fetchLearningPathsAndModules();
  }, []);

  useEffect(() => {
    if (selectedModuleId) {
      fetchLessonCount();
    }
  }, [selectedModuleId]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonCount = async () => {
    if (!selectedModuleId) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${selectedModuleId}/lessons`
      );
      if (response.ok) {
        const lessons = await response.json();
        updateField("sort_order", lessons.length + 1);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        module_id: parseInt(selectedModuleId),
        title: formData.title,
        content: formData.content,
        lesson_type: formData.lesson_type,
        estimated_duration: formData.estimated_duration,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${selectedModuleId}/lessons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        addNotification("success", "Lesson created successfully!");
        // Redirect to the module page that contains the new lesson
        setTimeout(() => {
          router.push(`/education/modules/${selectedModuleId}`);
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.detail) {
          if (typeof errorData.detail === "string") {
            addNotification("error", errorData.detail);
          } else if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail
              .map((err: any) =>
                typeof err === "string" ? err : err.msg || "Validation error"
              )
              .join(", ");
            addNotification("error", errorMessages);
          } else {
            addNotification("error", "Validation error occurred");
          }
        } else {
          addNotification("error", "Failed to create lesson");
        }
      }
    } catch (error) {
      console.error("Error creating lesson:", error);
      addNotification("error", "Failed to create lesson");
    } finally {
      setSaving(false);
    }
  };

  const selectedModule = getSelectedModule();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
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
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeftIcon}
            href="/education/lessons"
          >
            Back to Lessons
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Lesson</h1>
        <p className="mt-2 text-gray-600">
          Add a new lesson to your learning module
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Module Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Select Module
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
            {selectedModule && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm">
                  <strong>Selected Module:</strong> {selectedModule.title}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Learning Path:</strong>{" "}
                  {selectedModule.learning_path?.title} (
                  {selectedModule.learning_path?.level})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Details */}
        {selectedModuleId && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Lesson Details
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <FormInput
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter lesson title"
                  error={errors.title}
                  required
                />
              </div>

              {/* Lesson Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Type *
                </label>
                <FormSelect
                  value={formData.lesson_type}
                  onChange={(e) => updateField("lesson_type", e.target.value)}
                  error={errors.lesson_type}
                  required
                >
                  {lessonTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {/* Duration and Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (minutes) *
                  </label>
                  <FormInput
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) =>
                      updateField(
                        "estimated_duration",
                        parseInt(e.target.value)
                      )
                    }
                    min={1}
                    error={errors.estimated_duration}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order *
                  </label>
                  <FormInput
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      updateField("sort_order", parseInt(e.target.value))
                    }
                    min={1}
                    error={errors.sort_order}
                    required
                  />
                </div>
              </div>

              {/* Video URL for video lessons */}
              {formData.lesson_type === "VIDEO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL *
                  </label>
                  <FormInput
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => updateField("video_url", e.target.value)}
                    placeholder="https://example.com/video"
                    error={errors.video_url}
                    required
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Content *
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => updateField("content", content)}
                  placeholder="Enter the lesson content..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Active (lesson will be visible to users)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        {selectedModuleId && (
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="secondary" href="/education/lessons">
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={saving}>
              {saving ? "Creating..." : "Create Lesson"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
