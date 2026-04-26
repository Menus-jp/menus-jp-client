import type { MenuItem } from "@/lib/types/business";

export function CouponChip({ item, lang }: { item: MenuItem; lang: "jp" | "en" }) {
  const label =
    lang === "jp"
      ? item.category_jp ?? item.category_en ?? "—"
      : item.category_en ?? item.category_jp ?? "—";
  const isDrink = /drink|ドリンク|飲み物|cocktail|bar|beer|wine/i.test(label);
  const bg = isDrink ? "bg-[hsl(var(--coupon-drink))]" : "bg-[hsl(var(--coupon-food))]";

  return (
    <div className="relative inline-flex items-center">
      <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-card z-10" />
      <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-card z-10" />
      <div className={`${bg} px-4 py-2.5 rounded-md flex items-baseline gap-1.5 text-white shadow-sm`}>
        <span className="text-2xl font-black leading-none">{item.discount_percentage}%</span>
        <span className="text-base font-bold">{label}</span>
      </div>
    </div>
  );
}
