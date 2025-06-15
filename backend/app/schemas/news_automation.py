from typing import Optional, List
from datetime import date
from pydantic import BaseModel

class NewsGenerationRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    custom_prompt: Optional[str] = None

class DailyAnalysisRequest(BaseModel):
    analysis_date: Optional[date] = None
    news_ids: List[int]  # IDs of news items to include in analysis
    custom_prompt: Optional[str] = None

class GeneratedNewsItem(BaseModel):
    title: str
    summary: str
    content: str
    tags: str
    category: str

class NewsGenerationResponse(BaseModel):
    success: bool
    message: str
    generated_news: List[GeneratedNewsItem] = []
    created_news_ids: List[int] = []
    analysis_news_id: Optional[int] = None
    errors: List[str] = []

class DailyAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis: Optional[dict] = None
    analysis_news_id: Optional[int] = None
    errors: List[str] = []

class PromptTemplate(BaseModel):
    type: str  # "news_generation" or "daily_analysis"
    template: str
    description: Optional[str] = None

class PromptTemplateResponse(BaseModel):
    templates: List[PromptTemplate] 