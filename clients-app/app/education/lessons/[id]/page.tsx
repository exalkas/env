"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { InteractiveLessonWrapper } from "@/components/education";

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;
  lesson_type: "TEXT" | "VIDEO" | "INTERACTIVE" | "QUIZ";
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  video_url?: string;
  video_description?: string;
  quiz_questions?: QuizQuestion[];
  // Interactive content fields
  interactive_type_id?: number;
  interactive_content?: {
    type: {
      id: number;
      type_key: string;
      display_name: string;
      component_name: string;
      default_config: any;
    };
    scenarios: any[];
  };
  // Progress fields from backend
  is_completed?: boolean;
  is_started?: boolean;
  is_locked?: boolean;
  module: {
    id: number;
    title: string;
    learning_path: {
      id: number;
      title: string;
    };
  };
  navigation?: {
    previous_lesson?: {
      id: number;
      title: string;
    };
    next_lesson?: {
      id: number;
      title: string;
    };
  };
  user_progress?: {
    is_completed: boolean;
    completed_at?: string;
    progress_percentage: number;
  };
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuizAttempt {
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
}

export default function LessonViewer() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // Quiz state
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Interactive lesson state
  const [interactiveScore, setInteractiveScore] = useState<number | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchLesson();
    }
  }, [id, user]);

  const fetchLesson = async () => {
    try {
      const { fetchLesson: apiCall } = await import("@/lib/api");
      const data = await apiCall(Number(id));

      // Fetch interactive content if it's an interactive lesson
      if (data.lesson_type === "INTERACTIVE" && data.interactive_type_id) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/v1/interactive-content/lessons/${id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const interactiveData = await response.json();
            data.interactive_content = interactiveData;
          }
        } catch (interactiveError) {
          console.error(
            "Error fetching interactive content:",
            interactiveError
          );
          // Continue without interactive content - will fallback to basic content
        }
      }

      setLesson(data);

      // Initialize quiz attempts if it's a quiz lesson
      if (data.lesson_type === "QUIZ" && data.quiz_questions) {
        setQuizAttempts(
          data.quiz_questions.map((q: QuizQuestion) => ({
            question_id: q.id,
            selected_answer: -1,
            is_correct: false,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error fetching lesson:", error);
      if (error.response?.status === 404) {
        router.push("/education");
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    if (!lesson || isCompleting) return;

    setIsCompleting(true);

    try {
      const { completeLesson } = await import("@/lib/api");
      await completeLesson(lesson.id);

      // Immediately update the lesson state to reflect completion
      setLesson((prevLesson) => {
        if (!prevLesson) return prevLesson;
        return {
          ...prevLesson,
          is_completed: true, // Set root-level completion status
          user_progress: {
            is_completed: true,
            completed_at: new Date().toISOString(),
            progress_percentage: 100,
          },
        };
      });

      // Refresh from server to get any other updates (like navigation)
      setTimeout(() => {
        fetchLesson();
      }, 100);

      // Show success message
      showSuccess(
        "Lesson Completed! 🎉",
        lesson.navigation?.next_lesson
          ? "Ready for the next lesson?"
          : "Great job! You've successfully completed this lesson."
      );
    } catch (error: any) {
      console.error("Error marking lesson as completed:", error);

      // Handle sequential completion error
      if (error.response?.status === 400) {
        showError(
          "Cannot Complete Lesson",
          error.response.data.detail ||
            "You must complete previous lessons first"
        );
      } else {
        showError(
          "Completion Failed",
          "Failed to mark lesson as complete. Please try again."
        );
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAttempts((prev) =>
      prev.map((attempt) =>
        attempt.question_id === questionId
          ? { ...attempt, selected_answer: answerIndex }
          : attempt
      )
    );
  };

  const submitQuiz = () => {
    if (!lesson?.quiz_questions) return;

    let correctAnswers = 0;
    const updatedAttempts = quizAttempts.map((attempt) => {
      const question = lesson.quiz_questions!.find(
        (q) => q.id === attempt.question_id
      );
      const isCorrect = question
        ? attempt.selected_answer === question.correct_answer
        : false;
      if (isCorrect) correctAnswers++;
      return { ...attempt, is_correct: isCorrect };
    });

    setQuizAttempts(updatedAttempts);
    const score = Math.round(
      (correctAnswers / lesson.quiz_questions.length) * 100
    );
    setQuizScore(score);
    setShowResults(true);
  };

  const canSubmitQuiz = quizAttempts.every(
    (attempt) => attempt.selected_answer !== -1
  );

  const handleInteractiveComplete = (score: number) => {
    setInteractiveScore(score);
    // For interactive lessons, automatically mark as complete after interaction
    setTimeout(() => {
      markAsCompleted();
    }, 1000);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderVideoEmbed = (url: string) => {
    // Simple YouTube embed detection
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be")
        ? url.split("/").pop()?.split("?")[0]
        : url.split("v=")[1]?.split("&")[0];

      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title={lesson?.title}
            />
          </div>
        );
      }
    }

    // Fallback for other video URLs
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <PlayIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-600">Video player not available</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Open video in new tab
          </a>
        </div>
      </div>
    );
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
            You need to be logged in to access this lesson.
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
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Lesson not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested lesson could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href={`/education/learning-paths/${lesson.module.learning_path.id}`}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">
                {lesson.module.learning_path.title} → {lesson.module.title}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lesson.title}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatDuration(lesson.estimated_duration)}
                </div>
                {lesson.user_progress?.is_completed && (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Completed
                    {lesson.user_progress.completed_at && (
                      <span className="ml-2 text-xs text-gray-500">
                        on{" "}
                        {new Date(
                          lesson.user_progress.completed_at
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-8">
            {/* Video Lesson */}
            {lesson.lesson_type === "VIDEO" && lesson.video_url && (
              <div className="mb-6">
                {renderVideoEmbed(lesson.video_url)}
                {lesson.video_description && (
                  <p className="mt-4 text-gray-600">
                    {lesson.video_description}
                  </p>
                )}
              </div>
            )}

            {/* Interactive Content */}
            {lesson.lesson_type === "INTERACTIVE" ? (
              <InteractiveLessonWrapper
                lesson={{
                  id: lesson.id,
                  module_id: lesson.module_id,
                  title: lesson.title,
                  content: lesson.content,
                  lesson_type: lesson.lesson_type.toLowerCase() as
                    | "text"
                    | "video"
                    | "interactive"
                    | "quiz",
                  duration_minutes: lesson.estimated_duration,
                  interactive_content: lesson.interactive_content,
                }}
                onComplete={handleInteractiveComplete}
              />
            ) : (
              lesson.lesson_type === "TEXT" && (
                <div className="mb-6">
                  <div
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                    className="lesson-content"
                  />
                </div>
              )
            )}

            {/* Quiz Content */}
            {lesson.lesson_type === "QUIZ" && lesson.quiz_questions && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Quiz Assessment
                  </h3>
                  <p className="text-gray-600">
                    Answer all questions to complete this lesson.
                  </p>
                </div>

                {lesson.quiz_questions.map((question, questionIndex) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Question {questionIndex + 1}: {question.question}
                    </h4>

                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const attempt = quizAttempts.find(
                          (a) => a.question_id === question.id
                        );
                        const isSelected =
                          attempt?.selected_answer === optionIndex;
                        const isCorrect =
                          showResults &&
                          optionIndex === question.correct_answer;
                        const isWrong =
                          showResults &&
                          isSelected &&
                          optionIndex !== question.correct_answer;

                        return (
                          <label
                            key={optionIndex}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              showResults
                                ? isCorrect
                                  ? "bg-green-50 border-green-200"
                                  : isWrong
                                  ? "bg-red-50 border-red-200"
                                  : "bg-gray-50 border-gray-200"
                                : isSelected
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              value={optionIndex}
                              checked={isSelected}
                              onChange={() =>
                                !showResults &&
                                handleQuizAnswer(question.id, optionIndex)
                              }
                              disabled={showResults}
                              className="mr-3"
                            />
                            <span className="text-sm text-gray-900">
                              {option}
                            </span>
                            {showResults && isCorrect && (
                              <CheckCircleIcon className="h-5 w-5 text-green-500 ml-auto" />
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {showResults && question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {!showResults && (
                  <div className="flex justify-center">
                    <button
                      onClick={submitQuiz}
                      disabled={!canSubmitQuiz}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Quiz
                    </button>
                  </div>
                )}

                {showResults && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Quiz Results
                    </h4>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {quizScore}%
                    </p>
                    <p className="text-gray-600">
                      You got {quizAttempts.filter((a) => a.is_correct).length}{" "}
                      out of {lesson.quiz_questions.length} questions correct.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation and Actions */}
        <div className="flex items-center justify-between">
          <div>
            {lesson.navigation?.previous_lesson ? (
              <Link
                href={`/education/lessons/${lesson.navigation?.previous_lesson.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Previous: {lesson.navigation?.previous_lesson.title}
              </Link>
            ) : (
              <Link
                href={`/education/learning-paths/${lesson.module.learning_path.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to {lesson.module.learning_path.title}
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {(() => {
              const showButton =
                !lesson.is_completed &&
                !lesson.user_progress?.is_completed &&
                !lesson.is_locked;

              return showButton;
            })() && (
              <div className="flex flex-col items-end">
                <button
                  onClick={markAsCompleted}
                  disabled={
                    isCompleting ||
                    (lesson.lesson_type === "QUIZ" && !showResults)
                  }
                  className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {isCompleting ? "Completing..." : "Mark as Complete"}
                </button>

                {lesson.navigation?.previous_lesson && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    💡 Complete lessons in order for the best learning
                    experience
                  </p>
                )}
              </div>
            )}

            {/* Next Lesson Button */}
            {(lesson.is_completed || lesson.user_progress?.is_completed) &&
              lesson.navigation?.next_lesson && (
                <Link
                  href={`/education/lessons/${lesson.navigation.next_lesson.id}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105"
                >
                  Next Lesson: {lesson.navigation.next_lesson.title}
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Link>
              )}

            {/* Certificate Button - Show when lesson is completed and it's the final lesson */}
            {(lesson.is_completed || lesson.user_progress?.is_completed) &&
              !lesson.navigation?.next_lesson && (
                <div className="flex flex-col items-end">
                  <Link
                    href={`/education/learning-paths/${lesson.module.learning_path.id}`}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    🎉 Get Your Certificate
                    <svg
                      className="h-5 w-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </Link>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    🎯 Congratulations! You&apos;ve completed the entire course
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
