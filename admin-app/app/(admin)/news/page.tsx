"use client";

import { useState, useEffect, useRef } from "react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "../../../lib/utils/auth";

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
  is_published: boolean;
  published_at: string;
  scheduled_publish_at?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  categories?: NewsCategoryInfo[];
}

interface NewsCategoryInfo {
  id: number;
  name: string;
  display_name: string;
  is_primary: boolean;
}

interface NewsFormData {
  title: string;
  summary: string;
  content: string;
  category: string;
  additional_category_ids: number[];
  tags: string;
  author: string;
  source_url: string;
  image_url: string;
  is_featured: boolean;
  is_published: boolean;
  scheduled_publish_at: string;
}

interface Category {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
}

interface CategoryFormData {
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
}

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingNews, setViewingNews] = useState<News | null>(null);
  const [activeTab, setActiveTab] = useState<"news" | "categories">("news");
  const [filter, setFilter] = useState({
    category: "",
    status: "all",
    search: "",
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState<NewsFormData>({
    title: "",
    summary: "",
    content: "",
    category: "GENERAL",
    additional_category_ids: [],
    tags: "",
    author: "",
    source_url: "",
    image_url: "",
    is_featured: false,
    is_published: false,
    scheduled_publish_at: "",
  });

  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: "",
    display_name: "",
    description: "",
    is_active: true,
  });

  const paginationRef = useRef<{ page: number; limit: number }>({
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    // Initial load
    fetchCategories();
    fetchNews(1);
  }, []);

  // When filters change, reset to page 1 and fetch
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    paginationRef.current = { page: 1, limit: pagination.limit };
    fetchNews(1);
  }, [filter.category, filter.status]);

  // When page or limit changes, fetch with current page
  useEffect(() => {
    // Only fetch if the page/limit change was user-initiated (not programmatic)
    if (
      pagination.page !== paginationRef.current.page ||
      pagination.limit !== paginationRef.current.limit
    ) {
      paginationRef.current = {
        page: pagination.page,
        limit: pagination.limit,
      };
      fetchNews(pagination.page);
    }
  }, [pagination.page, pagination.limit]);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      paginationRef.current = { page: 1, limit: pagination.limit };
      fetchNews(1);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [filter.search]);

  const fetchCategories = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news-categories/admin/`
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNews = async (page: number = pagination.page) => {
    console.log(`Fetching news for page ${page}, limit ${pagination.limit}`);
    try {
      const skip = (page - 1) * pagination.limit;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pagination.limit.toString(),
        ...(filter.category && { category: filter.category }),
        ...(filter.status !== "all" && { status: filter.status }),
        ...(filter.search && { search: filter.search }),
      });

      console.log(`API URL: /api/v1/news/admin/all?${params.toString()}`);

      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news/admin/all?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          `Received ${data.news.length} news items, total: ${data.total}, page: ${data.page}`
        );
        setNews(data.news);
        setPagination((prev) => ({
          ...prev,
          // Don't update page from backend to avoid circular dependency
          total: data.total,
          totalPages: Math.ceil(data.total / prev.limit),
        }));
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingNews
        ? `http://localhost:8000/api/v1/news/${editingNews.id}`
        : "http://localhost:8000/api/v1/news/";

      const method = editingNews ? "PUT" : "POST";

      // Prepare the data with proper formatting
      const submitData = {
        ...formData,
        // Convert empty string to null for scheduled_publish_at
        scheduled_publish_at: formData.scheduled_publish_at
          ? new Date(formData.scheduled_publish_at).toISOString()
          : null,
      };

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        await fetchNews();
        setShowForm(false);
        setEditingNews(null);
        setFormData({
          title: "",
          summary: "",
          content: "",
          category: "GENERAL",
          additional_category_ids: [],
          tags: "",
          author: "",
          source_url: "",
          image_url: "",
          is_featured: false,
          is_published: false,
          scheduled_publish_at: "",
        });
      } else {
        const errorData = await response.json();
        console.error("Error saving news:", errorData);

        // Handle validation errors properly
        let errorMessage = "Failed to save news";
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Handle Pydantic validation errors
            errorMessage = errorData.detail
              .map(
                (err: any) =>
                  `${err.loc?.join(" -> ") || "Field"}: ${err.msg || err}`
              )
              .join("\n");
          } else {
            errorMessage = errorData.detail;
          }
        }

        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error saving news:", error);
      alert("An error occurred while saving the news");
    }
  };

  const handleView = (newsItem: News) => {
    setViewingNews(newsItem);
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);

    const additionalCategories =
      newsItem.categories?.filter((cat) => !cat.is_primary) || [];

    setFormData({
      title: newsItem.title,
      summary: newsItem.summary || "",
      content: newsItem.content,
      category: newsItem.category,
      additional_category_ids: additionalCategories.map((cat) => cat.id),
      tags: newsItem.tags || "",
      author: newsItem.author || "",
      source_url: newsItem.source_url || "",
      image_url: newsItem.image_url || "",
      is_featured: newsItem.is_featured,
      is_published: newsItem.is_published,
      scheduled_publish_at: newsItem.scheduled_publish_at
        ? new Date(newsItem.scheduled_publish_at).toISOString().slice(0, 16)
        : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this news item?")) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchNews();
      }
    } catch (error) {
      console.error("Error deleting news:", error);
    }
  };

  const handlePublish = async (id: number, publish: boolean) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news/${id}/publish`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_published: publish,
            published_at: publish ? new Date().toISOString() : null,
          }),
        }
      );

      if (response.ok) {
        await fetchNews();
      }
    } catch (error) {
      console.error("Error updating news:", error);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCategory
        ? `http://localhost:8000/api/v1/news-categories/${editingCategory.id}`
        : "http://localhost:8000/api/v1/news-categories/";

      const method = editingCategory ? "PUT" : "POST";

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        await fetchCategories();
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryFormData({
          name: "",
          display_name: "",
          description: "",
          is_active: true,
        });
      } else {
        const errorData = await response.json();
        console.error("Error saving category:", errorData);

        // Handle validation errors properly
        let errorMessage = "Failed to save category";
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Handle Pydantic validation errors
            errorMessage = errorData.detail
              .map(
                (err: any) =>
                  `${err.loc?.join(" -> ") || "Field"}: ${err.msg || err}`
              )
              .join("\n");
          } else {
            errorMessage = errorData.detail;
          }
        }

        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("An error occurred while saving the category");
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      display_name: category.display_name,
      description: category.description || "",
      is_active: category.is_active,
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news-categories/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleAdditionalCategoryToggle = (categoryId: number) => {
    const currentIds = formData.additional_category_ids;
    const primaryCategoryId = categories.find(
      (cat) => cat.name === formData.category
    )?.id;

    if (categoryId === primaryCategoryId) {
      return;
    }

    if (currentIds.includes(categoryId)) {
      setFormData({
        ...formData,
        additional_category_ids: currentIds.filter((id) => id !== categoryId),
      });
    } else {
      setFormData({
        ...formData,
        additional_category_ids: [...currentIds, categoryId],
      });
    }
  };

  const getCategoryBadgeColor = (categoryName: string) => {
    const colors = {
      EUA: "bg-blue-100 text-blue-800",
      EUA2: "bg-indigo-100 text-indigo-800",
      GOO: "bg-green-100 text-green-800",
      GEO: "bg-emerald-100 text-emerald-800",
      VOLUNTARY_MARKETS: "bg-purple-100 text-purple-800",
      BIOFUELS: "bg-orange-100 text-orange-800",
      GENERAL: "bg-gray-100 text-gray-800",
    };
    return (
      colors[categoryName as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryDisplayName = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName);
    return category ? category.display_name : categoryName;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
        <div className="flex gap-2">
          {activeTab === "news" && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600 transition"
            >
              <PlusIcon className="h-4 w-4" />
              Add News
            </button>
          )}
          {activeTab === "categories" && (
            <button
              onClick={() => setShowCategoryForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600 transition"
            >
              <PlusIcon className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("news")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "news"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              News Articles
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "categories"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Categories
            </button>
          </nav>
        </div>
      </div>

      {/* Filters - Only show on news tab */}
      {activeTab === "news" && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filter.category}
                onChange={(e) =>
                  setFilter({ ...filter, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
                placeholder="Search in title, summary, content, tags..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items per page
              </label>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value);
                  setPagination((prev) => ({
                    ...prev,
                    limit: newLimit,
                    page: 1,
                  }));
                  fetchNews(1);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* News Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingNews ? "Edit News" : "Add News"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Primary Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Categories */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Additional Categories
                  <span className="text-gray-500 text-xs ml-1">
                    (optional - select categories beyond the primary one)
                  </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                  {categories
                    .filter((cat) => cat.name !== formData.category)
                    .map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.additional_category_ids.includes(
                            cat.id
                          )}
                          onChange={() =>
                            handleAdditionalCategoryToggle(cat.id)
                          }
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">
                          {cat.display_name}
                        </span>
                      </label>
                    ))}
                </div>
                {formData.additional_category_ids.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected {formData.additional_category_ids.length}{" "}
                    additional categories
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Summary
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Brief summary of the news..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-40 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Full news content..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Comma-separated tags"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) =>
                      setFormData({ ...formData, source_url: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_featured: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  Featured News
                </label>
                <label className="flex items-center text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_published: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  Publish Immediately
                </label>
              </div>

              {/* Scheduled Publishing */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Schedule Publication (Optional)
                  <span className="text-gray-500 text-xs ml-1">
                    - leave empty for immediate publishing
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_publish_at}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduled_publish_at: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
                {formData.scheduled_publish_at && (
                  <p className="text-xs text-gray-600 mt-1">
                    📅 This article will be automatically published on{" "}
                    {new Date(formData.scheduled_publish_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingNews(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  {editingNews ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Name (Key)
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. EUA, BIOFUELS"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.display_name}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        display_name: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. European Union Allowances"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Description of this category..."
                />
              </div>

              <div>
                <label className="flex items-center text-gray-700">
                  <input
                    type="checkbox"
                    checked={categoryFormData.is_active}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        is_active: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News View Modal */}
      {viewingNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                View News Article
              </h2>
              <button
                onClick={() => setViewingNews(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {viewingNews.title}
                </h1>
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Primary Category */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                      viewingNews.category
                    )} border-2 border-current`}
                  >
                    ★ {getCategoryDisplayName(viewingNews.category)}
                  </span>

                  {/* Additional Categories */}
                  {viewingNews.categories
                    ?.filter((cat) => !cat.is_primary)
                    .map((cat) => (
                      <span
                        key={cat.id}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                          cat.name
                        )}`}
                      >
                        {cat.display_name}
                      </span>
                    ))}

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingNews.is_published
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {viewingNews.is_published ? "Published" : "Draft"}
                  </span>
                  {viewingNews.is_featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Created: {formatDate(viewingNews.created_at)}</span>
                  {viewingNews.published_at && (
                    <span>
                      Published: {formatDate(viewingNews.published_at)}
                    </span>
                  )}
                  {viewingNews.scheduled_publish_at && (
                    <span>
                      Scheduled: {formatDate(viewingNews.scheduled_publish_at)}
                    </span>
                  )}
                  {viewingNews.author && <span>By: {viewingNews.author}</span>}
                </div>
              </div>

              {/* Summary */}
              {viewingNews.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Summary
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {viewingNews.summary}
                  </p>
                </div>
              )}

              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Content
                </h3>
                <div className="prose max-w-none bg-gray-50 p-4 rounded-md">
                  <div
                    className="text-gray-700"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {viewingNews.content}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {viewingNews.tags && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Tags</h4>
                    <p className="text-sm text-gray-600">{viewingNews.tags}</p>
                  </div>
                )}
                {viewingNews.source_url && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Source</h4>
                    <a
                      href={viewingNews.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {viewingNews.source_url}
                    </a>
                  </div>
                )}
                {viewingNews.image_url && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Image</h4>
                    <img
                      src={viewingNews.image_url}
                      alt={viewingNews.title}
                      className="max-w-full h-auto rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingNews(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 bg-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleEdit(viewingNews);
                    setViewingNews(null);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === "news" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {news.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.title}
                      </div>
                      {item.summary && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.summary}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {/* Primary Category */}
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${getCategoryBadgeColor(
                          item.category
                        )} border border-current`}
                      >
                        ★ {getCategoryDisplayName(item.category)}
                      </span>

                      {/* Additional Categories */}
                      {item.categories
                        ?.filter((cat) => !cat.is_primary)
                        .map((cat) => (
                          <span
                            key={cat.id}
                            className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${getCategoryBadgeColor(
                              cat.name
                            )}`}
                          >
                            {cat.display_name}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          item.is_published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                      {item.is_featured && (
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(item)}
                        className="text-gray-600 hover:text-gray-800"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handlePublish(item.id, !item.is_published)
                        }
                        className={`${
                          item.is_published
                            ? "text-yellow-600 hover:text-yellow-800"
                            : "text-green-600 hover:text-green-800"
                        }`}
                        title={item.is_published ? "Unpublish" : "Publish"}
                      >
                        {item.is_published ? (
                          <XMarkIcon className="h-4 w-4" />
                        ) : (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {news.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No news items found
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                page: pageNum,
                              }))
                            }
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.page === pageNum
                                ? "z-10 bg-green-50 border-green-500 text-green-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "categories" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.display_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.description || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        category.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
