from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    health,
    seed,
    dashboard,
    employees,
    projects,
    recommendations,
    workload,
    skills,
    training,
)
from app.db.database import Base, engine

# Ensure tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WorkForceIQ API",
    description="AI-assisted workforce planning, skill-based team optimization, and workload balancing platform.",
    version="1.0.0",
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",  # Fallback for dev ease
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(seed.router, prefix="/api", tags=["Demo Seed"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(employees.router, prefix="/api", tags=["Employees"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])
app.include_router(workload.router, prefix="/api", tags=["Workload"])
app.include_router(skills.router, prefix="/api", tags=["Skills"])
app.include_router(training.router, prefix="/api", tags=["Training"])


@app.get("/")
def root():
    return {
        "service": "WorkForceIQ API",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }
