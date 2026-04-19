'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useBusinessApi } from '@/lib/hooks/useBusinessApi';
import apiClient from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft, ChevronRight, MapPin, Cloud, Check, X, Plus, Trash2, ImagePlus, ExternalLink, Share2, Link as LinkIcon } from 'lucide-react';
import { BusinessProfile, BusinessDetail, ClosedDay, MenuItem, BookingLink, SocialLink } from '@/lib/types/business';
import { Switch } from '@/components/ui/switch';

const DAYS_OF_WEEK = [
  { key: 'Monday',    display: '月', short: 'Mon', api: 'monday'    as const },
  { key: 'Tuesday',   display: '火', short: 'Tue', api: 'tuesday'   as const },
  { key: 'Wednesday', display: '水', short: 'Wed', api: 'wednesday' as const },
  { key: 'Thursday',  display: '木', short: 'Thu', api: 'thursday'  as const },
  { key: 'Friday',    display: '金', short: 'Fri', api: 'friday'    as const },
  { key: 'Saturday',  display: '土', short: 'Sat', api: 'saturday'  as const },
  { key: 'Sunday',    display: '日', short: 'Sun', api: 'sunday'    as const },
];

const CATEGORIES = [
  { key: 'restaurant', label: 'レストラン', icon: '🍽️' },
  { key: 'hair_salon', label: '美容院',     icon: '💇' },
  { key: 'barbershop', label: 'バーバー',   icon: '💈' },
  { key: 'spa',        label: 'スパ',       icon: '🧖' },
  { key: 'gym',        label: 'ジム',       icon: '🏋️' },
];

type HourEntry = { id?: number; open: string; close: string; lastOrder: string; closed: boolean };
type PhotoEntry = { id: number; url: string; is_hero: boolean };

// ── Menu item draft ──────────────────────────────────────────────────────────
interface MenuItemDraft {
  id?: number;
  category_jp: string;
  category_en: string;
  savedPhotos: { id: number; url: string; label?: string }[];
  pendingFiles: File[];
  pendingLabels: string[];
  isOpen: boolean;
}

function emptyMenuItem(): MenuItemDraft {
  return { category_jp: '', category_en: '', savedPhotos: [], pendingFiles: [], pendingLabels: [], isOpen: true };
}

// ── PhotoThumb ───────────────────────────────────────────────────────────────
function PhotoThumb({ src, label, pending, onRemove, disabled }: {
  src: string; label?: string; pending?: boolean; onRemove?: () => void; disabled?: boolean;
}) {
  return (
    <div className="relative group w-20 h-20 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label || ''} className={`w-20 h-20 object-cover rounded-lg border ${
        pending ? 'border-dashed border-blue-300 opacity-70' : 'border-gray-200'
      }`} />
      {pending && (
        <span className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-[9px] px-1 rounded leading-tight">未保存</span>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} disabled={disabled}
          className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Trash2 className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
}

// ── MenuItemCard ─────────────────────────────────────────────────────────────
function MenuItemCard({ item, index, disabled, onUpdate, onRemove, onRemoveSavedPhoto }: {
  item: MenuItemDraft; index: number; disabled: boolean;
  onUpdate: (patch: Partial<MenuItemDraft>) => void;
  onRemove: () => void;
  onRemoveSavedPhoto: (id: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalPhotos = item.savedPhotos.length + item.pendingFiles.length;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const toAdd = files.slice(0, 5 - totalPhotos);
    onUpdate({ pendingFiles: [...item.pendingFiles, ...toAdd], pendingLabels: [...item.pendingLabels, ...toAdd.map(() => '')] });
    e.target.value = '';
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <button type="button" className="flex-1 text-left min-w-0"
          onClick={() => onUpdate({ isOpen: !item.isOpen })}>
          <span className="text-sm font-semibold text-gray-900 truncate block">
            {item.category_jp || item.category_en || `メニューアイテム ${index + 1}`}
          </span>
        </button>
        <button type="button" onClick={onRemove} disabled={disabled}
          className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {item.isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">カテゴリ (JP)</Label>
              <Input placeholder="例: ランチ" value={item.category_jp}
                onChange={e => onUpdate({ category_jp: e.target.value })} disabled={disabled} className="text-sm h-9" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Category (EN)</Label>
              <Input placeholder="e.g. Lunch" value={item.category_en}
                onChange={e => onUpdate({ category_en: e.target.value })} disabled={disabled} className="text-sm h-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">写真 / Photos <span className="text-gray-400">({totalPhotos}/5)</span></Label>
            {totalPhotos > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {item.savedPhotos.map(p => (
                  <PhotoThumb key={p.id} src={p.url} label={p.label} onRemove={() => onRemoveSavedPhoto(p.id)} disabled={disabled} />
                ))}
                {item.pendingFiles.map((file, pidx) => (
                  <div key={`p-${pidx}`} className="flex flex-col gap-1">
                    <PhotoThumb src={URL.createObjectURL(file)} pending
                      onRemove={() => onUpdate({ pendingFiles: item.pendingFiles.filter((_, i) => i !== pidx), pendingLabels: item.pendingLabels.filter((_, i) => i !== pidx) })} disabled={disabled} />
                    <Input placeholder="ラベル" value={item.pendingLabels[pidx] ?? ''}
                      onChange={e => { const l = [...item.pendingLabels]; l[pidx] = e.target.value; onUpdate({ pendingLabels: l }); }}
                      disabled={disabled} className="text-[11px] h-6 w-20 px-1.5" />
                  </div>
                ))}
              </div>
            )}
            {totalPhotos < 5 && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5"
                onClick={() => fileInputRef.current?.click()} disabled={disabled}>
                <ImagePlus className="h-4 w-4" />
                写真を追加 / Add Photo
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilePick} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Booking & Social link sub-components ─────────────────────────────────────

function PlatformIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
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

type BookingPlatformKey = BookingLink['platform'];
type SocialPlatformKey  = SocialLink['platform'];

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
    key: 'tabelog',
    label: '食べログ',
    labelEn: 'Tabelog',
    placeholder: 'https://tabelog.com/tokyo/A1300/',
    iconBg: 'bg-amber-500',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M11 2v7H4v2h7v11h2V11h7V9h-7V2z" />
      </svg>
    ),
  },
  {
    key: 'hot_pepper_gourmet',
    label: 'HOT PEPPER グルメ',
    labelEn: 'Hot Pepper Gourmet',
    placeholder: 'https://www.hotpepper.jp/strJ000123456/',
    iconBg: 'bg-red-600',
    icon: <span className="text-white text-xs font-black tracking-tight">HP</span>,
  },
  {
    key: 'line_reservation',
    label: 'LINE で予約',
    labelEn: 'LINE',
    placeholder: 'https://lin.ee/abc123',
    iconBg: 'bg-green-500',
    icon: <LineIcon />,
  },
  {
    key: 'open_table',
    label: 'OpenTable',
    labelEn: '',
    placeholder: 'https://opentable.com/...',
    iconBg: 'bg-white border border-gray-200',
    icon: <span className="text-red-600 text-2xl font-black leading-none">•</span>,
  },
];

const SOCIAL_PLATFORMS_LEFT: SocialPlatformDef[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/@...',
    iconBg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
    icon: <InstagramIcon />,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/...',
    iconBg: 'bg-blue-600',
    icon: <FacebookIcon />,
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/...',
    iconBg: 'bg-gray-950',
    icon: <X className="w-4 h-4 text-white" />,
  },
  {
    key: 'line',
    label: 'LINE（公式アカウント）',
    placeholder: 'https://lin.ee/...',
    iconBg: 'bg-green-500',
    icon: <LineIcon />,
  },
];

const SOCIAL_PLATFORMS_RIGHT: SocialPlatformDef[] = [
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@...',
    iconBg: 'bg-red-600',
    icon: <YouTubeIcon />,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@...',
    iconBg: 'bg-gray-950',
    icon: <TikTokIcon />,
  },
  {
    key: 'custom',
    label: 'その他 / Other',
    placeholder: 'https://...',
    iconBg: 'bg-gray-400',
    icon: <LinkIcon className="w-4 h-4 text-white" />,
  },
];

const ALL_SOCIAL_PLATFORMS = [...SOCIAL_PLATFORMS_LEFT, ...SOCIAL_PLATFORMS_RIGHT];

type LinkState = { id: number | null; url: string; enabled: boolean };

function initBookingState(): Record<BookingPlatformKey, LinkState> {
  const s = {} as Record<BookingPlatformKey, LinkState>;
  for (const p of BOOKING_PLATFORMS) s[p.key] = { id: null, url: '', enabled: false };
  return s;
}

function initSocialState(): Record<SocialPlatformKey, LinkState> {
  const s = {} as Record<SocialPlatformKey, LinkState>;
  for (const p of ALL_SOCIAL_PLATFORMS) s[p.key] = { id: null, url: '', enabled: false };
  return s;
}

function BookingRow({ def, state, onChange, onToggle, disabled }: {
  def: BookingPlatformDef; state: LinkState;
  onChange: (url: string) => void; onToggle: (v: boolean) => void; disabled?: boolean;
}) {
  const hasUrl = state.url.trim() !== '';
  return (
    <div className="flex items-center gap-3 py-3">
      <Switch checked={state.enabled} onCheckedChange={onToggle} disabled={disabled}
        className="data-[state=checked]:bg-emerald-500" />
      <PlatformIcon bg={def.iconBg}>{def.icon}</PlatformIcon>
      <div className="w-36 shrink-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{def.label}</p>
        {def.labelEn && <p className="text-xs text-gray-400 leading-tight mt-0.5">{def.labelEn}</p>}
      </div>
      <div className="flex-1 relative">
        <Input type="url" value={state.url} onChange={e => onChange(e.target.value)}
          placeholder={def.placeholder} disabled={disabled}
          className="pr-9 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm placeholder:text-gray-300" />
        {hasUrl ? (
          <a href={state.url} target="_blank" rel="noopener noreferrer"
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700" tabIndex={-1}>
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <ExternalLink className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-300 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

function SocialRow({ def, state, onChange, onToggle, disabled }: {
  def: SocialPlatformDef; state: LinkState;
  onChange: (url: string) => void; onToggle: (v: boolean) => void; disabled?: boolean;
}) {
  const hasUrl = state.url.trim() !== '';
  return (
    <div className="flex items-center gap-2.5">
      <Switch checked={state.enabled} onCheckedChange={onToggle} disabled={disabled}
        className="data-[state=checked]:bg-emerald-500" />
      <PlatformIcon bg={def.iconBg}>{def.icon}</PlatformIcon>
      <div className="w-28 shrink-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight">{def.label}</p>
      </div>
      <div className="flex-1 relative">
        <Input type="url" value={state.url} onChange={e => onChange(e.target.value)}
          placeholder={def.placeholder} disabled={disabled}
          className="pr-8 h-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-xs placeholder:text-gray-300" />
        {hasUrl ? (
          <a href={state.url} target="_blank" rel="noopener noreferrer"
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-700" tabIndex={-1}>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <ExternalLink className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

function toTimeInput(t: string | null | undefined): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function toApiTime(t: string): string {
  if (!t) return '00:00:00';
  const [h, m] = t.split(':').map(Number);
  return `${String(Math.min(23, h || 0)).padStart(2, '0')}:${String(Math.min(59, m || 0)).padStart(2, '0')}:00`;
}

function defaultHours(): Record<string, HourEntry> {
  const init: Record<string, HourEntry> = {};
  DAYS_OF_WEEK.forEach(d => {
    init[d.key] = { open: '11:00', close: '23:00', lastOrder: '22:30', closed: false };
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
  } = useBusinessApi();

  const [business, setBusiness]               = useState<BusinessDetail | null>(null);
  const [formData, setFormData]               = useState<Partial<BusinessProfile>>({});
  const [fetchLoading, setFetchLoading]       = useState(true);
  const [fetchError, setFetchError]           = useState<string | null>(null);
  const [hours, setHours]                     = useState<Record<string, HourEntry>>(defaultHours);
  const [closedDays, setClosedDays]           = useState<string[]>([]);
  const [closedDayRecords, setClosedDayRecords] = useState<ClosedDay[]>([]);
  const [photos, setPhotos]                   = useState<PhotoEntry[]>([]);
  const [saving, setSaving]                   = useState(false);
  const [saveError, setSaveError]             = useState<string | null>(null);
  const [photoUploading, setPhotoUploading]   = useState(false);
  const [photoError, setPhotoError]           = useState<string | null>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const [heroUploading, setHeroUploading]     = useState(false);
  const [heroError, setHeroError]             = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [mapsUrl, setMapsUrl]                 = useState('');
  const [latitude, setLatitude]               = useState('');
  const [longitude, setLongitude]             = useState('');
  // Menu state (restaurant only)
  const [menuItems, setMenuItems]             = useState<MenuItemDraft[]>([]);
  const [menuError, setMenuError]             = useState<string | null>(null);
  const [savingMenu, setSavingMenu]           = useState(false);
  // Booking & social link state
  const [booking, setBooking] = useState<Record<BookingPlatformKey, LinkState>>(initBookingState);
  const [social, setSocial]   = useState<Record<SocialPlatformKey, LinkState>>(initSocialState);
  const [linksError, setLinksError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        // Single call — response embeds hours, closed_days, photos
        const data = await getBusinessById(businessId) as BusinessDetail;
        setBusiness(data);
        setFormData({
          business_name: data.business_name,
          address:       data.address,
          phone_number:  data.phone_number,
          website:       data.website,
        });

        // Map hours — skip bad single-char day_of_week entries from old data
        const validDayKeys = new Set(DAYS_OF_WEEK.map(d => d.api));
        const mappedHours = defaultHours();
        (data.hours ?? []).forEach(h => {
          if (!validDayKeys.has(h.day_of_week as any)) return; // skip "m", "f", etc.
          const day = DAYS_OF_WEEK.find(d => d.api === h.day_of_week);
          if (!day) return;
          mappedHours[day.key] = {
            id:        h.id,
            open:      toTimeInput(h.opening_time)    || '11:00',
            close:     toTimeInput(h.closing_time)    || '23:00',
            lastOrder: toTimeInput(h.last_order_time) || '22:30',
            closed:    h.is_closed,
          };
        });
        setHours(mappedHours);

        // Map closed days
        const closedRecords = data.closed_days ?? [];
        setClosedDayRecords(closedRecords);
        const closedKeys = closedRecords
          .map(cd => DAYS_OF_WEEK.find(d => d.api === cd.day_of_week)?.key)
          .filter(Boolean) as string[];
        setClosedDays(closedKeys);

        // Map photos
        setPhotos((data.photos ?? []).map(p => ({ id: p.id, url: p.image_url || p.image, is_hero: p.is_hero })));

        // Load location coords
        if (data.latitude != null && data.longitude != null) {
          setLatitude(String(data.latitude));
          setLongitude(String(data.longitude));
          setMapsUrl(data.maps_url || `https://www.google.com/maps?q=${data.latitude},${data.longitude}`);
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
          setMenuItems(existingItems.map(item => ({
            id: item.id,
            category_jp: item.category_jp ?? '',
            category_en: item.category_en ?? '',
            savedPhotos: (item.photos ?? []).map(p => ({ id: p.id, url: p.image_url || p.image, label: p.label })),
            pendingFiles: [],
            pendingLabels: [],
            isOpen: false,
          })));
        } else if (data.category === 'restaurant') {
          setMenuItems([emptyMenuItem()]);
        }

        // Map booking & social links from embedded response
        const bLinks = data.booking_links ?? [];
        const sLinks = data.social_links ?? [];
        if (bLinks.length > 0) {
          setBooking(prev => {
            const next = { ...prev };
            for (const link of bLinks) {
              if (link.platform in next) next[link.platform] = { id: link.id, url: link.url, enabled: true };
            }
            return next;
          });
        }
        if (sLinks.length > 0) {
          setSocial(prev => {
            const next = { ...prev };
            for (const link of sLinks) {
              if (link.platform in next) next[link.platform] = { id: link.id, url: link.url, enabled: true };
            }
            return next;
          });
        }
      } catch {
        setFetchError('データの読み込みに失敗しました');
      } finally {
        setFetchLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (day: string, field: keyof HourEntry, value: string | boolean) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleClosedDayToggle = (dayKey: string) => {
    const isClosed = closedDays.includes(dayKey);
    setClosedDays(prev => isClosed ? prev.filter(d => d !== dayKey) : [...prev, dayKey]);
    setHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], closed: !isClosed } }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      for (const [idx, file] of files.entries()) {
        const fd = new FormData();
        fd.append('business', String(businessId));
        fd.append('image', file);
        fd.append('display_order', String(photos.length + idx + 1));
        const res = await apiClient.post('/business-photos/', fd, {
          headers: { 'Content-Type': undefined },
        });
        setPhotos(prev => [...prev, { id: res.data.id, url: res.data.image_url, is_hero: !!res.data.is_hero }]);
      }
    } catch (err: any) {
      setPhotoError(err.response?.data?.message || '写真のアップロードに失敗しました');
    } finally {
      setPhotoUploading(false);
      if (photosInputRef.current) photosInputRef.current.value = '';
    }
  };

  const handleHeroUpload = async (file: File) => {
    setHeroError(null);
    setHeroUploading(true);
    try {
      const existingHero = photos.find(p => p.is_hero);
      if (existingHero) {
        await apiClient.delete(`/business-photos/${existingHero.id}/`);
        setPhotos(prev => prev.filter(p => p.id !== existingHero.id));
      }
      const fd = new FormData();
      fd.append('business', String(businessId));
      fd.append('image', file);
      fd.append('is_hero', 'true');
      fd.append('display_order', '0');
      const res = await apiClient.post('/business-photos/', fd, {
        headers: { 'Content-Type': undefined },
      });
      setPhotos(prev => [{ id: res.data.id, url: res.data.image_url, is_hero: true }, ...prev]);
    } catch (err: any) {
      setHeroError(err.response?.data?.message || 'ヒーロー画像のアップロードに失敗しました');
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
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
    setMenuItems(prev => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  const removeMenuItem = async (i: number) => {
    const item = menuItems[i];
    if (item.id) {
      try { await deleteMenuItem(item.id); } catch { setMenuError('削除に失敗しました'); return; }
    }
    setMenuItems(prev => prev.filter((_, k) => k !== i));
  };

  const removeSavedMenuPhoto = async (itemIdx: number, photoId: number) => {
    try {
      await deleteMenuItemPhoto(photoId);
      updateMenuItem2(itemIdx, { savedPhotos: menuItems[itemIdx].savedPhotos.filter(p => p.id !== photoId) });
    } catch { setMenuError('写真の削除に失敗しました'); }
  };

  const saveMenu = async (): Promise<boolean> => {
    setSavingMenu(true);
    setMenuError(null);
    try {
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        if (!item.category_jp && !item.category_en && !item.pendingFiles.length && !item.savedPhotos.length) continue;
        if (!item.id) {
          const fd = new FormData();
          fd.append('business', String(businessId));
          if (item.category_jp) fd.append('category_jp', item.category_jp);
          if (item.category_en) fd.append('category_en', item.category_en);
          item.pendingFiles.forEach((file, pidx) => {
            fd.append('photo_images', file);
            fd.append('photo_labels', item.pendingLabels[pidx] ?? '');
          });
          const created = await createMenuItem(fd);
          updateMenuItem2(i, {
            id: created.id,
            savedPhotos: (created.photos ?? []).map(p => ({ id: p.id, url: p.image_url || p.image, label: p.label })),
            pendingFiles: [], pendingLabels: [],
          });
        } else {
          await updateMenuItem(item.id, { category_jp: item.category_jp || undefined, category_en: item.category_en || undefined });
          for (let pidx = 0; pidx < item.pendingFiles.length; pidx++) {
            const pfd = new FormData();
            pfd.append('menu_item', String(item.id));
            pfd.append('image', item.pendingFiles[pidx]);
            const label = item.pendingLabels[pidx];
            if (label) pfd.append('label', label);
            const photo = await uploadMenuItemPhoto(pfd);
            setMenuItems(prev => prev.map((it, k) => k !== i ? it : {
              ...it,
              savedPhotos: [...it.savedPhotos, { id: photo.id, url: photo.image_url || photo.image, label: photo.label }],
            }));
          }
          updateMenuItem2(i, { pendingFiles: [], pendingLabels: [] });
        }
      }
      return true;
    } catch (err: any) {
      setMenuError(err?.response?.data?.message || 'メニューの保存に失敗しました');
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
        const hasUrl = s.url.trim() !== '';
        if (hasUrl && s.enabled) {
          if (s.id) {
            ops.push(apiClient.patch(`/booking-links/${s.id}/`, { url: s.url }));
          } else {
            ops.push(
              apiClient
                .post('/booking-links/', {
                  business: businessId,
                  platform: def.key,
                  url: s.url,
                  is_primary: false,
                  display_order: BOOKING_PLATFORMS.indexOf(def),
                })
                .then(res => setBooking(prev => ({ ...prev, [def.key]: { ...prev[def.key], id: res.data.id } })))
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/booking-links/${s.id}/`)
              .then(() => setBooking(prev => ({ ...prev, [def.key]: { ...prev[def.key], id: null } })))
          );
        }
      }

      for (const def of ALL_SOCIAL_PLATFORMS) {
        const s = social[def.key];
        const hasUrl = s.url.trim() !== '';
        if (hasUrl && s.enabled) {
          if (s.id) {
            ops.push(apiClient.patch(`/social-links/${s.id}/`, { url: s.url }));
          } else {
            ops.push(
              apiClient
                .post('/social-links/', {
                  business: businessId,
                  platform: def.key,
                  url: s.url,
                  display_order: ALL_SOCIAL_PLATFORMS.indexOf(def),
                })
                .then(res => setSocial(prev => ({ ...prev, [def.key]: { ...prev[def.key], id: res.data.id } })))
            );
          }
        } else if (!hasUrl && s.id) {
          ops.push(
            apiClient
              .delete(`/social-links/${s.id}/`)
              .then(() => setSocial(prev => ({ ...prev, [def.key]: { ...prev[def.key], id: null } })))
          );
        }
      }

      await Promise.all(ops);
      return true;
    } catch (err: any) {
      setLinksError(err?.response?.data?.message || 'リンクの保存に失敗しました');
      return false;
    }
  };

  const handleRemovePhoto = async (photoId: number) => {
    setPhotoError(null);
    try {
      await apiClient.delete(`/business-photos/${photoId}/`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err: any) {
      setPhotoError(err.response?.data?.message || '削除に失敗しました');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. PATCH business profile
      await updateBusiness(businessId, {
        ...formData,
        ...(mapsUrl.trim() !== '' ? { maps_url: mapsUrl.trim() } : {}),
        ...(latitude !== '' ? { latitude: parseFloat(latitude) } : {}),
        ...(longitude !== '' ? { longitude: parseFloat(longitude) } : {}),
        onboarding_step: Math.max(business?.onboarding_step || 2, 2),
      });

      // 2. Update or create hours depending on whether records already exist
      const hoursPayload = DAYS_OF_WEEK.map(day => {
        const h = hours[day.key];
        const isClosed = h?.closed ?? false;
        return {
          ...(h?.id ? { id: h.id } : {}),
          day_of_week:     day.api,
          is_closed:       isClosed,
          opening_time:    isClosed ? null : toApiTime(h?.open      || '11:00'),
          closing_time:    isClosed ? null : toApiTime(h?.close     || '23:00'),
          last_order_time: isClosed ? null : toApiTime(h?.lastOrder || '22:30'),
        };
      });

      const allHaveIds = hoursPayload.every(h => 'id' in h);
      if (allHaveIds) {
        await bulkUpdateBusinessHours(
          businessId,
          hoursPayload as Array<{ id: number; day_of_week: typeof DAYS_OF_WEEK[number]['api']; is_closed: boolean; opening_time: string | null; closing_time: string | null; last_order_time: string | null }>
        );
      } else {
        await bulkCreateBusinessHours(businessId, hoursPayload);
      }

      // 3. Delete old closed day records then re-create current selection
      await Promise.all(closedDayRecords.map(cd => deleteClosedDay(cd.id)));
      if (closedDays.length > 0) {
        const created = await bulkCreateClosedDays(
          businessId,
          closedDays.map(dayKey => {
            const day = DAYS_OF_WEEK.find(d => d.key === dayKey)!;
            return { day_of_week: day.api };
          })
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
      if (business?.category === 'restaurant') {
        const menuOk = await saveMenu();
        if (!menuOk) { setSaving(false); return; }
      }

      // 5. Save booking & social links
      const linksOk = await saveLinks();
      if (!linksOk) { setSaving(false); return; }

      router.push('/manage');
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error states ───────────────────────────────────────────────
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
              {fetchError || 'Business not found'}
            </p>
            <Link href="/manage">
              <Button variant="outline">Go back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/manage">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2">
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

          {/* ── Business Name & Category ─────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Label className="font-semibold text-gray-900">店舗名 / Business Name</Label>
                  <span className="text-red-500 text-sm">必須</span>
                </div>
                <Input
                  name="business_name"
                  value={formData.business_name || ''}
                  onChange={handleInputChange}
                  placeholder="店舗名を入力してください"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label className="font-semibold text-gray-900 mb-2 block">業種 / Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <div
                      key={cat.key}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                        cat.key === business.category
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-200 text-gray-900'
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

          {/* ── Address & Phone ──────────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label className="font-semibold text-gray-900 mb-2 block">住所 / Address</Label>
                <div className="relative">
                  <Input
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    placeholder="東京都渋谷区宇田川町1-2-3"
                    className="border-gray-300 pr-10"
                  />
                  <MapPin className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-gray-900 mb-2 block">電話番号 / Phone</Label>
                <Input
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleInputChange}
                  placeholder="03-1234-5678"
                  className="border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* ── Google Maps Location ─────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Label className="font-semibold text-gray-900">地図・座標 / Location Coordinates</Label>
              <span className="text-xs text-gray-400">(任意)</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Google Maps URL（任意）</Label>
                <Input
                  type="url"
                  value={mapsUrl}
                  onChange={e => handleMapsUrlChange(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="border-gray-300"
                />
              </div>
              {(mapsUrl || latitude || formData.address) && (() => {
                const embedSrc = latitude && longitude
                  ? `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`
                  : buildMapSrc(formData.address || '');
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

          {/* ── Website ─────────────────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="flex items-center gap-1 mb-2">
              <Label className="font-semibold text-gray-900">ウェブサイト / Website</Label>
              <span className="text-xs text-gray-400">(任意)</span>
            </div>
            <div className="relative">
              <Input
                name="website"
                type="url"
                value={formData.website || ''}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="border-gray-300 pr-10"
              />
              <span className="absolute right-3 top-3 text-gray-400 pointer-events-none">🌐</span>
            </div>
          </div>

          {/* ── Business Hours ───────────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="flex items-center gap-1 mb-4">
              <Label className="font-semibold text-gray-900">営業時間 / Business Hours</Label>
              <span className="text-red-500 text-sm">必須</span>
            </div>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map(day => {
                const h = hours[day.key];
                return (
                  <div
                    key={day.key}
                    className="flex items-center gap-4 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="w-12 font-semibold text-gray-900 shrink-0">{day.short}</div>
                    <Switch
                      checked={!h?.closed}
                      onCheckedChange={() => handleClosedDayToggle(day.key)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    {h?.closed ? (
                      <span className="text-gray-500 text-sm ml-2">定休日</span>
                    ) : (
                      <div className="flex items-center gap-2 ml-auto flex-wrap">
                        <Input
                          type="time"
                          value={h?.open || '11:00'}
                          onChange={e => handleHoursChange(day.key, 'open', e.target.value)}
                          className="w-28 border-gray-300 h-9"
                        />
                        <span className="text-gray-500">〜</span>
                        <Input
                          type="time"
                          value={h?.close || '23:00'}
                          onChange={e => handleHoursChange(day.key, 'close', e.target.value)}
                          className="w-28 border-gray-300 h-9"
                        />
                        <span className="text-gray-500 text-sm shrink-0">L.O.</span>
                        <Input
                          type="time"
                          value={h?.lastOrder || '22:30'}
                          onChange={e => handleHoursChange(day.key, 'lastOrder', e.target.value)}
                          className="w-28 border-gray-300 h-9"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Regular Closed Days ──────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <Label className="font-semibold text-gray-900 mb-3 block">定休日 / Regular Closed Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = closedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => handleClosedDayToggle(day.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                      isSelected
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 shrink-0" />}
                    {day.display}曜日
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Hero Banner ──────────────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <Label className="font-semibold text-gray-900 mb-3 block">ヒーロー画像 / Hero Banner</Label>
            {heroError && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{heroError}</AlertDescription>
              </Alert>
            )}
            <input ref={heroInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroUpload(f); e.target.value = ''; }} />
            {(() => {
              const heroPhoto = photos.find(p => p.is_hero);
              return heroPhoto ? (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 w-full" style={{ aspectRatio: '16/5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroPhoto.url} alt="Hero banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={() => heroInputRef.current?.click()}
                      disabled={heroUploading}
                      className="px-3 py-1.5 bg-white/90 text-gray-900 text-sm font-semibold rounded-lg hover:bg-white transition-colors">
                      変更 / Change
                    </button>
                    <button type="button" onClick={() => handleRemovePhoto(heroPhoto.id)}
                      disabled={heroUploading}
                      className="px-3 py-1.5 bg-red-500/90 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors">
                      削除 / Remove
                    </button>
                  </div>
                  {heroUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => !heroUploading && heroInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-10 transition-colors ${
                    heroUploading ? 'border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                  }`}
                >
                  {heroUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                      <p className="text-sm font-medium text-gray-500">ヒーロー画像をアップロード</p>
                      <p className="text-xs text-gray-400">Hero Banner Image (16:5 recommended)</p>
                    </>
                  )}
                </div>
              );
            })()}
            <p className="text-xs text-gray-500 mt-2">推奨サイズ：1600×500px以上（横長）</p>
          </div>

          {/* ── Photos ───────────────────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <Label className="font-semibold text-gray-900 mb-3 block">写真 / Photos</Label>
            {photoError && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{photoError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-3 mb-2">
              {photos.map(photo => (
                <div key={photo.id} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  {photo.is_hero && (
                    <span className="absolute top-0.5 left-0.5 bg-yellow-400 text-[9px] font-bold px-1 rounded leading-tight text-gray-900">hero</span>
                  )}
                  <button type="button" onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors shrink-0">
                <input ref={photosInputRef} type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                {photoUploading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : (
                  <><Cloud className="h-5 w-5 text-gray-400 mb-1" /><span className="text-[10px] text-gray-500">追加</span></>
                )}
              </label>
            </div>
            <p className="text-xs text-gray-500">JPG, PNG, WebP（推奨サイズ：1200×800px以上）</p>
          </div>

          {/* ── Menu Items (restaurant only) ─────────────────────────────── */}
          {business.category === 'restaurant' && (
            <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold text-gray-900">メニュー / Menu</Label>
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
                    onUpdate={patch => updateMenuItem2(i, patch)}
                    onRemove={() => removeMenuItem(i)}
                    onRemoveSavedPhoto={photoId => removeSavedMenuPhoto(i, photoId)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setMenuItems(prev => [...prev, emptyMenuItem()])}
                  disabled={saving || savingMenu}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">メニューアイテムを追加 / Add Menu Item</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Booking Links ────────────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <Label className="font-semibold text-gray-900 mb-1 block">予約リンク / Booking Links</Label>
            {linksError && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{linksError}</AlertDescription>
              </Alert>
            )}
            <div className="divide-y divide-gray-50">
              {BOOKING_PLATFORMS.map(def => (
                <BookingRow
                  key={def.key}
                  def={def}
                  state={booking[def.key]}
                  onChange={url => setBooking(prev => ({ ...prev, [def.key]: { ...prev[def.key], url } }))}
                  onToggle={enabled => setBooking(prev => ({ ...prev, [def.key]: { ...prev[def.key], enabled } }))}
                  disabled={saving}
                />
              ))}
            </div>
          </div>

          {/* ── Social Links ─────────────────────────────────────────────── */}
          <div className="p-4 border border-gray-300 rounded-lg bg-stone-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Share2 className="h-4 w-4 text-gray-600" />
              </div>
              <Label className="font-semibold text-gray-900">SNSリンク / Social Links</Label>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-3">
                {SOCIAL_PLATFORMS_LEFT.map(def => (
                  <SocialRow
                    key={def.key}
                    def={def}
                    state={social[def.key]}
                    onChange={url => setSocial(prev => ({ ...prev, [def.key]: { ...prev[def.key], url } }))}
                    onToggle={enabled => setSocial(prev => ({ ...prev, [def.key]: { ...prev[def.key], enabled } }))}
                    disabled={saving}
                  />
                ))}
              </div>
              <div className="space-y-3">
                {SOCIAL_PLATFORMS_RIGHT.map(def => (
                  <SocialRow
                    key={def.key}
                    def={def}
                    state={social[def.key]}
                    onChange={url => setSocial(prev => ({ ...prev, [def.key]: { ...prev[def.key], url } }))}
                    onToggle={enabled => setSocial(prev => ({ ...prev, [def.key]: { ...prev[def.key], enabled } }))}
                    disabled={saving}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer Buttons ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Link href="/manage">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
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
