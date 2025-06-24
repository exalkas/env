"use client";

import { useState, useEffect } from "react";
import {
  AcademicCapIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Assessment {
  id: number;
  title: string;
  description: string;
  questions_count: number;
  pass_threshold: number;
  time_limit?: number;
  is_active: boolean;
  learning_path?: {
    id: number;
    title: string;
    level: string;
  };
}

interface UserAssessmentAttempt {
  id: number;
  assessment_id: number;
  score?: number;
  passed?: boolean;
  completed_at?: string;
  status: "in_progress" | "completed" | "abandoned";
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<UserAssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>("all");

  useEffect(() => {
    fetchAssessments();
    fetchUserAttempts();
  }, []);

  const fetchAssessments = async () => {
    try {
      // This would be replaced with actual API call
      const mockAssessments: Assessment[] = [
        {
          id: 1,
          title: "Carbon Trading Fundamentals",
          description:
            "Test your understanding of basic carbon trading concepts, market mechanisms, and regulatory frameworks.",
          questions_count: 15,
          pass_threshold: 70,
          time_limit: 30,
          is_active: true,
          learning_path: {
            id: 1,
            title: "Carbon Trading Basics",
            level: "Beginner",
          },
        },
        {
          id: 2,
          title: "EU ETS Advanced Concepts",
          description:
            "Advanced assessment covering EU Emissions Trading System, allocation methods, and compliance strategies.",
          questions_count: 20,
          pass_threshold: 75,
          time_limit: 45,
          is_active: true,
          learning_path: {
            id: 2,
            title: "EU ETS Mastery",
            level: "Advanced",
          },
        },
        {
          id: 3,
          title: "Voluntary Carbon Markets",
          description:
            "Comprehensive test on VCM standards, methodologies, and offset project development.",
          questions_count: 25,
          pass_threshold: 80,
          time_limit: 60,
          is_active: true,
          learning_path: {
            id: 3,
            title: "VCM Expertise",
            level: "Expert",
          },
        },
        {
          id: 4,
          title: "CBAM Implementation",
          description:
            "Assessment on Carbon Border Adjustment Mechanism implementation and compliance requirements.",
          questions_count: 18,
          pass_threshold: 75,
          time_limit: 40,
          is_active: true,
          learning_path: {
            id: 4,
            title: "CBAM Compliance",
            level: "Intermediate",
          },
        },
      ];
      setAssessments(mockAssessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    }
  };

  const fetchUserAttempts = async () => {
    try {
      // This would be replaced with actual API call
      const mockAttempts: UserAssessmentAttempt[] = [
        {
          id: 1,
          assessment_id: 1,
          score: 85,
          passed: true,
          completed_at: "2024-01-15T10:30:00Z",
          status: "completed",
        },
        {
          id: 2,
          assessment_id: 2,
          score: 65,
          passed: false,
          completed_at: "2024-01-14T14:20:00Z",
          status: "completed",
        },
      ];
      setAttempts(mockAttempts);
    } catch (error) {
      console.error("Error fetching attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttemptForAssessment = (assessmentId: number) => {
    return attempts.find((attempt) => attempt.assessment_id === assessmentId);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const filteredAssessments = assessments.filter((assessment) => {
    if (filterLevel === "all") return true;
    return (
      assessment.learning_path?.level.toLowerCase() ===
      filterLevel.toLowerCase()
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessments</h1>
        <p className="text-gray-600">
          Test your knowledge and earn certificates in carbon trading and
          environmental markets.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {assessments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {attempts.filter((a) => a.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-gray-900">
                {attempts.filter((a) => a.passed).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {attempts.length > 0
                  ? Math.round(
                      attempts.reduce((sum, a) => sum + (a.score || 0), 0) /
                        attempts.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Filter by Level
        </h3>
        <div className="flex flex-wrap gap-2">
          {["all", "beginner", "intermediate", "advanced", "expert"].map(
            (level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterLevel === level
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {level === "all"
                  ? "All Levels"
                  : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => {
          const attempt = getAttemptForAssessment(assessment.id);

          return (
            <div
              key={assessment.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {assessment.title}
                    </h3>
                    {assessment.learning_path && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(
                          assessment.learning_path.level
                        )}`}
                      >
                        {assessment.learning_path.level}
                      </span>
                    )}
                  </div>

                  {attempt && (
                    <div className="ml-4">
                      {attempt.passed ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      ) : attempt.status === "completed" ? (
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                      ) : (
                        <ClockIcon className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {assessment.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    {assessment.questions_count} questions
                  </div>

                  {assessment.time_limit && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {formatTime(assessment.time_limit)} time limit
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <TrophyIcon className="h-4 w-4 mr-2" />
                    {assessment.pass_threshold}% to pass
                  </div>
                </div>

                {/* Previous Attempt Results */}
                {attempt && attempt.status === "completed" && (
                  <div
                    className={`p-3 rounded-lg mb-4 ${
                      attempt.passed
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          attempt.passed ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        Previous Score: {attempt.score}%
                      </span>
                      <span
                        className={`text-xs ${
                          attempt.passed ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {attempt.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Link href={`/education/assessments/${assessment.id}/take`}>
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <PlayIcon className="h-4 w-4 mr-2" />
                    {attempt?.status === "completed"
                      ? "Retake Assessment"
                      : "Start Assessment"}
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssessments.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No assessments found
          </h3>
          <p className="text-gray-600">
            No assessments match your current filter. Try selecting a different
            level.
          </p>
        </div>
      )}
    </div>
  );
}
