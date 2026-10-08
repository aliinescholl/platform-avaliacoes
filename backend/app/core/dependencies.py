from typing import Optional
from fastapi import Cookie, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.employee import Employee

def get_current_leader_id(
    x_leader_id: Optional[int] = Header(None, alias="X-Leader-Id", description="ID do líder atual"),
    cookie_leader_id: Optional[int] = Cookie(None, alias="leader_id", description="Cookie do líder atual"),
    query_leader_id: Optional[int] = Query(None, alias="current_leader_id", description="ID do líder via query param"),
    db: Session = Depends(get_db)
) -> int:
    """
    Identifies which leader is performing the request.
    Supports Header (X-Leader-Id), Cookie (leader_id), or Query Param.
    """
    leader_id = x_leader_id or cookie_leader_id or query_leader_id
    if not leader_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificação de liderança obrigatória. Por favor, forneça o cabeçalho 'X-Leader-Id', cookie 'leader_id' ou utilize o seletor de líder."
        )

    # Validate employee exists
    leader = db.query(Employee).filter(Employee.id == leader_id).first()
    if not leader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Líder com ID {leader_id} não foi encontrado no sistema."
        )

    return leader_id
