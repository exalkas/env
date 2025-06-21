# Education API endpoints
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc, asc

from app.api import deps
from app.models.education import (
    LearningPath, Module, Lesson, GlossaryTerm, Assessment, 
    UserProgress, UserAssessmentAttempt, Certificate,
    Question, QuestionOption, AssessmentQuestion, UserQuestionResponse
)
from app.models.user import User
from app.schemas.education import (
    LearningPath as LearningPathSchema,
    LearningPathCreate, LearningPathUpdate, LearningPathWithModules,
    Module as ModuleSchema, ModuleCreate, ModuleUpdate, ModuleWithLessons,
    Lesson as LessonSchema, LessonCreate, LessonUpdate,
    GlossaryTerm as GlossaryTermSchema, GlossaryTermCreate, GlossaryTermUpdate,
    Assessment as AssessmentSchema, AssessmentCreate, AssessmentUpdate,
    Question as QuestionSchema, QuestionCreate, QuestionUpdate,
    QuestionOption as QuestionOptionSchema,
    AssessmentQuestion as AssessmentQuestionSchema, AssessmentQuestionCreate,
    UserAssessmentAttempt as UserAssessmentAttemptSchema,
    UserQuestionResponse as UserQuestionResponseSchema,
    UserAssessmentAttemptCreate, UserAssessmentAttemptSubmit,
    QuestionBank, AssessmentTaking, AssessmentResults, AssessmentStats,
    EducationOverviewStats, QuestionType, QuestionDifficulty
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
    query = db.query(LearningPath)
    if is_active is not None:
        query = query.filter(LearningPath.is_active == is_active)
    if difficulty_level:
        query = query.filter(LearningPath.level == difficulty_level)
    
    return query.order_by(LearningPath.sort_order).offset(skip).limit(limit).all()

@router.get("/learning-paths/{path_id}", response_model=LearningPathWithModules)
def read_learning_path(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional)
):
    """Get a specific learning path with its modules"""
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return path

@router.get("/learning-paths/{path_id}/modules", response_model=List[ModuleSchema])
def read_learning_path_modules(
    path_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_optional)
):
    """Get all modules for a specific learning path"""
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    modules = db.query(Module).filter(Module.learning_path_id == path_id).order_by(Module.sort_order).all()
    return modules

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

# ... rest of the existing endpoints remain the same ...
