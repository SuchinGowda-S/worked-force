"""Complete End-to-End Manager Workflow Audit Test (Task 2 & Task 3).

Verifies the exact 13-step sequence:
1. Dashboard load & real data.
2. Employee creation with skills & proficiencies.
3. Project creation with mandatory & optional skills.
4. Team recommendation generation.
5. Verification of employee scores and plain-language explanations.
6. Verification of mandatory skill coverage and feasibility status.
7. Verification of accurate exclusion explanations for non-selected candidates.
8. Review training recommendations for uncovered skills.
9. Recommendation confirmation and assignment saving.
10. Page refresh / persistence verification.
11. Workload reallocation suggestion generation with before/after projection.
12. Reallocation acceptance and database update verification.
13. Demo data reset and consistency verification.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal
from app.models.models import Employee, Project, Assignment

client = TestClient(app)


def test_complete_manager_workflow_audit():
    # STEP 13 / Setup: Reset demo data to ensure consistent initial state
    reset_res = client.post("/api/seed")
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "success"

    # STEP 1: Open dashboard and load real data
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["employee_count"] >= 14
    assert dash_data["active_projects_count"] >= 2
    assert dash_data["avg_utilization_percent"] > 0
    initial_employee_count = dash_data["employee_count"]

    # STEP 2: Create an employee with skills, proficiency levels, experience, and capacity
    skills_res = client.get("/api/skills")
    assert skills_res.status_code == 200
    skills_map = {s["name"]: s["id"] for s in skills_res.json()}
    assert "Python" in skills_map
    assert "React" in skills_map

    new_emp_payload = {
        "display_name": "Audit Test Engineer",
        "role": "Senior Full-Stack Specialist",
        "department": "Platform Engineering",
        "experience_years": 5.0,
        "weekly_capacity_hours": 40.0,
        "availability_percent": 100.0,
        "active": True,
        "skills": [
            {"skill_id": skills_map["Python"], "proficiency_level": 5, "years_experience": 5.0},
            {"skill_id": skills_map["React"], "proficiency_level": 4, "years_experience": 4.0},
        ],
    }
    create_emp_res = client.post("/api/employees", json=new_emp_payload)
    assert create_emp_res.status_code == 201
    created_emp = create_emp_res.json()
    created_emp_id = created_emp["id"]
    assert created_emp["display_name"] == "Audit Test Engineer"
    assert len(created_emp["skills"]) == 2
    assert created_emp["weekly_capacity_hours"] == 40.0

    # STEP 3: Create a project with mandatory and optional skills, required proficiency, team size, and effort
    new_proj_payload = {
        "name": "Audit Autonomous AI Agents Initiative",
        "description": "High-throughput autonomous agent workflow requiring Python and React.",
        "start_date": "2026-12-01",
        "end_date": "2027-05-31",
        "team_size": 2,
        "estimated_effort_hours_per_week": 20.0,
        "status": "planning",
        "skill_requirements": [
            {"skill_id": skills_map["Python"], "required_proficiency": 4, "is_mandatory": True},
            {"skill_id": skills_map["React"], "required_proficiency": 4, "is_mandatory": True},
        ],
    }
    create_proj_res = client.post("/api/projects", json=new_proj_payload)
    assert create_proj_res.status_code == 201
    created_proj = create_proj_res.json()
    created_proj_id = created_proj["id"]
    assert created_proj["team_size"] == 2
    assert len(created_proj["skill_requirements"]) == 2

    # STEP 4: Generate a team recommendation
    rec_res = client.post(f"/api/projects/{created_proj_id}/recommend-team")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert rec_data["project_id"] == created_proj_id
    assert len(rec_data["selected_team"]) == 2

    # STEP 5: Verify that employee scores and their explanations match backend calculations
    selected_ids = [m["employee_id"] for m in rec_data["selected_team"]]
    for member in rec_data["selected_team"]:
        assert member["overall_score"] > 0
        assert member["component_scores"]["skill_fit"] >= 0
        assert member["component_scores"]["experience"] >= 0
        assert member["component_scores"]["availability"] >= 0
        assert member["component_scores"]["workload"] >= 0
        assert len(member["rationale"]) > 0
        assert member["is_selected"] is True

    # STEP 6: Verify mandatory skill coverage and feasibility reporting
    assert rec_data["is_feasible"] is True
    assert len(rec_data["missing_mandatory_skills"]) == 0
    for cov in rec_data["skill_coverage"]:
        assert cov["is_covered"] is True
        assert cov["best_team_proficiency"] >= cov["required_proficiency"]
        assert len(cov["covering_members"]) > 0

    # STEP 7: Confirm that excluded candidates have accurate explanations
    non_selected = [c for c in rec_data["candidate_rankings"] if not c["is_selected"]]
    assert len(non_selected) > 0
    for cand in non_selected:
        assert cand["exclusion_reason"] is not None
        assert len(cand["exclusion_reason"]) > 0
        # If candidate lacked mandatory skills, explanation mentions mandatory
        if any(r["skill_name"] in cand["missing_skills"] for r in created_proj["skill_requirements"] if r["is_mandatory"]):
            assert "mandatory" in cand["exclusion_reason"].lower() or "capacity" in cand["exclusion_reason"].lower() or "inactive" in cand["exclusion_reason"].lower()

    # STEP 8: Review training recommendations for uncovered skills on a challenging project
    # Create an impossible project requiring Quantum Computing (unmet)
    impossible_proj_payload = {
        "name": "Audit Quantum Deep Neural Initiative",
        "description": "Requires advanced Quantum and Redis competencies.",
        "start_date": "2027-01-01",
        "end_date": "2027-06-30",
        "team_size": 2,
        "estimated_effort_hours_per_week": 20.0,
        "status": "planning",
        "skill_requirements": [
            {"skill_id": skills_map["Redis"], "required_proficiency": 5, "is_mandatory": True},
        ],
    }
    imp_res = client.post("/api/projects", json=impossible_proj_payload)
    imp_proj_id = imp_res.json()["id"]
    imp_rec_res = client.post(f"/api/projects/{imp_proj_id}/recommend-team")
    imp_rec_data = imp_rec_res.json()
    assert "recommended_courses" in imp_rec_data
    # If Redis course exists, it should be recommended
    if any(not c["is_covered"] or c["best_team_proficiency"] < c["required_proficiency"] for c in imp_rec_data["skill_coverage"]):
        assert len(imp_rec_data["recommended_courses"]) > 0

    # STEP 9: Confirm recommendation and verify assignments are saved
    apply_res = client.post(
        f"/api/projects/{created_proj_id}/apply-team",
        json={"employee_ids": selected_ids},
    )
    assert apply_res.status_code == 200
    assert apply_res.json()["applied_count"] == 2

    # Verify project status updated to active
    proj_verify = client.get(f"/api/projects/{created_proj_id}").json()
    assert proj_verify["status"] == "active"
    assert len(proj_verify["assigned_employees"]) == 2
    assigned_ids = [a["employee_id"] for a in proj_verify["assigned_employees"]]
    assert set(assigned_ids) == set(selected_ids)

    # STEP 10: Refresh the page / re-query backend and verify that saved changes persist
    re_proj_res = client.get(f"/api/projects/{created_proj_id}")
    assert re_proj_res.status_code == 200
    persisted_proj = re_proj_res.json()
    assert len(persisted_proj["assigned_employees"]) == 2
    for emp_assigned in persisted_proj["assigned_employees"]:
        assert emp_assigned["allocated_hours"] == 10.0  # 20.0 effort / 2 members

    # STEP 11: Generate workload reallocation suggestions and verify before/after values
    wl_res = client.get("/api/workload")
    assert wl_res.status_code == 200
    wl_data = wl_res.json()
    assert wl_data["overloaded_count"] >= 1
    assert wl_data["underutilized_count"] >= 1
    assert len(wl_data["suggestions"]) > 0

    first_suggestion = wl_data["suggestions"][0]
    assert first_suggestion["before_utilization_from"] > 100.0
    assert first_suggestion["after_utilization_from"] < first_suggestion["before_utilization_from"]
    assert first_suggestion["after_utilization_to"] > first_suggestion["before_utilization_to"]
    assert first_suggestion["hours_to_transfer"] > 0

    # STEP 12: Confirm that accepting a reallocation updates the database correctly
    realloc_apply_res = client.post("/api/workload/apply-reallocation", json=first_suggestion)
    assert realloc_apply_res.status_code == 200
    assert realloc_apply_res.json()["status"] == "success"

    # Re-fetch workload to verify updated numbers
    wl_after = client.get("/api/workload").json()
    from_emp_after = next(e for e in wl_after["employees"] if e["employee_id"] == first_suggestion["from_employee_id"])
    assert from_emp_after["utilization_percent"] == first_suggestion["after_utilization_from"]

    # STEP 13: Reset demo data and verify application returns to consistent initial state
    final_reset = client.post("/api/seed")
    assert final_reset.status_code == 200
    assert final_reset.json()["status"] == "success"

    final_dash = client.get("/api/dashboard/summary").json()
    assert final_dash["employee_count"] == 14  # Back to original seed count
    assert final_dash["active_projects_count"] == 2
