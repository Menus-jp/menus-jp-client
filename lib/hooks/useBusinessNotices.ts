import { useCallback, useState } from "react";
import {
  listBusinessNotices,
  createBusinessNotice,
  updateBusinessNotice,
  deleteBusinessNotice,
  BusinessNotice,
} from "@/lib/api/business-notices";

function normalizeNotices(data: unknown): BusinessNotice[] {
  if (Array.isArray(data)) return data as BusinessNotice[];
  if (data && typeof data === "object" && "results" in data) {
    const results = (data as { results: unknown }).results;
    if (Array.isArray(results)) return results as BusinessNotice[];
  }
  return [];
}

export function useBusinessNotices() {
  const [notices, setNotices] = useState<BusinessNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBusinessNotices();
      setNotices(normalizeNotices(data));
    } catch (err: any) {
      setError(err?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  const addNotice = useCallback(async (business: number, text: string, expires_at?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const notice = await createBusinessNotice(business, text, expires_at);
      setNotices((prev) => [...prev, notice]);
      return notice;
    } catch (err: any) {
      setError(err?.message || "Failed to add notice");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const editNotice = useCallback(async (id: number, text: string, expires_at?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const notice = await updateBusinessNotice(id, text, expires_at);
      setNotices((prev) => prev.map((n) => (n.id === id ? notice : n)));
      return notice;
    } catch (err: any) {
      setError(err?.message || "Failed to update notice");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeNotice = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteBusinessNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      setError(err?.message || "Failed to delete notice");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    notices,
    loading,
    error,
    fetchNotices,
    addNotice,
    editNotice,
    removeNotice,
  };
}
