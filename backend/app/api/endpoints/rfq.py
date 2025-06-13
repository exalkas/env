from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.api.deps import get_current_user, get_db, get_current_admin_user
from app.models.rfq import RFQ
from app.models.market import Asset
from app.models.user import User
from app.schemas import rfq as rfq_schemas

router = APIRouter()

@router.post("/", response_model=rfq_schemas.RFQ)
def create_rfq(
    rfq_data: rfq_schemas.RFQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new RFQ request"""
    # Verify asset exists
    asset = db.query(Asset).filter(Asset.id == rfq_data.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    rfq = RFQ(**rfq_data.dict(), user_id=current_user.id)
    db.add(rfq)
    db.commit()
    db.refresh(rfq)
    
    return rfq

@router.get("/", response_model=rfq_schemas.RFQResponse)
def get_user_rfqs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's RFQs"""
    query = db.query(RFQ).filter(RFQ.user_id == current_user.id)
    
    if status:
        query = query.filter(RFQ.status == status)
    
    total = query.count()
    rfqs = query.order_by(desc(RFQ.created_at)).offset(skip).limit(limit).all()
    
    # Add asset details
    rfqs_with_details = []
    for rfq in rfqs:
        asset = db.query(Asset).filter(Asset.id == rfq.asset_id).first()
        rfq_dict = rfq_schemas.RFQWithDetails.from_orm(rfq).dict()
        if asset:
            rfq_dict["asset_name"] = asset.name
            rfq_dict["asset_symbol"] = asset.symbol
        rfqs_with_details.append(rfq_schemas.RFQWithDetails(**rfq_dict))
    
    return rfq_schemas.RFQResponse(
        rfqs=rfqs_with_details,
        total=total,
        page=skip // limit + 1,
        size=limit
    )

@router.get("/{rfq_id}", response_model=rfq_schemas.RFQWithDetails)
def get_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific RFQ"""
    rfq = db.query(RFQ).filter(
        and_(RFQ.id == rfq_id, RFQ.user_id == current_user.id)
    ).first()
    
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    # Add asset details
    asset = db.query(Asset).filter(Asset.id == rfq.asset_id).first()
    rfq_dict = rfq_schemas.RFQWithDetails.from_orm(rfq).dict()
    if asset:
        rfq_dict["asset_name"] = asset.name
        rfq_dict["asset_symbol"] = asset.symbol
    
    return rfq_schemas.RFQWithDetails(**rfq_dict)

@router.put("/{rfq_id}", response_model=rfq_schemas.RFQ)
def update_rfq(
    rfq_id: int,
    rfq_data: rfq_schemas.RFQUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's RFQ (only if status is PENDING)"""
    rfq = db.query(RFQ).filter(
        and_(RFQ.id == rfq_id, RFQ.user_id == current_user.id)
    ).first()
    
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if rfq.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot update RFQ that is not pending")
    
    update_data = rfq_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rfq, field, value)
    
    rfq.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rfq)
    
    return rfq

@router.patch("/{rfq_id}/accept", response_model=rfq_schemas.RFQ)
def accept_quote(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a quote from admin"""
    rfq = db.query(RFQ).filter(
        and_(RFQ.id == rfq_id, RFQ.user_id == current_user.id)
    ).first()
    
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if rfq.status != "QUOTED":
        raise HTTPException(status_code=400, detail="No quote available to accept")
    
    if rfq.expires_at and rfq.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Quote has expired")
    
    rfq.status = "ACCEPTED"
    rfq.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rfq)
    
    return rfq

@router.patch("/{rfq_id}/reject", response_model=rfq_schemas.RFQ)
def reject_quote(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a quote from admin"""
    rfq = db.query(RFQ).filter(
        and_(RFQ.id == rfq_id, RFQ.user_id == current_user.id)
    ).first()
    
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if rfq.status != "QUOTED":
        raise HTTPException(status_code=400, detail="No quote available to reject")
    
    rfq.status = "REJECTED"
    rfq.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rfq)
    
    return rfq

@router.delete("/{rfq_id}")
def cancel_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel user's RFQ (only if status is PENDING)"""
    rfq = db.query(RFQ).filter(
        and_(RFQ.id == rfq_id, RFQ.user_id == current_user.id)
    ).first()
    
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if rfq.status not in ["PENDING", "QUOTED"]:
        raise HTTPException(status_code=400, detail="Cannot cancel RFQ in current status")
    
    rfq.status = "CANCELLED"
    rfq.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "RFQ cancelled successfully"}

# Admin endpoints
@router.get("/admin/all", response_model=rfq_schemas.RFQResponse)
def get_all_rfqs_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    asset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all RFQs for admin"""
    query = db.query(RFQ)
    
    if status:
        query = query.filter(RFQ.status == status)
    
    if user_id:
        query = query.filter(RFQ.user_id == user_id)
        
    if asset_id:
        query = query.filter(RFQ.asset_id == asset_id)
    
    total = query.count()
    rfqs = query.order_by(desc(RFQ.created_at)).offset(skip).limit(limit).all()
    
    # Add user and asset details
    rfqs_with_details = []
    for rfq in rfqs:
        user = db.query(User).filter(User.id == rfq.user_id).first()
        asset = db.query(Asset).filter(Asset.id == rfq.asset_id).first()
        
        rfq_dict = rfq_schemas.RFQWithDetails.from_orm(rfq).dict()
        if user:
            rfq_dict["user_email"] = user.email
        if asset:
            rfq_dict["asset_name"] = asset.name
            rfq_dict["asset_symbol"] = asset.symbol
        
        rfqs_with_details.append(rfq_schemas.RFQWithDetails(**rfq_dict))
    
    return rfq_schemas.RFQResponse(
        rfqs=rfqs_with_details,
        total=total,
        page=skip // limit + 1,
        size=limit
    )

@router.patch("/admin/{rfq_id}/quote", response_model=rfq_schemas.RFQ)
def provide_quote(
    rfq_id: int,
    quote_data: rfq_schemas.RFQQuote,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Provide a quote for an RFQ (admin only)"""
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if rfq.status != "PENDING":
        raise HTTPException(status_code=400, detail="RFQ is not in pending status")
    
    rfq.quoted_price = quote_data.quoted_price
    rfq.total_amount = quote_data.quoted_price * rfq.quantity
    rfq.admin_notes = quote_data.admin_notes
    rfq.expires_at = quote_data.expires_at
    rfq.status = "QUOTED"
    rfq.quoted_at = datetime.utcnow()
    rfq.quoted_by = current_user.id
    rfq.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(rfq)
    
    return rfq

@router.patch("/admin/{rfq_id}/execute", response_model=rfq_schemas.RFQ)
def execute_trade(
    rfq_id: int,
    execution_data: rfq_schemas.RFQExecution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Execute the trade for an accepted RFQ (admin only)"""
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if rfq.status != "ACCEPTED":
        raise HTTPException(status_code=400, detail="RFQ has not been accepted by user")
    
    # Update execution price if provided, otherwise use quoted price
    if execution_data.executed_price:
        rfq.total_amount = execution_data.executed_price * rfq.quantity
    
    if execution_data.admin_notes:
        rfq.admin_notes = execution_data.admin_notes
    
    rfq.status = "EXECUTED"
    rfq.executed_at = datetime.utcnow()
    rfq.executed_by = current_user.id
    rfq.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(rfq)
    
    return rfq

@router.patch("/admin/{rfq_id}/status", response_model=rfq_schemas.RFQ)
def update_rfq_status(
    rfq_id: int,
    status_data: rfq_schemas.RFQStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update RFQ status (admin only)"""
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    rfq.status = status_data.status
    if status_data.admin_notes:
        rfq.admin_notes = status_data.admin_notes
    rfq.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(rfq)
    
    return rfq 