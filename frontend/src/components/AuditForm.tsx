"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shelter, submitAudit } from "@/lib/api";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  result: z.string().min(1, { message: "판정 결과를 선택해주세요." }),
  category: z.array(z.string()).optional(),
  evidence: z.array(z.string()).min(1, { message: "최소 1개의 검증 근거를 선택하셔야 다음 단계로 진행할 수 있습니다." }),
  confidence: z.number().min(1).max(5),
  proposed_name: z.string().optional(),
  proposed_address: z.string().optional(),
  memo: z.string().optional(),
});

interface AuditFormProps {
  shelter: Shelter;
  proposedLocation?: { lat: number; lng: number } | null;
}

export default function AuditForm({ shelter, proposedLocation }: AuditFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1 to 5
  const [stepError, setStepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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
      setTimeout(() => {
        router.push("/");
      }, 2000);
    },
    onError: (err: any) => {
      alert("제출 중 오류가 발생했습니다: " + (err.message || "다시 시도해 주세요."));
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const errorsList = values.category?.map(cat => ({
      category: "Entity", 
      subtype: cat
    })) || [];

    const evidenceList = values.evidence ? values.evidence.map(ev => ({ type: ev })) : [];

    mutation.mutate({
      shelter_id: shelter.id,
      user_id: "user123", 
      result: values.result,
      confidence: values.confidence,
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
      if (watchResult === "정확함") setStep(4); // Skip error selection & correction
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
      if (!valid || watchEvidence.length === 0) {
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

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl">✓</div>
        <h3 className="text-xl font-bold mb-2">검증 기록 제출 완료!</h3>
        <p className="text-neutral-500 font-medium">시민 참여 데이터 개선에 감사드립니다.</p>
        <p className="text-xs text-neutral-400 mt-2">대시보드로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex justify-between text-xs text-neutral-400 mb-2">
          <span>Step {step} of 5</span>
          <span>{watchResult && `판정: ${watchResult}`}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-1.5">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          
          {/* STEP 1: 시설 판정 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold">1) 시설 판정</Label>
              <p className="text-sm text-neutral-500 mb-4">현재 제공된 대피소 정보(위치, 이름 등)가 실제와 일치하나요?</p>
              <div className="grid grid-cols-1 gap-2">
                {["정확함", "대체로 정확함", "잘못됨", "시설 확인 불가", "판단 보류"].map((res) => (
                  <label key={res} className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg border-2 transition-all ${watchResult === res ? 'border-blue-600 bg-blue-50/10' : 'border-neutral-200 hover:border-blue-300'}`}>
                    <input 
                      type="radio" 
                      value={res} 
                      {...register("result")} 
                      onChange={(e) => {
                        setValue("result", e.target.value);
                        setStepError(null);
                      }}
                      className="w-5 h-5 text-blue-600" 
                    />
                    <span className="text-base font-medium">{res}</span>
                  </label>
                ))}
              </div>
              {stepError && <p className="text-red-500 text-sm font-semibold mt-2">{stepError}</p>}
            </div>
          )}

          {/* STEP 2: 오류 유형 선택 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold">2) 오류 유형 선택</Label>
              <p className="text-sm text-neutral-500 mb-4">어떤 오류를 발견하셨나요? * (최소 1개 이상 필수)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["좌표 오류", "주소 오류", "주소-좌표 불일치", "다른 건물에 표시", "시설명 불일치", "폐쇄", "이전", "중복"].map((cat) => (
                  <label key={cat} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-neutral-50/10">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
                      checked={watchCategory.includes(cat)}
                      onChange={() => toggleArrayItem("category", cat)}
                    />
                    <span className="text-sm font-medium">{cat}</span>
                  </label>
                ))}
              </div>
              {stepError && <p className="text-red-500 text-sm font-semibold mt-2">{stepError}</p>}
            </div>
          )}

          {/* STEP 3: 맞춤형 교정 정보 입력 */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <Label className="text-lg font-bold">3) 올바른 정보 교정</Label>
                <p className="text-sm text-neutral-500 mb-4">선택하신 오류 유형에 대해 올바른 값을 교정/제안해 주세요.</p>
              </div>

              {/* 좌표 관련 오류 안내 & 좌표 선택 상태 */}
              {(watchCategory.includes("좌표 오류") || watchCategory.includes("다른 건물에 표시") || watchCategory.includes("주소-좌표 불일치")) && (
                <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-xl space-y-2">
                  <div className="font-bold text-sm text-blue-900 flex items-center">
                    📍 위치 좌표 교정 (지도 클릭)
                  </div>
                  <p className="text-xs text-blue-700">
                    왼쪽 지도 위에서 실제 건물/출입구 위치를 클릭해 보세요!
                  </p>
                  {proposedLocation ? (
                    <div className="bg-white border border-emerald-300 text-emerald-800 p-2.5 rounded-lg text-xs font-mono font-bold shadow-sm">
                      ✅ 제안된 위경도: {proposedLocation.lat.toFixed(6)}, {proposedLocation.lng.toFixed(6)}
                    </div>
                  ) : (
                    <div className="bg-white/80 border border-neutral-200 text-neutral-500 p-2.5 rounded-lg text-xs">
                      아직 지도를 클릭하지 않았습니다. (클릭 시 자동 반영)
                    </div>
                  )}
                </div>
              )}

              {/* 시설명 불일치 교정 입력 */}
              {watchCategory.includes("시설명 불일치") && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">제안하는 올바른 시설명</Label>
                  <Input 
                    {...register("proposed_name")} 
                    placeholder="예) 남관4리 마을회관 (기존: 남관4리경로당)" 
                    className="text-sm p-3"
                  />
                </div>
              )}

              {/* 주소 오류 교정 입력 */}
              {watchCategory.includes("주소 오류") && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">제안하는 올바른 도로명/지번 주소</Label>
                  <Input 
                    {...register("proposed_address")} 
                    placeholder="예) 충청남도 천안시 동남구 풍세면 통미2길 18" 
                    className="text-sm p-3"
                  />
                </div>
              )}

              {/* 아무것도 안 들어맞더라도 기본 입력 가이드 */}
              {!watchCategory.includes("좌표 오류") && 
               !watchCategory.includes("다른 건물에 표시") && 
               !watchCategory.includes("주소-좌표 불일치") && 
               !watchCategory.includes("시설명 불일치") && 
               !watchCategory.includes("주소 오류") && (
                <div className="text-xs text-neutral-500 border p-3 rounded-lg bg-neutral-50">
                  선택하신 오류에 대해 지도를 클릭하시거나 다음 단계에서 메모로 적어주시면 감사하겠습니다.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: 검증 근거 및 확신도 (필수) */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <Label className="text-lg font-bold">4) 검증 근거 * (필수 1개 이상)</Label>
                <p className="text-sm text-neutral-500 mb-4">어떤 수단으로 이 판정을 확인하셨나요?</p>
                <div className="grid grid-cols-2 gap-3">
                  {["카카오 지도", "카카오 로드뷰", "외부 지도 (네이버/구글)", "현장 방문", "사진 촬영", "기관 홈페이지"].map((ev) => (
                    <label key={ev} className={`flex items-center space-x-3 cursor-pointer p-3 border rounded-lg transition-all ${watchEvidence.includes(ev) ? 'border-blue-600 bg-blue-50/20 font-bold' : 'hover:bg-neutral-50'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
                        checked={watchEvidence.includes(ev)}
                        onChange={() => toggleArrayItem("evidence", ev)}
                      />
                      <span className="text-sm font-medium">{ev}</span>
                    </label>
                  ))}
                </div>
                {stepError && <p className="text-red-600 text-sm font-bold mt-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-bounce">{stepError}</p>}
              </div>

              <div>
                <Label className="text-lg font-bold">확신도 (Confidence)</Label>
                <p className="text-sm text-neutral-500 mb-2">이번 검증 판정에 대해 얼마나 확신하시나요?</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setValue("confidence", star)}
                      className={`text-4xl transition-colors ${watchConfidence >= star ? "text-yellow-400" : "text-neutral-200 hover:text-yellow-200"}`}
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
              <Label className="text-lg font-bold">5) 추가 메모 & 제출</Label>
              <p className="text-sm text-neutral-500 mb-4">제안할 추가 상세 정보나 의견을 자유롭게 적어주세요.</p>
              <Textarea
                {...register("memo")}
                placeholder="예) 카카오지도 건물명에는 '마을회관'으로 되어있으나, 실제 대피소 표지판은 노인정에 붙어있음."
                className="min-h-[150px] resize-none text-base p-4"
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-neutral-100 flex justify-between mt-auto">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep} className="w-[100px]">
              이전
            </Button>
          ) : (
            <div></div>
          )}
          
          {step < 5 ? (
            <Button type="button" onClick={nextStep} className="w-[100px] bg-neutral-900 text-white">
              다음
            </Button>
          ) : (
            <Button 
              type="submit" 
              className="w-[140px] bg-blue-600 hover:bg-blue-700 font-bold"
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
