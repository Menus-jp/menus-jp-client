"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBusinessApi } from "@/lib/hooks/useBusinessApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  AlertCircle,
  ChevronRight,
  Crown,
  Edit2,
  Globe,
  LogOut,
  MapPin,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { BusinessProfile } from "@/lib/types/business";

// ---------- Constants & helpers ----------

type BusinessCategory =
  | "restaurant"
  | "hair_salon"
  | "barbershop"
  | "spa"
  | "gym";

interface CategoryMeta {
  emoji: string;
  labelJp: string;
  labelEn: string;
}

const CATEGORY_META: Record<BusinessCategory, CategoryMeta> = {
  restaurant: { emoji: "🍽️", labelJp: "レストラン", labelEn: "Restaurant" },
  hair_salon: { emoji: "💇", labelJp: "美容院", labelEn: "Hair Salon" },
  barbershop: { emoji: "💈", labelJp: "バーバー", labelEn: "Barbershop" },
  spa: { emoji: "🧖", labelJp: "スパ", labelEn: "Spa" },
  gym: { emoji: "🏋️", labelJp: "ジム", labelEn: "Gym" },
};

const FALLBACK_CATEGORY_META: CategoryMeta = {
  emoji: "📍",
  labelJp: "その他",
  labelEn: "Other",
};

const ONBOARDING_TOTAL_STEPS = 4;

const HOSTNAME_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function getCategoryMeta(category: string): CategoryMeta {
  return (
    (CATEGORY_META as Record<string, CategoryMeta>)[category] ??
    FALLBACK_CATEGORY_META
  );
}

function getOnboardingProgress(step: number): number {
  const clamped = Math.max(0, Math.min(ONBOARDING_TOTAL_STEPS, step));
  return Math.round((clamped / ONBOARDING_TOTAL_STEPS) * 100);
}

function isValidHostname(host: string): boolean {
  return HOSTNAME_RE.test(host.trim());
}

function getPublicUrl(
  business: Pick<BusinessProfile, "custom_domain" | "slug">,
): string {
  if (business.custom_domain && isValidHostname(business.custom_domain)) {
    return `https://${business.custom_domain}`;
  }
  return `https://${business.slug}.menus.jp`;
}

function normalizeBusinesses(data: unknown): BusinessProfile[] {
  if (Array.isArray(data)) return data as BusinessProfile[];
  if (data && typeof data === "object" && "results" in data) {
    const results = (data as { results: unknown }).results;
    if (Array.isArray(results)) return results as BusinessProfile[];
  }
  return [];
}

// ---------- Filtering ----------

type StatusFilter = "all" | "published" | "draft";

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  labelJp: string;
  labelEn: string;
}> = [
  { value: "all", labelJp: "すべて", labelEn: "All" },
  { value: "published", labelJp: "公開中", labelEn: "Live" },
  { value: "draft", labelJp: "下書き", labelEn: "Draft" },
];

function matchesQuery(business: BusinessProfile, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    business.business_name.toLowerCase().includes(needle) ||
    (business.address?.toLowerCase().includes(needle) ?? false) ||
    (business.slug?.toLowerCase().includes(needle) ?? false)
  );
}

function matchesStatus(
  business: BusinessProfile,
  status: StatusFilter,
): boolean {
  if (status === "all") return true;
  if (status === "published") return business.is_published;
  return !business.is_published;
}

function matchesCategory(
  business: BusinessProfile,
  category: BusinessCategory | "all",
): boolean {
  return category === "all" || business.category === category;
}

// ---------- Small UI atoms ----------

function StatusBadge({ published }: { published: boolean }) {
  const base =
    "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full";
  return published ? (
    <span role="status" className={`${base} bg-emerald-500 text-white`}>
      <span
        className="w-1.5 h-1.5 rounded-full bg-white inline-block"
        aria-hidden="true"
      />
      公開中 / Live
    </span>
  ) : (
    <span
      role="status"
      className={`${base} bg-gray-900/80 text-white backdrop-blur-sm`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"
        aria-hidden="true"
      />
      下書き / Draft
    </span>
  );
}

interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Pill({ active, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
        active
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Skeletons ----------

function BusinessCardSkeleton() {
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="h-36 bg-gray-100" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-1.5 bg-gray-100 rounded-full w-full" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ---------- Business card ----------

const BusinessCard = React.memo(function BusinessCard({
  business,
}: {
  business: BusinessProfile;
}) {
  const meta = getCategoryMeta(business.category);
  const progress = getOnboardingProgress(business.onboarding_step);
  const publicUrl = getPublicUrl(business);
  const isComplete = progress >= 100;
  const stepLabel = `${Math.min(
    business.onboarding_step,
    ONBOARDING_TOTAL_STEPS,
  )}/${ONBOARDING_TOTAL_STEPS}`;

  return (
    <article className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col">
      <Link
        href={`/manage/${business.id}`}
        aria-label={`${business.business_name} を編集`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-t-2xl"
      >
        <div className="relative h-36 bg-gray-100 overflow-hidden">
          {business.hero_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.hero_image}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition duration-300 group-hover:brightness-95"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
              <span className="text-5xl opacity-40" aria-hidden="true">
                {meta.emoji}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StatusBadge published={business.is_published} />
          </div>
          {business.plan === "premium" && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[11px] font-bold px-2 py-1 rounded-full">
                <Crown className="h-3 w-3" aria-hidden="true" />
                Premium
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl leading-none mt-0.5" aria-hidden="true">
            {meta.emoji}
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-snug truncate">
              {business.business_name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {meta.labelJp} / {meta.labelEn}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mb-4 flex-1">
          {business.address && (
            <div className="flex items-start gap-1.5 text-xs text-gray-500">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400"
                aria-hidden="true"
              />
              <span className="truncate">{business.address}</span>
            </div>
          )}
          {business.phone_number && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone
                className="h-3.5 w-3.5 shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <span>{business.phone_number}</span>
            </div>
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-gray-400">
              セットアップ / Setup — {stepLabel}
            </span>
            <span className="text-[11px] font-semibold text-gray-600">
              {progress}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="オンボーディングの進捗"
            className="w-full bg-gray-100 rounded-full h-1.5"
          >
            <div
              className={`h-1.5 rounded-full transition-all ${
                isComplete ? "bg-emerald-500" : "bg-gray-900"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm h-10 rounded-xl"
          >
            <Link
              href={`/manage/${business.id}`}
              className="flex items-center justify-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
              編集 / Edit
            </Link>
          </Button>
          {business.is_published && (
            <Button
              asChild
              variant="outline"
              className="h-10 w-10 rounded-xl border-gray-200 hover:border-gray-400 p-0"
            >
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${business.business_name} の公開ページを開く`}
                className="flex items-center justify-center"
              >
                <Globe className="h-4 w-4 text-gray-600" aria-hidden="true" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
});

// ---------- Add-business tile ----------

function AddBusinessTile() {
  return (
    <Link
      href="/onboarding"
      aria-label="新規店舗を追加"
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="h-full min-h-[260px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:border-gray-500 transition-colors">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="text-center leading-tight">
          <p className="text-sm font-semibold">店舗を追加</p>
          <p className="text-xs mt-0.5">Add Business</p>
        </div>
      </div>
    </Link>
  );
}

// ---------- Filters ----------

interface BusinessFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  category: BusinessCategory | "all";
  onCategoryChange: (value: BusinessCategory | "all") => void;
}

function BusinessFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
}: BusinessFiltersProps) {
  const categoryEntries = Object.entries(CATEGORY_META) as Array<
    [BusinessCategory, CategoryMeta]
  >;

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="店舗名・住所で検索 / Search by name or address"
          aria-label="店舗を検索"
          className="pl-9 h-11 rounded-xl bg-white border-gray-200"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            active={status === opt.value}
            onClick={() => onStatusChange(opt.value)}
          >
            {opt.labelJp} / {opt.labelEn}
          </Pill>
        ))}

        <span
          className="w-px h-6 bg-gray-200 mx-1 self-center"
          aria-hidden="true"
        />

        <Pill
          active={category === "all"}
          onClick={() => onCategoryChange("all")}
        >
          全業種 / All
        </Pill>
        {categoryEntries.map(([key, meta]) => (
          <Pill
            key={key}
            active={category === key}
            onClick={() => onCategoryChange(key)}
          >
            <span aria-hidden="true">{meta.emoji}</span>
            {meta.labelJp}
          </Pill>
        ))}
      </div>
    </div>
  );
}

// ---------- Empty state ----------

interface EmptyStateProps {
  filtered?: boolean;
  onClearFilters?: () => void;
}

function EmptyState({ filtered, onClearFilters }: EmptyStateProps) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
          <Globe className="h-7 w-7 text-gray-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          該当する店舗がありません
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          No businesses match your filters.
        </p>
        {onClearFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
            className="rounded-xl"
          >
            フィルターをクリア / Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <Globe className="h-9 w-9 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        まだ店舗がありません
      </h3>
      <p className="text-gray-500 text-sm mb-8 max-w-xs">
        最初の店舗を登録して、オンラインプレゼンスを始めましょう。
        <br />
        <span className="text-gray-400">
          Create your first business to get started.
        </span>
      </p>
      <Button
        asChild
        className="bg-gray-900 hover:bg-gray-700 text-white font-semibold h-12 px-8 rounded-xl"
      >
        <Link href="/onboarding" className="flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          無料で始める / Start Free
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

// ---------- Nav ----------

interface NavUser {
  username?: string | null;
  first_name?: string | null;
  profile_picture_url?: string | null;
}

function getInitial(user: NavUser | null | undefined): string {
  return (user?.first_name?.[0] || user?.username?.[0] || "?").toUpperCase();
}

function DashboardNav({
  user,
  onLogout,
}: {
  user: NavUser | null | undefined;
  onLogout: () => void;
}) {
  const displayName = user?.first_name || user?.username || "";

  return (
    <nav className="fixed top-0 w-full bg-black z-50 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-white tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
        >
          menus.jp
        </Link>
        <div className="flex items-center gap-4">
          {user?.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_picture_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold"
              aria-hidden="true"
            >
              {getInitial(user)}
            </div>
          )}
          {displayName && (
            <span className="text-gray-300 text-sm hidden sm:block">
              {displayName}
            </span>
          )}
          <button
            type="button"
            onClick={onLogout}
            aria-label="ログアウト"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ---------- Page ----------

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { error, listBusinesses } = useBusinessApi();

  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<BusinessCategory | "all">("all");

  // Pin the latest fetcher in a ref so the effect doesn't re-fire
  // every render if `listBusinesses` isn't memoized in the hook.
  const listBusinessesRef = useRef(listBusinesses);
  listBusinessesRef.current = listBusinesses;

  const loadBusinesses = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const data = await listBusinessesRef.current();
      setBusinesses(normalizeBusinesses(data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "店舗の取得に失敗しました";
      setFetchError(message);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBusinesses();
  }, [loadBusinesses]);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const filtered = useMemo(
    () =>
      businesses
        .filter((b) => matchesQuery(b, query))
        .filter((b) => matchesStatus(b, status))
        .filter((b) => matchesCategory(b, category)),
    [businesses, query, status, category],
  );

  const isFiltered =
    query.trim() !== "" || status !== "all" || category !== "all";

  const clearFilters = useCallback(() => {
    setQuery("");
    setStatus("all");
    setCategory("all");
  }, []);

  const surfacedError = fetchError ?? error;

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardNav user={user} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
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
                <span className="ml-2 text-gray-400">
                  — {businesses.length}件
                </span>
              )}
            </p>
          </div>
          <Button
            asChild
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold h-11 px-5 rounded-xl"
          >
            <Link href="/onboarding" className="flex items-center gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>新規登録 / Add Business</span>
            </Link>
          </Button>
        </header>

        {surfacedError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{surfacedError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadBusinesses()}
              >
                再試行 / Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!fetchLoading && businesses.length > 0 && (
          <BusinessFilters
            query={query}
            onQueryChange={setQuery}
            status={status}
            onStatusChange={setStatus}
            category={category}
            onCategoryChange={setCategory}
          />
        )}

        {fetchLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <EmptyState filtered onClearFilters={clearFilters} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
            {!isFiltered && <AddBusinessTile />}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
