"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shelter, submitAudit } from "@/lib/api";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  result: z.string().min(1, { message: "판정 결과를 선택해주세요." }),
  category: z.array(z.string()).optional(),
  evidence: z.array(z.string()).min(1, { message: "최소 1개의 근거를 선택해주세요." }),
  confidence: z.number().min(1).max(5),
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
  const [step, setStep] = useState(1); // 1 to 4

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
      setTimeout(() => {
        router.push("/");
      }, 2000);
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const errorsList = values.category?.map(cat => ({
      category: "Entity", 
      subtype: cat
    })) || [];

    const evidenceList = values.evidence.map(ev => ({ type: ev }));

    mutation.mutate({
      shelter_id: shelter.id,
      user_id: "user123", 
      result: values.result,
      confidence: values.confidence,
      memo: values.memo,
      proposed_lat: proposedLocation?.lat,
      proposed_lng: proposedLocation?.lng,
      errors: errorsList,
      evidences: evidenceList,
    });
  };

  const toggleArrayItem = (field: "category" | "evidence", item: string) => {
    const current = watch(field) || [];
    if (current.includes(item)) {
      setValue(field, current.filter((i) => i !== item));
    } else {
      setValue(field, [...current, item]);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const valid = await trigger("result");
      if (!valid) return;
      if (watchResult === "정확함") setStep(3); // Skip category if correct
      else setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      const valid = await trigger("evidence");
      if (!valid) return;
      setStep(4);
    }
  };

  const prevStep = () => {
    if (step === 4) setStep(3);
    else if (step === 3) {
      if (watchResult === "정확함") setStep(1);
      else setStep(2);
    }
    else if (step === 2) setStep(1);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl">✓</div>
        <h3 className="text-xl font-bold mb-2">검증 기록 제출 완료!</h3>
        <p className="text-neutral-500">대시보드로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex justify-between text-xs text-neutral-400 mb-2">
          <span>Step {step} of 4</span>
          <span>{watchResult && `판정: ${watchResult}`}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-1.5">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold">1) 시설 판정</Label>
              <p className="text-sm text-neutral-500 mb-4">현재 제공된 대피소 정보(위치, 이름 등)가 실제와 일치하나요?</p>
              <div className="grid grid-cols-1 gap-2">
                {["정확함", "대체로 정확함", "잘못됨", "시설 확인 불가", "판단 보류"].map((res) => (
                  <label key={res} className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg border-2 transition-all ${watchResult === res ? 'border-blue-600 bg-blue-50/10' : 'border-neutral-200 hover:border-blue-300'}`}>
                    <input type="radio" value={res} {...register("result")} className="w-5 h-5 text-blue-600" />
                    <span className="text-base font-medium">{res}</span>
                  </label>
                ))}
              </div>
              {errors.result && <p className="text-red-500 text-sm mt-2">{errors.result.message}</p>}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold">2) 오류 유형 선택</Label>
              <p className="text-sm text-neutral-500 mb-4">어떤 종류의 오류가 있나요? (다중 선택 가능)</p>
              {proposedLocation && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-mono mb-2">
                  📍 <strong>지도 선택 좌표:</strong> {proposedLocation.lat.toFixed(6)}, {proposedLocation.lng.toFixed(6)}
                </div>
              )}
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
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <Label className="text-lg font-bold">3) 검증 근거</Label>
                <p className="text-sm text-neutral-500 mb-4">어떤 정보를 바탕으로 검증하셨나요? *</p>
                <div className="grid grid-cols-2 gap-3">
                  {["카카오 지도", "카카오 로드뷰", "외부 지도 (네이버/구글)", "현장 방문", "사진 촬영", "기관 홈페이지"].map((ev) => (
                    <label key={ev} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-neutral-50/10">
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
                {errors.evidence && <p className="text-red-500 text-sm mt-2">{errors.evidence.message}</p>}
              </div>

              <div>
                <Label className="text-lg font-bold">확신도 (Confidence)</Label>
                <p className="text-sm text-neutral-500 mb-2">이번 판정에 얼마나 확신하시나요?</p>
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

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Label className="text-lg font-bold">4) 추가 메모</Label>
              <p className="text-sm text-neutral-500 mb-4">제안할 올바른 정보나 추가 확인이 필요한 사항을 적어주세요.</p>
              <Textarea
                {...register("memo")}
                placeholder="예) 실제 출입구는 지도 핀 위치에서 남쪽으로 50m 떨어져 있습니다."
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
          
          {step < 4 ? (
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
