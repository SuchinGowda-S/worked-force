import pytest
from app.services.team_optimizer import optimize_team


def test_optimize_team_success():
    project = {
        "id": 1,
        "name": "Cloud Native Modernization",
        "team_size": 2,
        "estimated_effort_hours_per_week": 20.0,
        "skill_requirements": [
            {"skill_id": 1, "skill_name": "Kubernetes", "required_proficiency": 4, "is_mandatory": True},
            {"skill_id": 2, "skill_name": "Docker", "required_proficiency": 4, "is_mandatory": True},
        ],
    }

    candidates = [
        {
            "id": 101,
            "display_name": "DevOps Engineer A",
            "role": "DevOps Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 10.0,
            "availability_percent": 100.0,
            "experience_years": 4.0,
            "active": True,
            "skills": [
                {"skill_id": 1, "proficiency_level": 4},
                {"skill_id": 2, "proficiency_level": 4},
            ],
        },
        {
            "id": 102,
            "display_name": "Cloud Engineer B",
            "role": "Cloud Architect",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 15.0,
            "availability_percent": 100.0,
            "experience_years": 5.0,
            "active": True,
            "skills": [
                {"skill_id": 1, "proficiency_level": 5},
                {"skill_id": 2, "proficiency_level": 4},
            ],
        },
    ]

    skills_lookup = {1: "Kubernetes", 2: "Docker"}

    result = optimize_team(project, candidates, skills_lookup)

    assert result["is_feasible"] is True
    assert len(result["selected_team"]) == 2
    assert len(result["missing_mandatory_skills"]) == 0
    assert result["total_team_score"] > 80.0


def test_optimize_team_missing_mandatory_flags_infeasible():
    project = {
        "id": 2,
        "name": "AI Pipeline",
        "team_size": 2,
        "estimated_effort_hours_per_week": 20.0,
        "skill_requirements": [
            {"skill_id": 99, "skill_name": "Quantum Computing", "required_proficiency": 5, "is_mandatory": True},
        ],
    }

    candidates = [
        {
            "id": 101,
            "display_name": "DevOps Engineer A",
            "role": "DevOps Engineer",
            "weekly_capacity_hours": 40.0,
            "active_assignment_hours": 10.0,
            "availability_percent": 100.0,
            "experience_years": 4.0,
            "active": True,
            "skills": [],
        },
    ]

    skills_lookup = {99: "Quantum Computing"}

    result = optimize_team(project, candidates, skills_lookup)

    assert result["is_feasible"] is False
    assert "Quantum Computing" in result["missing_mandatory_skills"]
    assert any("Mandatory skill gaps" in c for c in result["constraints_violated"])
