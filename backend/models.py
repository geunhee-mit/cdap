from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from database import Base

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    facility_name = Column(String, index=True)
    address = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    type = Column(String, index=True)
    agency = Column(String)
    api_source = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # PostGIS geometry column for spatial queries (EPSG:4326 is standard GPS WGS84)
    geom = Column(Geometry(geometry_type='POINT', srid=4326))

    audits = relationship("Audit", back_populates="shelter")

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(Integer, ForeignKey("shelters.id"))
    user_id = Column(String, index=True)  # Mock user ID for MVP
    result = Column(String) # 정확함, 잘못됨 등
    confidence = Column(Integer) # 1-5
    memo = Column(Text, nullable=True)
    proposed_lat = Column(Float, nullable=True)
    proposed_lng = Column(Float, nullable=True)
    proposed_name = Column(String, nullable=True)
    proposed_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shelter = relationship("Shelter", back_populates="audits")
    errors = relationship("Error", back_populates="audit")
    evidences = relationship("Evidence", back_populates="audit")

class Error(Base):
    __tablename__ = "errors"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    category = Column(String) # Location, Entity, Data, Information
    subtype = Column(String)  # 구체적 오류 내용

    audit = relationship("Audit", back_populates="errors")

class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    type = Column(String) # Google Maps, Photo 등
    url = Column(String, nullable=True)
    photo = Column(String, nullable=True) # S3/MinIO Path

    audit = relationship("Audit", back_populates="evidences")
