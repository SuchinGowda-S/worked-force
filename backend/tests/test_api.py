from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "WorkForceIQ" in data["service"]


def test_seed_and_dashboard():
    # Trigger seed
    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200
    assert seed_res.json()["status"] == "success"

    # Dashboard summary
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["employee_count"] >= 14
    assert dash_data["active_projects_count"] >= 2
    assert dash_data["avg_utilization_percent"] > 0.0
    assert len(dash_data["workload_distribution"]) > 0


def test_employees_api():
    # List employees
    res = client.get("/api/employees")
    assert res.status_code == 200
    employees = res.json()
    assert len(employees) >= 14

    # Search filter
    search_res = client.get("/api/employees?search=Sarah")
    assert search_res.status_code == 200
    sarah = search_res.json()
    assert len(sarah) >= 1
    assert "Dr. Sarah Chen" in sarah[0]["display_name"]
    assert sarah[0]["current_utilization_percent"] > 100.0  # Overloaded in seed

    # Workload filter
    ov_res = client.get("/api/employees?workload=overloaded")
    assert ov_res.status_code == 200
    for e in ov_res.json():
        assert e["status_category"] == "overloaded"


def test_projects_and_recommend_team():
    # List projects
    res = client.get("/api/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 4
    proj_id = projects[0]["id"]

    # Recommend team
    rec_res = client.post(f"/api/projects/{proj_id}/recommend-team")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert "selected_team" in rec_data
    assert "skill_coverage" in rec_data
    assert "candidate_rankings" in rec_data
    assert len(rec_data["candidate_rankings"]) > 0


def test_workload_and_reallocation():
    res = client.get("/api/workload")
    assert res.status_code == 200
    wl = res.json()
    assert wl["overloaded_count"] >= 1
    assert wl["underutilized_count"] >= 1
    assert len(wl["employees"]) >= 14

    # Reallocation suggestions
    rec_res = client.post("/api/workload/recommend-reallocation")
    assert rec_res.status_code == 200
    suggestions = rec_res.json()
    assert isinstance(suggestions, list)


def test_training_courses():
    res = client.get("/api/training")
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) >= 10
