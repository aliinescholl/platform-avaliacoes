import os
from datetime import datetime, timedelta
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.models.employee import Employee
from app.models.leader_lead import LeaderLead
from app.models.evaluation import Evaluation, EvaluationAnswer
from app.core.questions import QUESTIONS_CONFIG
from app.core.config import settings

# Sample employees from dump
EMPLOYEES_DATA = [
    ( 1, 'Alice Hartman',    'alice.hartman@company.com',    'CEO'),
    ( 2, 'Bob Sinclair',     'bob.sinclair@company.com',     'CTO'),
    ( 3, 'Carol Nguyen',     'carol.nguyen@company.com',     'CFO'),
    ( 4, 'David Okafor',     'david.okafor@company.com',     'Engineering Manager'),
    ( 5, 'Eva Müller',       'eva.muller@company.com',       'Engineering Manager'),
    ( 6, 'Frank Rossi',      'frank.rossi@company.com',      'Product Manager'),
    ( 7, 'Grace Kim',        'grace.kim@company.com',        'UX Designer'),
    ( 8, 'Henry Patel',      'henry.patel@company.com',      'Senior Software Engineer'),
    ( 9, 'Isabelle Dubois',  'isabelle.dubois@company.com',  'Senior Software Engineer'),
    (10, 'James Watanabe',   'james.watanabe@company.com',   'Software Engineer'),
    (11, 'Karen Oliveira',   'karen.oliveira@company.com',   'Software Engineer'),
    (12, 'Liam Johansson',   'liam.johansson@company.com',   'Software Engineer'),
    (13, 'Mia Fernandez',    'mia.fernandez@company.com',    'Data Engineer'),
    (14, 'Noah Chukwu',      'noah.chukwu@company.com',      'Data Analyst'),
    (15, 'Olivia Brooks',    'olivia.brooks@company.com',    'QA Engineer'),
    (16, 'Paul Nakamura',    'paul.nakamura@company.com',    'QA Engineer'),
    (17, 'Quinn Santos',     'quinn.santos@company.com',     'DevOps Engineer'),
    (18, 'Rachel Ivanova',   'rachel.ivanova@company.com',   'Finance Analyst'),
    (19, 'Samuel Osei',      'samuel.osei@company.com',      'Finance Analyst'),
    (20, 'Tina Bergmann',    'tina.bergmann@company.com',    'HR Specialist')
]

# Hierarchy edges (leader_id, lead_id)
LEADER_LEAD_DATA = [
    # Alice (1)
    (1,  2),   # Alice → Bob
    (1,  3),   # Alice → Carol
    (1,  6),   # Alice → Frank
    (1, 20),   # Alice → Tina

    # Bob (2)
    (2,  4),   # Bob → David
    (2,  5),   # Bob → Eva
    (2,  7),   # Bob → Grace
    (2, 17),   # Bob → Quinn
    (2, 16),   # Bob → Paul

    # David (4)
    (4,  8),   # David → Henry
    (4, 12),   # David → Liam

    # Henry (8)
    (8, 10),   # Henry → James
    (8, 11),   # Henry → Karen

    # Eva (5)
    (5,  9),   # Eva → Isabelle
    (5, 13),   # Eva → Mia
    (5, 14),   # Eva → Noah

    # Carol (3)
    (3, 18),   # Carol → Rachel
    (3, 19),   # Carol → Samuel

    # Frank (6)
    (6, 15),   # Frank → Olivia
]

def init_db(seed_evaluations: bool = True):
    print("Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if employees already exist
        count = db.query(Employee).count()
        if count == 0:
            print("Populando 20 colaboradores do dump oficial...")
            for emp_id, name, email, pos in EMPLOYEES_DATA:
                emp = Employee(id=emp_id, name=name, email=email, position_name=pos)
                db.add(emp)
            db.commit()

            print("Populando relacionamentos de liderança (leader_lead)...")
            for ldr_id, ld_id in LEADER_LEAD_DATA:
                rel = LeaderLead(leader_id=ldr_id, lead_id=ld_id)
                db.add(rel)
            db.commit()

            # Handle postgres sequence reset if postgres
            if not settings.DATABASE_URL.startswith("sqlite"):
                try:
                    db.execute(text("SELECT setval('employee_id_seq', 20);"))
                    db.commit()
                except Exception:
                    pass

        # Check if sample evaluations exist to demonstrate features
        eval_count = db.query(Evaluation).count()
        if eval_count == 0 and seed_evaluations:
            print("Inserindo avaliações de exemplo para demonstração das regras de negócio...")
            current_period = settings.get_current_period()
            
            # Helper to calculate score
            def calc_score(scores):
                weights = [25, 20, 20, 15, 10, 10]
                return round(sum(s * w for s, w in zip(scores, weights)) / 100.0, 2)

            # Scenario 1: Henry (Sr Dev, Level 4) evaluates James (Dev, Level 5) in current week
            # AND David (Eng Mgr, Level 3, higher hierarchy) ALSO evaluates James in the same week!
            # This demonstrates:
            # 1. Multiple leaders evaluating the same subordinate in the same period.
            # 2. David's evaluation is prevailing because David has higher hierarchy (Level 3 < Level 4).
            
            # Henry's evaluation of James
            henry_scores = [3, 4, 3, 3, 4, 3] # Score = 3.3
            henry_eval = Evaluation(
                leader_id=8, # Henry
                lead_id=10,  # James
                period=current_period,
                final_score=calc_score(henry_scores),
                leader_hierarchy_level=4,
                feedback="James demonstra excelente capacidade de aprendizado e colaboração no dia a dia do time.",
                created_at=datetime.utcnow() - timedelta(hours=5)
            )
            db.add(henry_eval)
            db.flush()

            for q, s in zip(QUESTIONS_CONFIG, henry_scores):
                db.add(EvaluationAnswer(
                    evaluation_id=henry_eval.id,
                    question_key=q["key"],
                    question_title=q["title"],
                    weight=q["weight"],
                    score=s,
                    comment="Atende muito bem ao escopo definido."
                ))

            # David's evaluation of James (David is Henry's manager - higher hierarchy!)
            david_scores = [4, 4, 4, 3, 3, 3] # Score = 3.65
            david_eval = Evaluation(
                leader_id=4, # David Okafor (Eng Manager, Level 3)
                lead_id=10,  # James Watanabe
                period=current_period,
                final_score=calc_score(david_scores),
                leader_hierarchy_level=3,
                feedback="Visão de liderança de engenharia: James superou expectativas nas entregas críticas do sprint e demonstrou alta consistência técnica.",
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
            db.add(david_eval)
            db.flush()

            for q, s in zip(QUESTIONS_CONFIG, david_scores):
                db.add(EvaluationAnswer(
                    evaluation_id=david_eval.id,
                    question_key=q["key"],
                    question_title=q["title"],
                    weight=q["weight"],
                    score=s,
                    comment="Excelente desempenho sob a perspectiva da gerência."
                ))

            # David evaluates Henry (direct lead)
            david_henry_scores = [4, 4, 3, 4, 4, 3]
            david_henry_eval = Evaluation(
                leader_id=4,
                lead_id=8,
                period=current_period,
                final_score=calc_score(david_henry_scores),
                leader_hierarchy_level=3,
                feedback="Henry tem sido um pilar na mentoria dos engenheiros plenos e juniores.",
                created_at=datetime.utcnow() - timedelta(hours=3)
            )
            db.add(david_henry_eval)
            db.flush()

            for q, s in zip(QUESTIONS_CONFIG, david_henry_scores):
                db.add(EvaluationAnswer(
                    evaluation_id=david_henry_eval.id,
                    question_key=q["key"],
                    question_title=q["title"],
                    weight=q["weight"],
                    score=s
                ))

            # Historical evaluation from previous week (2026-W40)
            past_period = "2026-W40"
            past_scores = [3, 3, 3, 3, 3, 3]
            past_eval = Evaluation(
                leader_id=8,
                lead_id=10,
                period=past_period,
                final_score=calc_score(past_scores),
                leader_hierarchy_level=4,
                feedback="Avaliação da semana anterior. Desempenho sólido e consistente.",
                created_at=datetime.utcnow() - timedelta(days=7)
            )
            db.add(past_eval)
            db.flush()

            for q, s in zip(QUESTIONS_CONFIG, past_scores):
                db.add(EvaluationAnswer(
                    evaluation_id=past_eval.id,
                    question_key=q["key"],
                    question_title=q["title"],
                    weight=q["weight"],
                    score=s
                ))

            db.commit()
            print("Avaliações de exemplo inseridas com sucesso!")

    finally:
        db.close()

if __name__ == "__main__":
    init_db()
