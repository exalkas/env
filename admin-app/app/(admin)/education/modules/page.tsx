"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { fetchWithAuth } from "@/lib/utils/auth";
import {
  DataTable,
  SearchInput,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  FormSelect,
} from "@/components/shared";
import { useNotifications, useConfirmationModal } from "@/lib/hooks";
import ConfirmationModal from "@/components/ConfirmationModal";
import type { Column, ActionButton } from "@/components/shared";

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
  lessons_count: number;
  learning_path?: {
    id: number;
    title: string;
    level: string;
  };
}

export default function ModulesOverview() {
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const { notifications, addNotification, dismissNotification } =
    useNotifications();
  const {
    isOpen: isModalOpen,
    title: modalTitle,
    message: modalMessage,
    confirmText,
    cancelText,
    variant,
    loading: modalLoading,
    error: modalError,
    confirm,
    closeModal,
    showGenericConfirmation,
  } = useConfirmationModal({
    onConfirm: async (moduleId: number) => {
      await performDelete(moduleId);
    },
  });

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    filterModules();
  }, [modules, searchQuery, statusFilter, levelFilter]);

  const fetchModules = async () => {
    try {
      // Since there's no direct modules endpoint, we'll fetch all learning paths and their modules
      const response = await fetchWithAuth(
        "http://localhost:8000/api/v1/education/learning-paths/"
      );
      if (response.ok) {
        const learningPaths = await response.json();

        // Fetch modules for each learning path
        const allModules: Module[] = [];
        for (const path of learningPaths) {
          const modulesResponse = await fetchWithAuth(
            `http://localhost:8000/api/v1/education/learning-paths/${path.id}/modules`
          );
          if (modulesResponse.ok) {
            const pathModules = await modulesResponse.json();
            const modulesWithPath = pathModules.map((module: any) => ({
              ...module,
              learning_path: {
                id: path.id,
                title: path.title,
                level: path.level,
              },
              lessons_count: module.lessons?.length || 0,
            }));
            allModules.push(...modulesWithPath);
          }
        }
        setModules(allModules);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      addNotification("error", "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const filterModules = () => {
    let filtered = modules;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (module) =>
          module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          module.learning_path?.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((module) =>
        statusFilter === "active" ? module.is_active : !module.is_active
      );
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(
        (module) => module.learning_path?.level === levelFilter
      );
    }

    setFilteredModules(filtered);
  };

  const handleDeleteModule = (moduleId: number) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    showGenericConfirmation(
      "Delete Module",
      `Are you sure you want to delete "${module.title}"? This will also delete all lessons within it.`,
      moduleId,
      "danger"
    );
  };

  const performDelete = async (moduleId: number) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/modules/${moduleId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        addNotification("success", "Module deleted successfully");
        fetchModules(); // Refresh the list
      } else {
        addNotification("error", "Failed to delete module");
      }
    } catch (error) {
      console.error("Error deleting module:", error);
      addNotification("error", "Failed to delete module");
    }
  };

  // Define columns for modules table
  const moduleColumns: Column<Module>[] = [
    {
      key: "title",
      label: "Module",
      sortable: true,
      render: (module) => (
        <div>
          <div className="font-medium text-gray-900">{module.title}</div>
          <div className="text-sm text-gray-500">
            {module.description.length > 80
              ? `${module.description.substring(0, 80)}...`
              : module.description}
          </div>
        </div>
      ),
    },
    {
      key: "learning_path",
      label: "Learning Path",
      sortable: true,
      render: (module) => (
        <div>
          <div className="font-medium text-gray-900">
            {module.learning_path?.title}
          </div>
          <div className="text-sm text-gray-500">
            {module.learning_path?.level}
          </div>
        </div>
      ),
    },
    {
      key: "lessons_count",
      label: "Lessons",
      sortable: true,
      render: (module) => (
        <span className="text-sm text-gray-900">{module.lessons_count}</span>
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
      key: "sort_order",
      label: "Order",
      sortable: true,
      render: (module) => (
        <span className="text-sm text-gray-600">#{module.sort_order}</span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (module) => (
        <StatusBadge
          status={module.is_active ? "Active" : "Inactive"}
          size="sm"
        />
      ),
    },
  ];

  // Define action buttons
  const moduleActions: ActionButton<Module>[] = [
    {
      type: "view",
      label: "View",
      href: (module) => `/education/modules/${module.id}`,
    },
    {
      type: "edit",
      label: "Edit",
      href: (module) => `/education/modules/${module.id}/edit`,
    },
    {
      type: "delete",
      label: "Delete",
      onClick: (module) => handleDeleteModule(module.id),
    },
  ];

  const uniqueLevels = Array.from(
    new Set(
      modules.map((module) => module.learning_path?.level).filter(Boolean)
    )
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
          <p className="mt-2 text-gray-600">
            Manage learning modules across all paths
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/education/modules/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Module
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search modules, descriptions, or learning paths..."
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
              {uniqueLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">
            {modules.length}
          </div>
          <div className="text-sm text-gray-600">Total Modules</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {modules.filter((m) => m.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Active Modules</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {modules.reduce((sum, m) => sum + m.lessons_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Lessons</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(
              modules.reduce((sum, m) => sum + m.estimated_duration, 0) / 60
            )}
            h
          </div>
          <div className="text-sm text-gray-600">Total Duration</div>
        </div>
      </div>

      {/* Modules Table */}
      <div className="bg-white rounded-lg shadow">
        {filteredModules.length === 0 ? (
          <EmptyState
            title="No modules found"
            description="No modules match your current filters."
            action={{
              label: "Clear Filters",
              onClick: () => {
                setSearchQuery("");
                setStatusFilter("all");
                setLevelFilter("all");
              },
            }}
          />
        ) : (
          <DataTable
            data={filteredModules}
            columns={moduleColumns}
            actions={moduleActions}
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
