"use client";

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Lamp, LampCeiling, Lightbulb, Plug, Search, ShoppingBag, Sparkles, Sun, Trash2, Trees, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { fmtSyp, fmtUsd, useExchange } from "@/components/app/Price";
import { ShowroomCard, ShowroomCardSkeleton } from "@/components/app/ShowroomCard";
import { flyToCart, SHOWROOM_CSS, Spotlight, Stepper } from "@/components/app/ShowroomSpotlight";
import { SerajLogo } from "@/components/brand/SerajLogo";
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

/** A lighting icon for each category, picked from its name. */
function categoryIcon(name: string) {
  if (/تري|ثري|نجف/.test(name)) return LampCeiling;
  if (/سبوت|spot/i.test(name)) return Sun;
  if (/خارج|حديق/.test(name)) return Trees;
  if (/بريز|مفتاح|مفاتيح|كهرب/.test(name)) return Plug;
  if (/لمب|إكسسوار|اكسسوار/.test(name)) return Lightbulb;
  if (/إنارة|انارة|إضاءة|اضاءة/.test(name)) return Lamp;
  return Sparkles;
}

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
  const sentinel = useRef<HTMLDivElement>(null);
  const cartBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (me.isFetched && !me.data) router.replace("/login?next=/showroom"); }, [me.isFetched, me.data, router]);
  useEffect(() => { const t = setTimeout(() => setSearch(q), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setSpot(null); }, [category, search]);

  const canBuy = me.data?.role === "commercial_user";
  const cats = useQuery({ queryKey: ["catalog-categories"], queryFn: async () => (await get<{ data: Category[] }>("/categories")).data, enabled: !!me.data, staleTime: 300_000 });
  // endless grid: the next batch loads as the visitor nears the bottom
  const products = useInfiniteQuery({
    queryKey: ["showroom", category, search],
    queryFn: ({ pageParam }) => get<Paginated<Product>>("/products", { category, q: search, page: pageParam, per_page: PER_PAGE, with_gallery: 1 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    enabled: !!me.data,
    placeholderData: keepPreviousData,
  });
  const cart = useQuery({ queryKey: ["cart"], queryFn: async () => (await get<{ data: Cart }>("/carts/current")).data, enabled: canBuy });
  const inCart = useMemo(() => new Map((cart.data?.items ?? []).map((i) => [i.product_id, i])), [cart.data]);

  const setCart = (c: Cart) => qc.setQueryData(["cart"], c);
  const add = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number; from?: HTMLElement | null; to?: HTMLElement | null }) => post<{ data: Cart }>("/carts/current/items", { product_id: id, quantity: qty }),
    onMutate: (v) => flyToCart(v.from, v.to ?? cartBtn.current),
    onSuccess: (r) => { setCart(r.data); toast.success("أُضيف إلى السلة", { duration: 1200 }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const setQty = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: number; qty: number }) => (qty <= 0 ? del<{ data: Cart }>(`/carts/current/items/${itemId}`) : patch<{ data: Cart }>(`/carts/current/items/${itemId}`, { quantity: qty })),
    onSuccess: (r) => setCart(r.data),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const list = useMemo(() => products.data?.pages.flatMap((pg) => pg.data) ?? [], [products.data]);
  const total = products.data?.pages[0]?.meta.total;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = products;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !isFetchingNextPage) fetchNextPage(); }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, list.length]);
  const spotProduct = spot !== null ? list[spot] : null;
  const activeCat = cats.data?.find((c) => c.slug === category);

  if (!me.data) return <SerajLoader className="!min-h-screen" />;

  return (
    <div className="sr min-h-screen bg-white">
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl sr-drop">
        <div className="flex items-center gap-3 px-4 py-3 md:px-8">
          <Link href="/app/catalog" className="shrink-0" aria-label="خروج من وضع العرض">
            <SerajLogo id="sr" draw className="h-9 md:h-11" />
          </Link>
          <div className="relative mx-auto w-full max-w-md">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن ثريا، سبوت، أبليك…" className="h-12 w-full rounded-full border border-gold-200 bg-[#fbf9f5] ps-12 pe-4 text-[15px] transition focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-[4px] focus:ring-gold-500/15" />
          </div>
          {canBuy && (
            <button ref={cartBtn} onClick={() => setCartOpen(true)} className="relative flex h-12 shrink-0 items-center gap-3 rounded-full bg-[#2c3930] ps-2 pe-5 text-white transition hover:bg-[#1f2a23] active:scale-95 cursor-pointer" aria-label="سلة الزبون">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f3e2bf] to-[#b8956f] text-[#2c3930]"><ShoppingBag className="h-[18px] w-[18px]" /></span>
              <span className="hidden sm:block text-start leading-tight">
                <span className="block text-[14px] font-semibold tabular" dir="ltr">{fmtUsd(cart.data?.subtotal ?? 0)}</span>
                <span className="block text-[11px] text-[#d3bf9a] tabular">{fmtSyp(cart.data?.subtotal_syp ?? 0)}</span>
              </span>
              {!!cart.data?.items_count && <span key={cart.data.items_count} className="sr-pop absolute -top-1 -start-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d3bf9a] px-1.5 text-[12px] font-bold text-[#2c3930] tabular ring-2 ring-white">{cart.data.items_count}</span>}
            </button>
          )}
          <Link href="/app/catalog" className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-200 text-gray-500 transition duration-500 hover:rotate-90 hover:border-gold-400 hover:text-brand-green" aria-label="خروج"><X className="h-5 w-5" /></Link>
        </div>
        {/* categories */}
        <div className="scroll-thin flex gap-2 overflow-x-auto px-4 pb-3 md:px-8">
          <Chip active={!category} onClick={() => setCategory("")} i={0} icon={Sparkles}>كل المنتجات</Chip>
          {cats.data?.map((c, i) => (
            <Chip key={c.id} active={category === c.slug} onClick={() => setCategory(c.slug)} i={i + 1} icon={categoryIcon(c.name)}>{c.name}</Chip>
          ))}
        </div>
        <div className="sr-hair" aria-hidden />
      </header>

      {/* ---------- intro ---------- */}
      <section className="relative overflow-hidden px-3 pt-5 pb-3 sm:px-4 sm:pt-10 sm:pb-6 md:px-8 md:pt-14">
        <span className="pointer-events-none absolute -top-40 start-1/3 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(240,201,138,.28),transparent)]" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4 sr-in">
          <div>
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.28em] text-gold-600"><span className="lamp-dot" aria-hidden />صالة العرض · SHOWROOM</div>
            <h1 className="mt-2 font-display text-[22px] sm:mt-3 sm:text-[28px] md:text-[40px] font-semibold leading-tight text-brand-green">{activeCat ? activeCat.name : "اختر الضوء الذي يليق بمساحتك"}</h1>
          </div>
          {!products.isLoading && <p className="text-[14px] text-gray-500"><span className="font-display text-[22px] font-semibold text-gold-700 tabular">{total ?? list.length}</span> منتجاً</p>}
        </div>
      </section>

      {/* ---------- grid ---------- */}
      <main className="px-2.5 pb-10 sm:px-4 md:px-8">
        {products.isLoading ? (
          <div className={GRID}>{Array.from({ length: 12 }).map((_, i) => <ShowroomCardSkeleton key={i} />)}</div>
        ) : list.length === 0 ? (
          <div className="py-24 text-center text-gray-500 sr-in">لا توجد منتجات مطابقة</div>
        ) : (
          // keyed by the filter so every new selection deals its cards in again
          <div key={`${category}|${search}`} className={cn(GRID, "transition-opacity", products.isFetching && !isFetchingNextPage && "opacity-70")}>
            {list.map((p, idx) => {
              const item = inCart.get(p.id);
              return (
                <ShowroomCard key={p.id} p={p} index={idx % PER_PAGE} item={item} canBuy={canBuy} adding={add.isPending}
                  onOpen={() => setSpot(idx)}
                  onAdd={(from) => add.mutate({ id: p.id, qty: 1, from })}
                  onQty={(id, qty) => setQty.mutate({ itemId: id, qty })} />
              );
            })}
          </div>
        )}
        {/* reaching this line loads the next batch */}
        <div ref={sentinel} aria-hidden />
        {isFetchingNextPage && <div className="mt-12 flex justify-center gap-2" aria-label="جارٍ تحميل المزيد">{[0, 1, 2].map((i) => <span key={i} className="sr-hex sr-dotload h-4 w-[18px] bg-gold-400" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
        {!hasNextPage && list.length > PER_PAGE && <p className="mt-14 text-center text-[13px] text-gray-400">عُرضت كل المنتجات ({list.length})</p>}
        {fx.data?.rate && <p className="mt-10 text-center text-[12px] text-gray-400">الأسعار بالليرة السورية وفق سعر صرف {fx.data.effective_date}: 1$ = {fmtSyp(fx.data.rate)}</p>}
      </main>

      {/* ---------- product view ---------- */}
      {spotProduct && (
        <Spotlight
          p={spotProduct}
          index={spot!}
          total={list.length}
          cart={cart.data}
          inCartQty={inCart.get(spotProduct.id) ? Number(inCart.get(spotProduct.id)!.quantity) : 0}
          canBuy={canBuy}
          onClose={() => setSpot(null)}
          onPrev={() => setSpot((s) => (s === null ? s : (s - 1 + list.length) % list.length))}
          onNext={() => setSpot((s) => (s === null ? s : (s + 1) % list.length))}
          onAdd={(qty, from, to) => add.mutate({ id: spotProduct.id, qty, from, to })}
          adding={add.isPending}
        />
      )}

      {/* ---------- cart drawer ---------- */}
      {canBuy && cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px] sr-fade" onClick={() => setCartOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-full max-w-md flex-col bg-[#fbf9f5] shadow-2xl sr-slide">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <div className="text-[11px] tracking-[0.24em] text-gold-600">CUSTOMER CART</div>
                <h2 className="font-display text-[22px] font-semibold text-brand-green">سلة الزبون</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-200 text-gray-500 transition hover:rotate-90 hover:text-brand-green cursor-pointer" aria-label="إغلاق"><X className="h-5 w-5" /></button>
            </div>
            <div className="sr-hair" aria-hidden />
            <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4">
              {!cart.data?.items.length && <div className="p-10 text-center text-gray-400">السلة فارغة — اضغط «أضف» على أي منتج</div>}
              {cart.data?.items.map((it, i) => (
                <div key={it.id} className="sr-in flex items-center gap-3 rounded-[12px] bg-white p-3 shadow-[0_1px_2px_rgba(44,57,48,.05)]" style={{ animationDelay: `${Math.min(i, 10) * 50 + 120}ms` }}>
                  <Img media={it.image} variant="thumb" className="h-20 w-20 shrink-0 rounded-[10px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-[15px] font-medium text-brand-green">{it.name}</div>
                    <div className="mt-0.5 text-[13px] font-semibold tabular" dir="ltr" style={{ textAlign: "right" }}>{fmtUsd(it.line_total)}</div>
                    <div className="text-[12px] text-gold-700 tabular">{fmtSyp(it.line_total_syp)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Stepper value={Number(it.quantity)} onChange={(v) => setQty.mutate({ itemId: it.id, qty: v })} small delay={450} />
                    <button onClick={() => setQty.mutate({ itemId: it.id, qty: 0 })} className="text-gray-400 hover:text-danger cursor-pointer" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative overflow-hidden bg-[#2c3930] p-6 text-white">
              <span className="pointer-events-none absolute -top-20 -end-10 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(240,201,138,.3),transparent)]" aria-hidden />
              <div className="relative flex items-end justify-between">
                <span className="text-[14px] text-[#d3bf9a]">الإجمالي</span>
                <div className="text-end leading-tight">
                  <div className="font-display text-[30px] font-semibold tabular" dir="ltr">{fmtUsd(cart.data?.subtotal ?? 0)}</div>
                  <div className="text-[14px] font-medium text-[#d3bf9a] tabular">{fmtSyp(cart.data?.subtotal_syp ?? 0)}</div>
                </div>
              </div>
              <Link href="/app/cart" className={cn("relative mt-5 flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#e6cfa3] via-[#d3bf9a] to-[#b8956f] text-[16px] font-semibold text-[#2c3930] transition hover:brightness-105", !cart.data?.items_count && "pointer-events-none opacity-40")}>
                <FileText className="h-5 w-5" /> متابعة وإصدار عرض السعر
              </Link>
              <p className="relative mt-2.5 text-center text-[12px] text-white/50">يمكنك إضافة الحسم وبيانات الزبون في الخطوة التالية</p>
            </div>
          </aside>
        </div>
      )}

      <style>{SHOWROOM_CSS}</style>
    </div>
  );
}

/** One batch = four full rows of six; the next batch loads while scrolling. */
const PER_PAGE = 24;
/** 2 → 3 → 4 → 6 columns of small hexagons, so a laptop screen shows two to three rows at once. */
const GRID = "sr-honey grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 md:grid-cols-4 lg:grid-cols-6 lg:gap-x-6 xl:gap-x-8 2xl:gap-x-10";

function Chip({ active, onClick, children, i, icon: Icon }: { active: boolean; onClick: () => void; children: React.ReactNode; i: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button onClick={onClick} style={{ animationDelay: `${150 + Math.min(i, 12) * 40}ms` }}
      className={cn("sr-chip flex h-11 shrink-0 items-center gap-2 rounded-full border ps-1.5 pe-4 text-[14px] font-medium transition-all duration-300 cursor-pointer",
        active ? "border-transparent bg-[#2c3930] text-white shadow-md" : "border-gold-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gold-400")}>
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-full transition", active ? "bg-gradient-to-br from-[#f3e2bf] to-[#b8956f] text-[#2c3930]" : "bg-gold-50 text-gold-600")}><Icon className="h-4 w-4" /></span>
      {children}
    </button>
  );
}
