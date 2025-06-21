"use client";

import { useEffect, useState } from "react";
import {
  PlusIcon,
  BookOpenIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { fetchWithAuth } from "../../../lib/utils/auth";

interface EducationStats {
  totalLearningPaths: number;
  totalModules: number;
  totalLessons: number;
  totalGlossaryTerms: number;
  activeUsers: number;
  completedCertificates: number;
}

export default function EducationOverview() {
  const [stats, setStats] = useState<EducationStats>({
    totalLearningPaths: 0,
    totalModules: 0,
    totalLessons: 0,
    totalGlossaryTerms: 0,
    activeUsers: 0,
    completedCertificates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducationStats();
  }, []);

  const fetchEducationStats = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/v1/education/stats/overview"
      );
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalLearningPaths: data.total_learning_paths || 0,
          totalModules: data.total_modules || 0,
          totalLessons: data.total_lessons || 0,
          totalGlossaryTerms: data.total_glossary_terms || 0,
          activeUsers: data.active_users || 0,
          completedCertificates: data.completed_certificates || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching education statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: "Learning Paths",
      value: stats.totalLearningPaths,
      icon: BookOpenIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/education/learning-paths",
    },
    {
      name: "Modules",
      value: stats.totalModules,
      icon: AcademicCapIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "Lessons",
      value: stats.totalLessons,
      icon: BookOpenIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "Glossary Terms",
      value: stats.totalGlossaryTerms,
      icon: GlobeAltIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/education/glossary",
    },
    {
      name: "Active Users",
      value: stats.activeUsers,
      icon: ChartBarIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      name: "Certificates Issued",
      value: stats.completedCertificates,
      icon: AcademicCapIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  const quickActions = [
    {
      name: "Create Learning Path",
      description: "Start a new structured course",
      href: "/education/learning-paths/create",
      icon: PlusIcon,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      name: "Add Glossary Term",
      description: "Expand the terminology database",
      href: "/education/glossary/create",
      icon: PlusIcon,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      name: "View Analytics",
      description: "Check learning progress and engagement",
      href: "/education/analytics",
      icon: ChartBarIcon,
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg shadow h-32"
              ></div>
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
        <h1 className="text-3xl font-bold text-gray-900">
          Education Management
        </h1>
        <p className="mt-2 text-gray-600">
          Manage learning paths, content, and track user progress in the Green
          Energy Trading Academy
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stat.value ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            {stat.href && (
              <div className="mt-4">
                <Link
                  href={stat.href}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Manage →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="mt-1 text-gray-600">
            Common tasks to manage your education content
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group relative bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center">
                  <div
                    className={`inline-flex p-3 rounded-lg text-white ${action.color} transition-colors`}
                  >
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-500 group-hover:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Activity
          </h2>
          <p className="mt-1 text-gray-600">
            Latest updates and user interactions
          </p>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No recent activity
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              User activity and content updates will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
