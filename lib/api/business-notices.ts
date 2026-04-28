import apiClient from "@/lib/api/auth";

export interface BusinessNotice {
  id: number;
  business: number;
  text: string;
  expires_at?: string | null;
}

export async function listBusinessNotices() {
  const res = await apiClient.get("/notices");
  return res.data as BusinessNotice[];
}

export async function createBusinessNotice(
  business: number,
  text: string,
  expires_at?: string | null
) {
  const payload: any = { business, text };
  if (expires_at) payload.expires_at = expires_at;
  const res = await apiClient.post("/notices/", payload);
  return res.data as BusinessNotice;
}

export async function updateBusinessNotice(id: number, text: string, expires_at?: string | null) {
  const payload: any = { text };
  if (expires_at) payload.expires_at = expires_at;
  const res = await apiClient.patch(`/notices/${id}/`, payload);
  return res.data as BusinessNotice;
}

export async function deleteBusinessNotice(id: number) {
  await apiClient.delete(`/notices/${id}/`);
}
