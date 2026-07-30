"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shelter, submitAudit } from "@/lib/api";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Sparkles, Home, RotateCcw, UserCheck, Search, Loader2, Award } from "lucide-react";

const formSchema = z.object({
  result: z.string().min(1, { message: "판정 결과를 선택해주세요." }),
  category: z.array(z.string()).optional(),
  evidence: z.array(z.string()).optional(),
  confidence: z.number().min(1).max(5),
  proposed_name: z.string().optional(),
  proposed_address: z.string().optional(),
  memo: z.string().optional(),
});

interface AuditFormProps {
  shelter: Shelter;
  proposedLocation?: { lat: number; lng: number } | null;
  onClearProposedLocation?: () => void;
  onNextRandomShelter?: () => void;
  onSelectProposedLocation?: (lat: number, lng: number) => void;
}

export default function AuditForm({ 
  shelter, 
  proposedLocation, 
  onClearProposedLocation,
  onNextRandomShelter,
  onSelectProposedLocation
}: AuditFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1 to 5
  const [stepError, setStepError] = useState<string | null>(null);
  
  // Nickname session & Modal state
  const [nickname, setNickname] = useState("익명의 시민");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [tempNicknameInput, setTempNicknameInput] = useState("");

  // Kakao Places Search state inside Step 3
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      result: "",
      category: [],
      evidence: [],
      confidence: 3,
      proposed_name: "",
      proposed_address: "",
      memo: "",
    },
  });

  // Check initial Nickname on session start
  useEffect(() => {
    const saved = localStorage.getItem("cdap_nickname");
    if (saved) {
      setNickname(saved);
      setShowNicknameModal(false);
    } else {
      setShowNicknameModal(true);
    }
  }, []);

  const handleSaveNicknameModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = tempNicknameInput.trim() || "익명의 시민";
    setNickname(val);
    localStorage.setItem("cdap_nickname", val);
    setShowNicknameModal(false);
  };

  const saveNickname = (val: string) => {
    const trimmed = val.trim() || "익명의 시민";
    setNickname(trimmed);
    localStorage.setItem("cdap_nickname", trimmed);
  };

  // Reset form state completely whenever shelter changes!
  useEffect(() => {
    reset({
      result: "",
      category: [],
      evidence: [],
      confidence: 3,
      proposed_name: "",
      proposed_address: "",
      memo: "",
    });
    setStep(1);
    setStepError(null);
    setSuccess(false);
    setSearchKeyword(shelter.facility_name);
    setSearchResults([]);
    setSearchExecuted(false);
  }, [shelter.id, reset, shelter.facility_name]);

  const watchResult = watch("result");
  const watchCategory = watch("category") || [];
  const watchEvidence = watch("evidence") || [];
  const watchConfidence = watch("confidence");

  const mutation = useMutation({
    mutationFn: submitAudit,
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["shelters"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["recentAudits"] });
    },
    onError: (err: any) => {
      alert("제출 중 오류가 발생했습니다: " + (err.message || "다시 시도해 주세요."));
    },
    onSettled: () => setIsSubmitting(false),
  });

  const handleNextShelterClick = () => {
    setSuccess(false);
    setStep(1);
    setStepError(null);
    reset();
    if (onClearProposedLocation) onClearProposedLocation();
    if (onNextRandomShelter) onNextRandomShelter();
  };

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
      } else {
        setSearchResults([]);
      }
    });
  };

  const handleSelectSearchResult = (place: any) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    setValue("proposed_name", place.place_name);
    setValue("proposed_address", place.road_address_name || place.address_name);
    if (onSelectProposedLocation) {
      onSelectProposedLocation(lat, lng);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const errorsList = values.category?.map(cat => ({
      category: "Entity", 
      subtype: cat
    })) || [];

    const evidenceList = values.evidence ? values.evidence.map(ev => ({ type: ev })) : [{ type: "판단 보류" }];

    mutation.mutate({
      shelter_id: shelter.id,
      user_id: nickname, 
      result: values.result,
      confidence: values.confidence || 3,
      memo: values.memo,
      proposed_lat: proposedLocation?.lat,
      proposed_lng: proposedLocation?.lng,
      proposed_name: values.proposed_name,
      proposed_address: values.proposed_address,
      errors: errorsList,
      evidences: evidenceList,
    });
  };

  const toggleArrayItem = (field: "category" | "evidence", item: string) => {
    setStepError(null);
    const current = watch(field) || [];
    if (current.includes(item)) {
      setValue(field, current.filter((i) => i !== item));
    } else {
      setValue(field, [...current, item]);
    }
  };

  const nextStep = async () => {
    setStepError(null);
    if (step === 1) {
      const valid = await trigger("result");
      if (!valid) {
        setStepError("판정 결과를 선택해주세요.");
        return;
      }

      // UX Fix: "판단 보류" selected -> Immediately submit or skip to end!
      if (watchResult === "판단 보류") {
        onSubmit({
          result: "판단 보류",
          confidence: 3,
          evidence: ["판단 보류"],
          memo: "정보 불확실로 인한 판단 보류"
        });
        return;
      }

      if (watchResult === "정확함") setStep(4);
      else setStep(2);
    } else if (step === 2) {
      if (watchCategory.length === 0) {
        setStepError("최소 1개의 오류 유형을 선택해 주세요.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      const valid = await trigger("evidence");
      if (!valid || !watchEvidence || watchEvidence.length === 0) {
        setStepError("❌ 최소 1개 이상의 검증 근거를 선택하셔야 다음 단계로 진행할 수 있습니다.");
        return;
      }
      setStep(5);
    }
  };

  const prevStep = () => {
    setStepError(null);
    if (step === 5) setStep(4);
    else if (step === 4) {
      if (watchResult === "정확함") setStep(1);
      else setStep(3);
    }
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  // Prevent accidental Enter key form submissions in inputs & textareas
  const handleKeyDownForm = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Never allow Enter key inside form to submit automatically!
      e.preventDefault();
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-500/20">
          ✓
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-100 mb-1">검증 기록 제출 완료! 🎉</h3>
          <p className="text-slate-400 font-medium text-xs">
            <span className="text-blue-400 font-bold">{nickname}</span> 님의 소중한 기여가 반영되었습니다.
          </p>
        </div>

        <div className="flex flex-col w-full gap-2.5 pt-4">
          <Button 
            onClick={handleNextShelterClick} 
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs py-5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 mr-2 text-yellow-300 animate-pulse" />
            다음 랜덤 대피소 바로 검증하기 🎲
          </Button>

          <Button 
            variant="outline" 
            onClick={() => router.push("/")}
            className="w-full border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs py-4 rounded-xl flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-1.5" />
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-slate-100 relative">
      
      {/* Session Start Nickname Modal Card Overlay */}
      {showNicknameModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4 animate-in fade-in zoom-in-95 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">시민 검증 참여 닉네임 설정</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              검증 활동 내역이 <span className="text-blue-300 font-bold">명예의 전당 (Leaderboard)</span>에 등재됩니다! 사용하실 닉네임을 설정해 주세요.
            </p>
          </div>

          <form onSubmit={handleSaveNicknameModal} className="w-full space-y-3 pt-2">
            <Input
              type="text"
              value={tempNicknameInput}
              onChange={(e) => setTempNicknameInput(e.target.value)}
              placeholder="예: 대피소마스터, 안심시민"
              className="bg-slate-900 border-slate-700 text-center font-bold text-sm text-blue-300 py-5 focus:border-blue-500"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-5 rounded-xl shadow-lg shadow-blue-500/20"
            >
              닉네임 저장 & 검증 시작 🚀
            </Button>
          </form>
        </div>
      )}

      {/* Contributor Nickname Bar */}
      <div className="mb-4 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium shrink-0">기여자 닉네임:</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => saveNickname(e.target.value)}
            placeholder="닉네임 입력"
            className="bg-transparent text-xs font-bold text-blue-300 border-b border-slate-700 focus:border-blue-400 focus:outline-none px-1 py-0.5 truncate w-28 sm:w-36"
          />
        </div>
        <button
          onClick={() => setShowNicknameModal(true)}
          className="text-[10px] text-blue-400 hover:underline font-mono"
        >
          [변경]
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 font-medium mb-2">
          <span>Step {step} of 5</span>
          <span className="text-blue-400">{watchResult && `판정: ${watchResult}`}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDownForm} className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4">
          
          {/* STEP 1: 시설 판정 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold text-slate-100">1) 시설 판정</Label>
              <p className="text-xs text-slate-400 mb-4">현재 제공된 대피소 정보(위치, 이름 등)가 실제와 일치하나요?</p>
              <div className="grid grid-cols-1 gap-2.5">
                {["정확함", "대체로 정확함", "잘못됨", "시설 확인 불가", "판단 보류"].map((res) => (
                  <label key={res} className={`flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${watchResult === res ? 'border-blue-500 bg-blue-500/10 text-white font-bold' : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'}`}>
                    <input 
                      type="radio" 
                      value={res} 
                      {...register("result")} 
                      onChange={(e) => {
                        setValue("result", e.target.value);
                        setStepError(null);
                      }}
                      className="w-5 h-5 text-blue-500 bg-slate-900 border-slate-700" 
                    />
                    <span className="text-sm font-medium">{res}</span>
                  </label>
                ))}
              </div>
              {watchResult === "판단 보류" && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs">
                  💡 '판단 보류'를 선택하셨습니다. [다음] 클릭 시 즉시 기록이 제출되고 다음 대피소 검증으로 바로 연결됩니다.
                </div>
              )}
              {stepError && <p className="text-red-400 text-xs font-semibold mt-2">{stepError}</p>}
            </div>
          )}

          {/* STEP 2: 오류 유형 선택 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold text-slate-100">2) 오류 유형 선택</Label>
              <p className="text-xs text-slate-400 mb-4">어떤 오류를 발견하셨나요? * (최소 1개 이상 필수)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["좌표 오류", "주소 오류", "주소-좌표 불일치", "다른 건물에 표시", "시설명 불일치", "폐쇄", "이전", "중복"].map((cat) => (
                  <label key={cat} className={`flex items-center space-x-3 cursor-pointer p-3 border rounded-xl transition-all ${watchCategory.includes(cat) ? 'border-blue-500 bg-blue-500/10 text-white font-bold' : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'}`}>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-700 text-blue-500 focus:ring-blue-500 bg-slate-900"
                      checked={watchCategory.includes(cat)}
                      onChange={() => toggleArrayItem("category", cat)}
                    />
                    <span className="text-xs font-medium">{cat}</span>
                  </label>
                ))}
              </div>
              {stepError && <p className="text-red-400 text-xs font-semibold mt-2">{stepError}</p>}
            </div>
          )}

          {/* STEP 3: 맞춤형 교정 정보 입력 & 카카오 지도 장소 검색 */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <Label className="text-lg font-bold text-slate-100">3) 올바른 정보 교정</Label>
                <p className="text-xs text-slate-400 mb-4">선택하신 오류 유형에 대해 올바른 값을 교정/제안해 주세요.</p>
              </div>

              {/* Kakao Live Places Search Component inside Step 3 */}
              <div className="border border-indigo-500/30 bg-indigo-500/10 p-3.5 rounded-xl space-y-2">
                <div className="font-bold text-xs text-indigo-300 flex items-center">
                  <Search className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                  카카오지도 장소 검색 (시설 존재 여부 확인 & 좌표 추출)
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleKakaoSearch();
                      }
                    }}
                    placeholder="예: 만석동 경로당"
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleKakaoSearch()}
                    disabled={isSearching}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    검색
                  </button>
                </div>

                {searchExecuted && (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1 text-xs">
                    {searchResults.length > 0 ? (
                      searchResults.slice(0, 3).map((place) => (
                        <div
                          key={place.id}
                          onClick={() => handleSelectSearchResult(place)}
                          className="p-2 bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-indigo-300 truncate group-hover:text-indigo-200">
                              {place.place_name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {place.road_address_name || place.address_name}
                            </div>
                          </div>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md shrink-0 font-bold">
                            선택 & 교정 적용
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-[11px] font-semibold text-center">
                        ❌ 카카오지도 장소 검색 결과 0건 — 시설 미등록 또는 폐쇄/이전 가능성이 높습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 좌표 관련 오류 안내 & 좌표 선택 상태 */}
              {(watchCategory.includes("좌표 오류") || watchCategory.includes("다른 건물에 표시") || watchCategory.includes("주소-좌표 불일치")) && (
                <div className="border border-blue-500/30 bg-blue-500/10 p-4 rounded-xl space-y-2.5">
                  <div className="font-bold text-xs text-blue-300 flex items-center justify-between">
                    <span>📍 위치 좌표 교정 (지도 클릭)</span>
                    {proposedLocation && onClearProposedLocation && (
                      <button
                        type="button"
                        onClick={onClearProposedLocation}
                        className="text-[10px] bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 px-2 py-0.5 rounded transition-colors flex items-center"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        위치 선택 취소 ✕
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    왼쪽 지도 위에서 실제 건물/출입구 위치를 클릭해 보세요!
                  </p>
                  {proposedLocation ? (
                    <div className="bg-slate-950 border border-emerald-500/40 text-emerald-400 p-2.5 rounded-lg text-xs font-mono font-bold shadow-inner flex justify-between items-center">
                      <span>✅ 제안된 위경도: {proposedLocation.lat.toFixed(6)}, {proposedLocation.lng.toFixed(6)}</span>
                    </div>
                  ) : (
                    <div className="bg-slate-950/80 border border-slate-800 text-slate-400 p-2.5 rounded-lg text-xs">
                      아직 지도를 클릭하지 않았습니다. (클릭 시 자동 반영)
                    </div>
                  )}
                </div>
              )}

              {/* 시설명 불일치 교정 입력 */}
              {watchCategory.includes("시설명 불일치") && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">제안하는 올바른 시설명</Label>
                  <Input 
                    {...register("proposed_name")} 
                    placeholder="예) 남관4리 마을회관 (기존: 남관4리경로당)" 
                    className="text-xs p-3 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              )}

              {/* 주소 오류 교정 입력 */}
              {watchCategory.includes("주소 오류") && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">제안하는 올바른 도로명/지번 주소</Label>
                  <Input 
                    {...register("proposed_address")} 
                    placeholder="예) 충청남도 천안시 동남구 풍세면 통미2길 18" 
                    className="text-xs p-3 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: 검증 근거 및 확신도 (필수) */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <Label className="text-lg font-bold text-slate-100">4) 검증 근거 * (필수 1개 이상)</Label>
                <p className="text-xs text-slate-400 mb-4">어떤 수단으로 이 판정을 확인하셨나요?</p>
                <div className="grid grid-cols-2 gap-3">
                  {["카카오 지도", "카카오 로드뷰", "외부 지도 (네이버/구글)", "현장 방문", "사진 촬영", "기관 홈페이지"].map((ev) => (
                    <label key={ev} className={`flex items-center space-x-3 cursor-pointer p-3 border rounded-xl transition-all ${watchEvidence.includes(ev) ? 'border-blue-500 bg-blue-500/10 text-white font-bold' : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-700 text-blue-500 focus:ring-blue-500 bg-slate-900"
                        checked={watchEvidence.includes(ev)}
                        onChange={() => toggleArrayItem("evidence", ev)}
                      />
                      <span className="text-xs font-medium">{ev}</span>
                    </label>
                  ))}
                </div>
                {stepError && <p className="text-red-400 text-xs font-bold mt-3 p-3 bg-red-950/50 border border-red-900/60 rounded-xl animate-bounce">{stepError}</p>}
              </div>

              <div>
                <Label className="text-sm font-bold text-slate-200">확신도 (Confidence)</Label>
                <p className="text-xs text-slate-400 mb-2">이번 검증 판정에 대해 얼마나 확신하시나요?</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setValue("confidence", star)}
                      className={`text-3xl transition-colors ${watchConfidence >= star ? "text-yellow-400" : "text-slate-700 hover:text-yellow-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: 추가 메모 및 제출 */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold text-slate-100">5) 추가 메모 & 제출</Label>
              <p className="text-xs text-slate-400 mb-4">제안할 추가 상세 정보나 의견을 자유롭게 적어주세요. (Enter 키로 줄바꿈 가능)</p>
              <Textarea
                {...register("memo")}
                placeholder="예) 카카오지도 건물명에는 '마을회관'으로 되어있으나, 실제 대피소 표지판은 노인정에 붙어있음."
                className="min-h-[140px] resize-none text-xs p-4 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-800 flex justify-between mt-auto">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep} className="w-[90px] border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs">
              이전
            </Button>
          ) : (
            <div></div>
          )}
          
          {step < 5 ? (
            <Button type="button" onClick={nextStep} className="w-[90px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
              {watchResult === "판단 보류" ? "제출 & 다음" : "다음"}
            </Button>
          ) : (
            <Button 
              type="submit" 
              className="w-[130px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25"
              disabled={isSubmitting}
            >
              {isSubmitting ? "제출 중..." : "제출 완료"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
