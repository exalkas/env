"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchLearningPaths,
  enrollInLearningPath,
  fetchUserStats as fetchUserStatsAPI,
} from "@/lib/api";
import {
  NotificationContainer,
  NotificationProps,
  LearningPathCard,
} from "@/components/shared";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  TrophyIcon,
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
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "my-learning">(
    "browse"
  );

  useEffect(() => {
    if (user) {
      loadLearningPaths();
      fetchUserStats();
    }
  }, [user]);

  const loadLearningPaths = async () => {
    try {
      const data = await fetchLearningPaths({ is_active: true });
      console.log("Learning paths data:", data);
      setLearningPaths(data);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log("Fetching user stats...");
      const stats = await fetchUserStatsAPI();
      console.log("User stats received:", stats);
      setUserStats(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Fallback to zeros
      setUserStats({
        enrolled_paths: 0,
        completed_paths: 0,
        total_learning_time: 0,
        certificates_earned: 0,
        current_streak: 0,
      });
    }
  };

  const addNotification = (
    notification: Omit<NotificationProps, "id" | "onDismiss">
  ) => {
    const id = Date.now().toString();
    const newNotification: NotificationProps = {
      ...notification,
      id,
      onDismiss: dismissNotification,
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEnroll = async (pathId: number) => {
    setEnrolling(pathId);
    try {
      const result = await enrollInLearningPath(pathId);

      addNotification({
        type: "success",
        title: "Enrollment Successful!",
        message: `You have been enrolled in "${result.learning_path}". Start learning now!`,
        duration: 6000,
      });

      // Refresh learning paths and user stats to show updated enrollment status
      await loadLearningPaths();
      await fetchUserStats();
    } catch (error: any) {
      console.error("Error enrolling in learning path:", error);

      let errorMessage = "Failed to enroll in learning path. Please try again.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      addNotification({
        type: "error",
        title: "Enrollment Failed",
        message: errorMessage,
        duration: 8000,
      });
    } finally {
      setEnrolling(null);
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
                  <LearningPathCard
                    key={path.id}
                    path={path}
                    variant="available"
                    onEnroll={handleEnroll}
                    isEnrolling={enrolling !== null}
                    enrollingId={enrolling}
                  />
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
                  <LearningPathCard
                    key={path.id}
                    path={path}
                    variant="enrolled"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
