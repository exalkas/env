"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  LoadingSpinner,
  QuestionForm,
  type QuestionFormData,
} from "@/components/shared";
import { useNotifications } from "@/lib/hooks";
import { NotificationContainer } from "@/components/NotificationToast";
import {
  getQuestion,
  updateQuestion,
  type Question,
} from "@/lib/api/education";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;
  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const data = await getQuestion(Number(questionId));
      setQuestion(data);
    } catch (error) {
      console.error("Error fetching question:", error);
      addNotification("error", "Failed to load question");
      router.push("/education/questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (questionData: QuestionFormData) => {
    setSaving(true);

    try {
      // Convert QuestionFormData to the format expected by the API
      let options = undefined;

      // Handle different question types
      if (
        ["multiple_choice", "multiple_select"].includes(
          questionData.question_type
        )
      ) {
        // For MCQ questions, use the options as-is
        options = questionData.options?.map((option, index) => ({
          option_text: option.option_text,
          is_correct: option.is_correct,
          sort_order: option.sort_order || index + 1,
          explanation: option.explanation,
        }));
      } else if (
        questionData.question_type === "fill_in_blank" &&
        questionData.blank_answers
      ) {
        // For fill-in-the-blank questions, convert blank_answers to options format
        options = questionData.blank_answers.map((answer, index) => ({
          option_text: answer,
          is_correct: true, // All blank answers are correct answers
          sort_order: index + 1,
          explanation: undefined,
        }));
      } else if (
        questionData.question_type === "numeric" &&
        questionData.numeric_answer
      ) {
        // For numeric questions, store answer data in options format
        options = [
          {
            option_text: JSON.stringify({
              correct_value: questionData.numeric_answer.correct_value,
              tolerance: questionData.numeric_answer.tolerance,
              unit: questionData.numeric_answer.unit,
            }),
            is_correct: true,
            sort_order: 1,
            explanation: undefined,
          },
        ];
      } else if (
        questionData.question_type === "true_false" &&
        questionData.true_false_answer !== undefined
      ) {
        // For true/false questions, store answer as single option
        options = [
          {
            option_text: questionData.true_false_answer.toString(),
            is_correct: true,
            sort_order: 1,
            explanation: undefined,
          },
        ];
      }

      const apiData = {
        title: questionData.title,
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        explanation: questionData.explanation,
        points: questionData.points,
        difficulty_level: questionData.difficulty_level,
        category: questionData.category,
        tags: questionData.tags,
        is_active: questionData.is_active,
        options: options || [], // Ensure options is always an array
      };

      console.log("Updating with API data:", apiData);
      await updateQuestion(Number(questionId), apiData);
      addNotification(
        "success",
        "Question updated successfully!",
        "Redirecting to question details..."
      );

      setTimeout(() => {
        router.push(`/education/questions/${questionId}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error updating question:", error);
      console.error("Error details:", error.response?.data || error.message);

      let errorMessage = "Please try again";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((e: any) => `${e.loc?.join(".")} - ${e.msg}`)
            .join(", ");
        } else {
          errorMessage = error.response.data.detail;
        }
      }

      addNotification("error", "Failed to update question", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/education/questions/${questionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" message="Loading question..." />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Question Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The question you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/education/questions"
            className="text-blue-600 hover:underline"
          >
            Back to Questions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/education/questions/${questionId}`}
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
              <Link
                href={`/education/questions/${questionId}`}
                className="hover:text-gray-700"
              >
                {question.title}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Edit</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">Edit Question</h1>
            <p className="text-gray-600 mt-2">
              Update the question details and options
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Question Details
          </h2>
        </div>
        <div className="p-6">
          <QuestionForm
            question={question}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={saving}
            submitLabel="Update Question"
          />
        </div>
      </div>
    </div>
  );
}
