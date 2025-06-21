"use client";

import { useEffect, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/utils/auth";
import ConfirmationModal from "@/components/ConfirmationModal";
import { NotificationContainer } from "@/components/NotificationToast";
import { Button, SearchInput, FormSelect } from "@/components/shared";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

interface Assessment {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  questions_count: number;
  pass_threshold: number;
  time_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  learning_path?: {
    id: number;
    title: string;
    level: string;
  };
}

interface AssessmentStats {
  total_assessments: number;
  active_assessments: number;
  total_attempts: number;
  average_score: number;
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<Assessment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
    fetchStats();
  }, []);

  const addNotification = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      onDismiss: dismissNotification,
    };
    setNotifications((prev) => [...prev, notification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const fetchAssessments = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/v1/education/assessments"
      );
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/v1/education/assessments/stats"
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching assessment stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessmentClick = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteAssessmentConfirm = async () => {
    if (!assessmentToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/assessments/${assessmentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setAssessments((prev) =>
          prev.filter((assessment) => assessment.id !== assessmentToDelete.id)
        );
        setShowDeleteModal(false);
        setAssessmentToDelete(null);
        addNotification(
          "success",
          "Assessment Deleted",
          `Assessment "${assessmentToDelete.title}" has been deleted successfully!`
        );
        // Refresh stats
        fetchStats();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to delete assessment" }));
        setDeleteError(errorData.detail || "Failed to delete assessment");
        addNotification(
          "error",
          "Delete Failed",
          errorData.detail || "Failed to delete assessment"
        );
      }
    } catch (error) {
      console.error("Error deleting assessment:", error);
      setDeleteError("Network error occurred while deleting assessment");
      addNotification(
        "error",
        "Network Error",
        "A network error occurred while deleting the assessment"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAssessmentCancel = () => {
    setShowDeleteModal(false);
    setAssessmentToDelete(null);
    setDeleteError(null);
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.learning_path?.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && assessment.is_active) ||
      (filterStatus === "inactive" && !assessment.is_active);

    return matchesSearch && matchesFilter;
  });

  const getLevelBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-orange-100 text-orange-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Assessment Management
            </h1>
            <p className="mt-2 text-gray-600">
              Create and manage assessments to test learner understanding
            </p>
          </div>
          <Link
            href="/education/assessments/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Assessment
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Assessments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.total_assessments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Assessments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.active_assessments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Attempts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.total_attempts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-yellow-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.average_score?.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search assessments..."
              />
            </div>

            {/* Status Filter */}
            <div>
              <FormSelect
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
              >
                <option value="all">All Assessments</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </FormSelect>
            </div>
          </div>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Assessments ({filteredAssessments.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || filterStatus !== "all"
                  ? "No assessments found"
                  : "No assessments yet"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first assessment."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <div className="mt-6">
                  <Button
                    href="/education/assessments/create"
                    variant="success"
                    icon={PlusIcon}
                  >
                    Create Assessment
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Learning Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assessment.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assessment.description}
                        </div>
                        {assessment.time_limit && (
                          <div className="text-xs text-gray-400 mt-1">
                            Time limit: {assessment.time_limit} minutes
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {assessment.learning_path?.title ||
                            "No path assigned"}
                        </div>
                        {assessment.learning_path?.level && (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                              assessment.learning_path.level
                            )}`}
                          >
                            {assessment.learning_path.level}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.questions_count} questions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.pass_threshold}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assessment.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {assessment.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/education/assessments/${assessment.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View assessment"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/education/assessments/${assessment.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit assessment"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <Button
                          onClick={() =>
                            handleDeleteAssessmentClick(assessment)
                          }
                          variant="ghost"
                          size="sm"
                          icon={TrashIcon}
                          iconOnly={true}
                          className="text-red-600 hover:text-red-900"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onConfirm={handleDeleteAssessmentConfirm}
          onClose={handleDeleteAssessmentCancel}
          isLoading={isDeleting}
          title="Delete Assessment"
          message={`Are you sure you want to delete the assessment "${assessmentToDelete?.title}"? This action cannot be undone.`}
          error={deleteError}
        />
      )}

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
