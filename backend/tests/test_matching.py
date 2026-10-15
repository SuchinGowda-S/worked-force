import pytest
from app.services.matching import (
    calculate_skill_fit,
    calculate_experience_fit,
    calculate_availability_fit,
    calculate_workload_suitability,
    score_candidate,
)


def test_calculate_skill_fit_perfect_match():
    employee_skills = {1: 5, 2: 4}
    requirements = [
        {"skill_id": 1, "required_proficiency": 4, "is_mandatory": True, "skill_name": "Python"},
        {"skill_id": 2, "required_proficiency": 4, "is_mandatory": False, "skill_name": "FastAPI"},
    ]
    score, matched, missing = calculate_skill_fit(employee_skills, requirements)
    assert score >= 95.0
    assert len(matched) == 2
    assert len(missing) == 0


def test_calculate_skill_fit_missing_mandatory_penalized():
    employee_skills = {2: 4}  # Lacks skill 1 (mandatory)
    requirements = [
        {"skill_id": 1, "required_proficiency": 4, "is_mandatory": True, "skill_name": "Python"},
        {"skill_id": 2, "required_proficiency": 4, "is_mandatory": False, "skill_name": "FastAPI"},
    ]
    score, matched, missing = calculate_skill_fit(employee_skills, requirements)
    assert "Python" in missing
    assert score <= 40.0  # Penalized heavily for missing mandatory skill


def test_calculate_skill_fit_empty_requirements():
    score, matched, missing = calculate_skill_fit({}, [])
    assert score == 100.0
    assert len(matched) == 0
    assert len(missing) == 0


def test_calculate_experience_fit_bounds():
    assert calculate_experience_fit(0.0, 3.0) == 20.0
    assert calculate_experience_fit(3.0, 3.0) == 100.0
    assert calculate_experience_fit(10.0, 3.0) == 100.0
    assert calculate_experience_fit(1.5, 3.0) == 50.0
    assert calculate_experience_fit(5.0, 0.0) == 100.0  # Safe against divide by zero


def test_calculate_availability_fit_safe_zero_capacity():
    score, remaining, projected = calculate_availability_fit(
        weekly_capacity=0.0,
        current_assigned_hours=0.0,
        project_effort_per_member=10.0,
    )
    assert score == 0.0
    assert remaining == 0.0


def test_calculate_availability_fit_normal():
    score, remaining, projected = calculate_availability_fit(
        weekly_capacity=40.0,
        current_assigned_hours=10.0,
        project_effort_per_member=15.0,
    )
    assert remaining == 30.0
    assert projected == 62.5
    assert score >= 90.0


def test_calculate_workload_suitability():
    assert calculate_workload_suitability(50.0, 80.0) == 100.0  # Ideal range (70-95%)
    assert calculate_workload_suitability(90.0, 120.0) == 5.0   # Severe overload (>115%)
    assert calculate_workload_suitability(80.0, 105.0) == 30.0  # Mild overload (100-115%)


def test_score_candidate_full():
    emp = {
        "id": 1,
        "display_name": "Jane Doe",
        "role": "Senior Engineer",
        "weekly_capacity_hours": 40.0,
        "active_assignment_hours": 10.0,
        "availability_percent": 100.0,
        "experience_years": 5.0,
        "active": True,
        "skills": [
            {"skill_id": 1, "proficiency_level": 5},
            {"skill_id": 2, "proficiency_level": 4},
        ],
    }
    requirements = [
        {"skill_id": 1, "required_proficiency": 4, "is_mandatory": True, "skill_name": "Python"},
    ]
    res = score_candidate(emp, requirements, project_effort_per_member=10.0)
    assert res["overall_score"] > 80.0
    assert res["remaining_capacity"] == 30.0
    assert res["exclusion_reason"] is None
    assert "Strong skill match" in res["rationale"]
