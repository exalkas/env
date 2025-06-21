"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
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

interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  estimated_duration: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  lessons_count?: number;
  created_at: string;
  updated_at: string;
}

export default function LearningPathDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLearningPath();
      fetchModules();
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
      } else if (response.status === 404) {
        router.push("/education/learning-paths");
      }
    } catch (error) {
      console.error("Error fetching learning path:", error);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/learning-paths/${id}/modules`
      );
      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModuleClick = (module: Module) => {
    setModuleToDelete(module);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteModuleConfirm = async () => {
    if (!moduleToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${moduleToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setModules((prev) =>
          prev.filter((module) => module.id !== moduleToDelete.id)
        );
        setShowDeleteModal(false);
        setModuleToDelete(null);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to delete module" }));
        setDeleteError(errorData.detail || "Failed to delete module");
      }
    } catch (error) {
      console.error("Error deleting module:", error);
      setDeleteError("Network error occurred while deleting module");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteModuleCancel = () => {
    setShowDeleteModal(false);
    setModuleToDelete(null);
    setDeleteError(null);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800";
      case "ADVANCED":
        return "bg-orange-100 text-orange-800";
      case "EXPERT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Define columns for modules table
  const moduleColumns: Column<Module>[] = [
    {
      key: "sort_order",
      label: "#",
      width: "60px",
      render: (module) => (
        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
          {module.sort_order}
        </span>
      ),
    },
    {
      key: "title",
      label: "Module",
      sortable: true,
      render: (module) => (
        <div>
          <div className="font-medium text-gray-900">{module.title}</div>
          <div className="text-sm text-gray-500">{module.description}</div>
        </div>
      ),
    },
    {
      key: "estimated_duration",
      label: "Duration",
      sortable: true,
      render: (module) => (
        <span className="text-sm text-gray-600">
          {Math.floor(module.estimated_duration / 60)}h{" "}
          {module.estimated_duration % 60}m
        </span>
      ),
    },
    {
      key: "lessons_count",
      label: "Lessons",
      render: (module) => (
        <span className="text-sm text-gray-600">
          {module.lessons_count || 0} lessons
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (module) => (
        <StatusBadge
          status={module.is_active ? "Active" : "Inactive"}
          size="sm"
        />
      ),
    },
  ];

  // Define actions for modules table
  const moduleActions: ActionButton<Module>[] = [
    {
      type: "view",
      label: "View lessons",
      href: (module) => `/education/modules/${module.id}`,
    },
    {
      type: "edit",
      label: "Edit module",
      href: (module) => `/education/modules/${module.id}/edit`,
    },
    {
      type: "delete",
      label: "Delete module",
      onClick: handleDeleteModuleClick,
    },
  ];

  if (loading || !learningPath) {
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/education/learning-paths"
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {learningPath.title}
            </h1>
            <p className="mt-2 text-gray-600">{learningPath.description}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/education/learning-paths/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Path
            </Link>
            <Link
              href={`/education/learning-paths/${id}/modules/create`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Module
            </Link>
          </div>
        </div>
      </div>

      {/* Path Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Path Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Path Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Level
                </label>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeColor(
                    learningPath.level
                  )}`}
                >
                  {learningPath.level.toLowerCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Duration
                </label>
                <p className="text-sm text-gray-900">
                  {Math.floor(learningPath.estimated_duration / 60)}h{" "}
                  {learningPath.estimated_duration % 60}m
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    learningPath.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {learningPath.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Modules
                </label>
                <p className="text-sm text-gray-900">
                  {modules.length} modules
                </p>
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
                <span className="text-sm text-gray-500">Total Modules</span>
                <span className="text-sm font-medium text-gray-900">
                  {modules.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Lessons</span>
                <span className="text-sm font-medium text-gray-900">
                  {modules.reduce(
                    (sum, module) => sum + (module.lessons_count || 0),
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Enrolled Users</span>
                <span className="text-sm font-medium text-gray-900">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Modules ({modules.length})
            </h2>
            <Link
              href={`/education/learning-paths/${id}/modules/create`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Module
            </Link>
          </div>
        </div>

        <DataTable
          data={modules.sort((a, b) => a.sort_order - b.sort_order)}
          columns={moduleColumns}
          actions={moduleActions}
          loading={loading}
          searchable={false}
          emptyState={{
            title: "No modules yet",
            description:
              "Get started by creating the first module for this learning path.",
            action: {
              label: "Create Module",
              href: `/education/learning-paths/${id}/modules/create`,
            },
          }}
          className="border-none shadow-none"
        />
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onConfirm={handleDeleteModuleConfirm}
          onClose={handleDeleteModuleCancel}
          isLoading={isDeleting}
          title="Delete Module"
          message={`Are you sure you want to delete the module "${moduleToDelete?.title}"? This will also delete all lessons within it.`}
          error={deleteError}
        />
      )}
    </div>
  );
}
