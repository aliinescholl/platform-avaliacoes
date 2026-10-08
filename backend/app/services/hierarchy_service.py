from typing import Dict, List, Optional, Set
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.leader_lead import LeaderLead
from app.schemas.hierarchy import OrgTreeNode

class HierarchyService:
    @staticmethod
    def get_all_hierarchy_levels(db: Session) -> Dict[int, int]:
        """
        Computes the hierarchy level (distance from top leader + 1) for every employee.
        Level 1 = CEO (Alice)
        Level 2 = C-Level / VP / Reports to CEO
        Level 3 = Managers / Leads
        Level 4 = Seniors / Engineers
        Level 5 = Junior Engineers
        Lower number represents a HIGHER position in the organizational hierarchy.
        """
        query = text("""
            WITH RECURSIVE org_levels AS (
                -- Base case: Root nodes (employees who have no leader)
                SELECT e.id, 1 AS level
                FROM employee e
                WHERE NOT EXISTS (
                    SELECT 1 FROM leader_lead ll WHERE ll.lead_id = e.id
                )
                
                UNION ALL
                
                -- Recursive step: leads of current level
                SELECT ll.lead_id, ol.level + 1
                FROM leader_lead ll
                JOIN org_levels ol ON ll.leader_id = ol.id
            )
            SELECT id, MIN(level) as level
            FROM org_levels
            GROUP BY id;
        """)
        result = db.execute(query).fetchall()
        levels: Dict[int, int] = {}
        for row in result:
            levels[row[0]] = row[1]

        # For any isolated employees without edges, default to 1
        all_emp_ids = [e.id for e in db.query(Employee.id).all()]
        for emp_id in all_emp_ids:
            if emp_id not in levels:
                levels[emp_id] = 1

        return levels

    @staticmethod
    def get_employee_hierarchy_level(db: Session, employee_id: int) -> int:
        levels = HierarchyService.get_all_hierarchy_levels(db)
        return levels.get(employee_id, 99)

    @staticmethod
    def get_subordinates_info(db: Session, leader_id: int) -> List[Dict]:
        """
        Retrieves all direct and indirect subordinates for a given leader.
        Uses a recursive CTE with parameterization for security and efficiency.
        """
        query = text("""
            WITH RECURSIVE sub_tree AS (
                -- Base case: Direct reports (depth 1)
                SELECT 
                    ll.lead_id,
                    1 AS depth,
                    ll.leader_id AS direct_leader_id
                FROM leader_lead ll
                WHERE ll.leader_id = :leader_id
                
                UNION ALL
                
                -- Recursive step: Indirect reports
                SELECT 
                    ll.lead_id,
                    st.depth + 1,
                    ll.leader_id AS direct_leader_id
                FROM leader_lead ll
                JOIN sub_tree st ON ll.leader_id = st.lead_id
            )
            SELECT 
                st.lead_id,
                MIN(st.depth) AS depth,
                st.direct_leader_id
            FROM sub_tree st
            GROUP BY st.lead_id, st.direct_leader_id
            ORDER BY depth ASC, st.lead_id ASC;
        """)

        rows = db.execute(query, {"leader_id": leader_id}).fetchall()
        if not rows:
            return []

        # Deduplicate lead_id keeping smallest depth
        subordinates_map = {}
        for row in rows:
            lead_id = row[0]
            depth = row[1]
            direct_leader_id = row[2]
            if lead_id not in subordinates_map or depth < subordinates_map[lead_id]["depth"]:
                subordinates_map[lead_id] = {
                    "lead_id": lead_id,
                    "depth": depth,
                    "direct_leader_id": direct_leader_id
                }

        levels = HierarchyService.get_all_hierarchy_levels(db)

        # Fetch employee records for leads and direct leaders
        emp_ids = list(subordinates_map.keys())
        direct_leader_ids = [v["direct_leader_id"] for v in subordinates_map.values()]
        all_needed = list(set(emp_ids + direct_leader_ids))

        employees = {
            e.id: e for e in db.query(Employee).filter(Employee.id.in_(all_needed)).all()
        }

        result = []
        for lead_id, meta in subordinates_map.items():
            emp = employees.get(lead_id)
            if not emp:
                continue
            direct_ldr = employees.get(meta["direct_leader_id"])
            result.append({
                "employee": emp,
                "depth": meta["depth"],
                "is_direct": (meta["depth"] == 1),
                "direct_leader_id": meta["direct_leader_id"],
                "direct_leader_name": direct_ldr.name if direct_ldr else None,
                "hierarchy_level": levels.get(emp.id, 99)
            })

        # Sort by depth ASC, then name ASC
        result.sort(key=lambda x: (x["depth"], x["employee"].name))
        return result

    @staticmethod
    def get_subordinate_ids_set(db: Session, leader_id: int) -> Set[int]:
        """Returns set of all employee IDs that are subordinate to leader_id."""
        subs = HierarchyService.get_subordinates_info(db, leader_id)
        return {item["employee"].id for item in subs}

    @staticmethod
    def is_subordinate(db: Session, leader_id: int, target_employee_id: int) -> bool:
        """Checks whether target_employee_id is in leader_id's hierarchy."""
        return target_employee_id in HierarchyService.get_subordinate_ids_set(db, leader_id)

    @staticmethod
    def build_tree_for_leader(db: Session, root_leader_id: int) -> OrgTreeNode:
        """
        Builds a hierarchical tree starting from root_leader_id down all subordinates.
        """
        leader = db.query(Employee).filter(Employee.id == root_leader_id).first()
        if not leader:
            raise ValueError(f"Leader with ID {root_leader_id} not found")

        levels = HierarchyService.get_all_hierarchy_levels(db)

        # Get all leader_lead relations
        all_edges = db.query(LeaderLead).all()
        children_map: Dict[int, List[int]] = {}
        for edge in all_edges:
            children_map.setdefault(edge.leader_id, []).append(edge.lead_id)

        all_employees = {e.id: e for e in db.query(Employee).all()}

        def build_node(emp_id: int, current_depth: int) -> OrgTreeNode:
            emp = all_employees[emp_id]
            child_ids = children_map.get(emp_id, [])
            child_nodes = []
            for c_id in child_ids:
                if c_id in all_employees:
                    child_nodes.append(build_node(c_id, current_depth + 1))
            
            return OrgTreeNode(
                id=emp.id,
                name=emp.name,
                email=emp.email,
                position_name=emp.position_name,
                hierarchy_level=levels.get(emp.id, 99),
                is_direct=(current_depth == 1),
                depth=current_depth,
                subordinates=child_nodes
            )

        return build_node(root_leader_id, 0)
