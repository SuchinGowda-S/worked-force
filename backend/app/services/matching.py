"""WorkForceIQ Matching Engine - Deterministic Explainable Scoring.

Weights:
- Skill Fit: 50%
- Experience Fit: 20%
- Availability: 20%
- Workload Suitability: 10%
All components normalized to [0, 100].
"""

from typing import Dict, List, Any, Optional, Tuple


def calculate_skill_fit(
    employee_skills: Dict[int, int],  # skill_id -> proficiency (1-5)
    requirements: List[Dict[str, Any]],  # list of {skill_id, required_proficiency, is_mandatory, skill_name}
) -> Tuple[float, List[Dict[str, Any]], List[str]]:
    """Calculates skill fit score (0-100), matched skill details, and missing skills.
    
    Formula:
    For each required skill:
      - If employee has the skill:
          ratio = min(emp_prof / req_prof, 1.25)
          weighted by 1.5 if mandatory, 1.0 if optional
      - If employee lacks mandatory skill:
          penalize mandatory requirement (0 points earned for this requirement)
    
    Final score is normalized against total potential weighted points:
    raw_score = sum(earned_points) / sum(max_points) * 100
    If any mandatory skill is completely missing, raw_score is penalized by 30% per missing mandatory skill.
    """
    if not requirements:
        return 100.0, [], []

    earned_points = 0.0
    total_possible_points = 0.0
    matched_skills = []
    missing_skills = []
    missing_mandatory_count = 0

    for req in requirements:
        s_id = req["skill_id"]
        s_name = req.get("skill_name", f"Skill {s_id}")
        req_prof = max(1, req.get("required_proficiency", 3))
        is_mand = req.get("is_mandatory", True)
        weight = 1.5 if is_mand else 1.0
        max_req_points = weight * 1.0
        total_possible_points += max_req_points

        if s_id in employee_skills:
            emp_prof = employee_skills[s_id]
            # Cap bonus at 1.25 to avoid excessive reward for overqualification
            proficiency_ratio = min(emp_prof / float(req_prof), 1.25)
            # If below required proficiency for mandatory, reduce credit
            if is_mand and emp_prof < req_prof:
                ratio_factor = (emp_prof / float(req_prof)) ** 1.5
            else:
                ratio_factor = proficiency_ratio

            earned = weight * min(1.0, ratio_factor)
            earned_points += earned
            matched_skills.append({
                "skill_name": s_name,
                "proficiency": emp_prof,
                "required_proficiency": req_prof,
                "is_mandatory": is_mand,
            })
        else:
            missing_skills.append(s_name)
            if is_mand:
                missing_mandatory_count += 1

    if total_possible_points <= 0.0:
        base_score = 100.0
    else:
        base_score = (earned_points / total_possible_points) * 100.0

    # Explicit penalty for missing mandatory skills
    penalty_multiplier = max(0.0, 1.0 - (missing_mandatory_count * 0.35))
    final_score = round(base_score * penalty_multiplier, 1)

    return max(0.0, min(100.0, final_score)), matched_skills, missing_skills


def calculate_experience_fit(
    employee_years: float,
    expected_years: float = 3.0,
) -> float:
    """Calculates experience fit score (0-100).
    
    Formula:
    ratio = employee_years / expected_years
    If ratio >= 1.0: 100 score (with slight curve for senior experience).
    If ratio < 1.0: linear scaling from 0 to 100.
    """
    if expected_years <= 0.0:
        return 100.0
    if employee_years <= 0.0:
        return 20.0  # Entry level baseline

    ratio = employee_years / expected_years
    if ratio >= 1.0:
        # Full score with minor bonus cap
        score = 100.0
    else:
        score = max(20.0, ratio * 100.0)

    return round(max(0.0, min(100.0, score)), 1)


def calculate_availability_fit(
    weekly_capacity: float,
    current_assigned_hours: float,
    project_effort_per_member: float,
    availability_percent: float = 100.0,
) -> Tuple[float, float, float]:
    """Calculates availability score (0-100), remaining capacity, and projected utilization.
    
    Formula:
    remaining_capacity = (weekly_capacity * availability_percent / 100.0) - current_assigned_hours
    """
    effective_capacity = max(0.0, (weekly_capacity * (availability_percent / 100.0)))
    remaining_capacity = max(0.0, effective_capacity - current_assigned_hours)
    
    if effective_capacity <= 0.0:
        return 0.0, 0.0, 100.0

    projected_load = current_assigned_hours + project_effort_per_member
    projected_utilization = round((projected_load / effective_capacity) * 100.0, 1)

    # If employee has enough remaining capacity for the project effort:
    if remaining_capacity >= project_effort_per_member:
        # Higher score if they have comfortable room without sitting completely idle
        headroom = remaining_capacity - project_effort_per_member
        score = 90.0 + min(10.0, (headroom / effective_capacity) * 20.0)
    else:
        # Penalize proportional to shortage
        shortage = project_effort_per_member - remaining_capacity
        shortage_ratio = min(1.0, shortage / max(1.0, project_effort_per_member))
        score = max(0.0, (1.0 - shortage_ratio) * 70.0)

    return round(score, 1), round(remaining_capacity, 1), projected_utilization


def calculate_workload_suitability(
    current_utilization: float,
    projected_utilization: float,
) -> float:
    """Calculates workload suitability (0-100).
    
    Rewards moving an employee toward the sweet spot (70%-90% utilization).
    Penalizes pushing an employee over 100% (over-capacity) or keeping them severely underutilized.
    """
    if projected_utilization > 115.0:
        # Severe overload
        return 5.0
    elif projected_utilization > 100.0:
        # Mild overload
        return 30.0
    elif 70.0 <= projected_utilization <= 95.0:
        # Ideal utilization range
        return 100.0
    elif projected_utilization < 40.0:
        # Substantially underutilized
        return 65.0
    else:
        # Acceptable (40-69% or 95-100%)
        return 85.0


def score_candidate(
    employee: Dict[str, Any],
    requirements: List[Dict[str, Any]],
    project_effort_per_member: float,
    expected_experience_years: float = 3.0,
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """Evaluates an employee candidate against project requirements and returns full explainable score."""
    if weights is None:
        weights = {
            "skill_fit": 0.50,
            "experience": 0.20,
            "availability": 0.20,
            "workload": 0.10,
        }

    weekly_capacity = employee.get("weekly_capacity_hours", 40.0)
    current_hours = employee.get("active_assignment_hours", 0.0)
    availability_percent = employee.get("availability_percent", 100.0)
    experience_years = employee.get("experience_years", 1.0)
    emp_skills = {s["skill_id"]: s["proficiency_level"] for s in employee.get("skills", [])}

    # 1. Skill Fit
    skill_fit_score, matched_skills, missing_skills = calculate_skill_fit(emp_skills, requirements)

    # 2. Experience Fit
    experience_score = calculate_experience_fit(experience_years, expected_experience_years)

    # 3. Availability Fit
    availability_score, remaining_capacity, projected_utilization = calculate_availability_fit(
        weekly_capacity, current_hours, project_effort_per_member, availability_percent
    )

    current_utilization = (current_hours / max(1.0, weekly_capacity)) * 100.0

    # 4. Workload Suitability
    workload_score = calculate_workload_suitability(current_utilization, projected_utilization)

    # Weighted Overall Score
    overall_score = round(
        (skill_fit_score * weights["skill_fit"])
        + (experience_score * weights["experience"])
        + (availability_score * weights["availability"])
        + (workload_score * weights["workload"]),
        1,
    )

    # Plain-language explainable rationale
    reasons = []
    if skill_fit_score >= 80:
        reasons.append(f"Strong skill match covering {len(matched_skills)} required skill(s)")
    elif skill_fit_score >= 50:
        reasons.append(f"Partial skill match ({len(matched_skills)} skills matched)")
    else:
        reasons.append(f"Low skill overlap ({len(missing_skills)} skills missing)")

    if remaining_capacity >= project_effort_per_member:
        reasons.append(f"{remaining_capacity}h weekly capacity available")
    else:
        reasons.append(f"Capacity constrained ({remaining_capacity}h remaining vs {project_effort_per_member}h needed)")

    if experience_years >= expected_experience_years:
        reasons.append(f"{experience_years} yrs seasoned experience")

    rationale = "; ".join(reasons) + "."

    # Determine explicit exclusion reason for candidates not selected
    missing_mandatory = [
        r.get("skill_name", f"Skill {r['skill_id']}")
        for r in requirements
        if r.get("is_mandatory", True) and r.get("skill_name", f"Skill {r['skill_id']}") in missing_skills
    ]

    exclusion_reason = None
    if not employee.get("active", True):
        exclusion_reason = "Employee is inactive."
    elif remaining_capacity < project_effort_per_member:
        exclusion_reason = f"Insufficient capacity ({remaining_capacity}h available vs {project_effort_per_member}h needed)."
    elif missing_mandatory:
        exclusion_reason = f"Lacks mandatory skill(s): {', '.join(missing_mandatory)}."

    return {
        "employee_id": employee["id"],
        "display_name": employee["display_name"],
        "role": employee["role"],
        "department": employee.get("department", "Engineering"),
        "overall_score": overall_score,
        "component_scores": {
            "skill_fit": skill_fit_score,
            "experience": experience_score,
            "availability": availability_score,
            "workload": workload_score,
        },
        "rationale": rationale,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "current_hours": current_hours,
        "remaining_capacity": remaining_capacity,
        "proposed_allocation": project_effort_per_member,
        "projected_utilization": projected_utilization,
        "is_selected": False,
        "exclusion_reason": exclusion_reason,
    }
