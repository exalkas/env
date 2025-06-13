"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../lib/context/AuthContext";

interface News {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string;
  author: string;
  source_url: string;
  image_url: string;
  is_featured: boolean;
  published_at: string;
  created_at: string;
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "EUA", label: "EUA" },
  { value: "EUA2", label: "EUA2" },
  { value: "GOO", label: "GOO" },
  { value: "GEO", label: "GEO" },
  { value: "VOLUNTARY_MARKETS", label: "Voluntary Markets" },
  { value: "BIOFUELS", label: "Biofuels" },
  { value: "GENERAL", label: "General" },
];

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [filter, setFilter] = useState({
    category: "",
    featured: false,
    search: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchNews();
  }, [filter]);

  const fetchNews = async () => {
    try {
      const params = new URLSearchParams({
        published_only: "true",
        ...(filter.category && { category: filter.category }),
        ...(filter.featured && { featured_only: "true" }),
        ...(filter.search && { search: filter.search }),
      });

      const response = await fetch(
        `http://localhost:8000/api/v1/news/?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setNews(data.news);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      EUA: "bg-blue-100 text-blue-800",
      EUA2: "bg-indigo-100 text-indigo-800",
      GOO: "bg-green-100 text-green-800",
      GEO: "bg-emerald-100 text-emerald-800",
      VOLUNTARY_MARKETS: "bg-purple-100 text-purple-800",
      BIOFUELS: "bg-yellow-100 text-yellow-800",
      GENERAL: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Green Energy News
        </h1>
        <p className="text-gray-600">
          Stay updated with the latest news and insights from the green energy
          market
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filter.category}
              onChange={(e) =>
                setFilter({ ...filter, category: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Search news..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filter.featured}
                onChange={(e) =>
                  setFilter({ ...filter, featured: e.target.checked })
                }
                className="mr-2 text-green-500 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Featured only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Featured News */}
      {!filter.category && !filter.search && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Featured News
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {news
              .filter((item) => item.is_featured)
              .slice(0, 2)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedNews(item)}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(item.published_at)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {item.summary}
                      </p>
                    )}
                    {item.author && (
                      <p className="text-sm text-gray-500">By {item.author}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news
          .filter((item) =>
            filter.featured
              ? item.is_featured
              : !item.is_featured || (!filter.category && !filter.search)
          )
          .map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedNews(item)}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${getCategoryColor(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(item.published_at)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {item.summary}
                  </p>
                )}
                {item.author && (
                  <p className="text-xs text-gray-500">By {item.author}</p>
                )}
              </div>
            </div>
          ))}
      </div>

      {news.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No news articles found</div>
          <p className="text-gray-400 mt-2">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}

      {/* News Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${getCategoryColor(
                        selectedNews.category
                      )}`}
                    >
                      {selectedNews.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(selectedNews.published_at)}
                    </span>
                    {selectedNews.is_featured && (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedNews.title}
                  </h1>
                  {selectedNews.author && (
                    <p className="text-gray-600">By {selectedNews.author}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
                >
                  ×
                </button>
              </div>

              {selectedNews.image_url && (
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              {selectedNews.summary && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-gray-700">{selectedNews.summary}</p>
                </div>
              )}

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800">
                  {selectedNews.content}
                </div>
              </div>

              {selectedNews.tags && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNews.tags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNews.source_url && (
                <div className="mt-4">
                  <a
                    href={selectedNews.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    Read original article →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
