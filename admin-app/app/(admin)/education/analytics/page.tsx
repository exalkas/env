"use client";

import { useEffect, useState } from "react";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "@/lib/utils/auth";

interface AnalyticsData {
  overview: {
    total_learners: number;
    active_learners: number;
    total_completions: number;
    average_completion_rate: number;
    total_learning_time: number;
    popular_paths: Array<{
      id: number;
      title: string;
      enrollments: number;
      completion_rate: number;
    }>;
  };
  learning_paths: Array<{
    id: number;
    title: string;
    level: string;
    total_enrollments: number;
    completions: number;
    completion_rate: number;
    average_score: number;
    average_time: number;
  }>;
  recent_activity: Array<{
    id: number;
    user_name: string;
    activity_type: "ENROLLMENT" | "COMPLETION" | "CERTIFICATE";
    learning_path: string;
    timestamp: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d" | "all">(
    "30d"
  );

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/analytics?period=${timeFilter}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ENROLLMENT":
        return UserGroupIcon;
      case "COMPLETION":
        return AcademicCapIcon;
      case "CERTIFICATE":
        return TrophyIcon;
      default:
        return AcademicCapIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "ENROLLMENT":
        return "text-blue-600";
      case "COMPLETION":
        return "text-green-600";
      case "CERTIFICATE":
        return "text-yellow-600";
      default:
        return "text-gray-600";
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
              Learning Analytics
            </h1>
            <p className="mt-2 text-gray-600">
              Track learner progress and system performance
            </p>
          </div>
          <div>
            <select
              value={timeFilter}
              onChange={(e) =>
                setTimeFilter(e.target.value as "7d" | "30d" | "90d" | "all")
              }
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Learners
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {data.overview.total_learners}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    <span className="text-green-600 font-medium">
                      {data.overview.active_learners}
                    </span>{" "}
                    active
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrophyIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {data.overview.total_completions}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    <span className="text-green-600 font-medium">
                      {data.overview.average_completion_rate.toFixed(1)}%
                    </span>{" "}
                    avg. rate
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Learning Time
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatDuration(data.overview.total_learning_time)}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    Total hours invested
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Engagement
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(
                          (data.overview.active_learners /
                            data.overview.total_learners) *
                          100
                        ).toFixed(0)}
                        %
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    Learner activity rate
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Learning Paths */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Popular Learning Paths
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {data.overview.popular_paths.map((path, index) => (
                    <div
                      key={path.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {path.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {path.enrollments} enrollments
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {path.completion_rate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">completion</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {data.recent_activity.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(
                      activity.activity_type
                    );
                    return (
                      <div key={index} className="flex items-start">
                        <div
                          className={`flex-shrink-0 ${getActivityColor(
                            activity.activity_type
                          )}`}
                        >
                          <ActivityIcon className="h-5 w-5" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">
                              {activity.user_name}
                            </span>
                            {activity.activity_type === "ENROLLMENT" &&
                              " enrolled in "}
                            {activity.activity_type === "COMPLETION" &&
                              " completed "}
                            {activity.activity_type === "CERTIFICATE" &&
                              " earned certificate for "}
                            <span className="font-medium">
                              {activity.learning_path}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Learning Paths Performance */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Learning Path Performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Learning Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.learning_paths.map((path) => (
                    <tr key={path.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {path.title}
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                              path.level
                            )}`}
                          >
                            {path.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {path.total_enrollments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 mr-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${path.completion_rate}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {path.completion_rate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {path.average_score
                          ? `${path.average_score.toFixed(1)}%`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(path.average_time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
