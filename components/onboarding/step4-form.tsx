"use client";

import React, { useState, useEffect, useRef } from "react";
import { isoToDatetimeLocalInput, timeToISODatetime, extractErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Loader2,
  Check,
  Plus,
  Trash2,
  ImagePlus,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
  Percent,
  Image as ImageIcon,
  UtensilsCrossed,
} from "lucide-react";
import {
  BusinessProfile,
  MenuItemHours,
} from "@/lib/types/business";
import { useBusinessApi } from "@/lib/hooks/useBusinessApi";

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

interface Step4FormProps {
  business: BusinessProfile;
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  onPublish?: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
  isNew?: boolean;
}

interface MenuItemDraft {
  /** undefined = not yet saved to server */
  id?: number;
  category_jp: string;
  category_en: string;
  discount_percentage: string;
  discount_start_time: string; // YYYY-MM-DDTHH:MM
  discount_end_time: string;   // YYYY-MM-DDTHH:MM
  /** JP photos already on the server */
  savedPhotosJp: { id: number; url: string; label?: string }[];
  pendingFilesJp: File[];
  pendingLabelsJp: string[];
  /** EN photos already on the server */
  savedPhotosEn: { id: number; url: string; label?: string }[];
  pendingFilesEn: File[];
  pendingLabelsEn: string[];
  hours: HoursDraft[];
  isOpen: boolean;
  showHours: boolean;
}

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const DAYS: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const DAY_LABELS: Record<DayOfWeek, { jp: string; en: string }> = {
  monday:    { jp: "月", en: "Mon" },
  tuesday:   { jp: "火", en: "Tue" },
  wednesday: { jp: "水", en: "Wed" },
  thursday:  { jp: "木", en: "Thu" },
  friday:    { jp: "金", en: "Fri" },
  saturday:  { jp: "土", en: "Sat" },
  sunday:    { jp: "日", en: "Sun" },
};

function defaultHours(): HoursDraft[] {
  return DAYS.map((day) => ({
    day_of_week: day,
    is_closed: false,
    closed_reason: "",
    start_time: "11:00",
    end_time: "21:00",
  }));
}

function mergeHoursWithDefaults(serverHours: MenuItemHours[]): HoursDraft[] {
  const byDay = new Map(serverHours.map((h) => [h.day_of_week, h]));
  return DAYS.map((day) => {
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

function minsToTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeToMins(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function formatTimeWithPeriod(time: string): string {
  const hour = Number(time.split(":")[0] || 0);
  return `${time} ${hour < 12 ? "AM" : "PM"}`;
}

function emptyItem(): MenuItemDraft {
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
    hours: defaultHours(),
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
          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function MenuTimeSpinner({
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
  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(1439, timeToMins(value) + delta));
    onChange(minsToTime(next));
  };

  return (
    <div className={`flex items-center overflow-hidden rounded-[18px] border border-[#cfd6df] bg-white select-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] ${className}`}>
      <span className="flex-1 px-5 py-3 text-center text-[15px] font-medium leading-none text-gray-900">
        {formatTimeWithPeriod(value)}
      </span>
      <div className="flex shrink-0 flex-col border-l border-gray-200">
        <button
          type="button"
          onClick={() => adjust(30)}
          disabled={disabled}
          className="flex items-center justify-center border-b border-gray-200 px-2 py-1.5 hover:bg-gray-50"
        >
          <ChevronUp className="h-3 w-3 text-gray-400" />
        </button>
        <button
          type="button"
          onClick={() => adjust(-30)}
          disabled={disabled}
          className="flex items-center justify-center px-2 py-1.5 hover:bg-gray-50"
        >
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </div>
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
  const [activeDay, setActiveDay] = useState<DayOfWeek>(DAYS[0]);

  const updateHour = (idx: number, patch: Partial<HoursDraft>) => {
    onChange(hours.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  };

  const activeIndex = Math.max(
    0,
    hours.findIndex((hour) => hour.day_of_week === activeDay),
  );
  const activeHours = hours[activeIndex] ?? hours[0];
  const activeLabel = DAY_LABELS[activeHours.day_of_week];

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#cfd6df] bg-white">
      <div className="grid grid-cols-7 border-b border-[#cfd6df] bg-[#dddddd]">
        {DAYS.map((day, index) => {
          const label = DAY_LABELS[day];
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`px-2 py-3 text-center text-[clamp(1.1rem,2vw,1.5rem)] font-black tracking-[-0.04em] transition-colors ${
                index < DAYS.length - 1 ? "border-r border-[#cfd6df]" : ""
              } ${isActive ? "bg-white text-black" : "bg-[#dddddd] text-black"}`}
            >
              {label.en}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center gap-5">
          <Switch
            checked={!activeHours.is_closed}
            onCheckedChange={(open) =>
              updateHour(activeIndex, {
                is_closed: !open,
                closed_reason: open ? "" : activeHours.closed_reason,
              })
            }
            disabled={disabled}
            className="scale-125 data-[state=checked]:bg-emerald-600"
          />

          {activeHours.is_closed ? (
            <div className="flex flex-1 items-center gap-3">
              <div className="rounded-[18px] border border-[#cfd6df] px-5 py-3 text-sm font-semibold text-gray-500">
                定休日 / Closed
              </div>
              <Input
                type="text"
                placeholder="理由 (任意) e.g. 祝日"
                value={activeHours.closed_reason}
                onChange={(e) =>
                  updateHour(activeIndex, { closed_reason: e.target.value })
                }
                disabled={disabled}
                className="h-[52px] flex-1 rounded-[18px] border-[#cfd6df] bg-white text-sm"
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <MenuTimeSpinner
                  value={activeHours.start_time}
                  onChange={(value) => updateHour(activeIndex, { start_time: value })}
                  disabled={disabled}
                />
                <span className="text-[28px] font-medium leading-none text-gray-500">~</span>
                <MenuTimeSpinner
                  value={activeHours.end_time}
                  onChange={(value) => updateHour(activeIndex, { end_time: value })}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>

        <p className="pl-16 text-sm font-medium text-gray-400">
          {activeLabel.jp} / {activeLabel.en}
        </p>
      </div>
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItemDraft;
  index: number;
  disabled: boolean;
  onUpdate: (patch: Partial<MenuItemDraft>) => void;
  onRemove: () => void;
  onRemoveSavedPhoto: (id: number, lang: "jp" | "en") => void;
}

function MenuItemCard({
  item,
  index,
  disabled,
  onUpdate,
  onRemove,
  onRemoveSavedPhoto,
}: MenuItemCardProps) {
  const fileInputRefJp = useRef<HTMLInputElement>(null);
  const fileInputRefEn = useRef<HTMLInputElement>(null);

  const handleFilePickJp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const toAdd = files.slice(0, 20 - (item.savedPhotosJp.length + item.pendingFilesJp.length));
    onUpdate({
      pendingFilesJp: [...item.pendingFilesJp, ...toAdd],
      pendingLabelsJp: [...item.pendingLabelsJp, ...toAdd.map(() => "")],
    });
    e.target.value = "";
  };

  const handleFilePickEn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const toAdd = files.slice(0, 20 - (item.savedPhotosEn.length + item.pendingFilesEn.length));
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

  const totalPhotosJp = item.savedPhotosJp.length + item.pendingFilesJp.length;
  const totalPhotosEn = item.savedPhotosEn.length + item.pendingFilesEn.length;
  const totalPhotos   = totalPhotosJp + totalPhotosEn;
  const openDays = item.hours.filter((h) => !h.is_closed).length;
  const title = item.category_jp || item.category_en || `メニュー ${index + 1}`;
  const hasDiscount = !!item.discount_percentage;

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
                {/* Quick-set bar */}
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

export function Step4Form({
  business,
  onSubmit,
  loading,
  error,
  isNew,
}: Step4FormProps) {
  const api = useBusinessApi();

  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">(
    business.plan || "free",
  );
  const [customDomain, setCustomDomain] = useState(
    business.custom_domain || "",
  );
  const [items, setItems] = useState<MenuItemDraft[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);

  const isRestaurant = business.category === "restaurant";

  // Seed one empty item for new restaurants
  useEffect(() => {
    if (isRestaurant && isNew) setItems([emptyItem()]);
  }, [isRestaurant, isNew]);

  // Load existing menu items on mount (restaurant only)
  useEffect(() => {
    if (!isRestaurant || isNew) return;
    (async () => {
      setMenuLoading(true);
      try {
        const existing = await api.listMenuItems(business.id);
        if (existing.length > 0) {
          setItems(
            existing.map((item) => ({
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
              hours:
                item.hours && item.hours.length > 0
                  ? mergeHoursWithDefaults(item.hours)
                  : defaultHours(),
              isOpen: false,
              showHours: false,
            })),
          );
        } else {
          setItems([emptyItem()]);
        }
      } catch (err: any) {
        setMenuError(extractErrorMessage(err, "既存のメニューを読み込めませんでした"));
        setItems([emptyItem()]);
      } finally {
        setMenuLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id]);

  const updateItem = (i: number, patch: Partial<MenuItemDraft>) => {
    setMenuSaved(false);
    setItems((prev) =>
      prev.map((it, k) => (k === i ? { ...it, ...patch } : it)),
    );
  };

  const removeItem = async (i: number) => {
    const item = items[i];
    if (item.id) {
      try {
        await api.deleteMenuItem(item.id);
      } catch {
        setMenuError("削除に失敗しました");
        return;
      }
    }
    setItems((prev) => prev.filter((_, k) => k !== i));
  };

  const removeSavedPhoto = async (itemIdx: number, photoId: number, lang: "jp" | "en") => {
    try {
      await api.deleteMenuItemPhoto(photoId);
      if (lang === "jp") {
        updateItem(itemIdx, {
          savedPhotosJp: items[itemIdx].savedPhotosJp.filter((p) => p.id !== photoId),
        });
      } else {
        updateItem(itemIdx, {
          savedPhotosEn: items[itemIdx].savedPhotosEn.filter((p) => p.id !== photoId),
        });
      }
    } catch (err: any) {
      setMenuError(extractErrorMessage(err, "写真の削除に失敗しました"));
    }
  };

  const saveMenu = async (): Promise<boolean> => {
    setSavingMenu(true);
    setMenuError(null);
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Skip blank rows
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
          fd.append("business", String(business.id));
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

          const created = await api.createMenuItem(fd);
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
          await api.bulkCreateMenuItemHours(newId, hoursPayload);

          const allCreated = (created.photos ?? []).map((p) => ({
            id: p.id,
            url: p.image_url || p.image,
            label: p.label,
          }));
          updateItem(i, {
            id: newId,
            savedPhotosJp: allCreated.filter((p) => !(p.label ?? "").startsWith("[en]")),
            savedPhotosEn: allCreated.filter((p) => (p.label ?? "").startsWith("[en]")),
            pendingFilesJp: [],
            pendingLabelsJp: [],
            pendingFilesEn: [],
            pendingLabelsEn: [],
          });
        } else {
          // ── Existing item ── PATCH metadata
          await api.updateMenuItem(item.id, {
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
            pfd.append("menu_item", String(item.id!));
            pfd.append("image", item.pendingFilesJp[pidx]);
            pfd.append("label", `[jp]${item.pendingLabelsJp[pidx] ?? ""}`);
            const photo = await api.uploadMenuItemPhoto(pfd);
            setItems((prev) =>
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
            pfd.append("menu_item", String(item.id!));
            pfd.append("image", item.pendingFilesEn[pidx]);
            pfd.append("label", `[en]${item.pendingLabelsEn[pidx] ?? ""}`);
            const photo = await api.uploadMenuItemPhoto(pfd);
            setItems((prev) =>
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
          updateItem(i, {
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
            await api.bulkUpdateMenuItemHours(
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
            await api.bulkCreateMenuItemHours(
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
    } catch (err: unknown) {
      const apiError = err as ApiErrorLike;
      setMenuError(
        apiError.response?.data?.message || "メニューの保存に失敗しました",
      );
      return false;
    } finally {
      setSavingMenu(false);
    }
  };

  const saveMenuAndNotify = async () => {
    setMenuSaved(false);
    const ok = await saveMenu();
    if (ok) setMenuSaved(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      isRestaurant &&
      items.some(
        (it) =>
          it.category_jp ||
          it.category_en ||
          it.pendingFilesJp.length > 0 ||
          it.pendingFilesEn.length > 0 ||
          it.savedPhotosJp.length > 0 ||
          it.savedPhotosEn.length > 0,
      )
    ) {
      const ok = await saveMenu();
      if (!ok) return;
    }
    const data: Partial<BusinessProfile> = {
      plan: selectedPlan,
      onboarding_step: 4,
      is_published: true,
    };
    if (selectedPlan === "premium" && customDomain)
      data.custom_domain = customDomain;
    await onSubmit(data);
  };

  const isLoading = loading || savingMenu;

  const plans = [
    {
      name: "フリー / Free",
      price: "¥0",
      period: "/月",
      features: [
        "Subdomain (menus.jp)",
        "ビジネス情報すべて",
        "営業時間",
        "Powered by menus.jp",
      ],
      value: "free" as const,
      recommended: false,
    },
    {
      name: "プレミアム / Premium",
      price: "¥980",
      period: "/月",
      features: [
        "Custom domain",
        "フリーの全機能",
        "Analytics dashboard",
        'No "Powered by" branding',
        "Priority support",
      ],
      value: "premium" as const,
      recommended: true,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isRestaurant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                  メニュー / Menu
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  カテゴリ・写真・割引・営業時間を設定できます
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl h-9 px-4"
              onClick={saveMenuAndNotify}
              disabled={!!(loading || savingMenu || menuLoading)}
            >
              {savingMenu ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  保存中...
                </>
              ) : menuSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">保存済み</span>
                </>
              ) : (
                <>保存 / Save</>
              )}
            </Button>
          </div>

          {menuError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{menuError}</AlertDescription>
            </Alert>
          )}

          {menuLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <MenuItemCard
                  key={i}
                  item={item}
                  index={i}
                  disabled={!!isLoading}
                  onUpdate={(patch) => updateItem(i, patch)}
                  onRemove={() => removeItem(i)}
                  onRemoveSavedPhoto={(photoId, lang) => removeSavedPhoto(i, photoId, lang)}
                />
              ))}

              {/* Add item button */}
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                disabled={!!isLoading}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-5 flex items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  メニューカテゴリを追加 / Add Menu Category
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-5 border border-gray-200 rounded-2xl bg-stone-50">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          プラン選択 / Choose Your Plan
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <button
              key={plan.value}
              type="button"
              onClick={() => setSelectedPlan(plan.value)}
              disabled={loading}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedPlan === plan.value
                  ? "border-gray-900 bg-white shadow-sm"
                  : "border-gray-200 hover:border-gray-400 bg-white"
              }`}
            >
              {plan.recommended && (
                <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  Recommended
                </div>
              )}
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                {plan.name}
              </h4>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500 text-sm ml-1">
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 flex items-start gap-2"
                  >
                    <Check className="h-4 w-4 mt-0.5 text-gray-900 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {selectedPlan === "premium" && (
        <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200">
          <Label className="font-semibold text-gray-900">
            カスタムドメイン / Custom Domain (任意)
          </Label>
          <Input
            type="text"
            placeholder="yourbusiness.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            disabled={loading}
            className="rounded-lg"
          />
          <p className="text-xs text-gray-500">
            Point your domain&apos;s DNS to menus.jp for custom domain setup
          </p>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={!!isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 font-semibold flex items-center justify-center gap-2 rounded-xl text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {savingMenu ? "メニュー保存中..." : "公開中..."}
            </>
          ) : (
            "公開する / Publish"
          )}
        </Button>
      </div>
    </form>
  );
}
