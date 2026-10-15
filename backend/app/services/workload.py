"""WorkForceIQ Workload Planner - Utilization Calculations & Reallocation Logic."""

from typing import List, Dict, Any, Tuple


def calculate_employee_workload(
    weekly_capacity: float,
    assigned_hours: float,
    availability_percent: float = 100.0,
) -> Tuple[float, float, str]:
    """Calculates remaining capacity, utilization percentage, and status category safely.
    
    Status categories:
    - 'overloaded': utilization > 100%
    - 'underutilized': utilization < 70%
    - 'optimal': 70% <= utilization <= 100%
    """
    effective_capacity = max(0.0, weekly_capacity * (availability_percent / 100.0))
    remaining_capacity = max(0.0, effective_capacity - assigned_hours)
    
    if effective_capacity <= 0.0:
        utilization_percent = 100.0 if assigned_hours > 0.0 else 0.0
    else:
        utilization_percent = round((assigned_hours / effective_capacity) * 100.0, 1)

    if utilization_percent > 100.0:
        status_category = "overloaded"
    elif utilization_percent < 70.0:
        status_category = "underutilized"
    else:
        status_category = "optimal"

    return round(remaining_capacity, 1), utilization_percent, status_category


def generate_reallocation_suggestions(
    employees: List[Dict[str, Any]],
    project_skills: Dict[int, List[int]],  # project_id -> list of skill_ids required
) -> List[Dict[str, Any]]:
    """Identifies overloaded employees and finds suitable underutilized employees with matching skills.
    
    Returns suggestions with projected before and after utilization for both parties.
    """
    overloaded = [e for e in employees if e.get("utilization_percent", 0.0) > 100.0]
    underutilized = [e for e in employees if e.get("utilization_percent", 0.0) < 70.0 and e.get("active", True)]

    suggestions = []

    # For each overloaded employee, look through their assignments
    for ov_emp in overloaded:
        assignments = ov_emp.get("assignments", [])
        ov_capacity = max(1.0, ov_emp.get("weekly_capacity_hours", 40.0))
        ov_hours = ov_emp.get("assigned_hours", 0.0)

        # Sort assignments by allocated hours descending to find meaningful transfers
        sorted_assignments = sorted(assignments, key=lambda a: a.get("allocated_hours", 0.0), reverse=True)

        for assign in sorted_assignments:
            p_id = assign.get("project_id")
            p_name = assign.get("project_name", f"Project #{p_id}")
            alloc_hours = assign.get("allocated_hours", 0.0)
            
            # Amount we want to offload (bring overloaded down towards 90%)
            excess_hours = max(5.0, ov_hours - (ov_capacity * 0.90))
            transfer_hours = round(min(alloc_hours, excess_hours), 1)

            if transfer_hours < 4.0:
                continue

            required_skills = set(project_skills.get(p_id, []))

            # Search underutilized candidates who have the required skills and room
            best_candidate = None
            best_room = -1.0

            for un_emp in underutilized:
                un_capacity = max(1.0, un_emp.get("weekly_capacity_hours", 40.0))
                un_hours = un_emp.get("assigned_hours", 0.0)
                un_room = un_capacity - un_hours

                # Candidate must be able to take transfer_hours without exceeding 95%
                if (un_hours + transfer_hours) / un_capacity <= 0.95:
                    # Check skill overlap
                    candidate_skills = {s["skill_id"] for s in un_emp.get("skills", [])}
                    if required_skills.issubset(candidate_skills) or len(candidate_skills.intersection(required_skills)) >= 1 or not required_skills:
                        if un_room > best_room:
                            best_room = un_room
                            best_candidate = un_emp

            if best_candidate:
                before_from = ov_emp["utilization_percent"]
                after_from = round(((ov_hours - transfer_hours) / ov_capacity) * 100.0, 1)

                to_capacity = max(1.0, best_candidate.get("weekly_capacity_hours", 40.0))
                before_to = best_candidate["utilization_percent"]
                after_to = round(((best_candidate.get("assigned_hours", 0.0) + transfer_hours) / to_capacity) * 100.0, 1)

                suggestions.append({
                    "from_employee_id": ov_emp["employee_id"],
                    "from_employee_name": ov_emp["display_name"],
                    "to_employee_id": best_candidate["employee_id"],
                    "to_employee_name": best_candidate["display_name"],
                    "project_id": p_id,
                    "project_name": p_name,
                    "hours_to_transfer": transfer_hours,
                    "reason": f"Reallocate {transfer_hours}h on '{p_name}' to relieve {ov_emp['display_name']} ({before_from}% -> {after_from}%) and utilize {best_candidate['display_name']} ({before_to}% -> {after_to}%).",
                    "before_utilization_from": before_from,
                    "after_utilization_from": after_from,
                    "before_utilization_to": before_to,
                    "after_utilization_to": after_to,
                })

                # Tentatively adjust hours for candidate to avoid over-subscribing in subsequent suggestions
                best_candidate["assigned_hours"] += transfer_hours
                best_candidate["utilization_percent"] = after_to
                ov_hours -= transfer_hours

                if ov_hours / ov_capacity <= 1.0:
                    break

    return suggestions
