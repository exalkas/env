# Education API endpoints
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc, asc
from datetime import datetime, timedelta

from app.api import deps
from app.models.education import (
    LearningPath, Module, Lesson, GlossaryTerm, Assessment, 
    UserProgress, UserAssessmentAttempt, Certificate, Achievement,
    Question, QuestionOption, AssessmentQuestion, UserQuestionResponse
)
from app.models.user import User
from app.schemas.education import (
    LearningPath as LearningPathSchema,
    LearningPathCreate, LearningPathUpdate, LearningPathWithModules,
    Module as ModuleSchema, ModuleCreate, ModuleCreateNested, ModuleUpdate, ModuleWithLessons,
    Lesson as LessonSchema, LessonAdminSchema, LessonCreate, LessonCreateNested, LessonUpdate,
    GlossaryTerm as GlossaryTermSchema, GlossaryTermCreate, GlossaryTermUpdate,
    Assessment as AssessmentSchema, AssessmentCreate, AssessmentUpdate,
    Question as QuestionSchema, QuestionCreate, QuestionUpdate,
    QuestionOption as QuestionOptionSchema,
    AssessmentQuestion as AssessmentQuestionSchema, AssessmentQuestionCreate,
    UserAssessmentAttempt as UserAssessmentAttemptSchema,
    UserQuestionResponse as UserQuestionResponseSchema,
    UserAssessmentAttemptCreate, UserAssessmentAttemptSubmit,
    QuestionBank, AssessmentTaking, AssessmentResults, AssessmentStats,
    EducationOverviewStats, QuestionType, QuestionDifficulty,
    UserProgressDetail, UserStats,
    CertificateSchema, Achievement as AchievementSchema
)
from app.models.user import User

router = APIRouter()

# Question Bank Management Endpoints
@router.get("/questions/", response_model=QuestionBank)
def get_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    question_type: Optional[QuestionType] = None,
    difficulty: Optional[QuestionDifficulty] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    sort_by: str = Query("created_at", description="Sort by: title, created_at, difficulty_level, points"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get questions from the question bank with filtering and pagination"""
    query = db.query(Question).options(joinedload(Question.options))
    
    # Apply filters
    if question_type:
        query = query.filter(Question.question_type == question_type.value)
    
    if difficulty:
        query = query.filter(Question.difficulty_level == difficulty.value)
    
    if category:
        query = query.filter(Question.category.ilike(f"%{category}%"))
    
    if is_active is not None:
        query = query.filter(Question.is_active == is_active)
    
    if search:
        search_filter = or_(
            Question.title.ilike(f"%{search}%"),
            Question.question_text.ilike(f"%{search}%"),
            Question.explanation.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        query = query.filter(Question.tags.overlap(tag_list))
    
    # Apply sorting
    if sort_by == "title":
        sort_column = Question.title
    elif sort_by == "difficulty_level":
        sort_column = Question.difficulty_level
    elif sort_by == "points":
        sort_column = Question.points
    else:
        sort_column = Question.created_at
    
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    questions = query.offset(skip).limit(limit).all()
    
    return QuestionBank(
        questions=questions,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )

@router.get("/questions/{question_id}", response_model=QuestionSchema)
def get_question(
    question_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get a specific question by ID"""
    question = db.query(Question).options(joinedload(Question.options)).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.post("/questions/", response_model=QuestionSchema)
def create_question(
    question: QuestionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new question in the question bank"""
    try:
        # Create the question
        question_data = question.dict(exclude={'options'})
        question_data['created_by'] = current_user.id
        db_question = Question(**question_data)
        db.add(db_question)
        db.flush()  # Get the question ID
        
        # Create options if provided
        if question.options:
            for option_data in question.options:
                option = QuestionOption(
                    question_id=db_question.id,
                    **option_data.dict()
                )
                db.add(option)
        
        db.commit()
        db.refresh(db_question)
        return db_question
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/questions/{question_id}", response_model=QuestionSchema)
def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update a question in the question bank"""
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    try:
        # Update question fields
        update_data = question_update.dict(exclude_unset=True, exclude={'options'})
        for field, value in update_data.items():
            setattr(db_question, field, value)
        
        # Update options if provided
        if question_update.options is not None:
            # Delete existing options
            db.query(QuestionOption).filter(QuestionOption.question_id == question_id).delete()
            
            # Create new options
            for option_data in question_update.options:
                option = QuestionOption(
                    question_id=question_id,
                    **option_data.dict()
                )
                db.add(option)
        
        db.commit()
        db.refresh(db_question)
        return db_question
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete a question from the question bank"""
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if question is used in any assessments
    assessment_count = db.query(AssessmentQuestion).filter(AssessmentQuestion.question_id == question_id).count()
    if assessment_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete question: it is used in {assessment_count} assessment(s)"
        )
    
    db.delete(db_question)
    db.commit()
    return {"message": "Question deleted successfully"}

# Assessment Management Endpoints
@router.get("/assessments/", response_model=List[AssessmentSchema])
def get_assessments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = None,
    learning_path_id: Optional[int] = None,
    lesson_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get assessments with filtering and pagination"""
    query = db.query(Assessment)
    
    # Apply filters
    if is_active is not None:
        query = query.filter(Assessment.is_active == is_active)
    
    if learning_path_id:
        query = query.filter(Assessment.learning_path_id == learning_path_id)
    
    if lesson_id:
        query = query.filter(Assessment.lesson_id == lesson_id)
    
    if search:
        search_filter = or_(
            Assessment.title.ilike(f"%{search}%"),
            Assessment.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Apply pagination
    assessments = query.order_by(desc(Assessment.created_at)).offset(skip).limit(limit).all()
    return assessments

@router.get("/assessments/stats")
def get_assessments_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get assessment statistics"""
    total_assessments = db.query(Assessment).count()
    active_assessments = db.query(Assessment).filter(Assessment.is_active == True).count()
    total_attempts = db.query(UserAssessmentAttempt).count()
    
    # Get assessment distribution by learning path
    assessment_by_path = db.query(
        LearningPath.title,
        func.count(Assessment.id).label('count')
    ).join(Assessment, Assessment.learning_path_id == LearningPath.id, isouter=True)\
     .group_by(LearningPath.id, LearningPath.title).all()
    
    return {
        "total_assessments": total_assessments,
        "active_assessments": active_assessments,
        "inactive_assessments": total_assessments - active_assessments,
        "total_attempts": total_attempts,
        "assessment_distribution": [{"path": row[0], "count": row[1]} for row in assessment_by_path],
        "average_score": 0.0  # Would need more complex calculation
    }

@router.get("/assessments/{assessment_id}", response_model=AssessmentSchema)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get a specific assessment by ID"""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.post("/assessments/", response_model=AssessmentSchema)
def create_assessment(
    assessment: AssessmentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new assessment"""
    assessment_data = assessment.dict()
    question_ids = assessment_data.pop('question_ids', None)
    
    db_assessment = Assessment(**assessment_data)
    db.add(db_assessment)
    db.flush()  # Get the assessment ID
    
    # Add questions to assessment if question_ids provided
    if question_ids:
        total_points = 0
        for index, question_id in enumerate(question_ids):
            # Verify question exists
            question = db.query(Question).filter(Question.id == question_id).first()
            if not question:
                raise HTTPException(status_code=400, detail=f"Question with ID {question_id} not found")
            
            # Create assessment question
            assessment_question = AssessmentQuestion(
                assessment_id=db_assessment.id,
                question_id=question_id,
                sort_order=index + 1,
                points=question.points  # Use question's default points
            )
            db.add(assessment_question)
            total_points += question.points
        
        # Update assessment total points
        db_assessment.total_points = total_points
    
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

@router.put("/assessments/{assessment_id}", response_model=AssessmentSchema)
def update_assessment(
    assessment_id: int,
    assessment_update: AssessmentUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update an assessment"""
    db_assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not db_assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    update_data = assessment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assessment, field, value)
    
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

@router.delete("/assessments/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete an assessment"""
    db_assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not db_assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    db.delete(db_assessment)
    db.commit()
    return {"message": "Assessment deleted successfully"}

# Assessment Question Management
@router.get("/assessments/{assessment_id}/questions", response_model=List[AssessmentQuestionSchema])
def get_assessment_questions(
    assessment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get all questions for a specific assessment"""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    assessment_questions = (
        db.query(AssessmentQuestion)
        .options(joinedload(AssessmentQuestion.question).joinedload(Question.options))
        .filter(AssessmentQuestion.assessment_id == assessment_id)
        .order_by(AssessmentQuestion.sort_order)
        .all()
    )
    
    return assessment_questions

@router.post("/assessments/{assessment_id}/questions", response_model=AssessmentQuestionSchema)
def add_question_to_assessment(
    assessment_id: int,
    assessment_question: AssessmentQuestionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Add a question to an assessment"""
    # Verify assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Verify question exists
    question = db.query(Question).filter(Question.id == assessment_question.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if question is already in assessment
    existing = db.query(AssessmentQuestion).filter(
        and_(
            AssessmentQuestion.assessment_id == assessment_id,
            AssessmentQuestion.question_id == assessment_question.question_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Question already exists in this assessment")
    
    # Create assessment question
    db_assessment_question = AssessmentQuestion(
        assessment_id=assessment_id,
        **assessment_question.dict()
    )
    db.add(db_assessment_question)
    
    # Update assessment total points
    total_points = (
        db.query(func.sum(AssessmentQuestion.points))
        .filter(AssessmentQuestion.assessment_id == assessment_id)
        .scalar() or 0
    ) + assessment_question.points
    
    assessment.total_points = total_points
    
    db.commit()
    db.refresh(db_assessment_question)
    return db_assessment_question

@router.put("/assessments/{assessment_id}/questions/{question_id}")
def update_assessment_question(
    assessment_id: int,
    question_id: int,
    sort_order: Optional[int] = None,
    points: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update question settings within an assessment"""
    assessment_question = db.query(AssessmentQuestion).filter(
        and_(
            AssessmentQuestion.assessment_id == assessment_id,
            AssessmentQuestion.question_id == question_id
        )
    ).first()
    
    if not assessment_question:
        raise HTTPException(status_code=404, detail="Question not found in this assessment")
    
    if sort_order is not None:
        assessment_question.sort_order = sort_order
    if points is not None:
        assessment_question.points = points
    
    # Recalculate total points
    total_points = (
        db.query(func.sum(AssessmentQuestion.points))
        .filter(AssessmentQuestion.assessment_id == assessment_id)
        .scalar() or 0
    )
    
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    assessment.total_points = total_points
    
    db.commit()
    return {"message": "Assessment question updated successfully"}

@router.delete("/assessments/{assessment_id}/questions/{question_id}")
def remove_question_from_assessment(
    assessment_id: int,
    question_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Remove a question from an assessment"""
    assessment_question = db.query(AssessmentQuestion).filter(
        and_(
            AssessmentQuestion.assessment_id == assessment_id,
            AssessmentQuestion.question_id == question_id
        )
    ).first()
    
    if not assessment_question:
        raise HTTPException(status_code=404, detail="Question not found in this assessment")
    
    db.delete(assessment_question)
    
    # Recalculate total points
    total_points = (
        db.query(func.sum(AssessmentQuestion.points))
        .filter(AssessmentQuestion.assessment_id == assessment_id)
        .scalar() or 0
    )
    
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    assessment.total_points = total_points
    
    db.commit()
    return {"message": "Question removed from assessment successfully"}

# Assessment Taking Endpoints
@router.get("/assessments/{assessment_id}/take", response_model=AssessmentTaking)
def start_assessment_attempt(
    assessment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Start a new assessment attempt"""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    if not assessment.is_active:
        raise HTTPException(status_code=400, detail="Assessment is not active")
    
    # Check if user has reached max attempts
    attempt_count = db.query(UserAssessmentAttempt).filter(
        and_(
            UserAssessmentAttempt.user_id == current_user.id,
            UserAssessmentAttempt.assessment_id == assessment_id
        )
    ).count()
    
    if attempt_count >= assessment.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts reached")
    
    # Get assessment questions
    assessment_questions = (
        db.query(AssessmentQuestion)
        .options(joinedload(AssessmentQuestion.question).joinedload(Question.options))
        .filter(AssessmentQuestion.assessment_id == assessment_id)
        .order_by(AssessmentQuestion.sort_order)
        .all()
    )
    
    questions = [aq.question for aq in assessment_questions]
    
    # Randomize questions if enabled
    if assessment.randomize_questions:
        import random
        questions = random.sample(questions, len(questions))
    
    time_remaining = None
    if assessment.time_limit:
        time_remaining = assessment.time_limit * 60  # Convert to seconds
    
    return AssessmentTaking(
        assessment=assessment,
        questions=questions,
        time_remaining=time_remaining,
        attempt_number=attempt_count + 1
    )

@router.post("/assessments/{assessment_id}/submit", response_model=UserAssessmentAttemptSchema)
def submit_assessment_attempt(
    assessment_id: int,
    submission: UserAssessmentAttemptSubmit,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Submit an assessment attempt with answers"""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    try:
        # Create assessment attempt
        attempt_number = db.query(UserAssessmentAttempt).filter(
            and_(
                UserAssessmentAttempt.user_id == current_user.id,
                UserAssessmentAttempt.assessment_id == assessment_id
            )
        ).count() + 1
        
        attempt = UserAssessmentAttempt(
            user_id=current_user.id,
            assessment_id=assessment_id,
            attempt_number=attempt_number,
            status="completed",
            started_at=func.now(),
            completed_at=func.now()
        )
        db.add(attempt)
        db.flush()  # Get attempt ID
        
        # Process and grade responses
        total_points = 0
        earned_points = 0
        
        for response_data in submission.responses:
            question = db.query(Question).filter(Question.id == response_data.question_id).first()
            if not question:
                continue
            
            # Get question points from assessment
            assessment_question = db.query(AssessmentQuestion).filter(
                and_(
                    AssessmentQuestion.assessment_id == assessment_id,
                    AssessmentQuestion.question_id == response_data.question_id
                )
            ).first()
            
            question_points = assessment_question.points if assessment_question else question.points
            total_points += question_points
            
            # Grade the response
            points_earned, is_correct = grade_question_response(question, response_data.response_data)
            earned_points += min(points_earned, question_points)
            
            # Create response record
            response = UserQuestionResponse(
                attempt_id=attempt.id,
                question_id=response_data.question_id,
                response_data=response_data.response_data,
                points_earned=min(points_earned, question_points),
                is_correct=is_correct,
                time_spent=response_data.time_spent
            )
            db.add(response)
        
        # Calculate final score
        percentage_score = int((earned_points / total_points) * 100) if total_points > 0 else 0
        passed = percentage_score >= assessment.passing_score
        
        # Update attempt with results
        attempt.total_points = total_points
        attempt.points_earned = earned_points
        attempt.score = percentage_score
        attempt.passed = passed
        
        db.commit()
        db.refresh(attempt)
        return attempt
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def grade_question_response(question: Question, response_data: Dict[str, Any]) -> tuple[int, bool]:
    """Grade a question response and return (points_earned, is_correct)"""
    if question.question_type == "multiple_choice":
        selected_option_id = response_data.get("selected_option_id")
        if not selected_option_id:
            return 0, False
        
        correct_option = next((opt for opt in question.options if opt.is_correct), None)
        if correct_option and correct_option.id == selected_option_id:
            return question.points, True
        return 0, False
    
    elif question.question_type == "multiple_select":
        selected_option_ids = set(response_data.get("selected_option_ids", []))
        correct_option_ids = set(opt.id for opt in question.options if opt.is_correct)
        
        if selected_option_ids == correct_option_ids:
            return question.points, True
        return 0, False
    
    elif question.question_type == "true_false":
        user_answer = response_data.get("answer")
        if user_answer is None:
            return 0, False
        
        # Convert user answer to boolean
        if isinstance(user_answer, str):
            user_bool = user_answer.lower().strip() == "true"
        elif isinstance(user_answer, bool):
            user_bool = user_answer
        else:
            return 0, False
        
        # Get correct answer from options (if any) or default logic
        if question.options and len(question.options) > 0:
            # Use the option text as the correct answer
            correct_answer_text = question.options[0].option_text.lower().strip()
            correct_bool = correct_answer_text == "true"
        else:
            # For backwards compatibility with questions without options,
            # assume True is correct (this is a fallback)
            correct_bool = True
        
        is_correct = user_bool == correct_bool
        return question.points if is_correct else 0, is_correct
    
    elif question.question_type == "fill_in_blank":
        user_answer = response_data.get("answer", "").strip().lower()
        # This would need more sophisticated matching logic
        # For now, basic exact match
        return question.points, True  # Placeholder logic
    
    elif question.question_type == "numeric":
        user_answer = response_data.get("answer")
        try:
            user_value = float(user_answer)
            # Would need to store correct answer and tolerance
            return question.points, True  # Placeholder logic
        except (ValueError, TypeError):
            return 0, False
    
    elif question.question_type == "essay":
        # Essays require manual grading
        return 0, None  # None means requires manual review
    
    # Default case
    return 0, False

@router.get("/attempts/{attempt_id}/results", response_model=AssessmentResults)
def get_assessment_results(
    attempt_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get detailed results for an assessment attempt"""
    attempt = db.query(UserAssessmentAttempt).filter(
        and_(
            UserAssessmentAttempt.id == attempt_id,
            UserAssessmentAttempt.user_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Assessment attempt not found")
    
    # Get responses with questions
    responses = (
        db.query(UserQuestionResponse)
        .options(joinedload(UserQuestionResponse.question).joinedload(Question.options))
        .filter(UserQuestionResponse.attempt_id == attempt_id)
        .all()
    )
    
    questions = [r.question for r in responses]
    
    # Build detailed results
    detailed_results = []
    for response in responses:
        question = response.question
        result = {
            "question_id": question.id,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "user_response": response.response_data,
            "points_earned": response.points_earned,
            "max_points": question.points,
            "is_correct": response.is_correct,
            "explanation": question.explanation
        }
        
        if question.question_type in ["multiple_choice", "multiple_select"]:
            result["options"] = [
                {
                    "id": opt.id,
                    "text": opt.option_text,
                    "is_correct": opt.is_correct,
                    "explanation": opt.explanation
                }
                for opt in question.options
            ]
        
        detailed_results.append(result)
    
    return AssessmentResults(
        attempt=attempt,
        questions=questions,
        responses=responses,
        detailed_results=detailed_results
    )

# Learning Paths endpoints
@router.get("/learning-paths/", response_model=List[LearningPathSchema])
def read_learning_paths(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    difficulty_level: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional)
):
    """Get all learning paths with optional filtering"""
    query = db.query(LearningPath).options(
        joinedload(LearningPath.modules).joinedload(Module.lessons)
    )
    if is_active is not None:
        query = query.filter(LearningPath.is_active == is_active)
    if difficulty_level:
        query = query.filter(LearningPath.level == difficulty_level)
    
    learning_paths = query.order_by(LearningPath.sort_order).offset(skip).limit(limit).all()
    
    # Enhance learning paths with additional data
    result = []
    for path in learning_paths:
        # Calculate actual duration from all lessons
        actual_duration = sum(
            lesson.estimated_duration or 0
            for module in path.modules
            for lesson in module.lessons
        )
        
        path_dict = {
            **path.__dict__,
            # Use calculated duration instead of stored one
            "estimated_duration": actual_duration,
            # Count modules
            "modules_count": len(path.modules),
            # Count enrolled users
            "enrolled_users": db.query(UserProgress).filter(UserProgress.learning_path_id == path.id).count()
        }
        
        # Add user progress if user is logged in
        if current_user:
            user_progress = db.query(UserProgress).filter(
                UserProgress.user_id == current_user.id,
                UserProgress.learning_path_id == path.id
            ).first()
            
            if user_progress:
                # Calculate progress details - only count active modules and active lessons
                active_modules = [m for m in path.modules if m.is_active]
                total_modules = len(active_modules)
                
                # Calculate completed modules - simple check: all active lessons in module completed
                completed_modules = 0
                for module in active_modules:
                    # Only consider active lessons
                    active_lessons = [l for l in module.lessons if l.is_active]
                    if not active_lessons:
                        # If module has no active lessons, consider it completed
                        completed_modules += 1
                        continue
                        
                    all_completed = True
                    for lesson in active_lessons:
                        lesson_progress = db.query(UserProgress).filter(
                            UserProgress.user_id == current_user.id,
                            UserProgress.lesson_id == lesson.id
                        ).first()
                        if not lesson_progress or lesson_progress.status != "COMPLETED":
                            all_completed = False
                            break
                            
                    if all_completed:
                        completed_modules += 1
                
                path_dict["user_progress"] = {
                    "id": user_progress.id,
                    "progress_percentage": user_progress.progress_percentage or 0,
                    "completed_modules": completed_modules,
                    "total_modules": total_modules,
                    "last_accessed": user_progress.updated_at or user_progress.created_at,
                    "is_completed": user_progress.status == "COMPLETED"
                }
        
        result.append(LearningPathSchema(**path_dict))
    
    return result

@router.get("/learning-paths/{path_id}", response_model=LearningPathWithModules)
def read_learning_path(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional)
):
    """Get a specific learning path with its modules"""
    path = db.query(LearningPath).options(
        joinedload(LearningPath.modules).joinedload(Module.lessons)
    ).filter(LearningPath.id == path_id).first()
    
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    # Calculate actual duration from all lessons
    actual_duration = sum(
        lesson.estimated_duration or 0
        for module in path.modules
        for lesson in module.lessons
    )
    
    # Enhance modules and lessons with user progress
    enhanced_modules = []
    
    # First, get all lessons in order across all modules for proper sequential logic
    all_lessons_in_order = []
    for module in sorted(path.modules, key=lambda x: x.sort_order):
        for lesson in sorted(module.lessons, key=lambda x: x.sort_order):
            all_lessons_in_order.append((module.id, lesson))
    
    for module in path.modules:
        enhanced_lessons = []
        
        for lesson in sorted(module.lessons, key=lambda x: x.sort_order):
            # Check lesson progress by current user
            lesson_completed = False
            lesson_started = False
            if current_user:
                lesson_progress = db.query(UserProgress).filter(
                    UserProgress.user_id == current_user.id,
                    UserProgress.lesson_id == lesson.id
                ).first()
                if lesson_progress:
                    lesson_completed = lesson_progress.status == "COMPLETED"
                    lesson_started = lesson_progress.status == "STARTED"
            
            # Determine if lesson is locked (sequential completion logic across ALL modules)
            is_locked = True  # Default to locked
            if current_user:
                # Find this lesson's position in the overall sequence
                lesson_global_index = next(
                    (i for i, (mod_id, les) in enumerate(all_lessons_in_order) if les.id == lesson.id), 
                    -1
                )
                
                if lesson_global_index == 0:
                    # First lesson in entire learning path is always unlocked
                    is_locked = False
                elif lesson_global_index > 0:
                    # Check if the previous lesson (globally) is completed
                    previous_lesson = all_lessons_in_order[lesson_global_index - 1][1]
                    previous_progress = db.query(UserProgress).filter(
                        UserProgress.user_id == current_user.id,
                        UserProgress.lesson_id == previous_lesson.id
                    ).first()
                    is_locked = not (previous_progress and previous_progress.status == "COMPLETED")
            
            lesson_dict = {
                **lesson.__dict__,
                "is_completed": lesson_completed,
                "is_started": lesson_started,
                "is_locked": is_locked
            }
            enhanced_lessons.append(lesson_dict)
        
        module_dict = {
            **module.__dict__,
            "lessons": enhanced_lessons
        }
        enhanced_modules.append(module_dict)
    
    # Enhance path with additional data
    path_dict = {
        **path.__dict__,
        "modules": enhanced_modules,
        # Use calculated duration instead of stored one
        "estimated_duration": actual_duration,
        # Count modules
        "modules_count": len(path.modules),
        # Count enrolled users
        "enrolled_users": db.query(UserProgress).filter(UserProgress.learning_path_id == path.id).count()
    }
    
    # Add user progress if user is logged in
    if current_user:
        user_progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.learning_path_id == path.id
        ).first()
        
        if user_progress:
            # Calculate progress details - only count active modules and active lessons
            active_modules = [m for m in path.modules if m.is_active]
            total_modules = len(active_modules)
            
            # Calculate completed modules - simple check: all active lessons in module completed
            completed_modules = 0
            for module in active_modules:
                # Only consider active lessons
                active_lessons = [l for l in module.lessons if l.is_active]
                if not active_lessons:
                    # If module has no active lessons, consider it completed
                    completed_modules += 1
                    continue
                    
                all_completed = True
                for lesson in active_lessons:
                    lesson_progress = db.query(UserProgress).filter(
                        UserProgress.user_id == current_user.id,
                        UserProgress.lesson_id == lesson.id
                    ).first()
                    if not lesson_progress or lesson_progress.status != "COMPLETED":
                        all_completed = False
                        break
                        
                if all_completed:
                    completed_modules += 1
            
            # Find current lesson (next available lesson to take)
            current_lesson_id = None
            for module_id, lesson in all_lessons_in_order:
                lesson_progress = db.query(UserProgress).filter(
                    UserProgress.user_id == current_user.id,
                    UserProgress.lesson_id == lesson.id
                ).first()
                
                # If lesson is not completed and not locked, this is the current lesson
                if not lesson_progress or lesson_progress.status != "COMPLETED":
                    # Check if this lesson is unlocked
                    lesson_global_index = next(
                        (i for i, (mod_id, les) in enumerate(all_lessons_in_order) if les.id == lesson.id), 
                        -1
                    )
                    
                    if lesson_global_index == 0:
                        # First lesson is always available
                        current_lesson_id = lesson.id
                        break
                    elif lesson_global_index > 0:
                        # Check if previous lesson is completed
                        prev_lesson = all_lessons_in_order[lesson_global_index - 1][1]
                        prev_progress = db.query(UserProgress).filter(
                            UserProgress.user_id == current_user.id,
                            UserProgress.lesson_id == prev_lesson.id
                        ).first()
                        if prev_progress and prev_progress.status == "COMPLETED":
                            current_lesson_id = lesson.id
                            break
            
            path_dict["user_progress"] = {
                "id": user_progress.id,
                "progress_percentage": user_progress.progress_percentage or 0,
                "completed_modules": completed_modules,
                "total_modules": total_modules,
                "last_accessed": user_progress.updated_at or user_progress.created_at,
                "is_completed": user_progress.status == "COMPLETED",
                "current_lesson_id": current_lesson_id
            }
    
    return LearningPathWithModules(**path_dict)

@router.get("/learning-paths/{path_id}/modules", response_model=List[ModuleWithLessons])
def read_learning_path_modules(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional)
):
    """Get all modules for a specific learning path"""
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    modules = db.query(Module).options(joinedload(Module.lessons)).filter(Module.learning_path_id == path_id).order_by(Module.sort_order).all()
    return modules

# Module CRUD endpoints
@router.get("/modules/", response_model=List[ModuleSchema])
def get_modules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    learning_path_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get all modules with optional filtering"""
    query = db.query(Module).options(joinedload(Module.learning_path))
    
    if learning_path_id:
        query = query.filter(Module.learning_path_id == learning_path_id)
    
    if is_active is not None:
        query = query.filter(Module.is_active == is_active)
    
    if search:
        search_filter = or_(
            Module.title.ilike(f"%{search}%"),
            Module.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    query = query.order_by(Module.learning_path_id, Module.sort_order)
    modules = query.offset(skip).limit(limit).all()
    return modules

@router.get("/modules/{module_id}", response_model=ModuleWithLessons)
def get_module(
    module_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get a specific module by ID"""
    module = db.query(Module).options(
        joinedload(Module.learning_path),
        joinedload(Module.lessons)
    ).filter(Module.id == module_id).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return module

@router.post("/modules/", response_model=ModuleSchema)
def create_module(
    module: ModuleCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new module"""
    print(f"[DEBUG] create_module endpoint hit with data: {module.dict()}")
    
    # Verify learning path exists
    learning_path = db.query(LearningPath).filter(LearningPath.id == module.learning_path_id).first()
    if not learning_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    # Set sort order if not provided
    if module.sort_order is None:
        max_order = db.query(func.max(Module.sort_order)).filter(
            Module.learning_path_id == module.learning_path_id
        ).scalar() or 0
        module.sort_order = max_order + 1
    
    db_module = Module(**module.dict())
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    print(f"[DEBUG] Module created successfully: {db_module.title} (ID: {db_module.id})")
    return db_module

@router.post("/learning-paths/{path_id}/modules", response_model=ModuleSchema)
def create_module_nested(
    path_id: int,
    module: ModuleCreateNested,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new module for a specific learning path (nested endpoint)"""
    print(f"[DEBUG] create_module_nested endpoint hit with path_id: {path_id}, data: {module.dict()}")
    
    # Verify learning path exists
    learning_path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not learning_path:
        print(f"[DEBUG] Learning path not found: {path_id}")
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    # Override the learning_path_id from URL parameter
    module_data = module.dict()
    module_data['learning_path_id'] = path_id
    print(f"[DEBUG] Module data with overridden learning_path_id: {module_data}")
    
    # Set sort order if not provided
    if module.sort_order is None:
        max_order = db.query(func.max(Module.sort_order)).filter(
            Module.learning_path_id == path_id
        ).scalar() or 0
        module_data['sort_order'] = max_order + 1
        print(f"[DEBUG] Set sort_order to: {module_data['sort_order']}")
    
    db_module = Module(**module_data)
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    print(f"[DEBUG] Module created successfully via nested endpoint: {db_module.title} (ID: {db_module.id})")
    return db_module

@router.put("/modules/{module_id}", response_model=ModuleSchema)
def update_module(
    module_id: int,
    module_update: ModuleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update a module"""
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # If learning_path_id is being updated, verify it exists
    if module_update.learning_path_id and module_update.learning_path_id != db_module.learning_path_id:
        learning_path = db.query(LearningPath).filter(LearningPath.id == module_update.learning_path_id).first()
        if not learning_path:
            raise HTTPException(status_code=404, detail="Learning path not found")
    
    update_data = module_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_module, field, value)
    
    db.commit()
    db.refresh(db_module)
    return db_module

@router.delete("/modules/{module_id}")
def delete_module(
    module_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete a module"""
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check if module has lessons
    lesson_count = db.query(func.count(Lesson.id)).filter(Lesson.module_id == module_id).scalar()
    if lesson_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete module with {lesson_count} lessons. Delete lessons first."
        )
    
    db.delete(db_module)
    db.commit()
    return {"message": "Module deleted successfully"}

@router.get("/modules/{module_id}/lessons", response_model=List[LessonAdminSchema])
def get_module_lessons(
    module_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional)
):
    """Get all lessons for a specific module"""
    print(f"[DEBUG] get_module_lessons endpoint hit for module: {module_id}")
    
    # Verify module exists
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get lessons for this module with module relationship loaded
    lessons = db.query(Lesson).options(
        joinedload(Lesson.module).joinedload(Module.learning_path)
    ).filter(
        Lesson.module_id == module_id,
        Lesson.is_active == True
    ).order_by(Lesson.sort_order).all()
    
    print(f"[DEBUG] Found {len(lessons)} lessons for module {module_id}")
    return lessons

# Lesson CRUD endpoints
@router.get("/lessons/", response_model=List[LessonAdminSchema])
def get_lessons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    module_id: Optional[int] = None,
    learning_path_id: Optional[int] = None,
    lesson_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get all lessons with optional filtering and full relationship data (admin view)"""
    print(f"[DEBUG] get_lessons endpoint hit by admin: {current_user.email}")
    
    query = db.query(Lesson).options(
        joinedload(Lesson.module).joinedload(Module.learning_path)
    )
    
    if module_id:
        query = query.filter(Lesson.module_id == module_id)
    
    if learning_path_id:
        query = query.join(Module).filter(Module.learning_path_id == learning_path_id)
    
    if lesson_type:
        query = query.filter(Lesson.lesson_type == lesson_type)
    
    if is_active is not None:
        query = query.filter(Lesson.is_active == is_active)
    
    if search:
        search_filter = or_(
            Lesson.title.ilike(f"%{search}%"),
            Lesson.description.ilike(f"%{search}%"),
            Lesson.content.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    query = query.order_by(Lesson.module_id, Lesson.sort_order)
    lessons = query.offset(skip).limit(limit).all()
    
    print(f"[DEBUG] Found {len(lessons)} lessons for admin listing")
    return lessons

@router.get("/lessons/{lesson_id}", response_model=LessonSchema)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get a specific lesson by ID with full relationship data"""
    lesson = db.query(Lesson).options(
        joinedload(Lesson.module).joinedload(Module.learning_path)
    ).filter(Lesson.id == lesson_id).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Get user progress for this lesson
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id == lesson_id
    ).first()
    
    # Get the complete learning path with all modules and lessons for proper navigation
    learning_path_id = lesson.module.learning_path.id
    learning_path_full = db.query(LearningPath).options(
        joinedload(LearningPath.modules).joinedload(Module.lessons)
    ).filter(LearningPath.id == learning_path_id).first()
    
    # Build all lessons in order across all modules
    all_lessons_in_order = []
    for module in sorted(learning_path_full.modules, key=lambda x: x.sort_order):
        for lesson_item in sorted(module.lessons, key=lambda x: x.sort_order):
            if lesson_item.is_active:
                all_lessons_in_order.append(lesson_item)
    
    # Find this lesson's position in the overall sequence
    lesson_global_index = next(
        (i for i, les in enumerate(all_lessons_in_order) if les.id == lesson.id), 
        -1
    )
    
    # Get previous lesson (globally across all modules)
    previous_lesson = all_lessons_in_order[lesson_global_index - 1] if lesson_global_index > 0 else None
    
    # Get NEXT AVAILABLE lesson (not just next by order, but next that should be started)
    next_lesson = None
    if lesson_global_index >= 0 and lesson_global_index < len(all_lessons_in_order) - 1:
        # Look for the next lesson that should be started
        for i in range(lesson_global_index + 1, len(all_lessons_in_order)):
            next_lesson_candidate = all_lessons_in_order[i]
            
            # Check if this lesson is available to start
            next_lesson_progress = db.query(UserProgress).filter(
                UserProgress.user_id == current_user.id,
                UserProgress.lesson_id == next_lesson_candidate.id
            ).first()
            
            # If not completed, this is the next lesson to start
            if not next_lesson_progress or next_lesson_progress.status != "COMPLETED":
                next_lesson = next_lesson_candidate
                break
    
    # Calculate if lesson is locked using the already loaded lesson sequence
    is_locked = True  # Default to locked
    
    if lesson_global_index == 0:
        # First lesson in entire learning path is always unlocked
        is_locked = False
    elif lesson_global_index > 0:
        # Check if the previous lesson (globally) is completed
        previous_lesson_global = all_lessons_in_order[lesson_global_index - 1]
        previous_progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == previous_lesson_global.id
        ).first()
        is_locked = not (previous_progress and previous_progress.status == "COMPLETED")

    # Convert lesson to dict and add progress fields
    lesson_dict = {
        "id": lesson.id,
        "title": lesson.title,
        "content": lesson.content,
        "lesson_type": lesson.lesson_type,
        "estimated_duration": lesson.estimated_duration,
        "sort_order": lesson.sort_order,
        "is_active": lesson.is_active,
        "module_id": lesson.module_id,
        "created_at": lesson.created_at,
        "updated_at": lesson.updated_at,
        "module": {
            "id": lesson.module.id,
            "title": lesson.module.title,
            "description": lesson.module.description,
            "estimated_duration": lesson.module.estimated_duration,
            "sort_order": lesson.module.sort_order,
            "is_active": lesson.module.is_active,
            "learning_path_id": lesson.module.learning_path_id,
            "created_at": lesson.module.created_at,
            "updated_at": lesson.module.updated_at,
            "learning_path": {
                "id": lesson.module.learning_path.id,
                "title": lesson.module.learning_path.title,
                "description": lesson.module.learning_path.description,
                "level": lesson.module.learning_path.level,
                "estimated_duration": lesson.module.learning_path.estimated_duration,
                "sort_order": lesson.module.learning_path.sort_order,
                "is_active": lesson.module.learning_path.is_active,
                "created_at": lesson.module.learning_path.created_at,
                "updated_at": lesson.module.learning_path.updated_at
            }
        },
        # Progress status fields (these are what the frontend checks)
        "is_completed": user_progress.status == "COMPLETED" if user_progress else False,
        "is_started": user_progress.status == "STARTED" if user_progress else False,
        "is_locked": is_locked,
        "user_progress": {
            "is_completed": user_progress.status == "COMPLETED" if user_progress else False,
            "completed_at": user_progress.completed_at if user_progress else None,
            "progress_percentage": user_progress.progress_percentage if user_progress else 0
        },
        "navigation": {
            "previous_lesson": {
                "id": previous_lesson.id,
                "title": previous_lesson.title
            } if previous_lesson else None,
            "next_lesson": {
                "id": next_lesson.id,
                "title": next_lesson.title
            } if next_lesson else None
        }
    }
    
    return lesson_dict

@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Mark a lesson as completed by the user (with sequential completion check)"""
    print(f"\n=== LESSON COMPLETION REQUEST ===")
    print(f"User ID: {current_user.id}")
    print(f"User Email: {current_user.email}")
    print(f"Lesson ID: {lesson_id}")
    
    # Check if lesson exists
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        print(f"ERROR: Lesson {lesson_id} not found")
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    print(f"Lesson found: '{lesson.title}' in module {lesson.module_id}")
    
    # Check if user can complete this lesson (sequential completion)
    # Find the previous lesson in the same module
    previous_lesson = db.query(Lesson).filter(
        Lesson.module_id == lesson.module_id,
        Lesson.sort_order < lesson.sort_order,
        Lesson.is_active == True
    ).order_by(Lesson.sort_order.desc()).first()
    
    if previous_lesson:
        print(f"Previous lesson found: '{previous_lesson.title}' (ID: {previous_lesson.id})")
        previous_progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == previous_lesson.id
        ).first()
        
        if previous_progress:
            print(f"Previous lesson progress: Status={previous_progress.status}")
        else:
            print(f"No progress found for previous lesson {previous_lesson.id}")
        
        if not previous_progress or previous_progress.status != 'COMPLETED':
            print(f"ERROR: Previous lesson not completed")
            raise HTTPException(
                status_code=400, 
                detail=f"You must complete the previous lesson '{previous_lesson.title}' first"
            )
    else:
        print("No previous lesson - this is the first lesson in the module")
    
    # Check if lesson is already completed
    existing_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id == lesson_id
    ).first()
    
    if existing_progress:
        print(f"Existing progress found: Status={existing_progress.status}, Progress={existing_progress.progress_percentage}%")
        if existing_progress.status == 'COMPLETED':
            print("Lesson already completed - returning early")
            return {"message": "Lesson already completed", "lesson_id": lesson_id}
    else:
        print("No existing progress found - will create new record")
    
    # Get or create user progress record
    if not existing_progress:
        print("Creating new progress record...")
        # Create new progress record as completed
        progress = UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            status='COMPLETED',
            progress_percentage=100,
            completed_at=func.now()
        )
        db.add(progress)
        print(f"New progress record created: User={progress.user_id}, Lesson={progress.lesson_id}, Status={progress.status}")
    else:
        print("Updating existing progress record...")
        # Mark existing progress as completed
        existing_progress.status = 'COMPLETED'
        existing_progress.progress_percentage = 100
        existing_progress.completed_at = func.now()
        print(f"Updated progress: Status={existing_progress.status}, Progress={existing_progress.progress_percentage}%")
    
    try:
        db.commit()
        print("Database commit successful!")
        
        # Verify the save worked
        verification = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == lesson_id
        ).first()
        
        if verification:
            print(f"VERIFICATION: Progress saved with Status={verification.status}, Progress={verification.progress_percentage}%")
        else:
            print("ERROR: Verification failed - no progress record found after commit!")
            
    except Exception as e:
        print(f"ERROR during commit: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save progress: {str(e)}")
    
    # Update learning path progress and check if this completes the entire learning path
    try:
        # Get the learning path for this lesson
        module = db.query(Module).filter(Module.id == lesson.module_id).first()
        if module:
            learning_path = db.query(LearningPath).filter(LearningPath.id == module.learning_path_id).first()
            
            if learning_path:
                print(f"Updating learning path progress for: {learning_path.title}")
                
                # Get all lessons in this learning path
                all_lessons = db.query(Lesson).join(Module).filter(
                    Module.learning_path_id == learning_path.id,
                    Lesson.is_active == True,
                    Module.is_active == True
                ).all()
                
                # Count completed lessons for this user
                completed_lessons = db.query(UserProgress).join(Lesson).join(Module).filter(
                    Module.learning_path_id == learning_path.id,
                    UserProgress.user_id == current_user.id,
                    UserProgress.status == 'COMPLETED',
                    Lesson.is_active == True,
                    Module.is_active == True
                ).count()
                
                total_lessons = len(all_lessons)
                print(f"Progress: {completed_lessons}/{total_lessons} lessons completed")
                
                # Calculate progress percentage
                progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
                print(f"Progress percentage: {progress_percentage}%")
                
                # Update or create learning path progress record
                learning_path_progress = db.query(UserProgress).filter(
                    UserProgress.user_id == current_user.id,
                    UserProgress.learning_path_id == learning_path.id,
                    UserProgress.lesson_id.is_(None)  # Learning path level progress
                ).first()
                
                if not learning_path_progress:
                    print("Creating learning path progress record...")
                    learning_path_progress = UserProgress(
                        user_id=current_user.id,
                        learning_path_id=learning_path.id,
                        lesson_id=None,  # This is path-level progress
                        status='STARTED',
                        progress_percentage=progress_percentage,
                        time_spent=0
                    )
                    db.add(learning_path_progress)
                else:
                    print("Updating existing learning path progress record...")
                    learning_path_progress.progress_percentage = progress_percentage
                
                # Check if learning path is completed
                if completed_lessons == total_lessons and total_lessons > 0:
                    print("Learning path completed! Updating status...")
                    learning_path_progress.status = 'COMPLETED'
                    learning_path_progress.completed_at = func.now()
                    
                    # Commit the learning path progress update
                    db.commit()
                    
                    # Check if certificate already exists
                    existing_certificate = db.query(Certificate).filter(
                        Certificate.user_id == current_user.id,
                        Certificate.learning_path_id == learning_path.id
                    ).first()
                    
                    if not existing_certificate:
                        print("All lessons completed! Generating certificate...")
                        
                        # Generate certificate
                        import uuid
                        from datetime import datetime
                        
                        certificate = Certificate(
                            user_id=current_user.id,
                            learning_path_id=learning_path.id,
                            certificate_name=f"{learning_path.title} - Certificate of Completion",
                            certificate_url=None,  # Will be generated later
                        )
                        
                        db.add(certificate)
                        db.commit()
                        db.refresh(certificate)
                        
                        print(f"Certificate generated! ID: {certificate.id}")
                        
                        # Create achievement for completing learning path
                        completion_achievement = create_achievement(
                            db=db,
                            user_id=current_user.id,
                            achievement_type="LEARNING_PATH_COMPLETION",
                            title=f"Completed {learning_path.title}",
                            description=f"Successfully completed all lessons in {learning_path.title}",
                            icon="🎓",
                            learning_path_id=learning_path.id
                        )
                        
                        # Check if this is user's first certificate and create first completion achievement
                        user_certificate_count = db.query(Certificate).filter(
                            Certificate.user_id == current_user.id
                        ).count()
                        
                        if user_certificate_count == 1:  # This is their first certificate
                            first_completion_achievement = create_achievement(
                                db=db,
                                user_id=current_user.id,
                                achievement_type="FIRST_COMPLETION",
                                title="First Course Completed",
                                description="Congratulations on completing your first learning path!",
                                icon="🎯",
                                learning_path_id=None
                            )
                            print(f"First completion achievement created! ID: {first_completion_achievement.id}")
                        
                        print(f"Learning path completion achievement created! ID: {completion_achievement.id}")
                        
                        return {
                            "message": "Lesson completed and certificate earned!", 
                            "lesson_id": lesson_id,
                            "certificate_earned": True,
                            "certificate_id": certificate.id,
                            "learning_path_completed": True
                        }
                    else:
                        print("Certificate already exists for this learning path")
                else:
                    # Commit the learning path progress update
                    db.commit()
                    print(f"Learning path progress updated to {progress_percentage}%")
                
    except Exception as e:
        print(f"Error updating learning path progress: {str(e)}")
        # Don't fail the lesson completion if progress update fails
        pass
    
    print("=== LESSON COMPLETION SUCCESS ===\n")
    return {"message": "Lesson marked as completed", "lesson_id": lesson_id}

@router.post("/lessons/", response_model=LessonAdminSchema)
def create_lesson(
    lesson: LessonCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new lesson"""
    print(f"[DEBUG] create_lesson endpoint hit with data: {lesson.dict()}")
    
    # Verify module exists
    module = db.query(Module).filter(Module.id == lesson.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Set sort order if not provided
    if lesson.sort_order is None:
        max_order = db.query(func.max(Lesson.sort_order)).filter(
            Lesson.module_id == lesson.module_id
        ).scalar() or 0
        lesson.sort_order = max_order + 1
    
    db_lesson = Lesson(**lesson.dict())
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    
    # Load the lesson with module relationship for proper response
    lesson_with_module = db.query(Lesson).options(
        joinedload(Lesson.module).joinedload(Module.learning_path)
    ).filter(Lesson.id == db_lesson.id).first()
    
    print(f"[DEBUG] Lesson created successfully: {db_lesson.title} (ID: {db_lesson.id})")
    return lesson_with_module

@router.post("/modules/{module_id}/lessons", response_model=LessonAdminSchema)
def create_lesson_nested(
    module_id: int,
    lesson: LessonCreateNested,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new lesson for a specific module (nested endpoint)"""
    print(f"[DEBUG] create_lesson_nested endpoint hit with module_id: {module_id}, data: {lesson.dict()}")
    
    # Verify module exists
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        print(f"[DEBUG] Module not found: {module_id}")
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Override the module_id from URL parameter
    lesson_data = lesson.dict()
    lesson_data['module_id'] = module_id
    print(f"[DEBUG] Lesson data with overridden module_id: {lesson_data}")
    
    # Set sort order if not provided
    if lesson.sort_order is None:
        max_order = db.query(func.max(Lesson.sort_order)).filter(
            Lesson.module_id == module_id
        ).scalar() or 0
        lesson_data['sort_order'] = max_order + 1
        print(f"[DEBUG] Set sort_order to: {lesson_data['sort_order']}")
    
    db_lesson = Lesson(**lesson_data)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    
    # Load the lesson with module relationship for proper response
    lesson_with_module = db.query(Lesson).options(
        joinedload(Lesson.module).joinedload(Module.learning_path)
    ).filter(Lesson.id == db_lesson.id).first()
    
    print(f"[DEBUG] Lesson created successfully via nested endpoint: {db_lesson.title} (ID: {db_lesson.id})")
    return lesson_with_module

@router.put("/lessons/{lesson_id}", response_model=LessonAdminSchema)
def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update a lesson"""
    db_lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # If module_id is being updated, verify it exists
    if lesson_update.module_id and lesson_update.module_id != db_lesson.module_id:
        module = db.query(Module).filter(Module.id == lesson_update.module_id).first()
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
    
    update_data = lesson_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_lesson, field, value)
    
    db.commit()
    db.refresh(db_lesson)
    
    # Load the lesson with module relationship for proper response
    lesson_with_module = db.query(Lesson).options(
        joinedload(Lesson.module).joinedload(Module.learning_path)
    ).filter(Lesson.id == db_lesson.id).first()
    
    return lesson_with_module

@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete a lesson"""
    db_lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    db.delete(db_lesson)
    db.commit()
    return {"message": "Lesson deleted successfully"}

@router.post("/learning-paths/", response_model=LearningPathSchema)
def create_learning_path(
    path: LearningPathCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create a new learning path (admin only)"""
    db_path = LearningPath(**path.dict())
    db.add(db_path)
    db.commit()
    db.refresh(db_path)
    return db_path

@router.put("/learning-paths/{path_id}", response_model=LearningPathSchema)
def update_learning_path(
    path_id: int,
    path_update: LearningPathUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update a learning path (admin only)"""
    db_path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not db_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    update_data = path_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_path, field, value)
    
    db.commit()
    db.refresh(db_path)
    return db_path

@router.delete("/learning-paths/{path_id}")
def delete_learning_path(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete a learning path (admin only)"""
    db_path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not db_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    db.delete(db_path)
    db.commit()
    return {"message": "Learning path deleted successfully"}

@router.post("/learning-paths/{path_id}/enroll")
def enroll_in_learning_path(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Enroll user in a learning path"""
    # Check if learning path exists and is active
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == path_id,
        LearningPath.is_active == True
    ).first()
    
    if not learning_path:
        raise HTTPException(status_code=404, detail="Learning path not found or inactive")
    
    # Check if user is already enrolled
    existing_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.learning_path_id == path_id
    ).first()
    
    if existing_progress:
        raise HTTPException(status_code=400, detail="Already enrolled in this learning path")
    
    # Create enrollment record
    from datetime import datetime
    user_progress = UserProgress(
        user_id=current_user.id,
        learning_path_id=path_id,
        status="STARTED",
        progress_percentage=0,
        started_at=datetime.utcnow()
    )
    
    db.add(user_progress)
    db.commit()
    db.refresh(user_progress)
    
    return {
        "message": "Successfully enrolled in learning path",
        "learning_path": learning_path.title,
        "enrollment_date": user_progress.created_at
    }

@router.get("/user-stats", response_model=UserStats)
def get_user_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get user's learning statistics"""
    from datetime import datetime, timedelta
    from sqlalchemy import func, cast, Date
    
    # Count enrolled paths
    enrolled_paths_query = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id.is_(None)  # Path level progress only
    )
    
    enrolled_paths = enrolled_paths_query.count()
    print(f"Enrolled paths count: {enrolled_paths}")
    
    # Count completed paths
    completed_paths = enrolled_paths_query.filter(
        UserProgress.status == "COMPLETED"
    ).count()
    
    # Count completed lessons (for calculating learning time)
    completed_lessons = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id.isnot(None),
        UserProgress.status == "COMPLETED"
    ).count()

    # Count certificates earned
    certificates_earned = db.query(Certificate).filter(
        Certificate.user_id == current_user.id,
        Certificate.is_active == True
    ).count()

    # Count certificates earned this month
    current_date = datetime.utcnow()
    first_day_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    certificates_this_month = db.query(Certificate).filter(
        Certificate.user_id == current_user.id,
        Certificate.is_active == True,
        Certificate.issued_at >= first_day_of_month
    ).count()

    # Calculate average score (for now, assume 100% since we don't track assessment scores yet)
    # TODO: When assessment system is fully implemented, calculate real average
    average_score = 100.0 if certificates_earned > 0 else 0.0

    # Calculate learning streak (consecutive days with lesson completions)
    # Get lesson completion dates for the last 30 days
    thirty_days_ago = current_date - timedelta(days=30)
    completion_dates = db.query(
        cast(UserProgress.completed_at, Date).label('completion_date')
    ).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id.isnot(None),
        UserProgress.status == "COMPLETED",
        UserProgress.completed_at >= thirty_days_ago
    ).distinct().order_by(cast(UserProgress.completed_at, Date).desc()).all()
    
    # Calculate current streak
    current_streak = 0
    if completion_dates:
        check_date = current_date.date()
        for completion in completion_dates:
            if completion.completion_date == check_date or completion.completion_date == check_date - timedelta(days=1):
                current_streak += 1
                check_date = completion.completion_date - timedelta(days=1)
            else:
                break

    # Count total achievements (TODO: implement achievement system)
    total_achievements = 0
    if certificates_earned > 0:
        total_achievements += 1  # First completion achievement
    if current_streak >= 7:
        total_achievements += 1  # 7-day streak achievement
    if current_streak >= 30:
        total_achievements += 1  # 30-day streak achievement

    # Estimate learning time based on completed lessons (15 min average per lesson)
    total_learning_time = completed_lessons * 15  # minutes

    return UserStats(
        enrolled_paths=enrolled_paths,
        completed_paths=completed_paths,
        total_learning_time=total_learning_time,
        certificates_earned=certificates_earned,
        current_streak=current_streak,
        certificates_this_month=certificates_this_month,
        average_score=average_score,
        total_achievements=total_achievements
    )

@router.get("/learning-paths/{path_id}/next-lesson")
def get_next_lesson(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get the next available lesson for a user in a specific learning path"""
    # Verify user is enrolled in this learning path
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.learning_path_id == path_id,
        UserProgress.lesson_id.is_(None)  # Path level progress
    ).first()
    
    if not user_progress:
        raise HTTPException(status_code=404, detail="Not enrolled in this learning path")
    
    # Get the complete learning path with all modules and lessons
    learning_path = db.query(LearningPath).options(
        joinedload(LearningPath.modules).joinedload(Module.lessons)
    ).filter(LearningPath.id == path_id).first()
    
    if not learning_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    # Build sequential list of all lessons in order
    all_lessons_in_order = []
    for module in sorted(learning_path.modules, key=lambda x: x.sort_order):
        if module.is_active:
            for lesson in sorted(module.lessons, key=lambda x: x.sort_order):
                if lesson.is_active:
                    all_lessons_in_order.append((module.id, lesson))
    
    # Find the next incomplete lesson
    for module_id, lesson in all_lessons_in_order:
        lesson_progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == lesson.id
        ).first()
        
        # If lesson is not completed, this is the next lesson
        if not lesson_progress or lesson_progress.status != "COMPLETED":
            # Check if this lesson is unlocked
            lesson_global_index = next(
                (i for i, (mod_id, les) in enumerate(all_lessons_in_order) if les.id == lesson.id), 
                -1
            )
            
            if lesson_global_index == 0:
                # First lesson is always available
                return {
                    "lesson_id": lesson.id,
                    "module_id": module_id,
                    "lesson_title": lesson.title,
                    "module_title": next(m.title for m in learning_path.modules if m.id == module_id)
                }
            elif lesson_global_index > 0:
                # Check if previous lesson is completed
                prev_lesson = all_lessons_in_order[lesson_global_index - 1][1]
                prev_progress = db.query(UserProgress).filter(
                    UserProgress.user_id == current_user.id,
                    UserProgress.lesson_id == prev_lesson.id
                ).first()
                if prev_progress and prev_progress.status == "COMPLETED":
                    return {
                        "lesson_id": lesson.id,
                        "module_id": module_id,
                        "lesson_title": lesson.title,
                        "module_title": next(m.title for m in learning_path.modules if m.id == module_id)
                    }
    
    # If we get here, all lessons are completed
    return {
        "lesson_id": None,
        "message": "All lessons in this learning path are completed"
    }

@router.post("/learning-paths/{path_id}/restart")
def restart_learning_path(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Restart a learning path by resetting all lesson progress while preserving certificates"""
    # Verify user is enrolled in this learning path
    path_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.learning_path_id == path_id,
        UserProgress.lesson_id.is_(None)  # Path level progress
    ).first()
    
    if not path_progress:
        raise HTTPException(status_code=404, detail="Not enrolled in this learning path")
    
    # Get all lesson progress for this user in this learning path
    learning_path = db.query(LearningPath).options(
        joinedload(LearningPath.modules).joinedload(Module.lessons)
    ).filter(LearningPath.id == path_id).first()
    
    if not learning_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    # Collect all lesson IDs from this learning path
    lesson_ids = []
    for module in learning_path.modules:
        for lesson in module.lessons:
            lesson_ids.append(lesson.id)
    
    # Delete all lesson progress (but preserve certificates which are stored separately)
    deleted_count = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id.in_(lesson_ids)
    ).delete(synchronize_session=False)
    
    # Reset the learning path progress
    path_progress.status = "STARTED"
    path_progress.progress_percentage = 0
    path_progress.completed_at = None
    path_progress.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Learning path restarted successfully",
        "lessons_reset": deleted_count,
        "certificates_preserved": True
    }

# Glossary endpoints
@router.get("/glossary/", response_model=List[GlossaryTermSchema])
def get_glossary_terms(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get glossary terms (admin only for now)"""
    query = db.query(GlossaryTerm)
    
    if is_active is not None:
        query = query.filter(GlossaryTerm.is_active == is_active)
    
    if category:
        query = query.filter(GlossaryTerm.category == category)
    
    if search:
        search_filter = or_(
            GlossaryTerm.term.ilike(f"%{search}%"),
            GlossaryTerm.definition.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.order_by(GlossaryTerm.term).offset(skip).limit(limit).all()

@router.get("/glossary/{term_id}", response_model=GlossaryTermSchema)
def get_glossary_term(
    term_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get glossary term by ID (admin only)"""
    db_term = db.query(GlossaryTerm).filter(GlossaryTerm.id == term_id).first()
    if not db_term:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    return db_term

@router.post("/glossary/", response_model=GlossaryTermSchema)
def create_glossary_term(
    term: GlossaryTermCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Create new glossary term (admin only)"""
    # Check if term already exists
    existing_term = db.query(GlossaryTerm).filter(GlossaryTerm.term == term.term).first()
    if existing_term:
        raise HTTPException(
            status_code=400, 
            detail="Glossary term already exists"
        )
    
    db_term = GlossaryTerm(**term.model_dump())
    db.add(db_term)
    db.commit()
    db.refresh(db_term)
    return db_term

@router.put("/glossary/{term_id}", response_model=GlossaryTermSchema)
def update_glossary_term(
    term_id: int,
    term_update: GlossaryTermUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update glossary term (admin only)"""
    db_term = db.query(GlossaryTerm).filter(GlossaryTerm.id == term_id).first()
    if not db_term:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    
    update_data = term_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_term, field, value)
    
    db.commit()
    db.refresh(db_term)
    return db_term

@router.delete("/glossary/{term_id}")
def delete_glossary_term(
    term_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete glossary term (admin only)"""
    db_term = db.query(GlossaryTerm).filter(GlossaryTerm.id == term_id).first()
    if not db_term:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    
    db.delete(db_term)
    db.commit()
    return {"message": "Glossary term deleted successfully"}

@router.get("/stats/overview", response_model=EducationOverviewStats)
def get_overview_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get education system overview statistics"""
    stats = EducationOverviewStats(
        total_learning_paths=db.query(LearningPath).count(),
        total_modules=db.query(Module).count(),
        total_lessons=db.query(Lesson).count(),
        total_glossary_terms=db.query(GlossaryTerm).count(),
        total_assessments=db.query(Assessment).count(),
        total_questions=db.query(Question).count(),
        active_learners=db.query(User).filter(User.is_active == True).count(),
        completion_rate=0.0  # Would need to calculate based on user progress
    )
    return stats

@router.get("/analytics")
def get_learning_analytics(
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, or all"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get learning analytics data"""
    # This would be implemented with more complex queries
    # For now, return basic structure
    return {
        "period": period,
        "total_learners": 0,
        "active_learners": 0,
        "completion_rates": {},
        "popular_paths": [],
        "assessment_performance": {}
    }

# Certificate endpoints
@router.get("/certificates/")
def get_user_certificates(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all certificates for the current user"""
    certificates = db.query(Certificate).filter(
        Certificate.user_id == current_user.id
    ).options(
        joinedload(Certificate.learning_path)
    ).order_by(Certificate.issued_at.desc()).all()
    
    # Manually construct response to map issued_at to issued_date
    certificate_list = []
    for certificate in certificates:
        certificate_dict = {
            "id": certificate.id,
            "user_id": certificate.user_id,
            "learning_path_id": certificate.learning_path_id,
            "certificate_name": certificate.certificate_name,
            "certificate_url": certificate.certificate_url,
            "issued_date": certificate.issued_at,
            "is_active": certificate.is_active,
            "learning_path": {
                "id": certificate.learning_path.id,
                "title": certificate.learning_path.title,
                "description": certificate.learning_path.description,
                "level": certificate.learning_path.level,
                "estimated_duration": certificate.learning_path.estimated_duration
            } if certificate.learning_path else None
        }
        certificate_list.append(certificate_dict)
    
    return certificate_list

@router.get("/certificates/{certificate_id}")
def get_certificate(
    certificate_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get a specific certificate for the current user"""
    certificate = db.query(Certificate).filter(
        Certificate.id == certificate_id,
        Certificate.user_id == current_user.id
    ).options(
        joinedload(Certificate.learning_path)
    ).first()
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Manually construct response to map issued_at to issued_date
    return {
        "id": certificate.id,
        "user_id": certificate.user_id,
        "learning_path_id": certificate.learning_path_id,
        "certificate_name": certificate.certificate_name,
        "certificate_url": certificate.certificate_url,
        "issued_date": certificate.issued_at,
        "is_active": certificate.is_active,
        "learning_path": {
            "id": certificate.learning_path.id,
            "title": certificate.learning_path.title,
            "description": certificate.learning_path.description,
            "level": certificate.learning_path.level,
            "estimated_duration": certificate.learning_path.estimated_duration
        } if certificate.learning_path else None
    }

@router.get("/certificates/{certificate_id}/download")
def download_certificate(
    certificate_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Download certificate as PDF"""
    certificate = db.query(Certificate).filter(
        Certificate.id == certificate_id,
        Certificate.user_id == current_user.id
    ).options(
        joinedload(Certificate.learning_path)
    ).first()
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # For now, return certificate details as JSON
    # In a real implementation, you would generate a PDF here
    return {
        "certificate_id": certificate.id,
        "user_name": current_user.full_name or current_user.email,
        "learning_path": certificate.learning_path.title,
        "issued_date": certificate.issued_at,
        "certificate_name": certificate.certificate_name,
        "message": "PDF generation not implemented yet - showing certificate details"
    }

@router.get("/certificates/{certificate_id}/verify")
def verify_certificate(
    certificate_id: int,
    db: Session = Depends(deps.get_db)
):
    """Public endpoint to verify a certificate's authenticity"""
    certificate = db.query(Certificate).filter(
        Certificate.id == certificate_id
    ).options(
        joinedload(Certificate.learning_path),
        joinedload(Certificate.user)
    ).first()
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return {
        "valid": True,
        "certificate_id": certificate.id,
        "recipient_name": certificate.user.full_name or certificate.user.email,
        "learning_path": certificate.learning_path.title,
        "issued_date": certificate.issued_at,
        "certificate_name": certificate.certificate_name
    }

# Achievement endpoints
@router.get("/achievements/", response_model=List[AchievementSchema])
def get_user_achievements(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get user's achievements"""
    achievements = db.query(Achievement).filter(
        Achievement.user_id == current_user.id,
        Achievement.is_active == True
    ).order_by(Achievement.earned_at.desc()).all()
    
    # Manually construct response with learning path info
    achievement_list = []
    for achievement in achievements:
        achievement_dict = {
            "id": achievement.id,
            "user_id": achievement.user_id,
            "achievement_type": achievement.achievement_type,
            "title": achievement.title,
            "description": achievement.description,
            "icon": achievement.icon,
            "learning_path_id": achievement.learning_path_id,
            "earned_at": achievement.earned_at,
            "is_active": achievement.is_active,
            "learning_path": None
        }
        
        if achievement.learning_path_id:
            learning_path = db.query(LearningPath).filter(
                LearningPath.id == achievement.learning_path_id
            ).first()
            if learning_path:
                achievement_dict["learning_path"] = {
                    "id": learning_path.id,
                    "title": learning_path.title,
                    "description": learning_path.description,
                    "level": learning_path.level,
                    "estimated_duration": learning_path.estimated_duration
                }
        
        achievement_list.append(achievement_dict)
    
    return achievement_list

def create_achievement(
    db: Session,
    user_id: int,
    achievement_type: str,
    title: str,
    description: str,
    icon: str = "🏆",
    learning_path_id: Optional[int] = None
):
    """Helper function to create achievements"""
    # Check if user already has this achievement
    existing = db.query(Achievement).filter(
        Achievement.user_id == user_id,
        Achievement.achievement_type == achievement_type,
        Achievement.learning_path_id == learning_path_id
    ).first()
    
    if existing:
        return existing
    
    # Create new achievement
    achievement = Achievement(
        user_id=user_id,
        achievement_type=achievement_type,
        title=title,
        description=description,
        icon=icon,
        learning_path_id=learning_path_id
    )
    
    db.add(achievement)
    db.commit()
    db.refresh(achievement)
    return achievement
