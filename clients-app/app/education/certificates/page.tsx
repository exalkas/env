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
import jsPDF from "jspdf";

interface Certificate {
  id: number;
  learning_path_id: number;
  user_id: number;
  certificate_name: string;
  certificate_url?: string;
  issued_date: string;
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
      console.log("Fetching certificates...");
      const { fetchCertificates } = await import("@/lib/api");
      const data = await fetchCertificates();
      console.log("Certificates received:", data);
      setCertificates(data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  const fetchAchievements = async () => {
    try {
      console.log("Fetching achievements...");
      const { fetchUserAchievements } = await import("@/lib/api");
      const data = await fetchUserAchievements();
      console.log("Achievements received:", data);

      // Transform to match frontend interface
      const transformedAchievements = data.map((achievement: any) => ({
        id: achievement.id,
        type: achievement.achievement_type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        earned_date: achievement.earned_at,
        learning_path: achievement.learning_path,
      }));

      setAchievements(transformedAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      setAchievements([]); // Fallback to empty array
    }
  };

  const fetchStats = async () => {
    try {
      console.log("Fetching stats...");
      const { fetchUserStats } = await import("@/lib/api");
      const data = await fetchUserStats();
      console.log("Stats received:", data);

      // Use real stats from backend
      setStats({
        total_certificates: data.certificates_earned || 0,
        certificates_this_month: data.certificates_this_month || 0,
        average_score: data.average_score || 0,
        learning_streak: data.current_streak || 0,
        total_achievements: data.total_achievements || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId: number) => {
    try {
      // Generate and download PDF certificate
      const certificate = certificates.find((c) => c.id === certificateId);
      if (!certificate) return;

      // Generate impressive certificate number
      const currentYear = new Date().getFullYear();
      const paddedId = String(certificateId).padStart(4, "0");
      const randomSuffix = Math.floor(Math.random() * 900) + 100; // 3-digit random number
      const certificateNumber = `EMI-${currentYear}-${paddedId}-${randomSuffix}`;

      // Create PDF certificate
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      // Add border
      pdf.setDrawColor(52, 152, 219); // Blue border
      pdf.setLineWidth(2);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Add inner decorative border
      pdf.setDrawColor(231, 76, 60); // Red decorative border
      pdf.setLineWidth(0.5);
      pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

      // Header - Certificate Title
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(52, 152, 219); // Blue
      pdf.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 35, {
        align: "center",
      });

      // Decorative line under title
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(1);
      pdf.line(50, 40, pageWidth - 50, 40);

      // This certifies that text
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text("This certifies that", pageWidth / 2, 55, { align: "center" });

      // Student name
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(231, 76, 60); // Red
      const studentName = user?.full_name || user?.email || "Student";
      pdf.text(studentName, pageWidth / 2, 75, { align: "center" });

      // Has successfully completed text
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text("has successfully completed the course", pageWidth / 2, 90, {
        align: "center",
      });

      // Course title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(52, 152, 219); // Blue
      const maxWidth = pageWidth - 40;
      const splitTitle = pdf.splitTextToSize(
        certificate.learning_path.title,
        maxWidth
      );
      pdf.text(splitTitle, pageWidth / 2, 110, { align: "center" });

      // Calculate y position after title (depends on how many lines)
      const titleHeight = splitTitle.length * 6;
      let currentY = 110 + titleHeight + 10;

      // Course details
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      const completionDate = (() => {
        if (!certificate.issued_date) return new Date().toLocaleDateString();
        const date = new Date(certificate.issued_date);
        return isNaN(date.getTime())
          ? new Date().toLocaleDateString()
          : date.toLocaleDateString();
      })();

      const details = [
        `Level: ${certificate.learning_path.level}`,
        `Completion Date: ${completionDate}`,
        `Certificate ID: ${certificateNumber}`,
      ];

      details.forEach((detail, index) => {
        pdf.text(detail, pageWidth / 2, currentY + index * 8, {
          align: "center",
        });
      });

      currentY += 30;

      // Issued by section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(52, 152, 219);
      pdf.text(
        "Issued by: Emisify Carbon Trading Platform",
        pageWidth / 2,
        currentY,
        { align: "center" }
      );

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text("emisify.com", pageWidth / 2, currentY + 8, {
        align: "center",
      });

      // Add golden seal PNG
      const sealX = pageWidth - 60; // Position on the right side
      const sealY = pageHeight - 60; // Position at bottom right
      const sealSize = 50; // Size of the seal

      // Add golden seal PNG
      try {
        console.log("🔍 Attempting to load golden seal PNG...");
        const sealImg = new Image();

        const imageLoaded = await new Promise<boolean>((resolve, reject) => {
          sealImg.onload = () => {
            console.log("✅ Golden seal PNG loaded successfully!");
            resolve(true);
          };
          sealImg.onerror = (error) => {
            console.error("❌ Golden seal PNG failed to load:", error);
            reject(new Error("Image failed to load"));
          };

          // Try loading the image
          sealImg.src = "/golden_seal.png";
          console.log("📡 Requesting image from:", sealImg.src);

          // Set a timeout in case image doesn't load
          setTimeout(() => {
            console.warn("⏰ Image load timeout after 5 seconds");
            reject(new Error("Image load timeout"));
          }, 5000);
        });

        if (imageLoaded) {
          console.log("🎨 Converting PNG to PDF format...");
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Canvas context not available");
          }

          canvas.width = sealSize * 2;
          canvas.height = sealSize * 2;

          ctx.drawImage(sealImg, 0, 0, canvas.width, canvas.height);
          const imgData = canvas.toDataURL("image/png");

          console.log("📄 Adding PNG seal to PDF...");
          pdf.addImage(
            imgData,
            "PNG",
            sealX - sealSize / 2,
            sealY - sealSize / 2,
            sealSize,
            sealSize
          );
          console.log("🎉 Golden seal PNG successfully added to certificate!");
        }
      } catch (error) {
        console.warn("⚠️ PNG seal failed, using vector fallback:", error);

        // Fallback: Draw golden seal
        const sealRadius = 25;
        pdf.setFillColor(255, 215, 0); // Gold color
        pdf.setDrawColor(184, 134, 11); // Darker gold for border
        pdf.setLineWidth(2);
        pdf.circle(sealX, sealY, sealRadius, "FD");

        // Inner circle
        pdf.setFillColor(255, 223, 0); // Lighter gold
        pdf.setDrawColor(184, 134, 11);
        pdf.setLineWidth(1);
        pdf.circle(sealX, sealY, sealRadius - 5, "FD");

        // Seal text
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(184, 134, 11);
        pdf.text("EMISIFY", sealX, sealY - 3, { align: "center" });
        pdf.setFontSize(6);
        pdf.text("CERTIFIED", sealX, sealY + 5, { align: "center" });
      }

      // Validation text
      currentY += 25;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);
      const validationText =
        "This certificate validates the completion of all required coursework and assessments for the above-mentioned learning path in carbon markets and environmental trading.";
      const splitValidation = pdf.splitTextToSize(validationText, maxWidth);
      pdf.text(splitValidation, pageWidth / 2, currentY, { align: "center" });

      // Download the PDF
      const fileName = `certificate-${certificate.learning_path.title.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}-${certificate.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error downloading certificate:", error);
    }
  };

  const shareCertificate = async (certificate: Certificate) => {
    const achievementText = `🎉 I just completed "${certificate.learning_path.title}" on Emisify! 🌱 Proud to be expanding my knowledge in carbon markets and environmental trading. #CarbonTrading #SustainableFuture #LearningJourney`;
    const promotionalUrl = `https://emisify.com`;
    const fullText = `${achievementText}\n\nLearn carbon trading at: ${promotionalUrl}`;

    // Try native sharing first, but be more strategic about it
    if (navigator.share) {
      try {
        // For better compatibility, try text-first approach
        await navigator.share({
          text: fullText,
        });
        return; // Success!
      } catch (error) {
        // If text-only fails, try with separate fields
        try {
          await navigator.share({
            title: `${certificate.learning_path.title} - Certificate of Completion`,
            text: achievementText,
            url: promotionalUrl,
          });
          return; // Success!
        } catch (error2) {
          console.log("Native sharing failed, using clipboard fallback");
        }
      }
    }

    // Fallback: copy to clipboard (works everywhere)
    try {
      await navigator.clipboard.writeText(fullText);
      alert(
        "✅ Certificate shared! The text has been copied to your clipboard and includes both your message and website link. You can paste it anywhere!"
      );
    } catch (clipboardError) {
      // Final fallback: manual copy
      prompt("Please copy this text to share your achievement:", fullText);
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
                        <div className="px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-300">
                          Completed
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
                        <div>Certificate #{certificate.certificate_name}</div>
                        <div>
                          Completed:{" "}
                          {(() => {
                            if (!certificate.issued_date) return "Recently";
                            const date = new Date(certificate.issued_date);
                            return isNaN(date.getTime())
                              ? "Recently"
                              : date.toLocaleDateString();
                          })()}
                        </div>
                        <div>
                          Issued:{" "}
                          {(() => {
                            if (!certificate.issued_date) return "Recently";
                            const date = new Date(certificate.issued_date);
                            return isNaN(date.getTime())
                              ? "Recently"
                              : date.toLocaleDateString();
                          })()}
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
