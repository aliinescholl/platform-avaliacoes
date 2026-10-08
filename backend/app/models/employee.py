from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employee"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    position_name = Column(String(100), nullable=False)

    # Relationships
    evaluations_given = relationship(
        "Evaluation",
        foreign_keys="Evaluation.leader_id",
        back_populates="leader",
        cascade="all, delete-orphan"
    )
    evaluations_received = relationship(
        "Evaluation",
        foreign_keys="Evaluation.lead_id",
        back_populates="lead",
        cascade="all, delete-orphan"
    )
