"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  CalendarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  FireIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

interface ProgressData {
  overview: {
    total_learning_time: number;
    courses_enrolled: number;
    courses_completed: number;
    current_streak: number;
    longest_streak: number;
    certificates_earned: number;
    average_score: number;
    total_lessons_completed: number;
  };
  learning_paths: Array<{
    id: number;
    title: string;
    level: string;
    progress_percentage: number;
    time_spent: number;
    lessons_completed: number;
    total_lessons: number;
    last_accessed: string;
    estimated_completion: string;
    completion_rate: number;
  }>;
  activity_history: Array<{
    date: string;
    learning_time: number;
    lessons_completed: number;
    paths_completed: number;
  }>;
  skill_progress: Array<{
    category: string;
    level: number;
    max_level: number;
    experience_points: number;
    next_level_points: number;
  }>;
  achievements: Array<{
    id: number;
    title: string;
    description: string;
    earned_date: string;
    type: string;
  }>;
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "all">(
    "30d"
  );

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user, timeframe]);

  const fetchProgressData = async () => {
    try {
      const response = await fetch(
        `/api/education/progress?timeframe=${timeframe}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const progressData = await response.json();
        setData(progressData);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const getSkillLevelColor = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return "bg-purple-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-green-500";
    if (percentage >= 20) return "bg-yellow-500";
    return "bg-gray-400";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Please log in
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be logged in to view your progress.
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No progress data
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start learning to see your progress analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Learning Progress
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Track your learning journey and achievements
              </p>
            </div>
            <div>
              <select
                value={timeframe}
                onChange={(e) =>
                  setTimeframe(e.target.value as "7d" | "30d" | "90d" | "all")
                }
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Learning Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatDuration(data.overview.total_learning_time)}
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
                  <BookOpenIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Courses Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {data.overview.courses_completed}/
                      {data.overview.courses_enrolled}
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
                  <FireIcon className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Learning Streak
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {data.overview.current_streak} days
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
                      {data.overview.certificates_earned}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {data.overview.average_score.toFixed(1)}%
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
                  <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Lessons Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {data.overview.total_lessons_completed}
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
                  <FireIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Longest Streak
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {data.overview.longest_streak} days
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Paths Progress */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Learning Paths Progress
            </h2>
          </div>
          <div className="p-6">
            {data.learning_paths.length === 0 ? (
              <div className="text-center py-8">
                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No enrolled courses
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start learning to see your progress here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {data.learning_paths.map((path) => (
                  <div
                    key={path.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {path.title}
                          </h3>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                              path.level
                            )}`}
                          >
                            {path.level.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>
                            {path.lessons_completed} of {path.total_lessons}{" "}
                            lessons
                          </span>
                          <span>
                            Time spent: {formatDuration(path.time_spent)}
                          </span>
                          <span>
                            Last accessed:{" "}
                            {new Date(path.last_accessed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {path.progress_percentage}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {path.estimated_completion}
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                          path.progress_percentage
                        )}`}
                        style={{ width: `${path.progress_percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Started</span>
                      <span>
                        Completion rate: {path.completion_rate.toFixed(1)}%
                      </span>
                      <span>Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Skill Progress */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Skill Development
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.skill_progress.map((skill) => (
                <div
                  key={skill.category}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900">
                      {skill.category}
                    </h3>
                    <span className="text-sm text-gray-500">
                      Level {skill.level}/{skill.max_level}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getSkillLevelColor(
                        skill.level,
                        skill.max_level
                      )}`}
                      style={{
                        width: `${(skill.level / skill.max_level) * 100}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{skill.experience_points} XP</span>
                    <span>{skill.next_level_points} XP to next level</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Achievements
            </h2>
          </div>
          <div className="p-6">
            {data.achievements.length === 0 ? (
              <div className="text-center py-8">
                <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No achievements yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Keep learning to unlock achievements.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.achievements.slice(0, 6).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="border border-gray-200 rounded-lg p-4 text-center"
                  >
                    <div className="text-2xl mb-2">🏆</div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {achievement.description}
                    </p>
                    <div className="text-xs text-gray-400">
                      {new Date(achievement.earned_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
