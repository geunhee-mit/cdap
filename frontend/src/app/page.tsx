"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchShelters, fetchStats, fetchRecentAudits } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ShieldAlert, CheckCircle, Users, Sparkles, Star, ChevronRight, ExternalLink, Mail, MessageSquare, BookOpen } from "lucide-react";
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

  const { data: recentAudits } = useQuery({
    queryKey: ["recentAudits"],
    queryFn: fetchRecentAudits,
    refetchInterval: 10000,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pt-8 sm:pt-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl space-y-8 flex-1 pb-12">
        
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
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-base px-7 py-6 rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all transform flex items-center justify-center border border-white/10"
          >
            <Sparkles className="w-5 h-5 mr-2 animate-pulse text-yellow-300" />
            Start Auditing (검증 시작)
          </Button>
        </div>

        {/* Metric Cards Grid (3 Cards: Total, Audited, Contributors) */}
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
                {isLoadingStats ? "..." : (stats?.total_shelters ? stats.total_shelters.toLocaleString() : "74,726")}
              </div>
              <p className="text-xs text-slate-400 mt-1">행정안전부 전국 통합대피소 데이터</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md p-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-slate-400">Audited Shelters (검증 완료 대피소)</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-black tracking-tight text-emerald-400 font-mono">
                {stats?.audited_shelters ? stats.audited_shelters.toLocaleString() : (recentAudits?.length || 0)}
              </div>
              <p className="text-xs text-emerald-400/90 font-medium mt-1">✓ 시민 검증이 기록된 시설 수</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md p-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-slate-400">Contributors (참여 시민 기여자)</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-black tracking-tight text-purple-300 font-mono">
                {stats?.total_contributors ? stats.total_contributors.toLocaleString() : (recentAudits ? new Set(recentAudits.map((a: any) => a.user_id)).size : 0)}
              </div>
              <p className="text-xs text-purple-300/80 font-medium mt-1">🏆 명예의 전당 등록 참여자 수</p>
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
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-200">Recent Activity (명예의 전당 🏆)</h2>
              <span className="text-[11px] text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                Live Feed
              </span>
            </div>
            <Card className="bg-slate-900/80 border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md h-[420px] overflow-hidden flex flex-col p-4">
              {recentAudits && recentAudits.length > 0 ? (
                <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                  {recentAudits.map((item: any) => (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(`/audit?id=${item.shelter_id}`)}
                      className="bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800/80 p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-blue-300 truncate">
                            👤 {item.user_id || "익명 시민"}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {item.user_audit_count || 1}건 기여
                          </span>
                        </div>
                        <div className="font-bold text-sm text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                          {item.facility_name}
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            item.result === "정확함" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            item.result === "대체로 정확함" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {item.result}
                          </span>
                          <span className="text-yellow-400 font-mono flex items-center text-[10px]">
                            <Star className="w-3 h-3 fill-yellow-400 mr-0.5 inline" /> {item.confidence}/5
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-4 text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-3 text-slate-400 shadow-inner">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200 mb-1">검증 참여 대기 중</h3>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    시민들의 첫 번째 대피소 검증 참여를 기다리고 있습니다. 아래 버튼을 눌러 첫 검증을 시작해 보세요!
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs" 
                    onClick={handleStartAuditing}
                  >
                    Audit your first shelter
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-10 mt-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* Brand & Slogan */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold text-white tracking-tight">안심이</span>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                Code for Korea
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              사람이 중심인 재난 안전 정보를 함께 만들어 갑니다
            </p>
          </div>

          {/* Social & External Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
            <a 
              href="https://ansimi.codefor.kr/index.html" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-blue-400 transition-colors flex items-center"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1 text-blue-400" />
              홈페이지
            </a>

            <a 
              href="mailto:ansim@codefor.kr" 
              className="hover:text-blue-400 transition-colors flex items-center"
            >
              <Mail className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              ansim@codefor.kr
            </a>

            <a 
              href="https://github.com/Code-for-Korea/ansimi" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center"
            >
              <svg className="w-3.5 h-3.5 mr-1 text-slate-200 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>

            <a 
              href="https://discord.gg/6Tk4G8vz" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-indigo-400 transition-colors flex items-center"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              Discord
            </a>

            <a 
              href="https://app.notion.com/p/1c038e821166804d80c2dce4c20001de" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Notion
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
