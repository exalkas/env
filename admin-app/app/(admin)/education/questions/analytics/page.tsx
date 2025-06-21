"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button, LoadingSpinner } from "@/components/shared";
import { NotificationContainer } from "@/components/NotificationToast";
import {
  getAssessmentStats,
  type AssessmentStats,
  type QuestionType,
  type QuestionDifficulty,
} from "@/lib/api/education";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

export default function QuestionsAnalyticsPage() {
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
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

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getAssessmentStats();
      setStats(data);
    } catch (error) {
      addNotification(
        "error",
        "Failed to load analytics",
        "Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeColor = (type: QuestionType): string => {
    const colors: Record<QuestionType, string> = {
      multiple_choice: "bg-blue-500",
      multiple_select: "bg-purple-500",
      true_false: "bg-green-500",
      fill_blank: "bg-yellow-500",
      numeric: "bg-orange-500",
      essay: "bg-red-500",
      matching: "bg-indigo-500",
      ordering: "bg-pink-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getDifficultyColor = (difficulty: QuestionDifficulty): string => {
    const colors: Record<QuestionDifficulty, string> = {
      EASY: "bg-green-500",
      MEDIUM: "bg-yellow-500",
      HARD: "bg-red-500",
    };
    return colors[difficulty] || "bg-gray-500";
  };

  const renderChart = (
    data: Record<string, number>,
    title: string,
    getColor: (key: string) => string
  ) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) return null;

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data)
            .sort(([, a], [, b]) => b - a)
            .map(([key, value]) => {
              const percentage = (value / total) * 100;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className={`w-4 h-4 rounded ${getColor(key)} mr-3`} />
                    <span className="text-gray-900 capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getColor(key)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                      {value}
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          No Analytics Available
        </h2>
        <p className="text-gray-600 mb-6">
          No assessment data found to generate analytics.
        </p>
        <Link href="/education/questions">
          <Button variant="primary">Back to Questions</Button>
        </Link>
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
      <div className="flex items-center gap-4">
        <Link href="/education/questions">
          <Button variant="ghost" size="sm" icon={ArrowLeftIcon}>
            Back to Questions
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assessment Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into question bank and assessment performance
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Questions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_questions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Assessments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_assessments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Attempts
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_attempts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.average_score.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completion Rate
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 40 * (1 - stats.completion_rate / 100)
                  }`}
                  className="text-blue-600"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.completion_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-4">
            Assessment completion rate
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Score:</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.average_score.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completion Rate:</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.completion_rate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Attempts:</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.total_attempts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions per Assessment:</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.total_assessments > 0
                  ? (stats.total_questions / stats.total_assessments).toFixed(1)
                  : "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderChart(
          stats.question_types,
          "Question Types Distribution",
          getQuestionTypeColor
        )}

        {renderChart(
          stats.difficulty_distribution,
          "Difficulty Distribution",
          getDifficultyColor
        )}
      </div>

      {/* Category Distribution */}
      {Object.keys(stats.category_distribution).length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.category_distribution)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const percentage = (count / stats.total_questions) * 100;
                return (
                  <div key={category} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {category}
                      </span>
                      <span className="text-sm text-gray-600">
                        {count} questions
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {percentage.toFixed(1)}% of total questions
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Question Bank Health
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                {stats.total_questions} questions available across{" "}
                {Object.keys(stats.category_distribution).length} categories
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {Object.keys(stats.question_types).length} different question
                types implemented
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                Balanced difficulty:{" "}
                {Object.keys(stats.difficulty_distribution).length} levels
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Assessment Performance
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                {stats.completion_rate.toFixed(1)}% completion rate across all
                assessments
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                Average score of {stats.average_score.toFixed(1)}% indicates
                appropriate difficulty
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                {stats.total_attempts} total attempts across{" "}
                {stats.total_assessments} assessments
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Recommendations
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          {stats.average_score < 70 && (
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 mt-2" />
              <p>
                <strong>Consider easier questions:</strong> Average score is{" "}
                {stats.average_score.toFixed(1)}%, which may indicate questions
                are too difficult.
              </p>
            </div>
          )}

          {stats.completion_rate < 80 && (
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 mt-2" />
              <p>
                <strong>Improve completion rates:</strong> Only{" "}
                {stats.completion_rate.toFixed(1)}% of started assessments are
                completed. Consider shorter assessments or better motivation.
              </p>
            </div>
          )}

          {Object.keys(stats.question_types).length < 4 && (
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 mt-2" />
              <p>
                <strong>Diversify question types:</strong> Add more question
                types to create engaging assessments.
              </p>
            </div>
          )}

          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 mt-2" />
            <p>
              <strong>Monitor regularly:</strong> Check these analytics weekly
              to track improvements and identify areas needing attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
