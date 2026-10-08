import pytest
from app.core.config import settings

def make_answers(score_map: dict):
    """Helper to generate full 6 answers"""
    keys = [
        "results_delivery",
        "execution_quality",
        "learning_capacity",
        "problem_solving",
        "collaboration_leadership",
        "strategic_vision"
    ]
    return [
        {"question_key": k, "score": score_map.get(k, 3), "comment": f"Nota para {k}"}
        for k in keys
    ]

def test_successful_evaluation_submission(client):
    """
    David (ID: 4) evaluates his direct subordinate Henry (ID: 8).
    Scores:
    results_delivery: 4 (weight 25 -> 100)
    execution_quality: 4 (weight 20 -> 80)
    learning_capacity: 3 (weight 20 -> 60)
    problem_solving: 3 (weight 15 -> 45)
    collaboration_leadership: 4 (weight 10 -> 40)
    strategic_vision: 3 (weight 10 -> 30)
    Total weighted = 355 / 100 = 3.55
    """
    payload = {
        "lead_id": 8,
        "period": "2026-W41",
        "feedback": "Excelente desempenho técnico no sprint.",
        "answers": make_answers({
            "results_delivery": 4,
            "execution_quality": 4,
            "learning_capacity": 3,
            "problem_solving": 3,
            "collaboration_leadership": 4,
            "strategic_vision": 3
        })
    }

    res = client.post("/api/evaluations", json=payload, headers={"X-Leader-Id": "4"})
    assert res.status_code == 201
    data = res.json()
    assert data["lead_id"] == 8
    assert data["leader_id"] == 4
    assert data["final_score"] == 3.55
    assert len(data["answers"]) == 6
    assert data["is_prevailing"] is True

def test_evaluation_score_range_validation(client):
    """Score must be between 1 and 4. 0 or 5 must fail."""
    # Test score 5 (invalid)
    payload = {
        "lead_id": 8,
        "period": "2026-W41",
        "answers": make_answers({"results_delivery": 5})
    }
    res = client.post("/api/evaluations", json=payload, headers={"X-Leader-Id": "4"})
    assert res.status_code == 422 # Pydantic validation error ge=1, le=4

    # Test score 0 (invalid)
    payload = {
        "lead_id": 8,
        "period": "2026-W41",
        "answers": make_answers({"results_delivery": 0})
    }
    res = client.post("/api/evaluations", json=payload, headers={"X-Leader-Id": "4"})
    assert res.status_code == 422

def test_evaluation_missing_questions_validation(client):
    """All 6 questions are required."""
    payload = {
        "lead_id": 8,
        "period": "2026-W41",
        "answers": [
            {"question_key": "results_delivery", "score": 3}
        ]
    }
    res = client.post("/api/evaluations", json=payload, headers={"X-Leader-Id": "4"})
    assert res.status_code == 400
    assert "Todas as 6 questões" in res.json()["detail"]

def test_evaluation_frequency_limit_one_per_week(client):
    """
    Exactly one evaluation per week for each leader-employee pair.
    Second attempt in the same period must return 409 Conflict.
    """
    payload = {
        "lead_id": 8,
        "period": "2026-W41",
        "answers": make_answers({})
    }

    # 1st submission: OK
    res1 = client.post("/api/evaluations", json=payload, headers={"X-Leader-Id": "4"})
    assert res1.status_code == 201

    # 2nd submission in same period: 409 Conflict
    res2 = client.post("/api/evaluations", json=payload, headers={"X-Leader-Id": "4"})
    assert res2.status_code == 409
    assert "já enviou uma avaliação" in res2.json()["detail"]

def test_superior_leader_can_evaluate_indirect_subordinate_even_if_direct_leader_evaluated(client):
    """
    Requirement:
    'Os líderes podem avaliar seus liderados diretos e os liderados dos seus subordinados,
     mesmo que seu subordinado já tenha avaliado o seu próprio liderado dentro do período.'
    """
    period = "2026-W41"

    # Step 1: Henry (ID 8) evaluates his direct subordinate James (ID 10)
    henry_payload = {
        "lead_id": 10,
        "period": period,
        "answers": make_answers({"results_delivery": 3})
    }
    res1 = client.post("/api/evaluations", json=henry_payload, headers={"X-Leader-Id": "8"})
    assert res1.status_code == 201

    # Step 2: David (ID 4, Henry's manager) ALSO evaluates James (ID 10) in the same period
    david_payload = {
        "lead_id": 10,
        "period": period,
        "answers": make_answers({"results_delivery": 4})
    }
    res2 = client.post("/api/evaluations", json=david_payload, headers={"X-Leader-Id": "4"})
    assert res2.status_code == 201

    # Step 3: Bob (ID 2, David's manager / CTO) ALSO evaluates James (ID 10) in the same period
    bob_payload = {
        "lead_id": 10,
        "period": period,
        "answers": make_answers({"results_delivery": 2})
    }
    res3 = client.post("/api/evaluations", json=bob_payload, headers={"X-Leader-Id": "2"})
    assert res3.status_code == 201

def test_highest_hierarchy_prevails(client):
    """
    Requirement: 'respeitando sempre a maior hierarquia'
    When multiple leaders evaluate an employee in the same period,
    the evaluation from the highest hierarchy leader must be marked is_prevailing = True.
    Here:
    Bob (CTO, Level 2) > David (Eng Mgr, Level 3) > Henry (Sr Eng, Level 4).
    Bob's evaluation must prevail!
    """
    period = "2026-W41"

    # Henry (Level 4) evaluates James (Level 5) with final_score 3.0
    client.post("/api/evaluations", json={
        "lead_id": 10,
        "period": period,
        "answers": make_answers({k: 3 for k in [
            "results_delivery", "execution_quality", "learning_capacity",
            "problem_solving", "collaboration_leadership", "strategic_vision"
        ]})
    }, headers={"X-Leader-Id": "8"})

    # David (Level 3) evaluates James with final_score 3.5
    client.post("/api/evaluations", json={
        "lead_id": 10,
        "period": period,
        "answers": make_answers({
            "results_delivery": 4, "execution_quality": 4, "learning_capacity": 3,
            "problem_solving": 3, "collaboration_leadership": 3, "strategic_vision": 3
        })
    }, headers={"X-Leader-Id": "4"})

    # Bob (Level 2) evaluates James with final_score 4.0
    client.post("/api/evaluations", json={
        "lead_id": 10,
        "period": period,
        "answers": make_answers({k: 4 for k in [
            "results_delivery", "execution_quality", "learning_capacity",
            "problem_solving", "collaboration_leadership", "strategic_vision"
        ]})
    }, headers={"X-Leader-Id": "2"})

    # Query evaluations for James as Bob
    res = client.get(f"/api/evaluations/employee/10?period={period}", headers={"X-Leader-Id": "2"})
    assert res.status_code == 200
    evals = res.json()
    assert len(evals) == 3

    # Check which one is prevailing
    prevailing_eval = next(e for e in evals if e["is_prevailing"] is True)
    assert prevailing_eval["leader_id"] == 2 # Bob Sinclair (CTO, Level 2) prevailed!
    assert prevailing_eval["leader_hierarchy_level"] == 2
    assert prevailing_eval["final_score"] == 4.0

    # Ensure other evaluations have is_prevailing == False
    non_prevailing = [e for e in evals if not e["is_prevailing"]]
    assert len(non_prevailing) == 2
    non_prev_leaders = {e["leader_id"] for e in non_prevailing}
    assert non_prev_leaders == {4, 8}
