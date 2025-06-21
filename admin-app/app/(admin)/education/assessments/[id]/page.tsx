"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { Button, LoadingSpinner, StatusBadge } from "@/components/shared";
import { fetchWithAuth } from "@/lib/utils/auth";

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

interface AssessmentQuestion {
  id: number;
  question_id: number;
  sort_order: number;
  points: number;
  question: Question;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  learning_path_id?: number;
  module_id?: number;
  lesson_id?: number;
  passing_score: number;
  time_limit?: number;
  max_attempts: number;
  randomize_questions: boolean;
  show_results_immediately: boolean;
  allow_review: boolean;
  is_active: boolean;
  total_points?: number;
  created_at: string;
  updated_at: string;
  assessment_questions: AssessmentQuestion[];
  learning_path?: {
    id: number;
    title: string;
    level: string;
  };
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/assessments/${assessmentId}`
      );

      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      } else if (response.status === 404) {
        setError("Assessment not found");
      } else {
        setError("Failed to load assessment");
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading assessment..." />;
  }

  if (error || !assessment) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Assessment Not Found"}
          </h1>
          <Button href="/education/assessments">Back to Assessments</Button>
        </div>
      </div>
    );
  }

  // Sort questions by sort_order
  const sortedQuestions =
    assessment.assessment_questions?.sort(
      (a, b) => a.sort_order - b.sort_order
    ) || [];
  const totalPoints = sortedQuestions.reduce((sum, aq) => sum + aq.points, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeftIcon}
            href="/education/assessments"
          >
            Back to Assessments
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {assessment.title}
            </h1>
            {assessment.description && (
              <p className="mt-2 text-gray-600">{assessment.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <StatusBadge
              status={assessment.is_active ? "Active" : "Inactive"}
              size="md"
            />
            <Button
              icon={PencilIcon}
              href={`/education/assessments/${assessment.id}/edit`}
            >
              Edit Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* Assessment Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {sortedQuestions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Passing Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {assessment.passing_score}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Time Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                {assessment.time_limit
                  ? `${assessment.time_limit}m`
                  : "Unlimited"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Assessment Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Max Attempts:</span>
            <span className="ml-2 font-medium text-gray-900">
              {assessment.max_attempts}
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon
              className={`h-5 w-5 mr-2 ${
                assessment.randomize_questions
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            />
            <span className="text-sm text-gray-600">Randomize Questions:</span>
            <span className="ml-2 font-medium text-gray-900">
              {assessment.randomize_questions ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon
              className={`h-5 w-5 mr-2 ${
                assessment.show_results_immediately
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            />
            <span className="text-sm text-gray-600">Show Results:</span>
            <span className="ml-2 font-medium text-gray-900">
              {assessment.show_results_immediately ? "Immediately" : "Later"}
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon
              className={`h-5 w-5 mr-2 ${
                assessment.allow_review ? "text-green-500" : "text-gray-400"
              }`}
            />
            <span className="text-sm text-gray-600">Allow Review:</span>
            <span className="ml-2 font-medium text-gray-900">
              {assessment.allow_review ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Learning Path Info */}
        {assessment.learning_path && (
          <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Learning Path
            </h2>
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-medium text-gray-900">
                  {assessment.learning_path.title}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(
                    assessment.learning_path.level
                  )}`}
                >
                  {assessment.learning_path.level}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                href={`/education/learning-paths/${assessment.learning_path.id}`}
              >
                View Path
              </Button>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Assessment Questions ({sortedQuestions.length})
          </h2>

          {sortedQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No questions assigned
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This assessment doesn't have any questions yet.
              </p>
              <Button
                href={`/education/assessments/${assessment.id}/edit`}
                className="mt-4"
                size="sm"
              >
                Add Questions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedQuestions.map((assessmentQuestion, index) => {
                const question = assessmentQuestion.question;
                return (
                  <div
                    key={assessmentQuestion.id}
                    className="p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {question.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge
                              status={getQuestionTypeLabel(
                                question.question_type
                              )}
                              variant="info"
                            />
                            <span
                              className={`text-sm font-medium ${getDifficultyColor(
                                question.difficulty_level
                              )}`}
                            >
                              {question.difficulty_level}
                            </span>
                            <span className="text-sm text-gray-500">
                              {question.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {assessmentQuestion.points} point
                          {assessmentQuestion.points !== 1 ? "s" : ""}
                        </div>
                        <div className="text-xs text-gray-500">
                          Order: {assessmentQuestion.sort_order}
                        </div>
                      </div>
                    </div>

                    <div className="ml-11">
                      <div
                        className="text-sm text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: question.question_text,
                        }}
                      />

                      {question.tags && question.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {question.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{sortedQuestions.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-medium">{totalPoints}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">
                    Points Required to Pass:
                  </span>
                  <span className="font-medium">
                    {Math.ceil((totalPoints * assessment.passing_score) / 100)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assessment Metadata */}
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Assessment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Assessment ID
              </h3>
              <p className="mt-1 text-sm text-gray-900">{assessment.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Created</h3>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(assessment.created_at)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Last Updated
              </h3>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(assessment.updated_at)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Learning Path ID
              </h3>
              <p className="mt-1 text-sm text-gray-900">
                {assessment.learning_path_id || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            icon={PencilIcon}
            href={`/education/assessments/${assessment.id}/edit`}
          >
            Edit Assessment
          </Button>
          <Button variant="secondary" href="/education/assessments">
            Back to Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}
