from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Employee, EmployeeSkill, Assignment, Skill
from app.schemas.schemas import EmployeeCreate, EmployeeUpdate, EmployeeRead, EmployeeSkillRead
from app.services.workload import calculate_employee_workload

router = APIRouter()


def enrich_employee(emp: Employee, db: Session) -> EmployeeRead:
    # Compute active assignment hours
    active_assignments = db.query(Assignment).filter(
        Assignment.employee_id == emp.id,
        Assignment.status == "active"
    ).all()
    assigned_hours = sum(a.allocated_hours_per_week for a in active_assignments)
    
    rem_cap, util_percent, status_cat = calculate_employee_workload(
        weekly_capacity=emp.weekly_capacity_hours,
        assigned_hours=assigned_hours,
        availability_percent=emp.availability_percent,
    )

    # Format skills
    skill_items = []
    for es in emp.skills:
        skill_name = es.skill.name if es.skill else f"Skill #{es.skill_id}"
        category = es.skill.category if es.skill else "General"
        skill_items.append(EmployeeSkillRead(
            id=es.id,
            skill_id=es.skill_id,
            skill_name=skill_name,
            category=category,
            proficiency_level=es.proficiency_level,
            years_experience=es.years_experience or 1.0,
        ))

    return EmployeeRead(
        id=emp.id,
        display_name=emp.display_name,
        role=emp.role,
        department=emp.department,
        experience_years=emp.experience_years,
        weekly_capacity_hours=emp.weekly_capacity_hours,
        availability_percent=emp.availability_percent,
        active=emp.active,
        skills=skill_items,
        active_assignment_hours=round(assigned_hours, 1),
        current_utilization_percent=util_percent,
        status_category=status_cat,
    )


@router.get("/employees", response_model=List[EmployeeRead])
def get_employees(
    search: Optional[str] = Query(None, description="Search by name, role, or department"),
    skill: Optional[str] = Query(None, description="Filter by skill name"),
    workload: Optional[str] = Query(None, description="Filter by workload: overloaded, optimal, underutilized"),
    db: Session = Depends(get_db),
):
    query = db.query(Employee)
    
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (Employee.display_name.ilike(search_fmt)) |
            (Employee.role.ilike(search_fmt)) |
            (Employee.department.ilike(search_fmt))
        )

    employees = query.all()
    enriched = [enrich_employee(e, db) for e in employees]

    # Filter by skill if requested
    if skill:
        skill_lower = skill.lower()
        enriched = [
            e for e in enriched 
            if any(skill_lower in (s.skill_name or "").lower() for s in e.skills)
        ]

    # Filter by workload status if requested
    if workload:
        enriched = [e for e in enriched if e.status_category == workload.lower()]

    return enriched


@router.get("/employees/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return enrich_employee(emp, db)


@router.post("/employees", response_model=EmployeeRead, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    try:
        emp = Employee(
            display_name=payload.display_name.strip(),
            role=payload.role.strip(),
            department=payload.department.strip(),
            experience_years=payload.experience_years,
            weekly_capacity_hours=payload.weekly_capacity_hours,
            availability_percent=payload.availability_percent,
            active=payload.active,
        )
        db.add(emp)
        db.flush()

        # Deduplicate skills by skill_id
        seen_skills = {}
        for s in payload.skills:
            if s.skill_id not in seen_skills or s.proficiency_level > seen_skills[s.skill_id].proficiency_level:
                seen_skills[s.skill_id] = s

        for s in seen_skills.values():
            es = EmployeeSkill(
                employee_id=emp.id,
                skill_id=s.skill_id,
                proficiency_level=s.proficiency_level,
                years_experience=s.years_experience or 1.0,
            )
            db.add(es)

        db.commit()
        db.refresh(emp)
        return enrich_employee(emp, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")


@router.patch("/employees/{employee_id}", response_model=EmployeeRead)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    try:
        update_data = payload.model_dump(exclude_unset=True)
        skills_data = update_data.pop("skills", None)

        for field, value in update_data.items():
            if isinstance(value, str):
                setattr(emp, field, value.strip())
            else:
                setattr(emp, field, value)

        if skills_data is not None:
            # Replace skills with deduplication
            db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == emp.id).delete()
            seen_skills = {}
            for s in skills_data:
                s_id = s["skill_id"]
                s_prof = s["proficiency_level"]
                if s_id not in seen_skills or s_prof > seen_skills[s_id]["proficiency_level"]:
                    seen_skills[s_id] = s

            for s in seen_skills.values():
                es = EmployeeSkill(
                    employee_id=emp.id,
                    skill_id=s["skill_id"],
                    proficiency_level=s["proficiency_level"],
                    years_experience=s.get("years_experience", 1.0),
                )
                db.add(es)

        db.commit()
        db.refresh(emp)
        return enrich_employee(emp, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")


@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return {"message": f"Employee {emp.display_name} deleted successfully"}
