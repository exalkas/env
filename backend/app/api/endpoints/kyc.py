from typing import Any, List, Optional
from datetime import datetime, timedelta
import os
import shutil
import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.api import deps
from app.core.config import settings
from app.models import User
from app.models.kyc import KYCSubmission, KYCDocument, KYCAuditLog, KYCStatus, KYCLevel
from app.schemas.kyc import (
    KYCSubmission as KYCSubmissionSchema,
    KYCSubmissionCreate,
    KYCSubmissionUpdate,
    KYCSubmissionData,
    AdminReviewRequest,
    DocumentUploadResponse,
    KYCSummary,
    KYCSubmissionList,
    KYCAuditLog as KYCAuditLogSchema
)
from app.services.email_service import EmailNotifications

router = APIRouter()

# Allowed file types and sizes
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
UPLOAD_DIRECTORY = "uploads/kyc"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

def save_uploaded_file(file: UploadFile, submission_id: int, document_type: str) -> str:
    """Save uploaded file and return the file path"""
    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {file_extension} not allowed")
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{submission_id}_{document_type}_{timestamp}{file_extension}"
    file_path = os.path.join(UPLOAD_DIRECTORY, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

def log_kyc_action(
    db: Session,
    submission_id: int,
    action: str,
    performed_by: int,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
    notes: Optional[str] = None
):
    """Log KYC action for audit trail"""
    log_entry = KYCAuditLog(
        submission_id=submission_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        performed_by=performed_by,
        notes=notes
    )
    db.add(log_entry)
    db.commit()

# ============================================================================
# USER ENDPOINTS
# ============================================================================

@router.get("/my-kyc")
def get_my_kyc_status(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get current user's KYC status"""
    
    submission = db.query(KYCSubmission).filter(
        KYCSubmission.user_id == current_user.id
    ).order_by(KYCSubmission.created_at.desc()).first()
    
    if not submission:
        # Create initial submission
        submission = KYCSubmission(
            user_id=current_user.id,
            status=KYCStatus.NOT_STARTED.value,
            kyc_level=KYCLevel.UNVERIFIED.value
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
    
    # Count documents
    documents_count = db.query(KYCDocument).filter(
        KYCDocument.submission_id == submission.id
    ).count()
    
    # Determine required documents and next steps
    required_documents = ["identity_document", "proof_of_address"]
    next_steps = []
    
    if submission.status == KYCStatus.NOT_STARTED.value:
        next_steps = ["Fill out personal information", "Upload identity document"]
    elif submission.status == KYCStatus.IN_PROGRESS.value:
        next_steps = ["Complete document upload", "Submit for review"]
    elif submission.status == KYCStatus.REJECTED.value:
        next_steps = ["Review rejection reason", "Upload corrected documents"]
    elif submission.status == KYCStatus.ADDITIONAL_INFO_REQUIRED.value:
        next_steps = ["Check admin notes", "Provide additional information"]
    
    can_submit = (submission.status in [KYCStatus.NOT_STARTED.value, KYCStatus.IN_PROGRESS.value, 
                                       KYCStatus.REJECTED.value, KYCStatus.ADDITIONAL_INFO_REQUIRED.value] 
                 and documents_count >= len(required_documents))
    
    return {
        "status": submission.status,
        "kyc_level": submission.kyc_level,
        "submitted_at": submission.submitted_at,
        "rejection_reason": submission.rejection_reason,
        "documents_count": documents_count,
        "can_submit": can_submit,
        "required_documents": required_documents,
        "next_steps": next_steps
    }

@router.post("/submit", response_model=KYCSubmissionSchema)
def submit_kyc_data(
    *,
    db: Session = Depends(deps.get_db),
    submission_data: KYCSubmissionData,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Submit or update KYC data"""
    
    submission = db.query(KYCSubmission).filter(
        KYCSubmission.user_id == current_user.id
    ).order_by(KYCSubmission.created_at.desc()).first()
    
    if not submission:
        submission = KYCSubmission(
            user_id=current_user.id,
            status=KYCStatus.IN_PROGRESS.value,
            kyc_level=KYCLevel.UNVERIFIED.value
        )
        db.add(submission)
    
    # Update submission data
    submission.submission_data = submission_data.dict()
    submission.status = KYCStatus.IN_PROGRESS.value
    
    db.commit()
    db.refresh(submission)
    
    # Log action
    log_kyc_action(
        db=db,
        submission_id=submission.id,
        action="data_submitted",
        performed_by=current_user.id,
        notes="Personal and document information submitted"
    )
    
    return submission

@router.post("/submit-for-review", response_model=KYCSubmissionSchema)
def submit_for_review(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Submit KYC for admin review"""
    
    submission = db.query(KYCSubmission).filter(
        KYCSubmission.user_id == current_user.id
    ).order_by(KYCSubmission.created_at.desc()).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="No KYC submission found")
    
    if submission.status not in [KYCStatus.IN_PROGRESS.value, KYCStatus.REJECTED.value, 
                                KYCStatus.ADDITIONAL_INFO_REQUIRED.value]:
        raise HTTPException(status_code=400, detail="Cannot submit KYC in current status")
    
    # Check if required documents are uploaded
    documents_count = db.query(KYCDocument).filter(
        KYCDocument.submission_id == submission.id
    ).count()
    
    if documents_count < 2:  # identity + proof of address
        raise HTTPException(status_code=400, detail="Please upload all required documents")
    
    # Update status
    old_status = submission.status
    submission.status = KYCStatus.SUBMITTED.value
    submission.submitted_at = func.now()
    
    db.commit()
    db.refresh(submission)
    
    # Log action
    log_kyc_action(
        db=db,
        submission_id=submission.id,
        action="submitted_for_review",
        performed_by=current_user.id,
        old_status=old_status,
        new_status=submission.status,
        notes="KYC submitted for admin review"
    )
    
    # Trigger KYC submission email action
    try:
        from app.services.email_service import EmailService
        email_service = EmailService()
        asyncio.create_task(
            email_service.trigger_email_action(
                db=db, 
                trigger_event="after_kyc_submission", 
                user_id=current_user.id,
                trigger_data={
                    "submission_id": submission.id,
                    "submission_status": submission.status,
                    "documents_count": documents_count
                }
            )
        )
    except Exception as e:
        print(f"Failed to trigger KYC submission email action: {e}")
    
    return submission

@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Upload KYC document"""
    
    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Get or create submission
    submission = db.query(KYCSubmission).filter(
        KYCSubmission.user_id == current_user.id
    ).order_by(KYCSubmission.created_at.desc()).first()
    
    if not submission:
        submission = KYCSubmission(
            user_id=current_user.id,
            status=KYCStatus.IN_PROGRESS.value,
            kyc_level=KYCLevel.UNVERIFIED.value
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
    
    # Save file
    file_path = save_uploaded_file(file, submission.id, document_type)
    
    # Create document record
    document = KYCDocument(
        submission_id=submission.id,
        document_type=document_type,
        file_path=file_path,
        file_name=file.filename,
        file_size=file_size,
        mime_type=file.content_type
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Log action
    log_kyc_action(
        db=db,
        submission_id=submission.id,
        action="document_uploaded",
        performed_by=current_user.id,
        notes=f"Uploaded {document_type}: {file.filename}"
    )
    
    return DocumentUploadResponse(
        document_id=document.id,
        file_name=document.file_name,
        file_size=document.file_size,
        upload_date=document.upload_date
    )

@router.get("/documents/{document_id}")
async def download_document(
    *,
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Download KYC document"""
    
    document = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if user owns this document
    submission = db.query(KYCSubmission).filter(
        KYCSubmission.id == document.submission_id,
        KYCSubmission.user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type=document.mime_type
    )

# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/admin/submissions", response_model=KYCSubmissionList)
def get_kyc_submissions(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[KYCStatus] = Query(None),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get KYC submissions for admin review"""
    
    from sqlalchemy.orm import joinedload
    
    query = db.query(KYCSubmission).options(
        joinedload(KYCSubmission.user),
        joinedload(KYCSubmission.reviewer),
        joinedload(KYCSubmission.documents)
    )
    
    if status:
        query = query.filter(KYCSubmission.status == status)
    
    # Only show submissions that have been submitted (not in progress)
    query = query.filter(KYCSubmission.status.in_([
        KYCStatus.SUBMITTED.value,
        KYCStatus.UNDER_REVIEW.value,
        KYCStatus.APPROVED.value,
        KYCStatus.REJECTED.value,
        KYCStatus.ADDITIONAL_INFO_REQUIRED.value
    ]))
    
    total = query.count()
    submissions = query.order_by(KYCSubmission.created_at.desc()).offset(skip).limit(limit).all()
    
    return KYCSubmissionList(
        submissions=submissions,
        total=total,
        page=skip // limit + 1,
        limit=limit
    )

@router.get("/admin/submissions/{submission_id}", response_model=KYCSubmissionSchema)
def get_kyc_submission(
    *,
    submission_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get specific KYC submission for review"""
    
    submission = db.query(KYCSubmission).filter(
        KYCSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    
    return submission

@router.post("/admin/submissions/{submission_id}/review", response_model=KYCSubmissionSchema)
def review_kyc_submission(
    *,
    submission_id: int,
    review_data: AdminReviewRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Review and approve/reject KYC submission"""
    
    submission = db.query(KYCSubmission).filter(
        KYCSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    
    if submission.status not in [KYCStatus.SUBMITTED.value, KYCStatus.UNDER_REVIEW.value]:
        raise HTTPException(status_code=400, detail="Cannot review KYC in current status")
    
    # Update submission
    old_status = submission.status
    submission.status = review_data.status
    submission.reviewed_at = func.now()
    submission.reviewed_by = current_user.id
    submission.rejection_reason = review_data.rejection_reason
    submission.admin_notes = review_data.admin_notes
    
    if review_data.kyc_level:
        submission.kyc_level = review_data.kyc_level
    
    # If approved, update user's KYC status
    if review_data.status == KYCStatus.APPROVED.value:
        user = db.query(User).filter(User.id == submission.user_id).first()
        if user:
            user.kyc_verified = True
    
    db.commit()
    db.refresh(submission)
    
    # Log action
    log_kyc_action(
        db=db,
        submission_id=submission.id,
        action="admin_review",
        performed_by=current_user.id,
        old_status=old_status,
        new_status=submission.status,
        notes=review_data.admin_notes
    )
    
    # Trigger KYC status update email action
    try:
        from app.services.email_service import EmailService
        email_service = EmailService()
        user = db.query(User).filter(User.id == submission.user_id).first()
        if user:
            trigger_event = "after_kyc_approval" if review_data.status == KYCStatus.APPROVED.value else "after_kyc_rejection"
            asyncio.create_task(
                email_service.trigger_email_action(
                    db=db, 
                    trigger_event=trigger_event, 
                    user_id=user.id,
                    trigger_data={
                        "submission_id": submission.id,
                        "review_status": review_data.status,
                        "rejection_reason": review_data.rejection_reason,
                        "admin_notes": review_data.admin_notes,
                        "reviewed_by": current_user.full_name or current_user.email
                    }
                )
            )
    except Exception as e:
        print(f"Failed to trigger KYC status email action: {e}")
    
    return submission

@router.get("/admin/submissions/{submission_id}/audit", response_model=List[KYCAuditLogSchema])
def get_kyc_audit_log(
    *,
    submission_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Get audit log for KYC submission"""
    
    logs = db.query(KYCAuditLog).filter(
        KYCAuditLog.submission_id == submission_id
    ).order_by(KYCAuditLog.created_at.desc()).all()
    
    return logs

@router.get("/admin/documents/{document_id}/download")
async def admin_download_document(
    *,
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Download KYC document (admin access)"""
    
    document = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type=document.mime_type
    )

@router.get("/admin/documents/{document_id}/view")
async def admin_view_document(
    *,
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """View KYC document inline (admin access)"""
    
    document = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return file for inline viewing
    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type=document.mime_type,
        headers={"Content-Disposition": f"inline; filename={document.file_name}"}
    )

@router.delete("/admin/documents/{document_id}")
async def admin_delete_document(
    *,
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Delete KYC document (admin access)"""
    
    document = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    submission = db.query(KYCSubmission).filter(KYCSubmission.id == document.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Delete physical file if it exists
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError as e:
            # Log error but continue with database deletion
            print(f"Error deleting file {document.file_path}: {e}")
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    # Log action
    log_kyc_action(
        db=db,
        submission_id=submission.id,
        action="document_deleted",
        performed_by=current_user.id,
        notes=f"Deleted document: {document.file_name} (ID: {document.id})"
    )
    
    return {"message": "Document deleted successfully", "document_id": document_id} 