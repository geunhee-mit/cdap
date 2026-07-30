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
  result: string;
  confidence: number;
  memo?: string;
  proposed_lat?: number;
  proposed_lng?: number;
  errors: { category: string; subtype: string }[];
  evidences: { type: string; url?: string; photo?: string }[];
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
