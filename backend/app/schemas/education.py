from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum

# Enums
class DifficultyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    MULTIPLE_SELECT = "multiple_select"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    NUMERIC = "numeric"
    ESSAY = "essay"
    MATCHING = "matching"
    ORDERING = "ordering"

class QuestionDifficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

# Learning Path schemas
class LearningPathBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    level: str = "BEGINNER"
    estimated_duration: Optional[int] = None
    sort_order: int = 0
    is_active: bool = True

class LearningPathCreate(LearningPathBase):
    pass

class LearningPathUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    level: Optional[str] = None
    estimated_duration: Optional[int] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class LearningPathInDBBase(LearningPathBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LearningPath(LearningPathInDBBase):
    pass

class LearningPathWithModules(LearningPathInDBBase):
    modules: List['Module'] = []

# Module schemas
class ModuleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    estimated_duration: Optional[int] = None
    sort_order: int = 0
    is_active: bool = True

class ModuleCreate(ModuleBase):
    learning_path_id: int

class ModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    estimated_duration: Optional[int] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class ModuleInDBBase(ModuleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Module(ModuleInDBBase):
    pass

class ModuleWithLessons(LearningPathInDBBase):
    modules: List['Module'] = []

# Lesson schemas
class LessonBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    lesson_type: Optional[str] = None
    estimated_duration: Optional[int] = None
    sort_order: int = 0
    is_active: bool = True

class LessonCreate(LessonBase):
    module_id: int

class LessonUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    lesson_type: Optional[str] = None
    estimated_duration: Optional[int] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class LessonInDBBase(LessonBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Lesson(LessonInDBBase):
    pass

class LessonWithAssessments(LessonInDBBase):
    assessments: List['Assessment'] = []

# Question Option schemas
class QuestionOptionBase(BaseModel):
    option_text: str = Field(..., min_length=1)
    is_correct: bool = False
    sort_order: int = 0
    explanation: Optional[str] = None

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionUpdate(BaseModel):
    option_text: Optional[str] = Field(None, min_length=1)
    is_correct: Optional[bool] = None
    sort_order: Optional[int] = None
    explanation: Optional[str] = None

class QuestionOption(QuestionOptionBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True

# Question schemas
class QuestionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    question_text: str = Field(..., min_length=1)
    question_type: QuestionType
    explanation: Optional[str] = None
    points: int = Field(default=1, ge=1)
    difficulty_level: QuestionDifficulty = QuestionDifficulty.MEDIUM
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: bool = True

class QuestionCreate(QuestionBase):
    options: Optional[List[QuestionOptionCreate]] = None

    @validator('options')
    def validate_options(cls, v, values):
        question_type = values.get('question_type')
        if question_type in [QuestionType.MULTIPLE_CHOICE, QuestionType.MULTIPLE_SELECT]:
            if not v or len(v) < 2:
                raise ValueError('Multiple choice questions must have at least 2 options')
            correct_options = [opt for opt in v if opt.is_correct]
            if question_type == QuestionType.MULTIPLE_CHOICE and len(correct_options) != 1:
                raise ValueError('Multiple choice questions must have exactly 1 correct option')
            if question_type == QuestionType.MULTIPLE_SELECT and len(correct_options) < 1:
                raise ValueError('Multiple select questions must have at least 1 correct option')
        elif question_type == QuestionType.TRUE_FALSE:
            if v and len(v) > 1:
                raise ValueError('True/False questions should have at most 1 option representing the correct answer')
            if v and len(v) == 1:
                # Validate that the option text is "true" or "false"
                option_text = v[0].option_text.lower().strip()
                if option_text not in ["true", "false"]:
                    raise ValueError('True/False question option must be "true" or "false"')
                if not v[0].is_correct:
                    raise ValueError('True/False question option must be marked as correct')
        return v

class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    question_text: Optional[str] = Field(None, min_length=1)
    question_type: Optional[QuestionType] = None
    explanation: Optional[str] = None
    points: Optional[int] = Field(None, ge=1)
    difficulty_level: Optional[QuestionDifficulty] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    options: Optional[List[QuestionOptionCreate]] = None

class Question(QuestionBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    options: List[QuestionOption] = []

    class Config:
        from_attributes = True

# Assessment Question schemas
class AssessmentQuestionBase(BaseModel):
    sort_order: int = 0
    points: int = Field(default=1, ge=1)

class AssessmentQuestionCreate(AssessmentQuestionBase):
    question_id: int

class AssessmentQuestionUpdate(BaseModel):
    sort_order: Optional[int] = None
    points: Optional[int] = Field(None, ge=1)

class AssessmentQuestion(AssessmentQuestionBase):
    id: int
    assessment_id: int
    question_id: int
    question: Optional[Question] = None

    class Config:
        from_attributes = True

# Assessment schemas
class AssessmentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    passing_score: int = Field(default=70, ge=0, le=100)
    time_limit: Optional[int] = Field(None, ge=1)  # minutes
    max_attempts: int = Field(default=3, ge=1)
    randomize_questions: bool = False
    show_results_immediately: bool = True
    allow_review: bool = True
    is_active: bool = True

class AssessmentCreate(AssessmentBase):
    learning_path_id: Optional[int] = None
    module_id: Optional[int] = None
    lesson_id: Optional[int] = None
    questions: Optional[str] = None  # Backward compatibility
    question_ids: Optional[List[int]] = None  # New structured approach

class AssessmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    time_limit: Optional[int] = Field(None, ge=1)
    max_attempts: Optional[int] = Field(None, ge=1)
    randomize_questions: Optional[bool] = None
    show_results_immediately: Optional[bool] = None
    allow_review: Optional[bool] = None
    is_active: Optional[bool] = None
    questions: Optional[str] = None  # Backward compatibility

class Assessment(AssessmentBase):
    id: int
    learning_path_id: Optional[int] = None
    module_id: Optional[int] = None
    lesson_id: Optional[int] = None
    questions: Optional[str] = None  # Backward compatibility
    total_points: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    assessment_questions: List[AssessmentQuestion] = []

    class Config:
        from_attributes = True

# User Question Response schemas
class UserQuestionResponseBase(BaseModel):
    response_data: Dict[str, Any] = Field(..., description="User's answer data")
    time_spent: Optional[int] = None  # seconds

class UserQuestionResponseCreate(UserQuestionResponseBase):
    question_id: int

class UserQuestionResponse(UserQuestionResponseBase):
    id: int
    attempt_id: int
    question_id: int
    points_earned: int = 0
    is_correct: Optional[bool] = None
    created_at: datetime
    question: Optional[Question] = None

    class Config:
        from_attributes = True

# User Assessment Attempt schemas
class UserAssessmentAttemptBase(BaseModel):
    pass

class UserAssessmentAttemptCreate(BaseModel):
    assessment_id: int

class UserAssessmentAttemptSubmit(BaseModel):
    responses: List[UserQuestionResponseCreate]

class UserAssessmentAttempt(UserAssessmentAttemptBase):
    id: int
    user_id: int
    assessment_id: int
    answers: Optional[Dict[str, Any]] = None  # Backward compatibility
    score: int = 0  # Percentage
    passed: bool = False
    time_taken: Optional[int] = None  # minutes
    attempt_number: int = 1
    total_points: Optional[int] = None
    points_earned: Optional[int] = None
    status: str = "completed"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    question_responses: List[UserQuestionResponse] = []
    assessment: Optional[Assessment] = None

    class Config:
        from_attributes = True

# Certificate schemas
class CertificateBase(BaseModel):
    user_id: int
    learning_path_id: int
    certificate_name: str
    certificate_url: Optional[str] = None
    is_active: bool = True

class CertificateCreate(CertificateBase):
    pass

class CertificateInDBBase(CertificateBase):
    id: int
    issued_at: datetime

    class Config:
        from_attributes = True

class Certificate(CertificateInDBBase):
    pass

# Glossary Term schemas
class GlossaryTermBase(BaseModel):
    term: str = Field(..., min_length=1, max_length=255)
    definition: str = Field(..., min_length=1)
    category: str = "GENERAL"
    explanation: Optional[str] = None
    example: Optional[str] = None
    related_terms: Optional[str] = None
    is_active: bool = True

class GlossaryTermCreate(GlossaryTermBase):
    pass

class GlossaryTermUpdate(BaseModel):
    term: Optional[str] = Field(None, min_length=1, max_length=255)
    definition: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    explanation: Optional[str] = None
    example: Optional[str] = None
    related_terms: Optional[str] = None
    is_active: Optional[bool] = None

class GlossaryTerm(GlossaryTermBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Response schemas for API endpoints
class QuestionBank(BaseModel):
    questions: List[Question]
    total: int
    page: int
    page_size: int

class AssessmentTaking(BaseModel):
    assessment: Assessment
    questions: List[Question]
    time_remaining: Optional[int] = None  # seconds
    attempt_number: int

class AssessmentResults(BaseModel):
    attempt: UserAssessmentAttempt
    questions: List[Question]
    responses: List[UserQuestionResponse]
    detailed_results: List[Dict[str, Any]]

class AssessmentStats(BaseModel):
    total_assessments: int
    active_assessments: int
    total_questions: int
    total_attempts: int
    average_score: float
    pass_rate: float

# Statistics and analytics schemas
class EducationOverviewStats(BaseModel):
    total_learning_paths: int
    total_modules: int
    total_lessons: int
    total_glossary_terms: int
    total_assessments: int
    total_questions: int
    active_learners: int
    completion_rate: float

# Update forward references
LearningPathWithModules.model_rebuild()
ModuleWithLessons.model_rebuild()
LessonWithAssessments.model_rebuild() 