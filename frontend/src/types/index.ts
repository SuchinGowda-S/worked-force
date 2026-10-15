export interface Skill {
  id: number;
  name: string;
  normalized_name: string;
  category: string;
}

export interface EmployeeSkillItem {
  id?: number;
  skill_id: number;
  skill_name?: string;
  category?: string;
  proficiency_level: number;
  years_experience?: number;
}

export interface Employee {
  id: number;
  display_name: string;
  role: string;
  department: string;
  experience_years: number;
  weekly_capacity_hours: number;
  availability_percent: number;
  active: boolean;
  skills: EmployeeSkillItem[];
  active_assignment_hours?: number;
  current_utilization_percent?: number;
  status_category?: 'overloaded' | 'optimal' | 'underutilized';
}

export interface ProjectSkillRequirementItem {
  id?: number;
  skill_id: number;
  skill_name?: string;
  required_proficiency: number;
  is_mandatory: boolean;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  team_size: number;
  estimated_effort_hours_per_week: number;
  status: 'planning' | 'active' | 'completed';
  skill_requirements: ProjectSkillRequirementItem[];
  assigned_employees?: {
    employee_id: number;
    display_name: string;
    role: string;
    allocated_hours: number;
  }[];
}

export interface RecommendedMember {
  employee_id: number;
  display_name: string;
  role: string;
  department: string;
  overall_score: number;
  component_scores: {
    skill_fit: number;
    experience: number;
    availability: number;
    workload: number;
  };
  rationale: string;
  matched_skills: {
    skill_name: string;
    proficiency: number;
    required_proficiency: number;
    is_mandatory: boolean;
  }[];
  missing_skills: string[];
  current_hours: number;
  remaining_capacity: number;
  proposed_allocation: number;
  projected_utilization: number;
  is_selected: boolean;
  exclusion_reason?: string;
}

export interface SkillCoverageItem {
  skill_id: number;
  skill_name: string;
  required_proficiency: number;
  is_mandatory: boolean;
  is_covered: boolean;
  best_team_proficiency: number;
  covering_members: string[];
}

export interface RecommendedCourseItem {
  course_id: number;
  title: string;
  skill_id: number;
  skill_name: string;
  level: string;
  estimated_hours: number;
  provider: string;
  description: string;
  reason: string;
}

export interface RecommendationResponse {
  project_id: number;
  project_name: string;
  is_feasible: boolean;
  constraints_violated: string[];
  missing_mandatory_skills: string[];
  missing_optional_skills: string[];
  selected_team: RecommendedMember[];
  candidate_rankings: RecommendedMember[];
  skill_coverage: SkillCoverageItem[];
  recommended_courses: RecommendedCourseItem[];
  total_team_score: number;
}

export interface EmployeeWorkloadItem {
  employee_id: number;
  display_name: string;
  role: string;
  department: string;
  weekly_capacity_hours: number;
  assigned_hours: number;
  remaining_capacity: number;
  utilization_percent: number;
  status_category: 'overloaded' | 'optimal' | 'underutilized';
  assignments: {
    project_id: number;
    project_name: string;
    allocated_hours: number;
  }[];
}

export interface ReallocationSuggestion {
  from_employee_id: number;
  from_employee_name: string;
  to_employee_id: number;
  to_employee_name: string;
  project_id: number;
  project_name: string;
  hours_to_transfer: number;
  reason: string;
  before_utilization_from: number;
  after_utilization_from: number;
  before_utilization_to: number;
  after_utilization_to: number;
}

export interface WorkloadSummaryResponse {
  total_employees: number;
  avg_utilization: number;
  overloaded_count: number;
  underutilized_count: number;
  optimal_count: number;
  employees: EmployeeWorkloadItem[];
  suggestions: ReallocationSuggestion[];
}

export interface DashboardSummaryResponse {
  employee_count: number;
  active_projects_count: number;
  avg_utilization_percent: number;
  unresolved_skill_gaps: number;
  workload_distribution: {
    range: string;
    count: number;
    category: string;
  }[];
  skill_gap_summary: {
    skill_name: string;
    count: number;
    category: string;
  }[];
  recent_projects: Project[];
}

export interface TrainingCourse {
  id: number;
  title: string;
  skill_id: number;
  skill_name?: string;
  level: string;
  estimated_hours: number;
  description: string;
  provider: string;
}
