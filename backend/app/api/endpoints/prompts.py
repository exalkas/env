from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.models.prompt_template import PromptTemplate
from app.schemas import prompt_template as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.PromptTemplate])
async def get_prompts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None),

    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get all prompt templates with filtering and pagination"""
    query = db.query(PromptTemplate)
    
    # Apply filters
    if search:
        query = query.filter(
            PromptTemplate.name.ilike(f"%{search}%") |
            PromptTemplate.description.ilike(f"%{search}%") |
            PromptTemplate.template.ilike(f"%{search}%")
        )
    

    
    if is_active is not None:
        query = query.filter(PromptTemplate.is_active == is_active)
    
    # Order by created_at desc
    query = query.order_by(PromptTemplate.created_at.desc())
    
    # Apply pagination
    prompts = query.offset(skip).limit(limit).all()
    
    return prompts

@router.get("/{prompt_id}", response_model=schemas.PromptTemplate)
async def get_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get a specific prompt template by ID"""
    prompt = db.query(PromptTemplate).filter(PromptTemplate.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt template not found")
    
    return prompt

@router.post("/", response_model=schemas.PromptTemplate)
async def create_prompt(
    prompt_data: schemas.PromptTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new prompt template"""
    # Check if name already exists for this user
    existing = db.query(PromptTemplate).filter(
        PromptTemplate.name == prompt_data.name,
        PromptTemplate.created_by == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Prompt template with name '{prompt_data.name}' already exists"
        )
    
    # Create new prompt
    db_prompt = PromptTemplate(
        name=prompt_data.name,
        type="custom",  # Default type since we removed type field from UI
        template=prompt_data.template,
        description=prompt_data.description,
        is_default=False,  # Only system can create default prompts
        is_active=True,
        created_by=current_user.id
    )
    
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    
    return db_prompt

@router.put("/{prompt_id}", response_model=schemas.PromptTemplate)
async def update_prompt(
    prompt_id: int,
    prompt_data: schemas.PromptTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update an existing prompt template"""
    # Get the prompt
    db_prompt = db.query(PromptTemplate).filter(PromptTemplate.id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt template not found")
    
    # Check if user can edit this prompt (any admin can edit any prompt)
    # Admins can edit all prompts including default ones
    
    # Check for name conflicts if name is being changed
    if prompt_data.name and prompt_data.name != db_prompt.name:
        existing = db.query(PromptTemplate).filter(
            PromptTemplate.name == prompt_data.name,
            PromptTemplate.id != prompt_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Prompt template with name '{prompt_data.name}' already exists"
            )
    
    # Update fields
    update_data = prompt_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_prompt, field, value)
    
    db_prompt.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_prompt)
    
    return db_prompt

@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete a prompt template"""
    # Get the prompt
    db_prompt = db.query(PromptTemplate).filter(PromptTemplate.id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt template not found")
    
    # Prevent deleting the default prompt
    if db_prompt.is_default:
        raise HTTPException(status_code=403, detail="Cannot delete the default prompt template")
    
    db.delete(db_prompt)
    db.commit()
    
    return {"message": "Prompt template deleted successfully"}

@router.post("/{prompt_id}/toggle-status")
async def toggle_prompt_status(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Toggle active/inactive status of a prompt template"""
    # Get the prompt
    db_prompt = db.query(PromptTemplate).filter(PromptTemplate.id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt template not found")
    
    # Any admin can modify any prompt
    
    # Toggle status
    db_prompt.is_active = not db_prompt.is_active
    db_prompt.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_prompt)
    
    return {
        "message": f"Prompt template {'activated' if db_prompt.is_active else 'deactivated'} successfully",
        "is_active": db_prompt.is_active
    }

 