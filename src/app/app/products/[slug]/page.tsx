"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { use, useState } from "react";
import { AvailabilityBadge, ProductCard, QtyStepper, useAddToCart, useCurrency } from "@/components/app/catalog";
import { Button, ErrorState, Img, PageHeader, PageLoader } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Price } from "@/components/app/Price";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const me = useMe();
  const currency = useCurrency();
  const add = useAddToCart();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const q = useQuery({ queryKey: ["product", slug], queryFn: async () => (await get<{ data: Product }>(`/products/${slug}`)).data });
  const related = useQuery({ queryKey: ["related", q.data?.id], queryFn: async () => (await get<{ data: Product[] }>(`/products/${q.data!.id}/related`)).data, enabled: !!q.data });

  if (q.isLoading) return <PageLoader />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} />;
  const p = q.data;
  const images = p.images?.length ? p.images.map((i) => i.image) : p.image ? [p.image] : [];
  const canBuy = me.data?.role === "commercial_user";
  const groups = (p.specifications ?? []).reduce<Record<string, { label: string; value: string }[]>>((acc, s) => {
    (acc[s.group || "المواصفات"] ??= []).push(s);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title={p.name}
        crumbs={[{ label: "الكتالوج", href: "/app/catalog" }, ...(p.category ? [{ label: p.category.name, href: `/app/catalog/${p.category.slug}` }] : []), { label: p.sku }]}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-[4px] border border-gray-100 bg-white">
            <Img media={images[active]} variant="lg" alt={p.name} className={cn("aspect-square w-full object-cover", !p.is_purchasable && "grayscale-[0.6]")} />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((m, i) => (
                <button key={m.id} onClick={() => setActive(i)} className={cn("h-20 w-20 overflow-hidden rounded-[3px] border-2 cursor-pointer", i === active ? "border-gold-500" : "border-transparent")}>
                  <Img media={m} variant="thumb" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            {p.brand?.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.brand.logo.thumb} alt={p.brand.name} className="h-7 w-auto max-w-[110px] object-contain" />
            )}
            <AvailabilityBadge p={p} />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-3">
            <div className="rounded-[3px] bg-gray-50 px-4 py-3"><dt className="text-[12px] text-gray-500">كود المنتج</dt><dd className="mt-0.5 font-semibold text-brand-green" dir="ltr" style={{ textAlign: "right" }}>{p.sku}</dd></div>
            <div className="rounded-[3px] bg-gray-50 px-4 py-3"><dt className="text-[12px] text-gray-500">البراند</dt><dd className="mt-0.5 font-semibold text-brand-green">{p.brand?.name ?? "—"}</dd></div>
            <div className="rounded-[3px] bg-gray-50 px-4 py-3"><dt className="text-[12px] text-gray-500">التصنيف</dt><dd className="mt-0.5 font-semibold text-brand-green">{p.category?.name ?? "—"}</dd></div>
          </dl>

          <div className="mt-6 rounded-[4px] border border-gold-200 bg-gold-50/50 p-5">
            <div className="text-[13px] text-gray-500">السعر</div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <Price usd={p.price} syp={p.price_syp} size="xl" />
              <span className="pb-1 text-[13px] text-gray-500">لكل {p.unit}</span>
            </div>
            {canBuy && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <QtyStepper value={qty} onChange={setQty} />
                <Button size="lg" className="flex-1 min-w-[180px]" disabled={!p.is_purchasable} loading={add.isPending} onClick={() => add.mutate({ productId: p.id, quantity: qty })}>
                  <ShoppingBag className="h-4 w-4" /> {p.is_purchasable ? "إضافة إلى السلة" : "غير متوفر حالياً"}
                </Button>
              </div>
            )}
          </div>

          {p.short_description && <p className="mt-6 text-[15px] leading-8 text-gray-700">{p.short_description}</p>}
          {p.description && <div className="prose-lux mt-2 text-[15px]">{p.description.split(/\n{2,}/).map((t, i) => <p key={i}>{t}</p>)}</div>}

          {Object.keys(groups).length > 0 && (
            <div className="mt-7">
              <h2 className="text-[17px] font-semibold text-brand-green">المواصفات الفنية</h2>
              <span className="gold-rule mt-2 !w-10" />
              <div className="mt-4 overflow-hidden rounded-[4px] border border-gray-100 bg-white">
                {Object.entries(groups).map(([g, rows]) => (
                  <div key={g}>
                    <div className="bg-gray-50 px-4 py-2 text-[12px] font-medium text-gold-700">{g}</div>
                    <table className="w-full text-[14px]">
                      <tbody>
                        {rows.map((s, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="w-2/5 px-4 py-2.5 text-gray-500">{s.label}</td>
                            <td className="px-4 py-2.5 font-medium text-brand-green" dir="auto">{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!!related.data?.length && (
        <section className="mt-14">
          <h2 className="text-[20px] font-semibold text-brand-green">منتجات ذات صلة</h2>
          <span className="gold-rule mt-2 mb-6" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {related.data.slice(0, 4).map((r) => <ProductCard key={r.id} p={r} canBuy={canBuy} currency={currency} />)}
          </div>
        </section>
      )}
    </>
  );
}
