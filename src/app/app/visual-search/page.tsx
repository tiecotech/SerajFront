"use client";

import { useQuery } from "@tanstack/react-query";
import { Camera, ImageUp, ScanSearch, ShoppingBag, Info } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useAddToCart } from "@/components/app/catalog";
import { Badge, Button, Card, EmptyState, Img, PageHeader } from "@/components/ui";
import { api, ApiError, get } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { Price } from "@/components/app/Price";

type Result = { similarity: number; level: "high" | "medium" | "low"; product: Product };
const LEVEL = { high: { label: "تطابق مرتفع", tone: "green" as const }, medium: { label: "تطابق متوسط", tone: "gold" as const }, low: { label: "تشابه ضعيف", tone: "gray" as const } };

export default function VisualSearchPage() {
  const me = useMe();
  const add = useAddToCart();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const status = useQuery({ queryKey: ["visual-status"], queryFn: async () => (await get<{ data: { engine: string; ready: boolean; indexed_products: number; total_products: number } }>("/products/visual-search/status")).data });

  async function search(file: File) {
    setPreview(URL.createObjectURL(file));
    setResults(null);
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await api<{ data: Result[] }>("/products/visual-search", { method: "POST", body: fd });
      setResults(r.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر تحليل الصورة.");
    } finally {
      setLoading(false);
    }
  }
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) search(f); e.target.value = ""; };

  return (
    <>
      <PageHeader title="البحث بالصورة" subtitle="صوّر المنتج بكاميرا الهاتف أو ارفع صورة، وسنعرض لك أقرب المنتجات من الكتالوج." crumbs={[{ label: "الكتالوج", href: "/app/catalog" }, { label: "البحث بالصورة" }]} />

      {status.data && !status.data.ready && (
        <div className="mb-6 flex items-start gap-3 rounded-[3px] border border-[#efdcb8] bg-[#fbf4e8] px-4 py-3 text-[14px] text-warning">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> محرك البحث بالصورة غير جاهز بعد — لم تتم فهرسة صور المنتجات. تواصل مع الإدارة.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[4px] border-2 border-dashed border-gold-200 bg-gold-50/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview ? <img src={preview} alt="الصورة المرفوعة" className="h-full w-full object-contain" /> : <div className="text-center text-gray-500"><ScanSearch className="mx-auto h-12 w-12 text-gold-400" /><div className="mt-3 text-[14px]">لم يتم اختيار صورة</div></div>}
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => camRef.current?.click()} disabled={loading || status.data?.ready === false}><Camera className="h-4 w-4" /> تصوير</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={loading || status.data?.ready === false}><ImageUp className="h-4 w-4" /> رفع صورة</Button>
          </div>
          {status.data && <p className="mt-4 text-[12px] leading-5 text-gray-400">المحرك: <span dir="ltr">{status.data.engine}</span> — منتجات مفهرسة: {status.data.indexed_products} / {status.data.total_products}. النتائج تقريبية وتعتمد على وضوح الصورة وخلفيتها.</p>}
        </Card>

        <div>
          {loading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-[4px]" />)}</div>}
          {error && <div className="rounded-[3px] border border-[#f1d6d3] bg-[#fbefee] px-4 py-3 text-[14px] text-danger">{error}</div>}
          {!loading && results?.length === 0 && <EmptyState title="لم نعثر على منتجات مشابهة" text="جرّب صورة أوضح للمنتج على خلفية بسيطة." />}
          {!loading && !results && !error && <EmptyState icon={<ScanSearch className="h-6 w-6" />} title="ابدأ بالتقاط صورة" text="سيتم مقارنة الصورة بصور منتجات الكتالوج وعرض النتائج الأقرب مع نسبة التطابق التقريبية." />}
          {!!results?.length && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((r) => (
                <Card key={r.product.id} className="overflow-hidden">
                  <Link href={`/app/products/${r.product.slug}`} className="relative block aspect-square overflow-hidden bg-white">
                    <Img media={r.product.image} className="h-full w-full object-cover" />
                    <div className="absolute top-3 start-3"><Badge tone={LEVEL[r.level].tone}>{LEVEL[r.level].label} · {Math.round(r.similarity)}%</Badge></div>
                  </Link>
                  <div className="p-4">
                    <div className="text-[11px] text-gray-400" dir="ltr" style={{ textAlign: "right" }}>{r.product.sku}</div>
                    <Link href={`/app/products/${r.product.slug}`} className="mt-0.5 block text-[15px] font-medium text-brand-green line-clamp-1">{r.product.name}</Link>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-gold-gradient" style={{ width: `${Math.max(4, r.similarity)}%` }} /></div>
                    <div className="mt-3 flex items-center justify-between">
                      <Price usd={r.product.price} syp={r.product.price_syp} size="sm" />
                      {me.data?.role === "commercial_user" && <Button size="sm" disabled={!r.product.is_purchasable} onClick={() => add.mutate({ productId: r.product.id, quantity: 1 })}><ShoppingBag className="h-4 w-4" /> أضف</Button>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
