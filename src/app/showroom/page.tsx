"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, FileText, Minus, Plus, Search, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { fmtSyp, fmtUsd, useExchange } from "@/components/app/Price";
import { Img } from "@/components/ui";
import { SerajLoader } from "@/components/SerajLoader";
import { del, errorMessage, get, patch, post } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Cart, Category, Paginated, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Showroom / presentation mode — for engineers & sales showing products to a customer
 * on a tablet, iPad, phone or laptop. Big imagery, one-tap "add", live cart with both currencies.
 * All prices & totals come from the API (nothing is computed here).
 */
export default function ShowroomPage() {
  const me = useMe();
  const router = useRouter();
  const qc = useQueryClient();
  const fx = useExchange();
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [spot, setSpot] = useState<number | null>(null);
  const [bump, setBump] = useState(0);

  useEffect(() => { if (me.isFetched && !me.data) router.replace("/login?next=/showroom"); }, [me.isFetched, me.data, router]);
  useEffect(() => { const t = setTimeout(() => setSearch(q), 300); return () => clearTimeout(t); }, [q]);

  const canBuy = me.data?.role === "commercial_user";
  const cats = useQuery({ queryKey: ["catalog-categories"], queryFn: async () => (await get<{ data: Category[] }>("/categories")).data, enabled: !!me.data, staleTime: 300_000 });
  const products = useQuery({
    queryKey: ["showroom", category, search],
    queryFn: () => get<Paginated<Product>>("/products", { category, q: search, per_page: 60 }),
    enabled: !!me.data,
    placeholderData: keepPreviousData,
  });
  const cart = useQuery({ queryKey: ["cart"], queryFn: async () => (await get<{ data: Cart }>("/carts/current")).data, enabled: canBuy });
  const inCart = useMemo(() => new Map((cart.data?.items ?? []).map((i) => [i.product_id, i])), [cart.data]);

  const setCart = (c: Cart) => qc.setQueryData(["cart"], c);
  const add = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => post<{ data: Cart }>("/carts/current/items", { product_id: id, quantity: qty }),
    onSuccess: (r) => { setCart(r.data); setBump((b) => b + 1); toast.success("أُضيف إلى السلة", { duration: 1200 }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const setQty = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: number; qty: number }) => (qty <= 0 ? del<{ data: Cart }>(`/carts/current/items/${itemId}`) : patch<{ data: Cart }>(`/carts/current/items/${itemId}`, { quantity: qty })),
    onSuccess: (r) => setCart(r.data),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const list = products.data?.data ?? [];
  const spotProduct = spot !== null ? list[spot] : null;

  if (!me.data) return <SerajLoader className="!min-h-screen" />;

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-30 border-b border-gold-200/60 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3 md:px-8">
          <Link href="/app/catalog" className="shrink-0" aria-label="خروج من وضع العرض">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/seraj-horizontal.png" alt="السراج المضيء" className="h-9 md:h-11 w-auto" />
          </Link>
          <div className="relative mx-auto w-full max-w-md">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج…" className="h-12 w-full rounded-full border border-gray-200 bg-white ps-12 pe-4 text-[15px] focus:border-gold-500 focus:outline-none focus:ring-[3px] focus:ring-gold-500/20" />
          </div>
          {canBuy && (
            <button onClick={() => setCartOpen(true)} key={bump} className="relative flex h-12 shrink-0 items-center gap-2.5 rounded-[2px] bg-gold-gradient ps-4 pe-5 text-white shadow-gold transition active:scale-95 animate-[pop_.35s_ease-out] cursor-pointer" aria-label="السلة">
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:block text-start leading-tight">
                <span className="block text-[14px] font-semibold tabular" dir="ltr">{fmtUsd(cart.data?.subtotal ?? 0)}</span>
                <span className="block text-[11px] opacity-90 tabular">{fmtSyp(cart.data?.subtotal_syp ?? 0)}</span>
              </span>
              {!!cart.data?.items_count && <span className="absolute -top-1.5 -end-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-green px-1.5 text-[12px] font-bold tabular ring-2 ring-white">{cart.data.items_count}</span>}
            </button>
          )}
          <Link href="/app/catalog" className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-brand-green" aria-label="خروج"><X className="h-5 w-5" /></Link>
        </div>
        {/* categories */}
        <div className="scroll-thin flex gap-2 overflow-x-auto px-4 pb-3 md:px-8">
          <Chip active={!category} onClick={() => setCategory("")}><Sparkles className="h-4 w-4" /> الكل</Chip>
          {cats.data?.map((c) => (
            <Chip key={c.id} active={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.image && <Img media={c.image} variant="thumb" className="h-7 w-7 rounded-full object-cover" />}{c.name}
            </Chip>
          ))}
        </div>
      </header>

      {/* ---------- grid ---------- */}
      <main className="px-4 py-6 md:px-8 md:py-8">
        {products.isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-[4px]" />)}</div>
        ) : list.length === 0 ? (
          <div className="py-24 text-center text-gray-500">لا توجد منتجات مطابقة</div>
        ) : (
          <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 transition-opacity", products.isFetching && "opacity-70")}>
            {list.map((p, idx) => {
              const item = inCart.get(p.id);
              return (
                <article key={p.id} className={cn("group relative overflow-hidden rounded-[4px] bg-white shadow-sm ring-1 ring-black/[0.04] transition duration-500 ease-lux", p.is_purchasable ? "hover:-translate-y-1 hover:shadow-lg" : "opacity-90")}>
                  <button onClick={() => setSpot(idx)} className="relative block aspect-square w-full overflow-hidden bg-white cursor-pointer" aria-label={`عرض ${p.name}`}>
                    <Img media={p.image} variant="md" alt={p.name} className={cn("h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-105", !p.is_purchasable && "grayscale-[0.7]")} />
                    <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
                    {p.brand?.logo && <span className="absolute top-4 start-4 flex h-9 items-center rounded-[2px] bg-white/95 px-3 shadow-sm"><Img media={p.brand.logo} variant="thumb" className="h-4 w-auto max-w-[70px] object-contain" /></span>}
                    {!p.is_purchasable && <span className="absolute top-4 end-4 rounded-[2px] bg-white/95 px-3 py-1 text-[12px] font-medium text-gray-700">غير متوفر حالياً</span>}
                    {item && <span className="absolute top-4 end-4 flex items-center gap-1 rounded-[2px] bg-success px-3 py-1 text-[12px] font-medium text-white"><Check className="h-3.5 w-3.5" /> في السلة ×{Number(item.quantity)}</span>}
                  </button>
                  <div className="p-5">
                    <div className="text-[12px] text-gray-400" dir="ltr" style={{ textAlign: "right" }}>{p.sku}</div>
                    <h3 className="mt-1 line-clamp-1 text-[18px] font-semibold text-brand-green">{p.name}</h3>
                    {p.short_description && <p className="mt-1 line-clamp-2 min-h-[40px] text-[13px] leading-5 text-gray-500">{p.short_description}</p>}
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div className="leading-tight">
                        <div className="font-display text-[24px] font-semibold text-brand-green tabular" dir="ltr" style={{ textAlign: "right" }}>{fmtUsd(p.price)}</div>
                        <div className="text-[13px] font-medium text-gold-700 tabular">{fmtSyp(p.price_syp)}</div>
                      </div>
                      {canBuy && (item ? (
                        <Stepper value={Number(item.quantity)} onChange={(v) => setQty.mutate({ itemId: item.id, qty: v })} />
                      ) : (
                        <button disabled={!p.is_purchasable || add.isPending} onClick={() => add.mutate({ id: p.id, qty: 1 })} className="flex h-14 items-center gap-2 rounded-[4px] bg-gold-gradient px-6 text-[16px] font-semibold text-white shadow-gold transition active:scale-95 disabled:opacity-40 disabled:shadow-none cursor-pointer">
                          <Plus className="h-5 w-5" /> أضف
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {fx.data?.rate && <p className="mt-8 text-center text-[12px] text-gray-400">الأسعار بالليرة السورية وفق سعر صرف {fx.data.effective_date}: 1$ = {fmtSyp(fx.data.rate)}</p>}
      </main>

      {/* ---------- spotlight ---------- */}
      {spotProduct && (
        <Spotlight
          p={spotProduct}
          inCartQty={inCart.get(spotProduct.id) ? Number(inCart.get(spotProduct.id)!.quantity) : 0}
          canBuy={canBuy}
          onClose={() => setSpot(null)}
          onPrev={() => setSpot((s) => (s === null ? s : (s - 1 + list.length) % list.length))}
          onNext={() => setSpot((s) => (s === null ? s : (s + 1) % list.length))}
          onAdd={(qty) => add.mutate({ id: spotProduct.id, qty })}
          adding={add.isPending}
        />
      )}

      {/* ---------- cart drawer ---------- */}
      {canBuy && cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-full max-w-md flex-col bg-white shadow-2xl animate-[slidein_.3s_ease-out]">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-[20px] font-semibold text-brand-green">سلة الزبون</h2>
              <button onClick={() => setCartOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-50 cursor-pointer" aria-label="إغلاق"><X className="h-6 w-6" /></button>
            </div>
            <div className="scroll-thin flex-1 divide-y divide-gray-100 overflow-y-auto">
              {!cart.data?.items.length && <div className="p-10 text-center text-gray-400">السلة فارغة — اضغط «أضف» على أي منتج</div>}
              {cart.data?.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-4">
                  <Img media={it.image} variant="thumb" className="h-20 w-20 shrink-0 rounded-[4px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-[15px] font-medium text-brand-green">{it.name}</div>
                    <div className="mt-0.5 text-[13px] font-semibold tabular" dir="ltr" style={{ textAlign: "right" }}>{fmtUsd(it.line_total)}</div>
                    <div className="text-[12px] text-gold-700 tabular">{fmtSyp(it.line_total_syp)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Stepper value={Number(it.quantity)} onChange={(v) => setQty.mutate({ itemId: it.id, qty: v })} small />
                    <button onClick={() => setQty.mutate({ itemId: it.id, qty: 0 })} className="text-gray-400 hover:text-danger cursor-pointer" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 bg-gold-50/60 p-5">
              <div className="flex items-end justify-between">
                <span className="text-[15px] text-gray-700">الإجمالي</span>
                <div className="text-end leading-tight">
                  <div className="font-display text-[28px] font-semibold text-brand-green tabular" dir="ltr">{fmtUsd(cart.data?.subtotal ?? 0)}</div>
                  <div className="text-[15px] font-medium text-gold-700 tabular">{fmtSyp(cart.data?.subtotal_syp ?? 0)}</div>
                </div>
              </div>
              <Link href="/app/cart" className={cn("mt-4 flex h-14 items-center justify-center gap-2 rounded-[4px] bg-gold-gradient text-[16px] font-semibold text-white shadow-gold", !cart.data?.items_count && "pointer-events-none opacity-40")}>
                <FileText className="h-5 w-5" /> متابعة وإصدار عرض السعر
              </Link>
              <p className="mt-2 text-center text-[12px] text-gray-500">يمكنك إضافة الحسم وبيانات الزبون في الخطوة التالية</p>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        @keyframes pop { 0% { transform: scale(1) } 40% { transform: scale(1.08) } 100% { transform: scale(1) } }
        @keyframes slidein { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("flex h-11 shrink-0 items-center gap-2 rounded-full border ps-1.5 pe-4 text-[14px] font-medium transition cursor-pointer", active ? "border-transparent bg-brand-green text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gold-300", "[&>svg]:ms-2.5")}>
      {children}
    </button>
  );
}

function Stepper({ value, onChange, small }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  const h = small ? "h-10" : "h-14";
  const w = small ? "w-10" : "w-12";
  return (
    <div className={cn("flex items-center overflow-hidden rounded-[4px] border-2 border-gold-300 bg-white", h)}>
      <button onClick={() => onChange(value + 1)} className={cn("flex h-full items-center justify-center text-gold-700 active:bg-gold-50 cursor-pointer", w)} aria-label="زيادة"><Plus className="h-5 w-5" /></button>
      <span className={cn("min-w-8 text-center font-semibold tabular text-brand-green", small ? "text-[15px]" : "text-[18px]")}>{value}</span>
      <button onClick={() => onChange(value - 1)} className={cn("flex h-full items-center justify-center text-gold-700 active:bg-gold-50 cursor-pointer", w)} aria-label="إنقاص"><Minus className="h-5 w-5" /></button>
    </div>
  );
}

function Spotlight({ p, inCartQty, canBuy, onClose, onPrev, onNext, onAdd, adding }: { p: Product; inCartQty: number; canBuy: boolean; onClose: () => void; onPrev: () => void; onNext: () => void; onAdd: (qty: number) => void; adding: boolean }) {
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const touch = useRef<number | null>(null);
  const detail = useQuery({ queryKey: ["product", p.slug], queryFn: async () => (await get<{ data: Product }>(`/products/${p.slug}`)).data });
  const d = detail.data ?? p;
  const images = d.images?.length ? d.images.map((i) => i.image) : d.image ? [d.image] : [];
  useEffect(() => { setQty(1); setImg(0); }, [p.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") onNext(); if (e.key === "ArrowRight") onPrev(); };
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose, onNext, onPrev]);

  const specs = (d.specifications ?? []).slice(0, 8);
  return (
    <div className="fixed inset-0 z-40 flex bg-white animate-[fadein_.25s_ease-out]"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 60) (dx > 0 ? onNext : onPrev)(); touch.current = null; }}>
      <div className="flex w-full flex-col lg:flex-row">
        {/* image */}
        <div className="relative h-[46vh] shrink-0 bg-white lg:h-auto lg:flex-1">
          <Img media={images[img]} variant="lg" alt={d.name} className="absolute inset-0 h-full w-full object-contain" />
          <button onClick={onClose} className="absolute top-4 start-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow cursor-pointer" aria-label="إغلاق"><X className="h-6 w-6" /></button>
          <button onClick={onPrev} className="absolute top-1/2 end-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow cursor-pointer" aria-label="المنتج السابق"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={onNext} className="absolute top-1/2 start-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow cursor-pointer" aria-label="المنتج التالي"><ChevronRight className="h-6 w-6" /></button>
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((m, i) => <button key={m.id} onClick={() => setImg(i)} className={cn("h-14 w-14 overflow-hidden rounded-[4px] border-2 cursor-pointer", i === img ? "border-white" : "border-transparent opacity-70")}><Img media={m} variant="thumb" className="h-full w-full object-cover" /></button>)}
            </div>
          )}
        </div>
        {/* info */}
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto p-6 md:p-10 lg:max-w-xl">
          <div className="flex items-center gap-3">
            {d.brand?.logo && <Img media={d.brand.logo} variant="thumb" className="h-7 w-auto max-w-[110px] object-contain" />}
            <span className="text-[13px] text-gray-400" dir="ltr">{d.sku}</span>
          </div>
          <h2 className="mt-3 text-[28px] md:text-[36px] font-semibold leading-tight text-brand-green">{d.name}</h2>
          {d.short_description && <p className="mt-3 text-[16px] leading-8 text-gray-600">{d.short_description}</p>}
          {specs.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {specs.map((s, i) => (
                <div key={i} className="rounded-[4px] bg-[#f7f4ee] px-4 py-3">
                  <div className="text-[12px] text-gray-500">{s.label}</div>
                  <div className="mt-0.5 text-[15px] font-semibold text-brand-green" dir="auto">{s.value}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-auto pt-8">
            <div className="flex items-end justify-between gap-4 rounded-[4px] border border-gold-200 bg-gold-50/60 p-5">
              <div className="leading-tight">
                <div className="text-[13px] text-gray-500">السعر / {d.unit}</div>
                <div className="font-display text-[34px] font-semibold text-brand-green tabular" dir="ltr" style={{ textAlign: "right" }}>{fmtUsd(d.price)}</div>
                <div className="text-[16px] font-medium text-gold-700 tabular">{fmtSyp(d.price_syp)}</div>
              </div>
              {canBuy && d.is_purchasable && <Stepper value={qty} onChange={(v) => setQty(Math.max(1, v))} />}
            </div>
            {canBuy && (
              <button disabled={!d.is_purchasable || adding} onClick={() => onAdd(qty)} className="mt-4 flex h-16 w-full items-center justify-center gap-2.5 rounded-[4px] bg-gold-gradient text-[18px] font-semibold text-white shadow-gold transition active:scale-[0.98] disabled:opacity-40 cursor-pointer">
                <ShoppingBag className="h-6 w-6" /> {d.is_purchasable ? `أضف ${qty > 1 ? qty + " " : ""}إلى السلة` : "غير متوفر حالياً"}
              </button>
            )}
            {inCartQty > 0 && <p className="mt-3 text-center text-[13px] text-success">موجود في السلة: {inCartQty}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
