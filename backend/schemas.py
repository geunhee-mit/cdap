from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EvidenceBase(BaseModel):
    type: str
    url: Optional[str] = None
    photo: Optional[str] = None

class ErrorBase(BaseModel):
    category: str
    subtype: str

class AuditCreate(BaseModel):
    shelter_id: int
    user_id: str
    result: str
    confidence: int
    memo: Optional[str] = None
    errors: List[ErrorBase] = []
    evidences: List[EvidenceBase] = []

class AuditResponse(BaseModel):
    id: int
    shelter_id: int
    user_id: str
    result: str
    confidence: int
    memo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ShelterResponse(BaseModel):
    id: int
    facility_name: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: Optional[str] = None
    agency: Optional[str] = None
    api_source: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
