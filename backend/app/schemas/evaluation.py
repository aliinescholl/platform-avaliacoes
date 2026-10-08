from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class EvaluationAnswerCreate(BaseModel):
    question_key: str
    score: int = Field(..., ge=1, le=4, description="Score between 1 and 4")
    comment: Optional[str] = None

class EvaluationCreate(BaseModel):
    lead_id: int
    period: Optional[str] = None # Defaults to current period YYYY-Www if not supplied
    answers: List[EvaluationAnswerCreate]
    feedback: Optional[str] = None

class EvaluationAnswerResponse(BaseModel):
    id: int
    question_key: str
    question_title: str
    weight: int
    score: int
    comment: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EvaluationResponse(BaseModel):
    id: int
    leader_id: int
    leader_name: str
    leader_position: str
    leader_hierarchy_level: int
    lead_id: int
    lead_name: str
    lead_position: str
    period: str
    final_score: float
    feedback: Optional[str] = None
    created_at: datetime
    is_prevailing: bool = False
    answers: List[EvaluationAnswerResponse] = []

    model_config = ConfigDict(from_attributes=True)

class SubordinateStatus(BaseModel):
    id: int
    name: str
    email: str
    position_name: str
    depth: int # 1 = direct subordinate, >1 = indirect subordinate
    is_direct: bool
    direct_leader_id: Optional[int] = None
    direct_leader_name: Optional[str] = None
    hierarchy_level: int
    # Evaluation status for current week
    evaluated_by_current_leader_this_week: bool
    current_leader_evaluation_id: Optional[int] = None
    # Prevailing evaluation (highest hierarchy) for current week
    prevailing_score_this_week: Optional[float] = None
    prevailing_leader_name_this_week: Optional[str] = None
    prevailing_leader_level_this_week: Optional[int] = None
    prevailing_evaluation_id_this_week: Optional[int] = None
    # Overall latest evaluation
    latest_score: Optional[float] = None
    latest_period: Optional[str] = None
    latest_evaluator_name: Optional[str] = None
    total_evaluations_count: int = 0

class QuestionDefinition(BaseModel):
    key: str
    title: str
    weight: int
    description: str

class ScoreScaleInfo(BaseModel):
    score: int
    label: str
    description: str
