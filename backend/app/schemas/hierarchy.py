from typing import List, Optional
from pydantic import BaseModel

class OrgTreeNode(BaseModel):
    id: int
    name: str
    email: str
    position_name: str
    hierarchy_level: int
    is_direct: bool = False
    depth: int = 0
    subordinates: List["OrgTreeNode"] = []

OrgTreeNode.model_rebuild()
