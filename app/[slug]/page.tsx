"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  X as XClose,
  ChevronLeft,
  CalendarX,
  Maximize2,
} from "lucide-react";
import { BusinessDetail, BusinessHours, BusinessInfo, MenuItemPhoto, OrderLink } from "@/lib/types/business";
import BusinessPhotoCarousel from "@/components/business/carousel";
import { NoticeButton } from "@/components/business/NoticeButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const LanguagesIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

const IOSLocationIconSvg = () => (
  <svg 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
  className="w-6 h-6"
>
  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
  <circle cx="12" cy="10" r="3" />
</svg>
);

const IOSPhoneIconSvg = () => (
<svg 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
  className="w-6 h-6"
>
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
</svg>
);

const IOSInfoIconSvg = () => (
  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-current" aria-hidden="true">
    <path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 12 2.5Zm0 4.1a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 12 6.6Zm1.35 10.4h-2.7a.75.75 0 0 1 0-1.5h.6V11.1h-.45a.75.75 0 0 1 0-1.5H12a.75.75 0 0 1 .75.75v5.15h.6a.75.75 0 0 1 0 1.5Z" />
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

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "MJ";
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

function normalizeBusinessInfoPayload(payload: unknown): BusinessInfo | null {
  if (Array.isArray(payload)) {
    return (payload[0] as BusinessInfo | undefined) ?? null;
  }

  if (payload && typeof payload === "object") {
    const results = (payload as { results?: unknown }).results;
    if (Array.isArray(results)) {
      return (results[0] as BusinessInfo | undefined) ?? null;
    }

    return payload as BusinessInfo;
  }

  return null;
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
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <XClose size={20} className="text-white" />
      </button>

      {photos.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-3 py-1 text-white/70 text-xs font-bold">
          {index + 1} / {photos.length}
        </div>
      )}

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

      {photo.label && (
        <p className="mt-4 text-white/70 text-sm font-semibold text-center px-6">{photo.label}</p>
      )}

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/42 text-black backdrop-blur-sm transition-colors hover:bg-black"
          >
            <ChevronLeft size={22} className="text-black" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/42 text-black backdrop-blur-sm transition-colors hover:bg-black"
          >
            <ChevronRight size={22} className="text-black" />
          </button>
        </>
      )}

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


export default function PublicBusinessPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [lang, setLang] = useState<"jp" | "en">("jp");
  const [lightbox, setLightbox] = useState<{ photos: MenuItemPhoto[]; index: number } | null>(null);
  const [menuPhotoIndexes, setMenuPhotoIndexes] = useState<Record<number, number>>({});
  const [bookingTab, setBookingTab] = useState<"booking" | "order" | "coupon" | "sns">("booking");
  const [infoOpen, setInfoOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const menuSectionRef = useRef<HTMLDivElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menuTabsRef = useRef<HTMLDivElement | null>(null);

  const openLightbox = useCallback((photos: MenuItemPhoto[], index: number) => {
    setLightbox({ photos, index });
  }, []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevPhoto = useCallback(() =>
    setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.photos.length) % lb.photos.length } : null), []);
  const nextPhoto = useCallback(() =>
    setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.photos.length } : null), []);
  const onJump = useCallback((i: number) => setLightbox((lb) => lb ? { ...lb, index: i } : null), []);
  const shiftMenuPhoto = useCallback((itemId: number, totalPhotos: number, direction: 1 | -1) => {
    setMenuPhotoIndexes((current) => ({
      ...current,
      [itemId]: ((current[itemId] ?? 0) + direction + totalPhotos) % totalPhotos,
    }));
  }, []);
  const revealMenuTabs = useCallback(() => {
    if (menuSectionRef.current) {
      const rect = menuSectionRef.current.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      console.log("📍 Scrolling to:", absoluteTop, "Current position:", window.scrollY, "Rect.top:", rect.top);
      
      window.scrollTo({
        top: absoluteTop,
        behavior: "smooth",
      });
      
      setTimeout(() => {
        document.documentElement.scrollTop = absoluteTop;
        document.body.scrollTop = absoluteTop;
      }, 50);
    }
    if (menuPanelRef.current) {
      menuPanelRef.current.scrollTop = 0;
    }
  }, []);
  const handleMenuImageWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if ((menuPanelRef.current?.scrollTop ?? 0) > 0 || menuSectionRef.current) {
      revealMenuTabs();
    }
  }, [revealMenuTabs]);

  const openInfoDialog = useCallback(async () => {
    setInfoOpen(true);

    if (businessInfo || !business?.id) {
      return;
    }

    if (business.info) {
      setBusinessInfo(business.info);
      return;
    }

    try {
      setInfoLoading(true);
      setInfoError(null);
      const res = await fetch(`${API_BASE_URL}/business-info/?business=${business.id}`);
      if (!res.ok) {
        throw new Error(lang === "jp" ? "店舗情報を読み込めませんでした" : "Failed to load business info");
      }

      const payload = await res.json();
      setBusinessInfo(normalizeBusinessInfoPayload(payload));
    } catch (e: unknown) {
      setInfoError(e instanceof Error ? e.message : lang === "jp" ? "店舗情報を読み込めませんでした" : "Failed to load business info");
    } finally {
      setInfoLoading(false);
    }
  }, [business, businessInfo, lang]);

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
    
    // First, find all categories that have items with photos
    const categoriesWithPhotos = new Set<string>();
    for (const item of business.menu_items) {
      if ((item.photos?.length ?? 0) > 0) {
        const key = item.category_en || item.category_jp || "Other";
        categoriesWithPhotos.add(key);
      }
    }
    
    // Now create tabs only for categories with photos
    const seen = new Set<string>();
    const tabs: { jp: string; en: string; key: string }[] = [];
    for (const item of business.menu_items) {
      const key = item.category_en || item.category_jp || "Other";
      if (categoriesWithPhotos.has(key) && !seen.has(key)) {
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

  const heroSrc = business.logo
  const catMeta = CATEGORY_META[business.category] ?? { labelJp: "ビジネス", labelEn: "Business", tagJp: business.category, tagEn: business.category };
  const { isOpen, currentlyOpen, h: todayH } = getOpenStatus(business.hours ?? [], business.closed_days ?? []);
  const firstClosed = business.closed_days?.[0] ?? null;
  const businessInitials = getInitials(business.business_name);

  const filteredItems = business.menu_items?.filter((i) => (i.category_en || i.category_jp || "Other") === activeTab) ?? [];
  const serviceItems = business.service_items ?? [];

  const bookLinks = business.booking_links ?? [];
  const orderLinks: OrderLink[] = business.order_links ?? [];
  const socLinks = business.social_links ?? [];
  const infoDescription = lang === "jp"
    ? businessInfo?.description_jp || businessInfo?.description_en || ""
    : businessInfo?.description_en || businessInfo?.description_jp || "";
  const hasBusinessInfo = Boolean(
    businessInfo?.description_jp || businessInfo?.description_en || businessInfo?.seating_capacity != null
  );

  const photosForCarousel = (business?.photos || []).map((photo) => ({
    id: String(photo.id),
    image: photo.image_url,
    alt: lang === "jp" ? photo.alt_text_jp : photo.alt_text_en,
  }));

  return (
    <div className="min-h-screen bg-[#ececec] px-2 py-2 font-sans antialiased sm:px-4 sm:py-4">
      <div className="mx-auto max-w-[500px] pb-8">
        <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_16px_38px_rgba(0,0,0,0.14)]">
          <div className="relative h-[260px] overflow-hidden bg-[#18120d]">
            {photosForCarousel.length > 0 ? (
              <BusinessPhotoCarousel
                photos={photosForCarousel}
                businessName={business.business_name}
                heroSrc={heroSrc}
                fillContainer
                showIdentity={false}
                className="h-full rounded-none"
              />
            ) : heroSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroSrc}
                alt={business.business_name}
                className="absolute inset-0 h-full w-full scale-[1.08] object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c88f4b,transparent_38%),linear-gradient(135deg,#2b211a,#120d09_55%,#302319)]" />
            )}

            <button
              onClick={() => setLang((l) => (l === "jp" ? "en" : "jp"))}
              className="absolute right-4 top-2 z-20 rounded-full border border-black/15 bg-black/28 p-2 text-yellow-500"
              aria-label={lang === "jp" ? "Switch to English" : "日本語に切り替え"}
            >
              <LanguagesIconSvg />
            </button>
            <NoticeButton />

            <div className="absolute inset-x-0 bottom-[52px] z-10 px-4">
              <div className="flex items-end justify-between gap-3 rounded-[22px] px-4 py-5 text-white">
                <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                  <div className="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/25">
                    {heroSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroSrc}
                        alt={business.business_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[22px] font-black tracking-[-0.08em] text-white">{businessInitials}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1 className="text-[clamp(1.05rem,2.8vw,1.75rem)] font-black leading-[0.95] tracking-[-0.06em] text-white break-words [overflow-wrap:anywhere]">
                      {business.business_name}
                    </h1>
                    <p className="mt-1.5 line-clamp-1 text-[14px] font-semibold text-white/88">
                      {lang === "jp" ? catMeta.labelJp : catMeta.labelEn}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={openInfoDialog}
                    aria-label={lang === "jp" ? "店舗情報" : "Business info"}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-[#f4b400] text-[#181818] shadow-[0_16px_28px_rgba(0,0,0,0.24)] backdrop-blur transition-transform active:scale-[0.97]"
                  >
                    <span className="text-[#ffffff]">
                      <IOSInfoIconSvg />
                    </span>
                  </button>
                  {business.maps_url && (
                    <a
                      href={business.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={lang === "jp" ? "道順" : "Directions"}
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-white/94 text-[#2875e8] shadow-[0_16px_28px_rgba(0,0,0,0.24)] backdrop-blur transition-transform active:scale-[0.97]"
                    >
                      <IOSLocationIconSvg />
                    </a>
                  )}
                  {business.phone_number && (
                    <a
                      href={`tel:${business.phone_number}`}
                      aria-label={lang === "jp" ? "電話する" : "Call"}
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-[#19c85e] text-white shadow-[0_16px_28px_rgba(0,0,0,0.24)] transition-transform active:scale-[0.97]"
                    >
                      <IOSPhoneIconSvg />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 border-t border-black/8 bg-white/96 backdrop-blur-md">
              <div className="flex min-h-[42px] items-center justify-between gap-4 overflow-x-auto whitespace-nowrap px-4 py-2 text-center scrollbar-hide">
                <div className="flex min-w-0 shrink-0 items-center gap-2 text-[9px] font-black text-[#151515] sm:text-[9px]">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${currentlyOpen ? "bg-[#14bf43]" : isOpen ? "bg-[#e8a534]" : "bg-[#bcbcbc]"}`} />
                  <span className="truncate">
                    {lang === "jp"
                      ? currentlyOpen ? "営業中" : isOpen ? "本日営業" : "定休日"
                      : currentlyOpen ? "Open Now" : isOpen ? "Open Today" : "Day Off"}
                  </span>
                </div>

                <div className="flex min-w-0 shrink items-center gap-1.5 text-[9px] font-black text-[#232323] sm:text-[9px]">
                  <Clock size={14} className="shrink-0 text-[#8e8e8e]" />
                  <span className="truncate">
                    {todayH?.opening_time
                      ? `${lang === "jp" ? "営業時間" : "Open Hours"}: ${fmt(todayH.opening_time)} - ${fmt(todayH.closing_time)}${todayH.last_order_time ? ` (L.O. ${fmt(todayH.last_order_time)})` : ""}`
                      : lang === "jp" ? "営業時間未設定" : "Hours unavailable"}
                  </span>
                </div>

                <div className="flex min-w-0 shrink-0 items-center gap-1.5 text-[9px] font-black text-[#232323] sm:text-[9px]">
                  <CalendarX size={14} className="shrink-0 text-[#ff2c24]" />
                  <span className="truncate">
                    {firstClosed
                      ? `${lang === "jp" ? "定休日" : "Closed"}: ${lang === "jp" ? DAY_LABELS[firstClosed.day_of_week]?.jp : DAY_LABELS[firstClosed.day_of_week]?.en}`
                      : lang === "jp" ? "定休日なし" : "No set closure"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 pb-1 pt-3">
            {(bookLinks.length > 0 || orderLinks.length > 0 || couponItems.length > 0 || socLinks.length > 0) && (
              <div className="overflow-hidden rounded-[16px] border-[1px] border-[#cfd6df] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                {availableActionTabs.length > 1 && (
                  <div className="grid grid-flow-col auto-cols-fr border-b-[1.5px] border-[#cfd6df] bg-[#dfdfdf]">
                    {[
                      { key: "booking" as const, label: "Booking", enabled: bookLinks.length > 0 },
                      { key: "order" as const, label: "Order", enabled: orderLinks.length > 0 },
                      { key: "coupon" as const, label: "Coupon", enabled: couponItems.length > 0 },
                      { key: "sns" as const, label: "SNS", enabled: socLinks.length > 0 },
                    ].filter((tab) => tab.enabled).map((tab, index, visibleTabs) => {
                      const isActive = bookingTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setBookingTab(tab.key)}
                          className={`h-[36px] px-2 text-center text-[clamp(0.95rem,2.4vw,1.35rem)] font-black leading-none tracking-[-0.04em] transition-colors ${
                            index < visibleTabs.length - 1 ? "border-r-[1.5px] border-[#cfd6df]" : ""
                          } ${
                            isActive
                              ? "bg-white text-black"
                              : "bg-[#dddddd] text-[#a7a7a7]"
                          } cursor-pointer`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="min-h-[52px] px-4 py-3">
                  {bookingTab === "booking" && (
                    <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
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
                            <BookingIcon platform={link.platform} className="h-[36px] w-[36px] rounded-[12px] shadow-[0_3px_8px_rgba(0,0,0,0.08)]" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {bookingTab === "order" && (
                    <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
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
                            <OrderIcon platform={link.platform} className="h-[36px] w-[36px] rounded-[12px] shadow-[0_3px_8px_rgba(0,0,0,0.08)]" />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {bookingTab === "coupon" && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
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
                                <span className="text-[1.1rem]">{Math.round(Number(item.discount_percentage) || 0)}%</span>
                                <span className="ml-0.5 text-[0.65rem] font-extrabold tracking-[0.02em]">{label}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {bookingTab === "sns" && (
                    <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
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
                          <SocialIcon platform={link.platform} className="h-[36px] w-[36px] rounded-[12px] shadow-[0_3px_8px_rgba(0,0,0,0.08)]" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        {(menuTabs.length > 0 || serviceItems.length > 0) && (
          <div className="mt-1 overflow-x-auto border-t border-[#ececec] bg-white scrollbar-hide">
            <div className="max-h-[70vh] overflow-y-auto">
            {menuTabs.length > 0 && (
              <div ref={menuTabsRef} className="sticky top-0 z-20 flex border-b-[1.5px] border-[#cfd6df] bg-[#dfdfdf] shadow-[0_8px_18px_rgba(255,255,255,0.92)] overflow-x-auto scrollbar-hide">
                {menuTabs.map((tab) => {
                  const sourceItem = business.menu_items?.find((item) => (item.category_en || item.category_jp || "Other") === tab.key);
                  return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 min-w-[108px] border-r border-[#cfd6df] px-3 py-3 text-center transition-colors last:border-r-0 ${
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

            {filteredItems.length > 0 && (
              <div>
                <div className="divide-y divide-[#efefef]">
                {filteredItems.map((item) => {
                  const photos = item.photos ?? [];
                  const currentPhotoIndex = menuPhotoIndexes[item.id] ?? 0;
                  const currentPhoto = photos[currentPhotoIndex] ?? null;
                  return (
                    <div key={item.id} className="px-4 py-5">
                      {currentPhoto ? (
                        <div
                          className="relative overflow-hidden rounded-[8px]"
                          style={{
                            aspectRatio: "210 / 297",
                          }}
                          onPointerEnter={revealMenuTabs}
                          onMouseMove={revealMenuTabs}
                        >
                          <button
                            type="button"
                            onClick={() => openLightbox(photos, currentPhotoIndex)}
                            className="block h-full w-full overflow-hidden rounded-[8px]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentPhoto.image_url}
                              alt={currentPhoto.label ?? ""}
                              className="h-full w-full object-cover"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => openLightbox(photos, currentPhotoIndex)}
                            aria-label={lang === "jp" ? "全画面表示" : "Fullscreen"}
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/42 text-black backdrop-blur-sm transition-colors hover:bg-black"
                          >
                            <Maximize2 size={20} />
                          </button>

                          {photos.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => shiftMenuPhoto(item.id, photos.length, -1)}
                                aria-label={lang === "jp" ? "前の画像" : "Previous image"}
                                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/42 text-black backdrop-blur-sm transition-colors hover:bg-black"
                              >
                                <ChevronLeft size={20}/>
                              </button>
                              <button
                                type="button"
                                onClick={() => shiftMenuPhoto(item.id, photos.length, 1)}
                                aria-label={lang === "jp" ? "次の画像" : "Next image"}
                                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/42 text-black backdrop-blur-sm transition-colors hover:bg-black"
                              >
                                <ChevronRight size={20} />
                              </button>
                              <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-black text-white/90 backdrop-blur-sm">
                                {currentPhotoIndex + 1} / {photos.length}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div
                          className="w-full rounded-[8px] bg-gradient-to-br from-stone-100 to-stone-200"
                          style={{
                            aspectRatio: "210 / 297",
                          }}
                        />
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

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-[24px] border-0 bg-white p-0 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:max-w-md" showCloseButton={false}>
          <div className="overflow-hidden rounded-[24px]">
            <div className="bg-[linear-gradient(135deg,#1f2937,#111827_55%,#0f172a)] px-5 pb-5 pt-6 text-white">
              <DialogHeader className="gap-2 pr-10">
                <DialogTitle className="text-[1.05rem] font-black tracking-[-0.04em] text-white">
                  {lang === "jp" ? "店舗情報" : "Business Info"}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-white/72">
                  {business.business_name}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4 px-5 py-5 text-[#1f2937]">
              {infoLoading ? (
                <div className="flex items-center gap-2 rounded-[18px] bg-[#f5f6f7] px-4 py-3 text-sm font-semibold text-[#475569]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{lang === "jp" ? "店舗情報を読み込み中..." : "Loading business info..."}</span>
                </div>
              ) : infoError ? (
                <div className="flex items-start gap-2 rounded-[18px] bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#be123c]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{infoError}</span>
                </div>
              ) : hasBusinessInfo ? (
                <>
                  {infoDescription && (
                    <section className="rounded-[20px] bg-[#f6f7f8] px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#64748b]">
                        {lang === "jp" ? "店舗説明" : "Description"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#111827]">
                        {infoDescription}
                      </p>
                    </section>
                  )}

                  {businessInfo?.seating_capacity != null && (
                    <section className="rounded-[20px] bg-[#f6f7f8] px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#64748b]">
                        {lang === "jp" ? "座席数" : "Seating Capacity"}
                      </p>
                      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#111827]">
                        {businessInfo.seating_capacity}
                        <span className="ml-1 text-sm font-bold text-[#64748b]">
                          {lang === "jp" ? "席" : "seats"}
                        </span>
                      </p>
                    </section>
                  )}
                </>
              ) : (
                <div className="rounded-[20px] bg-[#f6f7f8] px-4 py-4 text-sm font-semibold leading-6 text-[#475569]">
                  {lang === "jp"
                    ? "現在表示できる店舗情報はありません。"
                    : "No business info is available right now."}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
