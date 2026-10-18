"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  PlayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  LoadingSpinner,
  FormInput,
  FormTextarea,
  FormSelect,
} from "@/components/shared";
import { useNotifications } from "@/lib/hooks";
import { fetchWithAuth } from "@/lib/utils/auth";
import { NotificationContainer } from "@/components/NotificationToast";

interface Lesson {
  id: number;
  title: string;
  lesson_type: string;
  interactive_type_id?: number;
  module: {
    id: number;
    title: string;
    learning_path: {
      id: number;
      title: string;
    };
  };
}

interface InteractiveLessonType {
  id: number;
  type_key: string;
  display_name: string;
  description: string;
  component_name: string;
  default_config: any;
  is_active: boolean;
}

interface InteractiveScenario {
  id: number;
  lesson_id: number;
  type_id: number;
  title: string;
  description: string;
  scenario_data: any;
  optimal_choice?: string;
  explanation?: string;
  order_index: number;
  points_possible: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function InteractiveBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [interactiveType, setInteractiveType] =
    useState<InteractiveLessonType | null>(null);
  const [scenarios, setScenarios] = useState<InteractiveScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "scenarios" | "preview"
  >("overview");

  // Scenario editing state
  const [editingScenario, setEditingScenario] =
    useState<InteractiveScenario | null>(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioForm, setScenarioForm] = useState({
    title: "",
    description: "",
    scenario_data: {},
    optimal_choice: "",
    explanation: "",
    points_possible: 10,
    is_active: true,
  });

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      // Fetch lesson details
      const lessonResponse = await fetchWithAuth(
        `http://localhost:8000/api/v1/education/lessons/${lessonId}`
      );

      if (!lessonResponse.ok) {
        throw new Error("Failed to fetch lesson");
      }

      const lessonData = await lessonResponse.json();
      setLesson(lessonData);

      // Check if lesson has interactive type
      if (
        lessonData.lesson_type !== "INTERACTIVE" ||
        !lessonData.interactive_type_id
      ) {
        addNotification(
          "error",
          "This lesson is not configured for interactive content"
        );
        return;
      }

      // Fetch interactive type details
      const typeResponse = await fetchWithAuth(
        `http://localhost:8000/api/v1/interactive-content/types/${lessonData.interactive_type_id}`
      );

      if (typeResponse.ok) {
        const typeData = await typeResponse.json();
        setInteractiveType(typeData);
      }

      // Fetch existing scenarios
      const scenariosResponse = await fetchWithAuth(
        `http://localhost:8000/api/v1/interactive-content/lessons/${lessonId}/scenarios`
      );

      if (scenariosResponse.ok) {
        const scenariosData = await scenariosResponse.json();
        setScenarios(scenariosData);
      }
    } catch (error: any) {
      console.error("Error fetching lesson data:", error);
      addNotification("error", error.message || "Failed to load lesson data");

      if (error.message.includes("not found")) {
        router.push("/education/lessons");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScenario = () => {
    setEditingScenario(null);
    setScenarioForm({
      title: "",
      description: "",
      scenario_data: interactiveType?.default_config || {},
      optimal_choice: "",
      explanation: "",
      points_possible: 10,
      is_active: true,
    });
    setShowScenarioModal(true);
  };

  const handleEditScenario = (scenario: InteractiveScenario) => {
    setEditingScenario(scenario);
    setScenarioForm({
      title: scenario.title,
      description: scenario.description,
      scenario_data: scenario.scenario_data,
      optimal_choice: scenario.optimal_choice || "",
      explanation: scenario.explanation || "",
      points_possible: scenario.points_possible,
      is_active: scenario.is_active,
    });
    setShowScenarioModal(true);
  };

  const handleSaveScenario = async () => {
    if (!lesson || !interactiveType) return;

    setSaving(true);
    try {
      const url = editingScenario
        ? `http://localhost:8000/api/v1/interactive-content/scenarios/${editingScenario.id}`
        : `http://localhost:8000/api/v1/interactive-content/scenarios`;

      const method = editingScenario ? "PUT" : "POST";

      const payload = {
        ...scenarioForm,
        lesson_id: parseInt(lessonId),
        type_id: interactiveType.id,
        order_index: editingScenario?.order_index || scenarios.length + 1,
      };

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save scenario");
      }

      addNotification(
        "success",
        `Scenario ${editingScenario ? "updated" : "created"} successfully!`
      );
      setShowScenarioModal(false);
      fetchLessonData(); // Refresh data
    } catch (error: any) {
      console.error("Error saving scenario:", error);
      addNotification("error", error.message || "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (scenarioId: number) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/v1/interactive-content/scenarios/${scenarioId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete scenario");
      }

      addNotification("success", "Scenario deleted successfully!");
      fetchLessonData(); // Refresh data
    } catch (error: any) {
      console.error("Error deleting scenario:", error);
      addNotification("error", error.message || "Failed to delete scenario");
    }
  };

  const getComponentSpecificForm = () => {
    if (!interactiveType) return null;

    switch (interactiveType.type_key) {
      case "compliance_calculator":
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Compliance Calculator Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Company Type"
                value={(scenarioForm.scenario_data as any)?.company_type || ""}
                onChange={(e) =>
                  setScenarioForm((prev) => ({
                    ...prev,
                    scenario_data: {
                      ...prev.scenario_data,
                      company_type: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., Steel Producer"
              />
              <FormInput
                label="Emissions (tonnes CO2)"
                type="number"
                value={
                  (scenarioForm.scenario_data as any)?.emissions?.toString() ||
                  ""
                }
                onChange={(e) =>
                  setScenarioForm((prev) => ({
                    ...prev,
                    scenario_data: {
                      ...prev.scenario_data,
                      emissions: parseInt(e.target.value) || 0,
                    },
                  }))
                }
              />
              <FormInput
                label="Allowances Held"
                type="number"
                value={
                  (
                    scenarioForm.scenario_data as any
                  )?.allowances_held?.toString() || ""
                }
                onChange={(e) =>
                  setScenarioForm((prev) => ({
                    ...prev,
                    scenario_data: {
                      ...prev.scenario_data,
                      allowances_held: parseInt(e.target.value) || 0,
                    },
                  }))
                }
              />
              <FormInput
                label="EUA Price (€/tonne)"
                type="number"
                step="0.01"
                value={
                  (scenarioForm.scenario_data as any)?.eua_price?.toString() ||
                  ""
                }
                onChange={(e) =>
                  setScenarioForm((prev) => ({
                    ...prev,
                    scenario_data: {
                      ...prev.scenario_data,
                      eua_price: parseFloat(e.target.value) || 0,
                    },
                  }))
                }
              />
            </div>
          </div>
        );

      case "participant_matching":
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Participant Matching Configuration
            </h4>
            <FormTextarea
              label="Participants (JSON Array)"
              value={JSON.stringify(
                (scenarioForm.scenario_data as any)?.participants || [],
                null,
                2
              )}
              onChange={(e) => {
                try {
                  const participants = JSON.parse(e.target.value);
                  setScenarioForm((prev) => ({
                    ...prev,
                    scenario_data: { ...prev.scenario_data, participants },
                  }));
                } catch (error) {
                  // Invalid JSON, keep as string for now
                }
              }}
              rows={8}
              placeholder='[{"name": "Power Company", "type": "compliance", "role": "Electricity Generator"}]'
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Scenario Configuration
            </h4>
            <FormTextarea
              label="Configuration JSON"
              value={JSON.stringify(scenarioForm.scenario_data, null, 2)}
              onChange={(e) => {
                try {
                  const scenario_data = JSON.parse(e.target.value);
                  setScenarioForm((prev) => ({ ...prev, scenario_data }));
                } catch (error) {
                  // Invalid JSON, keep as string for now
                }
              }}
              rows={6}
              placeholder="Enter JSON configuration..."
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lesson || lesson.lesson_type !== "INTERACTIVE" || !interactiveType) {
    return (
      <div className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="text-lg font-medium text-gray-900 mt-2">
            Invalid Interactive Lesson
          </h3>
          <p className="text-gray-500 mt-1">
            This lesson is not configured for interactive content or the
            interactive type is missing.
          </p>
          <div className="mt-4 space-x-3">
            <Button href={`/education/lessons/${lessonId}/edit`}>
              Configure Interactive Type
            </Button>
            <Button variant="secondary" href="/education/lessons">
              Back to Lessons
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/education/lessons/${lessonId}/edit`}
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
              <span className="mx-2">/</span>
              <Link
                href={`/education/learning-paths/${lesson.module.learning_path.id}`}
                className="hover:text-gray-700"
              >
                {lesson.module.learning_path.title}
              </Link>
              <span className="mx-2">/</span>
              <Link
                href={`/education/modules/${lesson.module.id}`}
                className="hover:text-gray-700"
              >
                {lesson.module.title}
              </Link>
              <span className="mx-2">/</span>
              <Link
                href={`/education/lessons/${lessonId}/edit`}
                className="hover:text-gray-700"
              >
                {lesson.title}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Interactive Builder</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">
              Interactive Builder
            </h1>
            <p className="text-gray-600 mt-1">
              Configure interactive scenarios for "{lesson.title}"
            </p>
          </div>
        </div>

        {/* Interactive Type Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-medium text-blue-900">
                {interactiveType.display_name}
              </h3>
              <p className="text-sm text-blue-700">
                {interactiveType.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: Cog6ToothIcon },
            { id: "scenarios", label: "Scenarios", icon: PlusIcon },
            { id: "preview", label: "Preview", icon: EyeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900">
                {scenarios.length}
              </div>
              <div className="text-sm text-gray-600">Total Scenarios</div>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900">
                {scenarios.filter((s) => s.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Scenarios</div>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900">
                {scenarios.reduce((sum, s) => sum + s.points_possible, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Default Configuration
            </h3>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(interactiveType.default_config, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {activeTab === "scenarios" && (
        <div className="space-y-6">
          {/* Create Scenario Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Scenarios</h3>
            <Button onClick={handleCreateScenario}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Scenario
            </Button>
          </div>

          {/* Scenarios List */}
          <div className="space-y-4">
            {scenarios.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No scenarios yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first interactive scenario.
                </p>
                <div className="mt-6">
                  <Button onClick={handleCreateScenario}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Scenario
                  </Button>
                </div>
              </div>
            ) : (
              scenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  className="bg-white border rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                          #{index + 1}
                        </span>
                        <h4 className="text-lg font-medium text-gray-900">
                          {scenario.title}
                        </h4>
                        {!scenario.is_active && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">
                        {scenario.description}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span>{scenario.points_possible} points</span>
                        <span className="mx-2">•</span>
                        <span>
                          Updated{" "}
                          {new Date(scenario.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditScenario(scenario)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(scenario.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Preview Interactive Lesson
            </h3>
            <p className="text-gray-600 mb-4">
              See how your interactive content will appear to students.
            </p>
            <Button>
              <PlayIcon className="h-4 w-4 mr-2" />
              Launch Preview
            </Button>
          </div>
        </div>
      )}

      {/* Scenario Modal */}
      {showScenarioModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingScenario ? "Edit Scenario" : "Create New Scenario"}
              </h3>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 gap-4">
                  <FormInput
                    label="Title"
                    value={scenarioForm.title}
                    onChange={(e) =>
                      setScenarioForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter scenario title"
                    required
                  />
                  <FormTextarea
                    label="Description"
                    value={scenarioForm.description}
                    onChange={(e) =>
                      setScenarioForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe this scenario"
                    rows={3}
                  />
                </div>

                {/* Component-specific configuration */}
                {getComponentSpecificForm()}

                {/* Advanced Options */}
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Points Possible"
                    type="number"
                    min="1"
                    value={scenarioForm.points_possible.toString()}
                    onChange={(e) =>
                      setScenarioForm((prev) => ({
                        ...prev,
                        points_possible: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={scenarioForm.is_active}
                      onChange={(e) =>
                        setScenarioForm((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_active"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Active (visible to students)
                    </label>
                  </div>
                </div>

                <FormTextarea
                  label="Explanation (Optional)"
                  value={scenarioForm.explanation}
                  onChange={(e) =>
                    setScenarioForm((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  placeholder="Provide explanation for the optimal solution"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowScenarioModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveScenario}
                  loading={saving}
                  disabled={saving || !scenarioForm.title.trim()}
                >
                  {saving ? "Saving..." : editingScenario ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
