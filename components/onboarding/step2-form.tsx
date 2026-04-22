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
  Check,
  ChevronUp,
  ChevronDown,
  Upload,
  X,
  Plus,
} from "lucide-react";
import { BusinessProfile } from "@/lib/types/business";
import { Switch } from "@/components/ui/switch";
import apiClient from "@/lib/api/auth";

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

type HoursEntry = { id?: number; open: string; close: string; lastOrder: string };

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

function TimeSpinner({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(1439, timeToMins(value) + delta)); // 1439 = 23:59
    onChange(minsToTime(next));
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-lg bg-white w-[80px] select-none overflow-hidden">
      <span className="flex-1 text-sm font-medium px-2.5 py-2 text-gray-900 leading-none">
        {value}
      </span>
      <div className="flex flex-col border-l border-gray-200 shrink-0">
        <button
          type="button"
          onClick={() => adjust(30)}
          className="flex items-center justify-center px-1.5 py-1 hover:bg-gray-50 border-b border-gray-200"
          disabled={disabled}
        >
          <ChevronUp className="h-3 w-3 text-gray-400" />
        </button>
        <button
          type="button"
          onClick={() => adjust(-30)}
          className="flex items-center justify-center px-1.5 py-1 hover:bg-gray-50"
          disabled={disabled}
        >
          <ChevronDown className="h-3 w-3 text-gray-400" />
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
  const [hours, setHours] = useState<Record<string, HoursEntry>>(() => {
    const init: Record<string, HoursEntry> = {};
    DAYS_OF_WEEK.forEach((d) => {
      init[d.key] = { open: "11:00", close: "23:59", lastOrder: "23:00" };
    });
    return init;
  });
  const [closedDays, setClosedDays] = useState<string[]>([]);
  // IDs of existing ClosedDay records (needed to delete before recreating)
  const [closedDayRecords, setClosedDayRecords] = useState<{ id: number; day_of_week: string }[]>([]);

  // Photo state — tracks server-persisted photos (id + url)
  const [heroPhoto, setHeroPhoto] = useState<PhotoEntry | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoEntry[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  // Load existing photos, hours and closed days on mount
  useEffect(() => {
    if (isNew) return;
    Promise.all([
      apiClient.get(`/business-photos/?business=${business.id}`),
      apiClient.get(`/business-hours/?business=${business.id}`),
      apiClient.get(`/closed-days/?business=${business.id}`),
    ])
      .then(([photosRes, hoursRes, closedRes]) => {
        // Photos
        const photos: any[] = photosRes.data.results ?? photosRes.data;
        const hero = photos.find((p: any) => p.is_hero);
        const gallery = photos.filter((p: any) => !p.is_hero);
        if (hero) setHeroPhoto({ id: hero.id, url: hero.image_url || hero.image });
        setGalleryPhotos(gallery.map((p: any) => ({ id: p.id, url: p.image_url || p.image })));

        // Hours — map API records into state (preserving IDs)
        const existingHours: any[] = hoursRes.data.results ?? hoursRes.data;
        if (existingHours.length > 0) {
          const mapped: Record<string, HoursEntry> = {};
          DAYS_OF_WEEK.forEach((d) => {
            mapped[d.key] = { open: "11:00", close: "23:59", lastOrder: "23:00" };
          });
          existingHours.forEach((h: any) => {
            const day = DAYS_OF_WEEK.find((d) => DAY_KEY_MAP[d.key] === h.day_of_week);
            if (!day) return;
            const toDisplay = (t: string | null) => (t ? t.slice(0, 5) : "00:00");
            mapped[day.key] = {
              id: h.id,
              open: toDisplay(h.opening_time) || "11:00",
              close: toDisplay(h.closing_time) || "23:59",
              lastOrder: toDisplay(h.last_order_time) || "23:00",
            };
          });
          setHours(mapped);
        }

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
  }, [business.id]);

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

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately — visible even during upload
    const localUrl = URL.createObjectURL(file);
    setHeroPreview(localUrl);
    setPhotoError(null);
    setHeroUploading(true);
    let deletedPrev = false;
    try {
      // Replace existing hero: delete first
      if (heroPhoto) {
        await apiClient.delete(`/business-photos/${heroPhoto.id}/`);
        deletedPrev = true;
        // Don't clear heroPhoto state yet — only after new upload succeeds
      }
      const fd = new FormData();
      fd.append("business", String(business.id));
      fd.append("image", file);
      fd.append("is_hero", "true");
      fd.append("display_order", "0");
      const res = await apiClient.post("/business-photos/", fd, {
        headers: { "Content-Type": undefined },
      });
      setHeroPhoto({ id: res.data.id, url: res.data.image_url });
      setHeroPreview(null); // server URL takes over
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "ヒーロー画像のアップロードに失敗しました";
      setPhotoError(
        deletedPrev
          ? `${msg}。前の画像は削除されました。再度アップロードしてください。`
          : msg,
      );
      setHeroPreview(null);
      if (deletedPrev) {
        // Old hero was deleted on the server but new upload failed — reflect that in state
        setHeroPhoto(null);
      }
      // If !deletedPrev: delete itself failed, server still has the old photo, keep heroPhoto
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  };

  const handleRemoveHero = async () => {
    if (!heroPhoto) return;
    setPhotoError(null);
    setHeroUploading(true);
    try {
      await apiClient.delete(`/business-photos/${heroPhoto.id}/`);
      setHeroPhoto(null);
      setHeroPreview(null);
    } catch (err: any) {
      setPhotoError(err.response?.data?.message || "削除に失敗しました");
    } finally {
      setHeroUploading(false);
    }
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
      const msg =
        err.response?.data?.message || "写真のアップロードに失敗しました";
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
      setPhotoError(err.response?.data?.message || "削除に失敗しました");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHoursError(null);

    // Decide between bulk_create and bulk_update based on whether hours have IDs
    const existingIds = DAYS_OF_WEEK.map((d) => hours[d.key]?.id).filter(Boolean);
    const allHaveIds = existingIds.length === DAYS_OF_WEEK.length;
    const payload = DAYS_OF_WEEK.map((day) => {
      const isClosed = closedDays.includes(day.key);
      const dayHours = hours[day.key];
      return {
        ...(dayHours?.id ? { id: dayHours.id } : {}),
        day_of_week: DAY_KEY_MAP[day.key],
        is_closed: isClosed,
        opening_time: isClosed ? null : toApiTime(dayHours?.open || "11:00"),
        closing_time: isClosed ? null : toApiTime(dayHours?.close || "23:00"),
        last_order_time: isClosed ? null : toApiTime(dayHours?.lastOrder || "23:59"),
      };
    });

    try {
      if (allHaveIds) {
        await apiClient.patch("/business-hours/bulk_update/", {
          business: business.id,
          hours: payload,
        });
      } else {
        const res = await apiClient.post("/business-hours/bulk_create/", {
          business: business.id,
          hours: payload,
        });
        // Store returned IDs so a retry uses bulk_update instead of bulk_create
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

          {/* Column headers — mirrors row structure exactly */}
          <div className="flex items-center gap-6 mb-2">
            <div className="w-8 shrink-0" />
            <div className="w-10 shrink-0" />
            <div className="w-[80px] text-center text-xs font-semibold text-gray-500">
              開店
            </div>
            <div className="w-5 shrink-0" />
            <div className="w-[80px] text-center text-xs font-semibold text-gray-500">
              閉店
            </div>
            <div className="w-[80px] text-center text-xs font-semibold text-gray-500">
              L.O.（ラストオーダー）
            </div>
          </div>

          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const isClosed = closedDays.includes(day.key);
              const dayData = hours[day.key];
              return (
                <div key={day.key} className="flex items-center gap-9">
                  {/* Day label */}
                  <div className="w-8 shrink-0 flex items-baseline gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {day.display}
                    </span>
                    <span className="text-xs text-gray-400">{day.short}</span>
                  </div>
                  {/* Toggle */}
                  <div className="w-10 shrink-0">
                    <Switch
                      checked={!isClosed}
                      onCheckedChange={() => toggleClosed(day.key)}
                      disabled={loading}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  {isClosed ? (
                    <div className="flex-1 text-sm text-gray-400 font-medium">
                      定休日
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <TimeSpinner
                        value={dayData?.open || "11:00"}
                        onChange={(v) => handleHoursChange(day.key, "open", v)}
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-400 w-5 text-center">
                        〜
                      </span>
                      <TimeSpinner
                        value={dayData?.close || "23:00"}
                        onChange={(v) => handleHoursChange(day.key, "close", v)}
                        disabled={loading}
                      />
                      <TimeSpinner
                        value={dayData?.lastOrder || "23:59"}
                        onChange={(v) =>
                          handleHoursChange(day.key, "lastOrder", v)
                        }
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            24時間営業の場合は、同じ時間を設定してください
          </p>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-1">
          {/* Closed Days */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 text-base mb-4">
              定休日 / Closed Days
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = closedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleClosed(day.key)}
                    disabled={loading}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border shrink-0 ${
                        isSelected ? "border-white" : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-2 w-2 text-gray-900" />
                      )}
                    </span>
                    <span>
                      {day.display}曜日 {day.short}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
              disabled={loading}
            >
              <Plus className="h-3 w-3" />
              追加
            </button>
          </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          disabled={loading || heroUploading || galleryUploading}
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
