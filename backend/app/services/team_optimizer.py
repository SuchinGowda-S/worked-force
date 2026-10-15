"""WorkForceIQ Team Optimizer - Combinatorial Multi-Criteria Selection."""

import itertools
from typing import List, Dict, Any, Tuple
from app.services.matching import score_candidate


def evaluate_team_combination(
    combo: Tuple[Dict[str, Any], ...],
    requirements: List[Dict[str, Any]],
    effort_per_member: float,
) -> float:
    """Evaluates a team combination across mandatory coverage, capacity, optional skills, and complementary breadth."""
    # Build map of best proficiency per skill in this combination
    team_skills: Dict[str, int] = {}
    distinct_skills = set()

    for member in combo:
        for ms in member["matched_skills"]:
            s_name = ms["skill_name"]
            prof = ms["proficiency"]
            distinct_skills.add(s_name)
            if s_name not in team_skills or prof > team_skills[s_name]:
                team_skills[s_name] = prof

    # 1. Mandatory skill coverage
    mandatory_covered = 0
    total_mandatory = 0
    mandatory_proficiency_points = 0

    for r in requirements:
        if r.get("is_mandatory", True):
            total_mandatory += 1
            s_name = r["skill_name"]
            req_prof = r.get("required_proficiency", 3)
            achieved = team_skills.get(s_name, 0)
            if achieved >= req_prof:
                mandatory_covered += 1
                mandatory_proficiency_points += 2
            elif achieved > 0:
                mandatory_proficiency_points += 1

    # 2. Optional skill coverage
    optional_covered = 0
    for r in requirements:
        if not r.get("is_mandatory", True):
            s_name = r["skill_name"]
            req_prof = r.get("required_proficiency", 3)
            achieved = team_skills.get(s_name, 0)
            if achieved >= req_prof:
                optional_covered += 1

    # 3. Capacity constraints (penalize members who exceed 100% capacity)
    overloaded_count = sum(1 for m in combo if m["projected_utilization"] > 100.0)

    # 4. Average individual score
    avg_score = sum(m["overall_score"] for m in combo) / len(combo)

    # Combinatorial Objective Score
    # Highly rewards covering all mandatory skills, heavily penalizes overload
    combo_score = (
        (mandatory_covered * 1000.0)
        + (mandatory_proficiency_points * 100.0)
        - (overloaded_count * 600.0)
        + (optional_covered * 40.0)
        + (len(distinct_skills) * 5.0)
        + avg_score
    )

    return combo_score


def optimize_team(
    project: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    skills_lookup: Dict[int, str],
) -> Dict[str, Any]:
    """Selects an optimal complementary team using combinatorial optimization with deterministic constraints."""
    team_size = max(1, project.get("team_size", 3))
    total_effort = max(0.0, project.get("estimated_effort_hours_per_week", 20.0))
    effort_per_member = round(total_effort / float(team_size), 1)
    requirements = project.get("skill_requirements", [])

    # Enrich requirements with skill_name if missing
    for r in requirements:
        if "skill_name" not in r or not r["skill_name"]:
            r["skill_name"] = skills_lookup.get(r["skill_id"], f"Skill #{r['skill_id']}")

    # Score all candidates individually
    scored_candidates = []
    for cand in candidates:
        if cand.get("active", True):
            sc = score_candidate(cand, requirements, effort_per_member)
            scored_candidates.append(sc)

    # Sort candidates by overall score descending
    scored_candidates.sort(key=lambda x: x["overall_score"], reverse=True)

    # Combinatorial Selection Algorithm
    selected_team: List[Dict[str, Any]] = []

    if len(scored_candidates) <= team_size:
        # If pool size is less than or equal to team size, select all available candidates
        selected_team = [dict(c) for c in scored_candidates]
        for m in selected_team:
            m["is_selected"] = True
    else:
        # Separate candidates with sufficient capacity from those who would be overloaded
        sufficient_capacity = [c for c in scored_candidates if c["remaining_capacity"] >= effort_per_member]
        limited_capacity = [c for c in scored_candidates if c["remaining_capacity"] < effort_per_member]

        # Prioritize candidates with sufficient capacity; cap candidate pool to top 20 for fast evaluation
        if len(sufficient_capacity) >= team_size:
            candidate_pool = sufficient_capacity[:20]
        else:
            needed = team_size - len(sufficient_capacity)
            candidate_pool = sufficient_capacity + limited_capacity[: max(needed, 10)]

        # Evaluate combinations of size team_size
        best_combo = None
        best_combo_score = -float("inf")

        for combo in itertools.combinations(candidate_pool, team_size):
            score = evaluate_team_combination(combo, requirements, effort_per_member)
            if score > best_combo_score:
                best_combo_score = score
                best_combo = combo

        if best_combo:
            selected_team = [dict(c) for c in best_combo]
            for m in selected_team:
                m["is_selected"] = True

    # Mark is_selected in candidate_rankings
    selected_ids = {m["employee_id"] for m in selected_team}
    for cand in scored_candidates:
        cand["is_selected"] = cand["employee_id"] in selected_ids
        if cand["is_selected"]:
            cand["exclusion_reason"] = None
        elif not cand["exclusion_reason"]:
            cand["exclusion_reason"] = "Lower relative fit score or skills already covered by selected team."

    # Calculate Skill Coverage details across the selected team
    skill_coverage_list = []
    missing_mandatory_names = []
    missing_optional_names = []

    for req in requirements:
        req_id = req["skill_id"]
        req_name = req["skill_name"]
        req_prof = req.get("required_proficiency", 3)
        is_mand = req.get("is_mandatory", True)

        best_prof = 0
        covering_members = []

        for member in selected_team:
            for ms in member["matched_skills"]:
                if ms["skill_name"] == req_name:
                    if ms["proficiency"] > best_prof:
                        best_prof = ms["proficiency"]
                    if ms["proficiency"] >= req_prof:
                        covering_members.append(f"{member['display_name']} (Lvl {ms['proficiency']})")

        # Covered if at least one member meets or exceeds required proficiency
        is_covered = (best_prof >= req_prof)

        if not is_covered:
            if is_mand:
                missing_mandatory_names.append(req_name)
            else:
                missing_optional_names.append(req_name)

        skill_coverage_list.append({
            "skill_id": req_id,
            "skill_name": req_name,
            "required_proficiency": req_prof,
            "is_mandatory": is_mand,
            "is_covered": is_covered,
            "best_team_proficiency": best_prof,
            "covering_members": covering_members if covering_members else (
                [f"Best: Lvl {best_prof}"] if best_prof > 0 else ["Uncovered"]
            ),
        })

    # Constraint & Feasibility Checks
    constraints_violated = []
    if len(selected_team) < team_size:
        constraints_violated.append(
            f"Insufficient available staff: Found {len(selected_team)} candidates for a target team size of {team_size}."
        )

    if missing_mandatory_names:
        constraints_violated.append(
            f"Mandatory skill gaps detected: {', '.join(missing_mandatory_names)} not met at required proficiency."
        )

    # Over capacity check (> 100% weekly utilization)
    overloaded_members = [
        f"{m['display_name']} ({m['projected_utilization']}%)"
        for m in selected_team
        if m["projected_utilization"] > 100.0
    ]
    if overloaded_members:
        constraints_violated.append(
            f"Capacity constraint exceeded: {', '.join(overloaded_members)} would exceed maximum weekly capacity."
        )

    is_feasible = (len(constraints_violated) == 0)

    # Calculate total team score
    total_team_score = 0.0
    if selected_team:
        total_team_score = round(sum(m["overall_score"] for m in selected_team) / len(selected_team), 1)

    return {
        "project_id": project.get("id", 0),
        "project_name": project.get("name", "Unnamed Project"),
        "is_feasible": is_feasible,
        "constraints_violated": constraints_violated,
        "missing_mandatory_skills": missing_mandatory_names,
        "missing_optional_skills": missing_optional_names,
        "selected_team": selected_team,
        "candidate_rankings": scored_candidates,
        "skill_coverage": skill_coverage_list,
        "recommended_courses": [],  # Populated by skill_gaps service
        "total_team_score": total_team_score,
    }
