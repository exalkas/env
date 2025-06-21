from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.db.session import get_db
from app.schemas import question_category as question_category_schemas

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_question_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all question categories (public endpoint).
    """
    categories = db.query(models.QuestionCategory).filter(
        models.QuestionCategory.is_active == True
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": cat.id,
            "name": cat.name,
            "display_name": cat.display_name,
            "description": cat.description,
            "color": cat.color,
        }
        for cat in categories
    ]

@router.get("/admin/", response_model=List[dict])
def get_question_categories_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all question categories including inactive (admin only).
    """
    categories = db.query(models.QuestionCategory).offset(skip).limit(limit).all()
    
    return [
        {
            "id": cat.id,
            "name": cat.name,
            "display_name": cat.display_name,
            "description": cat.description,
            "color": cat.color,
            "is_active": cat.is_active,
            "created_at": cat.created_at,
            "updated_at": cat.updated_at,
        }
        for cat in categories
    ]

@router.post("/", response_model=question_category_schemas.QuestionCategoryResponse, status_code=201)
def create_question_category(
    category_data: question_category_schemas.QuestionCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
) -> Any:
    """
    Create new question category (admin only).
    """
    # Check if category already exists
    existing = db.query(models.QuestionCategory).filter(
        models.QuestionCategory.name == category_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Question category with this name already exists"
        )
    
    category = models.QuestionCategory(
        name=category_data.name,
        display_name=category_data.display_name,
        description=category_data.description,
        color=category_data.color,
        is_active=category_data.is_active,
        created_by=current_user.id
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category

@router.put("/{category_id}", response_model=question_category_schemas.QuestionCategoryResponse)
def update_question_category(
    category_id: int,
    category_data: question_category_schemas.QuestionCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
) -> Any:
    """
    Update question category (admin only).
    """
    category = db.query(models.QuestionCategory).filter(
        models.QuestionCategory.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Question category not found")
    
    update_data = category_data.dict(exclude_unset=True)
    
    if "name" in update_data:
        # Check if name already exists (excluding current category)
        existing = db.query(models.QuestionCategory).filter(
            models.QuestionCategory.name == update_data["name"],
            models.QuestionCategory.id != category_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Question category with this name already exists"
            )
    
    # Update fields
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/{category_id}")
def delete_question_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
) -> Any:
    """
    Delete question category (admin only).
    """
    category = db.query(models.QuestionCategory).filter(
        models.QuestionCategory.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Question category not found")
    
    # Check if category is being used by any questions
    from app.models.education import Question
    questions_count = db.query(Question).filter(
        Question.category == category.name
    ).count()
    
    if questions_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category. It is being used by {questions_count} questions."
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Question category deleted successfully"} 