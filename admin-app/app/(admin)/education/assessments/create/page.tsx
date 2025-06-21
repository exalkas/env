"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  LoadingSpinner,
  FormInput,
  FormTextarea,
  FormSelect,
  QuestionCategorySelect,
  SearchInput,
  StatusBadge,
} from "@/components/shared";
import { fetchWithAuth } from "@/lib/utils/auth";
import { NotificationContainer } from "@/components/NotificationToast";
import {
  useNotifications,
  useFormData,
  useApiData,
  useAsyncOperation,
} from "@/lib/hooks";

interface LearningPath {
  id: number;
  title: string;
  level: string;
}

interface Question {
  id: number;
  title: string;
  question_text: string;
  question_type: string;
  difficulty_level: string;
  category: string;
  points: number;
  tags: string[];
  is_active: boolean;
}

interface QuestionBank {
  questions: Question[];
  total: number;
  page: number;
  page_size: number;
}

interface FormData {
  title: string;
  description: string;
  learning_path_id: string;
  module_id: string;
  lesson_id: string;
  passing_score: number;
  time_limit: number;
  max_attempts: number;
  randomize_questions: boolean;
  show_results_immediately: boolean;
  allow_review: boolean;
  is_active: boolean;
  question_ids: number[];
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionFilter, setQuestionFilter] = useState({
    question_type: "",
    difficulty: "",
    category: "",
  });
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  // Custom hooks usage
  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  const { formData, errors, updateField, validate, setFormErrors } =
    useFormData<FormData>({
      initialData: {
        title: "",
        description: "",
        learning_path_id: "",
        module_id: "",
        lesson_id: "",
        passing_score: 70,
        time_limit: 60,
        max_attempts: 3,
        randomize_questions: false,
        show_results_immediately: true,
        allow_review: true,
        is_active: true,
        question_ids: [],
      },
      validator: (data) => {
        const errors: Record<string, string> = {};

        if (!data.title.trim()) {
          errors.title = "Title is required";
        }

        if (!data.description.trim()) {
          errors.description = "Description is required";
        }

        if (data.question_ids.length === 0) {
          errors.questions = "At least one question is required";
        }

        if (data.passing_score < 0 || data.passing_score > 100) {
          errors.passing_score = "Passing score must be between 0 and 100";
        }

        return errors;
      },
    });

  const { data: learningPaths, loading: loadingPaths } = useApiData<
    LearningPath[]
  >("http://localhost:8000/api/v1/education/learning-paths/");

  // Build query parameters properly - only include non-empty values
  const questionQuery = useMemo(() => {
    const params = new URLSearchParams();

    if (questionSearch.trim()) {
      params.append("search", questionSearch.trim());
    }
    if (questionFilter.question_type) {
      params.append("question_type", questionFilter.question_type);
    }
    if (questionFilter.difficulty) {
      params.append("difficulty", questionFilter.difficulty);
    }
    if (questionFilter.category) {
      params.append("category", questionFilter.category);
    }

    params.append("is_active", "true");
    params.append("limit", "50");

    return params.toString();
  }, [
    questionSearch,
    questionFilter.question_type,
    questionFilter.difficulty,
    questionFilter.category,
  ]);

  // Fetch questions for selection
  const { data: questionBank, loading: loadingQuestions } =
    useApiData<QuestionBank>(
      `http://localhost:8000/api/v1/education/questions/?${questionQuery}`
    );

  const { loading, execute } = useAsyncOperation({
    showNotifications: true,
    addNotification,
    redirectTo: "/education/assessments",
    redirectDelay: 1500,
  });

  // Update question_ids when selectedQuestions changes
  useEffect(() => {
    updateField(
      "question_ids",
      selectedQuestions.map((q) => q.id)
    );
  }, [selectedQuestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await execute(
      async () => {
        const submitData = {
          ...formData,
          learning_path_id: formData.learning_path_id
            ? parseInt(formData.learning_path_id)
            : null,
          module_id: formData.module_id ? parseInt(formData.module_id) : null,
          lesson_id: formData.lesson_id ? parseInt(formData.lesson_id) : null,
          time_limit: formData.time_limit || null,
        };

        const response = await fetchWithAuth(
          "http://localhost:8000/api/v1/education/assessments/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(submitData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 400 && errorData.detail) {
            setFormErrors({ general: errorData.detail });
            throw new Error(errorData.detail);
          } else {
            throw new Error("Failed to create assessment");
          }
        }

        return response.json();
      },
      "Assessment Created Successfully!",
      "Failed to create assessment"
    );
  };

  const handleAddQuestion = (question: Question) => {
    if (!selectedQuestions.find((q) => q.id === question.id)) {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleRemoveQuestion = (questionId: number) => {
    setSelectedQuestions(selectedQuestions.filter((q) => q.id !== questionId));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "HARD":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "Multiple Choice";
      case "multiple_select":
        return "Multiple Select";
      case "true_false":
        return "True/False";
      case "fill_in_blank":
        return "Fill in Blank";
      case "numeric":
        return "Numeric";
      case "essay":
        return "Essay";
      default:
        return type;
    }
  };

  if (loadingPaths) {
    return <LoadingSpinner size="lg" message="Loading learning paths..." />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/education/assessments"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Assessments
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Assessment</h1>
        <p className="mt-2 text-gray-600">
          Create a new assessment to test learner understanding
        </p>
      </div>

      {/* Error Alert */}
      {errors.general && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error creating assessment
              </h3>
              <div className="mt-2 text-sm text-red-700">{errors.general}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assessment Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Assessment Details
          </h2>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title *
              </label>
              <FormInput
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter assessment title"
                error={errors.title}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description *
              </label>
              <FormTextarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Enter assessment description"
                error={errors.description}
                required
              />
            </div>

            {/* Learning Path */}
            <div>
              <label
                htmlFor="learning_path_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Learning Path
              </label>
              <FormSelect
                id="learning_path_id"
                value={formData.learning_path_id}
                onChange={(e) =>
                  updateField("learning_path_id", e.target.value)
                }
              >
                <option value="">Select a learning path</option>
                {learningPaths?.map((path) => (
                  <option key={path.id} value={path.id}>
                    {path.title} ({path.level})
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="passing_score"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Passing Score (%)
                </label>
                <FormInput
                  id="passing_score"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.passing_score}
                  onChange={(e) =>
                    updateField("passing_score", parseInt(e.target.value) || 0)
                  }
                  error={errors.passing_score}
                />
              </div>

              <div>
                <label
                  htmlFor="time_limit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time Limit (min)
                </label>
                <FormInput
                  id="time_limit"
                  type="number"
                  min={1}
                  value={formData.time_limit}
                  onChange={(e) =>
                    updateField("time_limit", parseInt(e.target.value) || 0)
                  }
                  placeholder="60"
                />
              </div>

              <div>
                <label
                  htmlFor="max_attempts"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Max Attempts
                </label>
                <FormInput
                  id="max_attempts"
                  type="number"
                  min={1}
                  value={formData.max_attempts}
                  onChange={(e) =>
                    updateField("max_attempts", parseInt(e.target.value) || 1)
                  }
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Options</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    id="randomize_questions"
                    type="checkbox"
                    checked={formData.randomize_questions}
                    onChange={(e) =>
                      updateField("randomize_questions", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="randomize_questions"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Randomize question order
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="show_results_immediately"
                    type="checkbox"
                    checked={formData.show_results_immediately}
                    onChange={(e) =>
                      updateField("show_results_immediately", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="show_results_immediately"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Show results immediately
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="allow_review"
                    type="checkbox"
                    checked={formData.allow_review}
                    onChange={(e) =>
                      updateField("allow_review", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="allow_review"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Allow answer review
                  </label>
                </div>

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
                    Active (available to learners)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Questions ({selectedQuestions.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select questions from the question bank for this assessment
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={PlusIcon}
              onClick={() => setShowQuestionSelector(!showQuestionSelector)}
            >
              {showQuestionSelector ? "Hide Questions" : "Add Questions"}
            </Button>
          </div>

          {errors.questions && (
            <div className="mb-4 text-sm text-red-600">{errors.questions}</div>
          )}

          {/* Selected Questions */}
          {selectedQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No questions selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Click &quot;Add Questions&quot; to select from the question bank
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {question.title}
                      </span>
                      <StatusBadge
                        status={getQuestionTypeLabel(question.question_type)}
                        variant="info"
                      />
                      <span
                        className={`text-xs font-medium ${getDifficultyColor(
                          question.difficulty_level
                        )}`}
                      >
                        {question.difficulty_level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 ml-9">
                      {question.question_text.replace(/<[^>]*>/g, "")}
                    </p>
                    <div className="flex items-center gap-4 mt-2 ml-9">
                      <span className="text-xs text-gray-500">
                        {question.points} point
                        {question.points !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        {question.category}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={XMarkIcon}
                    onClick={() => handleRemoveQuestion(question.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  />
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">
                    {selectedQuestions.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-medium">
                    {selectedQuestions.reduce((sum, q) => sum + q.points, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Question Selector */}
          {showQuestionSelector && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-4">
                Question Bank
              </h3>

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <SearchInput
                  value={questionSearch}
                  onChange={setQuestionSearch}
                  placeholder="Search questions..."
                  className="w-full"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormSelect
                    value={questionFilter.question_type}
                    onChange={(e) =>
                      setQuestionFilter({
                        ...questionFilter,
                        question_type: e.target.value,
                      })
                    }
                  >
                    <option value="">All Types</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="multiple_select">Multiple Select</option>
                    <option value="true_false">True/False</option>
                    <option value="fill_in_blank">Fill in Blank</option>
                    <option value="numeric">Numeric</option>
                    <option value="essay">Essay</option>
                  </FormSelect>

                  <FormSelect
                    value={questionFilter.difficulty}
                    onChange={(e) =>
                      setQuestionFilter({
                        ...questionFilter,
                        difficulty: e.target.value,
                      })
                    }
                  >
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </FormSelect>

                  <QuestionCategorySelect
                    value={questionFilter.category}
                    onChange={(value) =>
                      setQuestionFilter({
                        ...questionFilter,
                        category: value,
                      })
                    }
                    includeAll={true}
                  />
                </div>
              </div>

              {/* Questions List */}
              {loadingQuestions ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
                  {questionBank?.questions?.map((question) => {
                    const isSelected = selectedQuestions.some(
                      (q) => q.id === question.id
                    );
                    return (
                      <div
                        key={question.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() =>
                          !isSelected && handleAddQuestion(question)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {question.title}
                              </span>
                              <StatusBadge
                                status={getQuestionTypeLabel(
                                  question.question_type
                                )}
                                variant="info"
                              />
                              <span
                                className={`text-xs font-medium ${getDifficultyColor(
                                  question.difficulty_level
                                )}`}
                              >
                                {question.difficulty_level}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {question.question_text.replace(/<[^>]*>/g, "")}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {question.points} point
                                {question.points !== 1 ? "s" : ""}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {question.category}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="ml-2 text-blue-600 text-sm font-medium">
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {questionBank?.questions?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No questions found</p>
                      <p className="text-sm mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            loading={loading}
            disabled={loading || selectedQuestions.length === 0}
            className="flex-1 sm:flex-none"
          >
            Create Assessment
          </Button>
          <Link
            href="/education/assessments"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
