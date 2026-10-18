"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowLeftIcon,
  PlayIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  BookOpenIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useConfirmationModal } from "@/lib/hooks";
import { ConfirmationModal } from "@/components/shared";

interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  estimated_duration: number;
  is_active: boolean;
  modules: Module[];
  user_progress?: {
    id: number;
    progress_percentage: number;
    completed_modules: number;
    total_modules: number;
    last_accessed: string;
    is_completed: boolean;
    current_module_id?: number;
    current_lesson_id?: number;
  };
}

interface Module {
  id: number;
  title: string;
  description: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  lessons?: Lesson[]; // Optional since backend doesn't always include lessons
  user_progress?: {
    is_completed: boolean;
    completed_lessons: number;
    total_lessons: number;
  };
}

interface Lesson {
  id: number;
  title: string;
  lesson_type: "TEXT" | "VIDEO" | "INTERACTIVE" | "QUIZ";
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  is_completed?: boolean;
  is_locked?: boolean;
  is_started?: boolean;
}

export default function LearningPathDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [restarting, setRestarting] = useState(false);

  // Use confirmation modal hook
  const confirmationModal = useConfirmationModal({
    onConfirm: async () => {
      await handleRestartPath();
    },
  });

  useEffect(() => {
    if (id && user) {
      fetchLearningPath();
    }
  }, [id, user]);

  const fetchLearningPath = async () => {
    try {
      const { fetchLearningPath: apiCall } = await import("@/lib/api");
      const data = await apiCall(Number(id));
      setLearningPath(data);
    } catch (error) {
      console.error("Error fetching learning path:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user || !id) return;

    setEnrolling(true);
    try {
      const { enrollInLearningPath } = await import("@/lib/api");
      await enrollInLearningPath(Number(id));
      await fetchLearningPath();
    } catch (error) {
      console.error("Error enrolling in learning path:", error);
    } finally {
      setEnrolling(false);
    }
  };

  const continueLearning = async () => {
    if (!learningPath || !user) return;

    try {
      const { getNextLesson } = await import("@/lib/api");
      const nextLesson = await getNextLesson(learningPath.id);

      if (nextLesson && nextLesson.lesson_id) {
        router.push(`/education/lessons/${nextLesson.lesson_id}`);
      } else {
        // If no next lesson, go to first lesson
        const firstModule = learningPath.modules
          .filter((m) => m.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)[0];

        if (firstModule?.lessons && firstModule.lessons.length > 0) {
          const firstLesson = firstModule.lessons
            .filter((l) => l.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)[0];

          if (firstLesson) {
            router.push(`/education/lessons/${firstLesson.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Error getting next lesson:", error);
      // Fallback to first lesson
      const firstModule = learningPath.modules
        .filter((m) => m.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)[0];

      if (firstModule?.lessons && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons
          .filter((l) => l.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)[0];

        if (firstLesson) {
          router.push(`/education/lessons/${firstLesson.id}`);
        }
      }
    }
  };

  const handleRestartPath = async () => {
    if (!learningPath || !user) return;

    setRestarting(true);
    try {
      const { restartLearningPath } = await import("@/lib/api");
      await restartLearningPath(learningPath.id);

      // Refresh the learning path data to update UI
      await fetchLearningPath();

      // The confirmation modal will close automatically on success
      console.log("Learning path restarted successfully");
    } catch (error) {
      console.error("Error restarting learning path:", error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setRestarting(false);
    }
  };

  const showRestartConfirmation = () => {
    const hasCompletedLessons = getCompletedLessonsCount() > 0;

    confirmationModal.openModal({
      title: hasCompletedLessons
        ? "Restart Learning Path"
        : "Reset Learning Path",
      message: hasCompletedLessons
        ? "Are you sure you want to restart this learning path? This will reset all your lesson progress, but any certificates you've earned will be preserved."
        : "Are you sure you want to reset your enrollment in this learning path? This will clear any progress markers and let you start fresh.",
      confirmText: hasCompletedLessons ? "Restart Path" : "Reset Path",
      cancelText: "Cancel",
      variant: "warning",
    });
  };

  // Helper function to count completed lessons
  const getCompletedLessonsCount = () => {
    if (!learningPath?.modules) return 0;
    let completedCount = 0;
    learningPath.modules.forEach((module) => {
      if (module.lessons) {
        module.lessons.forEach((lesson) => {
          if (lesson.is_completed) {
            completedCount++;
          }
        });
      }
    });
    return completedCount;
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

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return VideoCameraIcon;
      case "TEXT":
        return DocumentTextIcon;
      case "INTERACTIVE":
        return PlayIcon;
      case "QUIZ":
        return ClipboardDocumentCheckIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getLessonTypeBadge = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "bg-purple-100 text-purple-800";
      case "TEXT":
        return "bg-blue-100 text-blue-800";
      case "INTERACTIVE":
        return "bg-green-100 text-green-800";
      case "QUIZ":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Please log in
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be logged in to access this content.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Learning path not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested learning path could not be found.
          </p>
          <div className="mt-6">
            <Link
              href="/education"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Education
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEnrolled = !!learningPath.user_progress;
  const totalLessons = learningPath.modules.reduce(
    (sum, module) => sum + (module.lessons?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/education"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
                    learningPath.level
                  )}`}
                >
                  {learningPath.level.toLowerCase()}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatDuration(learningPath.estimated_duration)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  {learningPath.modules.length} modules, {totalLessons} lessons
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {learningPath.title}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {learningPath.description}
              </p>
            </div>
          </div>

          {/* Completion Banner */}
          {isEnrolled && learningPath.user_progress?.is_completed && (
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <TrophyIcon className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">🎉 Congratulations!</h3>
                    <p className="text-yellow-100 text-lg">
                      You&apos;ve successfully completed this learning path!
                    </p>
                  </div>
                </div>
                <Link
                  href="/education/certificates"
                  className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-50 transition-colors inline-flex items-center"
                >
                  <TrophyIcon className="h-5 w-5 mr-2" />
                  View Certificate
                </Link>
              </div>
            </div>
          )}

          {/* Progress Bar (if enrolled) */}
          {isEnrolled &&
            learningPath.user_progress &&
            !learningPath.user_progress.is_completed && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Your Progress
                  </h3>
                  <span className="text-sm font-medium text-gray-600">
                    {learningPath.user_progress.progress_percentage}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${learningPath.user_progress.progress_percentage}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {learningPath.user_progress.completed_modules} of{" "}
                    {learningPath.user_progress.total_modules} modules completed
                  </span>
                  <span>
                    Last accessed:{" "}
                    {new Date(
                      learningPath.user_progress.last_accessed
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

          {/* Action Button */}
          <div className="mb-8">
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? "Enrolling..." : "Enroll in Course"}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                {learningPath.user_progress?.is_completed ? (
                  <>
                    <button
                      onClick={continueLearning}
                      className="bg-green-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Review Course
                    </button>
                  </>
                ) : (
                  <button
                    onClick={continueLearning}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Continue Learning
                  </button>
                )}

                {/* Restart Path Button - Only show if there are completed lessons */}
                {getCompletedLessonsCount() > 0 && (
                  <button
                    onClick={showRestartConfirmation}
                    className="bg-gray-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-700 transition-colors inline-flex items-center"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Restart Path
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Course Content */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>

          {learningPath.modules
            .filter((module) => module.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((module, moduleIndex) => (
              <div key={module.id} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {moduleIndex + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {module.title}
                        </h3>
                        {module.user_progress?.is_completed && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{module.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDuration(module.estimated_duration)}
                        </div>
                        <span>{module.lessons?.length || 0} lessons</span>
                        {module.user_progress && (
                          <span>
                            {module.user_progress.completed_lessons} of{" "}
                            {module.user_progress.total_lessons} completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                <div className="p-6">
                  <div className="space-y-3">
                    {(module.lessons || [])
                      .filter((lesson) => lesson.is_active)
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((lesson, lessonIndex) => {
                        const TypeIcon = getLessonTypeIcon(lesson.lesson_type);
                        const isAccessible = isEnrolled && !lesson.is_locked;

                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              lesson.is_completed
                                ? "bg-green-50 border-green-200"
                                : isAccessible
                                ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                : "bg-gray-50 border-gray-200 opacity-60"
                            } transition-colors`}
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex-shrink-0">
                                {lesson.is_completed ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                ) : lesson.is_locked ? (
                                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <TypeIcon className="h-5 w-5 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {lessonIndex + 1}. {lesson.title}
                                  </h4>
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLessonTypeBadge(
                                      lesson.lesson_type
                                    )}`}
                                  >
                                    {lesson.lesson_type.toLowerCase()}
                                  </span>
                                  {!lesson.is_completed &&
                                    !lesson.is_locked && (
                                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        Current
                                      </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDuration(lesson.estimated_duration)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Show appropriate control for each lesson */}
                              {isAccessible ? (
                                // For accessible lessons, show action buttons
                                <Link
                                  href={`/education/lessons/${lesson.id}`}
                                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    lesson.is_completed
                                      ? "text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100"
                                      : lesson.is_started
                                      ? "text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100"
                                      : !lesson.is_completed &&
                                        !lesson.is_locked
                                      ? "text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100"
                                      : "text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100"
                                  }`}
                                >
                                  {lesson.is_completed
                                    ? "Review"
                                    : lesson.is_started
                                    ? "Continue"
                                    : !lesson.is_completed && !lesson.is_locked
                                    ? "Start"
                                    : "View"}
                                </Link>
                              ) : (
                                // For locked lessons, show only eye icon
                                <Link
                                  href={`/education/lessons/${lesson.id}`}
                                  className="p-2 rounded-md hover:bg-gray-200 transition-colors"
                                  title="View lesson"
                                >
                                  <EyeIcon className="h-4 w-4 text-gray-600" />
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Restart Confirmation Modal */}
      {confirmationModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          onConfirm={confirmationModal.confirm}
          onClose={confirmationModal.closeModal}
          confirmText={confirmationModal.confirmText}
          cancelText={confirmationModal.cancelText}
          confirmButtonColor={
            confirmationModal.variant === "danger"
              ? "red"
              : confirmationModal.variant === "warning"
              ? "yellow"
              : "blue"
          }
          isLoading={confirmationModal.loading}
          error={confirmationModal.error}
        />
      )}
    </div>
  );
}
