const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface NewsGenerationRequest {
  start_date?: string;
  end_date?: string;
  custom_prompt?: string;
}

interface DailyAnalysisRequest {
  analysis_date?: string;
  news_ids: number[];
  custom_prompt?: string;
}

interface GeneratedNews {
  title: string;
  summary: string;
  content: string;
  tags: string;
  category: string;
}

interface NewsGenerationResponse {
  success: boolean;
  message: string;
  generated_news?: GeneratedNews[];
  created_news_ids?: number[];
  errors?: string[];
}

interface DailyAnalysisResponse {
  success: boolean;
  message: string;
  analysis?: {
    title: string;
    summary: string;
    content: string;
  };
  analysis_news_id?: number;
  errors?: string[];
}

interface PromptTemplate {
  type: string;
  template: string;
  description?: string;
}

interface PromptTemplateResponse {
  templates: PromptTemplate[];
}

interface RecentNews {
  id: number;
  title: string;
  summary: string;
  category: string;
  tags: string;
  created_at: string;
  is_featured: boolean;
}

// Helper function to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export const NewsAutomationApi = {
  // Generate news articles using AI
  generateNews: async (
    request: NewsGenerationRequest
  ): Promise<NewsGenerationResponse> => {
    const response = await fetchWithAuth(
      `${API_URL}/news-automation/generate-news`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to generate news");
    }

    return response.json();
  },

  // Generate daily analysis from selected news
  generateAnalysis: async (
    request: DailyAnalysisRequest
  ): Promise<DailyAnalysisResponse> => {
    const response = await fetchWithAuth(
      `${API_URL}/news-automation/generate-analysis`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to generate analysis");
    }

    return response.json();
  },

  // Get prompt templates
  getPromptTemplates: async (): Promise<PromptTemplateResponse> => {
    const response = await fetchWithAuth(
      `${API_URL}/news-automation/prompt-templates`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch prompt templates");
    }

    return response.json();
  },

  // Get recent news for analysis selection
  getRecentNews: async (
    days: number = 7,
    limit: number = 50
  ): Promise<RecentNews[]> => {
    const params = new URLSearchParams({
      days: days.toString(),
      limit: limit.toString(),
    });

    const response = await fetchWithAuth(
      `${API_URL}/news-automation/recent-news?${params}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch recent news");
    }

    return response.json();
  },
};

export type {
  NewsGenerationRequest,
  DailyAnalysisRequest,
  GeneratedNews,
  NewsGenerationResponse,
  DailyAnalysisResponse,
  PromptTemplate,
  PromptTemplateResponse,
  RecentNews,
};
