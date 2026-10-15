from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# --- SKILL SCHEMAS ---
class SkillBase(BaseModel):
    name: str
    category: str = "General"


class SkillCreate(SkillBase):
    pass


class SkillRead(SkillBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    normalized_name: str


# --- EMPLOYEE SKILL SCHEMAS ---
class EmployeeSkillBase(BaseModel):
    skill_id: int
    proficiency_level: int = Field(ge=1, le=5)
    years_experience: Optional[float] = 1.0


class EmployeeSkillCreate(EmployeeSkillBase):
    pass


class EmployeeSkillRead(EmployeeSkillBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    skill_name: Optional[str] = None
    category: Optional[str] = None


# --- EMPLOYEE SCHEMAS ---
class EmployeeBase(BaseModel):
    display_name: str
    role: str
    department: str = "Engineering"
    experience_years: float = 1.0
    weekly_capacity_hours: float = 40.0
    availability_percent: float = 100.0
    active: bool = True


class EmployeeCreate(EmployeeBase):
    skills: List[EmployeeSkillCreate] = []


class EmployeeUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    experience_years: Optional[float] = None
    weekly_capacity_hours: Optional[float] = None
    availability_percent: Optional[float] = None
    active: Optional[bool] = None
    skills: Optional[List[EmployeeSkillCreate]] = None


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    skills: List[EmployeeSkillRead] = []
    active_assignment_hours: float = 0.0
    current_utilization_percent: float = 0.0
    status_category: str = "optimal"  # overloaded, optimal, underutilized


# --- PROJECT SKILL REQUIREMENT SCHEMAS ---
class ProjectSkillRequirementBase(BaseModel):
    skill_id: int
    required_proficiency: int = Field(ge=1, le=5)
    is_mandatory: bool = True


class ProjectSkillRequirementCreate(ProjectSkillRequirementBase):
    pass


class ProjectSkillRequirementRead(ProjectSkillRequirementBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    skill_name: Optional[str] = None


# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    name: str
    description: str = ""
    start_date: str
    end_date: str
    team_size: int = 3
    estimated_effort_hours_per_week: float = 20.0
    status: str = "planning"


class ProjectCreate(ProjectBase):
    skill_requirements: List[ProjectSkillRequirementCreate] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    team_size: Optional[int] = None
    estimated_effort_hours_per_week: Optional[float] = None
    status: Optional[str] = None
    skill_requirements: Optional[List[ProjectSkillRequirementCreate]] = None


class AssignedEmployeeInfo(BaseModel):
    employee_id: int
    display_name: str
    role: str
    allocated_hours: float


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    skill_requirements: List[ProjectSkillRequirementRead] = []
    assigned_employees: List[AssignedEmployeeInfo] = []


# --- ASSIGNMENT SCHEMAS ---
class AssignmentCreate(BaseModel):
    employee_id: int
    project_id: int
    allocated_hours_per_week: float
    status: str = "active"


class AssignmentRead(AssignmentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# --- TRAINING COURSE SCHEMAS ---
class TrainingCourseBase(BaseModel):
    title: str
    skill_id: int
    level: str = "Intermediate"
    estimated_hours: float = 15.0
    description: str = ""
    provider: str = "Internal Academy"


class TrainingCourseRead(TrainingCourseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    skill_name: Optional[str] = None


# --- RECOMMENDATION SCHEMAS ---
class ComponentScores(BaseModel):
    skill_fit: float
    experience: float
    availability: float
    workload: float


class MatchedSkillDetail(BaseModel):
    skill_name: str
    proficiency: int
    required_proficiency: int
    is_mandatory: bool


class RecommendedMember(BaseModel):
    employee_id: int
    display_name: str
    role: str
    department: str
    overall_score: float
    component_scores: ComponentScores
    rationale: str
    matched_skills: List[MatchedSkillDetail]
    missing_skills: List[str]
    current_hours: float
    remaining_capacity: float
    proposed_allocation: float
    projected_utilization: float
    is_selected: bool
    exclusion_reason: Optional[str] = None


class SkillCoverageItem(BaseModel):
    skill_id: int
    skill_name: str
    required_proficiency: int
    is_mandatory: bool
    is_covered: bool
    best_team_proficiency: int
    covering_members: List[str]


class RecommendedCourseItem(BaseModel):
    course_id: int
    title: str
    skill_id: int
    skill_name: str
    level: str
    estimated_hours: float
    provider: str
    description: str
    reason: str


class RecommendationResponse(BaseModel):
    project_id: int
    project_name: str = Field(default="", alias="project_name")
    is_feasible: bool
    constraints_violated: List[str] = []
    missing_mandatory_skills: List[str] = []
    missing_optional_skills: List[str] = []
    selected_team: List[RecommendedMember] = []
    candidate_rankings: List[RecommendedMember] = []
    skill_coverage: List[SkillCoverageItem] = []
    recommended_courses: List[RecommendedCourseItem] = []
    total_team_score: float = 0.0


class ApplyTeamRequest(BaseModel):
    employee_ids: List[int]


# --- WORKLOAD SCHEMAS ---
class EmployeeAssignmentDetail(BaseModel):
    project_id: int
    project_name: str
    allocated_hours: float


class EmployeeWorkloadItem(BaseModel):
    employee_id: int
    display_name: str
    role: str
    department: str
    weekly_capacity_hours: float
    assigned_hours: float
    remaining_capacity: float
    utilization_percent: float
    status_category: str
    assignments: List[EmployeeAssignmentDetail]


class ReallocationSuggestion(BaseModel):
    from_employee_id: int
    from_employee_name: str
    to_employee_id: int
    to_employee_name: str
    project_id: int
    project_name: str
    hours_to_transfer: float
    reason: str
    before_utilization_from: float
    after_utilization_from: float
    before_utilization_to: float
    after_utilization_to: float


class WorkloadSummaryResponse(BaseModel):
    total_employees: int
    avg_utilization: float
    overloaded_count: int
    underutilized_count: int
    optimal_count: int
    employees: List[EmployeeWorkloadItem]
    suggestions: List[ReallocationSuggestion] = []


# --- DASHBOARD SCHEMAS ---
class WorkloadDistributionBucket(BaseModel):
    range: str
    count: int
    category: str


class SkillGapSummaryItem(BaseModel):
    skill_name: str
    count: int
    category: str


class DashboardSummaryResponse(BaseModel):
    employee_count: int
    active_projects_count: int
    avg_utilization_percent: float
    unresolved_skill_gaps: int
    workload_distribution: List[WorkloadDistributionBucket]
    skill_gap_summary: List[SkillGapSummaryItem]
    recent_projects: List[ProjectRead]
