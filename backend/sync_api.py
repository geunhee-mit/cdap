import os
import sys
import urllib.request
import json
import math
from database import SessionLocal, engine
from models import Shelter, Base
from geoalchemy2.elements import WKTElement

Base.metadata.create_all(bind=engine)

SERVICE_KEY = os.getenv("SHELTER_API_KEY", "")
BASE_URL = "https://www.safetydata.go.kr/V2/api/DSSP-IF-10941"

def fetch_page(page: int, num_rows: int = 1000):
    url = f"{BASE_URL}?serviceKey={SERVICE_KEY}&numOfRows={num_rows}&pageNo={page}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    response = urllib.request.urlopen(req, timeout=30)
    return json.loads(response.read().decode("utf-8"))

def sync():
    print("Starting sync from government API...")
    db = SessionLocal()

    # Get total count from first page
    first = fetch_page(1, 1)
    total = first.get("totalCount", 0)
    print(f"Total records available: {total}")

    # Clear existing
    db.query(Shelter).delete()
    db.commit()

    num_rows = 1000
    total_pages = math.ceil(total / num_rows)
    inserted = 0

    for page in range(1, total_pages + 1):
        print(f"Fetching page {page}/{total_pages}...")
        try:
            data = fetch_page(page, num_rows)
            body = data.get("body", []) or []
        except Exception as e:
            print(f"  Error on page {page}: {e}")
            continue

        shelters = []
        for item in body:
            try:
                lat = float(item.get("LAT") or 0)
                lng = float(item.get("LOT") or 0)
                if not (33 < lat < 39) or not (124 < lng < 132):
                    continue
                shelters.append(Shelter(
                    facility_name=item.get("REARE_NM", ""),
                    address=item.get("RONA_DADDR", ""),
                    lat=lat,
                    lng=lng,
                    geom=WKTElement(f"POINT({lng} {lat})", srid=4326),
                    type=item.get("SHLT_SE_NM", ""),
                    agency="행정안전부",
                    api_source=item.get("MNG_SN", ""),
                ))
            except Exception:
                continue

        db.add_all(shelters)
        db.commit()
        inserted += len(shelters)
        print(f"  Inserted {len(shelters)} shelters (total so far: {inserted})")

    db.close()
    print(f"\nSync complete! Total inserted: {inserted}")

if __name__ == "__main__":
    sync()
