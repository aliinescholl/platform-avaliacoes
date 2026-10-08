from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint
from app.core.database import Base

class LeaderLead(Base):
    __tablename__ = "leader_lead"

    leader_id = Column(
        Integer,
        ForeignKey("employee.id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )
    lead_id = Column(
        Integer,
        ForeignKey("employee.id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )

    __table_args__ = (
        CheckConstraint("leader_id <> lead_id", name="chk_no_self_lead"),
    )
