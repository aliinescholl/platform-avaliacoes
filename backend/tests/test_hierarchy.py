from app.services.hierarchy_service import HierarchyService

def test_hierarchy_levels(db_session):
    """
    Verifies hierarchy level computation:
    Alice (CEO) = 1
    Bob (CTO), Carol (CFO), Frank (PM), Tina (HR) = 2
    David (Eng Mgr), Eva (Eng Mgr) = 3
    Henry (Sr Dev), Liam (Dev) = 4
    James (Dev), Karen (Dev) = 5
    """
    levels = HierarchyService.get_all_hierarchy_levels(db_session)

    assert levels[1] == 1 # Alice (CEO)
    assert levels[2] == 2 # Bob (CTO)
    assert levels[3] == 2 # Carol (CFO)
    assert levels[6] == 2 # Frank (PM)
    assert levels[20] == 2 # Tina (HR)

    assert levels[4] == 3 # David (Eng Mgr)
    assert levels[5] == 3 # Eva (Eng Mgr)

    assert levels[8] == 4 # Henry (Sr Dev)
    assert levels[12] == 4 # Liam (Dev, reports to David)

    assert levels[10] == 5 # James (Dev, reports to Henry)
    assert levels[11] == 5 # Karen (Dev, reports to Henry)

def test_subordinates_traversal(db_session):
    """
    Verifies that direct and indirect subordinates are correctly resolved.
    """
    # Henry (8) leads James (10) and Karen (11) directly
    henry_subs = HierarchyService.get_subordinates_info(db_session, 8)
    henry_sub_ids = {s["employee"].id for s in henry_subs}
    assert henry_sub_ids == {10, 11}
    assert all(s["is_direct"] for s in henry_subs)

    # David (4) leads Henry (8) and Liam (12) directly, and James (10) and Karen (11) indirectly
    david_subs = HierarchyService.get_subordinates_info(db_session, 4)
    david_sub_ids = {s["employee"].id for s in david_subs}
    assert david_sub_ids == {8, 12, 10, 11}

    # Verify depths
    depth_map = {s["employee"].id: s["depth"] for s in david_subs}
    assert depth_map[8] == 1 # Henry direct
    assert depth_map[12] == 1 # Liam direct
    assert depth_map[10] == 2 # James indirect via Henry
    assert depth_map[11] == 2 # Karen indirect via Henry

    # Bob (2) leads David, Eva, Grace, Quinn, Paul directly, and all their subordinates indirectly
    bob_sub_ids = HierarchyService.get_subordinate_ids_set(db_session, 2)
    assert {4, 5, 7, 16, 17, 8, 12, 9, 13, 14, 10, 11}.issubset(bob_sub_ids)

    # Individual contributor (e.g. James 10) has 0 subordinates
    james_subs = HierarchyService.get_subordinates_info(db_session, 10)
    assert len(james_subs) == 0

def test_subordinates_api_endpoint(client):
    """
    GET /api/subordinates for David (ID: 4) should return 4 subordinates:
    Henry, Liam, James, Karen.
    """
    response = client.get("/api/subordinates", headers={"X-Leader-Id": "4"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    returned_ids = {item["id"] for item in data}
    assert returned_ids == {8, 12, 10, 11}
