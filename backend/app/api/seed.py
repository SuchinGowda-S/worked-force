from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.seed import seed_database

router = APIRouter()


@router.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    """Reset and seed database with rich synthetic demo dataset."""
    seed_database(db)
    return {
        "status": "success",
        "message": "WorkForceIQ database reset and successfully seeded with synthetic records."
    }
