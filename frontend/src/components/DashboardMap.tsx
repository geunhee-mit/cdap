"use client";

import { Shelter } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Map, MapMarker, MarkerClusterer, useKakaoLoader } from "react-kakao-maps-sdk";

export default function DashboardMap({ shelters }: { shelters: Shelter[] }) {
  const router = useRouter();
  const [loading, error] = useKakaoLoader({
    appkey: "1f24178e01d7c175e45cc35e52c604b0",
    libraries: ["services", "clusterer"],
  });

  const center = { lat: 36.3, lng: 127.5 };

  if (loading) return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-neutral-100 rounded-lg text-neutral-500">
      지도 로딩 중...
    </div>
  );
  if (error) return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-red-50 rounded-lg text-red-500">
      지도 로드 실패 (에러: {String(error)})
    </div>
  );

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-neutral-200">
      <Map
        center={center}
        style={{ width: "100%", height: "100%" }}
        level={13}
      >
        <MarkerClusterer averageCenter={true} minLevel={10}>
          {shelters.map((shelter) => (
            <MapMarker
              key={shelter.id}
              position={{ lat: shelter.lat ?? 0, lng: shelter.lng ?? 0 }}
              title={shelter.facility_name}
              onClick={() => router.push(`/audit?id=${shelter.id}`)}
            />
          ))}
        </MarkerClusterer>
      </Map>
    </div>
  );
}
