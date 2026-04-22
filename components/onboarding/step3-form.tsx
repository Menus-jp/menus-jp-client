"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Loader2,
  ChevronRight,
  ExternalLink,
  Plus,
  Calendar,
  Share2,
  Link,
  X as XIcon,
} from "lucide-react";
import { BusinessProfile, BookingLink, SocialLink } from "@/lib/types/business";
import apiClient from "@/lib/api/auth";

interface Step3FormProps {
  business: BusinessProfile;
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  isNew?: boolean;
}

function PlatformIcon({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
    >
      {children}
    </div>
  );
}

const LineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

type BookingPlatformKey = BookingLink["platform"];
type SocialPlatformKey = SocialLink["platform"];

interface BookingPlatformDef {
  key: BookingPlatformKey;
  label: string;
  labelEn: string;
  placeholder: string;
  iconBg: string;
  icon: React.ReactNode;
}

interface SocialPlatformDef {
  key: SocialPlatformKey;
  label: string;
  placeholder: string;
  iconBg: string;
  icon: React.ReactNode;
}

const BOOKING_PLATFORMS: BookingPlatformDef[] = [
  {
    key: "tabelog",
    label: "食べログ",
    labelEn: "Tabelog",
    placeholder: "https://tabelog.com/tokyo/A1300/",
    iconBg: "bg-amber-500",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M11 2v7H4v2h7v11h2V11h7V9h-7V2z" />
      </svg>
    ),
  },
  {
    key: "hot_pepper_gourmet",
    label: "HOT PEPPER グルメ",
    labelEn: "Hot Pepper Gourmet",
    placeholder: "https://www.hotpepper.jp/strJ000123456/",
    iconBg: "bg-red-600",
    icon: (
      <span className="text-white text-xs font-black tracking-tight">HP</span>
    ),
  },
  {
    key: "line_reservation",
    label: "LINE で予約",
    labelEn: "LINE",
    placeholder: "https://lin.ee/abc123",
    iconBg: "bg-green-500",
    icon: <LineIcon />,
  },
  {
    key: "open_table",
    label: "OpenTable",
    labelEn: "",
    placeholder: "https://opentable.com/...",
    iconBg: "bg-white border border-gray-200",
    icon: (
      <span className="text-red-600 text-2xl font-black leading-none">•</span>
    ),
  },
];

const SOCIAL_PLATFORMS_LEFT: SocialPlatformDef[] = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/@...",
    iconBg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
    icon: <InstagramIcon />,
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/...",
    iconBg: "bg-blue-600",
    icon: <FacebookIcon />,
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    placeholder: "https://x.com/...",
    iconBg: "bg-gray-950",
    icon: <XIcon className="w-4 h-4 text-white" />,
  },
  {
    key: "line",
    label: "LINE（公式アカウント）",
    placeholder: "https://lin.ee/...",
    iconBg: "bg-green-500",
    icon: <LineIcon />,
  },
];

const SOCIAL_PLATFORMS_RIGHT: SocialPlatformDef[] = [
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@...",
    iconBg: "bg-red-600",
    icon: <YouTubeIcon />,
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@...",
    iconBg: "bg-gray-950",
    icon: <TikTokIcon />,
  },
  {
    key: "custom",
    label: "その他 / Other",
    placeholder: "https://...",
    iconBg: "bg-gray-400",
    icon: <Link className="w-4 h-4 text-white" />,
  },
];

const ALL_SOCIAL_PLATFORMS = [
  ...SOCIAL_PLATFORMS_LEFT,
  ...SOCIAL_PLATFORMS_RIGHT,
];

type LinkState = { id: number | null; url: string; enabled: boolean };

function initBookingState(): Record<BookingPlatformKey, LinkState> {
  const s = {} as Record<BookingPlatformKey, LinkState>;
  for (const p of BOOKING_PLATFORMS)
    s[p.key] = { id: null, url: "", enabled: false };
  return s;
}

function initSocialState(): Record<SocialPlatformKey, LinkState> {
  const s = {} as Record<SocialPlatformKey, LinkState>;
  for (const p of ALL_SOCIAL_PLATFORMS)
    s[p.key] = { id: null, url: "", enabled: false };
  return s;
}

function BookingRow({
  def,
  state,
  onChange,
  onToggle,
  disabled,
}: {
  def: BookingPlatformDef;
  state: LinkState;
  onChange: (url: string) => void;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  const hasUrl = state.url.trim() !== "";
  return (
    <div className="flex items-center gap-3 py-3">
      <Switch
        checked={state.enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-emerald-500"
      />
      <PlatformIcon bg={def.iconBg}>{def.icon}</PlatformIcon>
      <div className="w-36 shrink-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          {def.label}
        </p>
        {def.labelEn && (
          <p className="text-xs text-gray-400 leading-tight mt-0.5">
            {def.labelEn}
          </p>
        )}
      </div>
      <div className="flex-1 relative">
        <Input
          type="url"
          value={state.url}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          disabled={disabled}
          className="pr-9 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm placeholder:text-gray-300"
        />
        {hasUrl ? (
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700"
            tabIndex={-1}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <ExternalLink className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-300 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

function SocialRow({
  def,
  state,
  onChange,
  onToggle,
  disabled,
}: {
  def: SocialPlatformDef;
  state: LinkState;
  onChange: (url: string) => void;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  const hasUrl = state.url.trim() !== "";
  return (
    <div className="flex items-center gap-2.5">
      <Switch
        checked={state.enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-emerald-500"
      />
      <PlatformIcon bg={def.iconBg}>{def.icon}</PlatformIcon>
      <div className="w-28 shrink-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight">
          {def.label}
        </p>
      </div>
      <div className="flex-1 relative">
        <Input
          type="url"
          value={state.url}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          disabled={disabled}
          className="pr-8 h-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-xs placeholder:text-gray-300"
        />
        {hasUrl ? (
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
            tabIndex={-1}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <ExternalLink className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

export function Step3Form({
  business,
  onSubmit,
  loading,
  error,
  isNew,
}: Step3FormProps) {
  const [booking, setBooking] =
    useState<Record<BookingPlatformKey, LinkState>>(initBookingState);
  const [social, setSocial] =
    useState<Record<SocialPlatformKey, LinkState>>(initSocialState);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing links on mount
  useEffect(() => {
    if (isNew) return;
    Promise.all([
      apiClient.get(`/booking-links/?business=${business.id}`),
      apiClient.get(`/social-links/?business=${business.id}`),
    ])
      .then(([bRes, sRes]) => {
        const bLinks: BookingLink[] = bRes.data.results ?? bRes.data;
        const sLinks: SocialLink[] = sRes.data.results ?? sRes.data;

        setBooking((prev) => {
          const next = { ...prev };
          for (const link of bLinks) {
            if (link.platform in next) {
              next[link.platform] = {
                id: link.id,
                url: link.url,
                enabled: true,
              };
            }
          }
          return next;
        });

        setSocial((prev) => {
          const next = { ...prev };
          for (const link of sLinks) {
            if (link.platform in next) {
              next[link.platform] = {
                id: link.id,
                url: link.url,
                enabled: true,
              };
            }
          }
          return next;
        });
      })
      .catch(() => {
        // non-fatal
      });
  }, [business.id]);

  const updateBooking = (key: BookingPlatformKey, patch: Partial<LinkState>) =>
    setBooking((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const updateSocial = (key: SocialPlatformKey, patch: Partial<LinkState>) =>
    setSocial((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleBookingUrlChange = (key: BookingPlatformKey, url: string) =>
    updateBooking(key, { url });

  const handleSocialUrlChange = (key: SocialPlatformKey, url: string) =>
    updateSocial(key, { url });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Client-side validation: enabled platforms must have a URL
    const missingBooking = BOOKING_PLATFORMS.filter(
      (def) => booking[def.key].enabled && !booking[def.key].url.trim(),
    ).map((def) => def.label);
    const missingSocial = ALL_SOCIAL_PLATFORMS.filter(
      (def) => social[def.key].enabled && !social[def.key].url.trim(),
    ).map((def) => def.label);
    const missing = [...missingBooking, ...missingSocial];
    if (missing.length > 0) {
      setSaveError(
        `URLを入力してください / Please enter a URL for: ${missing.join(", ")}`,
      );
      return;
    }

    setSaving(true);

    try {
      const ops: Promise<unknown>[] = [];

      // Sync booking links
      for (const def of BOOKING_PLATFORMS) {
        const s = booking[def.key];
        const hasUrl = s.url.trim() !== "";
        if (hasUrl && s.enabled) {
          if (s.id) {
            ops.push(
              apiClient.patch(`/booking-links/${s.id}/`, { url: s.url }),
            );
          } else {
            ops.push(
              apiClient
                .post("/booking-links/", {
                  business: business.id,
                  platform: def.key,
                  url: s.url,
                  is_primary: false,
                  display_order: BOOKING_PLATFORMS.indexOf(def),
                })
                .then((res) => updateBooking(def.key, { id: res.data.id })),
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/booking-links/${s.id}/`)
              .then(() => updateBooking(def.key, { id: null })),
          );
        }
      }

      // Sync social links
      for (const def of ALL_SOCIAL_PLATFORMS) {
        const s = social[def.key];
        const hasUrl = s.url.trim() !== "";
        if (hasUrl && s.enabled) {
          if (s.id) {
            ops.push(apiClient.patch(`/social-links/${s.id}/`, { url: s.url }));
          } else {
            ops.push(
              apiClient
                .post("/social-links/", {
                  business: business.id,
                  platform: def.key,
                  url: s.url,
                  display_order: ALL_SOCIAL_PLATFORMS.indexOf(def),
                })
                .then((res) => updateSocial(def.key, { id: res.data.id })),
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/social-links/${s.id}/`)
              .then(() => updateSocial(def.key, { id: null })),
          );
        }
      }

      await Promise.all(ops);
    } catch (err: any) {
      setSaveError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "リンクの保存に失敗しました",
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    await onSubmit({ onboarding_step: 3 });
  };

  const isLoading = loading || saving;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || saveError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || saveError}</AlertDescription>
        </Alert>
      )}

      {/* ── A. Booking Links ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="divide-y divide-gray-50">
          {BOOKING_PLATFORMS.map((def) => (
            <BookingRow
              key={def.key}
              def={def}
              state={booking[def.key]}
              onChange={(url) => handleBookingUrlChange(def.key, url)}
              onToggle={(enabled) => updateBooking(def.key, { enabled })}
              disabled={isLoading}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={isLoading}
          className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>その他の予約サービスを追加 / Add other booking service</span>
        </button>
      </div>

      {/* ── B. Social Links ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Share2 className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">
              B. SNSリンク / Social Links
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              SNSリンクを追加 / Add social links
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
          <div className="space-y-3">
            {SOCIAL_PLATFORMS_LEFT.map((def) => (
              <SocialRow
                key={def.key}
                def={def}
                state={social[def.key]}
                onChange={(url) => handleSocialUrlChange(def.key, url)}
                onToggle={(enabled) => updateSocial(def.key, { enabled })}
                disabled={isLoading}
              />
            ))}
          </div>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS_RIGHT.map((def) => (
              <SocialRow
                key={def.key}
                def={def}
                state={social[def.key]}
                onChange={(url) => handleSocialUrlChange(def.key, url)}
                onToggle={(enabled) => updateSocial(def.key, { enabled })}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-snug">
            有効にしたリンクは、公開ページの「SNS・フォローはこちら」に表示されます
            <br />
            <span className="text-blue-400">
              Enabled links will appear in the &quot;FOLLOW US&quot; section on
              your public page.
            </span>
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-xl font-semibold text-base flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              次へ / Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
