'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Loader2,
  Check,
  Plus,
  Trash2,
  ImagePlus,
} from 'lucide-react';
import { BusinessProfile, MenuItem } from '@/lib/types/business';
import { useBusinessApi } from '@/lib/hooks/useBusinessApi';

interface Step4FormProps {
  business: BusinessProfile;
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  onPublish?: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

interface MenuItemDraft {
  /** undefined = not yet saved to server */
  id?: number;
  category_jp: string;
  category_en: string;
  /** Photos already on the server */
  savedPhotos: { id: number; url: string; label?: string }[];
  /** Files staged for upload on save */
  pendingFiles: File[];
  /** One label per pending file (may be shorter than pendingFiles — remainder = null) */
  pendingLabels: string[];
  isOpen: boolean;
}

function emptyItem(): MenuItemDraft {
  return {
    category_jp: '',
    category_en: '',
    savedPhotos: [],
    pendingFiles: [],
    pendingLabels: [],
    isOpen: true,
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
        alt={label || ''}
        className={`w-20 h-20 object-cover rounded-lg border ${
          pending ? 'border-dashed border-blue-300 opacity-70' : 'border-gray-200'
        }`}
      />
      {pending && (
        <span className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-[9px] px-1 rounded leading-tight">
          未保存
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Trash2 className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItemDraft;
  index: number;
  disabled: boolean;
  onUpdate: (patch: Partial<MenuItemDraft>) => void;
  onRemove: () => void;
  onRemoveSavedPhoto: (id: number) => void;
}

function MenuItemCard({
  item,
  index,
  disabled,
  onUpdate,
  onRemove,
  onRemoveSavedPhoto,
}: MenuItemCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const maxNew = 5 - item.savedPhotos.length - item.pendingFiles.length;
    const toAdd = files.slice(0, maxNew);
    onUpdate({
      pendingFiles: [...item.pendingFiles, ...toAdd],
      pendingLabels: [...item.pendingLabels, ...toAdd.map(() => '')],
    });
    e.target.value = '';
  };

  const removePending = (idx: number) => {
    onUpdate({
      pendingFiles: item.pendingFiles.filter((_, i) => i !== idx),
      pendingLabels: item.pendingLabels.filter((_, i) => i !== idx),
    });
  };

  const updatePendingLabel = (idx: number, label: string) => {
    const labels = [...item.pendingLabels];
    labels[idx] = label;
    onUpdate({ pendingLabels: labels });
  };

  const totalPhotos = item.savedPhotos.length + item.pendingFiles.length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <button
          type="button"
          className="flex-1 flex items-center gap-2 text-left min-w-0"
          onClick={() => onUpdate({ isOpen: !item.isOpen })}
        >
          <span className="text-sm font-semibold text-gray-900 truncate">
            {item.category_jp || item.category_en || `メニューアイテム ${index + 1}`}
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {item.isOpen && (
        <div className="p-4 space-y-4">
          {/* Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">カテゴリ (JP)</Label>
              <Input
                placeholder="例: ランチ / 寿司"
                value={item.category_jp}
                onChange={(e) => onUpdate({ category_jp: e.target.value })}
                disabled={disabled}
                className="text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Category (EN)</Label>
              <Input
                placeholder="e.g. Lunch / Sushi"
                value={item.category_en}
                onChange={(e) => onUpdate({ category_en: e.target.value })}
                disabled={disabled}
                className="text-sm h-9"
              />
            </div>
          </div>

          {/* Photos */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">
              写真 / Photos <span className="text-gray-400">({totalPhotos}/5)</span>
            </Label>
            {totalPhotos > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {item.savedPhotos.map((p) => (
                  <PhotoThumb
                    key={p.id}
                    src={p.url}
                    label={p.label}
                    onRemove={() => onRemoveSavedPhoto(p.id)}
                    disabled={disabled}
                  />
                ))}
                {item.pendingFiles.map((file, pidx) => (
                  <div key={`p-${pidx}`} className="flex flex-col gap-1">
                    <PhotoThumb
                      src={URL.createObjectURL(file)}
                      pending
                      onRemove={() => removePending(pidx)}
                      disabled={disabled}
                    />
                    <Input
                      placeholder="ラベル"
                      value={item.pendingLabels[pidx] ?? ''}
                      onChange={(e) => updatePendingLabel(pidx, e.target.value)}
                      disabled={disabled}
                      className="text-[11px] h-6 w-20 px-1.5"
                    />
                  </div>
                ))}
              </div>
            )}
            {totalPhotos < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <ImagePlus className="h-4 w-4" />
                写真を追加 / Add Photo
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilePick}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function Step4Form({ business, onSubmit, loading, error }: Step4FormProps) {
  const api = useBusinessApi();

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>(
    business.plan || 'free'
  );
  const [customDomain, setCustomDomain] = useState(business.custom_domain || '');
  const [items, setItems] = useState<MenuItemDraft[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);

  const isRestaurant = business.category === 'restaurant';

  // Load existing menu items on mount (restaurant only)
  useEffect(() => {
    if (!isRestaurant) return;
    (async () => {
      setMenuLoading(true);
      try {
        const existing = await api.listMenuItems(business.id);
        if (existing.length > 0) {
          setItems(
            existing.map((item) => ({
              id: item.id,
              category_jp: item.category_jp ?? '',
              category_en: item.category_en ?? '',
              savedPhotos: (item.photos ?? []).map((p) => ({
                id: p.id,
                url: p.image_url || p.image,
                label: p.label,
              })),
              pendingFiles: [],
              pendingLabels: [],
              isOpen: false,
            }))
          );
        } else {
          setItems([emptyItem()]);
        }
      } catch {
        setMenuError('既存のメニューを読み込めませんでした');
        setItems([emptyItem()]);
      } finally {
        setMenuLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id]);

  const updateItem = (i: number, patch: Partial<MenuItemDraft>) => {
    setMenuSaved(false);
    setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  };

  const removeItem = async (i: number) => {
    const item = items[i];
    if (item.id) {
      try {
        await api.deleteMenuItem(item.id);
      } catch {
        setMenuError('削除に失敗しました');
        return;
      }
    }
    setItems((prev) => prev.filter((_, k) => k !== i));
  };

  const removeSavedPhoto = async (itemIdx: number, photoId: number) => {
    try {
      await api.deleteMenuItemPhoto(photoId);
      updateItem(itemIdx, {
        savedPhotos: items[itemIdx].savedPhotos.filter((p) => p.id !== photoId),
      });
    } catch {
      setMenuError('写真の削除に失敗しました');
    }
  };

  const saveMenu = async (): Promise<boolean> => {
    setSavingMenu(true);
    setMenuError(null);
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.category_jp && !item.category_en && !item.pendingFiles.length && !item.savedPhotos.length) continue; // skip blank rows

        if (!item.id) {
          // New item — POST /api/menu-items/ with photos in the same request
          const fd = new FormData();
          fd.append('business', String(business.id));
          if (item.category_jp) fd.append('category_jp', item.category_jp);
          if (item.category_en) fd.append('category_en', item.category_en);
          item.pendingFiles.forEach((file, pidx) => {
            fd.append('photo_images', file);
            fd.append('photo_labels', item.pendingLabels[pidx] ?? '');
          });

          const created = await api.createMenuItem(fd);
          updateItem(i, {
            id: created.id,
            savedPhotos: (created.photos ?? []).map((p) => ({
              id: p.id,
              url: p.image_url || p.image,
              label: p.label,
            })),
            pendingFiles: [],
            pendingLabels: [],
          });
        } else {
          // Existing item — PATCH metadata, then upload new photos separately
          await api.updateMenuItem(item.id, {
            category_jp: item.category_jp || undefined,
            category_en: item.category_en || undefined,
          });

          for (let pidx = 0; pidx < item.pendingFiles.length; pidx++) {
            const pfd = new FormData();
            pfd.append('menu_item', String(item.id));
            pfd.append('image', item.pendingFiles[pidx]);
            const label = item.pendingLabels[pidx];
            if (label) pfd.append('label', label);
            const photo = await api.uploadMenuItemPhoto(pfd);
            // update in-flight snapshot safely
            setItems((prev) =>
              prev.map((it, k) =>
                k !== i
                  ? it
                  : {
                      ...it,
                      savedPhotos: [
                        ...it.savedPhotos,
                        {
                          id: photo.id,
                          url: photo.image_url || photo.image,
                          label: photo.label,
                        },
                      ],
                    }
              )
            );
          }
          updateItem(i, { pendingFiles: [], pendingLabels: [] });
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

  const saveMenuAndNotify = async () => {
    setMenuSaved(false);
    const ok = await saveMenu();
    if (ok) setMenuSaved(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRestaurant && items.some((it) => it.category_jp || it.category_en || it.pendingFiles.length > 0 || it.savedPhotos.length > 0)) {
      const ok = await saveMenu();
      if (!ok) return;
    }
    const data: Partial<BusinessProfile> = { plan: selectedPlan, onboarding_step: 4, is_published: true };
    if (selectedPlan === 'premium' && customDomain) data.custom_domain = customDomain;
    await onSubmit(data);
  };

  const plans = [
    {
      name: 'フリー / Free',
      price: '¥0',
      period: '/月',
      features: ['Subdomain (menus.jp)', 'ビジネス情報すべて', '営業時間', 'Powered by menus.jp'],
      value: 'free' as const,
      recommended: false,
    },
    {
      name: 'プレミアム / Premium',
      price: '¥980',
      period: '/月',
      features: [
        'Custom domain',
        'フリーの全機能',
        'Analytics dashboard',
        'No "Powered by" branding',
        'Priority support',
      ],
      value: 'premium' as const,
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

      {/* ── Menu Section (restaurants only) ─────────────────────────────── */}
      {isRestaurant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">メニュー / Menu</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                各アイテムに写真・カテゴリを設定できます
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={saveMenuAndNotify}
              disabled={!!(loading || savingMenu || menuLoading)}
            >
              {savingMenu ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />保存中...</>
              ) : menuSaved ? (
                <><Check className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600">保存済み</span></>
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
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <MenuItemCard
                  key={i}
                  item={item}
                  index={i}
                  disabled={!!(loading || savingMenu)}
                  onUpdate={(patch) => updateItem(i, patch)}
                  onRemove={() => removeItem(i)}
                  onRemoveSavedPhoto={(photoId) => removeSavedPhoto(i, photoId)}
                />
              ))}
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                disabled={!!(loading || savingMenu)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 text-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-bold text-black">メニューアイテムを追加 / Add Menu Item</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Plan Selection ───────────────────────────────────────────────── */}
      <div className="p-4 border border-gray-300 rounded-xl bg-stone-50">
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
                  ? 'border-gray-900 bg-white shadow-sm'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {plan.recommended && (
                <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  Recommended
                </div>
              )}
              <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h4>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-gray-900 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {selectedPlan === 'premium' && (
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
          />
          <p className="text-xs text-gray-500">
            Point your domain's DNS to menus.jp for custom domain setup
          </p>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={!!(loading || savingMenu)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 font-semibold flex items-center justify-center gap-2 rounded-xl"
        >
          {loading || savingMenu ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {savingMenu ? 'メニュー保存中...' : '公開中...'}
            </>
          ) : (
            '公開する / Publish'
          )}
        </Button>
      </div>
    </form>
  );
}

