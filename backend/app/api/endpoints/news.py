from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, or_

from app.api.deps import get_current_user, get_db, get_current_admin_user
from app.models.news import News
from app.models.news_category import NewsCategory
from app.models.news_category_association import NewsCategoryAssociation
from app.schemas import news as news_schemas
from app.models.user import User

router = APIRouter()

def _populate_news_categories(news_item: News) -> None:
    """Populate the categories list for a news item"""
    # Add categories as a dynamic attribute for serialization
    categories_list = [
        news_schemas.NewsCategoryInfo(
            id=assoc.category.id,
            name=assoc.category.name,
            display_name=assoc.category.display_name,
            is_primary=assoc.is_primary
        )
        for assoc in news_item.category_associations
    ]
    setattr(news_item, 'categories', categories_list)

@router.get("/", response_model=news_schemas.NewsResponse)
def get_news(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    categories: Optional[List[str]] = Query(None),  # Support multiple categories filter
    published_only: bool = Query(True),
    featured_only: bool = Query(False),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get news articles with filtering and pagination"""
    query = db.query(News).options(
        joinedload(News.category_associations).joinedload(NewsCategoryAssociation.category)
    )
    
    if published_only:
        query = query.filter(News.is_published == True)
    
    # Support both single category (backward compatibility) and multiple categories
    if category or categories:
        category_filters = []
        
        # Single category filter (backward compatibility)
        if category:
            category_filters.append(News.category == category)
            
        # Multiple categories filter
        if categories:
            subquery = db.query(NewsCategoryAssociation.news_id).join(NewsCategory).filter(
                NewsCategory.name.in_(categories)
            ).subquery()
            category_filters.append(News.id.in_(subquery))
            
        if category_filters:
            query = query.filter(or_(*category_filters))
        
    if featured_only:
        query = query.filter(News.is_featured == True)
    
    if search:
        query = query.filter(
            or_(
                News.title.contains(search),
                News.summary.contains(search),
                News.content.contains(search),
                News.tags.contains(search)
            )
        )
    
    total = query.count()
    news_items = query.order_by(desc(News.created_at)).offset(skip).limit(limit).all()
    
    # Populate categories for each news item
    for news_item in news_items:
        _populate_news_categories(news_item)
    
    return news_schemas.NewsResponse(
        news=news_items,
        total=total,
        page=skip // limit + 1,
        size=limit
    )

@router.get("/{news_id}", response_model=news_schemas.News)
def get_news_item(news_id: int, db: Session = Depends(get_db)):
    """Get a specific news item"""
    news_item = db.query(News).options(
        joinedload(News.category_associations).joinedload(NewsCategoryAssociation.category)
    ).filter(News.id == news_id).first()
    
    if not news_item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    # Only show published news to non-admin users
    if not news_item.is_published:
        raise HTTPException(status_code=404, detail="News item not found")
    
    _populate_news_categories(news_item)
    return news_item

@router.post("/", response_model=news_schemas.News)
def create_news(
    news_data: news_schemas.NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new news item (admin only)"""
    # Create the news item
    news_dict = news_data.dict(exclude={'additional_category_ids'})
    news_item = News(**news_dict, created_by=current_user.id)
    
    if news_data.is_published:
        news_item.published_at = datetime.utcnow()
    
    db.add(news_item)
    db.flush()  # Get the ID without committing
    
    # Create category associations
    # First, add the primary category
    primary_category = db.query(NewsCategory).filter(NewsCategory.name == news_data.category).first()
    if primary_category:
        primary_assoc = NewsCategoryAssociation(
            news_id=news_item.id,
            category_id=primary_category.id,
            is_primary=True
        )
        db.add(primary_assoc)
    
    # Then add additional categories
    if news_data.additional_category_ids:
        for cat_id in news_data.additional_category_ids:
            # Check if category exists and is not the primary category
            category = db.query(NewsCategory).filter(NewsCategory.id == cat_id).first()
            if category and category.id != (primary_category.id if primary_category else None):
                additional_assoc = NewsCategoryAssociation(
                    news_id=news_item.id,
                    category_id=cat_id,
                    is_primary=False
                )
                db.add(additional_assoc)
    
    db.commit()
    db.refresh(news_item)
    
    # Load the associations and populate categories
    news_item = db.query(News).options(
        joinedload(News.category_associations).joinedload(NewsCategoryAssociation.category)
    ).filter(News.id == news_item.id).first()
    
    _populate_news_categories(news_item)
    return news_item

@router.put("/{news_id}", response_model=news_schemas.News)
def update_news(
    news_id: int,
    news_data: news_schemas.NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a news item (admin only)"""
    news_item = db.query(News).filter(News.id == news_id).first()
    if not news_item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    update_data = news_data.dict(exclude_unset=True, exclude={'additional_category_ids'})
    
    # Handle publishing status
    if "is_published" in update_data:
        if update_data["is_published"] and not news_item.is_published:
            update_data["published_at"] = datetime.utcnow()
        elif not update_data["is_published"]:
            update_data["published_at"] = None
    
    # Update basic fields
    for field, value in update_data.items():
        setattr(news_item, field, value)
    
    # Handle category associations update
    if news_data.additional_category_ids is not None:
        # Remove existing non-primary associations
        db.query(NewsCategoryAssociation).filter(
            NewsCategoryAssociation.news_id == news_id,
            NewsCategoryAssociation.is_primary == False
        ).delete()
        
        # Update primary category if changed
        if news_data.category is not None:
            primary_category = db.query(NewsCategory).filter(NewsCategory.name == news_data.category).first()
            if primary_category:
                # Update or create primary association
                primary_assoc = db.query(NewsCategoryAssociation).filter(
                    NewsCategoryAssociation.news_id == news_id,
                    NewsCategoryAssociation.is_primary == True
                ).first()
                
                if primary_assoc:
                    primary_assoc.category_id = primary_category.id
                else:
                    primary_assoc = NewsCategoryAssociation(
                        news_id=news_id,
                        category_id=primary_category.id,
                        is_primary=True
                    )
                    db.add(primary_assoc)
        
        # Add new additional categories
        if news_data.additional_category_ids:
            primary_category = db.query(NewsCategory).filter(NewsCategory.name == news_item.category).first()
            primary_cat_id = primary_category.id if primary_category else None
            
            for cat_id in news_data.additional_category_ids:
                # Don't add if it's the primary category
                if cat_id != primary_cat_id:
                    category = db.query(NewsCategory).filter(NewsCategory.id == cat_id).first()
                    if category:
                        additional_assoc = NewsCategoryAssociation(
                            news_id=news_id,
                            category_id=cat_id,
                            is_primary=False
                        )
                        db.add(additional_assoc)
    
    news_item.updated_at = datetime.utcnow()
    db.commit()
    
    # Reload with associations
    news_item = db.query(News).options(
        joinedload(News.category_associations).joinedload(NewsCategoryAssociation.category)
    ).filter(News.id == news_id).first()
    
    _populate_news_categories(news_item)
    return news_item

@router.patch("/{news_id}/publish", response_model=news_schemas.News)
def publish_news(
    news_id: int,
    publish_data: news_schemas.NewsPublish,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Publish or unpublish a news item (admin only)"""
    news_item = db.query(News).options(
        joinedload(News.category_associations).joinedload(NewsCategoryAssociation.category)
    ).filter(News.id == news_id).first()
    
    if not news_item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    news_item.is_published = publish_data.is_published
    
    if publish_data.is_published:
        news_item.published_at = publish_data.published_at or datetime.utcnow()
    else:
        news_item.published_at = None
    
    news_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(news_item)
    
    _populate_news_categories(news_item)
    return news_item

@router.delete("/{news_id}")
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a news item (admin only)"""
    news_item = db.query(News).filter(News.id == news_id).first()
    if not news_item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    db.delete(news_item)
    db.commit()
    
    return {"message": "News item deleted successfully"}

@router.get("/admin/all", response_model=news_schemas.NewsResponse)
def get_all_news_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    categories: Optional[List[str]] = Query(None),  # Support multiple categories filter
    status: Optional[str] = Query(None),  # "published", "draft", "all"
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all news articles for admin (including drafts)"""
    query = db.query(News).options(
        joinedload(News.category_associations).joinedload(NewsCategoryAssociation.category)
    )
    
    if status == "published":
        query = query.filter(News.is_published == True)
    elif status == "draft":
        query = query.filter(News.is_published == False)
    # "all" or None shows everything
    
    # Support both single category (backward compatibility) and multiple categories
    if category or categories:
        category_filters = []
        
        # Single category filter (backward compatibility)
        if category:
            category_filters.append(News.category == category)
            
        # Multiple categories filter
        if categories:
            subquery = db.query(NewsCategoryAssociation.news_id).join(NewsCategory).filter(
                NewsCategory.name.in_(categories)
            ).subquery()
            category_filters.append(News.id.in_(subquery))
            
        if category_filters:
            query = query.filter(or_(*category_filters))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                News.title.ilike(search_term),
                News.summary.ilike(search_term),
                News.content.ilike(search_term),
                News.tags.ilike(search_term)
            )
        )

    total = query.count()
    news_items = query.order_by(desc(News.created_at)).offset(skip).limit(limit).all()
    
    # Populate categories for each news item
    for news_item in news_items:
        _populate_news_categories(news_item)
    
    return news_schemas.NewsResponse(
        news=news_items,
        total=total,
        page=skip // limit + 1,
        size=limit
    )

# New endpoints for managing category associations

@router.post("/{news_id}/categories", response_model=dict)
def add_news_category(
    news_id: int,
    association_data: news_schemas.NewsCategoryAssociationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Add a category to a news item (admin only)"""
    # Verify news exists
    news_item = db.query(News).filter(News.id == news_id).first()
    if not news_item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    # Verify category exists
    category = db.query(NewsCategory).filter(NewsCategory.id == association_data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if association already exists
    existing = db.query(NewsCategoryAssociation).filter(
        NewsCategoryAssociation.news_id == news_id,
        NewsCategoryAssociation.category_id == association_data.category_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="News item already belongs to this category")
    
    # If setting as primary, remove primary flag from other associations
    if association_data.is_primary:
        db.query(NewsCategoryAssociation).filter(
            NewsCategoryAssociation.news_id == news_id,
            NewsCategoryAssociation.is_primary == True
        ).update({"is_primary": False})
        
        # Update the main category field for backward compatibility
        news_item.category = category.name
    
    # Create association
    association = NewsCategoryAssociation(
        news_id=news_id,
        category_id=association_data.category_id,
        is_primary=association_data.is_primary
    )
    
    db.add(association)
    db.commit()
    
    return {"message": "Category added to news item successfully"}

@router.delete("/{news_id}/categories/{category_id}")
def remove_news_category(
    news_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Remove a category from a news item (admin only)"""
    association = db.query(NewsCategoryAssociation).filter(
        NewsCategoryAssociation.news_id == news_id,
        NewsCategoryAssociation.category_id == category_id
    ).first()
    
    if not association:
        raise HTTPException(status_code=404, detail="Association not found")
    
    # Don't allow removing the primary category if it's the only one
    if association.is_primary:
        other_associations = db.query(NewsCategoryAssociation).filter(
            NewsCategoryAssociation.news_id == news_id,
            NewsCategoryAssociation.id != association.id
        ).count()
        
        if other_associations == 0:
            raise HTTPException(status_code=400, detail="Cannot remove the only category from a news item")
        
        # If removing primary, make another category primary
        if other_associations > 0:
            next_primary = db.query(NewsCategoryAssociation).filter(
                NewsCategoryAssociation.news_id == news_id,
                NewsCategoryAssociation.id != association.id
            ).first()
            
            if next_primary:
                next_primary.is_primary = True
                # Update the main category field for backward compatibility
                news_item = db.query(News).filter(News.id == news_id).first()
                news_item.category = next_primary.category.name
    
    db.delete(association)
    db.commit()
    
    return {"message": "Category removed from news item successfully"} 