from typing import Optional
from pydantic import BaseModel, ConfigDict

class EmployeeBase(BaseModel):
    id: int
    name: str
    email: str
    position_name: str

class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

class LeaderSummary(EmployeeBase):
    hierarchy_level: int
    direct_subordinates_count: int
    total_subordinates_count: int
    is_leader: bool

    model_config = ConfigDict(from_attributes=True)
