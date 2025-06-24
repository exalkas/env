"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import {
  DataTable,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  Button,
  FormSelect,
  SearchInput,
} from "@/components/shared";
import { useNotifications, useConfirmationModal } from "@/lib/hooks";
import { fetchWithAuth } from "@/lib/utils/auth";
import ConfirmationModal from "@/components/ConfirmationModal";
import type { Column, ActionButton } from "@/components/shared";

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;
  lesson_type: string;
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
      level: string;
    };
  };
}

export default function LessonsOverview() {
  const { notifications, addNotification, dismissNotification } =
    useNotifications();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const {
    isOpen: isModalOpen,
    title: modalTitle,
    message: modalMessage,
    loading: modalLoading,
    error: modalError,
    confirm,
    closeModal,
    showGenericConfirmation,
  } = useConfirmationModal({
    onConfirm: async (lessonId: number) => {
      await performDelete(lessonId);
    },
  });

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [lessons, searchQuery, statusFilter, typeFilter, levelFilter]);

  const fetchLessons = async () => {
    try {
      // Fetch all learning paths first
      const pathsResponse = await fetchWithAuth(
        "http://localhost:8000/api/v1/education/learning-paths/"
      );
      if (pathsResponse.ok) {
        const learningPaths = await pathsResponse.json();

        const allLessons: Lesson[] = [];

        // Fetch modules and lessons for each learning path
        for (const path of learningPaths) {
          const modulesResponse = await fetchWithAuth(
            `http://localhost:8000/api/v1/education/learning-paths/${path.id}/modules`
          );
          if (modulesResponse.ok) {
            const modules = await modulesResponse.json();

            // Fetch lessons for each module
            for (const moduleItem of modules) {
              const lessonsResponse = await fetchWithAuth(
                `http://localhost:8000/api/v1/education/modules/${moduleItem.id}/lessons`
              );
              if (lessonsResponse.ok) {
                const moduleLessons = await lessonsResponse.json();
                const lessonsWithContext = moduleLessons.map((lesson: any) => ({
                  ...lesson,
                  module: {
                    id: moduleItem.id,
                    title: moduleItem.title,
                    learning_path_id: path.id,
                    learning_path: {
                      id: path.id,
                      title: path.title,
                      level: path.level,
                    },
                  },
                }));
                allLessons.push(...lessonsWithContext);
              }
            }
          }
        }
        setLessons(allLessons);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
      addNotification("error", "Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = lessons;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lesson.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lesson.module?.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          lesson.module?.learning_path?.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lesson) =>
        statusFilter === "active" ? lesson.is_active : !lesson.is_active
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((lesson) => lesson.lesson_type === typeFilter);
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(
        (lesson) => lesson.module?.learning_path?.level === levelFilter
      );
    }

    setFilteredLessons(filtered);
  };

  const handleDeleteLesson = (lessonId: number) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    showGenericConfirmation(
      "Delete Lesson",
      `Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`,
      lessonId,
      "danger"
    );
  };

  const performDelete = async (lessonId: number) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/lessons/${lessonId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        addNotification("success", "Lesson deleted successfully");
        fetchLessons(); // Refresh the list
      } else {
        addNotification("error", "Failed to delete lesson");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      addNotification("error", "Failed to delete lesson");
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return VideoCameraIcon;
      case "TEXT":
        return DocumentTextIcon;
      case "INTERACTIVE":
        return AcademicCapIcon;
      case "QUIZ":
        return QuestionMarkCircleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getLessonTypeBadge = (type: string) => {
    const colors = {
      VIDEO: "bg-purple-100 text-purple-800",
      TEXT: "bg-blue-100 text-blue-800",
      INTERACTIVE: "bg-green-100 text-green-800",
      QUIZ: "bg-orange-100 text-orange-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const columns: Column<Lesson>[] = [
    {
      key: "title",
      label: "Lesson Title",
      sortable: true,
      render: (lesson) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${getLessonTypeBadge(
                lesson.lesson_type
              )}`}
            >
              {(() => {
                const Icon = getLessonTypeIcon(lesson.lesson_type);
                return <Icon className="h-5 w-5" />;
              })()}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {lesson.title}
            </div>
            <div className="text-sm text-gray-500">
              {lesson.module?.title} • {lesson.module?.learning_path?.title}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "lesson_type",
      label: "Type",
      sortable: true,
      render: (lesson) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLessonTypeBadge(
            lesson.lesson_type
          )}`}
        >
          {lesson.lesson_type}
        </span>
      ),
    },
    {
      key: "estimated_duration",
      label: "Duration",
      sortable: true,
      render: (lesson) => (
        <span className="text-sm text-gray-900">
          {lesson.estimated_duration} min
        </span>
      ),
    },
    {
      key: "sort_order",
      label: "Order",
      sortable: true,
      render: (lesson) => (
        <span className="text-sm text-gray-500">#{lesson.sort_order}</span>
      ),
    },
    {
      key: "module.learning_path.level",
      label: "Level",
      sortable: true,
      render: (lesson) => (
        <StatusBadge
          status={lesson.module?.learning_path?.level || "Unknown"}
          size="sm"
        />
      ),
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (lesson) => (
        <StatusBadge
          status={lesson.is_active ? "Active" : "Inactive"}
          size="sm"
        />
      ),
    },
  ];

  const actions: ActionButton<Lesson>[] = [
    {
      type: "view",
      label: "View",
      href: (lesson) => `/education/lessons/${lesson.id}`,
    },
    {
      type: "edit",
      label: "Edit",
      href: (lesson) => `/education/lessons/${lesson.id}/edit`,
    },
    {
      type: "delete",
      label: "Delete",
      onClick: (lesson) => handleDeleteLesson(lesson.id),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
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
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
          <p className="mt-2 text-gray-600">
            Manage all lessons across learning paths and modules
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button href="/education/lessons/create" icon={PlusIcon}>
            Create Lesson
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search lessons..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <FormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <FormSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="TEXT">Text</option>
              <option value="VIDEO">Video</option>
              <option value="INTERACTIVE">Interactive</option>
              <option value="QUIZ">Quiz</option>
            </FormSelect>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <FormSelect
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </FormSelect>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">
            {lessons.length}
          </div>
          <div className="text-sm text-gray-600">Total Lessons</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {lessons.filter((l) => l.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Active Lessons</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {lessons.filter((l) => l.lesson_type === "VIDEO").length}
          </div>
          <div className="text-sm text-gray-600">Video Lessons</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(
              lessons.reduce((sum, l) => sum + l.estimated_duration, 0) / 60
            )}
            h
          </div>
          <div className="text-sm text-gray-600">Total Duration</div>
        </div>
      </div>

      {/* Lessons Table */}
      <div className="bg-white rounded-lg shadow">
        {filteredLessons.length === 0 ? (
          <EmptyState
            title="No lessons found"
            description={
              lessons.length === 0
                ? "Get started by creating your first lesson."
                : "No lessons match your current filters."
            }
            action={
              lessons.length === 0
                ? {
                    label: "Create Lesson",
                    href: "/education/lessons/create",
                  }
                : {
                    label: "Clear Filters",
                    onClick: () => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setLevelFilter("all");
                    },
                  }
            }
          />
        ) : (
          <DataTable
            data={filteredLessons}
            columns={columns}
            actions={actions}
            searchable={false} // We handle search externally
            pagination={{ pageSize: 20 }}
          />
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={confirm}
        onClose={closeModal}
        title={modalTitle}
        message={modalMessage}
        isLoading={modalLoading}
        error={modalError}
      />
    </div>
  );
}
