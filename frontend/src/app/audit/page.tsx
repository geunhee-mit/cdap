"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchShelters } from "@/lib/api";
import AuditForm from "@/components/AuditForm";
import { useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Info, MapPin, Layers } from "lucide-react";
import Link from "next/link";
import { Map, MapMarker, Roadview, useKakaoLoader } from "react-kakao-maps-sdk";

function AuditPageContent() {
  const searchParams = useSearchParams();
  const shelterId = searchParams.get("id");
  const [proposedLocation, setProposedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [loadingMap] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "",
    libraries: ["services", "clusterer"],
  });

  const { data: shelters, isLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: fetchShelters,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const shelter = shelters?.find((s) => s.id.toString() === shelterId);

  if (shelterId && !shelter) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-center">
        <div className="text-red-400 text-lg font-bold mb-4">대피소 정보를 찾을 수 없습니다.</div>
        <Link href="/" className="text-blue-400 underline text-sm">대시보드로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header Back Button */}
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard (대시보드로 돌아가기)
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
          
          {/* Left Panel: Shelter Info */}
          <div className="lg:col-span-3 h-full">
            <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md h-full flex flex-col overflow-hidden">
              <CardHeader className="bg-slate-900 border-b border-slate-800/80 p-5">
                <CardTitle className="text-base font-bold text-slate-100 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-400" />
                  Shelter Info (대피소 정보)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-200">
                {shelter ? (
                  <>
                    <div className="border-b border-slate-800/60 pb-3">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Facility Name</div>
                      <div className="font-extrabold text-xl text-white leading-snug">{shelter.facility_name}</div>
                    </div>

                    <div className="border-b border-slate-800/60 pb-3">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Address</div>
                      <div className="text-sm text-slate-200 font-medium">{shelter.address}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-slate-800/60 pb-3">
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Type</div>
                        <span className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {shelter.type}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Agency</div>
                        <div className="text-sm font-medium text-slate-300">{shelter.agency}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-slate-800/60 pb-3">
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Latitude</div>
                        <div className="font-mono text-xs text-blue-300 bg-slate-950/80 p-2 rounded border border-slate-800">{shelter.lat}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Longitude</div>
                        <div className="font-mono text-xs text-blue-300 bg-slate-950/80 p-2 rounded border border-slate-800">{shelter.lng}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">API ID</div>
                      <div className="font-mono text-xs text-slate-400 break-all">{shelter.api_source}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-center py-12">대시보드에서 대피소를 선택해 주세요.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Panel: Map & Roadview */}
          <div className="lg:col-span-5 h-full flex flex-col gap-4">
            
            {/* Kakao Map Box */}
            <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex-1 min-h-[300px] relative">
              {loadingMap ? (
                <div className="flex items-center justify-center h-full text-slate-400">지도 로딩 중...</div>
              ) : shelter && shelter.lat && shelter.lng ? (
                <>
                  <div className="absolute top-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md text-white border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-yellow-400 animate-bounce" />
                    지도를 클릭하여 정확한 건물 위치 핀을 지정해 보세요.
                  </div>
                  <Map
                    center={{ lat: shelter.lat, lng: shelter.lng }}
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    onClick={(_map, mouseEvent) => {
                      const lat = mouseEvent.latLng.getLat();
                      const lng = mouseEvent.latLng.getLng();
                      setProposedLocation({ lat, lng });
                    }}
                  >
                    {/* Original API pin */}
                    <MapMarker position={{ lat: shelter.lat, lng: shelter.lng }} title="기존 정부 API 좌표" />
                    
                    {/* Proposed corrected pin */}
                    {proposedLocation && (
                      <MapMarker 
                        position={proposedLocation} 
                        title="시민 제안 올바른 위치"
                        image={{
                          src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                          size: { width: 24, height: 35 }
                        }}
                      />
                    )}
                  </Map>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">Map View</div>
              )}
            </div>

            {/* Kakao Roadview Box */}
            <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex-1 min-h-[300px]">
               {loadingMap ? (
                 <div className="flex items-center justify-center h-full text-slate-400">로드뷰 로딩 중...</div>
               ) : shelter && shelter.lat && shelter.lng ? (
                <Roadview
                  position={{
                    lat: proposedLocation ? proposedLocation.lat : shelter.lat,
                    lng: proposedLocation ? proposedLocation.lng : shelter.lng,
                    radius: 50
                  }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-center px-4">
                  Roadview View
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Audit Form */}
          <div className="lg:col-span-4 h-full">
            <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md h-full flex flex-col overflow-hidden">
              <CardHeader className="bg-slate-900 border-b border-slate-800/80 p-5 sticky top-0 z-10">
                <CardTitle className="text-base font-bold text-slate-100 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-indigo-400" />
                  Audit Form (검증 및 교정 작성)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 overflow-y-auto">
                {shelter ? (
                  <AuditForm shelter={shelter} proposedLocation={proposedLocation} />
                ) : (
                  <div className="text-slate-500 text-center py-12">대피소를 선택하면 검증 폼이 활성화됩니다.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <AuditPageContent />
    </Suspense>
  );
}
