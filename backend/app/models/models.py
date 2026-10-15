from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    normalized_name = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(50), default="General")

    employee_skills = relationship("EmployeeSkill", back_populates="skill", cascade="all, delete-orphan")
    project_requirements = relationship("ProjectSkillRequirement", back_populates="skill", cascade="all, delete-orphan")
    courses = relationship("TrainingCourse", back_populates="skill", cascade="all, delete-orphan")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(120), nullable=False)
    role = Column(String(100), nullable=False)
    department = Column(String(100), default="Engineering")
    experience_years = Column(Float, default=1.0)
    weekly_capacity_hours = Column(Float, default=40.0)
    availability_percent = Column(Float, default=100.0)
    active = Column(Boolean, default=True)

    skills = relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="employee", cascade="all, delete-orphan")


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(Integer, default=3)  # 1-5 scale
    years_experience = Column(Float, default=1.0)

    employee = relationship("Employee", back_populates="skills")
    skill = relationship("Skill", back_populates="employee_skills")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, default="")
    start_date = Column(String(30), nullable=False)
    end_date = Column(String(30), nullable=False)
    team_size = Column(Integer, default=3)
    estimated_effort_hours_per_week = Column(Float, default=20.0)
    status = Column(String(30), default="planning")  # planning, active, completed

    skill_requirements = relationship("ProjectSkillRequirement", back_populates="project", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="project", cascade="all, delete-orphan")


class ProjectSkillRequirement(Base):
    __tablename__ = "project_skill_requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    required_proficiency = Column(Integer, default=3)  # 1-5 scale
    is_mandatory = Column(Boolean, default=True)

    project = relationship("Project", back_populates="skill_requirements")
    skill = relationship("Skill", back_populates="project_requirements")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    allocated_hours_per_week = Column(Float, default=10.0)
    status = Column(String(30), default="active")  # active, proposed, completed

    employee = relationship("Employee", back_populates="assignments")
    project = relationship("Project", back_populates="assignments")


class TrainingCourse(Base):
    __tablename__ = "training_courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    level = Column(String(30), default="Intermediate")  # Beginner, Intermediate, Advanced
    estimated_hours = Column(Float, default=15.0)
    description = Column(Text, default="")
    provider = Column(String(100), default="Internal Academy")

    skill = relationship("Skill", back_populates="courses")
