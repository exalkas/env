"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  TrophyIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  AcademicCapIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Certificate {
  id: number;
  learning_path_id: number;
  user_id: number;
  certificate_number: string;
  issued_date: string;
  completion_date: string;
  final_score: number;
  is_valid: boolean;
  learning_path: {
    id: number;
    title: string;
    level: string;
    description: string;
  };
}

interface Achievement {
  id: number;
  type:
    | "FIRST_COMPLETION"
    | "STREAK_7"
    | "STREAK_30"
    | "PERFECT_SCORE"
    | "FAST_LEARNER"
    | "KNOWLEDGE_SEEKER";
  title: string;
  description: string;
  icon: string;
  earned_date: string;
  learning_path?: {
    title: string;
  };
}

interface CertificateStats {
  total_certificates: number;
  certificates_this_month: number;
  average_score: number;
  learning_streak: number;
  total_achievements: number;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"certificates" | "achievements">(
    "certificates"
  );

  useEffect(() => {
    if (user) {
      fetchCertificates();
      fetchAchievements();
      fetchStats();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/education/certificates", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch("/api/education/achievements", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/education/user-stats/detailed", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId: number) => {
    try {
      const response = await fetch(
        `/api/education/certificates/${certificateId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate-${certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
    }
  };

  const shareCertificate = async (certificate: Certificate) => {
    const shareData = {
      title: `${certificate.learning_path.title} Certificate`,
      text: `I just completed ${certificate.learning_path.title} with a score of ${certificate.final_score}%!`,
      url: `${window.location.origin}/education/certificates/${certificate.id}/verify`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error sharing certificate:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert("Certificate link copied to clipboard!");
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

  const getScoreBadgeColor = (score: number) => {
    if (score >= 95) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (score >= 85) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 75) return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "FIRST_COMPLETION":
        return "🎯";
      case "STREAK_7":
        return "🔥";
      case "STREAK_30":
        return "⚡";
      case "PERFECT_SCORE":
        return "⭐";
      case "FAST_LEARNER":
        return "🚀";
      case "KNOWLEDGE_SEEKER":
        return "📚";
      default:
        return "🏆";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Please log in
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be logged in to view your certificates.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Certificates & Achievements
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track your learning milestones and showcase your expertise
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrophyIcon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Certificates
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_certificates}
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
                    <CalendarIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        This Month
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.certificates_this_month}
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
                    <AcademicCapIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg. Score
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.average_score.toFixed(1)}%
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
                      <div className="text-orange-600 text-sm font-bold">
                        🔥
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Streak
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.learning_streak} days
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
                    <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <div className="text-purple-600 text-sm font-bold">
                        🏆
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Achievements
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_achievements}
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
              onClick={() => setActiveTab("certificates")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "certificates"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Certificates ({certificates.length})
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "achievements"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Achievements ({achievements.length})
            </button>
          </nav>
        </div>

        {/* Certificates Tab */}
        {activeTab === "certificates" && (
          <div>
            {certificates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No certificates yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete learning paths to earn your first certificate.
                </p>
                <div className="mt-6">
                  <Link
                    href="/education"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Start Learning
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      {/* Certificate Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <TrophyIcon className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="ml-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                                certificate.learning_path.level
                              )}`}
                            >
                              {certificate.learning_path.level.toLowerCase()}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBadgeColor(
                            certificate.final_score
                          )}`}
                        >
                          {certificate.final_score}%
                        </div>
                      </div>

                      {/* Certificate Content */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {certificate.learning_path.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {certificate.learning_path.description}
                      </p>

                      {/* Certificate Details */}
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        <div>Certificate #{certificate.certificate_number}</div>
                        <div>
                          Completed:{" "}
                          {new Date(
                            certificate.completion_date
                          ).toLocaleDateString()}
                        </div>
                        <div>
                          Issued:{" "}
                          {new Date(
                            certificate.issued_date
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadCertificate(certificate.id)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                          Download
                        </button>
                        <button
                          onClick={() => shareCertificate(certificate)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div>
            {achievements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No achievements yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Keep learning to unlock achievements and milestones.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-3">
                        {getAchievementIcon(achievement.type)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {achievement.description}
                      </p>
                      {achievement.learning_path && (
                        <p className="text-xs text-blue-600 mb-3">
                          {achievement.learning_path.title}
                        </p>
                      )}
                      <div className="text-xs text-gray-500">
                        Earned:{" "}
                        {new Date(achievement.earned_date).toLocaleDateString()}
                      </div>
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
