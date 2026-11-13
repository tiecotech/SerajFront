"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, Plus, Search, ShoppingBag, X, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Img, Select } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Brand, Cart, Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Price } from "./Price";

export function useCurrency() {
  const me = useMe();
  useQuery({ queryKey: ["cart"], queryFn: async () => (await get<{ data: Cart }>("/carts/current")).data, enabled: me.data?.role === "commercial_user" });
  return "$";
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      post<{ message: string; data: Cart }>("/carts/current/items", { product_id: productId, quantity }),
    onSuccess: (res) => {
      qc.setQueryData(["cart"], res.data);
      toast.success(res.message, { action: { label: "عرض السلة", onClick: () => (window.location.href = "/app/cart") } });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function QtyStepper({ value, onChange, min = 1, size = "md" }: { value: number; onChange: (v: number) => void; min?: number; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-9" : "h-[42px]";
  return (
    <div className={cn("inline-flex items-center rounded-[3px] border border-gray-200 bg-white", h)}>
      <button type="button" onClick={() => onChange(value + 1)} className="flex h-full w-9 items-center justify-center text-gray-500 hover:text-gold-600 cursor-pointer" aria-label="زيادة"><Plus className="h-4 w-4" /></button>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="h-full w-14 border-x border-gray-100 bg-transparent text-center text-[14px] font-medium tabular focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="الكمية"
      />
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="flex h-full w-9 items-center justify-center text-gray-500 hover:text-gold-600 cursor-pointer" aria-label="إنقاص"><Minus className="h-4 w-4" /></button>
    </div>
  );
}

export function ProductCard({ p, canBuy }: { p: Product; canBuy: boolean; currency?: string }) {
  const add = useAddToCart();
  const unavailable = !p.is_purchasable;
  return (
    <div className={cn("group flex flex-col overflow-hidden rounded-[4px] border border-gray-100 bg-white transition-all duration-300 ease-lux", unavailable ? "opacity-[0.92]" : "hover:-translate-y-0.5 hover:border-gold-200 hover:shadow-md")}>
      <Link href={`/app/products/${p.slug}`} className="relative block aspect-square overflow-hidden bg-white">
        <Img media={p.image} variant="md" alt={p.name} className={cn("h-full w-full object-cover transition-transform duration-500 ease-lux", unavailable ? "grayscale-[0.75] opacity-70" : "group-hover:scale-[1.03]")} />
        {unavailable && <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 py-1 text-center text-[12px] font-medium text-gray-700 backdrop-blur">غير متوفر حالياً</span>}
        {p.brand?.logo && (
          <span className="absolute top-3 start-3 flex h-9 items-center rounded-[2px] bg-white/95 px-3 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.brand.logo.thumb} alt={p.brand.name} className="h-4 w-auto max-w-[64px] object-contain" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] tracking-wide text-gray-400" dir="ltr" style={{ textAlign: "right" }}>{p.sku}</div>
        <Link href={`/app/products/${p.slug}`} className="mt-1 line-clamp-2 min-h-[44px] text-[15px] font-medium leading-snug text-brand-green hover:text-gold-700">{p.name}</Link>
        <div className="mt-1 text-[12px] text-gray-500">{p.category?.name}</div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <Price usd={p.price} syp={p.price_syp} size="md" />
            <div className="mt-0.5 text-[11px] text-gray-400">لكل {p.unit}</div>
          </div>
          {canBuy && (
            <Button size="sm" variant={unavailable ? "secondary" : "primary"} disabled={unavailable} loading={add.isPending} onClick={() => add.mutate({ productId: p.id, quantity: 1 })} aria-label="إضافة إلى السلة">
              <ShoppingBag className="h-4 w-4" /> {unavailable ? "غير متوفر" : "أضف"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[4px] border border-gray-100 bg-white">
          <div className="skeleton aspect-square" />
          <div className="space-y-2 p-4"><div className="skeleton h-3 w-16 rounded" /><div className="skeleton h-4 w-full rounded" /><div className="skeleton h-5 w-24 rounded" /></div>
        </div>
      ))}
    </div>
  );
}

export type Filters = { q: string; brand: string; availability: string; sort: string; category?: string };

export function ProductFilters({ value, onChange, showCategory = true }: { value: Filters; onChange: (f: Filters) => void; showCategory?: boolean }) {
  const [q, setQ] = useState(value.q);
  const brands = useQuery({ queryKey: ["catalog-brands"], queryFn: async () => (await get<{ data: Brand[] }>("/brands")).data, staleTime: 300_000 });
  const cats = useQuery({ queryKey: ["catalog-categories"], queryFn: async () => (await get<{ data: Category[] }>("/categories")).data, staleTime: 300_000, enabled: showCategory });
  useEffect(() => {
    const t = setTimeout(() => q !== value.q && onChange({ ...value, q }), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-[4px] border border-gray-100 bg-white p-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الكود أو البراند…" className="h-[42px] w-full rounded-[3px] border border-gray-200 ps-10 pe-10 text-[14px] focus:border-gold-500 focus:outline-none focus:ring-[3px] focus:ring-gold-500/20" />
        {q && <button onClick={() => setQ("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" aria-label="مسح"><X className="h-4 w-4" /></button>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
        {showCategory && (
          <Select value={value.category ?? ""} onChange={(e) => onChange({ ...value, category: e.target.value })} className="lg:w-44">
            <option value="">كل التصنيفات</option>
            {cats.data?.flatMap((c) => [c, ...(c.children ?? [])]).map((c) => <option key={c.id} value={c.slug}>{c.parent_id ? "— " : ""}{c.name}</option>)}
          </Select>
        )}
        <Select value={value.brand} onChange={(e) => onChange({ ...value, brand: e.target.value })} className="lg:w-36">
          <option value="">كل البراندات</option>
          {brands.data?.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
        </Select>
        <Select value={value.availability} onChange={(e) => onChange({ ...value, availability: e.target.value })} className="lg:w-36">
          <option value="">كل الحالات</option>
          <option value="available">متوفر</option>
          <option value="out_of_stock">غير متوفر</option>
        </Select>
        <Select value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value })} className="lg:w-40">
          <option value="name">الاسم (أ-ي)</option>
          <option value="-name">الاسم (ي-أ)</option>
          <option value="price">السعر: الأقل أولاً</option>
          <option value="-price">السعر: الأعلى أولاً</option>
          <option value="newest">الأحدث</option>
        </Select>
      </div>
      <Link href="/app/visual-search" className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[3px] border border-gold-300 px-4 text-[14px] font-medium text-gold-700 hover:bg-gold-50">
        <ScanSearch className="h-4 w-4" /> بحث بالصورة
      </Link>
    </div>
  );
}

export function AvailabilityBadge({ p }: { p: Pick<Product, "availability" | "availability_label"> }) {
  return p.availability === "available" ? <Badge tone="green"><Check className="h-3 w-3" /> {p.availability_label}</Badge> : <Badge tone="gray">{p.availability_label}</Badge>;
}
