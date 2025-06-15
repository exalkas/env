"use client";

import { useState, useEffect } from "react";
import {
  BoltIcon,
  DocumentTextIcon,
  CalendarIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "../lib/utils/auth";

interface GeneratedNews {
  title: string;
  summary: string;
  content: string;
  tags: string;
  category: string;
}

interface AutomationResult {
  success: boolean;
  message: string;
  generated_news?: GeneratedNews[];
  created_news_ids?: number[];
  analysis_news_id?: number;
  errors?: string[];
}

interface PromptTemplate {
  id: number;
  name: string;
  type: string;
  template: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export default function NewsAutomation() {
  const [loading, setLoading] = useState(false);
  const [automationResult, setAutomationResult] =
    useState<AutomationResult | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [defaultPrompts, setDefaultPrompts] = useState<PromptTemplate[]>([]);

  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [newsGenerationForm, setNewsGenerationForm] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    customPrompt: "",
  });

  useEffect(() => {
    fetchPromptTemplates();
  }, []);

  // Helper function to show success message with auto-dismiss
  const showSuccess = (message: string) => {
    setErrorMessage(null);
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Helper function to show error message with auto-dismiss
  const showError = (message: string) => {
    setSuccessMessage(null);
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const fetchPromptTemplates = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news-automation/prompt-templates`
      );

      if (response.ok) {
        const data = await response.json();
        setDefaultPrompts(data.templates);
      }
    } catch (error) {
      console.error("Error fetching prompt templates:", error);
    }
  };

  const handleGenerateNews = async () => {
    setLoading(true);
    setAutomationResult(null);

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news-automation/generate-news`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_date: newsGenerationForm.startDate,
            end_date: newsGenerationForm.endDate,
            custom_prompt: newsGenerationForm.customPrompt || undefined,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAutomationResult(result);
      } else {
        const error = await response.json();
        setAutomationResult({
          success: false,
          message: error.detail || "Failed to generate news",
          errors: [error.detail || "Unknown error"],
        });
      }
    } catch (error) {
      setAutomationResult({
        success: false,
        message: "Network error occurred",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setLoading(false);
    }
  };

  const openPromptEditor = () => {
    // Priority: 1) User's saved custom prompt, 2) User's template from DB, 3) Default template
    let promptToUse = "";

    if (newsGenerationForm.customPrompt) {
      promptToUse = newsGenerationForm.customPrompt;
    } else {
      // Look for user's custom template first, then default
      const userTemplate = defaultPrompts.find(
        (p) => p.type === "combined_generation" && !p.is_default
      );
      const defaultTemplate = defaultPrompts.find(
        (p) => p.type === "combined_generation" && p.is_default
      );

      promptToUse = userTemplate?.template || defaultTemplate?.template || "";
    }

    setCustomPrompt(promptToUse);
    setShowPromptEditor(true);
  };

  const saveCustomPrompt = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/news-automation/save-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Custom Combined Generation",
            type: "combined_generation",
            template: customPrompt,
            description:
              "User customized prompt for news and analysis generation",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          // Update the form to use the custom prompt
          setNewsGenerationForm((prev) => ({ ...prev, customPrompt }));
          setShowPromptEditor(false);
          // Refresh prompt templates
          await fetchPromptTemplates();
          showSuccess("Prompt saved successfully!");
        } else {
          showError(
            `Failed to save prompt: ${result.message || "Unknown error"}`
          );
        }
      } else {
        const error = await response.json();
        showError(`Failed to save prompt: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      showError(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      EUA: "bg-blue-100 text-blue-800",
      EUA2: "bg-purple-100 text-purple-800",
      GOO: "bg-green-100 text-green-800",
      GEO: "bg-yellow-100 text-yellow-800",
      VOLUNTARY_MARKETS: "bg-pink-100 text-pink-800",
      BIOFUELS: "bg-orange-100 text-orange-800",
      GENERAL: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.GENERAL;
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{successMessage}</div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center space-x-3">
          <BoltIcon className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">AI News Automation</h2>
            <p className="text-blue-100">
              Generate news articles and daily analysis using ChatGPT in one
              efficient call
            </p>
          </div>
        </div>
      </div>

      {/* News + Analysis Generation Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Generate News Articles + Daily Analysis
            </h3>
          </div>
          <button
            onClick={openPromptEditor}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <CogIcon className="h-4 w-4" />
            <span>Edit Prompt</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={newsGenerationForm.startDate}
              onChange={(e) =>
                setNewsGenerationForm((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={newsGenerationForm.endDate}
              onChange={(e) =>
                setNewsGenerationForm((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateNews}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loading ? (
                <>
                  <ClockIcon className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <BoltIcon className="h-5 w-5" />
                  <span>Generate News & Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {newsGenerationForm.customPrompt && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Custom prompt active:</strong> Using your customized
              prompt for news and analysis generation
            </p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            <strong>🚀 Efficient Combined Generation:</strong> This will
            generate both news articles AND a daily analysis in a single API
            call, saving time and costs.
          </p>
        </div>
      </div>

      {/* Results Section */}
      {automationResult && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3 mb-4">
            {automationResult.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {automationResult.success ? "Success!" : "Error"}
            </h3>
          </div>

          <div
            className={`p-4 rounded-md mb-4 ${
              automationResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`text-sm ${
                automationResult.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {automationResult.message}
            </p>
          </div>

          {/* Generated News Results */}
          {automationResult.generated_news &&
            automationResult.generated_news.length > 0 && (
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-900">
                  Generated News Articles:
                </h4>
                {automationResult.generated_news.map((news, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-md p-4 bg-gray-50"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900">
                        {news.title}
                      </h5>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryBadgeColor(
                          news.category
                        )}`}
                      >
                        {news.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
                    <div className="text-xs text-gray-500">
                      Tags: {news.tags}
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Daily Analysis Notification */}
          {automationResult.analysis_news_id && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-4">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">
                  Daily Analysis Generated!
                </h4>
              </div>
              <p className="text-sm text-purple-800 mt-1">
                A comprehensive daily analysis has been created and saved as a
                featured article. Check the "News Articles" tab to review and
                publish it.
              </p>
            </div>
          )}

          {/* Errors */}
          {automationResult.errors && automationResult.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-900">Errors:</h4>
              {automationResult.errors.map((error, index) => (
                <div
                  key={index}
                  className="text-sm text-red-700 bg-red-50 p-2 rounded"
                >
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prompt Editor Modal */}
      {showPromptEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Edit Combined News & Analysis Generation Prompt
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={20}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Enter your custom prompt here..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This prompt will generate both news
                articles and daily analysis in one call. Make sure to include
                instructions for both parts in your prompt.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPromptEditor(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomPrompt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
