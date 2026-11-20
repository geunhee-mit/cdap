const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Shelter {
  id: number;
  facility_name: string;
  address?: string;
  lat?: number;
  lng?: number;
  type?: string;
  agency?: string;
  api_source?: string;
  updated_at: string;
}

export interface AuditSubmitData {
  shelter_id: number;
  user_id: string;
  nickname?: string;
  result: string;
  confidence: number;
  memo?: string;
  proposed_lat?: number;
  proposed_lng?: number;
  proposed_name?: string;
  proposed_address?: string;
  errors: { category: string; subtype: string }[];
  evidences: { type: string; url?: string; photo?: string }[];
}

export interface QualityReport {
  total_audits: number;
  overall_score: number;
  accuracy_rate: number;
  result_counts: Record<string, number>;
  top_errors: { subtype: string; count: number }[];
  recent_corrections: {
    id: number;
    shelter_id: number;
    original_name: string;
    proposed_name?: string;
    has_proposed_coords: boolean;
    proposed_lat?: number;
    proposed_lng?: number;
    memo?: string;
    nickname: string;
    created_at?: string;
  }[];
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchQualityReport(): Promise<QualityReport> {
  const res = await fetch(`${API_BASE_URL}/api/quality-report`);
  if (!res.ok) {
    return {
      total_audits: 0,
      overall_score: 0.0,
      accuracy_rate: 0.0,
      result_counts: {},
      top_errors: [],
      recent_corrections: []
    };
  }
  return res.json();
}

export async function fetchRecentAudits() {
  const res = await fetch(`${API_BASE_URL}/api/recent-audits`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchShelters(): Promise<Shelter[]> {
  const res = await fetch(`${API_BASE_URL}/api/shelters`);
  if (!res.ok) throw new Error("Failed to fetch shelters");
  return res.json();
}

export async function submitAudit(data: AuditSubmitData) {
  const res = await fetch(`${API_BASE_URL}/api/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit audit");
  return res.json();
}
