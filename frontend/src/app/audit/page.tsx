"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchShelters } from "@/lib/api";
import AuditForm from "@/components/AuditForm";
import { useState, Suspense, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Info, MapPin, Layers, RotateCcw, Search, Building2 } from "lucide-react";
import Link from "next/link";
import { Map, MapMarker, Roadview, useKakaoLoader } from "react-kakao-maps-sdk";

function AuditPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shelterId = searchParams.get("id");
  const [proposedLocation, setProposedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Kakao Places Search State
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  const [loadingMap] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "",
    libraries: ["services", "clusterer"],
  });

  const { data: shelters, isLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: fetchShelters,
  });

  const shelter = shelters?.find((s) => s.id.toString() === shelterId);

  useEffect(() => {
    if (shelter) {
      setSearchKeyword(shelter.facility_name);
      setMapCenter({ lat: shelter.lat || 37.5665, lng: shelter.lng || 126.9780 });
      setProposedLocation(null);
      setSearchResults([]);
      setSearchExecuted(false);
    }
  }, [shelterId, shelter]);

  const handleKakaoSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchKeyword.trim()) return;
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      alert("카카오지도 서비스 로딩 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setIsSearching(true);
    setSearchExecuted(true);

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword.trim(), (data, status) => {
      setIsSearching(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
        if (data.length > 0) {
          const first = data[0];
          setMapCenter({ lat: parseFloat(first.y), lng: parseFloat(first.x) });
        }
      } else {
        setSearchResults([]);
      }
    });
  };

  const handleSelectSearchResult = (place: any) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    setProposedLocation({ lat, lng });
    setMapCenter({ lat, lng });
  };

  const handleNextRandomShelter = () => {
    if (!shelters || shelters.length === 0) return;
    const remaining = shelters.filter(s => s.id.toString() !== shelterId);
    const pool = remaining.length > 0 ? remaining : shelters;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setProposedLocation(null);
    router.push(`/audit?id=${random.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (shelterId && !shelter) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
        <div className="text-red-400 text-base sm:text-lg font-bold mb-4">대피소 정보를 찾을 수 없습니다.</div>
        <Link href="/" className="text-blue-400 underline text-sm">대시보드로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-4 sm:py-6 px-3 sm:px-6">
      <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        
        {/* Header Back Button */}
        <div className="flex justify-between items-center">
          <Link href="/" className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard (대시보드로 돌아가기)
          </Link>

          <button
            onClick={handleNextRandomShelter}
            className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-300 hover:text-blue-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm flex items-center"
          >
            다른 대피소 뽑기 🎲
          </button>
        </div>

        {/* Flexible Mobile / Desktop Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)]">
          
          {/* Panel 1 (Left on desktop): Shelter Info */}
          <div className="lg:col-span-3 order-1 lg:order-1 lg:h-full">
            <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md lg:h-full flex flex-col overflow-hidden">
              <CardHeader className="bg-slate-900 border-b border-slate-800/80 p-4 sm:p-5">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-100 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-400" />
                  Shelter Info (대피소 정보)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 lg:overflow-y-auto flex-1 text-slate-200">
                {shelter ? (
                  <>
                    <div className="border-b border-slate-800/60 pb-3">
                      <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Facility Name</div>
                      <div className="font-extrabold text-lg sm:text-xl text-white leading-snug">{shelter.facility_name}</div>
                    </div>

                    <div className="border-b border-slate-800/60 pb-3">
                      <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Address</div>
                      <div className="text-xs sm:text-sm text-slate-200 font-medium">{shelter.address}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-slate-800/60 pb-3">
                      <div>
                        <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Type</div>
                        <span className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md text-xs font-semibold">
                          {shelter.type}
                        </span>
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Agency</div>
                        <div className="text-xs sm:text-sm font-medium text-slate-300">{shelter.agency}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-slate-800/60 pb-3">
                      <div>
                        <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Latitude</div>
                        <div className="font-mono text-xs text-blue-300 bg-slate-950/80 p-2 rounded border border-slate-800">{shelter.lat}</div>
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Longitude</div>
                        <div className="font-mono text-xs text-blue-300 bg-slate-950/80 p-2 rounded border border-slate-800">{shelter.lng}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-center py-6 text-xs">대시보드에서 대피소를 선택해 주세요.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel 2 (Center on desktop): Map & Roadview & Kakao Live Search */}
          <div className="lg:col-span-5 order-2 lg:order-2 flex flex-col gap-4 min-h-[550px] lg:h-full">
            
            {/* Kakao Live Places Search Bar */}
            <div className="bg-slate-900/90 border border-slate-800/90 p-3 rounded-2xl shadow-lg space-y-2">
              <form onSubmit={handleKakaoSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="카카오지도 실시간 장소/시설명 검색..."
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  검색
                </button>
              </form>

              {/* Kakao Search Results Dropdown List */}
              {searchExecuted && (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1 text-xs border-t border-slate-800/60">
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 4).map((place) => (
                      <div
                        key={place.id}
                        onClick={() => handleSelectSearchResult(place)}
                        className="p-2 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-blue-300 truncate group-hover:text-blue-200">
                            {place.place_name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {place.road_address_name || place.address_name}
                          </div>
                        </div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-md shrink-0 font-bold">
                          선택 & 좌표 적용
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-[11px] font-semibold text-center">
                      ❌ 카카오지도 장소 검색 결과 0건 — 시설 미등록 또는 폐쇄/이전 가능성이 높습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Kakao Map Box */}
            <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 overflow-hidden h-[260px] sm:h-[290px] lg:flex-1 relative">
              {loadingMap ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">지도 로딩 중...</div>
              ) : shelter && shelter.lat && shelter.lng ? (
                <>
                  <div className="absolute top-2 left-2 right-2 sm:right-auto z-10 bg-slate-950/90 backdrop-blur-md text-white border border-slate-700/80 px-3 py-1.5 rounded-xl text-[11px] font-semibold shadow-lg flex items-center justify-between gap-2">
                    <div className="flex items-center min-w-0">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-yellow-400 shrink-0" />
                      <span className="truncate">
                        {proposedLocation ? `선택 좌표: ${proposedLocation.lat.toFixed(4)}, ${proposedLocation.lng.toFixed(4)}` : "지도를 터치하여 올바른 핀을 지정해 보세요."}
                      </span>
                    </div>
                    {proposedLocation && (
                      <button
                        onClick={() => setProposedLocation(null)}
                        className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 px-2 py-0.5 rounded-md text-[10px] shrink-0 flex items-center"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        취소 ✕
                      </button>
                    )}
                  </div>
                  <Map
                    center={mapCenter || { lat: shelter.lat, lng: shelter.lng }}
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    onClick={(_map, mouseEvent) => {
                      const lat = mouseEvent.latLng.getLat();
                      const lng = mouseEvent.latLng.getLng();
                      setProposedLocation({ lat, lng });
                    }}
                  >
                    <MapMarker position={{ lat: shelter.lat, lng: shelter.lng }} title="기존 정부 API 좌표" />
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
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">Map View</div>
              )}
            </div>

            {/* Kakao Roadview Box */}
            <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 overflow-hidden h-[240px] sm:h-[260px] lg:flex-1">
               {loadingMap ? (
                 <div className="flex items-center justify-center h-full text-slate-400 text-xs">로드뷰 로딩 중...</div>
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
                <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center px-4">
                  Roadview View
                </div>
              )}
            </div>
          </div>

          {/* Panel 3 (Right on desktop): Audit Form */}
          <div className="lg:col-span-4 order-3 lg:order-3 lg:h-full">
            <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md lg:h-full flex flex-col overflow-hidden">
              <CardHeader className="bg-slate-900 border-b border-slate-800/80 p-4 sm:p-5 sticky top-0 z-10">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-100 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-indigo-400" />
                  Audit Form (검증 및 교정 작성)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:flex-1 lg:overflow-y-auto">
                {shelter ? (
                  <AuditForm 
                    shelter={shelter} 
                    proposedLocation={proposedLocation} 
                    onClearProposedLocation={() => setProposedLocation(null)}
                    onNextRandomShelter={handleNextRandomShelter}
                  />
                ) : (
                  <div className="text-slate-500 text-center py-8 text-xs">대피소를 선택하면 검증 폼이 활성화됩니다.</div>
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
