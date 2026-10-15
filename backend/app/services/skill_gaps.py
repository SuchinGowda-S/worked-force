"""WorkForceIQ Skill Gaps & Training Matcher."""

from typing import List, Dict, Any


def find_training_for_skill_gaps(
    skill_coverage: List[Dict[str, Any]],
    courses: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Matches uncovered project skills or low proficiency skills with relevant courses from the local catalogue."""
    recommended_courses = []
    seen_courses = set()

    # Index courses by skill_id
    courses_by_skill = {}
    for c in courses:
        s_id = c["skill_id"]
        if s_id not in courses_by_skill:
            courses_by_skill[s_id] = []
        courses_by_skill[s_id].append(c)

    for item in skill_coverage:
        s_id = item["skill_id"]
        s_name = item["skill_name"]
        is_covered = item["is_covered"]
        best_prof = item["best_team_proficiency"]
        req_prof = item["required_proficiency"]
        is_mand = item["is_mandatory"]

        if not is_covered or best_prof < req_prof:
            matched_catalog = courses_by_skill.get(s_id, [])
            for c in matched_catalog:
                if c["id"] not in seen_courses:
                    seen_courses.add(c["id"])
                    
                    if not is_covered:
                        reason = f"Essential: '{s_name}' is currently uncovered on the proposed team."
                    else:
                        reason = f"Up-skilling: Team proficiency in '{s_name}' is Level {best_prof}, but project requires Level {req_prof}."

                    recommended_courses.append({
                        "course_id": c["id"],
                        "title": c["title"],
                        "skill_id": s_id,
                        "skill_name": s_name,
                        "level": c.get("level", "Intermediate"),
                        "estimated_hours": c.get("estimated_hours", 10.0),
                        "provider": c.get("provider", "Internal Academy"),
                        "description": c.get("description", ""),
                        "reason": reason,
                    })

    return recommended_courses
