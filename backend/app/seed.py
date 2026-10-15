"""WorkForceIQ Seed Script - Realistic Synthetic Data for Hackathon Demos."""

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.models import (
    Skill,
    Employee,
    EmployeeSkill,
    Project,
    ProjectSkillRequirement,
    Assignment,
    TrainingCourse,
)


def seed_database(db: Session):
    """Idempotently re-seeds the database with rich synthetic workforce planning data."""
    # Drop and recreate all tables for a clean, deterministic seed
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Skills
    skills_data = [
        {"name": "Python", "category": "Backend"},
        {"name": "FastAPI", "category": "Backend"},
        {"name": "TypeScript", "category": "Frontend"},
        {"name": "React", "category": "Frontend"},
        {"name": "PostgreSQL", "category": "Database"},
        {"name": "Docker", "category": "DevOps"},
        {"name": "Kubernetes", "category": "DevOps"},
        {"name": "AWS Cloud", "category": "Cloud"},
        {"name": "LLMs & RAG", "category": "AI/ML"},
        {"name": "PyTorch", "category": "AI/ML"},
        {"name": "GraphQL", "category": "Backend"},
        {"name": "TailwindCSS", "category": "Frontend"},
        {"name": "CI/CD Automation", "category": "DevOps"},
        {"name": "Next.js", "category": "Frontend"},
        {"name": "Node.js", "category": "Backend"},
        {"name": "System Architecture", "category": "Architecture"},
        {"name": "UI/UX Design", "category": "Design"},
        {"name": "Redis", "category": "Database"},
    ]

    skill_instances = {}
    for item in skills_data:
        norm = item["name"].lower().replace(" ", "-").replace("&", "and")
        skill = Skill(
            name=item["name"],
            normalized_name=norm,
            category=item["category"],
        )
        db.add(skill)
        db.flush()
        skill_instances[item["name"]] = skill

    # 2. Employees (14 diverse synthetic profiles)
    employees_data = [
        # Overloaded senior backend / AI engineer
        {
            "display_name": "Dr. Sarah Chen",
            "role": "Lead AI Systems Architect",
            "department": "Core AI",
            "experience_years": 8.5,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("Python", 5, 8.0),
                ("LLMs & RAG", 5, 3.0),
                ("PyTorch", 4, 5.0),
                ("FastAPI", 5, 4.0),
                ("System Architecture", 5, 6.0),
                ("Docker", 4, 5.0),
            ],
        },
        # Overloaded senior fullstack engineer
        {
            "display_name": "Alex Rivera",
            "role": "Senior Full-Stack Engineer",
            "department": "Platform Engineering",
            "experience_years": 6.0,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("React", 5, 6.0),
                ("TypeScript", 5, 5.0),
                ("Node.js", 4, 5.0),
                ("Python", 4, 4.0),
                ("PostgreSQL", 4, 4.0),
                ("TailwindCSS", 5, 3.0),
            ],
        },
        # Underutilized talented backend / data engineer
        {
            "display_name": "Marcus Vance",
            "role": "Backend Engineer",
            "department": "Core AI",
            "experience_years": 3.5,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("Python", 4, 3.5),
                ("FastAPI", 4, 2.5),
                ("PostgreSQL", 4, 3.0),
                ("Docker", 3, 2.0),
                ("Redis", 3, 2.0),
            ],
        },
        # Underutilized frontend developer
        {
            "display_name": "Elena Rostova",
            "role": "Frontend Developer",
            "department": "Experience Engineering",
            "experience_years": 2.5,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("React", 4, 2.5),
                ("TypeScript", 4, 2.0),
                ("TailwindCSS", 4, 2.0),
                ("Next.js", 3, 1.5),
                ("UI/UX Design", 3, 2.0),
            ],
        },
        # Balanced DevOps / Cloud Lead
        {
            "display_name": "David Kim",
            "role": "Staff Cloud & DevOps Engineer",
            "department": "Infrastructure",
            "experience_years": 7.0,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("Docker", 5, 7.0),
                ("Kubernetes", 5, 5.0),
                ("AWS Cloud", 5, 6.0),
                ("CI/CD Automation", 5, 5.0),
                ("System Architecture", 4, 4.0),
                ("Python", 3, 4.0),
            ],
        },
        # Balanced AI Research Engineer
        {
            "display_name": "Priya Sharma",
            "role": "AI Research Scientist",
            "department": "Core AI",
            "experience_years": 5.0,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("Python", 5, 5.0),
                ("PyTorch", 5, 4.5),
                ("LLMs & RAG", 4, 2.5),
                ("FastAPI", 3, 2.0),
            ],
        },
        # Product & UI Engineer
        {
            "display_name": "Maya Patel",
            "role": "Product & UX Engineer",
            "department": "Experience Engineering",
            "experience_years": 4.5,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("UI/UX Design", 5, 4.5),
                ("React", 4, 4.0),
                ("TailwindCSS", 5, 4.0),
                ("TypeScript", 3, 3.0),
            ],
        },
        # Cloud / DevOps Associate
        {
            "display_name": "Jamal Washington",
            "role": "Cloud Infrastructure Engineer",
            "department": "Infrastructure",
            "experience_years": 3.0,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("Docker", 4, 3.0),
                ("AWS Cloud", 4, 3.0),
                ("CI/CD Automation", 4, 2.5),
                ("Kubernetes", 3, 2.0),
            ],
        },
        # Senior Backend Systems Engineer
        {
            "display_name": "Henrik Lindqvist",
            "role": "Principal Systems Engineer",
            "department": "Platform Engineering",
            "experience_years": 9.0,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("Python", 5, 9.0),
                ("System Architecture", 5, 8.0),
                ("PostgreSQL", 5, 7.0),
                ("Redis", 5, 6.0),
                ("GraphQL", 4, 4.0),
            ],
        },
        # Frontend UI Engineer
        {
            "display_name": "Chloe Martin",
            "role": "Senior UI Specialist",
            "department": "Experience Engineering",
            "experience_years": 5.5,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("React", 5, 5.0),
                ("TypeScript", 4, 4.5),
                ("TailwindCSS", 5, 4.0),
                ("Next.js", 4, 3.0),
            ],
        },
        # Junior Software Developer
        {
            "display_name": "Leo Zhang",
            "role": "Associate Full-Stack Developer",
            "department": "Platform Engineering",
            "experience_years": 1.5,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("Python", 3, 1.5),
                ("TypeScript", 3, 1.5),
                ("React", 3, 1.5),
                ("PostgreSQL", 2, 1.0),
            ],
        },
        # Data & Database Specialist
        {
            "display_name": "Amina Al-Mansoor",
            "role": "Database Architect",
            "department": "Platform Engineering",
            "experience_years": 6.5,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 100.0,
            "active": True,
            "skills": [
                ("PostgreSQL", 5, 6.5),
                ("Redis", 5, 5.0),
                ("Python", 4, 4.0),
                ("System Architecture", 4, 4.0),
            ],
        },
        # Part-time / Reduced availability engineer
        {
            "display_name": "Samuel O'Connor",
            "role": "DevOps Consultant",
            "department": "Infrastructure",
            "experience_years": 5.0,
            "weekly_capacity_hours": 20.0,  # 20 hours part-time
            "availability_percent": 80.0,
            "active": True,
            "skills": [
                ("Docker", 4, 5.0),
                ("Kubernetes", 4, 4.0),
                ("AWS Cloud", 4, 4.0),
            ],
        },
        # Inactive demo employee
        {
            "display_name": "Rachel Green (On Leave)",
            "role": "Staff Product Designer",
            "department": "Experience Engineering",
            "experience_years": 6.0,
            "weekly_capacity_hours": 40.0,
            "availability_percent": 0.0,
            "active": False,
            "skills": [
                ("UI/UX Design", 5, 6.0),
                ("React", 3, 3.0),
            ],
        },
    ]

    emp_instances = {}
    for ed in employees_data:
        emp = Employee(
            display_name=ed["display_name"],
            role=ed["role"],
            department=ed["department"],
            experience_years=ed["experience_years"],
            weekly_capacity_hours=ed["weekly_capacity_hours"],
            availability_percent=ed["availability_percent"],
            active=ed["active"],
        )
        db.add(emp)
        db.flush()
        emp_instances[ed["display_name"]] = emp

        for s_name, prof, yrs in ed["skills"]:
            if s_name in skill_instances:
                es = EmployeeSkill(
                    employee_id=emp.id,
                    skill_id=skill_instances[s_name].id,
                    proficiency_level=prof,
                    years_experience=yrs,
                )
                db.add(es)

    db.flush()

    # 3. Projects (4 distinct scenarios)
    projects_data = [
        {
            "name": "Customer AI Co-pilot",
            "description": "GenAI-powered conversational co-pilot for automated enterprise client workflows.",
            "start_date": "2026-11-01",
            "end_date": "2027-04-30",
            "team_size": 3,
            "estimated_effort_hours_per_week": 30.0,
            "status": "active",
            "requirements": [
                ("Python", 4, True),
                ("LLMs & RAG", 4, True),
                ("FastAPI", 3, True),
                ("React", 3, False),
            ],
        },
        {
            "name": "Cloud Native Microservices Modernization",
            "description": "Containerizing legacy monoliths and establishing automated GitOps deployment across multi-region Kubernetes.",
            "start_date": "2026-12-01",
            "end_date": "2027-06-30",
            "team_size": 3,
            "estimated_effort_hours_per_week": 24.0,
            "status": "planning",
            "requirements": [
                ("Kubernetes", 4, True),
                ("Docker", 4, True),
                ("AWS Cloud", 4, True),
                ("CI/CD Automation", 3, False),
                ("System Architecture", 4, False),
            ],
        },
        {
            "name": "Mobile & Web Experience Redesign",
            "description": "High-performance responsive portal redesign with accessible design system and micro-animations.",
            "start_date": "2026-11-15",
            "end_date": "2027-03-15",
            "team_size": 3,
            "estimated_effort_hours_per_week": 21.0,
            "status": "planning",
            "requirements": [
                ("React", 4, True),
                ("TypeScript", 4, True),
                ("TailwindCSS", 4, True),
                ("UI/UX Design", 4, True),
            ],
        },
        {
            "name": "Real-Time Telemetry Pipeline",
            "description": "Sub-millisecond metric ingestion, anomaly filtering, and real-time dashboard streaming.",
            "start_date": "2026-10-01",
            "end_date": "2027-02-28",
            "team_size": 2,
            "estimated_effort_hours_per_week": 20.0,
            "status": "active",
            "requirements": [
                ("Python", 4, True),
                ("Redis", 4, True),
                ("PostgreSQL", 4, True),
                ("System Architecture", 4, False),
            ],
        },
    ]

    proj_instances = {}
    for pd in projects_data:
        proj = Project(
            name=pd["name"],
            description=pd["description"],
            start_date=pd["start_date"],
            end_date=pd["end_date"],
            team_size=pd["team_size"],
            estimated_effort_hours_per_week=pd["estimated_effort_hours_per_week"],
            status=pd["status"],
        )
        db.add(proj)
        db.flush()
        proj_instances[pd["name"]] = proj

        for s_name, prof, is_mand in pd["requirements"]:
            if s_name in skill_instances:
                req = ProjectSkillRequirement(
                    project_id=proj.id,
                    skill_id=skill_instances[s_name].id,
                    required_proficiency=prof,
                    is_mandatory=is_mand,
                )
                db.add(req)

    db.flush()

    # 4. Realistic Assignments (Creates Overloaded, Underutilized, and Optimal states)
    # Dr. Sarah Chen: assigned 28h to "Customer AI Co-pilot" + 18h to "Real-Time Telemetry Pipeline" -> 46h (115% Overloaded)
    # Alex Rivera: assigned 26h to "Customer AI Co-pilot" + 16h to "Real-Time Telemetry Pipeline" -> 42h (105% Overloaded)
    # David Kim: assigned 24h to "Customer AI Co-pilot" -> 24h / 40h (60% Underutilized / Optimal room)
    # Marcus Vance: assigned only 10h to "Real-Time Telemetry Pipeline" -> 10h / 40h (25% Underutilized!)
    # Elena Rostova: assigned 0h -> 0h / 40h (0% Underutilized!)
    # Henrik Lindqvist: assigned 32h to "Real-Time Telemetry Pipeline" -> 32h / 40h (80% Optimal)

    assignments_data = [
        ("Dr. Sarah Chen", "Customer AI Co-pilot", 26.0),
        ("Dr. Sarah Chen", "Real-Time Telemetry Pipeline", 18.0),  # Total 44.0h -> 110% Overloaded
        ("Alex Rivera", "Customer AI Co-pilot", 24.0),
        ("Alex Rivera", "Real-Time Telemetry Pipeline", 18.0),    # Total 42.0h -> 105% Overloaded
        ("David Kim", "Customer AI Co-pilot", 15.0),              # Total 15.0h -> 37.5% Underutilized
        ("Marcus Vance", "Real-Time Telemetry Pipeline", 12.0),   # Total 12.0h -> 30% Underutilized
        ("Henrik Lindqvist", "Real-Time Telemetry Pipeline", 30.0), # Total 30.0h -> 75% Optimal
        ("Priya Sharma", "Customer AI Co-pilot", 32.0),           # Total 32.0h -> 80% Optimal
        ("Chloe Martin", "Customer AI Co-pilot", 25.0),           # Total 25.0h -> 62.5% Available
    ]

    for emp_name, proj_name, hours in assignments_data:
        if emp_name in emp_instances and proj_name in proj_instances:
            assignment = Assignment(
                employee_id=emp_instances[emp_name].id,
                project_id=proj_instances[proj_name].id,
                allocated_hours_per_week=hours,
                status="active",
            )
            db.add(assignment)

    # 5. Local Training Catalogue (12 curated courses matching key skills)
    courses_data = [
        {
            "title": "Mastering LLMs, LangChain, and RAG Architectures",
            "skill": "LLMs & RAG",
            "level": "Advanced",
            "hours": 24.0,
            "provider": "AI Engineering Academy",
            "desc": "Hands-on implementation of retrieval-augmented generation, vector embeddings, rerankers, and production evaluation.",
        },
        {
            "title": "Deep Learning with PyTorch: From Tensors to Transformers",
            "skill": "PyTorch",
            "level": "Intermediate",
            "hours": 20.0,
            "provider": "DeepMind Lab Series",
            "desc": "Foundational and modern PyTorch workflows including multi-GPU training and model quantization.",
        },
        {
            "title": "Production Kubernetes & Service Meshes",
            "skill": "Kubernetes",
            "level": "Advanced",
            "hours": 18.0,
            "provider": "Cloud Native Institute",
            "desc": "Helm charts, ingress controllers, blue-green deployment strategies, and cluster observability.",
        },
        {
            "title": "Docker Foundations & Container Security",
            "skill": "Docker",
            "level": "Beginner",
            "hours": 12.0,
            "provider": "DevOps Training Hub",
            "desc": "Building minimal multi-stage images, vulnerability scanning, and local orchestration.",
        },
        {
            "title": "AWS Cloud Practitioner & Solutions Architect Prep",
            "skill": "AWS Cloud",
            "level": "Intermediate",
            "hours": 25.0,
            "provider": "Cloud Mastery",
            "desc": "VPCs, IAM roles, ECS, RDS high availability, and cost optimization patterns.",
        },
        {
            "title": "Advanced React 19 Patterns & Concurrent Features",
            "skill": "React",
            "level": "Advanced",
            "hours": 16.0,
            "provider": "Frontend Guild",
            "desc": "Server components, optimistic state updates, custom performance hooks, and accessibility audits.",
        },
        {
            "title": "TypeScript Mastery for Large-Scale Enterprise Applications",
            "skill": "TypeScript",
            "level": "Intermediate",
            "hours": 14.0,
            "provider": "Frontend Guild",
            "desc": "Generics, utility types, conditional types, and strict compiler configurations.",
        },
        {
            "title": "Modern Styling with TailwindCSS & Radix UI",
            "skill": "TailwindCSS",
            "level": "Beginner",
            "hours": 10.0,
            "provider": "UI/UX Institute",
            "desc": "Utility-first architecture, fluid typography, dark mode theming, and responsive layouts.",
        },
        {
            "title": "High Performance PostgreSQL: Indexing & Query Tuning",
            "skill": "PostgreSQL",
            "level": "Advanced",
            "hours": 16.0,
            "provider": "Data Systems Academy",
            "desc": "EXPLAIN ANALYZE interpretation, partitioning, connection pooling, and MVCC internals.",
        },
        {
            "title": "Building Ultra-Fast APIs with FastAPI & Pydantic v2",
            "skill": "FastAPI",
            "level": "Intermediate",
            "hours": 12.0,
            "provider": "Backend Guild",
            "desc": "Asynchronous dependency injection, streaming responses, OpenAPI generation, and OAuth2.",
        },
        {
            "title": "Design Systems & Human-Centered UX for Engineers",
            "skill": "UI/UX Design",
            "level": "Intermediate",
            "hours": 15.0,
            "provider": "Design Guild",
            "desc": "Component design tokens, contrast guidelines, micro-interactions, and usability testing.",
        },
        {
            "title": "Distributed Caching and Event Streaming with Redis",
            "skill": "Redis",
            "level": "Intermediate",
            "hours": 10.0,
            "provider": "Data Systems Academy",
            "desc": "In-memory data structures, pub/sub, rate limiting, and Redis cluster failover.",
        },
    ]

    for cd in courses_data:
        if cd["skill"] in skill_instances:
            course = TrainingCourse(
                title=cd["title"],
                skill_id=skill_instances[cd["skill"]].id,
                level=cd["level"],
                estimated_hours=cd["hours"],
                description=cd["desc"],
                provider=cd["provider"],
            )
            db.add(course)

    db.commit()
    print("WorkForceIQ database successfully seeded with synthetic demo records.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
