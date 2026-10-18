from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# Interactive Lesson Type schemas
class InteractiveLessonTypeBase(BaseModel):
    type_key: str
    display_name: str
    description: Optional[str] = None
    component_name: str
    default_config: Optional[Dict[str, Any]] = None
    is_active: bool = True

class InteractiveLessonTypeCreate(InteractiveLessonTypeBase):
    pass

class InteractiveLessonTypeUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    component_name: Optional[str] = None
    default_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class InteractiveLessonType(InteractiveLessonTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Interactive Question schemas
class InteractiveQuestionBase(BaseModel):
    question_type: str
    question_text: str
    options_data: Dict[str, Any]
    correct_answer: str
    explanation: Optional[str] = None
    points: int = 1
    order_index: int = 0
    is_active: bool = True

class InteractiveQuestionCreate(InteractiveQuestionBase):
    scenario_id: int

class InteractiveQuestionUpdate(BaseModel):
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    options_data: Optional[Dict[str, Any]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    points: Optional[int] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

class InteractiveQuestion(InteractiveQuestionBase):
    id: int
    scenario_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Interactive Scenario schemas
class InteractiveScenarioBase(BaseModel):
    title: str
    description: Optional[str] = None
    scenario_data: Dict[str, Any]
    optimal_choice: Optional[str] = None
    explanation: Optional[str] = None
    order_index: int = 0
    points_possible: int = 10
    is_active: bool = True

class InteractiveScenarioCreate(InteractiveScenarioBase):
    lesson_id: int
    type_id: int
    questions: Optional[List[InteractiveQuestionCreate]] = []

class InteractiveScenarioUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scenario_data: Optional[Dict[str, Any]] = None
    optimal_choice: Optional[str] = None
    explanation: Optional[str] = None
    order_index: Optional[int] = None
    points_possible: Optional[int] = None
    is_active: Optional[bool] = None

class InteractiveScenario(InteractiveScenarioBase):
    id: int
    lesson_id: int
    type_id: int
    created_at: datetime
    updated_at: datetime
    lesson_type: Optional[InteractiveLessonType] = None
    questions: List[InteractiveQuestion] = []

    class Config:
        from_attributes = True

# Lesson with interactive content
class LessonWithInteractiveContent(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    lesson_type: str
    is_interactive: bool
    interactive_scenarios: List[InteractiveScenario] = []

    class Config:
        from_attributes = True

# Request schemas for building interactive content
class InteractiveContentBuilder(BaseModel):
    """Schema for building complete interactive lessons"""
    lesson_id: int
    interactive_type_key: str
    scenarios: List[InteractiveScenarioCreate]

class InteractiveContentPreview(BaseModel):
    """Schema for previewing interactive content before saving"""
    component_name: str
    config: Dict[str, Any]
    scenarios: List[Dict[str, Any]]

# Response schemas
class InteractiveContentSummary(BaseModel):
    total_scenarios: int
    total_questions: int
    total_points: int
    completion_time_estimate: int  # in minutes
    difficulty_level: str

class InteractiveLessonTypesResponse(BaseModel):
    types: List[InteractiveLessonType]
    total: int

class InteractiveScenariosResponse(BaseModel):
    scenarios: List[InteractiveScenario]
    total: int
    summary: Optional[InteractiveContentSummary] = None 