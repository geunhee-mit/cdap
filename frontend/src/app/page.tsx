"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchShelters } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import the map component so it only renders on the client side
// This avoids SSR issues with Leaflet
const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-neutral-100 flex items-center justify-center rounded-lg border border-dashed">Loading Map...</div>
});

export default function Home() {
  const router = useRouter();
  const { data: shelters, isLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: fetchShelters,
  });

  const handleStartAuditing = () => {
    if (!shelters || shelters.length === 0) {
      alert("No shelters available to audit.");
      return;
    }
    const randomShelter = shelters[Math.floor(Math.random() * shelters.length)];
    router.push(`/audit?id=${randomShelter.id}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">CDAP Dashboard</h1>
          <p className="text-neutral-500 mt-1">Civic Data Audit Platform - Disaster Shelters</p>
        </div>
        <Button onClick={handleStartAuditing} className="bg-blue-600 hover:bg-blue-700">
          <ShieldAlert className="w-4 h-4 mr-2" />
          Start Auditing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Shelters</CardTitle>
            <MapPin className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : shelters?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Audited (Verified)</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-green-500 mt-1">Ready to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Pending Review</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Overview Map</h2>
          <DashboardMap shelters={shelters || []} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          <Card className="h-[400px] flex flex-col justify-center items-center text-center p-6 text-neutral-500">
            <ShieldAlert className="w-12 h-12 text-neutral-300 mb-4" />
            <p>No audit activity yet.</p>
            <Button variant="outline" className="mt-4" onClick={handleStartAuditing}>
              Audit your first shelter
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
