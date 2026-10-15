from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Project, ProjectSkillRequirement, Assignment, Employee, Skill
from app.schemas.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectRead,
    ProjectSkillRequirementRead,
    AssignedEmployeeInfo,
)

router = APIRouter()


def enrich_project(proj: Project, db: Session) -> ProjectRead:
    # Format skill requirements
    reqs = []
    for r in proj.skill_requirements:
        skill_name = r.skill.name if r.skill else f"Skill #{r.skill_id}"
        reqs.append(ProjectSkillRequirementRead(
            id=r.id,
            skill_id=r.skill_id,
            skill_name=skill_name,
            required_proficiency=r.required_proficiency,
            is_mandatory=r.is_mandatory,
        ))

    # Format assigned team members
    assignments = db.query(Assignment).filter(
        Assignment.project_id == proj.id,
        Assignment.status == "active"
    ).all()

    assigned_members = []
    for a in assignments:
        if a.employee:
            assigned_members.append(AssignedEmployeeInfo(
                employee_id=a.employee_id,
                display_name=a.employee.display_name,
                role=a.employee.role,
                allocated_hours=a.allocated_hours_per_week,
            ))

    return ProjectRead(
        id=proj.id,
        name=proj.name,
        description=proj.description or "",
        start_date=proj.start_date,
        end_date=proj.end_date,
        team_size=proj.team_size,
        estimated_effort_hours_per_week=proj.estimated_effort_hours_per_week,
        status=proj.status,
        skill_requirements=reqs,
        assigned_employees=assigned_members,
    )


@router.get("/projects", response_model=List[ProjectRead])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.id).all()
    return [enrich_project(p, db) for p in projects]


@router.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return enrich_project(proj, db)


@router.post("/projects", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    try:
        proj = Project(
            name=payload.name.strip(),
            description=(payload.description or "").strip(),
            start_date=payload.start_date,
            end_date=payload.end_date,
            team_size=max(1, payload.team_size),
            estimated_effort_hours_per_week=max(0.0, payload.estimated_effort_hours_per_week),
            status=payload.status,
        )
        db.add(proj)
        db.flush()

        seen_reqs = {}
        for r in payload.skill_requirements:
            s_id = r.skill_id
            if s_id not in seen_reqs:
                seen_reqs[s_id] = r
            else:
                # Keep higher proficiency and mandatory flag
                existing = seen_reqs[s_id]
                seen_reqs[s_id] = r if r.required_proficiency > existing.required_proficiency else existing
                if r.is_mandatory or existing.is_mandatory:
                    seen_reqs[s_id].is_mandatory = True

        for r in seen_reqs.values():
            req = ProjectSkillRequirement(
                project_id=proj.id,
                skill_id=r.skill_id,
                required_proficiency=r.required_proficiency,
                is_mandatory=r.is_mandatory,
            )
            db.add(req)

        db.commit()
        db.refresh(proj)
        return enrich_project(proj, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.patch("/projects/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        update_data = payload.model_dump(exclude_unset=True)
        reqs_data = update_data.pop("skill_requirements", None)

        for field, value in update_data.items():
            if isinstance(value, str):
                setattr(proj, field, value.strip())
            else:
                setattr(proj, field, value)

        if reqs_data is not None:
            db.query(ProjectSkillRequirement).filter(
                ProjectSkillRequirement.project_id == proj.id
            ).delete()

            seen_reqs = {}
            for r in reqs_data:
                s_id = r["skill_id"]
                if s_id not in seen_reqs:
                    seen_reqs[s_id] = r
                else:
                    if r["required_proficiency"] > seen_reqs[s_id]["required_proficiency"]:
                        seen_reqs[s_id] = r
                    if r.get("is_mandatory", True):
                        seen_reqs[s_id]["is_mandatory"] = True

            for r in seen_reqs.values():
                req = ProjectSkillRequirement(
                    project_id=proj.id,
                    skill_id=r["skill_id"],
                    required_proficiency=r["required_proficiency"],
                    is_mandatory=r.get("is_mandatory", True),
                )
                db.add(req)

        db.commit()
        db.refresh(proj)
        return enrich_project(proj, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"message": f"Project '{proj.name}' deleted successfully"}
