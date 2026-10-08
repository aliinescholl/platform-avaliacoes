from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_leader_id
from app.models.employee import Employee
from app.models.leader_lead import LeaderLead
from app.schemas.employee import LeaderSummary
from app.schemas.hierarchy import OrgTreeNode
from app.services.hierarchy_service import HierarchyService

router = APIRouter(prefix="/leaders", tags=["Liderança & Hierarquia"])

@router.get("", response_model=List[LeaderSummary], summary="Listar todos os colaboradores e sua elegibilidade como líder")
def list_leaders(db: Session = Depends(get_db)):
    """
    Lista todos os colaboradores da organização com contadores de subordinados diretos e totais,
    além do nível hierárquico (Nível 1 = CEO, Nível 2 = C-Level, etc).
    Permite ao usuário alternar facilmente entre diferentes líderes na plataforma.
    """
    employees = db.query(Employee).order_by(Employee.id.asc()).all()
    levels = HierarchyService.get_all_hierarchy_levels(db)

    # Precalculate direct counts
    direct_edges = db.query(LeaderLead).all()
    direct_counts = {}
    for edge in direct_edges:
        direct_counts[edge.leader_id] = direct_counts.get(edge.leader_id, 0) + 1

    results = []
    for emp in employees:
        sub_info = HierarchyService.get_subordinates_info(db, emp.id)
        total_sub_count = len(sub_info)
        direct_sub_count = direct_counts.get(emp.id, 0)

        results.append(LeaderSummary(
            id=emp.id,
            name=emp.name,
            email=emp.email,
            position_name=emp.position_name,
            hierarchy_level=levels.get(emp.id, 99),
            direct_subordinates_count=direct_sub_count,
            total_subordinates_count=total_sub_count,
            is_leader=(direct_sub_count > 0 or total_sub_count > 0)
        ))

    # Sort leaders first, then by hierarchy level ASC, then name
    results.sort(key=lambda x: (not x.is_leader, x.hierarchy_level, x.name))
    return results

@router.get("/me", response_model=LeaderSummary, summary="Obter dados da liderança atualmente selecionada")
def get_current_leader_info(
    current_leader_id: int = Depends(get_current_leader_id),
    db: Session = Depends(get_db)
):
    """Retorna os dados do líder ativo identificado pelo header X-Leader-Id ou Cookie."""
    emp = db.query(Employee).filter(Employee.id == current_leader_id).first()
    levels = HierarchyService.get_all_hierarchy_levels(db)
    sub_info = HierarchyService.get_subordinates_info(db, current_leader_id)
    direct_count = sum(1 for s in sub_info if s["is_direct"])

    return LeaderSummary(
        id=emp.id,
        name=emp.name,
        email=emp.email,
        position_name=emp.position_name,
        hierarchy_level=levels.get(emp.id, 99),
        direct_subordinates_count=direct_count,
        total_subordinates_count=len(sub_info),
        is_leader=(len(sub_info) > 0)
    )

@router.get("/hierarchy-tree", response_model=OrgTreeNode, summary="Visualizar árvore hierárquica do líder ativo")
def get_hierarchy_tree(
    current_leader_id: int = Depends(get_current_leader_id),
    db: Session = Depends(get_db)
):
    """
    Retorna a árvore organizacional completa sob a liderança do usuário ativo,
    mostrando ramificações diretas e indiretas para visualização em organograma.
    """
    return HierarchyService.build_tree_for_leader(db, current_leader_id)
