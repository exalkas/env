from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field, validator
from app.models.kyc import KYCStatus, KYCLevel
import re

# User info for KYC submissions
class UserInfo(BaseModel):
    id: int
    full_name: str
    email: str
    
    class Config:
        from_attributes = True

# Base schemas
class KYCDocumentBase(BaseModel):
    document_type: str
    file_name: str

class KYCDocumentCreate(KYCDocumentBase):
    file_path: str
    file_size: int
    mime_type: str

class KYCDocument(KYCDocumentBase):
    id: int
    submission_id: int
    file_path: str
    file_size: int
    mime_type: str
    is_verified: bool
    verification_notes: Optional[str] = None
    upload_date: datetime

    class Config:
        from_attributes = True

# Personal Information Schema
class PersonalInfo(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: str  # YYYY-MM-DD format
    nationality: str = Field(..., min_length=2, max_length=50)
    country_of_residence: str = Field(..., min_length=2, max_length=50)
    phone_number: str = Field(..., min_length=10, max_length=20)

    @validator('full_name')
    def validate_full_name(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters')
        return v.strip()

    @validator('date_of_birth')
    def validate_age(cls, v):
        try:
            birth_date = datetime.strptime(v, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
        
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        
        if age < 18:
            raise ValueError('You must be at least 18 years old')
        if age > 120:
            raise ValueError('Invalid birth date')
        
        return v

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if not v:
            raise ValueError('Phone number is required')
        # Allow international format with optional + and spaces/dashes/parentheses
        phone_pattern = r'^\+?[\d\s\-\(\)]{10,}$'
        if not re.match(phone_pattern, v):
            raise ValueError('Please enter a valid phone number')
        return v

# Address Schema
class Address(BaseModel):
    street: str = Field(..., min_length=5, max_length=200)
    city: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)
    country: str = Field(..., min_length=2, max_length=50)

    @validator('street')
    def validate_street(cls, v):
        if not v.strip():
            raise ValueError('Street address cannot be empty')
        if len(v.strip()) < 5:
            raise ValueError('Street address must be at least 5 characters')
        return v.strip()

    @validator('city', 'country')
    def validate_required_fields(cls, v):
        if not v.strip():
            raise ValueError('This field cannot be empty')
        return v.strip()

# Identity Document Schema
class IdentityDocument(BaseModel):
    type: str = Field(..., pattern="^(passport|national_id|driving_license)$")
    number: str = Field(..., min_length=5, max_length=50)
    issuing_country: str = Field(..., min_length=2, max_length=50)
    expiry_date: str  # YYYY-MM-DD format

    @validator('number')
    def validate_document_number(cls, v):
        if not v.strip():
            raise ValueError('Document number cannot be empty')
        if len(v.strip()) < 5:
            raise ValueError('Document number must be at least 5 characters')
        return v.strip()

    @validator('expiry_date')
    def validate_expiry_date(cls, v):
        try:
            expiry_date = datetime.strptime(v, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
        
        today = date.today()
        if expiry_date <= today:
            raise ValueError('Document must not be expired')
        
        return v

# Proof of Address Schema
class ProofOfAddress(BaseModel):
    type: str = Field(..., pattern="^(utility_bill|bank_statement|lease|tax_document)$")
    issue_date: str  # YYYY-MM-DD format

    @validator('issue_date')
    def validate_issue_date(cls, v):
        try:
            issue_date = datetime.strptime(v, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
        
        today = date.today()
        three_months_ago = today - timedelta(days=90)
        
        if issue_date < three_months_ago:
            raise ValueError('Proof of address must be issued within the last 3 months')
        if issue_date > today:
            raise ValueError('Issue date cannot be in the future')
        
        return v

# Business Information Schema (for institutional KYC)
class BusinessInfo(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    registration_number: str = Field(..., min_length=5, max_length=50)
    business_address: Address
    industry: str = Field(..., min_length=2, max_length=100)
    authorized_persons: List[str] = Field(..., min_items=1)

# Complete KYC Data Schema
class KYCSubmissionData(BaseModel):
    personal_info: PersonalInfo
    address: Address
    identity_document: IdentityDocument
    proof_of_address: ProofOfAddress
    business_info: Optional[BusinessInfo] = None
    additional_notes: Optional[str] = None

# KYC Submission Schemas
class KYCSubmissionBase(BaseModel):
    submission_data: Optional[KYCSubmissionData] = None

class KYCSubmissionCreate(KYCSubmissionBase):
    pass

class KYCSubmissionUpdate(BaseModel):
    status: Optional[KYCStatus] = None
    kyc_level: Optional[KYCLevel] = None
    submission_data: Optional[KYCSubmissionData] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None

class KYCSubmission(KYCSubmissionBase):
    id: int
    user_id: int
    status: KYCStatus
    kyc_level: KYCLevel
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    documents: List[KYCDocument] = []
    user: Optional[UserInfo] = None
    reviewer: Optional[UserInfo] = None

    class Config:
        from_attributes = True

# Audit Log Schema
class KYCAuditLogBase(BaseModel):
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None

class KYCAuditLog(KYCAuditLogBase):
    id: int
    submission_id: int
    performed_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Admin Review Schemas
class AdminReviewRequest(BaseModel):
    status: KYCStatus
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    kyc_level: Optional[KYCLevel] = None

    @validator('rejection_reason')
    def rejection_reason_required_for_rejected(cls, v, values):
        if values.get('status') == KYCStatus.REJECTED and not v:
            raise ValueError('Rejection reason is required when rejecting KYC')
        return v

# Document Upload Response
class DocumentUploadResponse(BaseModel):
    document_id: int
    file_name: str
    file_size: int
    upload_date: datetime

# KYC Summary for User Dashboard
class KYCSummary(BaseModel):
    status: KYCStatus
    kyc_level: KYCLevel
    submitted_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    documents_count: int
    can_submit: bool
    required_documents: List[str]
    next_steps: List[str]

# Lists
class KYCSubmissionList(BaseModel):
    submissions: List[KYCSubmission]
    total: int
    page: int
    limit: int 