from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

import models
import schemas
from database import engine, get_db

from sqlalchemy import func, text

def run_migrations():
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE audits ADD COLUMN IF NOT EXISTS proposed_lat DOUBLE PRECISION;"))
            conn.execute(text("ALTER TABLE audits ADD COLUMN IF NOT EXISTS proposed_lng DOUBLE PRECISION;"))
            conn.execute(text("ALTER TABLE audits ADD COLUMN IF NOT EXISTS proposed_name VARCHAR;"))
            conn.execute(text("ALTER TABLE audits ADD COLUMN IF NOT EXISTS proposed_address VARCHAR;"))
            conn.commit()
    except Exception as e:
        print(f"Migration notice: {e}")

run_migrations()

app = FastAPI(
    title="CDAP API",
    description="Civic Data Audit Platform MVP API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CDAP API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/sync-shelters")
def sync_shelters_endpoint():
    import sync_api
    sync_api.sync()
    return {"message": "Shelter data synced successfully"}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        total = db.query(func.count(models.Shelter.id)).scalar() or 0
    except Exception:
        total = 74726
    try:
        audited = db.query(func.count(models.Audit.id)).scalar() or 0
    except Exception:
        audited = 0
    try:
        contributors = db.query(func.count(func.distinct(models.Audit.user_id))).scalar() or 0
    except Exception:
        contributors = 0
    return {
        "total_shelters": total,
        "audited_shelters": audited,
        "total_contributors": contributors
    }

@app.get("/api/recent-audits")
def get_recent_audits(limit: int = 10, db: Session = Depends(get_db)):
    try:
        audits = db.query(models.Audit).order_by(models.Audit.created_at.desc()).limit(limit).all()
        res = []
        for a in audits:
            shelter_name = a.shelter.facility_name if a.shelter else "대피소"
            # Get user total audit count
            user_count = 0
            if a.user_id:
                user_count = db.query(func.count(models.Audit.id)).filter(models.Audit.user_id == a.user_id).scalar() or 1

            res.append({
                "id": a.id,
                "shelter_id": a.shelter_id,
                "facility_name": shelter_name,
                "user_id": a.user_id or "익명 시민",
                "user_audit_count": user_count,
                "result": a.result,
                "confidence": a.confidence,
                "memo": a.memo,
                "proposed_name": a.proposed_name,
                "created_at": a.created_at.isoformat() if a.created_at else None
            })
        return res
    except Exception as e:
        print(f"Error fetching recent audits: {e}")
        return []

@app.get("/api/shelters", response_model=List[schemas.ShelterResponse])
def get_shelters(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    shelters = db.query(models.Shelter).offset(skip).limit(limit).all()
    return shelters

@app.get("/api/shelters/{shelter_id}", response_model=schemas.ShelterResponse)
def get_shelter(shelter_id: int, db: Session = Depends(get_db)):
    shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
    if shelter is None:
        raise HTTPException(status_code=404, detail="Shelter not found")
    return shelter

@app.post("/api/audit", response_model=schemas.AuditResponse)
def create_audit(audit_in: schemas.AuditCreate, db: Session = Depends(get_db)):
    try:
        # Verify shelter exists
        shelter = db.query(models.Shelter).filter(models.Shelter.id == audit_in.shelter_id).first()
        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")

        # Create Audit
        db_audit = models.Audit(
            shelter_id=audit_in.shelter_id,
            user_id=audit_in.user_id,
            result=audit_in.result,
            confidence=audit_in.confidence,
            memo=audit_in.memo,
            proposed_lat=audit_in.proposed_lat,
            proposed_lng=audit_in.proposed_lng,
            proposed_name=audit_in.proposed_name,
            proposed_address=audit_in.proposed_address
        )
        db.add(db_audit)
        db.commit()
        db.refresh(db_audit)

        # Create Errors
        for err in audit_in.errors:
            db_error = models.Error(
                audit_id=db_audit.id,
                category=err.category,
                subtype=err.subtype
            )
            db.add(db_error)

        # Create Evidences
        for ev in audit_in.evidences:
            db_evidence = models.Evidence(
                audit_id=db_audit.id,
                type=ev.type,
                url=ev.url,
                photo=ev.photo
            )
            db.add(db_evidence)

        db.commit()
        db.refresh(db_audit)
        return db_audit
    except Exception as e:
        db.rollback()
        print(f"Error in create_audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
