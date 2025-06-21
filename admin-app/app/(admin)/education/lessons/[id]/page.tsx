"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilIcon,
  PlayIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/utils/auth";
import { StatusBadge } from "@/components/shared";

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;
  video_url?: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  module?: {
    id: number;
    title: string;
    learning_path_id: number;
    learning_path?: {
      id: number;
      title: string;
    };
  };
}

export default function LessonDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLesson();
    }
  }, [id]);

  const fetchLesson = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/lessons/${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setLesson(data);
      } else if (response.status === 404) {
        router.push("/education/learning-paths");
      }
    } catch (error) {
      console.error("Error fetching lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !lesson) {
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
            href={`/education/modules/${lesson.module_id}`}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <nav className="text-sm text-gray-500 mb-2">
              <Link
                href="/education/learning-paths"
                className="hover:text-gray-700"
              >
                Learning Paths
              </Link>
              {lesson.module?.learning_path && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/education/learning-paths/${lesson.module.learning_path.id}`}
                    className="hover:text-gray-700"
                  >
                    {lesson.module.learning_path.title}
                  </Link>
                </>
              )}
              {lesson.module && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/education/modules/${lesson.module.id}`}
                    className="hover:text-gray-700"
                  >
                    {lesson.module.title}
                  </Link>
                </>
              )}
              <span className="mx-2">/</span>
              <span className="text-gray-900">{lesson.title}</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-1" />
                {lesson.estimated_duration} minutes
              </div>
              <StatusBadge
                status={lesson.is_active ? "Active" : "Inactive"}
                size="sm"
              />
              <span className="text-sm text-gray-500">
                Lesson #{lesson.sort_order}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/education/lessons/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Lesson
            </Link>
          </div>
        </div>
      </div>

      {/* Video Section */}
      {lesson.video_url && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PlayIcon className="h-5 w-5 mr-2" />
              Video Content
            </h2>
          </div>
          <div className="p-6">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PlayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Video URL provided</p>
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Watch Video
                </a>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Video URL:{" "}
              <a
                href={lesson.video_url}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {lesson.video_url}
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lesson Content
          </h2>
        </div>
        <div className="p-6">
          <div
            className="prose max-w-none lesson-content"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />

          <style jsx global>{`
            .lesson-content {
              line-height: 1.6;
            }

            .lesson-content h1 {
              font-size: 1.875rem;
              font-weight: 700;
              color: #111827;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }

            .lesson-content h2 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #111827;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }

            .lesson-content h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #111827;
              margin-top: 1.25rem;
              margin-bottom: 0.5rem;
            }

            .lesson-content p {
              margin-bottom: 1rem;
              color: #374151;
            }

            .lesson-content ul,
            .lesson-content ol {
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }

            .lesson-content li {
              margin-bottom: 0.25rem;
            }

            .lesson-content blockquote {
              border-left: 4px solid #d1d5db;
              padding-left: 1rem;
              margin: 1rem 0;
              font-style: italic;
              color: #6b7280;
            }

            .lesson-content pre {
              background-color: #f3f4f6;
              padding: 1rem;
              border-radius: 0.375rem;
              overflow-x: auto;
              margin: 1rem 0;
            }

            .lesson-content code {
              background-color: #f3f4f6;
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
              font-size: 0.875rem;
            }

            .lesson-content a {
              color: #2563eb;
              text-decoration: underline;
            }

            .lesson-content a:hover {
              color: #1d4ed8;
            }

            .lesson-content strong {
              font-weight: 600;
            }

            .lesson-content em {
              font-style: italic;
            }
          `}</style>
        </div>
      </div>

      {/* Lesson Information */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lesson Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Duration
              </label>
              <p className="text-sm text-gray-900">
                {lesson.estimated_duration} minutes
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Order
              </label>
              <p className="text-sm text-gray-900">#{lesson.sort_order}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Status
              </label>
              <StatusBadge
                status={lesson.is_active ? "Active" : "Inactive"}
                size="sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Has Video
              </label>
              <p className="text-sm text-gray-900">
                {lesson.video_url ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Created
              </label>
              <p className="text-sm text-gray-900">
                {new Date(lesson.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Updated
              </label>
              <p className="text-sm text-gray-900">
                {new Date(lesson.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
