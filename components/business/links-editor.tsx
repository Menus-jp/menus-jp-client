"use client";

import React, { useState } from "react";
import { ExternalLink, Link as LinkIcon, X as XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BookingLink, SocialLink } from "@/lib/types/business";

export type LinkState = { id: number | null; url: string; enabled: boolean };
export type BookingPlatformKey = BookingLink["platform"];
export type SocialPlatformKey = SocialLink["platform"];

interface PlatformDef<K extends string> {
  key: K;
  label: string;
  placeholder: string;
  tabLabel: string;
  tabIcon: React.ReactNode;
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-[18px] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const LineGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

const FacebookGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TikTokGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export const BOOKING_PLATFORMS: PlatformDef<BookingPlatformKey>[] = [
  {
    key: "hot_pepper_gourmet",
    label: "HOT PEPPER グルメ",
    placeholder: "https://www.hotpepper.jp/strJ000123456/",
    tabLabel: "Hot Pepper",
    tabIcon: (
      <Badge className="bg-[#dc8f92] text-white">
        <span className="text-[11px] font-black tracking-[0.18em]">HP</span>
      </Badge>
    ),
  },
  {
    key: "tabelog",
    label: "食べログ",
    placeholder: "https://tabelog.com/tokyo/A1300/",
    tabLabel: "Tabelog",
    tabIcon: (
      <Badge className="bg-[#f6a300] text-white">
        <span className="text-[14px] font-black leading-none">食べ</span>
      </Badge>
    ),
  },
  {
    key: "open_table",
    label: "OpenTable",
    placeholder: "https://opentable.com/...",
    tabLabel: "OpenTable",
    tabIcon: (
      <Badge className="bg-[#ea7a98] text-white">
        <span className="text-[28px] font-black leading-none">•</span>
      </Badge>
    ),
  },
];

export const ALL_SOCIAL_PLATFORMS: PlatformDef<SocialPlatformKey>[] = [
  {
    key: "line",
    label: "LINE",
    placeholder: "https://lin.ee/...",
    tabLabel: "LINE",
    tabIcon: (
      <Badge className="bg-[#6fd79d]">
        <LineGlyph />
      </Badge>
    ),
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    placeholder: "https://x.com/...",
    tabLabel: "X",
    tabIcon: (
      <Badge className="bg-black text-white">
        <XIcon className="h-8 w-8" />
      </Badge>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/...",
    tabLabel: "Facebook",
    tabIcon: (
      <Badge className="bg-[#95a9d7]">
        <FacebookGlyph />
      </Badge>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@...",
    tabLabel: "TikTok",
    tabIcon: (
      <Badge className="bg-[#7e7e7e]">
        <TikTokGlyph />
      </Badge>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/@...",
    tabLabel: "Instagram",
    tabIcon: (
      <Badge className="bg-gradient-to-br from-[#ffd26e] via-[#ea6fa8] to-[#8a80ff]">
        <InstagramGlyph />
      </Badge>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@...",
    tabLabel: "YouTube",
    tabIcon: (
      <Badge className="bg-[#ec6d6d] text-white">
        <span className="text-[15px] font-black uppercase">YT</span>
      </Badge>
    ),
  },
  {
    key: "custom",
    label: "Other",
    placeholder: "https://...",
    tabLabel: "Other",
    tabIcon: (
      <Badge className="bg-[#aa8ae8] text-white">
        <LinkIcon className="h-8 w-8" />
      </Badge>
    ),
  },
];

export function initBookingState(): Record<BookingPlatformKey, LinkState> {
  const state = {} as Record<BookingPlatformKey, LinkState>;
  for (const platform of BOOKING_PLATFORMS) {
    state[platform.key] = { id: null, url: "", enabled: false };
  }
  return state;
}

export function initSocialState(): Record<SocialPlatformKey, LinkState> {
  const state = {} as Record<SocialPlatformKey, LinkState>;
  for (const platform of ALL_SOCIAL_PLATFORMS) {
    state[platform.key] = { id: null, url: "", enabled: false };
  }
  return state;
}

function PlatformTabs<K extends string>({
  title,
  defs,
  state,
  disabled,
  onChange,
  onToggle,
}: {
  title: string;
  defs: PlatformDef<K>[];
  state: Record<K, LinkState>;
  disabled?: boolean;
  onChange: (key: K, url: string) => void;
  onToggle: (key: K, enabled: boolean) => void;
}) {
  const [activeKey, setActiveKey] = useState<K>(defs[0].key);
  const activeDef = defs.find((def) => def.key === activeKey) ?? defs[0];
  const activeState = state[activeDef.key];
  const hasUrl = activeState.url.trim() !== "";

  return (
    <section className="space-y-3">
      <h3 className="text-[2rem] font-black tracking-[-0.04em] text-black">
        {title}
      </h3>

      <div className="overflow-hidden rounded-[16px] border border-[#cfd6df] bg-white">
        <div className="overflow-x-auto border-b border-[#cfd6df] bg-[#dddddd]">
          <div
            className="grid min-w-max"
            style={{ gridTemplateColumns: `repeat(${defs.length}, minmax(96px, 1fr))` }}
          >
            {defs.map((def, index) => {
              const isActive = def.key === activeDef.key;
              return (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => setActiveKey(def.key)}
                  className={`flex h-[86px] items-center justify-center px-4 transition-colors ${
                    index < defs.length - 1 ? "border-r border-[#cfd6df]" : ""
                  } ${isActive ? "bg-white" : "bg-[#dddddd] hover:bg-[#e6e6e6]"}`}
                  aria-label={def.tabLabel}
                >
                  {def.tabIcon}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-7 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <Switch
              checked={activeState.enabled}
              onCheckedChange={(enabled) => onToggle(activeDef.key, enabled)}
              disabled={disabled}
              className="scale-125 data-[state=checked]:bg-emerald-600"
            />

            <div className="relative flex-1">
              <Input
                type="url"
                value={activeState.url}
                onChange={(event) => onChange(activeDef.key, event.target.value)}
                placeholder={activeDef.placeholder}
                disabled={disabled}
                className="h-[74px] rounded-[22px] border-[#d8dde5] bg-white pl-5 pr-14 text-base shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] placeholder:text-gray-300"
              />
              {hasUrl ? (
                <a
                  href={activeState.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#98a2b3] transition-colors hover:text-gray-700"
                >
                  <ExternalLink className="h-7 w-7" />
                </a>
              ) : (
                <ExternalLink className="pointer-events-none absolute right-5 top-1/2 h-7 w-7 -translate-y-1/2 text-[#98a2b3]" />
              )}
            </div>
          </div>

          <p className="mt-3 pl-16 text-sm font-medium text-gray-500 sm:pl-[4.5rem]">
            {activeDef.label}
          </p>
        </div>
      </div>
    </section>
  );
}

export function BusinessLinksEditor({
  booking,
  social,
  disabled,
  onBookingChange,
  onBookingToggle,
  onSocialChange,
  onSocialToggle,
}: {
  booking: Record<BookingPlatformKey, LinkState>;
  social: Record<SocialPlatformKey, LinkState>;
  disabled?: boolean;
  onBookingChange: (key: BookingPlatformKey, url: string) => void;
  onBookingToggle: (key: BookingPlatformKey, enabled: boolean) => void;
  onSocialChange: (key: SocialPlatformKey, url: string) => void;
  onSocialToggle: (key: SocialPlatformKey, enabled: boolean) => void;
}) {
  return (
    <div className="space-y-10">
      <PlatformTabs
        title="Booking Links"
        defs={BOOKING_PLATFORMS}
        state={booking}
        disabled={disabled}
        onChange={onBookingChange}
        onToggle={onBookingToggle}
      />
      <PlatformTabs
        title="SNS Links"
        defs={ALL_SOCIAL_PLATFORMS}
        state={social}
        disabled={disabled}
        onChange={onSocialChange}
        onToggle={onSocialToggle}
      />
    </div>
  );
}