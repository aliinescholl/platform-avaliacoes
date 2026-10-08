from datetime import datetime
from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.questions import QUESTIONS_CONFIG
from app.models.employee import Employee
from app.models.evaluation import Evaluation, EvaluationAnswer
from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationResponse,
    EvaluationAnswerResponse,
    SubordinateStatus
)
from app.services.hierarchy_service import HierarchyService

class EvaluationService:
    @staticmethod
    def calculate_weighted_score(answers: List[dict]) -> float:
        """
        Calculates the weighted average score from 1.00 to 4.00.
        Formula: Sum(score * weight) / Sum(weight)
        Weights sum to 100:
        - Results Delivery: 25
        - Execution Quality: 20
        - Learning Capacity: 20
        - Problem Solving: 15
        - Collaboration & Leadership: 10
        - Strategic Vision: 10
        """
        weights_map = {q["key"]: q["weight"] for q in QUESTIONS_CONFIG}
        total_weighted_points = 0.0
        total_weight = 0

        for a in answers:
            key = a["question_key"]
            score = a["score"]
            weight = weights_map[key]
            total_weighted_points += score * weight
            total_weight += weight

        if total_weight == 0:
            return 0.0

        return round(total_weighted_points / total_weight, 2)

    @staticmethod
    def create_evaluation(
        db: Session,
        current_leader_id: int,
        evaluation_data: EvaluationCreate
    ) -> Evaluation:
        period = evaluation_data.period or settings.get_current_period()
        lead_id = evaluation_data.lead_id

        # Rule 1: A leader cannot evaluate themselves
        if current_leader_id == lead_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Um líder não pode avaliar a si próprio."
            )

        # Rule 2: The evaluated employee must be in current leader's hierarchy (direct or indirect)
        if not HierarchyService.is_subordinate(db, current_leader_id, lead_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode avaliar colaboradores que pertencem à sua hierarquia (direta ou indireta)."
            )

        # Rule 3: Frequency limit - exactly 1 evaluation per week for each leader-lead pair
        existing = db.query(Evaluation).filter(
            Evaluation.leader_id == current_leader_id,
            Evaluation.lead_id == lead_id,
            Evaluation.period == period
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Você já enviou uma avaliação para este colaborador no período semanal ({period}). Respostas são imutáveis e permitidas apenas uma por semana."
            )

        # Rule 4: Validate all 6 questions are answered and valid
        questions_dict = {q["key"]: q for q in QUESTIONS_CONFIG}
        submitted_keys = set()
        answers_payload = []

        for item in evaluation_data.answers:
            if item.question_key not in questions_dict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Questão inválida: {item.question_key}"
                )
            if item.question_key in submitted_keys:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Questão duplicada no envio: {item.question_key}"
                )
            if not (1 <= item.score <= 4):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A nota para a questão {item.question_key} deve ser um número inteiro de 1 a 4."
                )

            submitted_keys.add(item.question_key)
            q_meta = questions_dict[item.question_key]
            answers_payload.append({
                "question_key": item.question_key,
                "question_title": q_meta["title"],
                "weight": q_meta["weight"],
                "score": item.score,
                "comment": item.comment
            })

        if len(submitted_keys) != len(QUESTIONS_CONFIG):
            missing = set(questions_dict.keys()) - submitted_keys
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Todas as 6 questões obrigatórias devem ser respondidas. Faltando: {', '.join(missing)}"
            )

        # Calculate weighted score
        final_score = EvaluationService.calculate_weighted_score(answers_payload)

        # Get leader's hierarchy level
        leader_level = HierarchyService.get_employee_hierarchy_level(db, current_leader_id)

        # Create evaluation record
        evaluation = Evaluation(
            leader_id=current_leader_id,
            lead_id=lead_id,
            period=period,
            final_score=final_score,
            leader_hierarchy_level=leader_level,
            feedback=evaluation_data.feedback,
            created_at=datetime.utcnow()
        )
        db.add(evaluation)
        db.flush() # Populate evaluation.id

        # Insert answer records
        for a in answers_payload:
            answer_record = EvaluationAnswer(
                evaluation_id=evaluation.id,
                question_key=a["question_key"],
                question_title=a["question_title"],
                weight=a["weight"],
                score=a["score"],
                comment=a["comment"]
            )
            db.add(answer_record)

        db.commit()
        db.refresh(evaluation)
        return evaluation

    @staticmethod
    def get_subordinates_overview(
        db: Session,
        current_leader_id: int,
        period: Optional[str] = None
    ) -> List[SubordinateStatus]:
        """
        Returns list of all subordinates (direct and indirect) visible to current_leader_id,
        enriched with status for the given period (or current week) and prevailing evaluation.
        """
        active_period = period or settings.get_current_period()
        subordinates = HierarchyService.get_subordinates_info(db, current_leader_id)

        if not subordinates:
            return []

        sub_ids = [s["employee"].id for s in subordinates]

        # Fetch all evaluations for these subordinates
        all_evals = db.query(Evaluation).filter(
            Evaluation.lead_id.in_(sub_ids)
        ).order_by(Evaluation.created_at.desc()).all()

        # Group evaluations by lead_id
        evals_by_lead: Dict[int, List[Evaluation]] = {}
        for ev in all_evals:
            evals_by_lead.setdefault(ev.lead_id, []).append(ev)

        # Preload leader employees for fast lookup
        all_leader_ids = list({ev.leader_id for ev in all_evals})
        leaders_map = {
            e.id: e for e in db.query(Employee).filter(Employee.id.in_(all_leader_ids)).all()
        }

        results: List[SubordinateStatus] = []

        for sub in subordinates:
            emp = sub["employee"]
            emp_evals = evals_by_lead.get(emp.id, [])

            # Check evaluations for active_period
            period_evals = [e for e in emp_evals if e.period == active_period]

            # Did current leader evaluate this week?
            my_eval = next((e for e in period_evals if e.leader_id == current_leader_id), None)
            evaluated_by_me = my_eval is not None

            # Prevailing evaluation for active_period respecting highest hierarchy
            # (lowest leader_hierarchy_level wins; tiebreak: most recent)
            prevailing_period_eval = None
            if period_evals:
                prevailing_period_eval = min(
                    period_evals,
                    key=lambda e: (e.leader_hierarchy_level, -e.created_at.timestamp())
                )

            prev_leader = leaders_map.get(prevailing_period_eval.leader_id) if prevailing_period_eval else None

            # Overall latest evaluation
            latest_eval = emp_evals[0] if emp_evals else None
            latest_leader = leaders_map.get(latest_eval.leader_id) if latest_eval else None

            results.append(SubordinateStatus(
                id=emp.id,
                name=emp.name,
                email=emp.email,
                position_name=emp.position_name,
                depth=sub["depth"],
                is_direct=sub["is_direct"],
                direct_leader_id=sub["direct_leader_id"],
                direct_leader_name=sub["direct_leader_name"],
                hierarchy_level=sub["hierarchy_level"],
                evaluated_by_current_leader_this_week=evaluated_by_me,
                current_leader_evaluation_id=my_eval.id if my_eval else None,
                prevailing_score_this_week=prevailing_period_eval.final_score if prevailing_period_eval else None,
                prevailing_leader_name_this_week=prev_leader.name if prev_leader else None,
                prevailing_leader_level_this_week=prevailing_period_eval.leader_hierarchy_level if prevailing_period_eval else None,
                prevailing_evaluation_id_this_week=prevailing_period_eval.id if prevailing_period_eval else None,
                latest_score=latest_eval.final_score if latest_eval else None,
                latest_period=latest_eval.period if latest_eval else None,
                latest_evaluator_name=latest_leader.name if latest_leader else None,
                total_evaluations_count=len(emp_evals)
            ))

        return results

    @staticmethod
    def get_employee_evaluations(
        db: Session,
        current_leader_id: int,
        target_employee_id: int,
        period: Optional[str] = None
    ) -> List[EvaluationResponse]:
        """
        Returns evaluations for target_employee_id.
        SECURITY: current_leader_id MUST have target_employee_id in their hierarchy.
        It is STRICTLY FORBIDDEN to view self, peer, or superior evaluations.
        """
        # Security check: User cannot see their own evaluations
        if current_leader_id == target_employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: É vedado ao usuário visualizar a sua própria avaliação."
            )

        # Security check: User can only see direct or indirect subordinates
        if not HierarchyService.is_subordinate(db, current_leader_id, target_employee_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: Você só pode visualizar avaliações de colaboradores da sua própria hierarquia (subordinados diretos ou indiretos). Pares e superiores não são visíveis."
            )

        query = db.query(Evaluation).filter(Evaluation.lead_id == target_employee_id)
        if period:
            query = query.filter(Evaluation.period == period)

        evaluations = query.order_by(Evaluation.created_at.desc()).all()
        if not evaluations:
            return []

        # Find prevailing evaluation per period (respecting highest hierarchy)
        prevailing_by_period: Dict[str, int] = {}
        evals_by_period: Dict[str, List[Evaluation]] = {}
        for ev in evaluations:
            evals_by_period.setdefault(ev.period, []).append(ev)

        for p, ev_list in evals_by_period.items():
            top = min(ev_list, key=lambda e: (e.leader_hierarchy_level, -e.created_at.timestamp()))
            prevailing_by_period[p] = top.id

        # Preload employees
        leader_ids = [e.leader_id for e in evaluations]
        lead_ids = [e.lead_id for e in evaluations]
        all_emp_ids = list(set(leader_ids + lead_ids))
        emp_map = {e.id: e for e in db.query(Employee).filter(Employee.id.in_(all_emp_ids)).all()}

        responses: List[EvaluationResponse] = []
        for ev in evaluations:
            ldr = emp_map.get(ev.leader_id)
            lead = emp_map.get(ev.lead_id)
            answers = [
                EvaluationAnswerResponse(
                    id=a.id,
                    question_key=a.question_key,
                    question_title=a.question_title,
                    weight=a.weight,
                    score=a.score,
                    comment=a.comment
                )
                for a in ev.answers
            ]

            responses.append(EvaluationResponse(
                id=ev.id,
                leader_id=ev.leader_id,
                leader_name=ldr.name if ldr else "Desconhecido",
                leader_position=ldr.position_name if ldr else "",
                leader_hierarchy_level=ev.leader_hierarchy_level,
                lead_id=ev.lead_id,
                lead_name=lead.name if lead else "Desconhecido",
                lead_position=lead.position_name if lead else "",
                period=ev.period,
                final_score=ev.final_score,
                feedback=ev.feedback,
                created_at=ev.created_at,
                is_prevailing=(ev.id == prevailing_by_period.get(ev.period)),
                answers=answers
            ))

        return responses

    @staticmethod
    def get_evaluation_by_id(
        db: Session,
        current_leader_id: int,
        evaluation_id: int
    ) -> EvaluationResponse:
        """
        Fetches single evaluation by ID with security checks.
        """
        ev = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not ev:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avaliação não encontrada.")

        # Check permission to view lead
        if current_leader_id == ev.lead_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: É vedado ao usuário visualizar a sua própria avaliação."
            )

        if not HierarchyService.is_subordinate(db, current_leader_id, ev.lead_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: Você não possui permissão para visualizar esta avaliação."
            )

        # Check if prevailing in its period
        period_evals = db.query(Evaluation).filter(
            Evaluation.lead_id == ev.lead_id,
            Evaluation.period == ev.period
        ).all()
        top_eval = min(period_evals, key=lambda e: (e.leader_hierarchy_level, -e.created_at.timestamp()))

        ldr = db.query(Employee).filter(Employee.id == ev.leader_id).first()
        lead = db.query(Employee).filter(Employee.id == ev.lead_id).first()

        answers = [
            EvaluationAnswerResponse(
                id=a.id,
                question_key=a.question_key,
                question_title=a.question_title,
                weight=a.weight,
                score=a.score,
                comment=a.comment
            )
            for a in ev.answers
        ]

        return EvaluationResponse(
            id=ev.id,
            leader_id=ev.leader_id,
            leader_name=ldr.name if ldr else "Desconhecido",
            leader_position=ldr.position_name if ldr else "",
            leader_hierarchy_level=ev.leader_hierarchy_level,
            lead_id=ev.lead_id,
            lead_name=lead.name if lead else "Desconhecido",
            lead_position=lead.position_name if lead else "",
            period=ev.period,
            final_score=ev.final_score,
            feedback=ev.feedback,
            created_at=ev.created_at,
            is_prevailing=(ev.id == top_eval.id),
            answers=answers
        )
