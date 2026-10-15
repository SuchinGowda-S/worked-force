from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Employee, Assignment, Project, ProjectSkillRequirement
from app.schemas.schemas import (
    WorkloadSummaryResponse,
    EmployeeWorkloadItem,
    EmployeeAssignmentDetail,
    ReallocationSuggestion,
)
from app.services.workload import calculate_employee_workload, generate_reallocation_suggestions

router = APIRouter()


def build_workload_data(db: Session) -> WorkloadSummaryResponse:
    employees = db.query(Employee).all()
    assignments = db.query(Assignment).filter(Assignment.status == "active").all()
    projects = db.query(Project).all()
    proj_lookup = {p.id: p.name for p in projects}

    # Project requirements lookup for skill checks during reallocation
    proj_reqs = db.query(ProjectSkillRequirement).all()
    project_skills = {}
    for r in proj_reqs:
        if r.project_id not in project_skills:
            project_skills[r.project_id] = []
        project_skills[r.project_id].append(r.skill_id)

    emp_assignments = {}
    for a in assignments:
        if a.employee_id not in emp_assignments:
            emp_assignments[a.employee_id] = []
        emp_assignments[a.employee_id].append(a)

    items: List[EmployeeWorkloadItem] = []
    overloaded_count = 0
    underutilized_count = 0
    optimal_count = 0
    total_util = 0.0

    raw_emp_list = []

    for emp in employees:
        active_list = emp_assignments.get(emp.id, [])
        assigned_hours = sum(a.allocated_hours_per_week for a in active_list)

        rem_cap, util_percent, status_cat = calculate_employee_workload(
            weekly_capacity=emp.weekly_capacity_hours,
            assigned_hours=assigned_hours,
            availability_percent=emp.availability_percent,
        )

        if emp.active:
            total_util += util_percent
            if status_cat == "overloaded":
                overloaded_count += 1
            elif status_cat == "underutilized":
                underutilized_count += 1
            else:
                optimal_count += 1

        detail_list = [
            EmployeeAssignmentDetail(
                project_id=a.project_id,
                project_name=proj_lookup.get(a.project_id, f"Project #{a.project_id}"),
                allocated_hours=a.allocated_hours_per_week,
            )
            for a in active_list
        ]

        item = EmployeeWorkloadItem(
            employee_id=emp.id,
            display_name=emp.display_name,
            role=emp.role,
            department=emp.department,
            weekly_capacity_hours=emp.weekly_capacity_hours,
            assigned_hours=round(assigned_hours, 1),
            remaining_capacity=rem_cap,
            utilization_percent=util_percent,
            status_category=status_cat,
            assignments=detail_list,
        )
        items.append(item)

        raw_emp_list.append({
            "employee_id": emp.id,
            "display_name": emp.display_name,
            "weekly_capacity_hours": emp.weekly_capacity_hours,
            "assigned_hours": assigned_hours,
            "utilization_percent": util_percent,
            "active": emp.active,
            "skills": [{"skill_id": es.skill_id} for es in emp.skills],
            "assignments": [
                {
                    "project_id": a.project_id,
                    "project_name": proj_lookup.get(a.project_id, f"Project #{a.project_id}"),
                    "allocated_hours": a.allocated_hours_per_week,
                }
                for a in active_list
            ],
        })

    active_emp_count = len([e for e in employees if e.active])
    avg_util = round(total_util / max(1, active_emp_count), 1)

    # Generate suggestions
    raw_suggestions = generate_reallocation_suggestions(raw_emp_list, project_skills)
    suggestions = [ReallocationSuggestion(**s) for s in raw_suggestions]

    # Sort employees by utilization descending
    items.sort(key=lambda x: x.utilization_percent, reverse=True)

    return WorkloadSummaryResponse(
        total_employees=len(employees),
        avg_utilization=avg_util,
        overloaded_count=overloaded_count,
        underutilized_count=underutilized_count,
        optimal_count=optimal_count,
        employees=items,
        suggestions=suggestions,
    )


@router.get("/workload", response_model=WorkloadSummaryResponse)
def get_workload(db: Session = Depends(get_db)):
    return build_workload_data(db)


@router.post("/workload/recommend-reallocation", response_model=List[ReallocationSuggestion])
def recommend_reallocation(db: Session = Depends(get_db)):
    summary = build_workload_data(db)
    return summary.suggestions


@router.post("/workload/apply-reallocation")
def apply_reallocation(suggestion: ReallocationSuggestion, db: Session = Depends(get_db)):
    """Applies a manager-confirmed workload reallocation."""
    # Find existing assignment from the overloaded employee
    assign_from = db.query(Assignment).filter(
        Assignment.employee_id == suggestion.from_employee_id,
        Assignment.project_id == suggestion.project_id,
        Assignment.status == "active",
    ).first()

    if not assign_from:
        raise HTTPException(status_code=404, detail="Source assignment not found")

    try:
        hours_to_transfer = suggestion.hours_to_transfer
        assign_to = db.query(Assignment).filter(
            Assignment.employee_id == suggestion.to_employee_id,
            Assignment.project_id == suggestion.project_id,
            Assignment.status == "active",
        ).first()

        if assign_from.allocated_hours_per_week <= hours_to_transfer:
            actual_transferred = assign_from.allocated_hours_per_week
            if assign_to:
                assign_to.allocated_hours_per_week += actual_transferred
                db.delete(assign_from)
            else:
                assign_from.employee_id = suggestion.to_employee_id
        else:
            assign_from.allocated_hours_per_week -= hours_to_transfer
            if assign_to:
                assign_to.allocated_hours_per_week += hours_to_transfer
            else:
                new_assign = Assignment(
                    employee_id=suggestion.to_employee_id,
                    project_id=suggestion.project_id,
                    allocated_hours_per_week=hours_to_transfer,
                    status="active",
                )
                db.add(new_assign)

        db.commit()

        return {
            "status": "success",
            "message": f"Successfully reallocated {hours_to_transfer}h on '{suggestion.project_name}' from {suggestion.from_employee_name} to {suggestion.to_employee_name}.",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")
