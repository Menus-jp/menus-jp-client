"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  ChevronRight,
  MapPin,
  ImagePlus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { BusinessProfile } from "@/lib/types/business";

interface Step1FormProps {
  onSubmit: (data: {
    business_name: string;
    category: string;
    address?: string;
    phone_number?: string;
    heroImage?: File | null;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  currentBusiness?: BusinessProfile | null;
}

function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  // @lat,lng
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch)
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  // ?q=lat,lng or &q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  // ll=lat,lng
  const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch)
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

  return null;
}

function buildMapSrc(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export function Step1Form({
  onSubmit,
  loading,
  error,
  currentBusiness,
}: Step1FormProps) {
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    business_name: currentBusiness?.business_name || "",
    category: currentBusiness?.category || "restaurant",
    address: currentBusiness?.address || "",
    phone_number: currentBusiness?.phone_number || "",
  });

  const [fieldErrors, setFieldErrors] = useState<{
    business_name?: string;
    category?: string;
    address?: string;
    phone_number?: string;
    heroImage?: string;
  }>({});

  // Hero banner state
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(
    currentBusiness?.hero_image || null,
  );

  // Location state
  const [mapsUrl, setMapsUrl] = useState("");
  const [lat, setLat] = useState<string>(
    currentBusiness?.latitude != null ? String(currentBusiness.latitude) : "",
  );
  const [lng, setLng] = useState<string>(
    currentBusiness?.longitude != null ? String(currentBusiness.longitude) : "",
  );
  const [mapPreviewAddr, setMapPreviewAddr] = useState(
    currentBusiness?.address || "",
  );

  const categories = [
    {
      value: "restaurant",
      label: "レストラン",
      labelEn: "Restaurant",
      icon: "🍽️",
    },
    { value: "hair_salon", label: "美容院", labelEn: "Hair Salon", icon: "💇" },
    {
      value: "barbershop",
      label: "バーバー",
      labelEn: "Barbershop",
      icon: "💈",
    },
    { value: "spa", label: "スパ", labelEn: "Spa", icon: "🧖" },
    { value: "gym", label: "ジム", labelEn: "Gym", icon: "🏋️" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as soon as the user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleHeroPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, heroImage: undefined }));
    e.target.value = "";
  };

  const handleHeroRemove = () => {
    setHeroFile(null);
    setHeroPreview(null);
  };

  const handleMapsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMapsUrl(url);
    if (!url.trim()) return;
    const coords = parseGoogleMapsUrl(url);
    if (coords) {
      setLat(String(coords.lat));
      setLng(String(coords.lng));
    }
  };

  const handleAddressBlur = () => {
    if (formData.address.trim()) setMapPreviewAddr(formData.address.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};
    if (!formData.business_name.trim())
      errors.business_name = "店舗名を入力してください / Business name is required";
    if (!formData.category)
      errors.category = "業種を選択してください / Please select a category";
    if (!formData.address.trim())
      errors.address = "住所を入力してください / Address is required";
    if (!formData.phone_number.trim())
      errors.phone_number = "電話番号を入力してください / Phone number is required";
    if (!heroFile && !heroPreview)
      errors.heroImage = "ヒーロー画像をアップロードしてください / Hero image is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    await onSubmit({
      ...formData,
      heroImage: heroFile,
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lng ? parseFloat(lng) : undefined,
    });
  };

  const canSubmit =
    !loading &&
    !!formData.business_name &&
    !!formData.category &&
    !!formData.address &&
    !!formData.phone_number &&
    !!(heroFile || heroPreview);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 mb-2">
            <Label
              htmlFor="business_name"
              className="font-semibold text-gray-900"
            >
              店舗名 / Business Name
            </Label>
            <span className="text-red-500 text-sm">必須</span>
          </div>
          <Input
            id="business_name"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            placeholder="店舗名を入力してください"
            className={`mt-2 border rounded-xl bg-white px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              fieldErrors.business_name ? "border-red-400" : "border-gray-200"
            }`}
            disabled={loading}
            required
          />
          {fieldErrors.business_name && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.business_name}</p>
          )}
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 mb-4">
            <Label className="font-semibold text-gray-900">
              業種 / Category
            </Label>
            <span className="text-red-500 text-sm">必須</span>
          </div>
          <div className={`grid grid-cols-5 gap-2 rounded-xl p-1 ${
            fieldErrors.category ? "ring-1 ring-red-400" : ""
          }`}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    category: cat.value as BusinessProfile["category"],
                  }));
                  setFieldErrors((prev) => ({ ...prev, category: undefined }));
                }}
                disabled={loading}
                className={`p-3 rounded-2xl border-2 transition-all text-center flex flex-col items-center justify-center ${
                  formData.category === cat.value
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="font-semibold text-xs leading-tight">
                  {cat.label}
                </div>
                <div className="text-xs opacity-70 leading-tight">
                  {cat.labelEn}
                </div>
              </button>
            ))}
          </div>
          {fieldErrors.category && (
            <p className="mt-2 text-xs text-red-500">{fieldErrors.category}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 mb-2">
            <Label htmlFor="address" className="font-semibold text-gray-900">
              住所 / Address
            </Label>
            <span className="text-red-500 text-sm">必須</span>
          </div>
          <div className="relative">
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleAddressBlur}
              placeholder="東京都渋谷区宇田川町1-2-3"
              className={`border rounded-xl bg-white px-4 py-3 h-12 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                fieldErrors.address ? "border-red-400" : "border-gray-200"
              }`}
              disabled={loading}
              required
            />
            <MapPin className="h-4 w-4 absolute right-3 top-3.5 text-gray-400" />
          </div>
          {fieldErrors.address && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>
          )}
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 mb-2">
            <Label
              htmlFor="phone_number"
              className="font-semibold text-gray-900"
            >
              電話番号 / Phone
            </Label>
            <span className="text-red-500 text-sm">必須</span>
          </div>
          <Input
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="03-1234-5678"
            className={`border rounded-xl bg-white px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              fieldErrors.phone_number ? "border-red-400" : "border-gray-200"
            }`}
            required
          />
          {fieldErrors.phone_number && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.phone_number}</p>
          )}
        </div>
      </div>

      <div className={`p-4 border rounded-lg bg-gray-50 ${
        fieldErrors.heroImage ? "border-red-400" : "border-gray-200"
      }`}>
        <div className="mb-3">
          <div className="flex items-center gap-1">
            <Label className="font-semibold text-gray-900">
              ヒーロー画像 / Hero Banner
            </Label>
            <span className="text-red-500 text-sm">必須</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            店舗ページの最上部に表示されるメイン画像（推奨: 1200×400px 以上）
            <br />
            <span className="text-gray-300">
              Main banner image shown at the top of your public page.
            </span>
          </p>
        </div>

        {heroPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
            <img
              src={heroPreview}
              alt="Hero preview"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                disabled={loading}
                className="bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                変更 / Change
              </button>
              <button
                type="button"
                onClick={handleHeroRemove}
                disabled={loading}
                className="bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                削除 / Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => heroInputRef.current?.click()}
            disabled={loading}
            className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors bg-white"
          >
            <ImagePlus className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-semibold">
                クリックして画像をアップロード
              </p>
              <p className="text-xs mt-0.5">Click to upload hero image</p>
            </div>
            <p className="text-xs text-gray-300">JPG, PNG, WebP</p>
          </button>
        )}
        <input
          ref={heroInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleHeroPick}
        />
        {fieldErrors.heroImage && (
          <p className="mt-2 text-xs text-red-500">{fieldErrors.heroImage}</p>
        )}
      </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
        <div>
          <Label className="font-semibold text-gray-900">
            Googleマップ / Location
          </Label>
          <p className="text-xs text-gray-400 mt-0.5">
            GoogleマップのURLを貼り付けると、座標が自動で入力されます。
            <br />
            <span className="text-gray-300">
              Paste a Google Maps URL to auto-fill coordinates.
            </span>
          </p>
        </div>

        {/* URL paste */}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Google Maps URL（任意 / Optional）
          </Label>
          <div className="relative">
            <Input
              type="url"
              value={mapsUrl}
              onChange={handleMapsUrlChange}
              placeholder="https://maps.google.com/maps?q=..."
              disabled={loading}
              className="border border-gray-200 rounded-xl bg-white px-4 py-3 h-12 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-300"
            />
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-700"
                tabIndex={-1}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Map preview — shows once address is confirmed (on blur) */}
        {mapPreviewAddr && (
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <iframe
              title="Map preview"
              width="100%"
              height="220"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={buildMapSrc(mapPreviewAddr)}
              className="block"
            />
          </div>
        )}

        {!mapPreviewAddr && (
          <p className="text-xs text-gray-400 italic">
            住所を入力してフォーカスを外すと地図プレビューが表示されます / Fill
            in the address and click away to see a map preview.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-base mt-8"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            作成中...
          </>
        ) : (
          <>
            次へ / Next
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
