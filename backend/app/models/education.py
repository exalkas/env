from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, JSON, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.db.base_class import Base

class DifficultyLevel(enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"

class GlossaryCategory(enum.Enum):
    EUA = "EUA"
    EUA2 = "EUA2"
    GOO = "GOO"
    GEO = "GEO"
    CBAM = "CBAM"
    VCM = "VCM"
    BIOFUELS = "BIOFUELS"
    GENERAL = "GENERAL"

class QuestionType(enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    MULTIPLE_SELECT = "multiple_select"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    NUMERIC = "numeric"
    ESSAY = "essay"
    MATCHING = "matching"
    ORDERING = "ordering"

class QuestionDifficulty(enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    level = Column(String(20), nullable=False, default="BEGINNER")
    estimated_duration = Column(Integer, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    modules = relationship("Module", back_populates="learning_path", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="learning_path")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    estimated_duration = Column(Integer, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    learning_path = relationship("LearningPath", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    lesson_type = Column(String(50), nullable=True)
    interactive_type_id = Column(Integer, ForeignKey("interactive_lesson_types.id", ondelete="SET NULL"), nullable=True)
    estimated_duration = Column(Integer, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    module = relationship("Module", back_populates="lessons")
    assessments = relationship("Assessment", back_populates="lesson", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="lesson")
    interactive_type = relationship("InteractiveLessonType", foreign_keys=[interactive_type_id])

class GlossaryTerm(Base):
    __tablename__ = "glossary_terms"

    id = Column(Integer, primary_key=True, index=True)
    term = Column(String(255), nullable=False, unique=True, index=True)
    definition = Column(Text, nullable=False)
    category = Column(String(20), nullable=False, default="GENERAL")
    explanation = Column(Text, nullable=True)
    example = Column(Text, nullable=True)
    related_terms = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# NEW: Question Bank System
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, index=True)
    explanation = Column(Text, nullable=True)
    points = Column(Integer, nullable=False, default=1)
    difficulty_level = Column(String(20), nullable=False, default="MEDIUM", index=True)
    category = Column(String(100), nullable=True, index=True)
    tags = Column(ARRAY(String), nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    assessment_questions = relationship("AssessmentQuestion", back_populates="question", cascade="all, delete-orphan")
    user_responses = relationship("UserQuestionResponse", back_populates="question")

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    explanation = Column(Text, nullable=True)

    # Relationships
    question = relationship("Question", back_populates="options")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    questions = Column(Text, nullable=True)  # Keep for backward compatibility
    passing_score = Column(Integer, nullable=False, default=70)
    time_limit = Column(Integer, nullable=True)
    max_attempts = Column(Integer, nullable=False, default=3)
    total_points = Column(Integer, nullable=True)
    randomize_questions = Column(Boolean, default=False)
    show_results_immediately = Column(Boolean, default=True)
    allow_review = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    lesson = relationship("Lesson", back_populates="assessments")
    user_assessment_attempts = relationship("UserAssessmentAttempt", back_populates="assessment")
    assessment_questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    sort_order = Column(Integer, default=0)
    points = Column(Integer, default=1)

    # Relationships
    assessment = relationship("Assessment", back_populates="assessment_questions")
    question = relationship("Question", back_populates="assessment_questions")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=True)
    module_id = Column(Integer, nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    status = Column(String(50), nullable=True)
    progress_percentage = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="learning_progress")
    learning_path = relationship("LearningPath", back_populates="user_progress")
    lesson = relationship("Lesson", back_populates="user_progress")

class UserAssessmentAttempt(Base):
    __tablename__ = "user_assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    answers = Column(JSON, nullable=True)  # Keep for backward compatibility
    score = Column(Integer, nullable=False, default=0)  # Percentage score
    passed = Column(Boolean, nullable=False, default=False)
    time_taken = Column(Integer, nullable=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    total_points = Column(Integer, nullable=True)
    points_earned = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="completed")  # completed, in_progress, abandoned
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="assessment_attempts")
    assessment = relationship("Assessment", back_populates="user_assessment_attempts")
    question_responses = relationship("UserQuestionResponse", back_populates="attempt", cascade="all, delete-orphan")

class UserQuestionResponse(Base):
    __tablename__ = "user_question_responses"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("user_assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    response_data = Column(JSONB, nullable=False)  # Stores actual answers in structured format
    points_earned = Column(Integer, default=0)
    is_correct = Column(Boolean, nullable=True)
    time_spent = Column(Integer, nullable=True)  # seconds spent on this question
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    attempt = relationship("UserAssessmentAttempt", back_populates="question_responses")
    question = relationship("Question", back_populates="user_responses")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    certificate_name = Column(String(255), nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    certificate_url = Column(String(500), nullable=True)  # URL to generated certificate
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="certificates")
    learning_path = relationship("LearningPath")

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(10), nullable=False, default="🏆")
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="achievements")
    learning_path = relationship("LearningPath") 