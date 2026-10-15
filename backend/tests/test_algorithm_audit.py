"""Algorithm Correctness and Edge Case Audit Tests (Task 3)."""

import pytest
from app.services.matching import (
    calculate_skill_fit,
    calculate_availability_fit,
    calculate_workload_suitability,
    score_candidate,
)
from app.services.team_optimizer import optimize_team, evaluate_team_combination
from app.services.workload import calculate_employee_workload, generate_reallocation_suggestions


def test_optimizer_prefers_combination_over_isolated_top_scores():
    """Verifies that the optimizer chooses a combination that covers complementary mandatory skills

    even when an irrelevant candidate has a higher individual score due to tenure/availability.
    """
    project = {
        "id": 10,
        "name": "Fullstack Modernization",
        "team_size": 2,
        "estimated_effort_hours_per_week": 20.0,  # 10h per member
        "skill_requirements": [
            {"skill_id": 1, "skill_name": "Python", "required_proficiency": 4, "is_mandatory": True},
            {"skill_id": 2, "skill_name": "React", "required_proficiency": 4, "is_mandatory": True},
        ],
    }

    candidates = [
        # Candidate A: Backend Python specialist
        {
            "id": 1,
            "display_name": "Alice Python",
            "role": "Backend Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 10.0,
            "availability_percent": 100.0,
            "experience_years": 3.0,
            "active": True,
            "skills": [{"skill_id": 1, "proficiency_level": 5}],
        },
        # Candidate B: Frontend React specialist
        {
            "id": 2,
            "display_name": "Bob React",
            "role": "Frontend Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 10.0,
            "availability_percent": 100.0,
            "experience_years": 3.0,
            "active": True,
            "skills": [{"skill_id": 2, "proficiency_level": 5}],
        },
        # Candidate C: 15 years experience, 0 current hours, high individual score, BUT lacks Python & React
        {
            "id": 3,
            "display_name": "Charlie Veteran",
            "role": "Legacy Systems Architect",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 0.0,
            "availability_percent": 100.0,
            "experience_years": 15.0,
            "active": True,
            "skills": [{"skill_id": 99, "proficiency_level": 5}],  # Irrelevant skill
        },
    ]

    skills_lookup = {1: "Python", 2: "React", 99: "Legacy Cobol"}

    result = optimize_team(project, candidates, skills_lookup)

    assert result["is_feasible"] is True
    selected_ids = {m["employee_id"] for m in result["selected_team"]}
    # Combination optimization MUST select Alice and Bob (1 and 2), NOT Charlie (3)
    assert selected_ids == {1, 2}
    assert 3 not in selected_ids
    assert len(result["missing_mandatory_skills"]) == 0


def test_optimizer_avoids_overloading_when_sufficient_capacity_exists():
    """Verifies that an employee whose remaining capacity is less than required effort

    is NOT selected when another qualified candidate with sufficient capacity exists.
    """
    project = {
        "id": 20,
        "name": "Cloud DevOps Initiative",
        "team_size": 1,
        "estimated_effort_hours_per_week": 15.0,  # 15h needed
        "skill_requirements": [
            {"skill_id": 1, "skill_name": "Kubernetes", "required_proficiency": 4, "is_mandatory": True},
        ],
    }

    candidates = [
        # Candidate A: Qualified, but already assigned 35h out of 40h (only 5h capacity remaining)
        # Assigning 15h would push to 50h/40h (125% overloaded)
        {
            "id": 1,
            "display_name": "Overloaded Dev",
            "role": "DevOps Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 35.0,
            "availability_percent": 100.0,
            "experience_years": 6.0,
            "active": True,
            "skills": [{"skill_id": 1, "proficiency_level": 5}],
        },
        # Candidate B: Qualified, has 30h remaining capacity (assigned 10h out of 40h)
        {
            "id": 2,
            "display_name": "Available Dev",
            "role": "DevOps Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 10.0,
            "availability_percent": 100.0,
            "experience_years": 4.0,
            "active": True,
            "skills": [{"skill_id": 1, "proficiency_level": 4}],
        },
    ]

    skills_lookup = {1: "Kubernetes"}

    result = optimize_team(project, candidates, skills_lookup)

    assert result["is_feasible"] is True
    assert len(result["selected_team"]) == 1
    # Candidate B must be chosen to avoid capacity overload
    assert result["selected_team"][0]["employee_id"] == 2
    assert result["selected_team"][0]["projected_utilization"] <= 100.0


def test_empty_project_requirements_handled_safely():
    """An initiative with no skill requirements should gracefully select viable staff without crashing."""
    project = {
        "id": 30,
        "name": "General Exploration",
        "team_size": 2,
        "estimated_effort_hours_per_week": 10.0,
        "skill_requirements": [],
    }

    candidates = [
        {
            "id": 1,
            "display_name": "Dev A",
            "role": "Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 10.0,
            "availability_percent": 100.0,
            "experience_years": 2.0,
            "active": True,
            "skills": [],
        },
        {
            "id": 2,
            "display_name": "Dev B",
            "role": "Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 10.0,
            "availability_percent": 100.0,
            "experience_years": 3.0,
            "active": True,
            "skills": [],
        },
    ]

    result = optimize_team(project, candidates, {})
    assert result["is_feasible"] is True
    assert len(result["selected_team"]) == 2
    assert len(result["skill_coverage"]) == 0
    assert len(result["missing_mandatory_skills"]) == 0


def test_availability_and_utilization_are_distinct():
    """Verifies that availability percent (schedule availability) is distinct from utilization percent (workload load)."""
    # Part-time engineer with 50% availability (20h effective capacity)
    # Assigned 10 hours -> utilization is 10/20 = 50%, NOT 50% availability
    rem, util, status = calculate_employee_workload(
        weekly_capacity=40.0,
        assigned_hours=10.0,
        availability_percent=50.0,
    )
    assert rem == 10.0
    assert util == 50.0
    assert status == "underutilized"

    # Assigned 18 hours -> utilization is 18/20 = 90% (optimal)
    rem2, util2, status2 = calculate_employee_workload(
        weekly_capacity=40.0,
        assigned_hours=18.0,
        availability_percent=50.0,
    )
    assert rem2 == 2.0
    assert util2 == 90.0
    assert status2 == "optimal"


def test_reallocation_remains_valid_and_non_duplicative():
    """Verifies that reallocation suggestions correctly offload excessive hours and do not create duplicate assignments."""
    employees = [
        {
            "employee_id": 101,
            "display_name": "Overloaded Sam",
            "weekly_capacity_hours": 40.0,
            "assigned_hours": 50.0,
            "utilization_percent": 125.0,
            "active": True,
            "skills": [{"skill_id": 1, "proficiency_level": 4}],
            "assignments": [
                {"project_id": 501, "project_name": "Core Service", "allocated_hours": 25.0},
                {"project_id": 502, "project_name": "Secondary Service", "allocated_hours": 25.0},
            ],
        },
        {
            "employee_id": 102,
            "display_name": "Available Alex",
            "weekly_capacity_hours": 40.0,
            "assigned_hours": 10.0,
            "utilization_percent": 25.0,
            "active": True,
            "skills": [{"skill_id": 1, "proficiency_level": 4}],
            "assignments": [
                {"project_id": 503, "project_name": "Other Service", "allocated_hours": 10.0},
            ],
        },
    ]

    project_skills = {501: [1], 502: [1], 503: [1]}

    suggestions = generate_reallocation_suggestions(employees, project_skills)
    assert len(suggestions) > 0
    sug = suggestions[0]
    assert sug["from_employee_id"] == 101
    assert sug["to_employee_id"] == 102
    assert sug["after_utilization_from"] <= 100.0  # Successfully brought down
    assert sug["after_utilization_to"] <= 95.0     # Does not overload recipient
