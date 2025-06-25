from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.db.base_class import Base

class KYCStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ADDITIONAL_INFO_REQUIRED = "additional_info_required"
    EXPIRED = "expired"

class KYCLevel(str, enum.Enum):
    UNVERIFIED = "unverified"
    BASIC = "basic"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    INSTITUTIONAL = "institutional"

class KYCSubmission(Base):
    __tablename__ = "kyc_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default=KYCStatus.NOT_STARTED, nullable=False)
    kyc_level = Column(String(20), default=KYCLevel.UNVERIFIED, nullable=False)
    submission_data = Column(JSONB, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="kyc_submissions")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    documents = relationship("KYCDocument", back_populates="submission", cascade="all, delete-orphan")
    audit_logs = relationship("KYCAuditLog", back_populates="submission", cascade="all, delete-orphan")

class KYCDocument(Base):
    __tablename__ = "kyc_documents"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("kyc_submissions.id"), nullable=False)
    document_type = Column(String(50), nullable=False)  # identity, proof_of_address, etc.
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    submission = relationship("KYCSubmission", back_populates="documents")

class KYCAuditLog(Base):
    __tablename__ = "kyc_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("kyc_submissions.id"), nullable=False)
    action = Column(String(100), nullable=False)  # status_change, document_uploaded, etc.
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    submission = relationship("KYCSubmission", back_populates="audit_logs")
    user = relationship("User", foreign_keys=[performed_by]) 