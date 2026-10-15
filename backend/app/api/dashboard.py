from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Employee, Project, Assignment, EmployeeSkill
from app.schemas.schemas import (
    DashboardSummaryResponse,
    WorkloadDistributionBucket,
    SkillGapSummaryItem,
)
from app.api.projects import enrich_project
from app.services.workload import calculate_employee_workload

router = APIRouter()


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    projects = db.query(Project).all()
    active_projects = [p for p in projects if p.status == "active"]

    # Calculate employee workloads
    assignments = db.query(Assignment).filter(Assignment.status == "active").all()
    hours_by_emp = {}
    for a in assignments:
        hours_by_emp[a.employee_id] = hours_by_emp.get(a.employee_id, 0.0) + a.allocated_hours_per_week

    # Buckets for workload distribution chart
    bucket_counts = {
        "< 40% (Severely Under)": 0,
        "40% - 69% (Underutilized)": 0,
        "70% - 90% (Optimal Sweet Spot)": 0,
        "91% - 100% (High Capacity)": 0,
        "> 100% (Overloaded)": 0,
    }

    total_util = 0.0
    active_emp_count = 0

    for emp in employees:
        if not emp.active:
            continue
        active_emp_count += 1
        assigned = hours_by_emp.get(emp.id, 0.0)
        _, util, status = calculate_employee_workload(
            emp.weekly_capacity_hours, assigned, emp.availability_percent
        )
        total_util += util

        if util < 40.0:
            bucket_counts["< 40% (Severely Under)"] += 1
        elif util < 70.0:
            bucket_counts["40% - 69% (Underutilized)"] += 1
        elif util <= 90.0:
            bucket_counts["70% - 90% (Optimal Sweet Spot)"] += 1
        elif util <= 100.0:
            bucket_counts["91% - 100% (High Capacity)"] += 1
        else:
            bucket_counts["> 100% (Overloaded)"] += 1

    avg_util = round(total_util / max(1, active_emp_count), 1)

    distribution = [
        WorkloadDistributionBucket(
            range="< 40%",
            count=bucket_counts["< 40% (Severely Under)"],
            category="underutilized"
        ),
        WorkloadDistributionBucket(
            range="40-69%",
            count=bucket_counts["40% - 69% (Underutilized)"],
            category="underutilized"
        ),
        WorkloadDistributionBucket(
            range="70-90%",
            count=bucket_counts["70% - 90% (Optimal Sweet Spot)"],
            category="optimal"
        ),
        WorkloadDistributionBucket(
            range="91-100%",
            count=bucket_counts["91% - 100% (High Capacity)"],
            category="optimal"
        ),
        WorkloadDistributionBucket(
            range="> 100%",
            count=bucket_counts["> 100% (Overloaded)"],
            category="overloaded"
        ),
    ]

    # Calculate skill gaps in active/planning projects
    skill_gap_counts = {}
    unresolved_gaps_count = 0

    for proj in projects:
        if proj.status == "completed":
            continue

        proj_assignments = [a for a in assignments if a.project_id == proj.id]
        emp_ids = [a.employee_id for a in proj_assignments]

        team_skills = {}
        if emp_ids:
            emp_skills = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id.in_(emp_ids)).all()
            for es in emp_skills:
                team_skills[es.skill_id] = max(team_skills.get(es.skill_id, 0), es.proficiency_level)

        for req in proj.skill_requirements:
            s_id = req.skill_id
            s_name = req.skill.name if req.skill else f"Skill #{s_id}"
            achieved = team_skills.get(s_id, 0)
            if achieved < req.required_proficiency:
                unresolved_gaps_count += 1
                skill_gap_counts[s_name] = skill_gap_counts.get(s_name, 0) + 1

    skill_gaps_list = [
        SkillGapSummaryItem(
            skill_name=name,
            count=count,
            category="High Priority" if count >= 2 else "Medium Priority"
        )
        for name, count in sorted(skill_gap_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    recent_projects_enriched = [enrich_project(p, db) for p in projects[:5]]

    return DashboardSummaryResponse(
        employee_count=len(employees),
        active_projects_count=len(active_projects),
        avg_utilization_percent=avg_util,
        unresolved_skill_gaps=unresolved_gaps_count,
        workload_distribution=distribution,
        skill_gap_summary=skill_gaps_list,
        recent_projects=recent_projects_enriched,
    )
