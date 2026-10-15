# WorkForceIQ --- Agent Instructions for Antigravity

## 1. Project Mission

Build **WorkForceIQ**, an AI-assisted workforce planning web application
for managers. It should help organizations: - Match employees to project
requirements using skills, experience, availability, and workload. -
Recommend balanced project teams with complementary skills. - Identify
project skill gaps and suggest relevant training. - Detect overloaded
and underutilized employees. - Recommend workload reallocations and show
before/after impact.

**Important source note:** The supplied hackathon PDF contains a title
about environmental awareness/navigation for visually impaired people,
but the detailed problem description, scenarios, implementation guide,
and judging criteria describe workforce management/HR technology. This
project follows the detailed workforce-management description. If the
organizers confirm a different intended problem, stop and revise the
scope before proceeding.

## 2. How You Should Work

Act as a pragmatic senior full-stack engineer and product designer. 1.
Inspect the existing repository before changing anything. Preserve
working code and established conventions. 2. If the repository is empty,
scaffold the project using the stack below. 3. Build a working
end-to-end MVP, not just static mockups. 4. Work in small, verifiable
stages. After each stage, run relevant checks and fix errors before
moving on. 5. Do not claim a feature works unless it is implemented and
tested. 6. Do not hardcode dashboard results. Use seeded data through
the same application data flow as real records. 7. Avoid unnecessary
complexity, paid services, external API keys, or model training. 8. If a
detail is unspecified, choose a sensible, simple default and document it
rather than blocking progress. 9. Keep the application easy for a
hackathon team to understand, demo, and extend. 10. When finished,
provide setup/run instructions, a feature summary, test results, known
limitations, and the exact commands needed to run it.

## 3. Preferred Technology Stack

Use this stack unless the repository already has a working equivalent: -
Frontend: React + TypeScript + Vite. - Styling: Tailwind CSS, with
accessible reusable components. - Charts: Recharts. - Backend: Python +
FastAPI. - Validation: Pydantic. - Database: PostgreSQL when configured;
provide a straightforward local development option such as SQLite if
PostgreSQL is not available. - ORM: SQLAlchemy. - Optimization: start
with transparent deterministic Python logic; use Google OR-Tools only if
it materially improves team selection and can be installed reliably. -
Testing: Pytest for backend logic; frontend tests if the project setup
supports them. - API documentation: FastAPI's built-in OpenAPI docs.

Do not add machine-learning libraries just to label the product
"AI-powered." The first version can use explainable scoring and
constraint-based optimization. Make clear in the UI that scores are
decision-support estimates, not objective measures of employee value.

## 4. Main User Journey

Implement this complete workflow: 1. A manager opens the dashboard and
sees employee count, active projects, average workload utilization, and
unresolved skill gaps. 2. The manager views, searches, and filters
employees. 3. The manager creates a project with a name, description,
required skills, proficiency levels, expected effort, time window, and
desired team size. 4. The application checks employee skills,
availability, and current workload. 5. The application recommends a
feasible team and explains why each person was selected. 6. The
application displays required-skill coverage, uncovered skills, matching
scores, and relevant training recommendations. 7. The manager reviews
workload reallocation suggestions and sees projected before/after
utilization. 8. The manager can save or dismiss a recommendation. Do not
silently change assignments without manager confirmation.

## 5. Core Pages

Build a cohesive, responsive manager-facing application with these
pages:

### A. Dashboard

-   Summary cards: employees, active projects, average utilization,
    skill gaps.
-   Workload distribution chart.
-   Skill coverage / gap summary.
-   Recent projects and recommended actions.
-   Clear empty states when there is no data.

### B. Employees

-   Search and filter employees by skill, availability, and workload.
-   Employee details: name or demo identifier, role, skills and
    proficiency, experience, capacity, assigned effort, availability,
    and training history.
-   Add/edit employee forms with validation.
-   Use synthetic demo data only; do not include real personal or
    confidential employee records.

### C. Projects

-   Project list with status, date range, team size, and staffing
    status.
-   Create/edit project form.
-   Required skills should have a proficiency level and an optional
    must-have flag.
-   Include a "Find best team" action.

### D. Team Recommendations

-   Rank eligible employees and show understandable score breakdowns.
-   Display selected team, coverage of each required skill, uncovered
    skills, and constraints.
-   Explain each recommendation in plain language.
-   Show why an employee was excluded when relevant (for example,
    unavailable or over capacity).
-   Allow manager review before applying changes.

### E. Workload Planner

-   Show assigned effort, available capacity, and utilization by
    employee.
-   Highlight over-capacity and underutilized employees.
-   Suggest possible reallocation actions and estimate projected
    utilization.
-   Do not recommend assigning work to someone who lacks a required
    skill or availability unless clearly marked as a trade-off requiring
    manager review.

### F. Skill Gaps and Training

-   Show required skills that the proposed team does not cover.
-   Recommend training from a small local catalogue of sample courses.
-   Match training recommendations to missing skills; do not invent
    external course links.
-   Distinguish "skill missing from the team" from "employee has no
    skill record."

## 6. Data Model

Use clear entities and relationships. Adapt to the existing repository
if appropriate.

### Employee

-   id
-   display_name (synthetic demo name or demo identifier)
-   role
-   experience_years
-   weekly_capacity_hours
-   availability_percent or explicit availability intervals
-   skills (relationship to Skill with proficiency level)
-   active status

### Skill

-   id
-   name
-   normalized_name

### EmployeeSkill

-   employee_id
-   skill_id
-   proficiency_level (for example 1--5)
-   years_experience, optional

### Project

-   id
-   name
-   description
-   start_date
-   end_date
-   team_size
-   estimated_effort_hours_per_week
-   status

### ProjectSkillRequirement

-   project_id
-   skill_id
-   required_proficiency (1--5)
-   is_mandatory

### Assignment

-   id
-   employee_id
-   project_id
-   allocated_hours_per_week
-   status

### TrainingCourse

-   id
-   title
-   skill_id
-   level
-   estimated_hours
-   description

Persist generated recommendations only if there is a clear need. Avoid
unnecessary tables and complexity.

## 7. Matching and Optimization Logic

Implement the matching engine as testable pure functions, separate from
API routes and UI code.

### Eligibility checks

-   Exclude inactive employees.
-   Consider availability for the project's time window.
-   Calculate remaining capacity after existing assignments.
-   Do not exceed remaining capacity without explicitly flagging the
    result as infeasible.
-   Treat mandatory skill requirements as hard constraints where
    feasible.

### Individual score

Use a configurable initial score: - Skill fit: 50% - Relevant
experience: 20% - Availability: 20% - Workload suitability: 10%

Normalize each component to 0--100. Document the normalization formula
and make sure it cannot divide by zero or produce NaN values. These
weights are initial design choices, not ground truth.

The skill-fit component should compare required skills and proficiency
levels with employee skills. Missing mandatory skills should lower the
score and be clearly explained. Do not reward irrelevant skills
excessively.

### Team selection

Do not simply choose the top N individual scores. Select a combination
that: - Covers as many mandatory skills as possible, ideally all. -
Meets the requested team size when feasible. - Respects availability and
remaining capacity. - Has complementary skills and minimizes redundant
coverage where possible. - Balances the workload across selected
members.

For a small demo dataset, a transparent greedy algorithm with iterative
improvement or exhaustive combinations can be adequate. If using a
solver, include a fallback when the solver is unavailable. If no
feasible team exists, return the closest feasible recommendation plus
explicit constraints and missing requirements; never pretend all
requirements are satisfied.

### Workload calculations

Use consistent effort units, preferably hours per week: -
`remaining_capacity = weekly_capacity_hours - sum(active_assignment_hours)` -
`projected_load = current_assigned_hours + proposed_assignment_hours` -
`projected_utilization = projected_load / weekly_capacity_hours * 100`

Handle zero capacity safely. Flag values above 100% as over capacity. Do
not treat availability percentage and utilization percentage as
interchangeable.

### Skill gaps and training

-   Compare all mandatory and optional project skills with the selected
    team's demonstrated skills.
-   Show required proficiency and achieved team proficiency/coverage.
-   Recommend relevant entries from the local training catalogue.
-   Keep missing data distinct from confirmed lack of a skill.

### Explainability

For each recommendation, return: - Overall score. - Component scores. -
Skills matched. - Skills missing or below proficiency. -
Availability/capacity rationale. - Any constraints or warnings.

## 8. API Design

Use REST endpoints with Pydantic request/response schemas. Suggested
endpoints: - `GET /api/health` - `GET /api/dashboard/summary` -
`GET /api/employees` - `POST /api/employees` -
`GET /api/employees/{employee_id}` -
`PATCH /api/employees/{employee_id}` - `GET /api/projects` -
`POST /api/projects` - `GET /api/projects/{project_id}` -
`PATCH /api/projects/{project_id}` -
`POST /api/projects/{project_id}/recommend-team` - `GET /api/workload` -
`POST /api/workload/recommend-reallocation` - `GET /api/skills/gaps` -
`GET /api/training`

Use consistent error responses and correct HTTP status codes. Validate
input on the backend even when the frontend also validates it. Configure
CORS narrowly for the local frontend origin.

## 9. UI and UX Requirements

-   Clean, modern HR-tech dashboard suitable for a hackathon
    presentation.
-   Responsive desktop and tablet layouts.
-   Consistent spacing, typography, cards, tables, and status
    indicators.
-   Use accessible labels, keyboard focus states, adequate contrast, and
    clear error messages.
-   Include loading, empty, success, and error states.
-   Use charts only when they communicate useful information; provide
    labels or a textual equivalent.
-   Add sample-data reset/seed functionality for reliable
    demonstrations.
-   Keep important actions explicit. Ask for confirmation before
    applying staffing or allocation changes.
-   Avoid fabricated live data, fake integrations, or misleading "AI
    confidence" claims.

## 10. Security, Privacy, and Fairness

-   Use synthetic demo data by default.
-   Never put secrets or API keys in source control or frontend code.
-   Validate and sanitize user input.
-   Do not use protected or irrelevant personal attributes to rank
    employees.
-   Treat recommendations as decision support; a manager must review
    them.
-   Explain ranking factors and allow the manager to inspect the score
    breakdown.
-   Do not claim compliance with any regulation unless it has been
    properly assessed.

## 11. Suggested Repository Layout

Adapt to the existing repository, but aim for a structure like:

``` text
workforceiq/
  frontend/
    src/
      components/
      pages/
      features/
        employees/
        projects/
        recommendations/
        workload/
      lib/
      types/
  backend/
    app/
      main.py
      api/
      models/
      schemas/
      services/
        matching.py
        team_optimizer.py
        workload.py
        skill_gaps.py
      db/
      seed.py
    tests/
  README.md
  .env.example
  AGENTS.md
```

Do not create duplicate app roots or multiple competing implementations.
Keep business logic out of UI components and route handlers.

## 12. Implementation Order

Work in this order and verify each phase before moving on.

### Phase 1 --- Repository inspection and plan

-   Inspect files, package manager, current code, and existing run
    scripts.
-   Summarize the current architecture and propose a minimal change
    plan.
-   Do not overwrite working files without reason.

### Phase 2 --- Working skeleton

-   Scaffold frontend and backend.
-   Add health endpoint and frontend API client.
-   Confirm both apps start and can communicate.

### Phase 3 --- Database and seeded data

-   Add schema/models and migrations or a reliable create-tables flow.
-   Seed enough synthetic employees, skills, projects, assignments, and
    courses to demonstrate varied cases.
-   Make seeding idempotent or provide a clear reset command.

### Phase 4 --- Matching engine

-   Implement pure matching, team selection, skill-gap, and workload
    functions.
-   Add unit tests for normal and edge cases before UI integration.

### Phase 5 --- API integration

-   Add validated endpoints and connect them to the database and
    services.
-   Test endpoints with the generated OpenAPI docs or automated tests.

### Phase 6 --- Frontend workflow

-   Implement dashboard, employees, projects, recommendations, workload,
    and training views.
-   Use real API responses, not duplicate hardcoded arrays.

### Phase 7 --- End-to-end verification

-   Test project creation through team recommendation and workload
    review.
-   Test no feasible team, missing skills, unavailable employees, zero
    capacity, empty database, and over-capacity scenarios.
-   Fix console errors, failed requests, and broken navigation.

### Phase 8 --- Demo and documentation

-   Write setup instructions, environment variables, seed/reset
    instructions, API notes, and limitations.
-   Prepare one reliable demo scenario and a short explanation of the
    algorithm.

## 13. Acceptance Criteria

The MVP is not complete until all applicable criteria pass: - The
frontend and backend can be started using documented commands. - The
dashboard reads data from the backend. - Employees and projects can be
created and viewed. - A manager can request a team recommendation for a
project. - Recommendations include scores and understandable
explanations. - Mandatory skill coverage and missing skills are
visible. - Workload calculations use consistent units and show projected
changes. - Infeasible recommendations are reported honestly. - Training
recommendations relate to actual skill gaps in the demo catalogue. -
Backend logic has tests for scoring, capacity limits, and team
coverage. - No critical errors appear in the browser console or backend
logs during the main demo. - The README explains known limitations and
does not overstate AI capabilities.

## 14. First Task for the Agent

Start by inspecting the repository. Then: 1. Report the existing
structure and whether an application already exists. 2. Identify any
blocking issues and the smallest viable implementation path. 3. Create a
concise task checklist. 4. Implement Phase 1 and Phase 2. 5. Run the
application and tests, fix issues, and report the exact result. 6.
Continue with the next phase only after the current phase works.

Do not stop after writing a plan or generating placeholder files. Build
and verify the actual application in the available workspace.
