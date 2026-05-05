"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  ChevronRight,
  Globe,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
} from "lucide-react";
import { BusinessProfile } from "@/lib/types/business";
import { Switch } from "@/components/ui/switch";
import apiClient from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/utils";

interface Step2FormProps {
  business: BusinessProfile;
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  isNew?: boolean;
}

const DAYS_OF_WEEK = [
  { key: "Monday", display: "月", short: "Mon" },
  { key: "Tuesday", display: "火", short: "Tue" },
  { key: "Wednesday", display: "水", short: "Wed" },
  { key: "Thursday", display: "木", short: "Thu" },
  { key: "Friday", display: "金", short: "Fri" },
  { key: "Saturday", display: "土", short: "Sat" },
  { key: "Sunday", display: "日", short: "Sun" },
];

type HoursEntry = {
  id?: number;
  open: string;
  close: string;
  lastOrder: string;
  open2?: string;
  close2?: string;
  lastOrder2?: string;
  hasSecondShift?: boolean;
};

type PhotoEntry = { id: number; url: string };

const DAY_KEY_MAP: Record<string, string> = {
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
  Saturday: "saturday",
  Sunday: "sunday",
};

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatTimeWithPeriod(time: string): string {
  const hour = Number(time.split(":")[0] || 0);
  return `${time} ${hour < 12 ? "AM" : "PM"}`;
}

function TimeSpinner({
  value,
  onChange,
  disabled,
  className = "w-[100px]",
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const adjust = (delta: number) => {
    onChange(minsToTime(Math.max(0, Math.min(1439, timeToMins(value) + delta))));
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
      adjust(e.deltaY > 0 ? -1 : 1);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [value]);

  return (
    <div
      ref={ref}
      className={`flex items-center rounded-[10px] border border-[#cfd6df] bg-white select-none overflow-hidden ${className}`}
    >
      {editing ? (
        <input
          autoFocus
          type="text"
          defaultValue={value}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commitDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitDraft((e.target as HTMLInputElement).value);
            if (e.key === "Escape") setEditing(false);
            if (e.key === "ArrowUp") { e.preventDefault(); adjust(1); }
            if (e.key === "ArrowDown") { e.preventDefault(); adjust(-1); }
          }}
          className="flex-1 px-2 py-1.5 text-center text-[13px] font-medium text-gray-900 leading-none outline-none w-full"
          disabled={disabled}
        />
      ) : (
        <span
          className="flex-1 px-2 py-1.5 text-center text-[13px] font-medium text-gray-900 leading-none cursor-text"
          onClick={() => { setDraft(value); setEditing(true); }}
        >
          {value}
        </span>
      )}
      <div className="flex flex-col border-l border-gray-200 shrink-0">
        <button type="button" onClick={() => adjust(30)} className="flex items-center justify-center px-1.5 py-1 hover:bg-gray-50 border-b border-gray-200" disabled={disabled}>
          <ChevronUp className="h-2.5 w-2.5 text-gray-400" />
        </button>
        <button type="button" onClick={() => adjust(-30)} className="flex items-center justify-center px-1.5 py-1 hover:bg-gray-50" disabled={disabled}>
          <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

export function Step2Form({
  business,
  onSubmit,
  loading,
  error,
  isNew,
}: Step2FormProps) {
  const [website, setWebsite] = useState(business.website || "");
  const [activeHoursDay, setActiveHoursDay] = useState<string>(DAYS_OF_WEEK[0].key);
  const [hours, setHours] = useState<Record<string, HoursEntry>>({});
  const [closedDays, setClosedDays] = useState<string[]>([]);
  // IDs of existing ClosedDay records (needed to delete before recreating)
  const [closedDayRecords, setClosedDayRecords] = useState<{ id: number; day_of_week: string }[]>([]);

  const [galleryPhotos, setGalleryPhotos] = useState<PhotoEntry[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  const photosInputRef = useRef<HTMLInputElement>(null);

  // Always fetch hours, photos, and closed days from server on mount or business change
  useEffect(() => {
    if (isNew) {
      // New business: always blank/default state
      const blankHours: Record<string, HoursEntry> = {};
      DAYS_OF_WEEK.forEach((d) => {
        blankHours[d.key] = { open: "11:00", close: "23:59", lastOrder: "23:00", hasSecondShift: true };
      });
      setHours(blankHours);
      setClosedDays([]);
      setClosedDayRecords([]);
      setGalleryPhotos([]);
      return;
    }
    if (!business?.id) return;
    Promise.all([
      apiClient.get(`/business-photos/?business=${business.id}`),
      apiClient.get(`/business-hours/?business=${business.id}`),
      apiClient.get(`/closed-days/?business=${business.id}`),
    ])
      .then(([photosRes, hoursRes, closedRes]) => {
        // Photos
        const photos: any[] = photosRes.data.results ?? photosRes.data;
        const gallery = photos.filter((p: any) => !p.is_hero);
        setGalleryPhotos(gallery.map((p: any) => ({ id: p.id, url: p.image_url || p.image })));

        // Hours — map API records into state (preserving IDs)
        const existingHours: any[] = hoursRes.data.results ?? hoursRes.data;
        const mapped: Record<string, HoursEntry> = {};
        DAYS_OF_WEEK.forEach((d) => {
          mapped[d.key] = { open: "11:00", close: "23:59", lastOrder: "23:00", hasSecondShift: true };
        });
        if (existingHours.length > 0) {
          existingHours.forEach((h: any) => {
            const day = DAYS_OF_WEEK.find((d) => DAY_KEY_MAP[d.key] === h.day_of_week);
            if (!day) return;
            const toDisplay = (t: string | null) => (t ? t.slice(0, 5) : "00:00");
            mapped[day.key] = {
              id: h.id,
              open: toDisplay(h.opening_time) || "11:00",
              close: toDisplay(h.closing_time) || "23:59",
              lastOrder: toDisplay(h.last_order_time) || "23:00",
              open2: h.opening_time_2 ? toDisplay(h.opening_time_2) : undefined,
              close2: h.closing_time_2 ? toDisplay(h.closing_time_2) : undefined,
              lastOrder2: h.last_order_time_2 ? toDisplay(h.last_order_time_2) : undefined,
              hasSecondShift: !!(h.opening_time_2 && h.closing_time_2),
            };
          });
        }
        setHours(mapped);

        // Closed days
        const existingClosed: any[] = closedRes.data.results ?? closedRes.data;
        setClosedDayRecords(existingClosed.map((cd: any) => ({ id: cd.id, day_of_week: cd.day_of_week })));
        const closedKeys = existingClosed
          .map((cd: any) => DAYS_OF_WEEK.find((d) => DAY_KEY_MAP[d.key] === cd.day_of_week)?.key)
          .filter(Boolean) as string[];
        setClosedDays(closedKeys);
      })
      .catch(() => {
        // non-fatal — fall back to defaults
      });
  }, [business?.id, isNew]);

  const toggleClosed = (dayKey: string) => {
    setClosedDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((d) => d !== dayKey)
        : [...prev, dayKey],
    );
  };

  const handleHoursChange = (
    day: string,
    field: keyof HoursEntry,
    value: string,
  ) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 6 - galleryPhotos.length;
    const toUpload = files.slice(0, remaining);
    setPhotoError(null);
    setGalleryUploading(true);
    const uploaded: PhotoEntry[] = [];
    try {
      for (const [idx, file] of toUpload.entries()) {
        const fd = new FormData();
        fd.append("business", String(business.id));
        fd.append("image", file);
        // do NOT append is_hero — omitting it lets the backend default to False
        // sending the string 'false' would be truthy in Python and trigger the hero check
        fd.append("display_order", String(galleryPhotos.length + idx + 1));
        const res = await apiClient.post("/business-photos/", fd, {
          headers: { "Content-Type": undefined },
        });
        uploaded.push({ id: res.data.id, url: res.data.image_url });
      }
      setGalleryPhotos((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      // Save any photos that succeeded before the failure
      if (uploaded.length > 0) {
        setGalleryPhotos((prev) => [...prev, ...uploaded]);
      }
      const msg = extractErrorMessage(err, "写真のアップロードに失敗しました");
      setPhotoError(
        uploaded.length > 0 ? `${msg}（一部は保存されました）` : msg,
      );
    } finally {
      setGalleryUploading(false);
      if (photosInputRef.current) photosInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async (photoId: number) => {
    if (deletingPhotoId !== null) return; // prevent concurrent deletes
    setPhotoError(null);
    setDeletingPhotoId(photoId);
    try {
      await apiClient.delete(`/business-photos/${photoId}/`);
      setGalleryPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      setPhotoError(extractErrorMessage(err, "削除に失敗しました"));
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const toApiTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hh = String(Math.min(23, h || 0)).padStart(2, "0");
    const mm = String(Math.min(59, m || 0)).padStart(2, "0");
    return `${hh}:${mm}:00`;
  };

  const activeDayHours = hours[activeHoursDay];
  const activeDayClosed = closedDays.includes(activeHoursDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHoursError(null);

    const payload = DAYS_OF_WEEK.map((day) => {
      const isClosed = closedDays.includes(day.key);
      const dayHours = hours[day.key];
      const hasSecond = !!dayHours?.hasSecondShift;
      return {
        ...(dayHours?.id ? { id: dayHours.id } : {}),
        day_of_week: DAY_KEY_MAP[day.key],
        is_closed: isClosed,
        opening_time: isClosed ? null : toApiTime(dayHours?.open || "11:00"),
        closing_time: isClosed ? null : toApiTime(dayHours?.close || "23:00"),
        last_order_time: isClosed ? null : toApiTime(dayHours?.lastOrder || "23:59"),
        opening_time_2: hasSecond && !isClosed ? toApiTime(dayHours?.open2 || "17:00") : null,
        closing_time_2: hasSecond && !isClosed ? toApiTime(dayHours?.close2 || "22:00") : null,
        last_order_time_2: hasSecond && !isClosed ? toApiTime(dayHours?.lastOrder2 || "21:30") : null,
      };
    });

    try {
      const existingHoursPayload = payload.filter(
        (hour): hour is (typeof payload)[number] & { id: number } =>
          typeof hour.id === "number",
      );
      const newHoursPayload = payload.filter((hour) => typeof hour.id !== "number");

      if (existingHoursPayload.length > 0) {
        await apiClient.patch("/business-hours/bulk_update/", {
          business: business.id,
          hours: existingHoursPayload,
        });
      }

      if (newHoursPayload.length > 0) {
        const res = await apiClient.post("/business-hours/bulk_create/", {
          business: business.id,
          hours: newHoursPayload,
        });

        const created: any[] = Array.isArray(res.data)
          ? res.data
          : (res.data?.hours ?? []);
        if (created.length > 0) {
          setHours((prev) => {
            const next = { ...prev };
            created.forEach((h: any) => {
              const day = DAYS_OF_WEEK.find((d) => DAY_KEY_MAP[d.key] === h.day_of_week);
              if (day) next[day.key] = { ...next[day.key], id: h.id };
            });
            return next;
          });
        }
      }
    } catch (err: any) {
      setHoursError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "営業時間の保存に失敗しました",
      );
      return;
    }

    // Closed days: delete existing records then recreate current selection
    try {
      await Promise.all(
        closedDayRecords.map((cd) =>
          apiClient.delete(`/closed-days/${cd.id}/`).catch(() => {}),
        ),
      );
      if (closedDays.length > 0) {
        const res = await apiClient.post("/closed-days/bulk_create/", {
          business: business.id,
          closed_days: closedDays.map((dayKey) => ({
            day_of_week: DAY_KEY_MAP[dayKey],
          })),
        });
        const created: any[] = Array.isArray(res.data)
          ? res.data
          : (res.data?.closed_days ?? []);
        setClosedDayRecords(created.map((cd: any) => ({ id: cd.id, day_of_week: cd.day_of_week })));
      } else {
        setClosedDayRecords([]);
      }
    } catch {
      // non-fatal
    }

    await onSubmit({ website, onboarding_step: 2 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hoursError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{hoursError}</AlertDescription>
        </Alert>
      )}

      {photoError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{photoError}</AlertDescription>
        </Alert>
      )}

      {/* Top section: Hours (2/3) + Closed Days & Website (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Hours */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-semibold text-gray-900 text-base">
              営業時間 / Hours
            </h3>
            <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              必須
            </span>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-[#cfd6df] bg-white">
            <div className="grid grid-cols-7 border-b border-[#cfd6df] bg-[#dddddd]">
              {DAYS_OF_WEEK.map((day, index) => {
                const isActive = activeHoursDay === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setActiveHoursDay(day.key)}
                    className={`px-1 py-1 text-center text-[clamp(0.7rem,1.5vw,1rem)] font-black tracking-[-0.04em] transition-colors ${
                      index < DAYS_OF_WEEK.length - 1 ? "border-r border-[#cfd6df]" : ""
                    } ${isActive ? "bg-white text-black" : "bg-[#dddddd] text-black"}`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 px-3 py-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={!activeDayClosed}
                  onCheckedChange={() => toggleClosed(activeHoursDay)}
                  disabled={loading}
                  className="data-[state=checked]:bg-emerald-600 scale-125"
                />

                {activeDayClosed ? (
                  <div className="rounded-[12px] border border-[#cfd6df] px-5 py-3 text-sm font-semibold text-gray-500">
                    定休日 / Closed
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-3">
                    {/* First shift */}
                    <div className="flex flex-wrap items-center gap-1">
                      <TimeSpinner
                        value={activeDayHours?.open || "11:00"}
                        onChange={(v) => handleHoursChange(activeHoursDay, "open", v)}
                        disabled={loading}
                      />
                      <span className="text-[28px] font-medium text-gray-500 leading-none">~</span>
                      <TimeSpinner
                        value={activeDayHours?.close || "23:00"}
                        onChange={(v) => handleHoursChange(activeHoursDay, "close", v)}
                        disabled={loading}
                      />
                      <span className="text-[17px] font-medium text-gray-500 leading-none">L.O.</span>
                      <TimeSpinner
                        value={activeDayHours?.lastOrder || "22:30"}
                        onChange={(v) => handleHoursChange(activeHoursDay, "lastOrder", v)}
                        disabled={loading}
                      />
                    </div>
                    {/* Second shift fields (no toggle) */}
                    {activeDayHours?.hasSecondShift && (
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <TimeSpinner
                          value={activeDayHours?.open2 || "17:00"}
                          onChange={(v) => handleHoursChange(activeHoursDay, "open2", v)}
                          disabled={loading}
                        />
                        <span className="text-[28px] font-medium text-gray-500 leading-none">~</span>
                        <TimeSpinner
                          value={activeDayHours?.close2 || "22:00"}
                          onChange={(v) => handleHoursChange(activeHoursDay, "close2", v)}
                          disabled={loading}
                        />
                        <span className="text-[17px] font-medium text-gray-500 leading-none">L.O.</span>
                        <TimeSpinner
                          value={activeDayHours?.lastOrder2 || "21:30"}
                          onChange={(v) => handleHoursChange(activeHoursDay, "lastOrder2", v)}
                          disabled={loading}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            24時間営業の場合は、同じ時間を設定してください
          </p>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-1">
          {/* Website */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="font-semibold text-gray-900 text-base">
                ウェブサイト / Website
              </h3>
              <span className="text-xs text-gray-400">(任意)</span>
            </div>
            <div className="relative">
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="pr-10 rounded-xl border-gray-200 h-11"
                disabled={loading}
              />
              <Globe className="h-4 w-4 absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 text-base mb-5">
          写真 / Photos
        </h3>
        <div>
          {/* Additional photos */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              追加の写真（最大6枚）
            </p>
            <div className="flex flex-wrap gap-2">
              {galleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shrink-0"
                >
                  <img
                    src={photo.url}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    disabled={deletingPhotoId !== null}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingPhotoId === photo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    ) : (
                      <X className="h-3 w-3 text-gray-600" />
                    )}
                  </button>
                </div>
              ))}
              {galleryUploading && (
                <div className="w-20 h-20 rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
              {galleryPhotos.length < 6 && !galleryUploading && (
                <>
                  <input
                    ref={photosInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handlePhotosUpload}
                  />
                  <button
                    type="button"
                    onClick={() => photosInputRef.current?.click()}
                    disabled={loading}
                    className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-gray-400 hover:bg-gray-50 transition-all shrink-0"
                  >
                    <Plus className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-400 leading-tight text-center">
                      写真を追加
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading || galleryUploading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-xl font-semibold text-base flex items-center justify-center gap-2"
        >
          {loading ? (
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
