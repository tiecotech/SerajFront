"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Presentation } from "lucide-react";
import Link from "next/link";
import { ButtonLink, ErrorState, Img, PageHeader } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CatalogPage() {
  const q = useQuery({ queryKey: ["catalog-categories"], queryFn: async () => (await get<{ data: Category[] }>("/categories")).data });

  return (
    <>
      <PageHeader title="التصنيفات" subtitle="اختر تصنيفاً لاستعراض منتجاته وإضافتها إلى السلة." actions={<ButtonLink href="/showroom" size="lg"><Presentation className="h-5 w-5" /> وضع العرض للزبون</ButtonLink>} />
      {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {q.isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] rounded-[4px]" />)}
        {q.data?.map((c) => (
          <Link key={c.id} href={`/app/catalog/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-[4px] bg-gray-50 shadow-xs">
            <Img media={c.image} variant="md" alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-6">
              <div>
                <h2 className="text-[22px] font-semibold text-white">{c.name}</h2>
                <div className="mt-1 text-[13px] text-white/75">{c.products_count ?? 0} منتج{c.children?.length ? ` · ${c.children.length} تصنيف فرعي` : ""}</div>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-gold-gradient"><ArrowLeft className="h-5 w-5" /></span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
