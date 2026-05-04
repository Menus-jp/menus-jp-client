"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBusinessApi } from "@/lib/hooks/useBusinessApi";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Edit2,
  Globe,
  LogOut,
  MapPin,
  Phone,
  Plus,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BusinessProfile } from "@/lib/types/business";
import { NoticeAddDialog } from "@/components/business/notice-add-dialog";
import { useBusinessNotices } from "@/lib/hooks/useBusinessNotices";

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

function StatusBadge({ published }: { published: boolean }) {
  const base =
    "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full";
  return published ? (
    <span role="status" className={`${base} bg-[var(--primary-lighter)] text-white`}>
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
          ? "bg-[var(--text-dark)] text-white"
          : "bg-white text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gray-400"
      }`}
    >
      {children}
    </button>
  );
}

function BusinessCardSkeleton() {
  return (
    <div
      className="bg-white border border-[var(--border-color)] rounded-2xl overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="h-44 bg-[var(--bg-lighter)]" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--bg-lighter)] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--bg-lighter)] rounded w-3/4" />
            <div className="h-3 bg-[var(--bg-lighter)] rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-[var(--bg-lighter)] rounded w-full" />
          <div className="h-3 bg-[var(--bg-lighter)] rounded w-2/3" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-[var(--bg-lighter)] rounded w-full" />
          <div className="h-1.5 bg-[var(--bg-lighter)] rounded-full w-full" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-[var(--bg-lighter)] rounded-xl" />
          <div className="h-10 w-24 bg-[var(--bg-lighter)] rounded-xl" />
          <div className="w-10 h-10 bg-[var(--bg-lighter)] rounded-full" />
        </div>
      </div>
    </div>
  );
}


const BusinessCard = React.memo(function BusinessCard({
  business,
  onPublishToggle,
  noticesCollapsed,
  onNoticesCollapsedChange,
}: {
  business: BusinessProfile;
  onPublishToggle?: (id: number, publish: boolean) => Promise<void>;
  noticesCollapsed: boolean;
  onNoticesCollapsedChange: (collapsed: boolean) => void;
}) {
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const { 
    notices, 
    addNotice, 
    editNotice, 
    removeNotice,
    loading: noticeLoading,
    fetchNotices 
  } = useBusinessNotices();

  // Fetch notices on mount (once per business card)
  const fetchNoticesRef = React.useRef(false);
  React.useEffect(() => {
    if (!fetchNoticesRef.current) {
      fetchNoticesRef.current = true;
      void fetchNotices();
    }
  }, [fetchNotices]);

  const handleAddNotice = async (text: string, expires_at?: string | null) => {
    if (editingNoticeId !== null) {
      await editNotice(editingNoticeId, text, expires_at);
      setEditingNoticeId(null);
    } else {
      await addNotice(business.id, text, expires_at);
    }
  };

  const handleEditNotice = (noticeId: number) => {
    setEditingNoticeId(noticeId);
    setNoticeDialogOpen(true);
  };

  const handleDeleteNotice = async (noticeId: number) => {
    await removeNotice(noticeId);
  };

  const editingNotice = editingNoticeId 
    ? notices.find((n) => n.id === editingNoticeId) 
    : null;

  // Filter notices for this business only
  const businessNotices = notices.filter((n) => n.business === business.id);

  const meta = getCategoryMeta(business.category);
  const progress = getOnboardingProgress(business.onboarding_step);
  const publicUrl = getPublicUrl(business);
  const isComplete = progress >= 100;
  const stepLabel = `${Math.min(
    business.onboarding_step,
    ONBOARDING_TOTAL_STEPS,
  )}/${ONBOARDING_TOTAL_STEPS}`;
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onPublishToggle || toggling) return;
    setToggling(true);
    try {
      await onPublishToggle(business.id, !business.is_published);
    } finally {
      setToggling(false);
    }
  };

  return (
    <article className="group bg-white border border-[var(--border-color)] rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col">
      <Link
        href={`/${business.slug}`}
        aria-label={`${business.business_name} のページを見る`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-t-2xl"
      >
      <div className="relative h-44 bg-[var(--bg-lighter)] overflow-hidden">
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

        <div className="absolute top-3 right-3">
          {business.is_published ? (
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling}
              aria-label="Unpublish"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-gray-800/80 text-white backdrop-blur-sm hover:bg-gray-700/90 transition-colors disabled:opacity-60"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" aria-hidden="true" />
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling}
              aria-label="Publish"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-[var(--primary-lighter)] text-white hover:bg-[var(--primary-light)] transition-colors disabled:opacity-60"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" aria-hidden="true" />
              Publish
            </button>
          )}
        </div>
      </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-lighter)] border border-[var(--border-light)] flex items-center justify-center">
            {business.hero_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.hero_image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl" aria-hidden="true">{meta.emoji}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--text-dark)] text-base leading-snug truncate">
              {business.business_name}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {meta.labelJp} / {meta.labelEn}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mb-4 flex-1">
          {business.address && (
            <div className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
              <span className="truncate">{business.address}</span>
            </div>
          )}
          {business.phone_number && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Phone
                className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
              <span>{business.phone_number}</span>
            </div>
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Setup —{stepLabel}
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {progress}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
            className="w-full bg-[var(--bg-lighter)] rounded-full h-1.5"
          >
            <div
              className={`h-1.5 rounded-full transition-all ${
                isComplete ? "bg-[var(--primary-lighter)]" : "bg-[var(--text-dark)]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-[var(--text-dark)] hover:bg-gray-700 text-white font-semibold text-sm h-10 rounded-xl"
          >
            <Link
              href={`/manage/${business.id}`}
              className="flex items-center justify-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <Button
            className="bg-[var(--accent-gold)] hover:bg-[var(--accent-yellow)] text-white font-semibold text-sm h-10 px-4 rounded-xl border-0"
            type="button"
            onClick={() => {
              setEditingNoticeId(null);
              setNoticeDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Notice
          </Button>
          <NoticeAddDialog
            open={noticeDialogOpen}
            onOpenChange={setNoticeDialogOpen}
            onSubmit={handleAddNotice}
            loading={noticeLoading}
            notice={editingNotice}
          />
          {business.is_published && (
            <Button
              asChild
              variant="outline"
              className="h-10 w-10 rounded-full border-[var(--border-color)] hover:border-gray-400 p-0 flex-shrink-0"
            >
              <Link
                href={`/${business.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${business.business_name} の公開ページを開く`}
                className="flex items-center justify-center"
              >
                <Globe className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>

        {businessNotices.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4">
            {businessNotices.length >= 1 ? (
              <button
                type="button"
                onClick={() => onNoticesCollapsedChange(!noticesCollapsed)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-dark)] transition-colors"
              >
                <span>お知らせ / Notices ({businessNotices.length})</span>
                <ChevronDown
                  className="h-4 w-4 transition-transform"
                  style={{
                    transform: noticesCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  }}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                お知らせ / Notices ({businessNotices.length})
              </p>
            )}
            {!noticesCollapsed && (
              <div className="space-y-2">
                {businessNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="bg-white border border-[var(--border-color)] rounded-lg p-4 flex items-start gap-3 hover:border-gray-400 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-dark)] font-medium line-clamp-2">
                        {notice.text}
                      </p>
                      {notice.expires_at && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">
                          有効期限: {new Date(notice.expires_at).toLocaleDateString("ja-JP")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditNotice(notice.id)}
                        aria-label="編集"
                        className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50"
                        disabled={noticeLoading}
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNotice(notice.id)}
                        aria-label="削除"
                        className="inline-flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50"
                        disabled={noticeLoading}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
});


function AddBusinessTile() {
  return (
    <Link
      href="/onboarding"
      aria-label="新規店舗を追加"
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="h-full min-h-[260px] border-2 border-dashed border-[var(--border-color)] rounded-2xl flex flex-col items-center justify-center gap-3 text-[var(--text-tertiary)] hover:border-gray-400 hover:text-[var(--text-secondary)] transition-colors">
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


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[var(--bg-lighter)] flex items-center justify-center mb-6">
        <Globe className="h-9 w-9 text-[var(--text-tertiary)]" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-[var(--text-dark)] mb-2">
        まだ店舗がありません
      </h3>
      <p className="text-[var(--text-secondary)] text-sm mb-8 max-w-xs">
        最初の店舗を登録して、オンラインプレゼンスを始めましょう。
        <br />
        <span className="text-[var(--text-tertiary)]">
          Create your first business to get started.
        </span>
      </p>
      <Button
        asChild
        className="bg-[var(--text-dark)] hover:bg-gray-700 text-white font-semibold h-12 px-8 rounded-xl"
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
  onDeleteBusiness,
}: {
  user: NavUser | null | undefined;
  onLogout: () => void;
  onDeleteBusiness: () => void;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="メニュー"
                className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-1"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-gray-700">
              <DropdownMenuItem
                onSelect={onDeleteBusiness}
                variant="destructive"
                className="text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                店舗を削除 / Delete Business
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onLogout}
                className="text-gray-300"
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                ログアウト / Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { error, listBusinesses, publishBusiness, unpublishBusiness, deleteBusiness } = useBusinessApi();

  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBusinessForDelete, setSelectedBusinessForDelete] = useState<number | null>(null);
  const [showFinalDeleteConfirm, setShowFinalDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [collapsedNotices, setCollapsedNotices] = useState<Record<number, boolean>>({});

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

  const handleOpenDeleteDialog = useCallback(() => {
    setShowDeleteDialog(true);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedBusinessForDelete === null) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteBusiness(selectedBusinessForDelete);
      setBusinesses((prev) => 
        prev.filter((b) => b.id !== selectedBusinessForDelete)
      );
      setShowDeleteDialog(false);
      setSelectedBusinessForDelete(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "店舗の削除に失敗しました";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedBusinessForDelete, deleteBusiness]);

  const handlePublishToggle = useCallback(
    async (id: number, publish: boolean) => {
      try {
        if (publish) {
          await publishBusiness(id);
        } else {
          await unpublishBusiness(id);
        }
        setBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, is_published: publish } : b)),
        );
      } catch {
        // error already surfaced via hook
      }
    },
    [publishBusiness, unpublishBusiness],
  );

  const surfacedError = fetchError ?? error;

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <DashboardNav user={user} onLogout={handleLogout} onDeleteBusiness={handleOpenDeleteDialog} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">
              店舗を削除 / Delete Business
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              削除する店舗を選択してください。この操作は取り消せません。
              <br />
              Select a business to delete. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{deleteError}</p>
            </div>
          )}

          {businesses.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              削除可能な店舗がありません。
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  type="button"
                  onClick={() => setSelectedBusinessForDelete(business.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedBusinessForDelete === business.id
                      ? "bg-red-50 border-red-300"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{business.business_name}</p>
                  <p className="text-sm text-gray-500">{business.category}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <AlertDialogCancel
              className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
              disabled={isDeleting}
            >
              キャンセル / Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setShowFinalDeleteConfirm(true)}
              disabled={selectedBusinessForDelete === null || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeleting ? "削除中..." : "削除 / Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFinalDeleteConfirm} onOpenChange={(open) => {
        setShowFinalDeleteConfirm(open);
        if (!open) {
          // Reset when dialog is closed
          setSelectedBusinessForDelete(null);
          setShowDeleteDialog(false);
        }
      }}>
        <AlertDialogContent className="bg-white border-gray-200 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              本当に削除してもよろしいですか？/ Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {selectedBusinessForDelete !== null && (
                <>
                  <span className="font-semibold text-gray-900">
                    {businesses.find(b => b.id === selectedBusinessForDelete)?.business_name}
                  </span>
                  を削除します。この操作は取り消せません。
                  <br />
                  You are about to delete{" "}
                  <span className="font-semibold text-gray-900">
                    {businesses.find(b => b.id === selectedBusinessForDelete)?.business_name}
                  </span>
                  . This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel
              className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
              disabled={isDeleting}
            >
              キャンセル / Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleConfirmDelete();
                setShowFinalDeleteConfirm(false);
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeleting ? "削除中..." : "削除 / Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
              Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-dark)] leading-tight">
              店舗管理
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Manage your businesses
              {!fetchLoading && businesses.length > 0 && (
                <span className="ml-2 text-[var(--text-tertiary)]">
                  — {businesses.length}件
                </span>
              )}
            </p>
          </div>
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

        {fetchLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onPublishToggle={handlePublishToggle}
                noticesCollapsed={collapsedNotices[business.id] ?? true}
                onNoticesCollapsedChange={(collapsed) =>
                  setCollapsedNotices((prev) => ({
                    ...prev,
                    [business.id]: collapsed,
                  }))
                }
              />
            ))}
            <AddBusinessTile />
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