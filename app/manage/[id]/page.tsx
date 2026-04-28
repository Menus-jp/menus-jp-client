"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { isoToDatetimeLocalInput, timeToISODatetime } from "@/lib/utils";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBusinessApi } from "@/lib/hooks/useBusinessApi";
import apiClient from "@/lib/api/auth";
import{
  ALL_SOCIAL_PLATFORMS,
  BOOKING_PLATFORMS,
  ORDER_PLATFORMS,
  BusinessLinksEditor,
  BookingPlatformKey,
  OrderPlatformKey,
  initBookingState,
  initOrderState,
  initSocialState,
  LinkState,
  SocialPlatformKey,
} from "@/components/business/links-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Cloud,
  X,
  Plus,
  Trash2,
  ImagePlus,
  Clock,
  Tag,
  Percent,
  Image as ImageIcon,
  UtensilsCrossed,
} from "lucide-react";
import {
  BusinessProfile,
  BusinessDetail,
  ClosedDay,
  MenuItemHours,
  OrderLink,
} from "@/lib/types/business";
import { Switch } from "@/components/ui/switch";

const DAYS_OF_WEEK = [
  { key: "Monday", display: "月", short: "Mon", api: "monday" as const },
  { key: "Tuesday", display: "火", short: "Tue", api: "tuesday" as const },
  { key: "Wednesday", display: "水", short: "Wed", api: "wednesday" as const },
  { key: "Thursday", display: "木", short: "Thu", api: "thursday" as const },
  { key: "Friday", display: "金", short: "Fri", api: "friday" as const },
  { key: "Saturday", display: "土", short: "Sat", api: "saturday" as const },
  { key: "Sunday", display: "日", short: "Sun", api: "sunday" as const },
];

const CATEGORIES = [
  { key: "restaurant", label: "レストラン", icon: "🍽️" },
  { key: "hair_salon", label: "美容院", icon: "💇" },
  { key: "barbershop", label: "バーバー", icon: "💈" },
  { key: "spa", label: "スパ", icon: "🧖" },
  { key: "gym", label: "ジム", icon: "🏋️" },
];

type HourEntry = {
  id?: number;
  open: string;
  close: string;
  lastOrder: string;
  open2?: string;
  close2?: string;
  lastOrder2?: string;
  hasSecondShift?: boolean;
  closed: boolean;
};
type PhotoEntry = { id: number; url: string; is_hero: boolean };

function formatTimeWithPeriod(time: string): string {
  const hour = Number(time.split(":")[0] || 0);
  return `${time} ${hour < 12 ? "AM" : "PM"}`;
}

function BusinessTimeSpinner({
  value,
  onChange,
  disabled,
  className = "w-[172px]",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const adjust = (delta: number) => {
    const [h, m] = value.split(":").map(Number);
    const next = Math.max(0, Math.min(1439, h * 60 + (m || 0) + delta));
    onChange(`${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`);
  };

  const commitDraft = (v: string) => {
    const match = v.match(/^(\d{1,2}):?(\d{2})$/);
    if (match) {
      const h = Math.min(23, Number(match[1]));
      const m = Math.min(59, Number(match[2]));
      onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    setEditing(false);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      adjust(e.deltaY > 0 ? -30 : 30);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [value]);

  return (
    <div
      ref={ref}
      className={`flex items-center rounded-[18px] border border-[#cfd6df] bg-white select-none overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] ${className}`}
    >
      {editing ? (
        <input
          autoFocus
          type="text"
          defaultValue={value}
          onBlur={(e) => commitDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitDraft((e.target as HTMLInputElement).value);
            if (e.key === "Escape") setEditing(false);
            if (e.key === "ArrowUp") { e.preventDefault(); adjust(30); }
            if (e.key === "ArrowDown") { e.preventDefault(); adjust(-30); }
          }}
          className="flex-1 px-5 py-3 text-center text-[15px] font-medium text-gray-900 leading-none outline-none w-full"
          disabled={disabled}
        />
      ) : (
        <span
          className="flex-1 px-5 py-3 text-center text-[15px] font-medium text-gray-900 leading-none cursor-text"
          onClick={() => setEditing(true)}
        >
          {formatTimeWithPeriod(value)}
        </span>
      )}
      <div className="flex flex-col border-l border-gray-200 shrink-0">
        <button type="button" onClick={() => adjust(30)} disabled={disabled} className="flex items-center justify-center px-2 py-1.5 hover:bg-gray-50 border-b border-gray-200">
          <ChevronUp className="h-3 w-3 text-gray-400" />
        </button>
        <button type="button" onClick={() => adjust(-30)} disabled={disabled} className="flex items-center justify-center px-2 py-1.5 hover:bg-gray-50">
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

interface HoursDraft {
  id?: number;
  day_of_week: DayOfWeek;
  is_closed: boolean;
  closed_reason: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
}

const MENU_ITEM_DAYS: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const MENU_DAY_LABELS: Record<DayOfWeek, { jp: string; en: string }> = {
  monday:    { jp: "月", en: "Mon" },
  tuesday:   { jp: "火", en: "Tue" },
  wednesday: { jp: "水", en: "Wed" },
  thursday:  { jp: "木", en: "Thu" },
  friday:    { jp: "金", en: "Fri" },
  saturday:  { jp: "土", en: "Sat" },
  sunday:    { jp: "日", en: "Sun" },
};

function defaultMenuItemHours(): HoursDraft[] {
  return MENU_ITEM_DAYS.map((day) => ({
    day_of_week: day,
    is_closed: false,
    closed_reason: "",
    start_time: "11:00",
    end_time: "21:00",
  }));
}

function mergeHoursWithDefaults(serverHours: MenuItemHours[]): HoursDraft[] {
  const byDay = new Map(serverHours.map((h) => [h.day_of_week, h]));
  return MENU_ITEM_DAYS.map((day) => {
    const h = byDay.get(day);
    if (h) {
      return {
        id: h.id,
        day_of_week: day,
        is_closed: h.is_closed,
        closed_reason: h.closed_reason ?? "",
        start_time: h.start_time ? h.start_time.slice(0, 5) : "11:00",
        end_time: h.end_time ? h.end_time.slice(0, 5) : "21:00",
      };
    }
    return {
      day_of_week: day,
      is_closed: false,
      closed_reason: "",
      start_time: "11:00",
      end_time: "21:00",
    };
  });
}

interface MenuItemDraft {
  id?: number;
  category_jp: string;
  category_en: string;
  discount_percentage: string;
  discount_start_time: string; // YYYY-MM-DDTHH:MM
  discount_end_time: string;   // YYYY-MM-DDTHH:MM
  savedPhotosJp: { id: number; url: string; label?: string }[];
  pendingFilesJp: File[];
  pendingLabelsJp: string[];
  savedPhotosEn: { id: number; url: string; label?: string }[];
  pendingFilesEn: File[];
  pendingLabelsEn: string[];
  hours: HoursDraft[];
  isOpen: boolean;
  showHours: boolean;
}

function emptyMenuItem(): MenuItemDraft {
  return {
    category_jp: "",
    category_en: "",
    discount_percentage: "",
    discount_start_time: "",
    discount_end_time: "",
    savedPhotosJp: [],
    pendingFilesJp: [],
    pendingLabelsJp: [],
    savedPhotosEn: [],
    pendingFilesEn: [],
    pendingLabelsEn: [],
    hours: defaultMenuItemHours(),
    isOpen: true,
    showHours: false,
  };
}

function PhotoThumb({
  src,
  label,
  pending,
  onRemove,
  disabled,
}: {
  src: string;
  label?: string;
  pending?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative group w-20 h-20 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label || ""}
        className={`w-20 h-20 object-cover rounded-xl border ${
          pending
            ? "border-dashed border-blue-300 opacity-70"
            : "border-gray-200"
        }`}
      />
      {pending && (
        <span className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1 rounded leading-tight font-bold">
          NEW
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Trash2 className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
}

function HoursEditor({
  hours,
  disabled,
  onChange,
}: {
  hours: HoursDraft[];
  disabled: boolean;
  onChange: (hours: HoursDraft[]) => void;
}) {
  const updateHour = (idx: number, patch: Partial<HoursDraft>) => {
    onChange(hours.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  };

  return (
    <div className="divide-y divide-gray-50">
      {hours.map((h, idx) => {
        const dayLabel = MENU_DAY_LABELS[h.day_of_week];
        const isSat = h.day_of_week === "saturday";
        const isSun = h.day_of_week === "sunday";
        return (
          <div
            key={h.day_of_week}
            className={`flex items-center gap-3 px-4 py-2.5 ${
              h.is_closed ? "bg-gray-50/60" : "bg-white"
            }`}
          >
            <div className="w-10 shrink-0 text-center">
              <span
                className={`text-sm font-bold leading-none block ${
                  isSat ? "text-blue-600" : isSun ? "text-red-500" : "text-gray-700"
                }`}
              >
                {dayLabel.jp}
              </span>
              <span className="text-[10px] text-gray-400 leading-none mt-0.5 block">
                {dayLabel.en}
              </span>
            </div>

            <Switch
              checked={!h.is_closed}
              onCheckedChange={(open) => updateHour(idx, { is_closed: !open })}
              disabled={disabled}
              className="data-[state=checked]:bg-emerald-500 shrink-0"
            />

            {h.is_closed ? (
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-gray-400 shrink-0">定休日</span>
                <Input
                  type="text"
                  placeholder="理由 (任意) e.g. 祝日"
                  value={h.closed_reason}
                  onChange={(e) => updateHour(idx, { closed_reason: e.target.value })}
                  disabled={disabled}
                  className="flex-1 h-7 text-xs border-dashed border-gray-200 bg-transparent placeholder:text-gray-300"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="time"
                  value={h.start_time}
                  onChange={(e) => updateHour(idx, { start_time: e.target.value })}
                  disabled={disabled}
                  className="w-[6.5rem] h-7 text-xs text-center tabular-nums"
                />
                <span className="text-gray-300 text-sm select-none">–</span>
                <Input
                  type="time"
                  value={h.end_time}
                  onChange={(e) => updateHour(idx, { end_time: e.target.value })}
                  disabled={disabled}
                  className="w-[6.5rem] h-7 text-xs text-center tabular-nums"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MenuItemCard({
  item,
  index,
  disabled,
  onUpdate,
  onRemove,
  onRemoveSavedPhoto,
}: {
  item: MenuItemDraft;
  index: number;
  disabled: boolean;
  onUpdate: (patch: Partial<MenuItemDraft>) => void;
  onRemove: () => void;
  onRemoveSavedPhoto: (id: number, lang: "jp" | "en") => void;
}) {
  const fileInputRefJp = useRef<HTMLInputElement>(null);
  const fileInputRefEn = useRef<HTMLInputElement>(null);
  const totalPhotosJp = item.savedPhotosJp.length + item.pendingFilesJp.length;
  const totalPhotosEn = item.savedPhotosEn.length + item.pendingFilesEn.length;
  const totalPhotos   = totalPhotosJp + totalPhotosEn;
  const openDays = item.hours.filter((h) => !h.is_closed).length;
  const title = item.category_jp || item.category_en || `メニュー ${index + 1}`;
  const hasDiscount = !!item.discount_percentage;

  const handleFilePickJp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const toAdd = files.slice(0, 20 - totalPhotosJp);
    onUpdate({
      pendingFilesJp: [...item.pendingFilesJp, ...toAdd],
      pendingLabelsJp: [...item.pendingLabelsJp, ...toAdd.map(() => "")],
    });
    e.target.value = "";
  };

  const handleFilePickEn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const toAdd = files.slice(0, 20 - totalPhotosEn);
    onUpdate({
      pendingFilesEn: [...item.pendingFilesEn, ...toAdd],
      pendingLabelsEn: [...item.pendingLabelsEn, ...toAdd.map(() => "")],
    });
    e.target.value = "";
  };

  const removePendingJp = (idx: number) => {
    onUpdate({
      pendingFilesJp: item.pendingFilesJp.filter((_, i) => i !== idx),
      pendingLabelsJp: item.pendingLabelsJp.filter((_, i) => i !== idx),
    });
  };

  const removePendingEn = (idx: number) => {
    onUpdate({
      pendingFilesEn: item.pendingFilesEn.filter((_, i) => i !== idx),
      pendingLabelsEn: item.pendingLabelsEn.filter((_, i) => i !== idx),
    });
  };

  const updatePendingLabelJp = (idx: number, label: string) => {
    const labels = [...item.pendingLabelsJp];
    labels[idx] = label;
    onUpdate({ pendingLabelsJp: labels });
  };

  const updatePendingLabelEn = (idx: number, label: string) => {
    const labels = [...item.pendingLabelsEn];
    labels[idx] = label;
    onUpdate({ pendingLabelsEn: labels });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* ── Card Header ── */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => onUpdate({ isOpen: !item.isOpen })}
      >
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="h-4 w-4 text-orange-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">{title}</span>
            {item.category_en && item.category_jp && (
              <span className="text-xs text-gray-400 truncate hidden sm:inline">
                / {item.category_en}
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center gap-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                <Percent className="h-2.5 w-2.5" />
                {item.discount_percentage}% OFF
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {openDays}/7 days
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={disabled}
            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {item.isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
          )}
        </div>
      </div>

      {/* ── Card Body ── */}
      {item.isOpen && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">

          {/* Category + Photos */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-4">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Category
              </span>
            </div>

            {/* ── JP block ── */}
            <div className="space-y-2">
              <Label className="text-[11px] text-gray-400 block">カテゴリ名 (JP)</Label>
              <Input
                placeholder="例: ランチ / 寿司"
                value={item.category_jp}
                onChange={(e) => onUpdate({ category_jp: e.target.value })}
                disabled={disabled}
                className="h-9 text-sm rounded-lg"
              />
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ImageIcon className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-500">メニュー写真 (JP)</span>
                  <span className="text-[11px] text-gray-400 ml-auto">{totalPhotosJp}/20</span>
                </div>
                {totalPhotosJp > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.savedPhotosJp.map((p) => (
                      <PhotoThumb
                        key={p.id}
                        src={p.url}
                        label={p.label}
                        onRemove={() => onRemoveSavedPhoto(p.id, "jp")}
                        disabled={disabled}
                      />
                    ))}
                    {item.pendingFilesJp.map((file, pidx) => (
                      <div key={`pjp-${pidx}`} className="flex flex-col gap-1">
                        <PhotoThumb
                          src={URL.createObjectURL(file)}
                          pending
                          onRemove={() => removePendingJp(pidx)}
                          disabled={disabled}
                        />
                        <Input
                          placeholder="ラベル"
                          value={item.pendingLabelsJp[pidx] ?? ""}
                          onChange={(e) => updatePendingLabelJp(pidx, e.target.value)}
                          disabled={disabled}
                          className="text-[11px] h-6 w-20 px-1.5 rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {totalPhotosJp < 20 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-lg h-7 bg-white text-[11px]"
                    onClick={() => fileInputRefJp.current?.click()}
                    disabled={disabled}
                  >
                    <ImagePlus className="h-3 w-3" />
                    写真を追加
                  </Button>
                )}
                <input
                  ref={fileInputRefJp}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilePickJp}
                />
              </div>
            </div>

            <div className="my-4 border-t border-gray-100" />

            {/* ── EN block ── */}
            <div className="space-y-2">
              <Label className="text-[11px] text-gray-400 block">Category Name (EN)</Label>
              <Input
                placeholder="e.g. Lunch / Sushi"
                value={item.category_en}
                onChange={(e) => onUpdate({ category_en: e.target.value })}
                disabled={disabled}
                className="h-9 text-sm rounded-lg"
              />
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ImageIcon className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-500">Menu Photos (EN)</span>
                  <span className="text-[11px] text-gray-400 ml-auto">{totalPhotosEn}/20</span>
                </div>
                {totalPhotosEn > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.savedPhotosEn.map((p) => (
                      <PhotoThumb
                        key={p.id}
                        src={p.url}
                        label={p.label}
                        onRemove={() => onRemoveSavedPhoto(p.id, "en")}
                        disabled={disabled}
                      />
                    ))}
                    {item.pendingFilesEn.map((file, pidx) => (
                      <div key={`pen-${pidx}`} className="flex flex-col gap-1">
                        <PhotoThumb
                          src={URL.createObjectURL(file)}
                          pending
                          onRemove={() => removePendingEn(pidx)}
                          disabled={disabled}
                        />
                        <Input
                          placeholder="label"
                          value={item.pendingLabelsEn[pidx] ?? ""}
                          onChange={(e) => updatePendingLabelEn(pidx, e.target.value)}
                          disabled={disabled}
                          className="text-[11px] h-6 w-20 px-1.5 rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {totalPhotosEn < 20 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-lg h-7 bg-white text-[11px]"
                    onClick={() => fileInputRefEn.current?.click()}
                    disabled={disabled}
                  >
                    <ImagePlus className="h-3 w-3" />
                    Add Photo
                  </Button>
                )}
                <input
                  ref={fileInputRefEn}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilePickEn}
                />
              </div>
            </div>
          </div>

          {/* Discount */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Percent className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Discount
              </span>
              <span className="text-[11px] text-gray-400 ml-0.5">(任意 / optional)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-gray-400 mb-1.5 block">割引率 (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="10.00"
                  value={item.discount_percentage}
                  onChange={(e) => onUpdate({ discount_percentage: e.target.value })}
                  disabled={disabled}
                  className="h-9 text-sm rounded-lg"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-400 mb-1.5 block">開始日時</Label>
                <Input
                  type="datetime-local"
                  value={item.discount_start_time}
                  onChange={(e) => onUpdate({ discount_start_time: e.target.value })}
                  disabled={disabled}
                  className="h-9 text-sm rounded-lg tabular-nums"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-400 mb-1.5 block">終了日時</Label>
                <Input
                  type="datetime-local"
                  value={item.discount_end_time}
                  onChange={(e) => onUpdate({ discount_end_time: e.target.value })}
                  disabled={disabled}
                  className="h-9 text-sm rounded-lg tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => onUpdate({ showHours: !item.showHours })}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Available Hours
                </span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ml-0.5 ${
                    openDays === 7
                      ? "bg-emerald-100 text-emerald-600"
                      : openDays === 0
                      ? "bg-red-100 text-red-500"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {openDays}/7 open
                </span>
              </div>
              {item.showHours ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {item.showHours && (
              <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-[11px] text-gray-500 font-medium mr-1">Quick set:</span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onUpdate({ hours: item.hours.map((h) => ({ ...h, is_closed: false })) })
                    }
                    className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold transition-colors disabled:opacity-50"
                  >
                    全日営業 All open
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onUpdate({ hours: item.hours.map((h) => ({ ...h, is_closed: true })) })
                    }
                    className="text-[11px] px-2 py-0.5 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50"
                  >
                    全日定休 All closed
                  </button>
                </div>

                <HoursEditor
                  hours={item.hours}
                  disabled={disabled}
                  onChange={(hours) => onUpdate({ hours })}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function toTimeInput(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}

function toApiTime(t: string): string {
  if (!t) return "00:00:00";
  const [h, m] = t.split(":").map(Number);
  return `${String(Math.min(23, h || 0)).padStart(2, "0")}:${String(Math.min(59, m || 0)).padStart(2, "0")}:00`;
}

function defaultHours(): Record<string, HourEntry> {
  const init: Record<string, HourEntry> = {};
  DAYS_OF_WEEK.forEach((d) => {
    init[d.key] = {
      open: "11:00",
      close: "23:00",
      lastOrder: "22:30",
      hasSecondShift: true,
      closed: false,
    };
  });
  return init;
}

function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}

function buildMapSrc(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function BusinessDetailContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = parseInt(params.id as string);
  const {
    getBusinessById,
    updateBusiness,
    bulkCreateBusinessHours,
    bulkUpdateBusinessHours,
    bulkCreateClosedDays,
    deleteClosedDay,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadMenuItemPhoto,
    deleteMenuItemPhoto,
    bulkCreateMenuItemHours,
    bulkUpdateMenuItemHours,
  } = useBusinessApi();

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({});
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hours, setHours] = useState<Record<string, HourEntry>>(defaultHours);
  const [activeHoursDay, setActiveHoursDay] = useState<string>(DAYS_OF_WEEK[0].key);
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [closedDayRecords, setClosedDayRecords] = useState<ClosedDay[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  // Menu state (restaurant only)
  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([]);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  // Booking, order & social link state
  const [booking, setBooking] = useState<Record<BookingPlatformKey, LinkState>>(initBookingState);
  const [order, setOrder] = useState<Record<OrderPlatformKey, LinkState>>(initOrderState);
  const [social, setSocial] = useState<Record<SocialPlatformKey, LinkState>>(initSocialState);
  const [linksError, setLinksError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        // Single call — response embeds hours, closed_days, photos
        const data = (await getBusinessById(businessId)) as BusinessDetail;
        setBusiness(data);
        setFormData({
          business_name: data.business_name,
          address: data.address,
          phone_number: data.phone_number,
          website: data.website,
        });

        // Map hours — delete stale single-char day_of_week entries, then map valid ones
        const validDayKeys = new Set(DAYS_OF_WEEK.map((d) => d.api));
        const invalidHours = (data.hours ?? []).filter(
          (h) => !validDayKeys.has(h.day_of_week as any),
        );
        await Promise.all(
          invalidHours.map((h) =>
            apiClient.delete(`/business-hours/${h.id}/`).catch(() => {}),
          ),
        );
        const mappedHours = defaultHours();
        (data.hours ?? []).forEach((h) => {
          if (!validDayKeys.has(h.day_of_week as any)) return; // skip "m", "f", etc.
          const day = DAYS_OF_WEEK.find((d) => d.api === h.day_of_week);
          if (!day) return;
          mappedHours[day.key] = {
            id: h.id,
            open: toTimeInput(h.opening_time) || "11:00",
            close: toTimeInput(h.closing_time) || "23:00",
            lastOrder: toTimeInput(h.last_order_time) || "22:30",
            open2: h.opening_time_2 ? toTimeInput(h.opening_time_2) : undefined,
            close2: h.closing_time_2 ? toTimeInput(h.closing_time_2) : undefined,
            lastOrder2: h.last_order_time_2 ? toTimeInput(h.last_order_time_2) : undefined,
            hasSecondShift: !!(h.opening_time_2 && h.closing_time_2),
            closed: h.is_closed,
          };
        });
        setHours(mappedHours);

        // Map closed days
        const closedRecords = data.closed_days ?? [];
        setClosedDayRecords(closedRecords);
        const closedKeys = closedRecords
          .map((cd) => DAYS_OF_WEEK.find((d) => d.api === cd.day_of_week)?.key)
          .filter(Boolean) as string[];
        setClosedDays(closedKeys);

        // Map photos and extract hero image
        const allPhotos = (data.photos ?? []).map((p) => ({
          id: p.id,
          url: p.image_url || p.image,
          is_hero: p.is_hero,
        }));
        setPhotos(allPhotos);
        // Prefer hero_image field from business profile, fallback to photo with is_hero
        if (data.hero_image) {
          console.log("Using hero_image from business profile:", data.hero_image);
          setHeroImage(data.hero_image);
        } else {
          const hero = allPhotos.find((p) => p.is_hero);
          setHeroImage(hero ? hero.url : null);
        }

        // Load location coords
        if (data.latitude != null && data.longitude != null) {
          setLatitude(String(data.latitude));
          setLongitude(String(data.longitude));
          setMapsUrl(
            data.maps_url ||
              `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
          );
        } else if (data.maps_url) {
          setMapsUrl(data.maps_url);
          const coords = parseGoogleMapsUrl(data.maps_url);
          if (coords) {
            setLatitude(String(coords.lat));
            setLongitude(String(coords.lng));
          }
        }

        // Map menu items (restaurant only)
        const existingItems = data.menu_items ?? [];
        if (existingItems.length > 0) {
          setMenuItems(
            existingItems.map((item) => ({
              id: item.id,
              category_jp: item.category_jp ?? "",
              category_en: item.category_en ?? "",
              discount_percentage: item.discount_percentage ?? "",
              discount_start_time: isoToDatetimeLocalInput(item.discount_start_time),
              discount_end_time: isoToDatetimeLocalInput(item.discount_end_time),
              savedPhotosJp: (item.photos ?? [])
                .filter((p) => !(p.label ?? "").startsWith("[en]"))
                .map((p) => ({ id: p.id, url: p.image_url || p.image, label: p.label })),
              savedPhotosEn: (item.photos ?? [])
                .filter((p) => (p.label ?? "").startsWith("[en]"))
                .map((p) => ({ id: p.id, url: p.image_url || p.image, label: p.label })),
              pendingFilesJp: [],
              pendingLabelsJp: [],
              pendingFilesEn: [],
              pendingLabelsEn: [],
              hours: mergeHoursWithDefaults(item.hours ?? []),
              isOpen: false,
              showHours: false,
            })),
          );
        } else if (data.category === "restaurant") {
          setMenuItems([emptyMenuItem()]);
        }

        // Map booking, order & social links from embedded response
        const bLinks = data.booking_links ?? [];
        const oLinks = data.order_links ?? [];
        const sLinks = data.social_links ?? [];
        if (bLinks.length > 0) {
          setBooking((prev) => {
            const next = { ...prev };
            for (const link of bLinks) {
              if (link.platform in next)
                next[link.platform] = {
                  id: link.id,
                  url: link.url,
                  enabled: true,
                };
            }
            return next;
          });
        }
        if (oLinks.length > 0) {
          setOrder((prev) => {
            const next = { ...prev };
            for (const link of oLinks) {
              if (link.platform in next)
                next[link.platform] = {
                  id: link.id,
                  url: link.url,
                  enabled: true,
                };
            }
            return next;
          });
        }
        if (sLinks.length > 0) {
          setSocial((prev) => {
            const next = { ...prev };
            for (const link of sLinks) {
              if (link.platform in next)
                next[link.platform] = {
                  id: link.id,
                  url: link.url,
                  enabled: true,
                };
            }
            return next;
          });
        }
      } catch {
        setFetchError("データの読み込みに失敗しました");
      } finally {
        setFetchLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (
    day: string,
    field: keyof HourEntry,
    value: string | boolean,
  ) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSecondShiftToggle = (day: string) => {
    setHours((prev) => {
      const prevDay = prev[day];
      if (prevDay.hasSecondShift) {
        // Remove second shift fields
        const { open2, close2, lastOrder2, ...rest } = prevDay;
        return { ...prev, [day]: { ...rest, hasSecondShift: false } };
      } else {
        return {
          ...prev,
          [day]: {
            ...prevDay,
            hasSecondShift: true,
            open2: "17:00",
            close2: "22:00",
            lastOrder2: "21:30",
          },
        };
      }
    });
  };

  const handleClosedDayToggle = (dayKey: string) => {
    const isClosed = closedDays.includes(dayKey);
    setClosedDays((prev) =>
      isClosed ? prev.filter((d) => d !== dayKey) : [...prev, dayKey],
    );
    setHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], closed: !isClosed },
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      for (const [idx, file] of files.entries()) {
        const fd = new FormData();
        fd.append("business", String(businessId));
        fd.append("image", file);
        fd.append("display_order", String(photos.length + idx + 1));
        const res = await apiClient.post("/business-photos/", fd, {
          headers: { "Content-Type": undefined },
        });
        setPhotos((prev) => [
          ...prev,
          {
            id: res.data.id,
            url: res.data.image_url || res.data.image,
            is_hero: !!res.data.is_hero,
          },
        ]);
      }
    } catch (err: any) {
      setPhotoError(
        err.response?.data?.message || "写真のアップロードに失敗しました",
      );
    } finally {
      setPhotoUploading(false);
      if (photosInputRef.current) photosInputRef.current.value = "";
    }
  };

  const handleHeroUpload = async (file: File) => {
    setHeroError(null);
    setHeroUploading(true);
    try {
      const existingHero = photos.find((p) => p.is_hero);
      if (existingHero) {
        await apiClient.delete(`/business-photos/${existingHero.id}/`);
        setPhotos((prev) => prev.filter((p) => p.id !== existingHero.id));
      }
      const fd = new FormData();
      fd.append("business", String(businessId));
      fd.append("image", file);
      fd.append("is_hero", "true");
      fd.append("display_order", "0");
      const res = await apiClient.post("/business-photos/", fd, {
        headers: { "Content-Type": undefined },
      });
      setPhotos((prev) => [
        { id: res.data.id, url: res.data.image_url || res.data.image, is_hero: true },
        ...prev,
      ]);
    } catch (err: any) {
      setHeroError(
        err.response?.data?.message ||
          "ヒーロー画像のアップロードに失敗しました",
      );
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  };

  const handleMapsUrlChange = (url: string) => {
    setMapsUrl(url);
    const coords = parseGoogleMapsUrl(url);
    if (coords) {
      setLatitude(String(coords.lat));
      setLongitude(String(coords.lng));
    }
  };

  const updateMenuItem2 = (i: number, patch: Partial<MenuItemDraft>) =>
    setMenuItems((prev) =>
      prev.map((it, k) => (k === i ? { ...it, ...patch } : it)),
    );

  const removeMenuItem = async (i: number) => {
    const item = menuItems[i];
    if (item.id) {
      try {
        await deleteMenuItem(item.id);
      } catch {
        setMenuError("削除に失敗しました");
        return;
      }
    }
    setMenuItems((prev) => prev.filter((_, k) => k !== i));
  };

  const removeSavedMenuPhoto = async (itemIdx: number, photoId: number, lang: "jp" | "en") => {
    try {
      await deleteMenuItemPhoto(photoId);
      if (lang === "jp") {
        updateMenuItem2(itemIdx, {
          savedPhotosJp: menuItems[itemIdx].savedPhotosJp.filter((p) => p.id !== photoId),
        });
      } else {
        updateMenuItem2(itemIdx, {
          savedPhotosEn: menuItems[itemIdx].savedPhotosEn.filter((p) => p.id !== photoId),
        });
      }
    } catch {
      setMenuError("写真の削除に失敗しました");
    }
  };

  const saveMenu = async (): Promise<boolean> => {
    setSavingMenu(true);
    setMenuError(null);
    try {
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        if (
          !item.category_jp &&
          !item.category_en &&
          !item.pendingFilesJp.length &&
          !item.pendingFilesEn.length &&
          !item.savedPhotosJp.length &&
          !item.savedPhotosEn.length
        )
          continue;
        if (!item.id) {
          const fd = new FormData();
          fd.append("business", String(businessId));
          if (item.category_jp) fd.append("category_jp", item.category_jp);
          if (item.category_en) fd.append("category_en", item.category_en);
          if (item.discount_percentage)
            fd.append("discount_percentage", item.discount_percentage);
          if (item.discount_start_time)
            fd.append("discount_start_time", timeToISODatetime(item.discount_start_time) ?? "");
          if (item.discount_end_time)
            fd.append("discount_end_time", timeToISODatetime(item.discount_end_time) ?? "");
          item.pendingFilesJp.forEach((file, pidx) => {
            fd.append("photo_images", file);
            fd.append("photo_labels", `[jp]${item.pendingLabelsJp[pidx] ?? ""}`);
          });
          item.pendingFilesEn.forEach((file, pidx) => {
            fd.append("photo_images", file);
            fd.append("photo_labels", `[en]${item.pendingLabelsEn[pidx] ?? ""}`);
          });
          const created = await createMenuItem(fd);
          const newId = created.id;

          // Bulk-create hours for the new item
          const hoursPayload = item.hours.map((h) =>
            h.is_closed
              ? {
                  day_of_week: h.day_of_week,
                  is_closed: true as const,
                  ...(h.closed_reason ? { closed_reason: h.closed_reason } : {}),
                }
              : {
                  day_of_week: h.day_of_week,
                  is_closed: false as const,
                  start_time: h.start_time,
                  end_time: h.end_time,
                },
          );
          await bulkCreateMenuItemHours(newId, hoursPayload);

          const allCreated = (created.photos ?? []).map((p) => ({
            id: p.id,
            url: p.image_url || p.image,
            label: p.label,
          }));
          updateMenuItem2(i, {
            id: newId,
            savedPhotosJp: allCreated.filter((p) => !(p.label ?? "").startsWith("[en]")),
            savedPhotosEn: allCreated.filter((p) => (p.label ?? "").startsWith("[en]")),
            pendingFilesJp: [],
            pendingLabelsJp: [],
            pendingFilesEn: [],
            pendingLabelsEn: [],
          });
        } else {
          await updateMenuItem(item.id, {
            category_jp: item.category_jp || undefined,
            category_en: item.category_en || undefined,
            discount_percentage: item.discount_percentage || null,
            discount_start_time: item.discount_start_time
              ? timeToISODatetime(item.discount_start_time)
              : null,
            discount_end_time: item.discount_end_time
              ? timeToISODatetime(item.discount_end_time)
              : null,
          });
          // Upload JP photos
          for (let pidx = 0; pidx < item.pendingFilesJp.length; pidx++) {
            const pfd = new FormData();
            pfd.append("menu_item", String(item.id));
            pfd.append("image", item.pendingFilesJp[pidx]);
            pfd.append("label", `[jp]${item.pendingLabelsJp[pidx] ?? ""}`);
            const photo = await uploadMenuItemPhoto(pfd);
            setMenuItems((prev) =>
              prev.map((it, k) =>
                k !== i
                  ? it
                  : {
                      ...it,
                      savedPhotosJp: [
                        ...it.savedPhotosJp,
                        { id: photo.id, url: photo.image_url || photo.image, label: photo.label },
                      ],
                    },
              ),
            );
          }
          // Upload EN photos
          for (let pidx = 0; pidx < item.pendingFilesEn.length; pidx++) {
            const pfd = new FormData();
            pfd.append("menu_item", String(item.id));
            pfd.append("image", item.pendingFilesEn[pidx]);
            pfd.append("label", `[en]${item.pendingLabelsEn[pidx] ?? ""}`);
            const photo = await uploadMenuItemPhoto(pfd);
            setMenuItems((prev) =>
              prev.map((it, k) =>
                k !== i
                  ? it
                  : {
                      ...it,
                      savedPhotosEn: [
                        ...it.savedPhotosEn,
                        { id: photo.id, url: photo.image_url || photo.image, label: photo.label },
                      ],
                    },
              ),
            );
          }
          updateMenuItem2(i, {
            pendingFilesJp: [],
            pendingLabelsJp: [],
            pendingFilesEn: [],
            pendingLabelsEn: [],
          });

          // Sync hours — split by those with server IDs vs new
          const existingHours = item.hours.filter(
            (h) => h.id != null,
          ) as (HoursDraft & { id: number })[];
          const newHours = item.hours.filter((h) => h.id == null);

          if (existingHours.length > 0) {
            await bulkUpdateMenuItemHours(
              existingHours.map((h) =>
                h.is_closed
                  ? {
                      id: h.id,
                      is_closed: true as const,
                      ...(h.closed_reason ? { closed_reason: h.closed_reason } : {}),
                    }
                  : {
                      id: h.id,
                      is_closed: false as const,
                      start_time: h.start_time,
                      end_time: h.end_time,
                    },
              ),
            );
          }

          if (newHours.length > 0) {
            await bulkCreateMenuItemHours(
              item.id!,
              newHours.map((h) =>
                h.is_closed
                  ? {
                      day_of_week: h.day_of_week,
                      is_closed: true as const,
                      ...(h.closed_reason ? { closed_reason: h.closed_reason } : {}),
                    }
                  : {
                      day_of_week: h.day_of_week,
                      is_closed: false as const,
                      start_time: h.start_time,
                      end_time: h.end_time,
                    },
              ),
            );
          }
        }
      }
      return true;
    } catch (err: any) {
      setMenuError(
        err?.response?.data?.message || "メニューの保存に失敗しました",
      );
      return false;
    } finally {
      setSavingMenu(false);
    }
  };

  const saveLinks = async (): Promise<boolean> => {
    setLinksError(null);
    try {
      const ops: Promise<unknown>[] = [];

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
                  business: businessId,
                  platform: def.key,
                  url: s.url,
                  is_primary: false,
                  display_order: BOOKING_PLATFORMS.indexOf(def),
                })
                .then((res) =>
                  setBooking((prev) => ({
                    ...prev,
                    [def.key]: { ...prev[def.key], id: res.data.id },
                  })),
                ),
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/booking-links/${s.id}/`)
              .then(() =>
                setBooking((prev) => ({
                  ...prev,
                  [def.key]: { ...prev[def.key], id: null },
                })),
              ),
          );
        }
      }

      for (const def of ORDER_PLATFORMS) {
        const s = order[def.key];
        const hasUrl = s.url.trim() !== "";
        if (hasUrl && s.enabled) {
          if (s.id) {
            ops.push(
              apiClient.patch(`/order-links/${s.id}/`, { url: s.url }),
            );
          } else {
            ops.push(
              apiClient
                .post("/order-links/", {
                  business: businessId,
                  platform: def.key,
                  url: s.url,
                  is_primary: false,
                  display_order: ORDER_PLATFORMS.indexOf(def),
                })
                .then((res) =>
                  setOrder((prev) => ({
                    ...prev,
                    [def.key]: { ...prev[def.key], id: res.data.id },
                  })),
                ),
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/order-links/${s.id}/`)
              .then(() =>
                setOrder((prev) => ({
                  ...prev,
                  [def.key]: { ...prev[def.key], id: null },
                })),
              ),
          );
        }
      }

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
                  business: businessId,
                  platform: def.key,
                  url: s.url,
                  display_order: ALL_SOCIAL_PLATFORMS.indexOf(def),
                })
                .then((res) =>
                  setSocial((prev) => ({
                    ...prev,
                    [def.key]: { ...prev[def.key], id: res.data.id },
                  })),
                ),
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/social-links/${s.id}/`)
              .then(() =>
                setSocial((prev) => ({
                  ...prev,
                  [def.key]: { ...prev[def.key], id: null },
                })),
              ),
          );
        }
      }

      await Promise.all(ops);
      return true;
    } catch (err: any) {
      setLinksError(
        err?.response?.data?.message || "リンクの保存に失敗しました",
      );
      return false;
    }
  };

  const handleRemovePhoto = async (photoId: number) => {
    setPhotoError(null);
    try {
      await apiClient.delete(`/business-photos/${photoId}/`);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      setPhotoError(err.response?.data?.message || "削除に失敗しました");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. PATCH business profile
      // Determine onboarding_step based on completed sections
      let nextStep = 1;
      const heroPhoto = photos.find((p) => p.is_hero);
      if (
        formData.business_name &&
        formData.category &&
        formData.address &&
        formData.phone_number &&
        heroPhoto
      ) {
        nextStep = 2;
      }
      // Check hours (all days present)
      const allDaysHaveHours = DAYS_OF_WEEK.every((day) => {
        const h = hours[day.key];
        return h && typeof h.open === "string" && typeof h.close === "string";
      });
      if (nextStep >= 2 && allDaysHaveHours) {
        nextStep = 3;
      }
      // Check menu (at least one menu item for restaurants)
      if (
        nextStep >= 3 &&
        business?.category === "restaurant" &&
        menuItems.length > 0 &&
        menuItems.every((item) => item.category_jp && item.category_en)
      ) {
        nextStep = 4;
      } else if (nextStep >= 3 && business?.category !== "restaurant") {
        nextStep = 4;
      }
      const { hero_image, ...formDataRest } = formData;
      await updateBusiness(businessId, {
        ...formDataRest,
        ...(mapsUrl.trim() !== "" ? { maps_url: mapsUrl.trim() } : {}),
        ...(latitude !== "" ? { latitude: parseFloat(latitude) } : {}),
        ...(longitude !== "" ? { longitude: parseFloat(longitude) } : {}),
        onboarding_step: nextStep,
        hero_image: undefined, // Always pass as File | null | undefined
      });

      const hoursPayload = DAYS_OF_WEEK.map((day) => {
        const h = hours[day.key];
        const isClosed = h?.closed ?? false;
        const hasSecond = !!h?.hasSecondShift;
        return {
          ...(h?.id ? { id: h.id } : {}),
          day_of_week: day.api,
          is_closed: isClosed,
          opening_time: isClosed ? null : toApiTime(h?.open || "11:00"),
          closing_time: isClosed ? null : toApiTime(h?.close || "23:00"),
          last_order_time: isClosed ? null : toApiTime(h?.lastOrder || "22:30"),
          opening_time_2: hasSecond && !isClosed ? toApiTime(h?.open2 || "17:00") : null,
          closing_time_2: hasSecond && !isClosed ? toApiTime(h?.close2 || "22:00") : null,
          last_order_time_2: hasSecond && !isClosed ? toApiTime(h?.lastOrder2 || "21:30") : null,
        };
      });

      const existingHoursPayload = hoursPayload.filter(
        (hour): hour is (typeof hoursPayload)[number] & { id: number } =>
          typeof hour.id === "number",
      );
      const newHoursPayload = hoursPayload.filter((hour) => typeof hour.id !== "number");

      if (existingHoursPayload.length > 0) {
        await bulkUpdateBusinessHours(
          businessId,
          existingHoursPayload as Array<{
            id: number;
            day_of_week: (typeof DAYS_OF_WEEK)[number]["api"];
            is_closed: boolean;
            opening_time: string | null;
            closing_time: string | null;
            last_order_time: string | null;
          }>,
        );
      }

      if (newHoursPayload.length > 0) {
        const created = await bulkCreateBusinessHours(businessId, newHoursPayload);
        const createdHours: Array<{ id: number; day_of_week: string }> = Array.isArray(created)
          ? created
          : (created?.hours ?? []);
        if (createdHours.length > 0) {
          setHours((prev) => {
            const next = { ...prev };
            createdHours.forEach((hour) => {
              const day = DAYS_OF_WEEK.find((candidate) => candidate.api === hour.day_of_week);
              if (day) next[day.key] = { ...next[day.key], id: hour.id };
            });
            return next;
          });
        }
      }

      // 3. Delete old closed day records then re-create current selection
      await Promise.all(closedDayRecords.map((cd) => deleteClosedDay(cd.id)));
      if (closedDays.length > 0) {
        const created = await bulkCreateClosedDays(
          businessId,
          closedDays.map((dayKey) => {
            const day = DAYS_OF_WEEK.find((d) => d.key === dayKey)!;
            return { day_of_week: day.api };
          }),
        );
        // Keep closedDayRecords in sync so subsequent saves delete the right IDs
        const newRecords: ClosedDay[] = Array.isArray(created)
          ? created
          : (created?.closed_days ?? []);
        setClosedDayRecords(newRecords);
      } else {
        setClosedDayRecords([]);
      }

      // 4. Save menu items (restaurants only)
      if (business?.category === "restaurant") {
        const menuOk = await saveMenu();
        if (!menuOk) {
          setSaving(false);
          return;
        }
      }

      // 5. Save booking & social links
      const linksOk = await saveLinks();
      if (!linksOk) {
        setSaving(false);
        return;
      }

      router.push("/manage");
    } catch (err: any) {
      setSaveError(
        err?.response?.data?.message || err?.message || "保存に失敗しました",
      );
    } finally {
      setSaving(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (fetchError || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-center text-gray-900 font-semibold mb-4">
              {fetchError || "Business not found"}
            </p>
            <Link href="/manage">
              <Button variant="outline">Go back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/manage">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る / Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            お店の情報を確認・編集してください
          </h1>
          <p className="text-sm text-gray-500">{business.business_name}</p>
        </div>

        {saveError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Label className="font-semibold text-gray-900">
                    店舗名 / Business Name
                  </Label>
                  <span className="text-red-500 text-sm">必須</span>
                </div>
                <Input
                  name="business_name"
                  value={formData.business_name || ""}
                  onChange={handleInputChange}
                  placeholder="店舗名を入力してください"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label className="font-semibold text-gray-900 mb-2 block">
                  業種 / Category
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.key}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                        cat.key === business.category
                          ? "bg-gray-900 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label className="font-semibold text-gray-900 mb-2 block">
                  住所 / Address
                </Label>
                <div className="relative">
                  <Input
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    placeholder="東京都渋谷区宇田川町1-2-3"
                    className="border-gray-300 pr-10"
                  />
                  <MapPin className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-gray-900 mb-2 block">
                  電話番号 / Phone
                </Label>
                <Input
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleInputChange}
                  placeholder="03-1234-5678"
                  className="border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Label className="font-semibold text-gray-900">
                地図・座標 / Location Coordinates
              </Label>
              <span className="text-xs text-gray-400">(任意)</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">
                  Google Maps URL（任意）
                </Label>
                <Input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="border-gray-300"
                />
              </div>
              {(mapsUrl || latitude || formData.address) &&
                (() => {
                  const embedSrc =
                    latitude && longitude
                      ? `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`
                      : buildMapSrc(formData.address || "");
                  return (
                    <div className="rounded-lg overflow-hidden border border-gray-200 h-48">
                      <iframe
                        key={embedSrc}
                        src={embedSrc}
                        width="100%"
                        height="100%"
                        loading="lazy"
                        className="w-full h-full"
                        title="Map Preview"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  );
                })()}
            </div>
          </div>

          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="flex items-center gap-1 mb-2">
              <Label className="font-semibold text-gray-900">
                ウェブサイト / Website
              </Label>
              <span className="text-xs text-gray-400">(任意)</span>
            </div>
            <div className="relative">
              <Input
                name="website"
                type="url"
                value={formData.website || ""}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="border-gray-300 pr-10"
              />
              <span className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                🌐
              </span>
            </div>
          </div>

          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="flex items-center gap-1 mb-4">
              <Label className="font-semibold text-gray-900">
                営業時間 / Business Hours
              </Label>
              <span className="text-red-500 text-sm">必須</span>
            </div>
            <div className="overflow-hidden rounded-[16px] border border-[#cfd6df] bg-white">
              <div className="grid grid-cols-7 border-b border-[#cfd6df] bg-[#f5f5f5]">
                {DAYS_OF_WEEK.map((day, index) => {
                  const isActive = activeHoursDay === day.key;
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setActiveHoursDay(day.key)}
                      className={`px-1 py-1 text-center text-[clamp(0.7rem,1.5vw,1rem)] font-black tracking-[-0.04em] transition-colors ${
                        index < DAYS_OF_WEEK.length - 1 ? "border-r border-[#cfd6df]" : ""
                      } ${isActive ? "bg-white text-black" : "bg-[#f5f5f5] text-black"}`}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 px-3 py-3">
                <div className="flex items-center gap-5">
                  <Switch
                    checked={!hours[activeHoursDay]?.closed}
                    onCheckedChange={() => handleClosedDayToggle(activeHoursDay)}
                    className="data-[state=checked]:bg-emerald-600 scale-125"
                  />

                  {hours[activeHoursDay]?.closed ? (
                    <div className="rounded-[18px] border border-[#cfd6df] px-5 py-3 text-sm font-semibold text-gray-500">
                      定休日 / Closed
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-3">
                      {/* First shift */}
                      <div className="flex flex-wrap items-center gap-3">
                        <BusinessTimeSpinner
                          value={hours[activeHoursDay]?.open || "11:00"}
                          onChange={(value) => handleHoursChange(activeHoursDay, "open", value)}
                          disabled={saving}
                        />
                        <span className="text-[28px] font-medium text-gray-500 leading-none">~</span>
                        <BusinessTimeSpinner
                          value={hours[activeHoursDay]?.close || "23:00"}
                          onChange={(value) => handleHoursChange(activeHoursDay, "close", value)}
                          disabled={saving}
                        />
                        <span className="text-[17px] font-medium text-gray-500 leading-none">L.O.</span>
                        <BusinessTimeSpinner
                          value={hours[activeHoursDay]?.lastOrder || "22:30"}
                          onChange={(value) => handleHoursChange(activeHoursDay, "lastOrder", value)}
                          disabled={saving}
                        />
                      </div>
                      {/* Second shift fields (no toggle) */}
                      {hours[activeHoursDay]?.hasSecondShift && (
                        <div className="flex flex-wrap items-center gap-3 mt-2 ml-2">
                          <BusinessTimeSpinner
                            value={hours[activeHoursDay]?.open2 || "17:00"}
                            onChange={(value) => handleHoursChange(activeHoursDay, "open2", value)}
                            disabled={saving}
                          />
                          <span className="text-[28px] font-medium text-gray-500 leading-none">~</span>
                          <BusinessTimeSpinner
                            value={hours[activeHoursDay]?.close2 || "22:00"}
                            onChange={(value) => handleHoursChange(activeHoursDay, "close2", value)}
                            disabled={saving}
                          />
                          <span className="text-[17px] font-medium text-gray-500 leading-none">L.O.</span>
                          <BusinessTimeSpinner
                            value={hours[activeHoursDay]?.lastOrder2 || "21:30"}
                            onChange={(value) => handleHoursChange(activeHoursDay, "lastOrder2", value)}
                            disabled={saving}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <Label className="font-semibold text-gray-900 mb-3 block">
              ヒーロー画像 / Hero Banner
            </Label>
            {heroError && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{heroError}</AlertDescription>
              </Alert>
            )}
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleHeroUpload(f);
                e.target.value = "";
              }}
            />
            {(() => {
              // Prefer heroImage state, fallback to hero photo in photos array
              const heroPhoto = photos.find((p) => p.is_hero);
              const heroUrl = heroImage || heroPhoto?.url || null;
              const heroId = heroPhoto?.id;
              if (heroUrl) {
                return (
                  <div
                    className="relative group rounded-xl overflow-hidden border border-gray-200 w-full"
                    style={{ aspectRatio: "16/5" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroUrl}
                      alt="Hero banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => heroInputRef.current?.click()}
                        disabled={heroUploading}
                        className="px-3 py-1.5 bg-white/90 text-gray-900 text-sm font-semibold rounded-lg hover:bg-white transition-colors"
                      >
                        変更 / Change
                      </button>
                      {heroId && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(heroId)}
                          disabled={heroUploading}
                          className="px-3 py-1.5 bg-red-500/90 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        >
                          削除 / Remove
                        </button>
                      )}
                    </div>
                    {heroUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div
                    onClick={() =>
                      !heroUploading && heroInputRef.current?.click()
                    }
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-10 transition-colors ${
                      heroUploading
                        ? "border-gray-200 opacity-60 cursor-not-allowed"
                        : "border-gray-300 hover:border-gray-400 cursor-pointer"
                    }`}
                  >
                    {heroUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-gray-400" />
                        <p className="text-sm font-medium text-gray-500">
                          ヒーロー画像をアップロード
                        </p>
                        <p className="text-xs text-gray-400">
                          Hero Banner Image (16:5 recommended)
                        </p>
                      </>
                    )}
                  </div>
                );
              }
            })()}
            <p className="text-xs text-gray-500 mt-2">
              推奨サイズ：1600×500px以上（横長）
            </p>
          </div>

          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <Label className="font-semibold text-gray-900 mb-3 block">
              写真 / Photos
            </Label>
            {photoError && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{photoError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-3 mb-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {photo.is_hero && (
                    <span className="absolute top-0.5 left-0.5 bg-yellow-400 text-[9px] font-bold px-1 rounded leading-tight text-gray-900">
                      hero
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors shrink-0">
                <input
                  ref={photosInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {photoUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Cloud className="h-5 w-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500">追加</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG, WebP（推奨サイズ：1200×800px以上）
            </p>
          </div>

          {business.category === "restaurant" && (
            <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold text-gray-900">
                  メニュー / Menu
                </Label>
              </div>
              {menuError && (
                <Alert variant="destructive" className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{menuError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                {menuItems.map((item, i) => (
                  <MenuItemCard
                    key={i}
                    item={item}
                    index={i}
                    disabled={saving || savingMenu}
                    onUpdate={(patch) => updateMenuItem2(i, patch)}
                    onRemove={() => removeMenuItem(i)}
                    onRemoveSavedPhoto={(photoId, lang) =>
                      removeSavedMenuPhoto(i, photoId, lang)
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setMenuItems((prev) => [...prev, emptyMenuItem()])
                  }
                  disabled={saving || savingMenu}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    メニューアイテムを追加 / Add Menu Item
                  </span>
                </button>
              </div>
            </div>
          )}

          {linksError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{linksError}</AlertDescription>
            </Alert>
          )}

          <BusinessLinksEditor
            booking={booking}
            order={order}
            social={social}
            disabled={saving}
            onBookingChange={(key, url) =>
              setBooking((prev) => ({
                ...prev,
                [key]: { ...prev[key], url },
              }))
            }
            onBookingToggle={(key, enabled) =>
              setBooking((prev) => ({
                ...prev,
                [key]: { ...prev[key], enabled },
              }))
            }
            onOrderChange={(key, url) =>
              setOrder((prev) => ({
                ...prev,
                [key]: { ...prev[key], url },
              }))
            }
            onOrderToggle={(key, enabled) =>
              setOrder((prev) => ({
                ...prev,
                [key]: { ...prev[key], enabled },
              }))
            }
            onSocialChange={(key, url) =>
              setSocial((prev) => ({
                ...prev,
                [key]: { ...prev[key], url },
              }))
            }
            onSocialToggle={(key, enabled) =>
              setSocial((prev) => ({
                ...prev,
                [key]: { ...prev[key], enabled },
              }))
            }
          />
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Link href="/manage">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              キャンセル / Cancel
            </Button>
          </Link>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                保存して戻る / Save
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BusinessDetailPage() {
  return (
    <ProtectedRoute>
      <BusinessDetailContent />
    </ProtectedRoute>
  );
}
