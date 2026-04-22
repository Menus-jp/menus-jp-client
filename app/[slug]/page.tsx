"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ChevronRight,
  Menu as MenuIcon,
  Map,
  Loader2,
  AlertCircle,
  ExternalLink,
  X as XClose,
  ChevronLeft,
  CalendarX,
} from "lucide-react";
import { BusinessDetail, BusinessHours, MenuItemPhoto } from "@/lib/types/business";

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
function BookingIcon({ platform }: { platform: string }) {
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
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
      {c.icon}
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
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
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
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

function extractAddressTag(address?: string): string | null {
  if (!address) return null;
  const wardMatch = address.match(/([^都道府県\s]+[市区町村])/);
  if (wardMatch) return wardMatch[1];
  return address.split(/[,、\s]/)[0]?.slice(0, 10) ?? null;
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

  useEffect(() => {
    if (menuTabs.length > 0 && !activeTab) setActiveTab(menuTabs[0].key);
  }, [menuTabs, activeTab]);

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

  const heroSrc = business.hero_image_url || business.hero_image;
  const catMeta = CATEGORY_META[business.category] ?? { labelJp: "ビジネス", labelEn: "Business", tagJp: business.category, tagEn: business.category };
  const subtitleParts = slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  const { isOpen, currentlyOpen, h: todayH, today } = getOpenStatus(business.hours ?? [], business.closed_days ?? []);
  const addressTag = extractAddressTag(business.address);
  const firstClosed = business.closed_days?.[0] ?? null;

  const filteredItems = business.menu_items?.filter((i) => (i.category_en || i.category_jp || "Other") === activeTab) ?? [];

  const MAX_BOOK = 3;
  const bookLinks = business.booking_links ?? [];
  const visBook = bookLinks.slice(0, MAX_BOOK);
  const extraBook = bookLinks.length - MAX_BOOK;

  const MAX_SOC = 4;
  const socLinks = business.social_links ?? [];
  const visSoc = socLinks.slice(0, MAX_SOC);
  const extraSoc = socLinks.length - MAX_SOC;

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased">
      <div className="max-w-[480px] mx-auto pb-28">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden" style={{ height: 340 }}>
          {heroSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroSrc} alt={business.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/60" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            {/* Logo box */}
            <div className="bg-white rounded-xl px-2.5 py-2 shadow-2xl min-w-[66px] text-center">
              <div className="text-[8px] font-black text-gray-400 uppercase tracking-tighter border-b border-gray-100 pb-0.5 mb-1 leading-none">
                {catMeta.labelJp}
              </div>
              <div className="text-[18px] font-black text-gray-900 leading-tight tracking-tighter">
                {business.business_name.slice(0, 2)}
              </div>
              <div className="text-[7px] font-bold text-gray-400 tracking-[0.15em] uppercase leading-none mt-1">
                {subtitleParts[0]}
              </div>
            </div>
            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setLang((l) => (l === "jp" ? "en" : "jp"))}
                className="bg-black/45 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 text-[10px] font-bold"
              >
                <span className={lang === "jp" ? "text-white" : "text-white/35"}>JP</span>
                <span className="mx-1.5 text-white/20">|</span>
                <span className={lang === "en" ? "text-white" : "text-white/35"}>EN</span>
              </button>
              <button className="p-2.5 bg-black/45 backdrop-blur-md border border-white/20 rounded-lg">
                <MenuIcon size={18} />
              </button>
            </div>
          </div>

          {/* Business name overlay */}
          <div className="absolute bottom-8 left-0 right-0 text-center px-5">
            <h1 className="text-[34px] font-black tracking-tight leading-tight">
              {business.business_name}
            </h1>
            <p className="text-[10px] tracking-[0.35em] font-semibold text-white/45 mt-1 uppercase">
              {subtitleParts.join(" · ")}
            </p>
            <div className="mt-4 inline-flex bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-5 py-1.5 text-[10px] font-bold tracking-wide">
              {lang === "jp"
                ? `${catMeta.labelJp}${addressTag ? `・${addressTag}` : ""} | ${catMeta.labelEn}${addressTag ? ` · ${addressTag}` : ""}`
                : `${catMeta.labelEn}${addressTag ? ` · ${addressTag}` : ""} | ${catMeta.labelJp}${addressTag ? `・${addressTag}` : ""}`}
            </div>
          </div>
        </div>

        {/* ── Status bar ────────────────────────────────────────────── */}
        <div className="bg-[#0a0a0a] border-y border-white/[0.06] py-3 px-4 flex items-center gap-3 text-[11px] font-bold overflow-x-auto scrollbar-hide">
          {/* Open / Closed */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${currentlyOpen ? "bg-green-500 animate-pulse" : isOpen ? "bg-amber-500" : "bg-gray-600"}`} />
            <span className={currentlyOpen ? "text-green-400" : isOpen ? "text-amber-400" : "text-gray-400"}>
              {lang === "jp"
                ? currentlyOpen ? "営業中 / Open" : isOpen ? "本日営業 / Open Today" : "定休日 / Day Off"
                : currentlyOpen ? "Open Now" : isOpen ? "Open Today" : "Day Off"}
            </span>
          </div>

          {todayH?.opening_time && (
            <>
              <span className="text-white/10 shrink-0">|</span>
              <div className="flex items-center gap-1.5 text-white/60 shrink-0 font-medium">
                <Clock size={11} className="text-white/25 shrink-0" />
                <span className="text-white/30 font-bold">
                  {lang === "jp" ? DAY_LABELS[today]?.jp : DAY_LABELS[today]?.en}
                </span>
                <span>
                  {fmt(todayH.opening_time)} – {fmt(todayH.closing_time)}
                  {todayH.last_order_time && (
                    <span className="text-white/35 font-normal"> (L.O. {fmt(todayH.last_order_time)})</span>
                  )}
                </span>
              </div>
            </>
          )}

          {firstClosed && (
            <>
              <span className="text-white/10 shrink-0">|</span>
              <div className="flex items-center gap-1 text-white/40 shrink-0 font-medium">
                <CalendarX size={11} className="text-white/25 shrink-0" />
                <span>
                  {lang === "jp" ? "定休日：" : "Closed: "}
                  {DAY_LABELS[firstClosed.day_of_week]?.jp}
                  <span className="text-white/20 font-normal"> / {DAY_LABELS[firstClosed.day_of_week]?.en}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── CTA buttons ───────────────────────────────────────────── */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {business.maps_url ? (
            <a
              href={business.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform shadow"
            >
              <Navigation size={18} className="text-blue-600 shrink-0" />
              <div className="leading-tight">
                <div className="text-xs font-black">{lang === "jp" ? "道順" : "Directions"}</div>
                <div className="text-[9px] font-bold text-gray-400">{lang === "jp" ? "Directions" : "道順"}</div>
              </div>
            </a>
          ) : <div />}
          {business.phone_number ? (
            <a
              href={`tel:${business.phone_number}`}
              className="bg-[#3b59ff] text-white rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform shadow"
            >
              <Phone size={18} className="shrink-0" />
              <div className="leading-tight">
                <div className="text-xs font-black">{lang === "jp" ? "電話" : "Call"}</div>
                <div className="text-[9px] font-bold text-blue-200">{lang === "jp" ? "Call" : "電話"}</div>
              </div>
            </a>
          ) : <div />}
        </div>

        {/* ── Content sections ──────────────────────────────────────── */}
        <div className="px-4 space-y-6">

          {/* Booking */}
          {bookLinks.length > 0 && (
            <section>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-sm font-black">
                  {lang === "jp" ? "ご予約はこちら" : "Make a Reservation"}
                </h2>
                <span className="text-[9px] text-white/30 font-bold tracking-widest uppercase">
                  {lang === "jp" ? "Book a Table" : "ご予約"}
                </span>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${visBook.length + (extraBook > 0 ? 1 : 0)}, 1fr)` }}
              >
                {visBook.map((link) => {
                  const cfg = BOOKING_CFG[link.platform] ?? BOOKING_CFG.custom;
                  const label = link.custom_name || (lang === "jp" ? cfg.jp.replace(/\n.*/, "") : cfg.en.replace(/\n.*/, ""));
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-xl flex flex-col items-center justify-center text-center py-3.5 px-2 gap-2 min-h-[90px] active:scale-[0.97] transition-transform shadow-sm"
                    >
                      <BookingIcon platform={link.platform} />
                      <span className="text-[10px] font-black leading-tight text-gray-700 whitespace-pre-line">{label}</span>
                    </a>
                  );
                })}
                {extraBook > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[80px] text-white/35">
                    <span className="text-xl font-light leading-none">＋</span>
                    <span className="text-[9px] font-black mt-1">{lang === "jp" ? "その他" : "More"}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Social */}
          {socLinks.length > 0 && (
            <section>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-sm font-black">
                  {lang === "jp" ? "SNS・フォローはこちら" : "Follow Us"}
                </h2>
                <span className="text-[9px] text-white/30 font-bold tracking-widest uppercase">Follow Us</span>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${visSoc.length + (extraSoc > 0 ? 1 : 0)}, 1fr)` }}
              >
                {visSoc.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl flex flex-col items-center justify-center gap-2 py-3.5 px-2 min-h-[90px] active:scale-[0.97] transition-transform shadow-sm"
                  >
                    <SocialIcon platform={link.platform} />
                    <span className="text-[10px] font-black text-gray-700 tracking-tight">
                      {link.custom_name || SOCIAL_LABELS[link.platform] || link.platform}
                    </span>
                  </a>
                ))}
                {extraSoc > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[80px] text-white/35">
                    <span className="text-xl font-light leading-none">＋</span>
                    <span className="text-[9px] font-black mt-1">{lang === "jp" ? "その他" : "More"}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Menu / Services card ──────────────────────────────────── */}
        {(menuTabs.length > 0 || (business.service_items?.length ?? 0) > 0) && (
          <div className="bg-white rounded-t-[36px] mt-8 text-black min-h-[400px] overflow-hidden shadow-2xl">

            {/* Tab bar */}
            {menuTabs.length > 0 && (
              <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                {menuTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 flex-1 min-w-[90px] py-4 px-3 text-center transition-colors ${
                      activeTab === tab.key ? "bg-black text-white" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <div className="text-[12px] font-black">{lang === "jp" ? tab.jp : tab.en}</div>
                    <div className={`text-[8px] font-bold tracking-widest uppercase mt-0.5 ${activeTab === tab.key ? "text-white/40" : "text-gray-300"}`}>
                      {lang === "jp" ? tab.en : tab.jp}
                    </div>
                  </button>
                ))}
                <div className="shrink-0 flex items-center px-3 text-gray-200">
                  <ChevronRight size={16} />
                </div>
              </div>
            )}

            {/* Menu items */}
            {filteredItems.length > 0 && (
              <div className="divide-y divide-gray-50">
                {filteredItems.map((item) => {
                  const photos = item.photos ?? [];
                  const firstPhoto = photos[0];
                  const nameJp = firstPhoto?.label ?? item.category_jp ?? "—";
                  const nameEn = item.category_en ?? "";
                  const hasMany = photos.length > 1;
                  return (
                    <div key={item.id} className="p-5">
                      {/* Photo strip — single thumb or scrollable row */}
                      {photos.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-0.5 scrollbar-hide">
                          {photos.map((photo, photoIdx) => (
                            <button
                              key={photo.id}
                              onClick={() => openLightbox(photos, photoIdx)}
                              className="relative shrink-0 group focus:outline-none"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.image_url}
                                alt={photo.label ?? ""}
                                className={`object-cover rounded-2xl group-hover:brightness-90 transition-all ${
                                  hasMany ? "w-20 h-20" : "w-24 h-24"
                                }`}
                              />
                              {/* +N badge on last visible thumb when list is long */}
                              {photoIdx === 3 && photos.length > 4 && (
                                <div className="absolute inset-0 bg-black/55 rounded-2xl flex items-center justify-center">
                                  <span className="text-white font-black text-sm">+{photos.length - 4}</span>
                                </div>
                              )}
                              {item.discount_percentage && photoIdx === 0 && (
                                <span className="absolute -top-2 -left-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-1 rounded-lg shadow-lg leading-tight text-center">
                                  人気<br />Popular
                                </span>
                              )}
                            </button>
                          )).slice(0, 4)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                          <h3 className="font-black text-[16px] leading-snug text-gray-900">{nameJp}</h3>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">{nameEn}</p>
                          {item.discount_percentage && (
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] bg-red-50 text-red-500 font-black px-2 py-0.5 rounded-full">
                                {item.discount_percentage}% OFF
                              </span>
                              {item.discount_start_time && item.discount_end_time && (
                                <span className="text-[11px] text-gray-400 font-medium">
                                  {item.discount_start_time.slice(0, 10)} – {item.discount_end_time.slice(0, 10)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Service items */}
            {business.service_items && business.service_items.length > 0 && (
              <div className="divide-y divide-gray-50">
                {!menuTabs.length && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-black text-[16px] text-gray-900">
                      {lang === "jp" ? "サービス" : "Services"}
                    </h2>
                  </div>
                )}
                {business.service_items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-5 items-start">
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name_en} className="w-24 h-24 object-cover rounded-2xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-black text-[16px] text-gray-900 leading-snug">
                            {lang === "jp" ? item.name_jp : item.name_en}
                          </p>
                          <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                            {lang === "jp" ? item.name_en : item.name_jp}
                          </p>
                          {(lang === "jp" ? item.description_jp : item.description_en) && (
                            <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                              {lang === "jp" ? item.description_jp : item.description_en}
                            </p>
                          )}
                        </div>
                        <span className="font-black text-[17px] text-gray-900 shrink-0 tabular-nums">
                          ¥{Number(item.price).toLocaleString()}
                        </span>
                      </div>
                      <span className="mt-1.5 inline-block text-[11px] text-gray-400 font-medium">
                        {item.duration_minutes} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Sticky footer ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-black/95 backdrop-blur-xl border-t border-white/[0.08] z-50">
        <div className="flex items-stretch divide-x divide-white/[0.06]">
          {business.address && (
            <div className="flex items-center gap-2 px-3 py-3 flex-1 min-w-0">
              <MapPin size={13} className="text-white/30 shrink-0" />
              <span className="text-[10px] text-white/45 truncate font-medium">{business.address}</span>
            </div>
          )}
          {business.phone_number && (
            <a
              href={`tel:${business.phone_number}`}
              className="flex items-center gap-1.5 px-3 py-3 text-white/40 hover:text-white/70 shrink-0 transition-colors"
            >
              <Phone size={14} />
              <span className="text-[10px] font-bold whitespace-nowrap hidden sm:block">{business.phone_number}</span>
            </a>
          )}
          {business.maps_url && (
            <a
              href={business.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-3 text-white/40 hover:text-white/70 shrink-0 transition-colors"
            >
              <Map size={14} />
              <div className="leading-tight">
                <div className="text-[10px] font-black whitespace-nowrap">{lang === "jp" ? "地図を開く" : "Open Map"}</div>
                {lang === "jp" && <div className="text-[8px] text-white/20 font-medium">Open Map</div>}
              </div>
            </a>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 border-t border-white/[0.05] py-1.5">
          <span className="text-[10px] text-white/20">Powered by</span>
          <span className="text-[10px] font-black text-white/30">menus.jp</span>
          <ExternalLink size={9} className="text-white/15" />
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────── */}
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
