"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { BusinessProfile, BookingLink, SocialLink, OrderLink } from "@/lib/types/business";
import apiClient from "@/lib/api/auth";
import {
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

interface Step3FormProps {
  business: BusinessProfile;
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  isNew?: boolean;
}

interface ApiErrorPayload {
  message?: string;
  detail?: string;
}

interface ApiErrorLike {
  response?: {
    data?: ApiErrorPayload;
  };
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
  const [order, setOrder] = useState<Record<OrderPlatformKey, LinkState>>(initOrderState);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing links on mount
  useEffect(() => {
    if (isNew) return;
    Promise.all([
      apiClient.get(`/booking-links/?business=${business.id}`),
      apiClient.get(`/order-links/?business=${business.id}`),
      apiClient.get(`/social-links/?business=${business.id}`),
    ])
      .then(([bRes, oRes, sRes]) => {
        const bLinks: BookingLink[] = bRes.data.results ?? bRes.data;
        const oLinks: OrderLink[] = oRes.data.results ?? oRes.data;
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

        setOrder((prev) => {
          const next = { ...prev };
          for (const link of oLinks) {
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
  }, [business.id, isNew]);
  const updateOrder = (key: OrderPlatformKey, patch: Partial<LinkState>) =>
    setOrder((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleOrderUrlChange = (key: OrderPlatformKey, url: string) =>
    updateOrder(key, { url });

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
    const missingOrder = ORDER_PLATFORMS.filter(
      (def) => order[def.key].enabled && !order[def.key].url.trim(),
    ).map((def) => def.label);
    const missing = [...missingBooking, ...missingOrder, ...missingSocial];
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

      // Sync order links
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
                  business: business.id,
                  platform: def.key,
                  url: s.url,
                  is_primary: false,
                  display_order: ORDER_PLATFORMS.indexOf(def),
                })
                .then((res) => updateOrder(def.key, { id: res.data.id })),
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/order-links/${s.id}/`)
              .then(() => updateOrder(def.key, { id: null })),
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
    } catch (err: unknown) {
      const apiError = err as ApiErrorLike;
      setSaveError(
        apiError.response?.data?.message ||
          apiError.response?.data?.detail ||
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

      <BusinessLinksEditor
        booking={booking}
        order={order}
        social={social}
        disabled={isLoading}
        onBookingChange={handleBookingUrlChange}
        onBookingToggle={(key, enabled) => updateBooking(key, { enabled })}
        onOrderChange={handleOrderUrlChange}
        onOrderToggle={(key, enabled) => updateOrder(key, { enabled })}
        onSocialChange={handleSocialUrlChange}
        onSocialToggle={(key, enabled) => updateSocial(key, { enabled })}
      />

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
