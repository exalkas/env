"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  VideoCameraIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/utils/auth";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  DataTable,
  StatusBadge,
  type Column,
  type ActionButton,
} from "@/components/shared";

interface Module {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  learning_path?: {
    id: number;
    title: string;
  };
}

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;
  video_url?: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ModuleDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchModule();
      fetchLessons();
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
      } else if (response.status === 404) {
        router.push("/education/learning-paths");
      }
    } catch (error) {
      console.error("Error fetching module:", error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${id}/lessons`
      );
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLessonClick = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteLessonConfirm = async () => {
    if (!lessonToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/lessons/${lessonToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setLessons((prev) =>
          prev.filter((lesson) => lesson.id !== lessonToDelete.id)
        );
        setShowDeleteModal(false);
        setLessonToDelete(null);
        showSuccess(`Lesson "${lessonToDelete.title}" deleted successfully!`);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to delete lesson" }));
        setDeleteError(errorData.detail || "Failed to delete lesson");
        showError(errorData.detail || "Failed to delete lesson");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setDeleteError("Network error occurred while deleting lesson");
      showError("Network error occurred while deleting lesson");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteLessonCancel = () => {
    setShowDeleteModal(false);
    setLessonToDelete(null);
    setDeleteError(null);
  };

  // Helper functions for notifications
  const showSuccess = (message: string) => {
    setErrorMessage(null);
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (message: string) => {
    setSuccessMessage(null);
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return VideoCameraIcon;
      case "TEXT":
        return DocumentTextIcon;
      case "INTERACTIVE":
        return PlusIcon;
      case "QUIZ":
        return DocumentTextIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getLessonTypeBadge = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "bg-purple-100 text-purple-800";
      case "TEXT":
        return "bg-blue-100 text-blue-800";
      case "INTERACTIVE":
        return "bg-green-100 text-green-800";
      case "QUIZ":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Define columns for lessons table
  const lessonColumns: Column<Lesson>[] = [
    {
      key: "sort_order",
      label: "#",
      width: "60px",
      render: (lesson) => (
        <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
          {lesson.sort_order}
        </span>
      ),
    },
    {
      key: "title",
      label: "Lesson",
      sortable: true,
      render: (lesson) => (
        <div>
          <div className="font-medium text-gray-900">{lesson.title}</div>
          <div className="text-sm text-gray-500">
            {lesson.content.length > 100
              ? `${lesson.content.substring(0, 100)}...`
              : lesson.content}
          </div>
        </div>
      ),
    },
    {
      key: "estimated_duration",
      label: "Duration",
      sortable: true,
      render: (lesson) => (
        <span className="text-sm text-gray-600">
          {lesson.estimated_duration} min
        </span>
      ),
    },
    {
      key: "video_url",
      label: "Video",
      render: (lesson) => (
        <span className="text-sm text-gray-600">
          {lesson.video_url ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (lesson) => (
        <StatusBadge
          status={lesson.is_active ? "Active" : "Inactive"}
          size="sm"
        />
      ),
    },
  ];

  // Define actions for lessons table
  const lessonActions: ActionButton<Lesson>[] = [
    {
      type: "view",
      label: "View lesson",
      href: (lesson) => `/education/lessons/${lesson.id}`,
    },
    {
      type: "edit",
      label: "Edit lesson",
      href: (lesson) => `/education/lessons/${lesson.id}/edit`,
    },
    {
      type: "delete",
      label: "Delete lesson",
      onClick: handleDeleteLessonClick,
    },
  ];

  if (loading || !module) {
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={
              module.learning_path
                ? `/education/learning-paths/${module.learning_path.id}`
                : "/education/learning-paths"
            }
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
              {module.learning_path && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/education/learning-paths/${module.learning_path.id}`}
                    className="hover:text-gray-700"
                  >
                    {module.learning_path.title}
                  </Link>
                </>
              )}
              <span className="mx-2">/</span>
              <span className="text-gray-900">{module.title}</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
            <p className="mt-2 text-gray-600">{module.description}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/education/modules/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Module
            </Link>
            <Link
              href={`/education/modules/${id}/lessons/create`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Lesson
            </Link>
          </div>
        </div>
      </div>

      {/* Module Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Module Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Module Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Duration
                </label>
                <p className="text-sm text-gray-900">
                  {Math.floor(module.estimated_duration / 60)}h{" "}
                  {module.estimated_duration % 60}m
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Status
                </label>
                <StatusBadge
                  status={module.is_active ? "Active" : "Inactive"}
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Lessons
                </label>
                <p className="text-sm text-gray-900">
                  {lessons.length} lessons
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Order
                </label>
                <p className="text-sm text-gray-900">#{module.sort_order}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Lessons</span>
                <span className="text-sm font-medium text-gray-900">
                  {lessons.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">With Video</span>
                <span className="text-sm font-medium text-gray-900">
                  {lessons.filter((lesson) => lesson.video_url).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Active Lessons</span>
                <span className="text-sm font-medium text-gray-900">
                  {lessons.filter((lesson) => lesson.is_active).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Duration</span>
                <span className="text-sm font-medium text-gray-900">
                  {lessons.reduce(
                    (sum, lesson) => sum + lesson.estimated_duration,
                    0
                  )}{" "}
                  min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Lessons ({lessons.length})
            </h2>
            <Link
              href={`/education/modules/${id}/lessons/create`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Lesson
            </Link>
          </div>
        </div>

        <DataTable
          data={lessons.sort((a, b) => a.sort_order - b.sort_order)}
          columns={lessonColumns}
          actions={lessonActions}
          loading={loading}
          searchable={true}
          searchPlaceholder="Search lessons..."
          emptyState={{
            title: "No lessons yet",
            description:
              "Get started by creating the first lesson for this module.",
            action: {
              label: "Create Lesson",
              href: `/education/modules/${id}/lessons/create`,
            },
          }}
          className="border-none shadow-none"
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteLessonConfirm}
        onClose={handleDeleteLessonCancel}
        isLoading={isDeleting}
        title="Delete Lesson"
        message={`Are you sure you want to delete the lesson "${lessonToDelete?.title}"? This action cannot be undone.`}
        error={deleteError}
      />
    </div>
  );
}
