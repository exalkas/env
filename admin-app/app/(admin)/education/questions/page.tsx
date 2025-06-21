"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  Button,
  DataTable,
  SearchInput,
  FormSelect,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  type Column,
  type ActionButton,
} from "@/components/shared";
import ConfirmationModal from "@/components/ConfirmationModal";
import { NotificationContainer } from "@/components/NotificationToast";
import {
  getQuestions,
  deleteQuestion,
  getAssessmentStats,
  type Question,
  type QuestionBank,
  type QuestionType,
  type QuestionDifficulty,
  type AssessmentStats,
} from "@/lib/api/education";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const QUESTION_TYPES: { value: QuestionType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "multiple_select", label: "Multiple Select" },
  { value: "true_false", label: "True/False" },
  { value: "fill_in_blank", label: "Fill in Blank" },
  { value: "numeric", label: "Numeric" },
  { value: "essay", label: "Essay" },
  { value: "matching", label: "Matching" },
  { value: "ordering", label: "Ordering" },
];

const DIFFICULTY_LEVELS: {
  value: QuestionDifficulty | "all";
  label: string;
}[] = [
  { value: "all", label: "All Levels" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const CATEGORIES = [
  "all",
  "EUA",
  "EUA2",
  "GOO",
  "GEO",
  "VCM",
  "BIOFUELS",
  "CBAM",
  "GENERAL",
];

export default function QuestionsPage() {
  const router = useRouter();
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<
    QuestionDifficulty | "all"
  >("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, []);

  // When filters change, reset to page 1 and fetch
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchQuestions(1);
  }, [searchTerm, filterType, filterDifficulty, filterCategory, filterStatus]);

  // When page changes, fetch with current page
  useEffect(() => {
    fetchQuestions(pagination.page);
  }, [pagination.page]);

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

  const fetchQuestions = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      const skip = (page - 1) * pagination.limit;
      const params: any = {
        skip,
        limit: pagination.limit,
        sort_by: "created_at",
        sort_order: "desc" as const,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterType !== "all") params.question_type = filterType;
      if (filterDifficulty !== "all") params.difficulty = filterDifficulty;
      if (filterCategory !== "all") params.category = filterCategory;
      if (filterStatus !== "all") params.is_active = filterStatus === "active";

      const data = await getQuestions(params);
      setQuestionBank(data);

      // Update pagination with total count
      const newPagination = {
        page,
        limit: pagination.limit,
        total: data.total,
        totalPages: Math.ceil(data.total / pagination.limit),
      };
      setPagination(newPagination);
    } catch (error) {
      console.error("Error fetching questions:", error);
      addNotification(
        "error",
        "Failed to load questions",
        "Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getAssessmentStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteQuestion(questionToDelete.id);
      addNotification(
        "success",
        "Question Deleted",
        `"${questionToDelete.title}" has been deleted successfully.`
      );
      fetchQuestions();
      fetchStats();
    } catch (error) {
      addNotification(
        "error",
        "Delete Failed",
        error instanceof Error ? error.message : "Failed to delete question"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  const getQuestionTypeBadge = (type: QuestionType) => {
    return <StatusBadge status={type.replace("_", " ")} variant="info" />;
  };

  const getDifficultyBadge = (difficulty: QuestionDifficulty) => {
    const difficultyVariants: Record<
      QuestionDifficulty,
      "success" | "warning" | "error"
    > = {
      EASY: "success",
      MEDIUM: "warning",
      HARD: "error",
    };
    return (
      <StatusBadge
        status={difficulty}
        variant={difficultyVariants[difficulty]}
      />
    );
  };

  const columns: Column<Question>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (question) => (
        <div>
          <div className="font-medium text-gray-900">{question.title}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {question.question_text.replace(/<[^>]*>/g, "").substring(0, 100)}
            ...
          </div>
        </div>
      ),
    },
    {
      key: "question_type",
      label: "Type",
      render: (question) => getQuestionTypeBadge(question.question_type),
    },
    {
      key: "difficulty_level",
      label: "Difficulty",
      render: (question) => getDifficultyBadge(question.difficulty_level),
    },
    {
      key: "category",
      label: "Category",
      render: (question) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {question.category}
        </span>
      ),
    },
    {
      key: "points",
      label: "Points",
      render: (question) => (
        <span className="text-sm font-medium text-gray-900">
          {question.points}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (question) => (
        <StatusBadge
          status={question.is_active ? "active" : "inactive"}
          variant={question.is_active ? "success" : "error"}
        />
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (question) => (
        <span className="text-sm text-gray-500">
          {new Date(question.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: ActionButton<Question>[] = [
    {
      type: "view",
      label: "View",
      icon: EyeIcon,
      href: (question) => `/education/questions/${question.id}`,
    },
    {
      type: "edit",
      label: "Edit",
      icon: PencilIcon,
      href: (question) => `/education/questions/${question.id}/edit`,
    },
    {
      type: "delete",
      label: "Delete",
      icon: TrashIcon,
      onClick: handleDeleteQuestion,
      className: "text-red-600 hover:text-red-800",
    },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterDifficulty("all");
    setFilterCategory("all");
    setFilterStatus("all");
  };

  if (loading && !questionBank) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600">
            Manage your assessment questions and question bank
          </p>
        </div>
        <Link href="/education/questions/create">
          <Button icon={PlusIcon}>Create Question</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Questions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_questions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Question Types
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.question_types
                    ? Object.keys(stats.question_types).length
                    : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <FunnelIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.category_distribution
                    ? Object.keys(stats.category_distribution).length
                    : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <MagnifyingGlassIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Attempts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_attempts || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <Button variant="ghost" onClick={resetFilters} size="sm">
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search questions..."
            className="md:col-span-2"
          />

          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as QuestionType | "all")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="all">All Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="multiple_select">Multiple Select</option>
            <option value="true_false">True/False</option>
            <option value="fill_in_blank">Fill in Blank</option>
            <option value="numeric">Numeric</option>
            <option value="essay">Essay</option>
            <option value="matching">Matching</option>
            <option value="ordering">Ordering</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) =>
              setFilterDifficulty(e.target.value as QuestionDifficulty | "all")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="all">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="all">All Categories</option>
            <option value="EUA">EUA</option>
            <option value="CBAM">CBAM</option>
            <option value="GOO">GOO</option>
            <option value="VCM">VCM</option>
            <option value="BIOFUELS">Biofuels</option>
          </select>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex gap-2">
            {[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() =>
                  setFilterStatus(status.value as "all" | "active" | "inactive")
                }
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === status.value
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-lg border">
        {questionBank && questionBank.questions.length > 0 ? (
          <>
            <DataTable
              data={questionBank.questions}
              columns={columns}
              actions={actions}
              loading={loading}
            />

            {/* Pagination - Always show when there are questions */}
            {questionBank.total > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.totalPages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  {pagination.totalPages > 1 && (
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              page: Math.max(1, prev.page - 1),
                            }))
                          }
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        {/* Page numbers */}
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (
                              pagination.page >=
                              pagination.totalPages - 2
                            ) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() =>
                                  setPagination((prev) => ({
                                    ...prev,
                                    page: pageNum,
                                  }))
                                }
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pagination.page === pageNum
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              page: Math.min(prev.totalPages, prev.page + 1),
                            }))
                          }
                          disabled={pagination.page === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <EmptyState
              icon={AcademicCapIcon}
              title="No questions found"
              description="Get started by creating your first question."
              action={{
                label: "Create Question",
                href: "/education/questions/create",
              }}
            />
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
