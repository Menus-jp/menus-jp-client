"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Phone, Globe, ArrowLeft, Loader2 } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8005/api";

interface BusinessResult {
  id: number;
  business_name: string;
  category: string;
  slug: string;
  address: string;
  phone_number: string;
  website: string;
  maps_url: string;
  hero_image: string;
  is_published: boolean;
  public_url: string;
}

const CATEGORIES = [
  { key: "", labelJp: "すべて", labelEn: "All", emoji: "🌐" },
  { key: "restaurant", labelJp: "レストラン", labelEn: "Restaurant", emoji: "🍽️" },
  { key: "hair_salon", labelJp: "美容院", labelEn: "Hair Salon", emoji: "💇" },
  { key: "barbershop", labelJp: "バーバー", labelEn: "Barbershop", emoji: "💈" },
  { key: "spa", labelJp: "スパ", labelEn: "Spa", emoji: "🌸" },
  { key: "gym", labelJp: "ジム", labelEn: "Gym", emoji: "🏋️" },
];

function BusinessCard({ business }: { business: BusinessResult }) {
  const meta = CATEGORIES.find((c) => c.key === business.category) ?? {
    emoji: "📍",
    labelJp: "その他",
    labelEn: "Other",
  };

  return (
    <a
      href={business.public_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col"
    >
      {/* Hero image */}
      <div className="relative h-36 bg-gray-100 overflow-hidden shrink-0">
        {business.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.hero_image}
            alt={business.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <span className="text-5xl opacity-40">{meta.emoji}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-xl leading-none mt-0.5 shrink-0">{meta.emoji}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-snug truncate">
              {business.business_name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {meta.labelJp} / {meta.labelEn}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mt-auto">
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
          {business.website && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{business.website.replace(/^https?:\/\//, "")}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchResults = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.search = q.trim();
      if (cat) params.category = cat;
      const res = await axios.get(`${API_BASE_URL}/search/`, { params });
      setResults(res.data.results ?? res.data ?? []);
      setSearched(true);
    } catch {
      setError("検索に失敗しました / Failed to load results");
    } finally {
      setLoading(false);
    }
  }, []);

  // Run initial search on mount (shows everything, or pre-filtered by URL params)
  useEffect(() => {
    fetchResults(query, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchResults(query, category);
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    fetchResults(query, cat);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            menus.jp
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Search
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            お店を探す / Find a Business
          </h1>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="店名・住所・メニューで検索 / Search by name, address or menu…"
              className="pl-9 h-11 rounded-xl border-gray-300 bg-white"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="bg-gray-900 hover:bg-gray-700 text-white h-11 px-5 rounded-xl font-semibold"
          >
            検索 / Search
          </Button>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                category === cat.key
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.labelJp}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        {error && (
          <p className="text-center text-red-500 text-sm py-12">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : searched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              結果が見つかりませんでした
            </h3>
            <p className="text-sm text-gray-500">
              No results found. Try a different search term or category.
            </p>
          </div>
        ) : (
          <>
            {searched && (
              <p className="text-xs text-gray-400 mb-4">
                {results.length}件の結果 / {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
