def make_valid_eval_payload(lead_id: int):
    keys = [
        "results_delivery", "execution_quality", "learning_capacity",
        "problem_solving", "collaboration_leadership", "strategic_vision"
    ]
    return {
        "lead_id": lead_id,
        "period": "2026-W41",
        "answers": [{"question_key": k, "score": 3} for k in keys]
    }

def test_user_cannot_evaluate_themselves(client):
    """
    User cannot evaluate themselves (Alice ID 1 trying to evaluate 1).
    """
    payload = make_valid_eval_payload(lead_id=1)
    res = client.post("/api/evaluations", json=payload, headers={"X-Leader-Id": "1"})
    assert res.status_code == 400
    assert "não pode avaliar a si próprio" in res.json()["detail"]

def test_user_cannot_evaluate_superior_or_peer(client):
    """
    David (ID 4, Eng Mgr) trying to evaluate Bob (ID 2, CTO - superior): FORBIDDEN.
    David (ID 4) trying to evaluate Eva (ID 5, Eng Mgr - peer): FORBIDDEN.
    """
    # Superior
    res_sup = client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=2), headers={"X-Leader-Id": "4"})
    assert res_sup.status_code == 403

    # Peer
    res_peer = client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=5), headers={"X-Leader-Id": "4"})
    assert res_peer.status_code == 403

def test_user_cannot_view_own_evaluation(client):
    """
    Requirement: 'Deve ser vedado ao usuário ver a sua própria avaliação'
    """
    # First, let Alice (1) evaluate Bob (2)
    client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=2), headers={"X-Leader-Id": "1"})

    # Now Bob (2) tries to view his own evaluation
    res = client.get("/api/evaluations/employee/2", headers={"X-Leader-Id": "2"})
    assert res.status_code == 403
    assert "vedado ao usuário visualizar a sua própria avaliação" in res.json()["detail"]

def test_user_cannot_view_peer_evaluation(client):
    """
    Requirement: 'vedado ao usuário ver a dos seus pares'
    Carol (ID 3, CFO) is a peer of Bob (ID 2, CTO).
    Alice evaluated Bob. Carol cannot view Bob's evaluation.
    """
    # Alice (1) evaluates Bob (2)
    client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=2), headers={"X-Leader-Id": "1"})

    # Carol (3) tries to view Bob's evaluation
    res = client.get("/api/evaluations/employee/2", headers={"X-Leader-Id": "3"})
    assert res.status_code == 403
    assert "Acesso negado" in res.json()["detail"]

def test_user_cannot_view_superior_evaluation(client):
    """
    Requirement: 'vedado ao usuário ver a dos seus superiores'
    David (4) reports to Bob (2). Bob reports to Alice (1).
    David cannot view Bob's evaluation or Alice's evaluation.
    """
    # Alice (1) evaluates Bob (2)
    client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=2), headers={"X-Leader-Id": "1"})

    # David (4) tries to view Bob's evaluation
    res = client.get("/api/evaluations/employee/2", headers={"X-Leader-Id": "4"})
    assert res.status_code == 403
    assert "Acesso negado" in res.json()["detail"]

def test_user_can_view_direct_and_indirect_subordinates_evaluations(client):
    """
    Requirement: 'sendo visível apenas as dos seus subordinados (sendo eles diretos ou indiretos).'
    Bob (2) has:
    - David (4) as direct subordinate
    - Henry (8) as indirect subordinate
    - James (10) as indirect subordinate
    Bob must be able to view evaluations for David, Henry, and James.
    """
    # 1. David evaluated by Bob
    client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=4), headers={"X-Leader-Id": "2"})
    res_david = client.get("/api/evaluations/employee/4", headers={"X-Leader-Id": "2"})
    assert res_david.status_code == 200
    assert len(res_david.json()) == 1

    # 2. Henry evaluated by David
    client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=8), headers={"X-Leader-Id": "4"})
    res_henry = client.get("/api/evaluations/employee/8", headers={"X-Leader-Id": "2"})
    assert res_henry.status_code == 200
    assert len(res_henry.json()) == 1

    # 3. James evaluated by Henry
    client.post("/api/evaluations", json=make_valid_eval_payload(lead_id=10), headers={"X-Leader-Id": "8"})
    res_james = client.get("/api/evaluations/employee/10", headers={"X-Leader-Id": "2"})
    assert res_james.status_code == 200
    assert len(res_james.json()) == 1
