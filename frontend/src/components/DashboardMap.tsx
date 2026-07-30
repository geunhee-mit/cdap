"use client";

import { Shelter } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Map, MapMarker, MarkerClusterer, useKakaoLoader } from "react-kakao-maps-sdk";

const clusterStyles = [
  {
    width: "42px",
    height: "42px",
    background: "rgba(16, 185, 129, 0.95)",
    borderRadius: "21px",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: "42px",
    fontWeight: "800",
    fontSize: "14px",
    border: "2px solid #FFFFFF",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
  },
  {
    width: "50px",
    height: "50px",
    background: "rgba(59, 130, 246, 0.95)",
    borderRadius: "25px",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: "50px",
    fontWeight: "800",
    fontSize: "15px",
    border: "2px solid #FFFFFF",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
  },
  {
    width: "58px",
    height: "58px",
    background: "rgba(99, 102, 241, 0.95)",
    borderRadius: "29px",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: "58px",
    fontWeight: "800",
    fontSize: "16px",
    border: "3px solid #FFFFFF",
    boxShadow: "0 6px 20px rgba(99, 102, 241, 0.5)",
  },
];

export default function DashboardMap({ shelters }: { shelters: Shelter[] }) {
  const router = useRouter();
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "",
    libraries: ["services", "clusterer"],
  });

  const center = { lat: 36.3, lng: 127.5 };

  if (loading) return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-900 rounded-2xl text-slate-400 border border-slate-800">
      지도 로딩 중...
    </div>
  );
  if (error) return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-red-950/50 rounded-2xl text-red-400 border border-red-900/50">
      지도 로드 실패 (에러: {String(error)})
    </div>
  );

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <Map
        center={center}
        style={{ width: "100%", height: "100%" }}
        level={13}
      >
        <MarkerClusterer 
          averageCenter={true} 
          minLevel={10}
          styles={clusterStyles}
        >
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
