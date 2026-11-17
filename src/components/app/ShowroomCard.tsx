"use client";

import { Check, Images, Plus } from "lucide-react";
import { fmtSyp, fmtUsd } from "@/components/app/Price";
import { Stepper } from "@/components/app/ShowroomSpotlight";
import { Img } from "@/components/ui";
import type { CartItem, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Showroom product card: the photo fills a 4:5 frame, the second photo of the gallery fades in on
 * hover (with dots and a photo count), and "أضف" sends the picture flying into the cart.
 */
export function ShowroomCard({ p, index, item, canBuy, adding, onOpen, onAdd, onQty }: {
  p: Product;
  index: number;
  item?: CartItem;
  canBuy: boolean;
  adding: boolean;
  onOpen: () => void;
  onAdd: (from?: HTMLElement | null) => void;
  onQty: (itemId: number, qty: number) => void;
}) {
  const photos = p.images?.map((i) => i.image).filter(Boolean) ?? [];
  const second = photos.find((m) => m.id !== p.image?.id);
  return (
    <article style={{ animationDelay: `${Math.min(index, 14) * 55}ms` }} className={cn("sr-card sr-in group relative overflow-hidden rounded-[14px] bg-white shadow-[0_1px_2px_rgba(44,57,48,.05)] transition duration-500 ease-lux", p.is_purchasable ? "hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-25px_rgba(44,57,48,.35)]" : "opacity-90")}>
      <button onClick={onOpen} className="sr-cur-in relative block aspect-[4/5] w-full overflow-hidden bg-[#2c3930]" aria-label={`عرض ${p.name}`}>
        <Img media={p.image} variant="md" alt={p.name} data-photo className={cn("sr-ph absolute inset-0 h-full w-full object-cover", !p.is_purchasable && "grayscale-[0.7]")} />
        {second && <Img media={second} variant="md" alt="" aria-hidden className="sr-alt absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" aria-hidden />
        {p.brand?.logo && <span className="absolute top-4 start-4 flex h-9 items-center rounded-full bg-white/95 px-3.5 shadow-sm"><Img media={p.brand.logo} variant="thumb" className="h-4 w-auto max-w-[70px] object-contain" /></span>}
        {!p.is_purchasable && <span className="absolute top-4 end-4 rounded-full bg-white/95 px-3 py-1 text-[12px] font-medium text-gray-700">غير متوفر حالياً</span>}
        {item && <span className="sr-pop absolute top-4 end-4 flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[12px] font-medium text-white"><Check className="h-3.5 w-3.5" /> في السلة ×{Number(item.quantity)}</span>}
        {/* photo count + dots */}
        {photos.length > 1 && (
          <span className="absolute bottom-4 inset-x-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur"><Images className="h-3.5 w-3.5" />{photos.length} صور</span>
            <span className="flex gap-1.5" aria-hidden>
              {photos.slice(0, 5).map((m, i) => <span key={m.id ?? i} className={cn("h-1.5 rounded-full bg-white/70 transition-all duration-500", i === 0 ? "w-5 group-hover:w-1.5" : i === 1 ? "w-1.5 group-hover:w-5" : "w-1.5")} />)}
            </span>
          </span>
        )}
      </button>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 text-[11px] tracking-[0.14em] text-gold-600">
          <span className="line-clamp-1">{p.brand?.name ?? p.category?.name ?? ""}</span>
          <span className="text-gray-400" dir="ltr">{p.sku}</span>
        </div>
        <h3 className="mt-2 line-clamp-1 font-display text-[18px] font-semibold text-brand-green">{p.name}</h3>
        {p.short_description && <p className="mt-1 line-clamp-1 text-[13px] text-gray-500">{p.short_description}</p>}
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-gold-100 pt-4">
          <div className="leading-tight">
            <div className="font-display text-[24px] font-semibold text-brand-green tabular" dir="ltr" style={{ textAlign: "right" }}>{fmtUsd(p.price)}</div>
            <div className="text-[12.5px] font-medium text-gold-700 tabular">{fmtSyp(p.price_syp)}</div>
          </div>
          {canBuy && (item ? (
            <Stepper small value={Number(item.quantity)} onChange={(v) => onQty(item.id, v)} delay={450} />
          ) : (
            <button
              disabled={!p.is_purchasable || adding}
              onClick={(e) => onAdd(e.currentTarget.closest("article")?.querySelector<HTMLElement>("[data-photo]"))}
              className="flex h-12 items-center gap-2 rounded-full bg-[#2c3930] ps-2 pe-5 text-[15px] font-semibold text-white transition hover:bg-[#1f2a23] active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f3e2bf] to-[#b8956f] text-[#2c3930]"><Plus className="h-4 w-4" /></span> أضف
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
