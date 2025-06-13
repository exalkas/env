from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class NewsCategoryInfo(BaseModel):
    id: int
    name: str
    display_name: str
    is_primary: bool = False

class NewsBase(BaseModel):
    title: str
    summary: Optional[str] = None
    content: str
    category: str  # Primary category (backward compatibility)
    tags: Optional[str] = None
    author: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: bool = False
    is_published: bool = False
    scheduled_publish_at: Optional[datetime] = None

class NewsCreate(NewsBase):
    additional_category_ids: Optional[List[int]] = []  # Additional categories beyond primary

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None  # Primary category
    additional_category_ids: Optional[List[int]] = None  # Additional categories
    tags: Optional[str] = None
    author: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    scheduled_publish_at: Optional[datetime] = None

class News(NewsBase):
    id: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    scheduled_publish_at: Optional[datetime] = None
    categories: List[NewsCategoryInfo] = []  # All categories (primary + additional)

    class Config:
        from_attributes = True

class NewsResponse(BaseModel):
    news: List[News]
    total: int
    page: int
    size: int

class NewsPublish(BaseModel):
    is_published: bool
    published_at: Optional[datetime] = None

class NewsCategoryAssociationCreate(BaseModel):
    news_id: int
    category_id: int
    is_primary: bool = False

class NewsCategoryAssociationUpdate(BaseModel):
    is_primary: Optional[bool] = None 