from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.db.session import get_db
from app.schemas import news_category as news_category_schemas

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all news categories (public endpoint).
    """
    categories = db.query(models.NewsCategory).filter(
        models.NewsCategory.is_active == True
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": cat.id,
            "name": cat.name,
            "display_name": cat.display_name,
            "description": cat.description,
        }
        for cat in categories
    ]

@router.get("/admin/", response_model=List[dict])
def get_categories_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all news categories including inactive (admin only).
    """
    categories = db.query(models.NewsCategory).offset(skip).limit(limit).all()
    
    return [
        {
            "id": cat.id,
            "name": cat.name,
            "display_name": cat.display_name,
            "description": cat.description,
            "is_active": cat.is_active,
            "created_at": cat.created_at,
            "updated_at": cat.updated_at,
        }
        for cat in categories
    ]

@router.post("/", response_model=news_category_schemas.NewsCategoryResponse, status_code=201)
def create_category(
    category_data: news_category_schemas.NewsCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
) -> Any:
    """
    Create new news category (admin only).
    """
    # Check if category already exists
    existing = db.query(models.NewsCategory).filter(
        models.NewsCategory.name == category_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category with this name already exists"
        )
    
    category = models.NewsCategory(
        name=category_data.name,
        display_name=category_data.display_name,
        description=category_data.description,
        is_active=category_data.is_active,
        created_by=current_user.id
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category

@router.put("/{category_id}", response_model=news_category_schemas.NewsCategoryResponse)
def update_category(
    category_id: int,
    category_data: news_category_schemas.NewsCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
) -> Any:
    """
    Update news category (admin only).
    """
    category = db.query(models.NewsCategory).filter(
        models.NewsCategory.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_data.dict(exclude_unset=True)
    
    if "name" in update_data:
        # Check if name already exists (excluding current category)
        existing = db.query(models.NewsCategory).filter(
            models.NewsCategory.name == update_data["name"],
            models.NewsCategory.id != category_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Category with this name already exists"
            )
    
    # Update fields
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin),
) -> Any:
    """
    Delete news category (admin only).
    """
    category = db.query(models.NewsCategory).filter(
        models.NewsCategory.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is being used by any news
    news_count = db.query(models.News).filter(
        models.News.category == category.name
    ).count()
    
    if news_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category. It is being used by {news_count} news articles."
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"} 