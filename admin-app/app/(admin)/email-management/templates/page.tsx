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
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories,
  EmailTemplateWithStats,
  CreateTemplateData,
  UpdateTemplateData,
  CATEGORY_COLORS,
} from "@/lib/api/email-management";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateWithStats[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplateWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: "",
    category: "",
    display_name: "",
    description: "",
    subject: "",
    html_content: "",
    variables: [],
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData] = await Promise.all([
        getTemplates(),
        getCategories(),
      ]);
      setTemplates(templatesData);
      setCategories(categoriesData.categories);
    } catch (err) {
      setError("Failed to load email templates");
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setIsSubmitting(true);
      await createTemplate(formData);
      setIsCreateModalOpen(false);
      resetForm();
      await loadTemplates();
    } catch (err) {
      console.error("Error creating template:", err);
      setError("Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsSubmitting(true);
      await updateTemplate(selectedTemplate.id, formData as UpdateTemplateData);
      setIsEditModalOpen(false);
      resetForm();
      await loadTemplates();
    } catch (err) {
      console.error("Error updating template:", err);
      setError("Failed to update template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsSubmitting(true);
      await deleteTemplate(selectedTemplate.id);
      setIsDeleteModalOpen(false);
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      setError("Failed to delete template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      display_name: "",
      description: "",
      subject: "",
      html_content: "",
      variables: [],
      is_active: true,
      is_default: false,
    });
    setSelectedTemplate(null);
  };

  const openEditModal = (template: EmailTemplateWithStats) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      display_name: template.display_name,
      description: template.description || "",
      subject: template.subject,
      html_content: template.html_content,
      variables: template.variables || [],
      is_active: template.is_active,
      is_default: template.is_default,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (template: EmailTemplateWithStats) => {
    setSelectedTemplate(template);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (template: EmailTemplateWithStats) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || template.category === categoryFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && template.is_active) ||
      (statusFilter === "inactive" && !template.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (template: EmailTemplateWithStats) => (
        <div>
          <div className="font-medium text-gray-900">
            {template.display_name}
          </div>
          <div className="text-sm text-gray-500">{template.name}</div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (template: EmailTemplateWithStats) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            CATEGORY_COLORS[
              template.category as keyof typeof CATEGORY_COLORS
            ] || "bg-gray-100 text-gray-800"
          }`}
        >
          {template.category}
        </span>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      render: (template: EmailTemplateWithStats) => (
        <div className="max-w-xs truncate" title={template.subject}>
          {template.subject}
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (template: EmailTemplateWithStats) => (
        <div className="text-sm">
          <div>{template.actions_count} actions</div>
          <div className="text-gray-500">{template.usage_count} sent</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (template: EmailTemplateWithStats) => (
        <div className="space-y-1">
          <StatusBadge
            status={template.is_active ? "Active" : "Inactive"}
            variant={template.is_active ? "success" : "warning"}
          />
          {template.is_default && (
            <StatusBadge status="Default" variant="info" />
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (template: EmailTemplateWithStats) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewModal(template)}
            className="text-blue-600 hover:text-blue-700"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(template)}
            className="text-green-600 hover:text-green-700"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteModal(template)}
            className="text-red-600 hover:text-red-700"
            disabled={template.actions_count > 0}
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
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="mt-2 text-gray-600">
            Manage email templates for automated notifications
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchInput
          placeholder="Search templates..."
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

      {/* Templates Table */}
      <DataTable
        data={filteredTemplates}
        columns={columns}
        loading={loading}
        emptyMessage="No email templates found"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create Email Template"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Template Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="welcome_email"
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
            placeholder="Welcome Email"
            required
          />

          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of this template"
            rows={2}
          />

          <FormInput
            label="Subject Line"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            placeholder="Welcome to {{ company_name }}!"
            required
          />

          <FormTextarea
            label="HTML Content"
            value={formData.html_content}
            onChange={(e) =>
              setFormData({ ...formData, html_content: e.target.value })
            }
            placeholder="Enter the HTML template content..."
            rows={8}
            required
          />

          <div className="flex items-center space-x-4">
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
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData({ ...formData, is_default: e.target.checked })
                }
                className="mr-2"
              />
              Default Template
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              loading={isSubmitting}
              disabled={
                !formData.name ||
                !formData.display_name ||
                !formData.subject ||
                !formData.html_content
              }
            >
              Create Template
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
        title="Edit Email Template"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Template Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="welcome_email"
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
            placeholder="Welcome Email"
            required
          />

          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of this template"
            rows={2}
          />

          <FormInput
            label="Subject Line"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            placeholder="Welcome to {{ company_name }}!"
            required
          />

          <FormTextarea
            label="HTML Content"
            value={formData.html_content}
            onChange={(e) =>
              setFormData({ ...formData, html_content: e.target.value })
            }
            placeholder="Enter the HTML template content..."
            rows={8}
            required
          />

          <div className="flex items-center space-x-4">
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
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData({ ...formData, is_default: e.target.checked })
                }
                className="mr-2"
              />
              Default Template
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              loading={isSubmitting}
              disabled={
                !formData.name ||
                !formData.display_name ||
                !formData.subject ||
                !formData.html_content
              }
            >
              Update Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTemplate(null);
        }}
        title="Template Details"
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Template Name</h4>
                <p className="text-sm text-gray-600">{selectedTemplate.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Category</h4>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    CATEGORY_COLORS[
                      selectedTemplate.category as keyof typeof CATEGORY_COLORS
                    ] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedTemplate.category}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Display Name</h4>
              <p className="text-sm text-gray-600">
                {selectedTemplate.display_name}
              </p>
            </div>

            {selectedTemplate.description && (
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-sm text-gray-600">
                  {selectedTemplate.description}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900">Subject Line</h4>
              <p className="text-sm text-gray-600">
                {selectedTemplate.subject}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">HTML Content</h4>
              <div className="mt-2 bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {selectedTemplate.html_content}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <StatusBadge
                  status={selectedTemplate.is_active ? "Active" : "Inactive"}
                  variant={selectedTemplate.is_active ? "success" : "warning"}
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Actions Using</h4>
                <p className="text-sm text-gray-600">
                  {selectedTemplate.actions_count}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Times Used</h4>
                <p className="text-sm text-gray-600">
                  {selectedTemplate.usage_count}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTemplate(null);
        }}
        title="Delete Template"
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the template "
              {selectedTemplate.display_name}"? This action cannot be undone.
            </p>

            {selectedTemplate.actions_count > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800 text-sm">
                  This template is currently used by{" "}
                  {selectedTemplate.actions_count} email action(s). You cannot
                  delete it until all actions are updated to use different
                  templates.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteTemplate}
                loading={isSubmitting}
                disabled={selectedTemplate.actions_count > 0}
              >
                Delete Template
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
