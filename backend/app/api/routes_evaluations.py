from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_leader_id
from app.schemas.evaluation import EvaluationCreate, EvaluationResponse
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/evaluations", tags=["Avaliações"])

@router.post("", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED, summary="Submeter nova avaliação semanal")
def create_evaluation(
    payload: EvaluationCreate,
    current_leader_id: int = Depends(get_current_leader_id),
    db: Session = Depends(get_db)
):
    """
    Submete a avaliação semanal para um funcionário que faz parte da hierarquia do líder.
    
    Regras de Negócio e Validações:
    1. Notas de 1 a 4 com pesos ponderados oficiais.
    2. Após o envio, as respostas NÃO podem ser alteradas (imutabilidade).
    3. Permitida exatamente UMA avaliação por semana para cada par líder-funcionário.
    4. Líderes podem avaliar seus liderados diretos e indiretos (mesmo que um subordinado já o tenha avaliado no período).
    5. Vedado avaliar a si mesmo, seus pares ou superiores.
    """
    created_eval = EvaluationService.create_evaluation(
        db=db,
        current_leader_id=current_leader_id,
        evaluation_data=payload
    )

    # Return full detail of created evaluation
    return EvaluationService.get_evaluation_by_id(
        db=db,
        current_leader_id=current_leader_id,
        evaluation_id=created_eval.id
    )

@router.get("/employee/{employee_id}", response_model=List[EvaluationResponse], summary="Consultar histórico de avaliações de um liderado")
def get_employee_evaluations(
    employee_id: int,
    period: Optional[str] = Query(None, description="Filtrar por período específico (ex: 2026-W41)"),
    current_leader_id: int = Depends(get_current_leader_id),
    db: Session = Depends(get_db)
):
    """
    Retorna o histórico de avaliações do funcionário indicado.
    Identifica qual avaliação prevalece em cada período ('is_prevailing: true'),
    respeitando SEMPRE a maior hierarquia (maior autoridade na árvore organizacional).
    
    SEGURANÇA:
    - Retorna HTTP 403 Forbidden caso o usuário tente visualizar sua própria avaliação.
    - Retorna HTTP 403 Forbidden caso o usuário tente visualizar avaliações de pares ou superiores.
    - Apenas avaliações de subordinados (diretos ou indiretos) são acessíveis.
    """
    return EvaluationService.get_employee_evaluations(
        db=db,
        current_leader_id=current_leader_id,
        target_employee_id=employee_id,
        period=period
    )

@router.get("/{evaluation_id}", response_model=EvaluationResponse, summary="Obter detalhes de uma avaliação por ID")
def get_evaluation_by_id(
    evaluation_id: int,
    current_leader_id: int = Depends(get_current_leader_id),
    db: Session = Depends(get_db)
):
    """Retorna detalhes completos de uma avaliação específica, validando permissão de visualização."""
    return EvaluationService.get_evaluation_by_id(
        db=db,
        current_leader_id=current_leader_id,
        evaluation_id=evaluation_id
    )
