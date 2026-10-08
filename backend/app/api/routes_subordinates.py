from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_leader_id
from app.schemas.evaluation import SubordinateStatus
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/subordinates", tags=["Subordinados & Equipe"])

@router.get("", response_model=List[SubordinateStatus], summary="Listar subordinados elegíveis para avaliação")
def list_subordinates(
    period: Optional[str] = Query(None, description="Período semanal (ex: 2026-W41). Padrão: semana atual"),
    current_leader_id: int = Depends(get_current_leader_id),
    db: Session = Depends(get_db)
):
    """
    Retorna todos os colaboradores que fazem parte da hierarquia do líder ativo
    (subordinados diretos e indiretos).
    Inclui status da avaliação nesta semana, nota prevalente da hierarquia,
    e indicadores de relacionamento hierárquico.
    
    SEGURANÇA:
    - O próprio líder NÃO aparece nesta lista.
    - Pares do líder NÃO aparecem nesta lista.
    - Superiores do líder NÃO aparecem nesta lista.
    """
    return EvaluationService.get_subordinates_overview(
        db=db,
        current_leader_id=current_leader_id,
        period=period
    )
