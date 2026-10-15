from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import (
    Project,
    Employee,
    EmployeeSkill,
    Assignment,
    Skill,
    TrainingCourse,
)
from app.schemas.schemas import (
    RecommendationResponse,
    ApplyTeamRequest,
)
from app.services.team_optimizer import optimize_team
from app.services.skill_gaps import find_training_for_skill_gaps

router = APIRouter()


@router.post("/projects/{project_id}/recommend-team", response_model=RecommendationResponse)
def get_team_recommendation(project_id: int, db: Session = Depends(get_db)):
    """Runs deterministic matching and team optimization for the specified project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Build skills lookup
    all_skills = db.query(Skill).all()
    skills_lookup = {s.id: s.name for s in all_skills}

    # Format project dict
    project_dict = {
        "id": project.id,
        "name": project.name,
        "team_size": project.team_size,
        "estimated_effort_hours_per_week": project.estimated_effort_hours_per_week,
        "skill_requirements": [
            {
                "skill_id": r.skill_id,
                "skill_name": r.skill.name if r.skill else skills_lookup.get(r.skill_id, f"Skill #{r.skill_id}"),
                "required_proficiency": r.required_proficiency,
                "is_mandatory": r.is_mandatory,
            }
            for r in project.skill_requirements
        ],
    }

    # Fetch all active assignments to compute current workloads
    active_assignments = db.query(Assignment).filter(Assignment.status == "active").all()
    hours_by_emp = {}
    for a in active_assignments:
        hours_by_emp[a.employee_id] = hours_by_emp.get(a.employee_id, 0.0) + a.allocated_hours_per_week

    # Fetch all employees
    employees = db.query(Employee).all()
    candidates = []
    for emp in employees:
        cand_dict = {
            "id": emp.id,
            "display_name": emp.display_name,
            "role": emp.role,
            "department": emp.department,
            "experience_years": emp.experience_years,
            "weekly_capacity_hours": emp.weekly_capacity_hours,
            "availability_percent": emp.availability_percent,
            "active": emp.active,
            "active_assignment_hours": hours_by_emp.get(emp.id, 0.0),
            "skills": [
                {
                    "skill_id": es.skill_id,
                    "proficiency_level": es.proficiency_level,
                    "years_experience": es.years_experience or 1.0,
                }
                for es in emp.skills
            ],
        }
        candidates.append(cand_dict)

    # Run optimizer
    optimization_result = optimize_team(project_dict, candidates, skills_lookup)

    # Fetch training courses
    courses = db.query(TrainingCourse).all()
    courses_dict = [
        {
            "id": c.id,
            "title": c.title,
            "skill_id": c.skill_id,
            "level": c.level,
            "estimated_hours": c.estimated_hours,
            "provider": c.provider,
            "description": c.description,
        }
        for c in courses
    ]

    # Find training courses for any gaps or below-target proficiencies
    recommended_courses = find_training_for_skill_gaps(
        optimization_result["skill_coverage"],
        courses_dict,
    )
    optimization_result["recommended_courses"] = recommended_courses

    return optimization_result


@router.post("/projects/{project_id}/apply-team")
def apply_recommended_team(
    project_id: int,
    payload: ApplyTeamRequest,
    db: Session = Depends(get_db),
):
    """Saves manager-approved recommended team as active project assignments."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    unique_emp_ids = list(dict.fromkeys(payload.employee_ids))
    if not unique_emp_ids:
        raise HTTPException(status_code=400, detail="No valid employee IDs provided to apply.")

    try:
        # Remove existing active assignments for this project to apply the new team
        db.query(Assignment).filter(
            Assignment.project_id == project.id,
            Assignment.status == "active"
        ).delete()

        effort_per_member = round(max(0.0, project.estimated_effort_hours_per_week) / float(len(unique_emp_ids)), 1)

        applied_count = 0
        for emp_id in unique_emp_ids:
            emp = db.query(Employee).filter(Employee.id == emp_id, Employee.active == True).first()
            if emp:
                assignment = Assignment(
                    employee_id=emp.id,
                    project_id=project.id,
                    allocated_hours_per_week=effort_per_member,
                    status="active",
                )
                db.add(assignment)
                applied_count += 1

        if applied_count == 0:
            db.rollback()
            raise HTTPException(status_code=400, detail="None of the specified employee IDs are active or valid.")

        project.status = "active"
        db.commit()

        return {
            "status": "success",
            "message": f"Successfully staffed project '{project.name}' with {applied_count} team members.",
            "applied_count": applied_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")
