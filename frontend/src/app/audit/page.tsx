"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchShelters } from "@/lib/api";
import dynamic from "next/dynamic";
import AuditForm from "@/components/AuditForm";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Map, MapMarker, Roadview, useKakaoLoader } from "react-kakao-maps-sdk";

function AuditPageContent() {
  const searchParams = useSearchParams();
  const shelterId = searchParams.get("id");

  const [loadingMap] = useKakaoLoader({
    appkey: "1f24178e01d7c175e45cc35e52c604b0",
    libraries: ["services", "clusterer"],
  });

  const { data: shelters, isLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: fetchShelters,
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const shelter = shelters?.find((s) => s.id.toString() === shelterId);

  if (shelterId && !shelter) {
    return <div className="p-8 text-center text-red-500">Shelter not found</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <Link href="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
        {/* Left Panel: Info */}
        <div className="lg:col-span-3 h-full overflow-y-auto pr-2">
          <Card className="h-full">
            <CardHeader className="bg-neutral-50 border-b">
              <CardTitle>Shelter Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {shelter ? (
                <>
                  <div>
                    <div className="text-xs text-neutral-500 font-medium mb-1">Facility Name</div>
                    <div className="font-semibold text-lg">{shelter.facility_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 font-medium mb-1">Address</div>
                    <div>{shelter.address}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 font-medium mb-1">Type</div>
                    <div className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{shelter.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 font-medium mb-1">Agency</div>
                    <div>{shelter.agency}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-neutral-500 font-medium mb-1">Latitude</div>
                      <div className="font-mono text-sm">{shelter.lat}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 font-medium mb-1">Longitude</div>
                      <div className="font-mono text-sm">{shelter.lng}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 font-medium mb-1">API ID</div>
                    <div className="font-mono text-xs">{shelter.api_source}</div>
                  </div>
                </>
              ) : (
                <div className="text-neutral-500 text-center py-8">Select a shelter from the dashboard to audit.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Panel: Map / Roadview */}
        <div className="lg:col-span-5 h-full flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex-1 min-h-[300px]">
            {loadingMap ? (
              <div className="flex items-center justify-center h-full text-neutral-400">지도 로딩 중...</div>
            ) : shelter && shelter.lat && shelter.lng ? (
              <Map
                center={{ lat: shelter.lat, lng: shelter.lng }}
                style={{ width: "100%", height: "100%" }}
                level={3}
              >
                <MapMarker position={{ lat: shelter.lat, lng: shelter.lng }} />
              </Map>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-400">Map View</div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex-1 min-h-[300px]">
             {loadingMap ? (
               <div className="flex items-center justify-center h-full text-neutral-400">로드뷰 로딩 중...</div>
             ) : shelter && shelter.lat && shelter.lng ? (
              <Roadview
                position={{ lat: shelter.lat, lng: shelter.lng, radius: 50 }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-400 text-center px-4">
                Tip: Kakao Roadview will be integrated here for street-level verification.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Audit Form */}
        <div className="lg:col-span-4 h-full overflow-y-auto pl-2">
          <Card className="h-full">
            <CardHeader className="bg-neutral-50 border-b sticky top-0 z-10">
              <CardTitle>Audit Form</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {shelter ? (
                <AuditForm shelter={shelter} />
              ) : (
                <div className="text-neutral-500 text-center py-8">Select a shelter to enable the form.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <AuditPageContent />
    </Suspense>
  );
}
