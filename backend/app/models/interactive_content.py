from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class InteractiveLessonType(Base):
    __tablename__ = "interactive_lesson_types"

    id = Column(Integer, primary_key=True, index=True)
    type_key = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    component_name = Column(String(100), nullable=False)
    default_config = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    scenarios = relationship("InteractiveScenario", back_populates="lesson_type", cascade="all, delete-orphan")

class InteractiveScenario(Base):
    __tablename__ = "interactive_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    type_id = Column(Integer, ForeignKey("interactive_lesson_types.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    scenario_data = Column(JSON, nullable=False)
    optimal_choice = Column(String(100), nullable=True)
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    points_possible = Column(Integer, default=10, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    lesson_type = relationship("InteractiveLessonType", back_populates="scenarios")
    questions = relationship("InteractiveQuestion", back_populates="scenario", cascade="all, delete-orphan")
    # Note: lesson relationship will be defined in education.py to avoid circular imports

class InteractiveQuestion(Base):
    __tablename__ = "interactive_questions"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("interactive_scenarios.id", ondelete="CASCADE"), nullable=False)
    question_type = Column(String(50), nullable=False)  # multiple_choice, calculation, drag_drop, etc.
    question_text = Column(Text, nullable=False)
    options_data = Column(JSON, nullable=False)  # Store options, correct answers, etc.
    correct_answer = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=True)
    points = Column(Integer, default=1, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    scenario = relationship("InteractiveScenario", back_populates="questions") 