"use client";

import { useState, useEffect, use } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api/auth";

interface BusinessNotice {
  id: number;
  text: string;
  expires_at: string | null;
}

export function NoticeButton() {
  const [open, setOpen] = useState(false);
  const [responsenotices, setNotices] = useState<BusinessNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!open) return;
    
    const fetchNotices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/by-slug/${slug}/`);

        if (response instanceof Response && !response.ok) {
          throw new Error("Failed to fetch notices");
        }
        
        setNotices(
          (response.data.notices || []).filter((n: any) => {
            if (!n.expires_at) return true;
            const expires = new Date(n.expires_at);
            console.log(expires)
            const today = new Date();
            return expires >= today;
          }).map((n: any) => ({
            id: n.id,
            text: n.text || "Notice",
            expires_at: n.expires_at || null,
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [open, slug]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute right-3 top-14 flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 px-4 py-1.5 text-[13px] font-extrabold text-white shadow-lg animate-bounce z-20"
        style={{ animationDuration: "1.2s" }}
        aria-label="Show Notices"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7v3.28c0 .43-.18.85-.5 1.15l-1.3 1.2A2 2 0 0 0 5 19h14a2 2 0 0 0 1.8-2.37l-1.3-1.2a1.5 1.5 0 0 1-.5-1.15V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
        </svg>
        Notice
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-black"
              aria-label="Close"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className="mb-3 text-lg font-bold text-gray-800">Notices</h2>

            {loading ? (
              <div className="py-8 flex justify-center items-center">
                <span className="animate-spin">⏳</span>
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : responsenotices.length === 0 ? (
              <div className="text-gray-500">No notices found.</div>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {responsenotices.map((notice) => (
                  <li
                    key={notice.id}
                    className="rounded-lg bg-yellow-50 border-l-4 border-yellow-400 p-3 text-gray-800 shadow"
                  >
                    <div className="font-semibold mb-1">{notice.text}</div>
                    {notice.expires_at && (
                      <div className="mt-1 text-xs text-gray-500">
                        Expires: {new Date(notice.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
