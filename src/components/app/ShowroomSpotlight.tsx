"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Droplets, Expand, Gem, Info, Lightbulb, Palette, Power, Ruler, ShieldCheck,
  Shrink, ShoppingBag, Sun, Thermometer, Weight, X, Zap, ZoomIn, ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fmtSyp, fmtUsd } from "@/components/app/Price";
import { Img } from "@/components/ui";
import { get } from "@/lib/api";
import type { Cart, Media, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QtyStepper } from "./QtyStepper";

/**
 * Showroom product view — a gallery for presenting a lighting product to a customer:
 *  - every photo of the product (swipe / arrows / captioned thumbnails / counter)
 *  - close inspection: tap-to-zoom at the pointed spot, pan, pinch, wheel, +/−, fullscreen
 */

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A copy of the product picture flies in an arc into the cart, which then gives a little pop. */
export function flyToCart(from: HTMLElement | null | undefined, to: HTMLElement | null | undefined) {
  if (!from || !to || reducedMotion()) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!a.width || !b.width) return;
  const ghost = from.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed", left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: "0",
    zIndex: "80", pointerEvents: "none", borderRadius: "14px", objectFit: "cover", filter: "none", transform: "none",
    boxShadow: "0 24px 48px -12px rgba(0,0,0,.45), 0 0 0 2px rgba(211,191,154,.8)",
  });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  ghost.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(0.42) rotate(-6deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.05)`, opacity: 0.4 },
    ],
    { duration: 850, easing: "cubic-bezier(.55,0,.25,1)" },
  ).onfinish = () => {
    ghost.remove();
    to.animate([{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }], { duration: 380, easing: "ease-out" });
  };
}

/** Gold loupe cursors (zoom in / out) that match the brand instead of the system magnifier. */
const loupe = (sign: "+" | "-") => {
  const bar = sign === "+" ? `<path d='M22 15v14' stroke='%2386634a' stroke-width='2' stroke-linecap='round'/>` : "";
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='18' fill='rgba(255,250,240,.55)' stroke='%23b8956f' stroke-width='1.5'/%3E%3Ccircle cx='22' cy='22' r='21' fill='none' stroke='rgba(184,149,111,.35)'/%3E%3Cpath d='M15 22h14' stroke='%2386634a' stroke-width='2' stroke-linecap='round'/%3E${bar.replace(/</g, "%3C").replace(/>/g, "%3E")}%3C/svg%3E") 22 22`;
};

export const SHOWROOM_CSS = `
.sr-in { animation: sr-in .75s cubic-bezier(.22,1,.36,1) both; }
@keyframes sr-in { from { opacity: 0; transform: translateY(26px) scale(.98); } to { opacity: 1; transform: none; } }
.sr-drop { animation: sr-drop .6s cubic-bezier(.22,1,.36,1) both; }
@keyframes sr-drop { from { transform: translateY(-100%); } to { transform: none; } }
.sr-fade { animation: sr-fade .35s ease-out both; }
@keyframes sr-fade { from { opacity: 0 } to { opacity: 1 } }
.sr-slide { animation: sr-slide .45s cubic-bezier(.22,1,.36,1) both; }
@keyframes sr-slide { from { transform: translateX(100%); } to { transform: none; } }
.sr-pop { animation: sr-pop .45s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes sr-pop { from { transform: scale(.4); opacity: 0; } to { transform: none; opacity: 1; } }
.sr-chip { animation: sr-in .55s cubic-bezier(.22,1,.36,1) both; }
.sr-cur-in { cursor: ${loupe("+")}, zoom-in; }
.sr-cur-out { cursor: ${loupe("-")}, zoom-out; }

/* gold hairline with a travelling glint under the header */
.sr-hair { position: relative; height: 1px; background: linear-gradient(90deg, transparent, rgba(184,149,111,.45), transparent); overflow: hidden; }
.sr-hair::after { content: ""; position: absolute; inset: 0; width: 18%; background: linear-gradient(90deg, transparent, #f3dcae, transparent); animation: sr-glint 5s ease-in-out infinite; }
@keyframes sr-glint { from { transform: translateX(-120%); } to { transform: translateX(650%); } }

/* cards: second photo fades in on hover, the frame warms up */
.sr-card .sr-alt { opacity: 0; transition: opacity .9s cubic-bezier(.22,1,.36,1), transform 1.4s cubic-bezier(.22,1,.36,1); }
.sr-card:hover .sr-alt { opacity: 1; }
.sr-card .sr-ph { transition: transform 1.4s cubic-bezier(.22,1,.36,1); }
.sr-card:hover .sr-ph { transform: scale(1.06); }
.sr-card::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(184,149,111,0); transition: box-shadow .6s; }
.sr-card:hover::after { box-shadow: inset 0 0 0 1px rgba(184,149,111,.55); }

/* product view */
.sr-view { animation: sr-view .55s cubic-bezier(.22,1,.36,1) both; }
@keyframes sr-view { from { opacity: 0; clip-path: inset(5% 5% 5% 5% round 20px); } to { opacity: 1; clip-path: inset(0 0 0 0 round 0); } }
.sr-swap { animation: sr-swap .7s cubic-bezier(.22,1,.36,1) both; }
@keyframes sr-swap { from { opacity: 0; transform: scale(.95); filter: blur(8px); } to { opacity: 1; transform: none; filter: none; } }
.sr-stagger > * { animation: sr-in .65s cubic-bezier(.22,1,.36,1) both; }
${Array.from({ length: 10 }, (_, i) => `.sr-stagger > *:nth-child(${i + 1}) { animation-delay: ${120 + i * 65}ms; }`).join("\n")}
.sr-track { scrollbar-width: none; }
.sr-track::-webkit-scrollbar { display: none; }
.sr-stage { background: radial-gradient(90% 80% at 50% 45%, #3a4b40 0%, #2c3930 55%, #1d2620 100%); }

@media (prefers-reduced-motion: reduce) {
  .sr-in, .sr-drop, .sr-fade, .sr-slide, .sr-pop, .sr-chip, .sr-view, .sr-swap, .sr-stagger > *, .sr-hair::after { animation: none !important; }
}
`;

export { QtyStepper as Stepper } from "./QtyStepper";

/** Icon for a specification row, chosen from its label. */
function specIcon(label: string) {
  const l = label.toLowerCase();
  if (/قدر|استطاع|واط|watt|power/.test(l)) return Zap;
  if (/حرار|كلفن|kelvin|cct/.test(l)) return Thermometer;
  if (/خام|ماد|material/.test(l)) return Gem;
  if (/قطر|أبعاد|ابعاد|طول|عرض|ارتفاع|مقاس|size|dimension/.test(l)) return Ruler;
  if (/لون|colou?r|تشطيب/.test(l)) return Palette;
  if (/حماي|ip|مقاوم/.test(l)) return Droplets;
  if (/ضمان|كفال|warranty/.test(l)) return ShieldCheck;
  if (/وزن|weight/.test(l)) return Weight;
  if (/جهد|فولت|volt|تيار|أمبير/.test(l)) return Power;
  if (/لومن|lumen|سطوع|إضاء|اضاء/.test(l)) return Sun;
  if (/لمب|قاعد|عدد|bulb|socket/.test(l)) return Lightbulb;
  return Info;
}

/** "اسم المنتج — لقطة مقرّبة" → "لقطة مقرّبة" */
const caption = (m: Media | undefined, i: number) => {
  const alt = m?.alt ?? "";
  const part = alt.includes(" — ") ? alt.split(" — ").pop()! : "";
  return part || (i === 0 ? "الصورة الرئيسية" : `صورة ${i + 1}`);
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const MAX_ZOOM = 4;

/**
 * One photo that can be inspected closely:
 *  - tap / click → zoom 2.5× exactly where you pointed; tap again → back
 *  - while zoomed, moving the pointer or dragging a finger pans across the product
 *  - two fingers pinch between 1× and 4×; ctrl/trackpad wheel zooms too
 */
function ZoomPhoto({ media, alt, zoom, setZoom, eager }: { media: Media; alt: string; zoom: number; setZoom: (z: number) => void; eager: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const down = useRef<{ x: number; y: number } | null>(null);

  const toOrigin = (x: number, y: number) => {
    const r = box.current!.getBoundingClientRect();
    return { x: clamp(((x - r.left) / r.width) * 100, 0, 100), y: clamp(((y - r.top) / r.height) * 100, 0, 100) };
  };
  const dist = () => { const [a, b] = [...pts.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const src = (zoom > 1 ? media.url : media.lg) || media.url;

  return (
    <div
      ref={box}
      className={cn("relative h-full w-full overflow-hidden select-none", zoom > 1 ? "sr-cur-out touch-none" : "sr-cur-in")}
      onPointerDown={(e) => {
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        down.current = { x: e.clientX, y: e.clientY };
        if (pts.current.size === 2) { pinch.current = { d: dist(), z: zoom }; e.currentTarget.setPointerCapture(e.pointerId); }
        else if (zoom > 1) e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (pts.current.has(e.pointerId)) pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch.current && pts.current.size === 2) {
          const [a, b] = [...pts.current.values()];
          setZoom(clamp((pinch.current.z * dist()) / pinch.current.d, 1, MAX_ZOOM));
          setOrigin(toOrigin((a.x + b.x) / 2, (a.y + b.y) / 2));
        } else if (zoom > 1 && (e.pointerType === "mouse" || pts.current.has(e.pointerId))) setOrigin(toOrigin(e.clientX, e.clientY));
      }}
      onPointerUp={(e) => {
        pts.current.delete(e.pointerId);
        if (pts.current.size < 2) pinch.current = null;
        const d = down.current;
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8 && pts.current.size === 0) {
          setOrigin(toOrigin(e.clientX, e.clientY)); // a tap, not a drag: toggle zoom at that point
          setZoom(zoom > 1 ? 1 : 2.5);
        }
        down.current = null;
      }}
      onPointerCancel={(e) => { pts.current.delete(e.pointerId); pinch.current = null; }}
      onWheel={(e) => { if (!e.ctrlKey) return; setOrigin(toOrigin(e.clientX, e.clientY)); setZoom(clamp(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, MAX_ZOOM)); }}
    >
      <div className="absolute inset-0 p-3 md:p-8 transition-transform duration-300 ease-out" style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}>
        <div className="relative h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} draggable={false} loading={eager ? "eager" : "lazy"} decoding="async" className="sr-base absolute inset-0 h-full w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

export function Spotlight({ p, index, total, cart, inCartQty, canBuy, onClose, onPrev, onNext, onAdd, adding }: {
  p: Product; index: number; total: number; cart?: Cart; inCartQty: number; canBuy: boolean;
  onClose: () => void; onPrev: () => void; onNext: () => void;
  onAdd: (qty: number, from?: HTMLElement | null, to?: HTMLElement | null) => void; adding: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [full, setFull] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const miniCart = useRef<HTMLSpanElement>(null);
  const settle = useRef(0);
  const detail = useQuery({ queryKey: ["product", p.slug], queryFn: async () => (await get<{ data: Product }>(`/products/${p.slug}`)).data });
  const d = detail.data ?? p;
  const images: Media[] = d.images?.length ? d.images.map((i) => i.image).filter(Boolean) : d.image ? [d.image] : [];
  const many = images.length > 1;

  useEffect(() => { setQty(1); setImg(0); setZoom(1); track.current?.scrollTo({ left: 0 }); }, [p.id]);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const goImg = useCallback((i: number) => {
    const n = images.length;
    if (!n) return;
    const next = (i + n) % n;
    setZoom(1);
    setImg(next);
    const el = track.current;
    if (el) {
      const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1; // RTL scrollLeft runs from 0 to negative
      const left = sign * next * el.clientWidth;
      el.scrollTo({ left, behavior: reducedMotion() ? "auto" : "smooth" });
      window.setTimeout(() => { if (Math.abs(el.scrollLeft - left) > 4) el.scrollTo({ left, behavior: "auto" }); }, 700);
    }
  }, [images.length]);

  useEffect(() => {
    // ← / → move between photos when there are several, otherwise between products
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (zoom > 1) setZoom(1); else if (full) setFull(false); else onClose(); }
      if (e.key === "ArrowLeft") (many ? () => goImg(img + 1) : onNext)();
      if (e.key === "ArrowRight") (many ? () => goImg(img - 1) : onPrev)();
      if (e.key === "+" || e.key === "=") setZoom((z) => clamp(z + 0.75, 1, MAX_ZOOM));
      if (e.key === "-") setZoom((z) => clamp(z - 0.75, 1, MAX_ZOOM));
    };
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose, onNext, onPrev, goImg, img, many, zoom, full]);

  // keep the counter in sync with swipes, once the swipe has settled
  const onScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = track.current;
      if (!el || !el.clientWidth) return;
      const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
      setImg((cur) => { if (i !== cur) setZoom(1); return i; });
    }, 140);
  };

  const specs = (d.specifications ?? []).slice(0, 8);
  const glass = "bg-black/35 text-white ring-1 ring-white/15 backdrop-blur-md";
  const roundBtn = cn("flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 hover:bg-black/55 active:scale-95 cursor-pointer disabled:opacity-30", glass);

  return (
    <div className="sr-view fixed inset-0 z-40 flex bg-[#fbf9f5]" role="dialog" aria-modal="true" aria-label={d.name}>
      <div className="flex w-full flex-col lg:flex-row">
        {/* ---------- stage ---------- */}
        <div className={cn("sr-stage relative shrink-0 overflow-hidden transition-[height] duration-500", full ? "h-full lg:flex-[1_1_100%]" : "h-[56vh] lg:h-auto lg:flex-1")}>
          <div ref={track} onScroll={onScroll} className={cn("sr-track relative flex h-full snap-x snap-mandatory", zoom > 1 ? "overflow-hidden" : "overflow-x-auto")}>
            {images.length ? images.map((m, i) => (
              <div key={m.id ?? i} className="relative h-full w-full shrink-0 snap-center">
                <div key={`${p.id}-${i}`} className="sr-swap h-full w-full">
                  <ZoomPhoto media={m} alt={d.name} zoom={i === img ? zoom : 1} setZoom={setZoom} eager={Math.abs(i - img) <= 1} />
                </div>
              </div>
            )) : <div className="flex h-full w-full items-center justify-center text-white/50">لا توجد صورة</div>}
          </div>

          {/* top bar */}
          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2 md:inset-x-6 md:top-6">
            <button onClick={onClose} className={roundBtn} aria-label="إغلاق"><X className="h-5 w-5" /></button>
            {many && <span className={cn("hidden md:block rounded-full px-4 py-2 text-[12px] tracking-[0.12em] sr-fade", glass)} key={img}>{caption(images[img], img)}</span>}
            <div className="flex items-center gap-2">
              <button onClick={() => setFull((v) => !v)} className={roundBtn} aria-label={full ? "تصغير العرض" : "ملء الشاشة"}>{full ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}</button>
            </div>
          </div>

          {/* photo arrows */}
          {many && (
            <>
              <button onClick={() => goImg(img - 1)} className={cn(roundBtn, "absolute top-1/2 end-4 h-12 w-12 -translate-y-1/2 md:end-6")} aria-label="الصورة السابقة"><ChevronLeft className="h-6 w-6" /></button>
              <button onClick={() => goImg(img + 1)} className={cn(roundBtn, "absolute top-1/2 start-4 h-12 w-12 -translate-y-1/2 md:start-6")} aria-label="الصورة التالية"><ChevronRight className="h-6 w-6" /></button>
            </>
          )}

          {/* bottom: zoom, captioned thumbnails, counter */}
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 md:inset-x-6 md:bottom-6">
            <div className={cn("flex items-center overflow-hidden rounded-full", glass)}>
              <button onClick={() => setZoom((z) => clamp(z - 0.75, 1, MAX_ZOOM))} disabled={zoom <= 1} className="flex h-11 w-11 items-center justify-center disabled:opacity-30 cursor-pointer" aria-label="تصغير الصورة"><ZoomOut className="h-5 w-5" /></button>
              <span className="min-w-12 text-center text-[12px] font-semibold tabular" dir="ltr">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => clamp(z + 0.75, 1, MAX_ZOOM))} disabled={zoom >= MAX_ZOOM} className="flex h-11 w-11 items-center justify-center disabled:opacity-30 cursor-pointer" aria-label="تكبير الصورة"><ZoomIn className="h-5 w-5" /></button>
            </div>
            {many && (
              <div className="scroll-thin flex max-w-[64%] gap-2.5 overflow-x-auto p-1">
                {images.map((m, i) => (
                  <button key={m.id ?? i} onClick={() => goImg(i)} title={caption(m, i)} aria-label={`الصورة ${i + 1}: ${caption(m, i)}`}
                    className={cn("group/t relative h-16 w-16 shrink-0 overflow-hidden rounded-[8px] transition duration-500 cursor-pointer", i === img ? "ring-2 ring-[#d3bf9a] ring-offset-2 ring-offset-black/40 scale-105" : "opacity-55 hover:opacity-100")}>
                    <Img media={m} variant="thumb" className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1 pb-0.5 pt-3 text-[9px] leading-tight text-white/90 line-clamp-1">{caption(m, i)}</span>
                  </button>
                ))}
              </div>
            )}
            {many && <span className={cn("rounded-full px-3.5 py-2 text-[12px] font-semibold tabular", glass)} dir="ltr">{String(img + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>}
          </div>
          {zoom === 1 && <p className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/80 backdrop-blur sr-fade">اضغط على الصورة للتكبير{many ? " · اسحب للتنقل بين الصور" : ""}</p>}
        </div>

        {/* ---------- info ---------- */}
        {!full && (
          <div key={p.id} className="scroll-thin flex flex-1 flex-col overflow-y-auto p-6 md:p-10 lg:max-w-[560px]">
            <div className="flex items-center justify-between gap-3 sr-in">
              <div className="flex items-center gap-1.5 rounded-full border border-gold-200 bg-white p-1">
                <button onClick={onPrev} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gold-50 hover:text-gold-700 cursor-pointer" aria-label="المنتج السابق"><ChevronRight className="h-4 w-4" /></button>
                <span className="px-1 text-[12px] font-medium text-gray-500 tabular" dir="ltr">{index + 1} / {total}</span>
                <button onClick={onNext} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gold-50 hover:text-gold-700 cursor-pointer" aria-label="المنتج التالي"><ChevronLeft className="h-4 w-4" /></button>
              </div>
              {canBuy && (
                <span ref={miniCart} className="flex h-11 items-center gap-2 rounded-full bg-brand-green px-4 text-[13px] font-semibold text-white tabular">
                  <ShoppingBag className="h-4 w-4" />{cart?.items_count ?? 0}
                </span>
              )}
            </div>

            <div className="sr-stagger mt-8 flex flex-1 flex-col">
              <div className="flex items-center gap-3 text-[12px] tracking-[0.16em] text-gold-600">
                {d.brand?.logo ? <Img media={d.brand.logo} variant="thumb" className="h-6 w-auto max-w-[110px] object-contain" /> : d.brand?.name && <span>{d.brand.name}</span>}
                <span className="h-px w-8 bg-gold-300" />
                <span dir="ltr">{d.sku}</span>
              </div>
              <h2 className="mt-4 font-display text-[30px] md:text-[40px] font-semibold leading-[1.2] text-brand-green">{d.name}</h2>
              {d.short_description ? <p className="mt-4 text-[16px] leading-8 text-gray-600">{d.short_description}</p> : <span />}
              {specs.length > 0 ? (
                <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-gold-100 bg-gold-100">
                  {specs.map((s, i) => {
                    const Icon = specIcon(s.label);
                    return (
                      <div key={i} className="sr-in flex items-start gap-3 bg-white px-4 py-3.5 transition hover:bg-gold-50" style={{ animationDelay: `${320 + i * 55}ms` }}>
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600"><Icon className="h-4 w-4" /></span>
                        <div className="min-w-0">
                          <dt className="text-[11.5px] text-gray-500">{s.label}</dt>
                          <dd className="mt-0.5 text-[15px] font-semibold text-brand-green" dir="auto">{s.value}</dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              ) : <span />}

              <div className="mt-auto pt-10">
                <div className="relative overflow-hidden rounded-[12px] bg-[#2c3930] p-6 text-white">
                  <span className="pointer-events-none absolute -top-16 -end-10 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(240,201,138,.35),transparent)]" aria-hidden />
                  <div className="relative flex items-end justify-between gap-4">
                    <div className="leading-tight">
                      <div className="text-[12px] tracking-[0.12em] text-[#d3bf9a]">السعر / {d.unit}</div>
                      <div className="mt-1 font-display text-[36px] font-semibold tabular" dir="ltr" style={{ textAlign: "right" }}>{fmtUsd(d.price)}</div>
                      <div className="text-[15px] font-medium text-[#d3bf9a] tabular">{fmtSyp(d.price_syp)}</div>
                    </div>
                    {canBuy && d.is_purchasable && <QtyStepper value={qty} onChange={setQty} min={1} dark />}
                  </div>
                  {canBuy && d.is_purchasable && (
                    <div className="relative mt-4 flex items-center gap-2">
                      <span className="text-[12px] text-[#d3bf9a]">كمية سريعة</span>
                      {[5, 10, 20, 50].map((n) => (
                        <button key={n} onClick={() => setQty(n)} className={cn("h-9 min-w-11 rounded-full px-3 text-[14px] font-semibold tabular transition cursor-pointer", qty === n ? "bg-[#d3bf9a] text-[#2c3930]" : "bg-white/10 text-white hover:bg-white/20")}>{n}</button>
                      ))}
                    </div>
                  )}
                  {canBuy && (
                    <button
                      disabled={!d.is_purchasable || adding}
                      onClick={() => onAdd(qty, track.current?.children[img]?.querySelector<HTMLElement>("img.sr-base"), miniCart.current)}
                      className="relative mt-5 flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-l from-[#e6cfa3] via-[#d3bf9a] to-[#b8956f] text-[17px] font-semibold text-[#2c3930] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                    >
                      <ShoppingBag className="h-5 w-5" /> {d.is_purchasable ? `أضف ${qty > 1 ? qty + " " : ""}إلى السلة` : "غير متوفر حالياً"}
                    </button>
                  )}
                </div>
                {inCartQty > 0 && <p key={inCartQty} className="sr-pop mt-3 text-center text-[13px] text-success">موجود في السلة: {inCartQty}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
