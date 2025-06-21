"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilIcon,
  TagIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { StatusBadge, LoadingSpinner } from "@/components/shared";
import { getQuestion, type Question } from "@/lib/api/education";

export default function QuestionDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchQuestion();
    }
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const data = await getQuestion(Number(id));
      setQuestion(data);
    } catch (error) {
      console.error("Error fetching question:", error);
      router.push("/education/questions");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "success";
      case "MEDIUM":
        return "warning";
      case "HARD":
        return "error";
      default:
        return "neutral";
    }
  };

  const getQuestionTypeDisplay = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading || !question) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/education/questions"
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <nav className="text-sm text-gray-500 mb-2">
              <Link href="/education" className="hover:text-gray-700">
                Education
              </Link>
              <span className="mx-2">/</span>
              <Link href="/education/questions" className="hover:text-gray-700">
                Questions
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{question.title}</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">
              {question.title}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <StatusBadge
                status={getQuestionTypeDisplay(question.question_type)}
                variant="info"
                size="sm"
              />
              <StatusBadge
                status={question.difficulty_level}
                variant={
                  getDifficultyBadgeVariant(question.difficulty_level) as any
                }
                size="sm"
              />
              <StatusBadge
                status={question.is_active ? "Active" : "Inactive"}
                variant={question.is_active ? "success" : "error"}
                size="sm"
              />
              <div className="flex items-center text-sm text-gray-600">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                {question.points} {question.points === 1 ? "point" : "points"}
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/education/questions/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Question
            </Link>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="space-y-6">
        {/* Question Text */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Question</h2>
          </div>
          <div className="p-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
          </div>
        </div>

        {/* Answer Options */}
        {question.options && question.options.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Answer Options
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {question.options
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        option.is_correct
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                              option.is_correct
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">{option.option_text}</p>
                          {option.is_correct && (
                            <p className="text-sm text-green-600 mt-1 font-medium">
                              ✓ Correct Answer
                            </p>
                          )}
                          {option.explanation && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Explanation:</strong> {option.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Explanation
              </h2>
            </div>
            <div className="p-6">
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
            </div>
          </div>
        )}

        {/* Question Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Question Details
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Category
                </h3>
                <p className="text-gray-700">{question.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Question Type
                </h3>
                <p className="text-gray-700">
                  {getQuestionTypeDisplay(question.question_type)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Difficulty
                </h3>
                <p className="text-gray-700">{question.difficulty_level}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Points
                </h3>
                <p className="text-gray-700">{question.points}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Status
                </h3>
                <p className="text-gray-700">
                  {question.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Created
                </h3>
                <p className="text-gray-700">
                  {new Date(question.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <TagIcon className="h-4 w-4 mr-1" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
