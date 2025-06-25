"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface SearchResult {
  type: "learning_path" | "lesson" | "glossary_term";
  id: number;
  title: string;
  description: string;
  content_preview?: string;
  level?: string;
  category?: string;
  lesson_type?: string;
  estimated_duration?: number;
  tags?: string[];
  learning_path?: {
    id: number;
    title: string;
  };
  module?: {
    id: number;
    title: string;
  };
  relevance_score: number;
}

interface SearchFilters {
  content_types: string[];
  levels: string[];
  categories: string[];
  lesson_types: string[];
  duration_range: [number, number];
  sort_by: "relevance" | "title" | "duration" | "level";
  sort_order: "asc" | "desc";
}

export default function SearchPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const [filters, setFilters] = useState<SearchFilters>({
    content_types: [],
    levels: [],
    categories: [],
    lesson_types: [],
    duration_range: [0, 300],
    sort_by: "relevance",
    sort_order: "desc",
  });

  const contentTypeOptions = [
    { value: "learning_path", label: "Learning Paths", icon: BookOpenIcon },
    { value: "lesson", label: "Lessons", icon: AcademicCapIcon },
    { value: "glossary_term", label: "Glossary Terms", icon: TagIcon },
  ];

  const levelOptions = [
    {
      value: "BEGINNER",
      label: "Beginner",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "INTERMEDIATE",
      label: "Intermediate",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "ADVANCED",
      label: "Advanced",
      color: "bg-orange-100 text-orange-800",
    },
    { value: "EXPERT", label: "Expert", color: "bg-red-100 text-red-800" },
  ];

  const categoryOptions = [
    "Carbon Markets",
    "EU ETS",
    "CBAM",
    "VCM",
    "Compliance",
    "Trading",
    "General",
  ];

  const lessonTypeOptions = [
    { value: "TEXT", label: "Text", icon: DocumentTextIcon },
    { value: "VIDEO", label: "Video", icon: VideoCameraIcon },
    { value: "INTERACTIVE", label: "Interactive", icon: AcademicCapIcon },
    { value: "QUIZ", label: "Quiz", icon: ClipboardDocumentCheckIcon },
  ];

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
        content_types: filters.content_types.join(","),
        levels: filters.levels.join(","),
        categories: filters.categories.join(","),
        lesson_types: filters.lesson_types.join(","),
        duration_min: filters.duration_range[0].toString(),
        duration_max: filters.duration_range[1].toString(),
      });

      const response = await fetch(`/api/education/search?${params}`, {
        headers: user
          ? {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          : {},
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setTotalResults(data.total);
      }
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/education/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (
    key: "content_types" | "levels" | "categories" | "lesson_types",
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const clearFilters = () => {
    setFilters({
      content_types: [],
      levels: [],
      categories: [],
      lesson_types: [],
      duration_range: [0, 300],
      sort_by: "relevance",
      sort_order: "desc",
    });
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === "learning_path") return BookOpenIcon;
    if (result.type === "glossary_term") return TagIcon;
    if (result.lesson_type === "VIDEO") return VideoCameraIcon;
    if (result.lesson_type === "QUIZ") return ClipboardDocumentCheckIcon;
    return DocumentTextIcon;
  };

  const getResultTypeLabel = (result: SearchResult) => {
    if (result.type === "learning_path") return "Learning Path";
    if (result.type === "glossary_term") return "Glossary Term";
    return `${result.lesson_type} Lesson`;
  };

  const getResultPath = (result: SearchResult) => {
    if (result.type === "learning_path")
      return `/education/learning-paths/${result.id}`;
    if (result.type === "glossary_term")
      return `/education/glossary?term=${result.title}`;
    return `/education/lessons/${result.id}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Search Education Content
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Find learning paths, lessons, and glossary terms across our
            education platform
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white shadow rounded-lg mb-6">
          <form onSubmit={handleSearch} className="p-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="Search for courses, lessons, terms..."
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Advanced Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Content Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <div className="space-y-2">
                    {contentTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.content_types.includes(option.value)}
                          onChange={() =>
                            toggleArrayFilter("content_types", option.value)
                          }
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <div className="space-y-2">
                    {levelOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.levels.includes(option.value)}
                          onChange={() =>
                            toggleArrayFilter("levels", option.value)
                          }
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categoryOptions.map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category)}
                          onChange={() =>
                            toggleArrayFilter("categories", category)
                          }
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => updateFilter("sort_by", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="title">Title</option>
                    <option value="duration">Duration</option>
                    <option value="level">Level</option>
                  </select>
                  <div className="mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.sort_order === "desc"}
                        onChange={(e) =>
                          updateFilter(
                            "sort_order",
                            e.target.checked ? "desc" : "asc"
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Descending
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => performSearch()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results {totalResults > 0 && `(${totalResults})`}
              </h2>
              {totalResults > 0 && (
                <p className="text-sm text-gray-600">
                  Found {totalResults} results for "{searchQuery}"
                </p>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-lg shadow animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No results found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const ResultIcon = getResultIcon(result);
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="flex-shrink-0">
                              <ResultIcon className="h-6 w-6 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Link
                                  href={getResultPath(result)}
                                  className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                                >
                                  {result.title}
                                </Link>
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  {getResultTypeLabel(result)}
                                </span>
                                {result.level && (
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      levelOptions.find(
                                        (l) => l.value === result.level
                                      )?.color || "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {result.level.toLowerCase()}
                                  </span>
                                )}
                              </div>

                              <p className="text-gray-600 mb-3">
                                {result.description}
                              </p>

                              {result.content_preview && (
                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                  {result.content_preview}
                                </p>
                              )}

                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {result.estimated_duration && (
                                  <div className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    {formatDuration(result.estimated_duration)}
                                  </div>
                                )}
                                {result.category && (
                                  <div className="flex items-center">
                                    <TagIcon className="h-4 w-4 mr-1" />
                                    {result.category}
                                  </div>
                                )}
                                {result.learning_path && (
                                  <div className="text-blue-600">
                                    in {result.learning_path.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <div className="text-sm text-gray-400">
                              {Math.round(result.relevance_score * 100)}% match
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
