from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import TrainingCourse, Skill, Project, ProjectSkillRequirement, Assignment, EmployeeSkill
from app.schemas.schemas import TrainingCourseRead

router = APIRouter()


@router.get("/training", response_model=List[TrainingCourseRead])
def get_training_courses(
    skill_id: Optional[int] = Query(None, description="Filter courses by skill ID"),
    db: Session = Depends(get_db),
):
    query = db.query(TrainingCourse)
    if skill_id:
        query = query.filter(TrainingCourse.skill_id == skill_id)
    courses = query.all()

    result = []
    for c in courses:
        skill_name = c.skill.name if c.skill else f"Skill #{c.skill_id}"
        result.append(TrainingCourseRead(
            id=c.id,
            title=c.title,
            skill_id=c.skill_id,
            skill_name=skill_name,
            level=c.level,
            estimated_hours=c.estimated_hours,
            description=c.description or "",
            provider=c.provider,
        ))

    return result


@router.get("/skills/gaps")
def get_skills_gaps(db: Session = Depends(get_db)):
    """Computes project-level and org-wide skill gaps across active/planning projects."""
    projects = db.query(Project).filter(Project.status != "completed").all()
    
    gaps_by_project = []
    org_gap_counts = {}

    for proj in projects:
        # Get active assignments for project
        assignments = db.query(Assignment).filter(
            Assignment.project_id == proj.id,
            Assignment.status == "active"
        ).all()
        emp_ids = [a.employee_id for a in assignments]

        # Get team skills
        team_skills = {}
        if emp_ids:
            emp_skills = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id.in_(emp_ids)).all()
            for es in emp_skills:
                team_skills[es.skill_id] = max(team_skills.get(es.skill_id, 0), es.proficiency_level)

        project_gaps = []
        for req in proj.skill_requirements:
            s_id = req.skill_id
            s_name = req.skill.name if req.skill else f"Skill #{s_id}"
            achieved = team_skills.get(s_id, 0)
            if achieved < req.required_proficiency:
                gap_item = {
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "required_proficiency": req.required_proficiency,
                    "achieved_proficiency": achieved,
                    "is_mandatory": req.is_mandatory,
                    "status": "uncovered" if achieved == 0 else "below_required",
                }
                project_gaps.append(gap_item)
                org_gap_counts[s_name] = org_gap_counts.get(s_name, 0) + 1

        gaps_by_project.append({
            "project_id": proj.id,
            "project_name": proj.name,
            "status": proj.status,
            "gaps": project_gaps,
        })

    return {
        "projects": gaps_by_project,
        "org_gap_frequency": [
            {"skill_name": k, "count": v} for k, v in sorted(org_gap_counts.items(), key=lambda x: x[1], reverse=True)
        ],
    }
