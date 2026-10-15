import pytest
from app.services.workload import calculate_employee_workload, generate_reallocation_suggestions


def test_calculate_employee_workload_states():
    # Overloaded (> 100%)
    rem, util, status = calculate_employee_workload(40.0, 48.0)
    assert rem == 0.0
    assert util == 120.0
    assert status == "overloaded"

    # Underutilized (< 70%)
    rem, util, status = calculate_employee_workload(40.0, 20.0)
    assert rem == 20.0
    assert util == 50.0
    assert status == "underutilized"

    # Optimal (70 - 100%)
    rem, util, status = calculate_employee_workload(40.0, 32.0)
    assert rem == 8.0
    assert util == 80.0
    assert status == "optimal"


def test_calculate_employee_workload_zero_capacity():
    rem, util, status = calculate_employee_workload(0.0, 10.0)
    assert rem == 0.0
    assert util == 100.0


def test_generate_reallocation_suggestions():
    employees = [
        {
            "employee_id": 1,
            "display_name": "Overloaded Alice",
            "weekly_capacity_hours": 40.0,
            "assigned_hours": 48.0,
            "utilization_percent": 120.0,
            "active": True,
            "skills": [{"skill_id": 1, "proficiency_level": 4}],
            "assignments": [
                {"project_id": 10, "project_name": "Project X", "allocated_hours": 20.0},
                {"project_id": 11, "project_name": "Project Y", "allocated_hours": 28.0},
            ],
        },
        {
            "employee_id": 2,
            "display_name": "Underutilized Bob",
            "weekly_capacity_hours": 40.0,
            "assigned_hours": 15.0,
            "utilization_percent": 37.5,
            "active": True,
            "skills": [{"skill_id": 1, "proficiency_level": 4}],
            "assignments": [
                {"project_id": 12, "project_name": "Project Z", "allocated_hours": 15.0},
            ],
        },
    ]

    project_skills = {10: [1], 11: [1], 12: [1]}

    suggestions = generate_reallocation_suggestions(employees, project_skills)

    assert len(suggestions) > 0
    sug = suggestions[0]
    assert sug["from_employee_id"] == 1
    assert sug["to_employee_id"] == 2
    assert sug["after_utilization_from"] < 120.0
    assert sug["after_utilization_to"] > 37.5
