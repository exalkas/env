from typing import Optional
from datetime import datetime
from pydantic import BaseModel, validator


class NewsCategoryBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None


class NewsCategoryCreate(NewsCategoryBase):
    is_active: bool = True

    @validator('name')
    def name_must_be_uppercase(cls, v):
        return v.upper()


class NewsCategoryUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('name')
    def name_must_be_uppercase(cls, v):
        if v is not None:
            return v.upper()
        return v


class NewsCategory(NewsCategoryBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class NewsCategoryResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 