from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api.deps import get_db, get_current_admin_user
from app.models.user import User
from app.models.interactive_content import InteractiveLessonType, InteractiveScenario, InteractiveQuestion
from app.models.education import Lesson
from app.schemas.interactive_content import (
    InteractiveLessonType as InteractiveLessonTypeSchema,
    InteractiveLessonTypeCreate,
    InteractiveLessonTypeUpdate,
    InteractiveLessonTypesResponse,
    InteractiveScenario as InteractiveScenarioSchema,
    InteractiveScenarioCreate,
    InteractiveScenarioUpdate,
    InteractiveScenariosResponse,
    InteractiveQuestion as InteractiveQuestionSchema,
    InteractiveQuestionCreate,
    InteractiveQuestionUpdate,
    InteractiveContentBuilder,
    InteractiveContentSummary,
    LessonWithInteractiveContent
)

router = APIRouter()

# Interactive Lesson Types endpoints
@router.get("/types", response_model=InteractiveLessonTypesResponse)
def get_interactive_lesson_types(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all interactive lesson types"""
    query = db.query(InteractiveLessonType)
    
    if active_only:
        query = query.filter(InteractiveLessonType.is_active == True)
    
    types = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return InteractiveLessonTypesResponse(types=types, total=total)

@router.post("/types", response_model=InteractiveLessonTypeSchema)
def create_interactive_lesson_type(
    lesson_type: InteractiveLessonTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new interactive lesson type"""
    # Check if type_key already exists
    existing = db.query(InteractiveLessonType).filter(
        InteractiveLessonType.type_key == lesson_type.type_key
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Interactive lesson type with key '{lesson_type.type_key}' already exists"
        )
    
    db_lesson_type = InteractiveLessonType(**lesson_type.dict())
    db.add(db_lesson_type)
    db.commit()
    db.refresh(db_lesson_type)
    
    return db_lesson_type

@router.put("/types/{type_id}", response_model=InteractiveLessonTypeSchema)
def update_interactive_lesson_type(
    type_id: int,
    lesson_type_update: InteractiveLessonTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update an interactive lesson type"""
    db_lesson_type = db.query(InteractiveLessonType).filter(
        InteractiveLessonType.id == type_id
    ).first()
    
    if not db_lesson_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interactive lesson type not found"
        )
    
    update_data = lesson_type_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_lesson_type, field, value)
    
    db.commit()
    db.refresh(db_lesson_type)
    
    return db_lesson_type

# Interactive Scenarios endpoints
@router.get("/scenarios", response_model=InteractiveScenariosResponse)
def get_interactive_scenarios(
    lesson_id: Optional[int] = None,
    type_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get interactive scenarios with optional filtering"""
    query = db.query(InteractiveScenario)
    
    if lesson_id:
        query = query.filter(InteractiveScenario.lesson_id == lesson_id)
    if type_id:
        query = query.filter(InteractiveScenario.type_id == type_id)
    
    scenarios = query.offset(skip).limit(limit).all()
    total = query.count()
    
    # Calculate summary statistics
    total_questions = sum(len(scenario.questions) for scenario in scenarios)
    total_points = sum(scenario.points_possible for scenario in scenarios)
    
    summary = InteractiveContentSummary(
        total_scenarios=len(scenarios),
        total_questions=total_questions,
        total_points=total_points,
        completion_time_estimate=max(10, len(scenarios) * 5),  # Rough estimate
        difficulty_level="Intermediate"  # Could be calculated based on content
    )
    
    return InteractiveScenariosResponse(
        scenarios=scenarios,
        total=total,
        summary=summary
    )

@router.post("/scenarios", response_model=InteractiveScenarioSchema)
def create_interactive_scenario(
    scenario: InteractiveScenarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new interactive scenario"""
    # Verify lesson exists
    lesson = db.query(Lesson).filter(Lesson.id == scenario.lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Verify lesson type exists
    lesson_type = db.query(InteractiveLessonType).filter(
        InteractiveLessonType.id == scenario.type_id
    ).first()
    if not lesson_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interactive lesson type not found"
        )
    
    # Create scenario
    scenario_data = scenario.dict(exclude={'questions'})
    db_scenario = InteractiveScenario(**scenario_data)
    db.add(db_scenario)
    db.flush()  # Get the scenario ID
    
    # Create associated questions
    for question_data in scenario.questions:
        question_data.scenario_id = db_scenario.id
        db_question = InteractiveQuestion(**question_data.dict())
        db.add(db_question)
    
    db.commit()
    db.refresh(db_scenario)
    
    return db_scenario

@router.put("/scenarios/{scenario_id}", response_model=InteractiveScenarioSchema)
def update_interactive_scenario(
    scenario_id: int,
    scenario_update: InteractiveScenarioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update an interactive scenario"""
    db_scenario = db.query(InteractiveScenario).filter(
        InteractiveScenario.id == scenario_id
    ).first()
    
    if not db_scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interactive scenario not found"
        )
    
    update_data = scenario_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_scenario, field, value)
    
    db.commit()
    db.refresh(db_scenario)
    
    return db_scenario

@router.delete("/scenarios/{scenario_id}")
def delete_interactive_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete an interactive scenario"""
    db_scenario = db.query(InteractiveScenario).filter(
        InteractiveScenario.id == scenario_id
    ).first()
    
    if not db_scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interactive scenario not found"
        )
    
    db.delete(db_scenario)
    db.commit()
    
    return {"message": "Interactive scenario deleted successfully"}

# Bulk operations
@router.post("/lessons/{lesson_id}/interactive-content")
def build_interactive_lesson(
    lesson_id: int,
    content_builder: InteractiveContentBuilder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Build complete interactive content for a lesson"""
    # Verify lesson exists
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get interactive lesson type
    lesson_type = db.query(InteractiveLessonType).filter(
        InteractiveLessonType.type_key == content_builder.interactive_type_key
    ).first()
    if not lesson_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interactive lesson type not found"
        )
    
    # Mark lesson as interactive
    lesson.is_interactive = True
    lesson.lesson_type = "interactive"
    
    # Create scenarios
    created_scenarios = []
    for scenario_data in content_builder.scenarios:
        scenario_data.lesson_id = lesson_id
        scenario_data.type_id = lesson_type.id
        
        scenario_dict = scenario_data.dict(exclude={'questions'})
        db_scenario = InteractiveScenario(**scenario_dict)
        db.add(db_scenario)
        db.flush()
        
        # Create questions for this scenario
        for question_data in scenario_data.questions:
            question_data.scenario_id = db_scenario.id
            db_question = InteractiveQuestion(**question_data.dict())
            db.add(db_question)
        
        created_scenarios.append(db_scenario)
    
    db.commit()
    
    return {
        "message": "Interactive lesson built successfully",
        "lesson_id": lesson_id,
        "scenarios_created": len(created_scenarios),
        "interactive_type": content_builder.interactive_type_key
    }

@router.get("/lessons/{lesson_id}/interactive-content", response_model=LessonWithInteractiveContent)
def get_lesson_interactive_content(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get lesson with all interactive content"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get scenarios with related data
    scenarios = db.query(InteractiveScenario).filter(
        InteractiveScenario.lesson_id == lesson_id
    ).all()
    
    return LessonWithInteractiveContent(
        id=lesson.id,
        title=lesson.title,
        content=lesson.content,
        lesson_type=lesson.lesson_type,
        is_interactive=lesson.is_interactive,
        interactive_scenarios=scenarios
    ) 