"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Phone,
  Clock,
  Navigation,
  ChevronRight,
  Loader2,
  AlertCircle,
  X as XClose,
  ChevronLeft,
  CalendarX,
} from "lucide-react";
import { BusinessDetail, BusinessHours, MenuItemPhoto, OrderLink } from "@/lib/types/business";
import BusinessPhotoCarousel from "@/components/business/carousel";
import { he } from "date-fns/locale";
import { NoticeButton } from "@/components/business/NoticeButton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8005/api";

const CATEGORY_META: Record<string, { labelJp: string; labelEn: string; tagJp: string; tagEn: string }> = {
  restaurant:  { labelJp: "炭火焼肉",   labelEn: "Restaurant",  tagJp: "焼肉・渋谷", tagEn: "Restaurant" },
  hair_salon:  { labelJp: "美容院",     labelEn: "Hair Salon",  tagJp: "ヘア・美容", tagEn: "Hair · Beauty" },
  barbershop:  { labelJp: "バーバー",   labelEn: "Barbershop",  tagJp: "床屋",       tagEn: "Barbershop" },
  spa:         { labelJp: "スパ",       labelEn: "Spa",         tagJp: "スパ・リラ", tagEn: "Spa · Relax" },
  gym:         { labelJp: "ジム",       labelEn: "Gym",         tagJp: "フィットネス", tagEn: "Fitness" },
};

const DAY_LABELS: Record<string, { jp: string; en: string }> = {
  monday:    { jp: "月曜日", en: "Monday" },
  tuesday:   { jp: "火曜日", en: "Tuesday" },
  wednesday: { jp: "水曜日", en: "Wednesday" },
  thursday:  { jp: "木曜日", en: "Thursday" },
  friday:    { jp: "金曜日", en: "Friday" },
  saturday:  { jp: "土曜日", en: "Saturday" },
  sunday:    { jp: "日曜日", en: "Sunday" },
};

const BOOKING_CFG: Record<string, { jp: string; en: string; bg: string; textColor: string }> = {
  tabelog:            { jp: "食べログ\nTabelog",          en: "Tabelog",           bg: "#f59e0b", textColor: "#fff" },
  hot_pepper_gourmet: { jp: "HOT PEPPER\nグルメ",          en: "HOT PEPPER\nGourmet", bg: "#e11d48", textColor: "#fff" },
  hot_pepper_beauty:  { jp: "HOT PEPPER\nBeauty",         en: "HOT PEPPER\nBeauty",  bg: "#e11d48", textColor: "#fff" },
  line_reservation:   { jp: "LINEで予約\nLINE",            en: "LINE\nBooking",     bg: "#06C755", textColor: "#fff" },
  open_table:         { jp: "OpenTable",                  en: "OpenTable",         bg: "#e03636", textColor: "#fff" },
  minimo:             { jp: "minimo",                     en: "minimo",            bg: "#ff7043", textColor: "#fff" },
  custom:             { jp: "予約",                       en: "Book",              bg: "#f3f4f6", textColor: "#374151" },
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook:  "Facebook",
  twitter:   "X",
  youtube:   "YouTube",
  line:      "LINE",
  tiktok:    "TikTok",
  custom:    "Link",
};

const ORDER_CFG: Record<string, { jp: string; en: string; bg: string; textColor: string }> = {
    uber_eats: { jp: "Uber Eats", en: "Uber Eats", bg: "#06c167", textColor: "#fff" },
    wolt: { jp: "Wolt", en: "Wolt", bg: "#00b2e6", textColor: "#fff" },
    menu: { jp: "menu", en: "menu", bg: "#ff2e2e", textColor: "#fff" },
    demaecan: { jp: "出前館", en: "Demae-can", bg: "#e60012", textColor: "#fff" },
    foodpanda: { jp: "foodpanda", en: "foodpanda", bg: "#d70f64", textColor: "#fff" },
    custom: { jp: "注文", en: "Order", bg: "#f3f4f6", textColor: "#374151" },
  };
  function OrderIcon({ platform, className = "w-10 h-10 rounded-xl" }: { platform: string; className?: string }) {
    const cfg: Record<string, { bg: string; icon: React.ReactNode }> = {
      uber_eats: { bg: "bg-green-500", icon: <span className="text-white text-xs font-black tracking-tight">UE</span> },
      wolt: { bg: "bg-sky-400", icon: <span className="text-white text-xs font-black tracking-tight">W</span> },
      menu: { bg: "bg-red-500", icon: <span className="text-white text-xs font-black tracking-tight">M</span> },
      demaecan: { bg: "bg-red-700", icon: <span className="text-white text-xs font-black tracking-tight">D</span> },
      foodpanda: { bg: "bg-pink-600", icon: <span className="text-white text-xs font-black tracking-tight">FP</span> },
    };
    const c = cfg[platform];
    if (!c) {
      return (
        <div className={`${className} flex items-center justify-center bg-gray-200 shrink-0`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
      );
    }
    return (
      <div className={`${className} flex items-center justify-center shrink-0 ${c.bg}`}>
        {c.icon}
      </div>
    );
  }

const LineIconSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

const InstagramIconSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIconSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YouTubeIconSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);

const TikTokIconSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const XIconSvg = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Booking icon: colored square + white icon (matches step3-form.tsx PlatformIcon style)
function BookingIcon({ platform, className = "w-10 h-10 rounded-xl" }: { platform: string; className?: string }) {
  const cfg: Record<string, { bg: string; icon: React.ReactNode }> = {
    tabelog: {
      bg: "bg-amber-500",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M11 2v7H4v2h7v11h2V11h7V9h-7V2z" />
        </svg>
      ),
    },
    hot_pepper_gourmet: {
      bg: "bg-red-600",
      icon: <span className="text-white text-xs font-black tracking-tight">HP</span>,
    },
    hot_pepper_beauty: {
      bg: "bg-red-600",
      icon: <span className="text-white text-xs font-black tracking-tight">HP</span>,
    },
    line_reservation: {
      bg: "bg-green-500",
      icon: <LineIconSvg />,
    },
    open_table: {
      bg: "bg-white border border-gray-200",
      icon: <span className="text-red-600 text-2xl font-black leading-none">•</span>,
    },
    minimo: {
      bg: "bg-orange-400",
      icon: <span className="text-white text-xs font-black tracking-tight">mi</span>,
    },
  };
  const c = cfg[platform];
  if (!c) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${className} flex items-center justify-center shrink-0 ${c.bg}`}>
      {c.icon}
    </div>
  );
}

function SocialIcon({ platform, className = "w-10 h-10 rounded-xl" }: { platform: string; className?: string }) {
  const cfg: Record<string, { bg: string; icon: React.ReactNode }> = {
    instagram: {
      bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
      icon: <InstagramIconSvg />,
    },
    facebook: {
      bg: "bg-blue-600",
      icon: <FacebookIconSvg />,
    },
    twitter: {
      bg: "bg-gray-950",
      icon: <XIconSvg />,
    },
    youtube: {
      bg: "bg-red-600",
      icon: <YouTubeIconSvg />,
    },
    line: {
      bg: "bg-green-500",
      icon: <LineIconSvg />,
    },
    tiktok: {
      bg: "bg-gray-950",
      icon: <TikTokIconSvg />,
    },
  };
  const c = cfg[platform];
  if (!c) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${className} flex items-center justify-center shrink-0 ${c.bg}`}>
      {c.icon}
    </div>
  );
}

function fmt(t?: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

function getOpenStatus(hours: BusinessHours[], closedDays: { day_of_week: string }[]) {
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const today = days[new Date().getDay()] as keyof typeof DAY_LABELS;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const closed = new Set(closedDays.map((d) => d.day_of_week));
  const h = hours.find((x) => x.day_of_week === today) ?? null;
  if (closed.has(today) || h?.is_closed) return { isOpen: false, currentlyOpen: false, h: null, today };
  if (!h?.opening_time || !h?.closing_time) return { isOpen: false, currentlyOpen: false, h, today };
  const [oh, om] = h.opening_time.split(":").map(Number);
  const [ch, cm] = h.closing_time.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  const currentlyOpen = closeMin < openMin
    ? now >= openMin || now < closeMin
    : now >= openMin && now < closeMin;
  return { isOpen: true, currentlyOpen, h, today };
}

function getTodayKey() {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
}

function getMenuTabCaption(item?: { discount_start_time?: string | null; discount_end_time?: string | null; hours?: Array<{ day_of_week: string; is_closed: boolean; start_time?: string | null; end_time?: string | null }> }) {
  if (!item) return "";
  const todayHours = item.hours?.find(
    (hour) =>
      hour.day_of_week === getTodayKey() &&
      !hour.is_closed &&
      hour.start_time &&
      hour.end_time
  );
  if (todayHours?.start_time && todayHours?.end_time) {
    return `${fmt(todayHours.start_time)}-${fmt(todayHours.end_time)}`;
  }
  if (item.discount_start_time && item.discount_end_time) {
    return `${fmt(item.discount_start_time)}-${fmt(item.discount_end_time)}`;
  }
  return "";
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
  onJump,
}: {
  photos: MenuItemPhoto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
}) {
  const photo = photos[index];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <XClose size={20} className="text-white" />
      </button>

      {/* Counter */}
      {photos.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-3 py-1 text-white/70 text-xs font-bold">
          {index + 1} / {photos.length}
        </div>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[75vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={photo.label ?? ""}
          className="max-w-[90vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl"
        />
      </div>

      {/* Label */}
      {photo.label && (
        <p className="mt-4 text-white/70 text-sm font-semibold text-center px-6">{photo.label}</p>
      )}

      {/* Prev / Next arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft size={22} className="text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight size={22} className="text-white" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-6 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.image_url}
              alt={p.label ?? ""}
              onClick={() => onJump(i)}
              className={`w-12 h-12 object-cover rounded-lg shrink-0 cursor-pointer transition-all ${
                i === index ? "ring-2 ring-white opacity-100" : "opacity-40 hover:opacity-70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PublicBusinessPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [lang, setLang] = useState<"jp" | "en">("jp");
  const [lightbox, setLightbox] = useState<{ photos: MenuItemPhoto[]; index: number } | null>(null);
  const [bookingTab, setBookingTab] = useState<"booking" | "order" | "coupon" | "sns">("booking");

  const openLightbox = useCallback((photos: MenuItemPhoto[], index: number) => {
    setLightbox({ photos, index });
  }, []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevPhoto = useCallback(() =>
    setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.photos.length) % lb.photos.length } : null), []);
  const nextPhoto = useCallback(() =>
    setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.photos.length } : null), []);
  const onJump = useCallback((i: number) => setLightbox((lb) => lb ? { ...lb, index: i } : null), []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/by-slug/${slug}/`);
        if (!res.ok) throw new Error(res.status === 404 ? "Business not found" : "Failed to load");
        setBusiness(await res.json());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const menuTabs = useMemo(() => {
    if (!business?.menu_items) return [];
    const seen = new Set<string>();
    const tabs: { jp: string; en: string; key: string }[] = [];
    for (const item of business.menu_items) {
      const key = item.category_en || item.category_jp || "Other";
      if (!seen.has(key)) {
        seen.add(key);
        tabs.push({ jp: item.category_jp || key, en: item.category_en || key, key });
      }
    }
    return tabs;
  }, [business]);

  const couponItems = useMemo(() => {
    if (!business?.menu_items) return [];
    return business.menu_items.filter(
      (item) => item.discount_percentage != null && item.discount_percentage !== ""
    );
  }, [business]);

  const availableActionTabs = useMemo(() => {
    const tabs: Array<"booking" | "order" | "coupon" | "sns"> = [];
    if ((business?.booking_links?.length ?? 0) > 0) tabs.push("booking");
    if ((business?.order_links?.length ?? 0) > 0) tabs.push("order");
    if (couponItems.length > 0) tabs.push("coupon");
    if ((business?.social_links?.length ?? 0) > 0) tabs.push("sns");
    return tabs;
  }, [business, couponItems]);

  useEffect(() => {
    if (menuTabs.length > 0 && !activeTab) setActiveTab(menuTabs[0].key);
  }, [menuTabs, activeTab]);

  useEffect(() => {
    if (availableActionTabs.length === 0) return;
    if (!availableActionTabs.includes(bookingTab)) {
      setBookingTab(availableActionTabs[0]);
    }
  }, [availableActionTabs, bookingTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }
  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60 text-sm gap-2">
        <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
        {error ?? "Business not found"}
      </div>
    );
  }

  // Use business.photos for carousel; fallback to hero image if no photos
  const businessPhotos = business.photos && business.photos.length > 0 ? business.photos : null;
  const heroSrc = business.hero_image || business.hero_image
  console.log(heroSrc);
  const catMeta = CATEGORY_META[business.category] ?? { labelJp: "ビジネス", labelEn: "Business", tagJp: business.category, tagEn: business.category };
  const { isOpen, currentlyOpen, h: todayH } = getOpenStatus(business.hours ?? [], business.closed_days ?? []);
  const firstClosed = business.closed_days?.[0] ?? null;

  const filteredItems = business.menu_items?.filter((i) => (i.category_en || i.category_jp || "Other") === activeTab) ?? [];
  const serviceItems = business.service_items ?? [];

  const bookLinks = business.booking_links ?? [];
  const orderLinks: OrderLink[] = business.order_links ?? [];
  const socLinks = business.social_links ?? [];

  const photosForCarousel = (business?.photos || []).map(photo => ({
    ...photo,
    id: String(photo.id),
  }));

  return (
    <div className="min-h-screen bg-[#ececec] px-2 py-2 font-sans antialiased sm:px-4 sm:py-4">
      <div className="mx-auto max-w-[500px] pb-8">
        <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_16px_38px_rgba(0,0,0,0.14)]">
          <div className="relative h-[280px] overflow-hidden bg-[var(--bg-lighter)]">
            {photosForCarousel.length > 0 ? (
              <BusinessPhotoCarousel
                photos={photosForCarousel}
                businessName={business.business_name}
                heroSrc={heroSrc}
                category={catMeta.labelEn}
                address={business.address}
              />
            ) : heroSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroSrc} alt={business.business_name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-stone-300 via-stone-400 to-stone-600" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.72))]" />

            <button
              onClick={() => setLang((l) => (l === "jp" ? "en" : "jp"))}
              className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-[11px] font-black tracking-[0.14em] text-white backdrop-blur z-20"
            >
              {lang === "jp" ? "EN" : "JP"}
            </button>
            {/* Animated Notice Button */}
            <NoticeButton />
          </div>

          <div className="px-3 pb-3 pt-2">
            <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap border-b border-[#e8e8e8] pb-2 text-[11px] font-bold scrollbar-hide">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentlyOpen ? "bg-[#39e600]" : isOpen ? "bg-amber-400" : "bg-[#bcbcbc]"}`} />
              <span className={`${currentlyOpen ? "text-[#05b100]" : isOpen ? "text-amber-600" : "text-[#7f7f7f]"}`}>
                {lang === "jp"
                  ? currentlyOpen ? "営業中" : isOpen ? "本日営業" : "定休日"
                  : currentlyOpen ? "Open Now" : isOpen ? "Open Today" : "Day Off"}
              </span>
            </div>
            {todayH?.opening_time && (
              <>
                <span className="shrink-0 text-[#c5c5c5]">●</span>
                <div className="flex items-center gap-1 text-[#2a2a2a] shrink-0 whitespace-nowrap">
                  <Clock size={11} className="shrink-0" />
                  <span>
                    {lang === "jp" ? "営業時間: " : "Open Hours: "}
                    {fmt(todayH.opening_time)} - {fmt(todayH.closing_time)}
                    {todayH.last_order_time && (
                      <span className="text-[#7b7b7b]"> (L.O. {fmt(todayH.last_order_time)})</span>
                    )}
                  </span>
                </div>
              </>
            )}
            {firstClosed && (
              <>
                <span className="shrink-0 text-[#c5c5c5]">●</span>
                <div className="flex items-center gap-1 text-[#2a2a2a] shrink-0 whitespace-nowrap">
                  <CalendarX size={11} className="shrink-0" />
                  <span>
                    {lang === "jp" ? "定休日：" : "Closed: "}
                    {lang === "jp" ? DAY_LABELS[firstClosed.day_of_week]?.jp : DAY_LABELS[firstClosed.day_of_week]?.en}
                  </span>
                </div>
              </>
            )}
          </div>

            <div className="grid grid-cols-2 gap-3 py-3">
            {business.maps_url ? (
              <a
                href={business.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#dfdfdf] bg-white text-[15px] font-black text-[#7f8fb5] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] transition-transform active:scale-[0.98]"
              >
                <Navigation size={17} className="text-[#2f63ff]" />
                {lang === "jp" ? "道順" : "Directions"}
              </a>
            ) : <div />}
            {business.phone_number ? (
              <a
                href={`tel:${business.phone_number}`}
                className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#08c74f] text-[15px] font-black text-white transition-transform active:scale-[0.98]"
              >
                <Phone size={17} />
                {lang === "jp" ? "電話する" : "Call"}
              </a>
            ) : <div />}
          </div>

            {(bookLinks.length > 0 || orderLinks.length > 0 || couponItems.length > 0 || socLinks.length > 0) && (
              <div className="overflow-hidden rounded-[16px] border-[1px] border-[#cfd6df] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                <div className="grid grid-cols-4 border-b-[1.5px] border-[#cfd6df] bg-[#dfdfdf]">
                  {[
                    { key: "booking" as const, label: "Booking", enabled: bookLinks.length > 0 },
                    { key: "order" as const, label: "Order", enabled: orderLinks.length > 0 },
                    { key: "coupon" as const, label: "Coupon", enabled: couponItems.length > 0 },
                    { key: "sns" as const, label: "SNS", enabled: socLinks.length > 0 },
                  ].map((tab, index) => {
                    const isActive = bookingTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        disabled={!tab.enabled}
                        onClick={() => tab.enabled && setBookingTab(tab.key)}
                        className={`h-[36px] px-2 text-center text-[clamp(0.95rem,2.4vw,1.35rem)] font-black leading-none tracking-[-0.04em] transition-colors ${
                          index < 3 ? "border-r-[1.5px] border-[#cfd6df]" : ""
                        } ${
                          isActive
                            ? "bg-white text-black"
                            : "bg-[#dddddd] text-[#a7a7a7]"
                        } ${tab.enabled ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[60px] px-4 py-4">
                  {bookingTab === "booking" && (
                    <div className="flex flex-wrap items-center gap-3">
                      {bookLinks.map((link) => {
                        const cfg = BOOKING_CFG[link.platform] ?? BOOKING_CFG.custom;
                        const label = link.custom_name || (lang === "jp" ? cfg.jp.replace(/\n.*/, "") : cfg.en.replace(/\n.*/, ""));
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            title={label}
                            className="flex items-center justify-center active:scale-[0.97] transition-transform"
                          >
                            <BookingIcon platform={link.platform} className="h-[58px] w-[58px] rounded-[16px] shadow-[0_3px_8px_rgba(0,0,0,0.08)]" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {bookingTab === "order" && (
                    <div className="flex flex-wrap items-center gap-3">
                      {orderLinks.map((link) => {
                        const cfg = ORDER_CFG[link.platform] ?? ORDER_CFG.custom;
                        const label = link.custom_name || (lang === "jp" ? cfg.jp : cfg.en);
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            title={label}
                            className="flex items-center justify-center active:scale-[0.97] transition-transform"
                          >
                            <OrderIcon platform={link.platform} className="h-[58px] w-[58px] rounded-[16px] shadow-[0_3px_8px_rgba(0,0,0,0.08)]" />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {bookingTab === "coupon" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {couponItems.map((item) => {
                        const label =
                          lang === "jp"
                            ? (item.category_jp ?? item.category_en ?? "—")
                            : (item.category_en ?? item.category_jp ?? "—");
                        const isDrink = /drink|ドリンク|飲み物|cocktail|bar|beer|wine/i.test(label);
                        const bg = isDrink ? "#4b7f16" : "#ff4b18";
                        return (
                          <div key={item.id} className="inline-flex gap-1.5">
                            <div
                              className="relative flex h-[32px] items-center justify-center overflow-hidden rounded-[6px] px-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
                              style={{ backgroundColor: bg }}
                            >
                              <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                              <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                              <p className="m-0 flex items-baseline gap-0.5 whitespace-nowrap font-black leading-none tracking-[-0.06em] text-white">
                                <span className="text-[1.1rem]">{item.discount_percentage}%</span>
                                <span className="ml-0.5 text-[0.65rem] font-extrabold tracking-[0.02em]">{label}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {bookingTab === "sns" && (
                    <div className="flex flex-wrap items-center gap-3">
                      {socLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={link.custom_name || SOCIAL_LABELS[link.platform] || link.platform}
                          title={link.custom_name || SOCIAL_LABELS[link.platform] || link.platform}
                          className="flex items-center justify-center active:scale-[0.97] transition-transform"
                        >
                          <SocialIcon platform={link.platform} className="h-[58px] w-[58px] rounded-[16px] shadow-[0_3px_8px_rgba(0,0,0,0.08)]" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        {(menuTabs.length > 0 || serviceItems.length > 0) && (
          <div className="mt-3 overflow-hidden border-t border-[#ececec] bg-white">
            {menuTabs.length > 0 && (
              <div className="grid grid-flow-col auto-cols-fr border-b-[1.5px] border-[#cfd6df] bg-[#dfdfdf] overflow-x-auto scrollbar-hide">
                {menuTabs.map((tab) => {
                  const sourceItem = business.menu_items?.find((item) => (item.category_en || item.category_jp || "Other") === tab.key);
                  return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`min-w-[108px] border-r border-[#cfd6df] px-3 py-3 text-center transition-colors last:border-r-0 ${
                      activeTab === tab.key
                        ? "bg-white text-black"
                        : "bg-[#dddddd] text-[#9f9f9f]"
                    }`}
                  >
                    <div className="text-[11px] font-black leading-none uppercase tracking-[0.04em]">{lang === "jp" ? tab.jp : tab.en}</div>
                    <div className="mt-1.5 text-[9px] font-semibold leading-none text-inherit opacity-90">
                      {getMenuTabCaption(sourceItem)}
                    </div>
                  </button>
                  );
                })}
              </div>
            )}

            <div className="max-h-[70vh] overflow-y-auto">
            {filteredItems.length > 0 && (
              <div>
                <div className="divide-y divide-[#efefef]">
                {filteredItems.map((item) => {
                  const photos = item.photos ?? [];
                  return (
                    <div key={item.id} className="px-4 py-5">
                      {photos.length > 0 ? (
                        <div className="flex max-h-[400px] flex-col snap-y snap-mandatory gap-3 overflow-y-auto overflow-x-hidden rounded-[8px] scrollbar-hide">
                          {photos.map((photo, index) => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => openLightbox(photos, index)}
                              className="block w-full shrink-0 snap-start overflow-hidden rounded-[8px]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.image_url}
                                alt={photo.label ?? ""}
                                className="h-[400px] w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[176px] w-full rounded-[8px] bg-gradient-to-br from-stone-100 to-stone-200" />
                      )}
                      </div>
                    
                  );
                })}
                </div>
              </div>
            )}

            {serviceItems.length > 0 && (
              <div className="divide-y divide-[#efefef] border-t border-[#efefef] bg-white">
                {!menuTabs.length && (
                  <div className="px-4 py-4 border-b border-[#efefef]">
                    <h2 className="text-[15px] font-black text-black">
                      {lang === "jp" ? "サービス" : "Services"}
                    </h2>
                  </div>
                )}
                {serviceItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_42%] gap-3 px-4 py-4">
                    <div className="self-center">
                      <h3 className="text-[15px] font-black text-black">{lang === "jp" ? item.name_jp : item.name_en}</h3>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a0a0a0]">{lang === "jp" ? item.name_en : item.name_jp}</p>
                      {(lang === "jp" ? item.description_jp : item.description_en) && (
                        <p className="mt-3 text-[11px] leading-5 text-[#525252] line-clamp-3">
                          {lang === "jp" ? item.description_jp : item.description_en}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-[11px] font-black text-[#2b2b2b]">
                        <span>¥{Number(item.price).toLocaleString()}</span>
                        <span className="text-[#9f9f9f]">{item.duration_minutes} min</span>
                      </div>
                    </div>
                    {item.image_url && (
                      <div className="self-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt={item.name_en} className="h-[112px] w-full rounded-[6px] object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        </div>

        <div className="px-2 pt-4 text-center text-[10px] font-semibold tracking-[0.22em] text-[#9b9b9b]">
          POWERED BY MENUS.JP
        </div>

      </div>

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
          onJump={onJump}
        />
      )}

    </div>
  );
}
