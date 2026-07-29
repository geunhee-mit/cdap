# CDAP — Civic Data Audit Platform

AI-assisted citizen audit platform for disaster shelter public data (재난 대피소 공공데이터 시민 검증 플랫폼).

## Stack
- **Frontend**: Next.js 15, Kakao Maps SDK, TanStack Query
- **Backend**: FastAPI, PostgreSQL + PostGIS, SQLAlchemy
- **Data**: 행정안전부 통합대피소 API (DSSP-IF-10941)

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 18+
- Python 3.11+

### Setup

```bash
# 1. Start Docker (DB, Redis, MinIO)
docker compose up -d

# 2. Backend
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python sync_api.py       # Fetch real shelter data
uvicorn main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000
