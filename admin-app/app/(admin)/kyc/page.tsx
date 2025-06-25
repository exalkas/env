"use client";

import { useState, useEffect } from "react";
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "@/lib/utils/auth";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import FormInput from "@/components/shared/FormInput";
import FormTextarea from "@/components/shared/FormTextarea";
import { useNotifications } from "@/lib/hooks";
import { NotificationContainer } from "@/components/NotificationToast";

interface KYCDocument {
  id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_verified: boolean;
  verification_notes?: string;
  upload_date: string;
}

interface KYCSubmission {
  id: number;
  user_id: number;
  user?: {
    id: number;
    full_name: string;
    email: string;
  };
  status: string;
  kyc_level: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  reviewer?: {
    full_name: string;
  };
  rejection_reason?: string;
  admin_notes?: string;
  submission_data?: {
    personal_info?: {
      full_name: string;
      date_of_birth: string;
      nationality: string;
      phone_number: string;
      country_of_residence: string;
    };
    address?: {
      street: string;
      city: string;
      postal_code: string;
      country: string;
    };
    identity_document?: {
      type: string;
      number: string;
      issuing_country: string;
      issue_date?: string;
      expiry_date: string;
    };
    proof_of_address?: {
      type: string;
      issue_date: string;
    };
  };
  documents?: KYCDocument[];
}

export default function KYCPage() {
  const { notifications, addNotification, dismissNotification } =
    useNotifications();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<KYCSubmission | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteDocumentModal, setDeleteDocumentModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<KYCDocument | null>(
    null
  );
  const [deletingDocument, setDeletingDocument] = useState(false);
  const [viewDocumentModal, setViewDocumentModal] = useState(false);
  const [documentToView, setDocumentToView] = useState<KYCDocument | null>(
    null
  );
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (documentUrl) {
        window.URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentUrl]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetchWithAuth("/api/v1/kyc/admin/submissions");
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Error fetching KYC submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (
    submission: KYCSubmission,
    action: "approve" | "reject"
  ) => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setRejectionReason("");
    setReviewModal(true);
  };

  const markAsUnderReview = async (submission: KYCSubmission) => {
    try {
      const response = await fetchWithAuth(
        `/api/v1/kyc/admin/submissions/${submission.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "under_review",
            admin_notes: "Marked as under review for processing",
          }),
        }
      );

      if (response.ok) {
        // Update the local submission status
        const updatedSubmission = { ...submission, status: "under_review" };
        setSelectedSubmission(updatedSubmission);
        fetchSubmissions(); // Refresh the list
        addNotification(
          "success",
          "Status Updated",
          "Submission marked as under review"
        );
      } else {
        const error = await response.json();
        let errorMessage = "Unknown error";

        if (error.detail) {
          if (Array.isArray(error.detail)) {
            errorMessage = error.detail
              .map(
                (err: any) =>
                  `${err.loc?.join(" → ") || "Field"}: ${
                    err.msg || err.type || "validation error"
                  }`
              )
              .join("; ");
          } else if (typeof error.detail === "string") {
            errorMessage = error.detail;
          } else {
            errorMessage = "Validation error occurred";
          }
        }

        addNotification("error", "Update Failed", errorMessage);
      }
    } catch (error) {
      console.error("Error marking as under review:", error);
      addNotification(
        "error",
        "Network Error",
        "Failed to update status. Please try again."
      );
    }
  };

  const submitReview = async () => {
    if (!selectedSubmission) return;
    if (reviewAction === "reject" && !rejectionReason.trim()) {
      addNotification(
        "warning",
        "Validation Error",
        "Please provide a rejection reason"
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetchWithAuth(
        `/api/v1/kyc/admin/submissions/${selectedSubmission.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: reviewAction === "approve" ? "approved" : "rejected",
            rejection_reason:
              reviewAction === "reject" ? rejectionReason : undefined,
          }),
        }
      );

      if (response.ok) {
        setReviewModal(false);
        setSelectedSubmission(null);
        fetchSubmissions(); // Refresh list
        addNotification(
          "success",
          "KYC Review Completed",
          `KYC ${
            reviewAction === "approve" ? "approved" : "rejected"
          } successfully`
        );
      } else {
        const error = await response.json();
        let errorMessage = "Unknown error";

        if (error.detail) {
          if (Array.isArray(error.detail)) {
            // Handle validation errors array
            errorMessage = error.detail
              .map(
                (err: any) =>
                  `${err.loc?.join(" → ") || "Field"}: ${
                    err.msg || err.type || "validation error"
                  }`
              )
              .join("; ");
          } else if (typeof error.detail === "string") {
            errorMessage = error.detail;
          } else {
            errorMessage = "Validation error occurred";
          }
        }

        addNotification("error", "Review Failed", errorMessage);
      }
    } catch (error) {
      console.error("Error reviewing KYC:", error);
      addNotification(
        "error",
        "Network Error",
        "Failed to submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = (document: KYCDocument) => {
    setDocumentToDelete(document);
    setDeleteDocumentModal(true);
  };

  const deleteDocument = async () => {
    if (!documentToDelete) return;

    setDeletingDocument(true);
    try {
      const response = await fetchWithAuth(
        `/api/v1/kyc/admin/documents/${documentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh the submission data
        if (selectedSubmission) {
          const updatedDocuments =
            selectedSubmission.documents?.filter(
              (doc) => doc.id !== documentToDelete.id
            ) || [];
          setSelectedSubmission({
            ...selectedSubmission,
            documents: updatedDocuments,
          });
        }
        fetchSubmissions(); // Refresh list
        setDeleteDocumentModal(false);
        setDocumentToDelete(null);
        addNotification(
          "success",
          "Document Deleted",
          `${documentToDelete.file_name} has been deleted successfully`
        );
      } else {
        const error = await response.json();
        let errorMessage = "Unknown error";

        if (error.detail) {
          if (Array.isArray(error.detail)) {
            errorMessage = error.detail
              .map(
                (err: any) =>
                  `${err.loc?.join(" → ") || "Field"}: ${
                    err.msg || err.type || "validation error"
                  }`
              )
              .join("; ");
          } else if (typeof error.detail === "string") {
            errorMessage = error.detail;
          } else {
            errorMessage = "Validation error occurred";
          }
        }

        addNotification("error", "Delete Failed", errorMessage);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      addNotification(
        "error",
        "Network Error",
        "Failed to delete document. Please try again."
      );
    } finally {
      setDeletingDocument(false);
    }
  };

  const viewDocument = async (document: KYCDocument) => {
    setDocumentToView(document);
    setViewDocumentModal(true);
    setLoadingDocument(true);
    setDocumentUrl(null);

    try {
      const response = await fetchWithAuth(
        `/api/v1/kyc/admin/documents/${document.id}/view`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDocumentUrl(url);
      } else {
        addNotification(
          "error",
          "Load Failed",
          "Unable to load document for viewing"
        );
      }
    } catch (error) {
      console.error("Error loading document:", error);
      addNotification(
        "error",
        "Network Error",
        "Failed to load document. Please try again."
      );
    } finally {
      setLoadingDocument(false);
    }
  };

  const downloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetchWithAuth(
        `/api/v1/kyc/admin/documents/${documentId}/download`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        addNotification(
          "success",
          "Download Started",
          `${fileName} is being downloaded`
        );
      } else {
        addNotification(
          "error",
          "Download Failed",
          "Unable to download document"
        );
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      addNotification(
        "error",
        "Network Error",
        "Failed to download document. Please try again."
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "submitted":
      case "under_review":
        return "warning";
      default:
        return "neutral";
    }
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

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.user?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.user?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.submission_data?.personal_info?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      false;

    const matchesStatus = !statusFilter || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "user",
      label: "User",
      render: (submission: KYCSubmission) => (
        <div>
          <div className="font-medium text-gray-900">
            {submission.user?.full_name || "N/A"}
          </div>
          <div className="text-sm text-gray-500">
            {submission.user?.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "personal_name",
      label: "KYC Name",
      render: (submission: KYCSubmission) => (
        <div className="font-medium text-gray-900">
          {submission.submission_data?.personal_info?.full_name || "N/A"}
        </div>
      ),
    },
    {
      key: "documents_count",
      label: "Documents",
      render: (submission: KYCSubmission) => (
        <div className="text-sm text-gray-600">
          {submission.documents?.length || 0} files
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (submission: KYCSubmission) => (
        <StatusBadge
          status={submission.status}
          variant={getStatusColor(submission.status)}
        />
      ),
    },
    {
      key: "kyc_level",
      label: "Level",
      render: (submission: KYCSubmission) => (
        <span className="text-sm text-gray-600">{submission.kyc_level}</span>
      ),
    },
    {
      key: "submitted_at",
      label: "Submitted",
      render: (submission: KYCSubmission) => (
        <span className="text-sm text-gray-600">
          {formatDate(submission.submitted_at)}
        </span>
      ),
    },
    {
      key: "reviewed_info",
      label: "Reviewed",
      render: (submission: KYCSubmission) => (
        <div className="text-sm text-gray-600">
          {submission.reviewed_at ? (
            <>
              <div>{formatDate(submission.reviewed_at)}</div>
              {submission.reviewer && (
                <div className="text-xs text-gray-500">
                  by {submission.reviewer.full_name}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400">Not reviewed</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (submission: KYCSubmission) => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSubmission(submission)}
            className="text-gray-600 hover:text-gray-800"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {(submission.status === "submitted" ||
            submission.status === "under_review") && (
            <>
              <button
                onClick={() => handleReview(submission, "approve")}
                className="text-green-600 hover:text-green-800"
                title="Approve"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReview(submission, "reject")}
                className="text-red-600 hover:text-red-800"
                title="Reject"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">KYC Reviews</h1>
        <p className="mt-2 text-gray-600">
          Review and manage user KYC verification submissions
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <FormInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredSubmissions}
        columns={columns}
        loading={loading}
        emptyState={{
          title: "No KYC submissions found",
          description: "There are no KYC submissions to review at the moment.",
        }}
      />

      {/* Review Modal */}
      <Modal
        isOpen={reviewModal}
        onClose={() => setReviewModal(false)}
        title={`${
          reviewAction === "approve" ? "Approve" : "Reject"
        } KYC Submission`}
      >
        <div className="space-y-4">
          {selectedSubmission && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  User: {selectedSubmission.user?.full_name || "N/A"} (
                  {selectedSubmission.user?.email || "N/A"})
                </p>
                <p className="text-sm text-gray-600">
                  KYC Name:{" "}
                  {selectedSubmission.submission_data?.personal_info
                    ?.full_name || "N/A"}
                </p>
              </div>

              {reviewAction === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <FormTextarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setReviewModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant={reviewAction === "approve" ? "success" : "danger"}
                  onClick={submitReview}
                  loading={submitting}
                  disabled={submitting}
                >
                  {reviewAction === "approve" ? "Approve" : "Reject"} KYC
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={
          !!selectedSubmission &&
          !reviewModal &&
          !deleteDocumentModal &&
          !viewDocumentModal
        }
        onClose={() => setSelectedSubmission(null)}
        title="KYC Submission Details"
        size="xl"
      >
        {selectedSubmission && (
          <div className="space-y-6">
            {/* User Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                User Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Account:</span>
                  <p>{selectedSubmission.user?.full_name || "N/A"}</p>
                  <p className="text-gray-600">
                    {selectedSubmission.user?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <div className="mt-1">
                    <StatusBadge
                      status={selectedSubmission.status}
                      variant={getStatusColor(selectedSubmission.status)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Full Name:</span>
                  <p>
                    {selectedSubmission.submission_data?.personal_info
                      ?.full_name || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Date of Birth:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.personal_info
                      ?.date_of_birth || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Nationality:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.personal_info
                      ?.nationality || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Country of Residence:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.personal_info
                      ?.country_of_residence || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p>
                    {selectedSubmission.submission_data?.personal_info
                      ?.phone_number || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Address Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Street Address:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.address?.street ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">City:</span>
                  <p>
                    {selectedSubmission.submission_data?.address?.city || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Postal Code:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.address?.postal_code ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Country:</span>
                  <p>
                    {selectedSubmission.submission_data?.address?.country ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Identity Document */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Identity Document
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Document Type:
                  </span>
                  <p className="capitalize">
                    {selectedSubmission.submission_data?.identity_document?.type?.replace(
                      "_",
                      " "
                    ) || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Document Number:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.identity_document
                      ?.number || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Issuing Country:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.identity_document
                      ?.issuing_country || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Issue Date:</span>
                  <p>
                    {selectedSubmission.submission_data?.identity_document
                      ?.issue_date || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Expiry Date:
                  </span>
                  <p>
                    {selectedSubmission.submission_data?.identity_document
                      ?.expiry_date || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Proof of Address */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Proof of Address
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Document Type:
                  </span>
                  <p className="capitalize">
                    {selectedSubmission.submission_data?.proof_of_address?.type?.replace(
                      "_",
                      " "
                    ) || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Issue Date:</span>
                  <p>
                    {selectedSubmission.submission_data?.proof_of_address
                      ?.issue_date || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Uploaded Documents ({selectedSubmission.documents?.length || 0})
              </h3>
              {selectedSubmission.documents &&
              selectedSubmission.documents.length > 0 ? (
                <div className="space-y-3">
                  {selectedSubmission.documents.map((document) => (
                    <div
                      key={document.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <DocumentIcon className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {document.file_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="capitalize">
                              {document.document_type.replace("_", " ")}
                            </span>
                            {" • "}
                            {formatFileSize(document.file_size)}
                            {" • "}
                            {formatDate(document.upload_date)}
                          </div>
                          {document.is_verified && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Verified
                            </div>
                          )}
                          {document.verification_notes && (
                            <div className="text-xs text-gray-600 mt-1">
                              Note: {document.verification_notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDocument(document)}
                          className="text-green-600 hover:text-green-800"
                          title="View Document"
                        >
                          <MagnifyingGlassIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            downloadDocument(document.id, document.file_name)
                          }
                          className="text-blue-600 hover:text-blue-800"
                          title="Download Document"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Document"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DocumentIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No documents uploaded</p>
                </div>
              )}
            </div>

            {/* Review History */}
            {selectedSubmission.reviewed_at && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Review History
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">
                        Reviewed At:
                      </span>
                      <p>{formatDate(selectedSubmission.reviewed_at)}</p>
                    </div>
                    {selectedSubmission.reviewer && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Reviewed By:
                        </span>
                        <p>{selectedSubmission.reviewer.full_name}</p>
                      </div>
                    )}
                  </div>
                  {selectedSubmission.rejection_reason && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">
                        Rejection Reason:
                      </span>
                      <p className="mt-1 text-red-600">
                        {selectedSubmission.rejection_reason}
                      </p>
                    </div>
                  )}
                  {selectedSubmission.admin_notes && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">
                        Admin Notes:
                      </span>
                      <p className="mt-1 text-gray-700">
                        {selectedSubmission.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              {selectedSubmission.status === "submitted" && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => markAsUnderReview(selectedSubmission)}
                  >
                    Mark as Under Review
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => {
                      setReviewModal(true);
                      setReviewAction("approve");
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setReviewModal(true);
                      setReviewAction("reject");
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selectedSubmission.status === "under_review" && (
                <>
                  <Button
                    variant="success"
                    onClick={() => {
                      setReviewModal(true);
                      setReviewAction("approve");
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setReviewModal(true);
                      setReviewAction("reject");
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Document Confirmation Modal */}
      <Modal
        isOpen={deleteDocumentModal}
        onClose={() => setDeleteDocumentModal(false)}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this document?
          </p>
          {documentToDelete && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-900">
                {documentToDelete.file_name}
              </div>
              <div className="text-sm text-gray-500">
                {documentToDelete.document_type.replace("_", " ")} •{" "}
                {formatFileSize(documentToDelete.file_size)}
              </div>
            </div>
          )}
          <p className="text-sm text-red-600">
            This action cannot be undone. The file will be permanently deleted
            from the server.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteDocumentModal(false)}
              disabled={deletingDocument}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteDocument}
              loading={deletingDocument}
              disabled={deletingDocument}
            >
              Delete Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Document Modal */}
      <Modal
        isOpen={viewDocumentModal}
        onClose={() => {
          setViewDocumentModal(false);
          setDocumentToView(null);
          if (documentUrl) {
            window.URL.revokeObjectURL(documentUrl);
            setDocumentUrl(null);
          }
        }}
        title={`View Document: ${documentToView?.file_name || ""}`}
        size="xl"
      >
        {documentToView && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Type:</span>{" "}
                {documentToView.document_type.replace("_", " ")} •
                <span className="font-medium"> Size:</span>{" "}
                {formatFileSize(documentToView.file_size)} •
                <span className="font-medium"> Uploaded:</span>{" "}
                {formatDate(documentToView.upload_date)}
              </div>
            </div>

            {/* Document Viewer */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white min-h-[24rem]">
              {loadingDocument ? (
                <div className="flex items-center justify-center h-96">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading document...</p>
                  </div>
                </div>
              ) : documentUrl ? (
                documentToView.mime_type === "application/pdf" ? (
                  <iframe
                    src={documentUrl}
                    className="w-full h-96"
                    title={documentToView.file_name}
                  />
                ) : documentToView.mime_type.startsWith("image/") ? (
                  <img
                    src={documentUrl}
                    alt={documentToView.file_name}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-500">
                    <div className="text-center">
                      <DocumentIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Preview not available for this file type</p>
                      <p className="text-sm">Use download to view the file</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500">
                  <div className="text-center">
                    <DocumentIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>Failed to load document</p>
                    <p className="text-sm">Try downloading the file instead</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadDocument(
                      documentToView.id,
                      documentToView.file_name
                    )
                  }
                >
                  Download
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setViewDocumentModal(false);
                    if (documentUrl) {
                      window.URL.revokeObjectURL(documentUrl);
                      setDocumentUrl(null);
                    }
                    handleDeleteDocument(documentToView);
                  }}
                >
                  Delete
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setViewDocumentModal(false);
                  setDocumentToView(null);
                  if (documentUrl) {
                    window.URL.revokeObjectURL(documentUrl);
                    setDocumentUrl(null);
                  }
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
