"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMarket } from "@/lib/MarketContext";

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
  // Temporarily disable WebSocket to fix React errors
  // const { latestNews, initializeMarketData } = useMarket();

  useEffect(() => {
    fetchNews();
  }, [filter]);

  // Temporarily disabled real-time news updates
  // useEffect(() => {
  //   if (latestNews.length > 0) {
  //     // Convert MarketNews to News format and merge with existing news
  //     const convertedNews = latestNews.map((marketNews) => ({
  //       id: parseInt(marketNews.id),
  //       title: marketNews.title,
  //       summary: marketNews.summary,
  //       content: marketNews.summary, // Use summary as content for now
  //       category:
  //         marketNews.assets.length > 0 ? marketNews.assets[0] : "GENERAL",
  //       tags: marketNews.assets.join(","),
  //       author: marketNews.source,
  //       source_url: marketNews.url,
  //       image_url: "",
  //       is_featured: false,
  //       published_at: marketNews.published_at,
  //       created_at: marketNews.published_at,
  //     }));

  //     // Merge real-time news with existing news, avoiding duplicates
  //     setNews((prevNews) => {
  //       const existingIds = new Set(prevNews.map((n) => n.id));
  //       const newNews = convertedNews.filter((n) => !existingIds.has(n.id));
  //       return [...newNews, ...prevNews];
  //     });
  //   }
  // }, [latestNews]);

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

  // Filter news based on current filters (frontend filtering is now redundant since backend handles search)
  const filteredNews = news.filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.featured && !item.is_featured) return false;
    // Search is now handled by the backend API, so no need for frontend search filtering
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Green Energy News
            {/* Temporarily disabled live updates indicator */}
            {/* {latestNews.length > 0 && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Live Updates
              </span>
            )} */}
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
                placeholder="Search in title, summary, content, tags, author, category..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              {filteredNews
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* All News */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {filter.category || filter.search || filter.featured
              ? "Filtered News"
              : "Latest News"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {item.summary}
                  </p>
                  {item.author && (
                    <p className="text-xs text-gray-500 mt-2">
                      By {item.author}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No news found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* News Detail Modal */}
        {selectedNews && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
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
                  </div>
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {selectedNews.image_url && (
                  <img
                    src={selectedNews.image_url}
                    alt={selectedNews.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedNews.title}
                </h1>

                {selectedNews.author && (
                  <p className="text-sm text-gray-600 mb-4">
                    By {selectedNews.author}
                  </p>
                )}

                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {selectedNews.summary}
                  </p>

                  {selectedNews.content &&
                    selectedNews.content !== selectedNews.summary && (
                      <div className="text-gray-700 leading-relaxed">
                        {selectedNews.content
                          .split("\n")
                          .map((paragraph, index) => (
                            <p key={index} className="mb-4">
                              {paragraph}
                            </p>
                          ))}
                      </div>
                    )}
                </div>

                {selectedNews.source_url && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <a
                      href={selectedNews.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-green-600 hover:text-green-700"
                    >
                      Read full article
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
