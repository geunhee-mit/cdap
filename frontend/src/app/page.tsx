"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchShelters, fetchStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ShieldAlert, CheckCircle, Clock, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] bg-slate-900 flex items-center justify-center rounded-2xl border border-slate-800 text-slate-400">
      Loading Map...
    </div>
  )
});

export default function Home() {
  const router = useRouter();

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  const { data: shelters } = useQuery({
    queryKey: ["shelters"],
    queryFn: fetchShelters,
  });

  const handleStartAuditing = () => {
    if (!shelters || shelters.length === 0) {
      alert("검증할 대피소 데이터를 불러오는 중입니다. 잠시 후 다시 클릭해 주세요.");
      return;
    }
    const randomShelter = shelters[Math.floor(Math.random() * shelters.length)];
    router.push(`/audit?id=${randomShelter.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl space-y-8">
        
        {/* Header Branding & Hero Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                CDAP Dashboard
              </h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              Civic Data Audit Platform — 재난 대피소 공공데이터 시민 검증 플랫폼
            </p>
          </div>

          {/* Prominent High-Visibility CTA Button */}
          <Button 
            onClick={handleStartAuditing} 
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-base px-7 py-6 rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all transform flex items-center border border-white/10"
          >
            <Sparkles className="w-5 h-5 mr-2 animate-pulse text-yellow-300" />
            Start Auditing (검증 시작)
          </Button>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md p-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-slate-400">Total Shelters (수집 대피소)</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-black tracking-tight text-white font-mono">
                {isLoadingStats ? "..." : (stats?.total_shelters ? stats.total_shelters.toLocaleString() : "0")}
              </div>
              <p className="text-xs text-slate-400 mt-1">행정안전부 전국 통합대피소 데이터</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md p-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-slate-400">Audited (검증 완료)</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-black tracking-tight text-emerald-400 font-mono">
                {stats?.audited_shelters ? stats.audited_shelters.toLocaleString() : "0"}
              </div>
              <p className="text-xs text-emerald-400/90 font-medium mt-1">✓ 시민 검증이 기록된 시설</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md p-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-slate-400">Pending Review (검토 대기)</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-black tracking-tight text-amber-400 font-mono">0</div>
              <p className="text-xs text-slate-400 mt-1">지자체 수정 요청 대기 항목</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Map & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-200">Overview Map (전국 대피소 현황)</h2>
              <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 font-mono">
                5,000+ Active Clusters
              </span>
            </div>
            <DashboardMap shelters={shelters || []} />
          </div>
          
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-200 px-1">Recent Activity (최근 검증 활동)</h2>
            <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md h-[420px] flex flex-col justify-center items-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-4 text-slate-400 shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-1">검증 참여 대기 중</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                시민들의 첫 번째 대피소 검증 참여를 기다리고 있습니다. 아래 버튼을 눌러 첫 검증을 시작해 보세요!
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold" 
                onClick={handleStartAuditing}
              >
                Audit your first shelter
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
