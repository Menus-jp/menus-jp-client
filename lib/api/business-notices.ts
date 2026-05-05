import apiClient from "@/lib/api/auth";

export interface BusinessNotice {
  id: number;
  business: number;
  text: string;
  expires_at?: string | null;
}

export async function listBusinessNotices() {
  try {
    const res = await apiClient.get("/notices");
    return res.data as BusinessNotice[];
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.detail || "お知らせの読み込みに失敗しました";
    console.error("Failed to load notices:", error);
    throw new Error(message);
  }
}

export async function createBusinessNotice(
  business: number,
  text: string,
  expires_at?: string | null
) {
  try {
    const payload: any = { business, text };
    if (expires_at) payload.expires_at = expires_at;
    const res = await apiClient.post("/notices/", payload);
    return res.data as BusinessNotice;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.detail || "お知らせの作成に失敗しました";
    console.error("Failed to create notice:", error);
    throw new Error(message);
  }
}

export async function updateBusinessNotice(id: number, text: string, expires_at?: string | null) {
  try {
    const payload: any = { text };
    if (expires_at) payload.expires_at = expires_at;
    const res = await apiClient.patch(`/notices/${id}/`, payload);
    return res.data as BusinessNotice;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.detail || "お知らせの更新に失敗しました";
    console.error("Failed to update notice:", error);
    throw new Error(message);
  }
}

export async function deleteBusinessNotice(id: number) {
  try {
    await apiClient.delete(`/notices/${id}/`);
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.detail || "お知らせの削除に失敗しました";
    console.error("Failed to delete notice:", error);
    throw new Error(message);
  }
}
