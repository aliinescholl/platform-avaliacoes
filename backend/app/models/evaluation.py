from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Evaluation(Base):
    __tablename__ = "evaluation"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    leader_id = Column(Integer, ForeignKey("employee.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("employee.id", ondelete="CASCADE"), nullable=False, index=True)
    period = Column(String(20), nullable=False, index=True) # e.g. "2026-W41"
    final_score = Column(Float, nullable=False) # Weighted score 1.00 to 4.00
    leader_hierarchy_level = Column(Integer, nullable=False) # Depth level in hierarchy (1=CEO, 2=CTO, etc.)
    feedback = Column(Text, nullable=True) # General notes/feedback
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    leader = relationship("Employee", foreign_keys=[leader_id], back_populates="evaluations_given")
    lead = relationship("Employee", foreign_keys=[lead_id], back_populates="evaluations_received")
    answers = relationship("EvaluationAnswer", back_populates="evaluation", cascade="all, delete-orphan", order_by="EvaluationAnswer.id")

    __table_args__ = (
        # Exactly one evaluation allowed per week for each leader-employee pair
        UniqueConstraint("leader_id", "lead_id", "period", name="uq_leader_lead_period"),
    )

class EvaluationAnswer(Base):
    __tablename__ = "evaluation_answer"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    evaluation_id = Column(Integer, ForeignKey("evaluation.id", ondelete="CASCADE"), nullable=False, index=True)
    question_key = Column(String(50), nullable=False)
    question_title = Column(String(150), nullable=False)
    weight = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False) # 1, 2, 3, or 4
    comment = Column(Text, nullable=True)

    evaluation = relationship("Evaluation", back_populates="answers")
