from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CDAP API",
    description="Civic Data Audit Platform MVP API",
    version="1.0.0"
)

# Get allowed origins from env (comma-separated) or default to localhost
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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

@app.get("/api/shelters", response_model=List[schemas.ShelterResponse])
def get_shelters(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
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
        memo=audit_in.memo
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
