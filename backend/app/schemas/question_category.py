from typing import Optional
from datetime import datetime
from pydantic import BaseModel, validator


class QuestionCategoryBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    color: Optional[str] = None


class QuestionCategoryCreate(QuestionCategoryBase):
    is_active: bool = True

    @validator('name')
    def name_must_be_uppercase(cls, v):
        return v.upper()


class QuestionCategoryUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('name')
    def name_must_be_uppercase(cls, v):
        if v is not None:
            return v.upper()
        return v


class QuestionCategory(QuestionCategoryBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class QuestionCategoryResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 