"use client";

import { Check, Images, Plus } from "lucide-react";
import { fmtSyp, fmtUsd } from "@/components/app/Price";
import { Stepper } from "@/components/app/ShowroomSpotlight";
import { Img } from "@/components/ui";
import type { CartItem, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Showroom product card, shaped like the AlSeraj mark: the photo sits in a flat-top hexagon with a
 * gold rim. On hover the rim's glint sweeps round, a warm light falls from the top edge and the
 * second gallery photo fades in. The hexagonal "add" button rides the bottom edge and sends the
 * picture flying into the cart. Styles live in SHOWROOM_CSS (.sr-hex*).
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
  const off = !p.is_purchasable;
  return (
    <article style={{ animationDelay: `${Math.min(index, 23) * 35}ms` }} className={cn("sr-card sr-in group relative flex flex-col items-center text-center", off && "opacity-90")}>
      <div className="sr-hexwrap w-full">
        <span className="sr-hex sr-rim" aria-hidden />
        <button onClick={onOpen} className="sr-hex sr-face sr-cur-in" aria-label={`عرض ${p.name}`}>
          <Img media={p.image} variant="md" alt={p.name} data-photo className={cn("sr-ph absolute inset-0 h-full w-full object-cover", off && "grayscale-[0.7]")} />
          {second && <Img media={second} variant="md" alt="" aria-hidden className="sr-alt absolute inset-0 h-full w-full object-cover" />}
          <span className="sr-glow" aria-hidden />
          {/* top flat edge: brand / photo count / state */}
          <span className="absolute inset-x-0 top-[7%] flex items-center justify-center gap-1.5">
            {off ? (
              <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm sm:px-3 sm:text-[11.5px]">غير متوفر</span>
            ) : item ? (
              <span className="sr-pop flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-white shadow-sm sm:px-2.5 sm:text-[11.5px]"><Check className="h-3 w-3" /> في السلة</span>
            ) : p.brand?.logo ? (
              <span className="flex h-5 items-center rounded-full bg-white/95 px-2 shadow-sm sm:h-7 sm:px-3"><Img media={p.brand.logo} variant="thumb" className="h-2.5 w-auto max-w-[46px] object-contain sm:h-3.5 sm:max-w-[60px]" /></span>
            ) : null}
            {photos.length > 1 && <span className="hidden items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur sm:flex"><Images className="h-3 w-3" />{photos.length}</span>}
          </span>
        </button>
        {canBuy && (
          <button
            disabled={off || adding}
            onClick={(e) => (item ? onQty(item.id, Number(item.quantity) + 1) : onAdd(e.currentTarget.closest("article")?.querySelector<HTMLElement>("[data-photo]")))}
            aria-label={item ? `زيادة كمية ${p.name}` : `أضف ${p.name} إلى السلة`}
            className={cn("sr-hex sr-hexbtn", item && "is-in")}
          >
            {item ? <span className="text-[12px] font-bold tabular sm:text-[14px]">×{Number(item.quantity)}</span> : <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />}
          </button>
        )}
      </div>

      <div className={cn("w-full px-1", canBuy ? "mt-5 sm:mt-6" : "mt-3")}>
        <div className="flex items-center justify-center gap-1.5 text-[10px] tracking-[0.1em] text-gold-600 sm:tracking-[0.12em]">
          <span className="line-clamp-1">{p.brand?.name ?? p.category?.name ?? ""}</span>
          <span className="hidden text-gold-300 xl:inline" aria-hidden>◆</span>
          <span className="hidden text-gray-400 xl:inline" dir="ltr">{p.sku}</span>
        </div>
        <h3 className="mx-auto mt-1 line-clamp-2 min-h-[2.6em] max-w-[22ch] text-[13px] font-semibold leading-snug text-brand-green sm:text-[14px]">
          <button onClick={onOpen} className="cursor-pointer transition-colors hover:text-gold-700">{p.name}</button>
        </h3>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2 leading-tight">
          <span className="font-display text-[16px] font-semibold text-brand-green tabular sm:text-[17px]" dir="ltr">{fmtUsd(p.price)}</span>
          <span className="text-[10.5px] font-medium text-gold-700 tabular sm:text-[11px]">{fmtSyp(p.price_syp)}</span>
        </div>
        {canBuy && item && (
          <div className="mt-2 flex justify-center"><Stepper small value={Number(item.quantity)} onChange={(v) => onQty(item.id, v)} delay={450} /></div>
        )}
      </div>
    </article>
  );
}

/** Hexagon placeholder shown while the showroom grid loads. */
export function ShowroomCardSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="sr-hex skeleton aspect-[1.1547] w-full" />
      <div className="skeleton mt-6 h-3 w-16 rounded" />
      <div className="skeleton mt-2 h-4 w-3/4 rounded" />
      <div className="skeleton mt-2 h-5 w-20 rounded" />
    </div>
  );
}
