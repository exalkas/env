"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { getAuthHeader } from "../../lib/auth";
import FormInput from "../../components/shared/FormInput";
import Button from "../../components/shared/Button";
import FileUpload from "../../components/shared/FileUpload";

interface KYCStatus {
  status: string;
  kyc_level: string;
  submitted_at?: string;
  rejection_reason?: string;
  documents_count: number;
  can_submit: boolean;
  required_documents: string[];
  next_steps: string[];
}

interface PersonalInfo {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  country_of_residence: string;
  phone_number: string;
}

interface AddressInfo {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

interface IdentityDocument {
  type: "passport" | "national_id" | "driving_license";
  number: string;
  issuing_country: string;
  issue_date: string;
  expiry_date: string;
}

interface ProofOfAddress {
  type: "utility_bill" | "bank_statement" | "lease" | "tax_document";
  issue_date: string;
}

interface KYCFormData {
  personal_info: PersonalInfo;
  address: AddressInfo;
  identity_document: IdentityDocument;
  proof_of_address: ProofOfAddress;
}

interface UploadedFile {
  file?: File;
  name: string;
  uploadProgress?: number;
  uploaded?: boolean;
  id?: number;
}

interface DocumentFiles {
  identity_document?: UploadedFile;
  proof_of_address?: UploadedFile;
}

// Common countries for dropdowns
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Brazil",
  "Bulgaria",
  "Cambodia",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Latvia",
  "Lebanon",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Venezuela",
  "Vietnam",
];

export default function KYCPage() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<DocumentFiles>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<KYCFormData>({
    personal_info: {
      full_name: "",
      date_of_birth: "",
      nationality: "",
      country_of_residence: "",
      phone_number: "",
    },
    address: {
      street: "",
      city: "",
      postal_code: "",
      country: "",
    },
    identity_document: {
      type: "passport",
      number: "",
      issuing_country: "",
      issue_date: "",
      expiry_date: "",
    },
    proof_of_address: {
      type: "utility_bill",
      issue_date: "",
    },
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
  };

  const fetchKYCStatus = async () => {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("http://localhost:8000/api/v1/kyc/my-kyc", {
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKycStatus(data);

        // If KYC was rejected and has previous data, pre-populate the form
        if (data.status === "rejected" && data.submission_data) {
          setFormData({
            personal_info: data.submission_data.personal_info || {
              full_name: "",
              date_of_birth: "",
              nationality: "",
              country_of_residence: "",
              phone_number: "",
            },
            address: data.submission_data.address || {
              street: "",
              city: "",
              postal_code: "",
              country: "",
            },
            identity_document: data.submission_data.identity_document || {
              type: "passport",
              number: "",
              issuing_country: "",
              issue_date: "",
              expiry_date: "",
            },
            proof_of_address: data.submission_data.proof_of_address || {
              type: "utility_bill",
              issue_date: "",
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "submitted":
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value },
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateAddressInfo = (field: keyof AddressInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateIdentityDocument = (
    field: keyof IdentityDocument,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      identity_document: { ...prev.identity_document, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateProofOfAddress = (field: keyof ProofOfAddress, value: string) => {
    setFormData((prev) => ({
      ...prev,
      proof_of_address: { ...prev.proof_of_address, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.personal_info.full_name.trim()) {
        newErrors.full_name = "Full name is required";
      } else if (formData.personal_info.full_name.trim().length < 2) {
        newErrors.full_name = "Full name must be at least 2 characters";
      }

      if (!formData.personal_info.date_of_birth) {
        newErrors.date_of_birth = "Date of birth is required";
      } else {
        const age = calculateAge(formData.personal_info.date_of_birth);
        if (age < 18) {
          newErrors.date_of_birth = "You must be at least 18 years old";
        }
      }

      if (!formData.personal_info.nationality.trim()) {
        newErrors.nationality = "Nationality is required";
      }

      if (!formData.personal_info.country_of_residence.trim()) {
        newErrors.country_of_residence = "Country of residence is required";
      }

      if (!formData.personal_info.phone_number.trim()) {
        newErrors.phone_number = "Phone number is required";
      } else if (
        !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.personal_info.phone_number)
      ) {
        newErrors.phone_number = "Please enter a valid phone number";
      }
    } else if (step === 2) {
      if (!formData.address.street.trim()) {
        newErrors.street = "Street address is required";
      } else if (formData.address.street.trim().length < 5) {
        newErrors.street = "Street address must be at least 5 characters";
      }

      if (!formData.address.city.trim()) {
        newErrors.city = "City is required";
      }

      if (!formData.address.postal_code.trim()) {
        newErrors.postal_code = "Postal code is required";
      }

      if (!formData.address.country.trim()) {
        newErrors.country = "Country is required";
      }
    } else if (step === 3) {
      if (!formData.identity_document.number.trim()) {
        newErrors.document_number = "Document number is required";
      } else if (formData.identity_document.number.trim().length < 5) {
        newErrors.document_number =
          "Document number must be at least 5 characters";
      }

      if (!formData.identity_document.issuing_country.trim()) {
        newErrors.issuing_country = "Issuing country is required";
      }

      if (!formData.identity_document.issue_date) {
        newErrors.issue_date = "Issue date is required";
      }

      if (!formData.identity_document.expiry_date) {
        newErrors.expiry_date = "Expiry date is required";
      } else {
        const expiryDate = new Date(formData.identity_document.expiry_date);
        const today = new Date();
        if (expiryDate <= today) {
          newErrors.expiry_date = "Document must not be expired";
        }
      }

      if (!formData.proof_of_address.issue_date) {
        newErrors.issue_date = "Issue date is required";
      } else {
        const issueDate = new Date(formData.proof_of_address.issue_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (issueDate < threeMonthsAgo) {
          newErrors.issue_date =
            "Proof of address must be issued within the last 3 months";
        }
      }
    } else if (step === 4) {
      if (!documents.identity_document?.uploaded) {
        newErrors.identity_document_file = "Identity document file is required";
      }
      if (!documents.proof_of_address?.uploaded) {
        newErrors.proof_of_address_file = "Proof of address file is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const uploadDocument = async (
    file: File,
    documentType: string
  ): Promise<boolean> => {
    try {
      const authHeader = getAuthHeader();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const response = await fetch(
        "http://localhost:8000/api/v1/kyc/upload-document",
        {
          method: "POST",
          headers: {
            ...authHeader,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        setDocuments((prev) => ({
          ...prev,
          [documentType]: {
            ...prev[documentType as keyof DocumentFiles],
            uploaded: true,
            id: result.document_id,
            name: prev[documentType as keyof DocumentFiles]?.name || file.name,
          },
        }));
        setUploadErrors((prev) => ({ ...prev, [documentType]: "" }));
        return true;
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Upload failed";
        setUploadErrors((prev) => ({ ...prev, [documentType]: errorMessage }));
        return false;
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadErrors((prev) => ({
        ...prev,
        [documentType]: "Network error occurred during upload",
      }));
      return false;
    }
  };

  const handleFileSelect = (file: File, documentType: string) => {
    // Store the file info immediately
    setDocuments((prev) => ({
      ...prev,
      [documentType]: {
        file,
        name: file.name,
        uploaded: false,
      },
    }));
    uploadDocument(file, documentType);
  };

  const handleFileRemove = (documentType: string) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: undefined,
    }));
    setUploadErrors((prev) => ({ ...prev, [documentType]: "" }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      const authHeader = getAuthHeader();

      // For resubmissions, clear any rejection status first
      if (kycStatus?.status === "rejected") {
        console.log("Resubmitting rejected KYC application");
      }

      // Submit the form data in the format expected by backend
      const response = await fetch("http://localhost:8000/api/v1/kyc/submit", {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Now submit for review
        const reviewResponse = await fetch(
          "http://localhost:8000/api/v1/kyc/submit-for-review",
          {
            method: "POST",
            headers: {
              ...authHeader,
              "Content-Type": "application/json",
            },
          }
        );

        if (reviewResponse.ok) {
          await fetchKYCStatus(); // Refresh status
          const isResubmission = kycStatus?.status === "rejected";
          showNotification(
            "success",
            isResubmission
              ? "KYC resubmission successful! Your updated information is under review."
              : "KYC submission successful! Your information is under review."
          );
          setCurrentStep(1); // Reset form
        } else {
          const errorData = await reviewResponse.json();
          showNotification(
            "error",
            errorData.detail || "Failed to submit for review"
          );
        }
      } else {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Handle validation errors
            const errorMessages = errorData.detail
              .map(
                (err: any) =>
                  `${err.loc?.join(".")} ${
                    err.msg || err.type || "validation error"
                  }`
              )
              .join(", ");
            showNotification("error", `Validation errors: ${errorMessages}`);
          } else {
            showNotification("error", errorData.detail);
          }
        } else {
          showNotification(
            "error",
            "Submission failed. Please check your information."
          );
        }
      }
    } catch (error) {
      console.error("Error submitting KYC:", error);
      showNotification("error", "Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg ${
            notification.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "success" ? (
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            KYC Verification
          </h1>
          <p className="text-gray-600">
            Complete your identity verification to access all platform features
          </p>
        </div>

        {/* Status Card */}
        {kycStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Verification Status
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  kycStatus.status
                )}`}
              >
                {kycStatus.status.replace("_", " ").toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="font-medium text-gray-900">
                  {kycStatus.kyc_level}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Documents</p>
                <p className="font-medium text-gray-900">
                  {kycStatus.documents_count} /{" "}
                  {kycStatus.required_documents.length}
                </p>
              </div>
              {kycStatus.submitted_at && (
                <div>
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(kycStatus.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {kycStatus.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-red-800 mb-2">
                  Rejection Reason
                </h3>
                <p className="text-red-700 mb-3">
                  {kycStatus.rejection_reason}
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-start">
                    <svg
                      className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Resubmission Available
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        You can fix the issues mentioned above and resubmit your
                        KYC. Your previous information has been preserved to
                        make corrections easier.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {kycStatus.next_steps.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Next Steps</h3>
                <ul className="list-disc list-inside text-blue-700">
                  {kycStatus.next_steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* KYC Form */}
        {(!kycStatus ||
          kycStatus.status === "not_started" ||
          kycStatus.status === "rejected") && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Resubmission Header */}
            {kycStatus?.status === "rejected" && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  🔄 KYC Resubmission
                </h2>
                <p className="text-blue-800">
                  Please review and correct the information below based on the
                  rejection feedback. Your previous data has been loaded to make
                  updates easier.
                </p>
              </div>
            )}
            {/* Step Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step < currentStep
                          ? "bg-green-500 text-white"
                          : step === currentStep
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {step < currentStep ? "✓" : step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          step < currentStep ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>Personal Info</span>
                <span>Address</span>
                <span>Identity Document</span>
                <span>Document Upload</span>
              </div>
            </div>

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <FormInput
                    value={formData.personal_info.full_name}
                    onChange={(e) =>
                      updatePersonalInfo("full_name", e.target.value)
                    }
                    placeholder="Enter your full legal name"
                    error={errors.full_name}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth * (Must be 18+ years old)
                  </label>
                  <input
                    type="date"
                    value={formData.personal_info.date_of_birth}
                    onChange={(e) =>
                      updatePersonalInfo("date_of_birth", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.date_of_birth
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality *
                  </label>
                  <select
                    value={formData.personal_info.nationality}
                    onChange={(e) =>
                      updatePersonalInfo("nationality", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nationality
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select your nationality</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {errors.nationality && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.nationality}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Residence *
                  </label>
                  <select
                    value={formData.personal_info.country_of_residence}
                    onChange={(e) =>
                      updatePersonalInfo("country_of_residence", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.country_of_residence
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select your country of residence</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {errors.country_of_residence && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.country_of_residence}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <FormInput
                    value={formData.personal_info.phone_number}
                    onChange={(e) =>
                      updatePersonalInfo("phone_number", e.target.value)
                    }
                    placeholder="Enter your phone number (e.g., +1234567890)"
                    error={errors.phone_number}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} variant="primary">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Address Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <FormInput
                    value={formData.address.street}
                    onChange={(e) =>
                      updateAddressInfo("street", e.target.value)
                    }
                    placeholder="Enter your complete street address"
                    error={errors.street}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <FormInput
                    value={formData.address.city}
                    onChange={(e) => updateAddressInfo("city", e.target.value)}
                    placeholder="Enter your city"
                    error={errors.city}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <FormInput
                    value={formData.address.postal_code}
                    onChange={(e) =>
                      updateAddressInfo("postal_code", e.target.value)
                    }
                    placeholder="Enter your postal code"
                    error={errors.postal_code}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.address.country}
                    onChange={(e) =>
                      updateAddressInfo("country", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.country
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select your country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.country}
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button onClick={handleBack} variant="secondary">
                    Back
                  </Button>
                  <Button onClick={handleNext} variant="primary">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Identity Document */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Identity Document
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type *
                  </label>
                  <select
                    value={formData.identity_document.type}
                    onChange={(e) =>
                      updateIdentityDocument("type", e.target.value as any)
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Number *
                  </label>
                  <FormInput
                    value={formData.identity_document.number}
                    onChange={(e) =>
                      updateIdentityDocument("number", e.target.value)
                    }
                    placeholder="Enter document number"
                    error={errors.document_number}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Country *
                  </label>
                  <select
                    value={formData.identity_document.issuing_country}
                    onChange={(e) =>
                      updateIdentityDocument("issuing_country", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.issuing_country
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select issuing country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {errors.issuing_country && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.issuing_country}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.identity_document.issue_date}
                    onChange={(e) =>
                      updateIdentityDocument("issue_date", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.issue_date
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.issue_date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.issue_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.identity_document.expiry_date}
                    onChange={(e) =>
                      updateIdentityDocument("expiry_date", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.expiry_date
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.expiry_date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.expiry_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proof of Address Type *
                  </label>
                  <select
                    value={formData.proof_of_address.type}
                    onChange={(e) =>
                      updateProofOfAddress("type", e.target.value as any)
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="utility_bill">Utility Bill</option>
                    <option value="bank_statement">Bank Statement</option>
                    <option value="lease">Lease Agreement</option>
                    <option value="tax_document">Tax Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Issue Date * (Must be within last 3 months)
                  </label>
                  <input
                    type="date"
                    value={formData.proof_of_address.issue_date}
                    onChange={(e) =>
                      updateProofOfAddress("issue_date", e.target.value)
                    }
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.issue_date
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.issue_date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.issue_date}
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button onClick={handleBack} variant="secondary">
                    Back
                  </Button>
                  <Button onClick={handleNext} variant="primary">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Document Upload
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Document Requirements
                  </h4>
                  {kycStatus?.status === "rejected" && (
                    <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                      <strong>⚠️ Resubmission:</strong> Please upload
                      new/updated documents. Previous documents may have been
                      rejected based on the feedback above.
                    </div>
                  )}
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Documents must be clear and fully visible</li>
                    <li>• Accepted formats: JPG, PNG, PDF (max 10MB each)</li>
                    <li>• Identity document must not be expired</li>
                    <li>
                      • Proof of address must be issued within last 3 months
                    </li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identity Document * (
                    {formData.identity_document.type.replace("_", " ")})
                  </label>
                  <FileUpload
                    onFileSelect={(file) =>
                      handleFileSelect(file, "identity_document")
                    }
                    onFileRemove={() => handleFileRemove("identity_document")}
                    acceptedTypes={[
                      "image/jpeg",
                      "image/png",
                      "application/pdf",
                    ]}
                    maxSizeInMB={10}
                    currentFile={documents.identity_document}
                  />
                  {uploadErrors.identity_document && (
                    <p className="mt-2 text-sm text-red-600">
                      {uploadErrors.identity_document}
                    </p>
                  )}
                  {errors.identity_document_file && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.identity_document_file}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof of Address * (
                    {formData.proof_of_address.type.replace("_", " ")})
                  </label>
                  <FileUpload
                    onFileSelect={(file) =>
                      handleFileSelect(file, "proof_of_address")
                    }
                    onFileRemove={() => handleFileRemove("proof_of_address")}
                    acceptedTypes={[
                      "image/jpeg",
                      "image/png",
                      "application/pdf",
                    ]}
                    maxSizeInMB={10}
                    currentFile={documents.proof_of_address}
                  />
                  {uploadErrors.proof_of_address && (
                    <p className="mt-2 text-sm text-red-600">
                      {uploadErrors.proof_of_address}
                    </p>
                  )}
                  {errors.proof_of_address_file && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.proof_of_address_file}
                    </p>
                  )}
                </div>

                {/* Show uploaded files summary */}
                {(documents.identity_document?.uploaded ||
                  documents.proof_of_address?.uploaded) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      ✅ Uploaded Documents
                    </h4>
                    <div className="space-y-1 text-sm text-green-700">
                      {documents.identity_document?.uploaded && (
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Identity Document: {documents.identity_document.name}
                        </div>
                      )}
                      {documents.proof_of_address?.uploaded && (
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Proof of Address: {documents.proof_of_address.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button onClick={handleBack} variant="secondary">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="primary"
                    loading={submitting}
                    disabled={
                      submitting ||
                      !documents.identity_document?.uploaded ||
                      !documents.proof_of_address?.uploaded
                    }
                  >
                    {submitting
                      ? kycStatus?.status === "rejected"
                        ? "Resubmitting..."
                        : "Submitting..."
                      : kycStatus?.status === "rejected"
                      ? "Resubmit KYC"
                      : "Submit KYC"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
