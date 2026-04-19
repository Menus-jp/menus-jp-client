'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useBusinessApi } from '@/lib/hooks/useBusinessApi';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit2, Plus, Loader2, AlertCircle, Globe, LogOut, MapPin, Phone, ChevronRight, Crown } from 'lucide-react';
import { BusinessProfile } from '@/lib/types/business';

// ── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: string; labelJp: string; labelEn: string }> = {
  restaurant: { icon: '🍽️', labelJp: 'レストラン', labelEn: 'Restaurant'  },
  hair_salon: { icon: '💇', labelJp: '美容院',     labelEn: 'Hair Salon'  },
  barbershop: { icon: '💈', labelJp: 'バーバー',   labelEn: 'Barbershop'  },
  spa:        { icon: '🧖', labelJp: 'スパ',       labelEn: 'Spa'         },
  gym:        { icon: '🏋️', labelJp: 'ジム',       labelEn: 'Gym'         },
};

// ── Business card ────────────────────────────────────────────────────────────

function BusinessCard({ business }: { business: BusinessProfile }) {
  const meta    = CATEGORY_META[business.category] ?? { icon: '📍', labelJp: 'その他', labelEn: 'Other' };
  const progress = Math.min((business.onboarding_step / 4) * 100, 100);
  const publicUrl = business.custom_domain
    ? `https://${business.custom_domain}`
    : `https://${business.slug}.menus.jp`;

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200">

      {/* Hero image / placeholder */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {business.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.hero_image}
            alt={business.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <span className="text-5xl opacity-40">{meta.icon}</span>
          </div>
        )}

        {/* Published / Draft badge */}
        <div className="absolute top-3 left-3">
          {business.is_published ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              公開中 / Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-gray-800/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
              下書き / Draft
            </span>
          )}
        </div>

        {/* Plan badge */}
        {business.plan === 'premium' && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[11px] font-bold px-2 py-1 rounded-full">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">

        {/* Title row */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl leading-none mt-0.5">{meta.icon}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-snug truncate">
              {business.business_name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {meta.labelJp} / {meta.labelEn}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-4">
          {business.address && (
            <div className="flex items-start gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
              <span className="truncate">{business.address}</span>
            </div>
          )}
          {business.phone_number && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span>{business.phone_number}</span>
            </div>
          )}
        </div>

        {/* Setup progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-gray-400">
              セットアップ / Setup — {business.onboarding_step}/4
            </span>
            <span className="text-[11px] font-semibold text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                progress >= 100 ? 'bg-emerald-500' : 'bg-gray-800'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/manage/${business.id}`} className="flex-1">
            <Button
              className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm h-10 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              編集 / Edit
            </Button>
          </Link>
          {business.is_published && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="h-10 w-10 rounded-xl border-gray-200 hover:border-gray-400 p-0 flex items-center justify-center"
              >
                <Globe className="h-4 w-4 text-gray-600" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main content ────────────────────────────────────────────────────────────

function ManageContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { error, listBusinesses } = useBusinessApi();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listBusinesses();
        setBusinesses(data.results ?? data ?? []);
      } catch {
        // error surfaced via hook
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [listBusinesses]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full bg-black z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">
            menus.jp
          </Link>
          <div className="flex items-center gap-4">
            {user?.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile_picture_url}
                alt={user.first_name || user.username}
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold">
                {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
              </div>
            )}
            <span className="text-gray-300 text-sm hidden sm:block">
              {user?.first_name || user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              店舗管理
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your businesses
              {!fetchLoading && businesses.length > 0 && (
                <span className="ml-2 text-gray-400">— {businesses.length}件</span>
              )}
            </p>
          </div>
          <Link href="/onboarding">
            <Button className="bg-gray-900 hover:bg-gray-700 text-white font-semibold h-11 px-5 rounded-xl flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>新規登録 / Add Business</span>
            </Button>
          </Link>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {fetchLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>

        ) : businesses.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Globe className="h-9 w-9 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">まだ店舗がありません</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-xs">
              最初の店舗を登録して、オンラインプレゼンスを始めましょう。
              <br />
              <span className="text-gray-400">Create your first business to get started.</span>
            </p>
            <Link href="/onboarding">
              <Button className="bg-gray-900 hover:bg-gray-700 text-white font-semibold h-12 px-8 rounded-xl flex items-center gap-2">
                <Plus className="h-4 w-4" />
                無料で始める / Start Free
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

        ) : (
          // Business grid
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {businesses.map(business => (
              <BusinessCard key={business.id} business={business} />
            ))}

            {/* Add another card */}
            <Link href="/onboarding" className="group">
              <div className="h-full min-h-[260px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:border-gray-500 transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="text-center leading-tight">
                  <p className="text-sm font-semibold">店舗を追加</p>
                  <p className="text-xs mt-0.5">Add Business</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page export ──────────────────────────────────────────────────────────────

export default function ManagePage() {
  return (
    <ProtectedRoute>
      <ManageContent />
    </ProtectedRoute>
  );
}

