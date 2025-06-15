from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PromptTemplateBase(BaseModel):
    name: str
    template: str
    description: Optional[str] = None
    is_active: bool = True

class PromptTemplateCreate(PromptTemplateBase):
    pass

class PromptTemplateUpdate(BaseModel):
    name: Optional[str] = None
    template: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PromptTemplate(PromptTemplateBase):
    id: int
    is_default: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PromptTemplateListResponse(BaseModel):
    templates: list[PromptTemplate]

class SavePromptRequest(BaseModel):
    name: str
    template: str
    description: Optional[str] = None

class SavePromptResponse(BaseModel):
    success: bool
    message: str
    template_id: Optional[int] = None 