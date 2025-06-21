"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import {
  MagnifyingGlassIcon,
  BookmarkIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  category: string;
  examples?: string[];
  related_terms?: string[];
  created_at: string;
  updated_at: string;
}

export default function GlossaryPage() {
  const { user } = useAuth();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);

  useEffect(() => {
    fetchGlossaryTerms();
  }, []);

  const fetchGlossaryTerms = async () => {
    try {
      const response = await fetch("/api/education/glossary", {
        headers: user
          ? {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          : {},
      });
      if (response.ok) {
        const data = await response.json();
        setTerms(data);
      }
    } catch (error) {
      console.error("Error fetching glossary terms:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTerms = terms.filter((term) => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || term.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(terms.map((term) => term.category))
  ).sort();

  const getCategoryColor = (category: string) => {
    const colors = {
      "Carbon Markets": "bg-green-100 text-green-800",
      "EU ETS": "bg-blue-100 text-blue-800",
      CBAM: "bg-purple-100 text-purple-800",
      VCM: "bg-yellow-100 text-yellow-800",
      Compliance: "bg-red-100 text-red-800",
      Trading: "bg-indigo-100 text-indigo-800",
      General: "bg-gray-100 text-gray-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
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
            Education Glossary
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Essential terms and definitions for carbon markets and green energy
            trading
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search terms, definitions, or categories..."
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({terms.length})
              </button>
              {categories.map((category) => {
                const count = terms.filter(
                  (term) => term.category === category
                ).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? getCategoryColor(category)
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing {filteredTerms.length} of {terms.length} terms
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Glossary Terms */}
        {filteredTerms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No terms found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTerms
              .sort((a, b) => a.term.localeCompare(b.term))
              .map((term) => (
                <div
                  key={term.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {term.term}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                          term.category
                        )}`}
                      >
                        {term.category}
                      </span>
                    </div>

                    <p
                      className={`text-sm text-gray-600 mb-4 ${
                        expandedTerm === term.id ? "" : "line-clamp-3"
                      }`}
                    >
                      {term.definition}
                    </p>

                    {term.definition.length > 150 && (
                      <button
                        onClick={() =>
                          setExpandedTerm(
                            expandedTerm === term.id ? null : term.id
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
                      >
                        {expandedTerm === term.id ? "Show less" : "Read more"}
                      </button>
                    )}

                    {/* Examples */}
                    {term.examples && term.examples.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Examples:
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {term.examples
                            .slice(0, expandedTerm === term.id ? undefined : 2)
                            .map((example, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                <span>{example}</span>
                              </li>
                            ))}
                          {term.examples.length > 2 &&
                            expandedTerm !== term.id && (
                              <li className="text-blue-600 text-xs">
                                +{term.examples.length - 2} more examples
                              </li>
                            )}
                        </ul>
                      </div>
                    )}

                    {/* Related Terms */}
                    {term.related_terms && term.related_terms.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Related Terms:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {term.related_terms
                            .slice(0, expandedTerm === term.id ? undefined : 3)
                            .map((relatedTerm, index) => (
                              <button
                                key={index}
                                onClick={() => setSearchTerm(relatedTerm)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                              >
                                <TagIcon className="h-3 w-3 mr-1" />
                                {relatedTerm}
                              </button>
                            ))}
                          {term.related_terms.length > 3 &&
                            expandedTerm !== term.id && (
                              <span className="text-xs text-gray-500">
                                +{term.related_terms.length - 3} more
                              </span>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Educational Note */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start">
            <BookmarkIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Learning Tip
              </h3>
              <p className="mt-1 text-sm text-blue-800">
                Use the glossary alongside your learning paths to deepen your
                understanding of carbon markets and green energy trading
                concepts. Click on related terms to explore connections between
                different concepts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
