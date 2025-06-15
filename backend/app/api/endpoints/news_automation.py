from typing import List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user, get_db
from app.models.news import News
from app.models.news_category import NewsCategory
from app.models.news_category_association import NewsCategoryAssociation
from app.models.user import User
from app.schemas import news_automation as automation_schemas
from app.schemas import prompt_template as prompt_schemas
from app.services.openai_service import openai_service
from app.models.prompt_template import PromptTemplate

router = APIRouter()

@router.post("/generate-news", response_model=automation_schemas.NewsGenerationResponse)
async def generate_news(
    request: automation_schemas.NewsGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Generate news articles and daily analysis using ChatGPT and save them to database"""
    try:
        # Generate news and analysis using OpenAI service
        generated_items, daily_analysis = openai_service.generate_news_and_analysis(
            start_date=request.start_date,
            end_date=request.end_date,
            custom_prompt=request.custom_prompt,
            db=db
        )
        
        created_news_ids = []
        generated_news = []
        errors = []
        analysis_news_id = None
        
        # Save each generated news item to database
        for item in generated_items:
            try:
                # Create news item (no author field)
                news_item = News(
                    title=item.title,
                    summary=item.summary,
                    content=item.content,
                    category=item.category,
                    tags=item.tags,
                    author="",  # Empty as requested
                    is_featured=False,
                    is_published=False,  # Save as draft for review
                    created_by=current_user.id
                )
                
                db.add(news_item)
                db.flush()  # Get the ID
                
                # Add category association
                category = db.query(NewsCategory).filter(NewsCategory.name == item.category).first()
                if category:
                    category_assoc = NewsCategoryAssociation(
                        news_id=news_item.id,
                        category_id=category.id,
                        is_primary=True
                    )
                    db.add(category_assoc)
                
                db.commit()
                created_news_ids.append(news_item.id)
                
                # Add to response
                generated_news.append(automation_schemas.GeneratedNewsItem(
                    title=item.title,
                    summary=item.summary,
                    content=item.content,
                    tags=item.tags,
                    category=item.category
                ))
                
            except Exception as e:
                errors.append(f"Failed to save news item '{item.title}': {str(e)}")
                db.rollback()
                continue
        
        # Save daily analysis if generated (saved last to be the most recent)
        if daily_analysis:
            try:
                # Add a small delay to ensure this is the latest timestamp
                import time
                time.sleep(0.1)
                
                analysis_news = News(
                    title=daily_analysis.title,
                    summary=daily_analysis.summary,
                    content=daily_analysis.content,
                    category="DAILY_ANALYSIS",
                    tags="daily analysis, ai generated, market report",
                    author="",  # Empty as requested
                    is_featured=True,  # Feature analysis articles
                    is_published=False,  # Save as draft for review
                    created_by=current_user.id
                )
                
                db.add(analysis_news)
                db.flush()
                
                # Add category association
                daily_analysis_category = db.query(NewsCategory).filter(NewsCategory.name == "DAILY_ANALYSIS").first()
                if daily_analysis_category:
                    category_assoc = NewsCategoryAssociation(
                        news_id=analysis_news.id,
                        category_id=daily_analysis_category.id,
                        is_primary=True
                    )
                    db.add(category_assoc)
                
                db.commit()
                analysis_news_id = analysis_news.id
                
            except Exception as e:
                errors.append(f"Failed to save daily analysis: {str(e)}")
        
        success_message = f"Generated {len(created_news_ids)} news articles"
        if analysis_news_id:
            success_message += " and daily analysis"
        success_message += " successfully"
        
        return automation_schemas.NewsGenerationResponse(
            success=len(created_news_ids) > 0 or analysis_news_id is not None,
            message=success_message,
            generated_news=generated_news,
            created_news_ids=created_news_ids,
            analysis_news_id=analysis_news_id,
            errors=errors
        )
        
    except Exception as e:
        return automation_schemas.NewsGenerationResponse(
            success=False,
            message=f"Failed to generate news: {str(e)}",
            errors=[str(e)]
        )

# Note: Analysis generation is now combined with news generation for efficiency

@router.get("/prompt-templates", response_model=prompt_schemas.PromptTemplateListResponse)
async def get_prompt_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get available prompt templates"""
    templates = db.query(PromptTemplate).filter(PromptTemplate.is_active == True).all()
    return prompt_schemas.PromptTemplateListResponse(templates=templates)

@router.post("/save-prompt", response_model=prompt_schemas.SavePromptResponse)
async def save_prompt_template(
    request: prompt_schemas.SavePromptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Save or update a custom prompt template"""
    try:
        # Check if user already has a prompt of this type
        existing_prompt = db.query(PromptTemplate).filter(
            PromptTemplate.created_by == current_user.id,
            PromptTemplate.type == request.type,
            PromptTemplate.name == request.name
        ).first()
        
        if existing_prompt:
            # Update existing prompt
            existing_prompt.template = request.template
            existing_prompt.description = request.description
            db.commit()
            template_id = existing_prompt.id
            message = "Prompt template updated successfully"
        else:
            # Create new prompt
            new_prompt = PromptTemplate(
                name=request.name,
                type=request.type,
                template=request.template,
                description=request.description,
                is_default=False,
                is_active=True,
                created_by=current_user.id
            )
            db.add(new_prompt)
            db.commit()
            template_id = new_prompt.id
            message = "Prompt template saved successfully"
        
        return prompt_schemas.SavePromptResponse(
            success=True,
            message=message,
            template_id=template_id
        )
        
    except Exception as e:
        return prompt_schemas.SavePromptResponse(
            success=False,
            message=f"Failed to save prompt template: {str(e)}"
        )

@router.get("/recent-news", response_model=List[dict])
async def get_recent_news_for_analysis(
    days: int = 7,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get recent news items for analysis selection"""
    # Get news from the last N days
    from datetime import timedelta
    cutoff_date = datetime.utcnow().date() - timedelta(days=days)
    
    news_items = db.query(News).filter(
        News.created_at >= cutoff_date,
        News.is_published == True  # Only published news for analysis
    ).order_by(News.created_at.desc()).limit(limit).all()
    
    return [
        {
            'id': news.id,
            'title': news.title,
            'summary': news.summary or '',
            'category': news.category,
            'tags': news.tags or '',
            'created_at': news.created_at.isoformat(),
            'is_featured': news.is_featured
        }
        for news in news_items
    ] 