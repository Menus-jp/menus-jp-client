"use client";

import { Button } from "@/components/ui/button";
import { Search, Settings, Share2, Smartphone, Globe, ZapIcon, Clock, Crown, CheckCircle, CalendarDays } from "lucide-react";

export default function Home() {
  return (
    <main className="w-full bg-white">
      <nav className="fixed top-0 w-full bg-black z-50">
        <div className="px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
          <div className="text-2xl sm:text-3xl font-bold text-white">menus.jp</div>
          <div className="flex flex-col items-end text-white cursor-pointer hover:text-gray-300 transition">
            <span className="text-xs font-bold sm:text-sm">ログイン/ Login</span>
          </div>
        </div>
      </nav>

      <section className="relative w-full h-96 sm:h-[28rem] pt-16 flex items-center justify-center overflow-hidden bg-black">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/banner.jpg')",
          }}
        ></div>
        
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 leading-tight">
            あなたのお店を、
            <br />
            スマホで完結
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-100 font-semibold mb-4 sm:mb-6">
            Your business. One link. Done.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#15803D] hover:bg-[#166534] text-white font-bold h-16 sm:h-20 px-8 sm:px-12 rounded-3xl text-base sm:text-lg">
              <div className="flex flex-col items-center leading-tight">
                <span className="font-bold">無料で始める</span>
                <span className="text-xs sm:text-sm font-semibold">Start Free</span>
              </div>
            </Button>
            <Button className="border-2 border-white text-white hover:bg-white/20 font-bold h-16 sm:h-20 px-8 sm:px-12 rounded-3xl text-base sm:text-lg bg-transparent">
              <div className="flex flex-col items-center leading-tight">
                <span className="font-bold">デモを見る</span>
                <span className="text-xs sm:text-sm font-semibold">See Demo</span>
              </div>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-2xl font-bold text-center mb-2 text-[#111111]">
            3ステップで完成 / 3 Steps to Launch
          </h2>          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                num: 1,
                title: "お店を検索",
                subtitle: "Find your business",
                descJa: "Google Placesから検索",
                iconColor: "#16A34A",
                Icon: Search,
              },
              {
                num: 2,
                title: "カスタマイズ",
                subtitle: "Customize",
                descJa: "色、写真、営業開設を設定",
                iconColor: "#F59E0B",
                Icon: Settings,
              },
              {
                num: 3,
                title: "公開する",
                subtitle: "Go Live",
                descJa: "リンクをシェアして即公開",
                iconColor: "#3B82F6",
                Icon: Share2,
              },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl px-3 sm:px-4 py-4 flex gap-3 shadow-sm hover:shadow-md transition">
                <div className="flex-shrink-0">
                  <step.Icon className="w-8 sm:w-12 h-8 sm:h-12 flex-shrink-0" style={{ color: step.iconColor }} />
                </div>
                <div className="text-left flex flex-col justify-center">
                  <h3 className="text-xs sm:text-sm font-bold mb-0.5 sm:mb-1">{step.num}. {step.title}</h3>
                  <p className="text-xs sm:text-sm font-bold mb-1 sm:mb-2">{step.subtitle}</p>
                  <p className="text-xs sm:text-sm text-[#6B7280]">{step.descJa}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-4 sm:py-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-2xl font-bold text-center mb-2 text-[#111111]">
            選ばれる理由 / Why menus.jp
          </h2>          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 gap-y-8 sm:gap-y-10">
            {[
              { Icon: Smartphone, title: "モバイル最適化", desc: "Mobile-first design", color: "#16A34A" },
              { Icon: Globe, title: "日英バイリンガル", desc: "JP + EN bilingual", color: "#3B82F6" },
              { Icon: Clock, title: "リアルタイム営業表示", desc: "Live open/closed status", color: "#16A34A" },
              { Icon: CalendarDays, title: "予約ボタン連携", desc: "Tabelog, Hot Pepper, LINE", color: "#F59E0B" },
              { Icon: ZapIcon, title: "高速・軽量", desc: "Fast & lightweight (WebP, <500KB)", color: "#FBBF24" },
              { Icon: Crown, title: "プレミアムプラン", desc: "Remove \"Powered by menus.jp\"", color: "#D4AF37" },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 pt-1">
                  <feature.Icon className="w-10 h-10" style={{ color: feature.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[#111111] mb-1">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-[#6B7280]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-4 sm:py-6 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-2xl font-bold text-center mb-2 text-[#111111]">
            業種を選ぶ / Choose your business type
          </h2>          
          <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6 justify-center items-center">
            {[
              { nameJa: "レストラン", nameEn: "Restaurant", emoji: "🍽️" },
              { nameJa: "美容院", nameEn: "Salon", emoji: "✂️" },
              { nameJa: "バーバー", nameEn: "Barbershop", emoji: "💈" },
              { nameJa: "スパ", nameEn: "Spa", emoji: "🌸" },
              { nameJa: "ジム", nameEn: "Gym", emoji: "🏋️" },
            ].map((type, i) => (
              <button
                key={i}
                className="bg-white hover:bg-yellow-400 text-[#111111] hover:text-white px-6 sm:px-8 py-4 rounded-2xl sm:rounded-3xl font-bold text-sm sm:text-base transition transform hover:scale-105"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">{type.emoji}</span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs sm:text-sm">{type.nameJa}</span>
                    <span className="text-xs text-gray-600">{type.nameEn}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-8 sm:py-2 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-2xl font-bold text-center mb-2 text-[#111111]">
            料金プラン / Pricing
          </h2>          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="flex flex-col bg-white border border-[#E5E7EB] hover:border-2 hover:border-[#16A34A] rounded-lg p-6 hover:shadow-lg transition duration-300 transform hover:scale-105">
              <h3 className="text-2xl font-bold text-center text-[#111111] mb-4">Free</h3>
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-[#111111] mb-1">
                  ¥0<span className="text-lg text-[#6B7280]">/月</span>
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "サブドメイン (menus.jp)",
                  "すべての基本機能",
                  "Powered by 表示"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#111111]">
                    <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-6 font-bold text-sm rounded-lg transition mt-auto">
                <div className="flex flex-col items-center leading-tight">
                  <span>無料で始める</span>
                  <span className="text-xs">Start Free</span>
                </div>
              </Button>
            </div>

            <div className="flex flex-col relative bg-white border border-[#E5E7EB] hover:border-2 hover:border-[#F59E0B] rounded-lg p-6 hover:shadow-xl transition duration-300 transform hover:scale-105">
              <div className="absolute top-3 right-4 bg-[#F59E0B] text-white px-4 py-1 rounded-full text-xs font-bold">
                おすすめ
              </div>
              <h3 className="text-2xl font-bold text-center text-[#111111] mb-4 mt-4">Premium</h3>
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-[#111111] mb-1">
                  ¥980<span className="text-lg text-[#6B7280]">/月</span>
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "すべてのFree機能",
                  "ブランディング非表示",
                  "独自ドメイン",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#111111]">
                    <CheckCircle className="w-4 h-4 text-[#F59E0B]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-[#111111] hover:bg-[#1a1a1a] text-white py-6 font-bold text-sm rounded-lg transition mt-auto">
                <div className="flex flex-col items-center leading-tight">
                  <span>プレミアムにする</span>
                  <span className="text-xs">Go Premium</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-[#E5E7EB] py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-lg font-bold text-[#111111]">menus.jp</div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <a href="#" className="text-[#6B7280] hover:text-[#111111] transition whitespace-nowrap">
                <span className="font-semibold text-[#111111]">利用規約</span>
                <span className="hidden sm:inline text-[#6B7280]"> / Terms</span>
              </a>
              <span className="text-[#E5E7EB]">|</span>
              <a href="#" className="text-[#6B7280] hover:text-[#111111] transition whitespace-nowrap">
                <span className="font-semibold text-[#111111]">プライバシー</span>
                <span className="hidden sm:inline text-[#6B7280]"> / Privacy</span>
              </a>
              <span className="text-[#E5E7EB]">|</span>
              <a href="#" className="text-[#6B7280] hover:text-[#111111] transition whitespace-nowrap">
                <span className="font-semibold text-[#111111]">お問い合わせ</span>
                <span className="hidden sm:inline text-[#6B7280]"> / Contact</span>
              </a>
            </div>
            
            <div className="text-xs text-[#6B7280] whitespace-nowrap">
              © 2026 menus.jp
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
