from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Skill
from app.schemas.schemas import SkillRead

router = APIRouter()


@router.get("/skills", response_model=List[SkillRead])
def get_skills(db: Session = Depends(get_db)):
    return db.query(Skill).order_by(Skill.name).all()
