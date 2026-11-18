"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SortableList } from "@/components/app/media";
import { Img } from "@/components/ui";
import { get } from "@/lib/api";
import type { Paginated, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Pick the products shown under "منتجات ذات صلة" on this product's page.
 * Search by name or SKU, click to add, drag to reorder (first = shown first).
 */
export function RelatedProductsField({ value, onChange, excludeId }: { value: Product[]; onChange: (v: Product[]) => void; excludeId?: number }) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = useQuery({
    queryKey: ["related-picker", term],
    queryFn: () => get<Paginated<Product>>("/admin/products", { q: term, per_page: 12 }),
    enabled: open,
    staleTime: 30_000,
  });
  const chosen = new Set(value.map((p) => p.id));
  const options = (results.data?.data ?? []).filter((p) => p.id !== excludeId);
  const toggle = (p: Product) => onChange(chosen.has(p.id) ? value.filter((x) => x.id !== p.id) : [...value, p]);

  return (
    <div>
      <div ref={box} className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="ابحث باسم المنتج أو الكود لإضافته…"
          className="h-11 w-full rounded-[3px] border border-gray-200 bg-white ps-9 pe-3 text-[14px] focus:border-gold-500 focus:outline-none focus:ring-[3px] focus:ring-gold-500/15"
        />
        {open && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-[4px] border border-gray-100 bg-white p-1 shadow-lg">
            {results.isLoading && <div className="p-4 text-center text-[13px] text-gray-400">جارِ البحث…</div>}
            {!results.isLoading && options.length === 0 && <div className="p-4 text-center text-[13px] text-gray-400">لا توجد نتائج</div>}
            {options.map((p) => {
              const on = chosen.has(p.id);
              return (
                <button key={p.id} type="button" onClick={() => toggle(p)}
                  className={cn("flex w-full items-center gap-3 rounded-[3px] px-2 py-2 text-start hover:bg-gray-50 cursor-pointer", on && "bg-gold-50/70")}>
                  <Img media={p.image} variant="thumb" className="h-10 w-10 shrink-0 rounded-[3px] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-brand-green">{p.name}</span>
                    <span className="block text-[12px] text-gray-400" dir="ltr" style={{ textAlign: "right" }}>{p.sku}</span>
                  </span>
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", on ? "border-gold-500 bg-gold-500 text-white" : "border-gray-200 text-gray-400")}>
                    {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {value.length === 0 ? (
        <p className="mt-3 text-[13px] text-gray-400">لم تُختر منتجات بعد — ستظهر اقتراحات تلقائية من نفس التصنيف أو البراند.</p>
      ) : (
        <div className="mt-3 space-y-2">
          <SortableList items={value} onReorder={onChange} render={(p, handle) => (
            <div className="flex items-center gap-2 rounded-[3px] border border-gray-100 bg-white p-2">
              {handle}
              <Img media={p.image} variant="thumb" className="h-10 w-10 shrink-0 rounded-[3px] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] text-brand-green">{p.name}</div>
                <div className="text-[12px] text-gray-400" dir="ltr" style={{ textAlign: "right" }}>{p.sku}</div>
              </div>
              <button type="button" onClick={() => onChange(value.filter((x) => x.id !== p.id))} className="rounded-[3px] p-2 text-gray-400 hover:text-danger cursor-pointer" aria-label="إزالة"><Trash2 className="h-4 w-4" /></button>
            </div>
          )} />
        </div>
      )}
    </div>
  );
}
