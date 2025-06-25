"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  TrophyIcon,
  PlayIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  estimated_duration: number;
  modules_count: number;
  is_active: boolean;
  created_at: string;
  user_progress?: {
    id: number;
    progress_percentage: number;
    completed_modules: number;
    total_modules: number;
    last_accessed: string;
    is_completed: boolean;
  };
}

interface UserStats {
  enrolled_paths: number;
  completed_paths: number;
  total_learning_time: number;
  certificates_earned: number;
  current_streak: number;
}

export default function EducationDashboard() {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "my-learning">(
    "browse"
  );

  useEffect(() => {
    if (user) {
      fetchLearningPaths();
      fetchUserStats();
    }
  }, [user]);

  const fetchLearningPaths = async () => {
    try {
      const response = await fetch("/api/education/learning-paths", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLearningPaths(data);
      }
    } catch (error) {
      console.error("Error fetching learning paths:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/education/user-stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleEnroll = async (pathId: number) => {
    try {
      const response = await fetch(
        `/api/education/learning-paths/${pathId}/enroll`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        // Refresh data
        fetchLearningPaths();
        fetchUserStats();
      }
    } catch (error) {
      console.error("Error enrolling in learning path:", error);
    }
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const myLearningPaths = learningPaths.filter((path) => path.user_progress);
  const availablePaths = learningPaths.filter(
    (path) => !path.user_progress && path.is_active
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Please log in
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be logged in to access education content.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Green Energy Education
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Master carbon markets, EUAs, CBAM, and sustainable trading practices
          </p>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpenIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Enrolled
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {userStats.enrolled_paths}
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
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {userStats.completed_paths}
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
                    <ClockIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Learning Time
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatDuration(userStats.total_learning_time)}
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
                    <TrophyIcon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Certificates
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {userStats.certificates_earned}
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
                    <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Streak
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {userStats.current_streak} days
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("browse")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "browse"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Browse Courses ({availablePaths.length})
            </button>
            <button
              onClick={() => setActiveTab("my-learning")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "my-learning"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Learning ({myLearningPaths.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "browse" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Available Learning Paths
            </h2>
            {availablePaths.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No courses available
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for new learning opportunities.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePaths.map((path) => (
                  <div
                    key={path.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                            path.level
                          )}`}
                        >
                          {path.level.toLowerCase()}
                        </span>
                        <div className="text-sm text-gray-500">
                          {path.modules_count} modules
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {path.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {path.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDuration(path.estimated_duration)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleEnroll(path.id)}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my-learning" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              My Learning Progress
            </h2>
            {myLearningPaths.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No enrolled courses
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Browse available courses to start your learning journey.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Courses
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myLearningPaths.map((path) => (
                  <div
                    key={path.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                            path.level
                          )}`}
                        >
                          {path.level.toLowerCase()}
                        </span>
                        {path.user_progress?.is_completed && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {path.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {path.description}
                      </p>

                      {path.user_progress && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>
                              {path.user_progress.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${path.user_progress.progress_percentage}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>
                              {path.user_progress.completed_modules} of{" "}
                              {path.user_progress.total_modules} modules
                            </span>
                            <span>
                              Last accessed:{" "}
                              {new Date(
                                path.user_progress.last_accessed
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/education/learning-paths/${path.id}`}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        {path.user_progress?.is_completed
                          ? "Review"
                          : "Continue Learning"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
