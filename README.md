# WorkForceIQ — AI-Assisted Workforce Planning & Team Optimization Platform

WorkForceIQ is an explainable, decision-support platform designed for engineering managers to match staff to project requirements, recommend balanced teams with complementary skills, detect and bridge skill gaps with targeted training, and simulate workload reallocations with before-and-after utilization impact.

---

## 🚀 Key Features

1. **Executive Dashboard**:
   - Live KPI cards: Total Staff, Active Projects, Org-wide Utilization %, and Unresolved Skill Gaps.
   - Workload Distribution Bar Chart (Overloaded >100%, Optimal 70–100%, Underutilized <70%).
   - Unresolved Skill Gaps summary and recent project staffing statuses.
   - One-click **Reset Demo Data** action.

2. **Workforce Directory**:
   - Real-time search by name, role, or department.
   - Instant filtering by skill competency and workload state.
   - Real-time capacity utilization meters.
   - Add and Edit employee drawer with 1–5 skill proficiency sliders.

3. **Project Management**:
   - Manage initiative timelines, target team sizes, and weekly effort requirements.
   - Detailed competency requirements with proficiency levels and mandatory vs. optional flags.
   - One-click **Find Best Team** recommendation action.

4. **AI Team Recommendation & Explainability Engine**:
   - **Deterministic, Explainable Scoring**:
     - **Skill Fit (50%)**: Evaluates required vs. demonstrated proficiency; heavily penalizes missing mandatory skills.
     - **Experience (20%)**: Compares tenure with project complexity.
     - **Availability (20%)**: Remaining capacity over the project window.
     - **Workload Suitability (10%)**: Rewards moving toward the 70–90% sweet spot without exceeding capacity.
   - **Complementary Team Selection**: Maximizes mandatory skill coverage while minimizing redundant overlap.
   - **Explainability**: Plain-language rationales ("Why Sarah was selected") and 4-bar component score breakdowns.
   - **Skill Coverage Matrix**: Clear overview of covered vs. uncovered skills, team level achieved, and covering members.
   - **Candidate Pool Analysis**: Transparent reasons why candidates were excluded or ranked lower.
   - **Manager Review Workflow**: Confirmation dialog before any staffing assignments are committed.

5. **Workload Planner & Reallocation Simulation**:
   - Visual capacity breakdown bars per employee.
   - Automated reallocation proposals to offload overloaded staff onto qualified, underutilized peers.
   - Live **before-and-after utilization simulation** with instant one-click execution.

6. **Skill Gaps & Training Catalogue**:
   - Cross-project competency gap detection.
   - 12 curated local training courses matched to project shortfalls.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, Axios.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn.
- **Database**: SQLite default for zero-setup local dev (`sqlite:///./workforceiq.db`); PostgreSQL ready via `DATABASE_URL`.
- **Testing**: Pytest (19 unit and integration tests passing).

---

## 📋 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 1. Backend Setup & Run

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with synthetic demo records
python -m app.seed

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000`.
- Swagger / OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup & Run

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173` in your browser to launch WorkForceIQ.

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (19 tests)
```powershell
cd backend
.\venv\Scripts\pytest -v tests/
```
Output:
```text
tests/test_api.py::test_health_check PASSED
tests/test_api.py::test_seed_and_dashboard PASSED
tests/test_api.py::test_employees_api PASSED
tests/test_api.py::test_projects_and_recommend_team PASSED
tests/test_api.py::test_workload_and_reallocation PASSED
tests/test_api.py::test_training_courses PASSED
tests/test_matching.py::test_calculate_skill_fit_perfect_match PASSED
tests/test_matching.py::test_calculate_skill_fit_missing_mandatory_penalized PASSED
tests/test_matching.py::test_calculate_skill_fit_empty_requirements PASSED
tests/test_matching.py::test_calculate_experience_fit_bounds PASSED
tests/test_matching.py::test_calculate_availability_fit_safe_zero_capacity PASSED
tests/test_matching.py::test_calculate_availability_fit_normal PASSED
tests/test_matching.py::test_calculate_workload_suitability PASSED
tests/test_matching.py::test_score_candidate_full PASSED
tests/test_team_optimizer.py::test_optimize_team_success PASSED
tests/test_team_optimizer.py::test_optimize_team_missing_mandatory_flags_infeasible PASSED
tests/test_workload.py::test_calculate_employee_workload_states PASSED
tests/test_workload.py::test_calculate_employee_workload_zero_capacity PASSED
tests/test_workload.py::test_generate_reallocation_suggestions PASSED
======================== 19 passed in 0.80s ========================
```

### Frontend Typecheck & Build
```powershell
cd frontend
npm run build
```

---

## 🎬 Reliable Hackathon Demo Script

1. **Dashboard Overview**:
   - Open `http://127.0.0.1:5173`.
   - Point out the 4 KPI cards, the Workload Distribution Bar Chart, and the Skill Gaps list.
   - Click the **"Reset Demo Data"** button in the top navbar to showcase reliable data resetting.
2. **Explore Employees**:
   - Go to **Employees**. Search for `"Sarah"` to show real-time search.
   - Filter by `"Overloaded"` to show employees working over 100% capacity (Dr. Sarah Chen, Alex Rivera).
3. **Find Best Team**:
   - Go to **Projects**. Locate `"Cloud Native Microservices Modernization"`.
   - Click **"Find Best Team"**.
   - Inspect the recommendation cards:
     - 4-bar breakdown (Skill, Experience, Availability, Workload).
     - Rationale explanation ("Why David Kim was selected").
     - Skill Coverage Matrix showing covered vs missing skills.
     - Candidate Exclusion Breakdown explaining why other engineers were not selected.
   - Click **"Apply Team to Project"** and confirm the manager approval modal.
4. **Rebalance Workload**:
   - Go to **Workload Planner**.
   - View the **"Recommended Workload Reallocations"** card.
   - Click **"Review & Apply Reallocation"** on a proposal.
   - Review before/after utilization percentages (e.g., relieving an overloaded engineer from 110% to 75% while boosting an underutilized engineer from 30% to 70%).
   - Click **"Confirm Reallocation"** to apply changes.
5. **Skill Gaps & Training**:
   - Go to **Skills & Training**.
   - Show how unassigned project skills trigger direct recommendations from the 12-course local training catalogue.

---

## ⚠️ Known Limitations & Design Choices

- **Decision-Support Orientation**: Recommendation scores are estimates to assist human managers in staffing decisions, not objective measures of individual talent or performance.
- **Synthetic Data**: Uses realistic synthetic engineering demo data only; no real private or confidential employee records are stored.
- **Local Database Default**: Uses SQLite for seamless zero-dependency hackathon testing, while supporting PostgreSQL in production via `DATABASE_URL`.
