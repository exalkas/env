import { getAuthHeader } from "./auth";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Create an axios instance with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor to include auth header when available
api.interceptors.request.use((config) => {
  const authHeader = getAuthHeader();
  if (authHeader && config.headers) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

// Add response interceptor to handle 401 errors (token expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Token expired or invalid, logging out user");

      // Import logout function dynamically to avoid circular dependencies
      import("./auth").then(({ logout }) => {
        logout(); // Call logout to clear token and redirect
      });

      // Also clear localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Store session expired message
        sessionStorage.setItem(
          "auth_message",
          "Your session has expired. Please log in again."
        );
        // Redirect to login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// User API
export const fetchUserData = async () => {
  try {
    const response = await api.get("/v1/users/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

// Assets API
export const fetchAssets = async (assetType?: string) => {
  try {
    const url = assetType
      ? `/v1/market/assets?type=${assetType}`
      : "/v1/market/assets";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching assets:", error);
    throw error;
  }
};

export const fetchAssetById = async (assetId: string) => {
  try {
    const response = await api.get(`/v1/market/assets/${assetId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching asset ${assetId}:`, error);
    throw error;
  }
};

// Market Data API
export const fetchMarketData = async (assetType?: string) => {
  try {
    // Fetch assets
    const assetsUrl = assetType
      ? `/v1/market/assets?type=${assetType}`
      : "/v1/market/assets";
    const assetsResponse = await api.get(assetsUrl);

    // Fetch latest news for dashboard
    const newsResponse = await api.get(
      "/v1/news/?published_only=true&limit=10"
    );

    return {
      prices: assetsResponse.data || [],
      news: newsResponse.data?.news || [],
      trades: {}, // placeholder for trade data
      orderBooks: {}, // placeholder for order book data
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw error;
  }
};

export const fetchAssetPriceHistory = async (
  assetId: string,
  timeframe: string = "1d"
) => {
  try {
    // Note: This endpoint may not exist yet, returning mock data for now
    const response = await api.get(`/v1/market/assets/${assetId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching price history for ${assetId}:`, error);
    throw error;
  }
};

// Trading API
export const placeBuyOrder = async (
  assetId: string,
  quantity: number,
  price: number
) => {
  try {
    const response = await api.post("/v1/market/orders", {
      asset_id: assetId,
      quantity,
      price,
      order_type: "BUY",
    });
    return response.data;
  } catch (error) {
    console.error("Error placing buy order:", error);
    throw error;
  }
};

export const placeSellOrder = async (
  assetId: string,
  quantity: number,
  price: number
) => {
  try {
    const response = await api.post("/v1/market/orders", {
      asset_id: assetId,
      quantity,
      price,
      order_type: "SELL",
    });
    return response.data;
  } catch (error) {
    console.error("Error placing sell order:", error);
    throw error;
  }
};

export const fetchUserOrders = async (status?: string) => {
  try {
    const url = status
      ? `/v1/market/orders?status=${status}`
      : "/v1/market/orders";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

export const fetchUserTrades = async () => {
  try {
    const response = await api.get("/v1/market/transactions");
    return response.data;
  } catch (error) {
    console.error("Error fetching user trades:", error);
    throw error;
  }
};

export const fetchUserPortfolio = async () => {
  try {
    // Note: This endpoint may not exist yet, using orders for now
    const response = await api.get("/v1/market/orders");
    return response.data;
  } catch (error) {
    console.error("Error fetching user portfolio:", error);
    throw error;
  }
};

// Watchlist API
export const fetchUserWatchlist = async () => {
  try {
    const response = await api.get("/v1/users/watchlist");
    return response.data;
  } catch (error) {
    console.error("Error fetching user watchlist:", error);
    throw error;
  }
};

export const addToWatchlist = async (assetId: string) => {
  try {
    const response = await api.post("/v1/users/watchlist", {
      asset_id: assetId,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw error;
  }
};

export const removeFromWatchlist = async (assetId: string) => {
  try {
    const response = await api.delete(`/v1/users/watchlist/${assetId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw error;
  }
};

// Subscriptions API
export const fetchPublicSubscriptions = async () => {
  try {
    const response = await api.get("/v1/subscriptions/public");
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
};

// Dedicated news API function
export const fetchNews = async (params?: {
  category?: string;
  featured_only?: boolean;
  search?: string;
  published_only?: boolean;
  limit?: number;
}) => {
  try {
    const searchParams = new URLSearchParams();

    if (params?.category) searchParams.append("category", params.category);
    if (params?.featured_only) searchParams.append("featured_only", "true");
    if (params?.search) searchParams.append("search", params.search);
    if (params?.published_only) searchParams.append("published_only", "true");
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const url = `/v1/news/?${searchParams.toString()}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};

// KYC API
export const fetchKYCStatus = async () => {
  try {
    const response = await api.get("/v1/kyc/my-kyc");
    return response.data;
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    throw error;
  }
};

// User Settings API
export const updateUserProfile = async (profileData: {
  full_name?: string;
  email?: string;
}) => {
  try {
    const response = await api.put("/v1/users/me", profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const changePassword = async (passwordData: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  try {
    const response = await api.put("/v1/users/me/password", passwordData);
    return response.data;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

export const updateNotificationPreferences = async (preferences: {
  email_marketing?: boolean;
  email_price_alerts?: boolean;
  email_order_updates?: boolean;
  email_news_digest?: boolean;
  sms_enabled?: boolean;
}) => {
  try {
    const response = await api.put("/v1/users/me/preferences", preferences);
    return response.data;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
};

export const fetchNotificationPreferences = async () => {
  try {
    const response = await api.get("/v1/users/me/preferences");
    return response.data;
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    throw error;
  }
};

export const deactivateAccount = async (reason?: string) => {
  try {
    const response = await api.post("/v1/users/me/deactivate", { reason });
    return response.data;
  } catch (error) {
    console.error("Error deactivating account:", error);
    throw error;
  }
};

export const exportUserData = async () => {
  try {
    const response = await api.get("/v1/users/me/export", {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting user data:", error);
    throw error;
  }
};

// Education API
export const fetchLearningPaths = async (params?: {
  is_active?: boolean;
  difficulty_level?: string;
  skip?: number;
  limit?: number;
}) => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.is_active !== undefined)
      searchParams.append("is_active", params.is_active.toString());
    if (params?.difficulty_level)
      searchParams.append("difficulty_level", params.difficulty_level);
    if (params?.skip) searchParams.append("skip", params.skip.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const url = `/v1/education/learning-paths${
      searchParams.toString() ? "?" + searchParams.toString() : ""
    }`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    throw error;
  }
};

export const fetchLearningPath = async (pathId: number) => {
  try {
    const response = await api.get(`/v1/education/learning-paths/${pathId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching learning path:", error);
    throw error;
  }
};

export const enrollInLearningPath = async (pathId: number) => {
  try {
    const response = await api.post(
      `/v1/education/learning-paths/${pathId}/enroll`
    );
    return response.data;
  } catch (error) {
    console.error("Error enrolling in learning path:", error);
    throw error;
  }
};

export const fetchUserStats = async () => {
  try {
    const response = await api.get("/v1/education/user-stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
};

export const fetchLesson = async (lessonId: number) => {
  try {
    const response = await api.get(`/v1/education/lessons/${lessonId}`);
    const lesson = response.data;

    // If lesson is interactive, fetch interactive content
    if (lesson.lesson_type === "INTERACTIVE" && lesson.interactive_type_id) {
      try {
        // Fetch interactive type details
        const typeResponse = await api.get(
          `/v1/interactive-content/types/${lesson.interactive_type_id}`
        );

        // Fetch scenarios for this lesson
        const scenariosResponse = await api.get(
          `/v1/interactive-content/lessons/${lessonId}/scenarios`
        );

        lesson.interactive_content = {
          type: typeResponse.data,
          scenarios: scenariosResponse.data || [],
        };
      } catch (interactiveError) {
        console.warn("Failed to load interactive content:", interactiveError);
        // Continue without interactive content
      }
    }

    return lesson;
  } catch (error) {
    console.error("Error fetching lesson:", error);
    throw error;
  }
};

export const completeLesson = async (lessonId: number) => {
  try {
    const response = await api.post(
      `/v1/education/lessons/${lessonId}/complete`
    );
    return response.data;
  } catch (error) {
    console.error("Error completing lesson:", error);
    throw error;
  }
};

export const getNextLesson = async (pathId: number) => {
  try {
    const response = await api.get(
      `/v1/education/learning-paths/${pathId}/next-lesson`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting next lesson:", error);
    throw error;
  }
};

export const restartLearningPath = async (pathId: number) => {
  try {
    const response = await api.post(
      `/v1/education/learning-paths/${pathId}/restart`
    );
    return response.data;
  } catch (error) {
    console.error("Error restarting learning path:", error);
    throw error;
  }
};

// Certificate API
export const fetchCertificates = async () => {
  try {
    const response = await api.get("/v1/education/certificates");
    return response.data;
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw error;
  }
};

export const fetchCertificate = async (certificateId: number) => {
  try {
    const response = await api.get(
      `/v1/education/certificates/${certificateId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching certificate:", error);
    throw error;
  }
};

export const downloadCertificate = async (certificateId: number) => {
  try {
    const response = await api.get(
      `/v1/education/certificates/${certificateId}/download`
    );
    return response.data;
  } catch (error) {
    console.error("Error downloading certificate:", error);
    throw error;
  }
};

export const verifyCertificate = async (certificateId: number) => {
  try {
    const response = await api.get(
      `/v1/education/certificates/${certificateId}/verify`
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying certificate:", error);
    throw error;
  }
};

export const fetchUserAchievements = async () => {
  try {
    const response = await api.get("/v1/education/achievements/");
    return response.data;
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    throw error;
  }
};

// Interactive Content API
export const fetchInteractiveTypes = async () => {
  try {
    const response = await api.get("/v1/interactive-content/types");
    return response.data;
  } catch (error) {
    console.error("Error fetching interactive types:", error);
    throw error;
  }
};

export const fetchInteractiveScenarios = async (lessonId: number) => {
  try {
    const response = await api.get(
      `/v1/interactive-content/lessons/${lessonId}/scenarios`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching interactive scenarios:", error);
    throw error;
  }
};

export const submitInteractiveResponse = async (
  scenarioId: number,
  response: any
) => {
  try {
    const apiResponse = await api.post(
      `/v1/interactive-content/scenarios/${scenarioId}/submit`,
      {
        user_response: response,
        completed_at: new Date().toISOString(),
      }
    );
    return apiResponse.data;
  } catch (error) {
    console.error("Error submitting interactive response:", error);
    throw error;
  }
};
