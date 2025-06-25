"use client";

import React, { useState, useEffect } from "react";
import {
  DataTable,
  SearchInput,
  StatusBadge,
  Button,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  LoadingSpinner,
} from "@/components/shared";
import {
  getActions,
  getTemplates,
  createAction,
  updateAction,
  deleteAction,
  getCategories,
  getTriggerEvents,
  EmailActionWithStats,
  EmailTemplateWithStats,
  CreateActionData,
  UpdateActionData,
  EMAIL_CATEGORIES,
  TRIGGER_EVENTS,
  CATEGORY_COLORS,
} from "@/lib/api/email-management";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function EmailActionsPage() {
  const [actions, setActions] = useState<EmailActionWithStats[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateWithStats[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<EmailActionWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CreateActionData>({
    name: "",
    display_name: "",
    description: "",
    category: "",
    trigger_event: "",
    is_active: true,
    template_id: undefined,
    send_immediately: true,
    delay_minutes: 0,
    conditions: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actionsData, templatesData, categoriesData, eventsData] =
        await Promise.all([
          getActions(),
          getTemplates(),
          getCategories(),
          getTriggerEvents(),
        ]);
      setActions(actionsData);
      setTemplates(templatesData);
      setCategories(categoriesData.categories);
      setTriggerEvents(eventsData.trigger_events);
    } catch (err) {
      setError("Failed to load email actions and templates");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async () => {
    try {
      setIsSubmitting(true);
      await createAction(formData);
      setIsCreateModalOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error("Error creating action:", err);
      setError("Failed to create action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAction = async () => {
    if (!selectedAction) return;

    try {
      setIsSubmitting(true);
      await updateAction(selectedAction.id, formData as UpdateActionData);
      setIsEditModalOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error("Error updating action:", err);
      setError("Failed to update action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!selectedAction) return;

    try {
      setIsSubmitting(true);
      await deleteAction(selectedAction.id);
      setIsDeleteModalOpen(false);
      setSelectedAction(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting action:", err);
      setError("Failed to delete action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      display_name: "",
      description: "",
      category: "",
      trigger_event: "",
      is_active: true,
      template_id: undefined,
      send_immediately: true,
      delay_minutes: 0,
      conditions: undefined,
    });
    setSelectedAction(null);
  };

  const openEditModal = (action: EmailActionWithStats) => {
    setSelectedAction(action);
    setFormData({
      name: action.name,
      display_name: action.display_name,
      description: action.description || "",
      category: action.category,
      trigger_event: action.trigger_event,
      is_active: action.is_active,
      template_id: action.template_id,
      send_immediately: action.send_immediately,
      delay_minutes: action.delay_minutes,
      conditions: action.conditions,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (action: EmailActionWithStats) => {
    setSelectedAction(action);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (action: EmailActionWithStats) => {
    setSelectedAction(action);
    setIsDeleteModalOpen(true);
  };

  // Filter actions
  const filteredActions = actions.filter((action) => {
    const matchesSearch =
      action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.trigger_event.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || action.category === categoryFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && action.is_active) ||
      (statusFilter === "inactive" && !action.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns = [
    {
      key: "name",
      label: "Action",
      render: (action: EmailActionWithStats) => (
        <div>
          <div className="font-medium text-gray-900">{action.display_name}</div>
          <div className="text-sm text-gray-500">{action.name}</div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (action: EmailActionWithStats) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            CATEGORY_COLORS[action.category as keyof typeof CATEGORY_COLORS] ||
            "bg-gray-100 text-gray-800"
          }`}
        >
          {action.category}
        </span>
      ),
    },
    {
      key: "trigger_event",
      label: "Trigger Event",
      render: (action: EmailActionWithStats) => (
        <div className="text-sm">
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
            {action.trigger_event}
          </code>
        </div>
      ),
    },
    {
      key: "template",
      label: "Template",
      render: (action: EmailActionWithStats) => (
        <div className="text-sm">
          {action.template ? (
            <span className="text-gray-900">
              {action.template.display_name}
            </span>
          ) : (
            <span className="text-red-500">No template assigned</span>
          )}
        </div>
      ),
    },
    {
      key: "timing",
      label: "Timing",
      render: (action: EmailActionWithStats) => (
        <div className="text-sm">
          {action.send_immediately ? (
            <div className="flex items-center text-green-600">
              <BoltIcon className="h-4 w-4 mr-1" />
              Immediate
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              {action.delay_minutes}min delay
            </div>
          )}
        </div>
      ),
    },
    {
      key: "performance",
      label: "Performance",
      render: (action: EmailActionWithStats) => (
        <div className="text-sm">
          <div>{action.logs_count} executions</div>
          <div className="text-gray-500">
            {action.logs_count > 0
              ? `${action.success_rate.toFixed(1)}% success`
              : "No data"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (action: EmailActionWithStats) => (
        <StatusBadge
          status={action.is_active ? "Active" : "Inactive"}
          variant={action.is_active ? "success" : "warning"}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (action: EmailActionWithStats) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewModal(action)}
            className="text-blue-600 hover:text-blue-700"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(action)}
            className="text-green-600 hover:text-green-700"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteModal(action)}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" className="mx-auto mt-8" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Actions</h1>
          <p className="mt-2 text-gray-600">
            Configure automated email triggers and workflows
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Action
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchInput
          placeholder="Search actions..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <FormSelect
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </FormSelect>
        <FormSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FormSelect>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-500"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Actions Table */}
      <DataTable
        data={filteredActions}
        columns={columns}
        loading={loading}
        emptyState={{
          title: "No email actions found",
          description: "Get started by creating your first email action",
        }}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create Email Action"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Action Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="user_welcome_action"
              required
            />
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </FormSelect>
          </div>

          <FormInput
            label="Display Name"
            value={formData.display_name}
            onChange={(e) =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            placeholder="User Welcome Action"
            required
          />

          <FormTextarea
            label="Description"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of this action"
            rows={2}
          />

          <FormSelect
            label="Trigger Event"
            value={formData.trigger_event}
            onChange={(e) =>
              setFormData({ ...formData, trigger_event: e.target.value })
            }
            required
          >
            <option value="">Select Trigger Event</option>
            {triggerEvents.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Email Template"
            value={formData.template_id?.toString() || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                template_id: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          >
            <option value="">Select a template...</option>
            {templates
              .filter((t) => t.is_active)
              .map((template) => (
                <option key={template.id} value={template.id.toString()}>
                  {template.display_name}
                </option>
              ))}
          </FormSelect>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.send_immediately}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      send_immediately: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                Send Immediately
              </label>
            </div>
            {!formData.send_immediately && (
              <FormInput
                label="Delay (minutes)"
                type="number"
                value={formData.delay_minutes || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delay_minutes: parseInt(e.target.value) || 0,
                  })
                }
                min={0}
              />
            )}
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="mr-2"
            />
            Active
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAction}
              loading={isSubmitting}
              disabled={
                !formData.name ||
                !formData.display_name ||
                !formData.category ||
                !formData.trigger_event
              }
            >
              Create Action
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="Edit Email Action"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Action Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="user_welcome_action"
              required
            />
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </FormSelect>
          </div>

          <FormInput
            label="Display Name"
            value={formData.display_name}
            onChange={(e) =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            placeholder="User Welcome Action"
            required
          />

          <FormTextarea
            label="Description"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of this action"
            rows={2}
          />

          <FormSelect
            label="Trigger Event"
            value={formData.trigger_event}
            onChange={(e) =>
              setFormData({ ...formData, trigger_event: e.target.value })
            }
            required
          >
            <option value="">Select Trigger Event</option>
            {triggerEvents.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Email Template"
            value={formData.template_id?.toString() || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                template_id: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          >
            <option value="">Select a template...</option>
            {templates
              .filter((t) => t.is_active)
              .map((template) => (
                <option key={template.id} value={template.id.toString()}>
                  {template.display_name}
                </option>
              ))}
          </FormSelect>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.send_immediately}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      send_immediately: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                Send Immediately
              </label>
            </div>
            {!formData.send_immediately && (
              <FormInput
                label="Delay (minutes)"
                type="number"
                value={formData.delay_minutes || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delay_minutes: parseInt(e.target.value) || 0,
                  })
                }
                min={0}
              />
            )}
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="mr-2"
            />
            Active
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAction}
              loading={isSubmitting}
              disabled={
                !formData.name ||
                !formData.display_name ||
                !formData.category ||
                !formData.trigger_event
              }
            >
              Update Action
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAction(null);
        }}
        title="Action Details"
        size="xl"
      >
        {selectedAction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Action Name</h4>
                <p className="text-sm text-gray-600">{selectedAction.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Category</h4>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    CATEGORY_COLORS[
                      selectedAction.category as keyof typeof CATEGORY_COLORS
                    ] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedAction.category}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Display Name</h4>
              <p className="text-sm text-gray-600">
                {selectedAction.display_name}
              </p>
            </div>

            {selectedAction.description && (
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-sm text-gray-600">
                  {selectedAction.description}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900">Trigger Event</h4>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {selectedAction.trigger_event}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Email Template</h4>
              {selectedAction.template ? (
                <p className="text-sm text-gray-600">
                  {selectedAction.template.display_name}
                </p>
              ) : (
                <p className="text-sm text-red-500">No template assigned</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Timing</h4>
                {selectedAction.send_immediately ? (
                  <div className="flex items-center text-green-600">
                    <BoltIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">Immediate</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {selectedAction.delay_minutes} minutes delay
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <StatusBadge
                  status={selectedAction.is_active ? "Active" : "Inactive"}
                  variant={selectedAction.is_active ? "success" : "warning"}
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Executions</h4>
                <p className="text-sm text-gray-600">
                  {selectedAction.logs_count}
                </p>
              </div>
            </div>

            {selectedAction.logs_count > 0 && (
              <div>
                <h4 className="font-medium text-gray-900">Performance</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-sm text-gray-500">Success Rate</span>
                    <p className="text-lg font-medium text-green-600">
                      {selectedAction.success_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Last Sent</span>
                    <p className="text-sm text-gray-600">
                      {selectedAction.last_sent
                        ? new Date(selectedAction.last_sent).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedAction(null);
        }}
        title="Delete Action"
        size="md"
      >
        {selectedAction && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the action
              {selectedAction.display_name}? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAction}
                loading={isSubmitting}
              >
                Delete Action
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
