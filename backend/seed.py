import os
import sys
import random

# Add parent directory to path to allow importing from backend
sys.path.insert(0, os.path.realpath(os.path.dirname(__file__)))

from database import SessionLocal, engine
from models import Shelter, Base
from geoalchemy2.elements import WKTElement

Base.metadata.create_all(bind=engine)

def generate_mock_shelters(count=100):
    # Seoul boundaries approx: lat 37.43 to 37.70, lng 126.73 to 127.18
    # Center around Gangnam / Jung-gu / Yeouido
    centers = [
        (37.5665, 126.9780, "중구"),
        (37.4979, 127.0276, "강남구"),
        (37.5271, 126.9213, "영등포구"),
        (37.5892, 127.0322, "성북구"),
        (37.5407, 127.0692, "광진구"),
    ]
    
    types = ["민방위대피소", "지진해일대피소", "지진옥외대피장소", "이재민임시주거시설"]
    agencies = ["서울특별시", "행정안전부", "소방방재청"]
    prefixes = ["새마을", "행복", "안전", "푸른", "한마음", "제일", "중앙", "시민"]
    suffixes = ["주민센터 지하", "초등학교 운동장", "공원", "지하철역", "공영주차장", "아파트 지하주차장"]

    shelters = []
    for i in range(count):
        center_lat, center_lng, gu = random.choice(centers)
        
        # Add random jitter for locations (approx ~5km spread)
        lat = center_lat + random.uniform(-0.04, 0.04)
        lng = center_lng + random.uniform(-0.04, 0.04)
        
        facility_name = f"{random.choice(prefixes)} {gu} {random.choice(suffixes)} {i+1}"
        address = f"서울특별시 {gu} 임시주소로 {random.randint(1, 999)}"
        
        shelter = Shelter(
            facility_name=facility_name,
            address=address,
            lat=lat,
            lng=lng,
            geom=WKTElement(f'POINT({lng} {lat})', srid=4326),
            type=random.choice(types),
            agency=random.choice(agencies),
            api_source="MOCK-DATA-GEN"
        )
        shelters.append(shelter)
    return shelters

def seed_data():
    db = SessionLocal()
    # Always clear and reseed for this test
    db.query(Shelter).delete()
    db.commit()

    print("Generating 150 mock shelters across Seoul...")
    shelters = generate_mock_shelters(150)
    db.add_all(shelters)
    db.commit()
    print("Seed complete!")

    db.close()

if __name__ == "__main__":
    seed_data()
