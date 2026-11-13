"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { ProductBrowser } from "@/components/app/ProductBrowser";
import { ErrorState, PageHeader } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const q = useQuery({ queryKey: ["category", slug], queryFn: async () => (await get<{ data: Category & { parent?: Category } }>(`/categories/${slug}`)).data });

  if (q.isError) return <ErrorState message={errorMessage(q.error)} />;
  return (
    <>
      <PageHeader
        title={q.data?.name ?? "…"}
        subtitle={q.data?.description ?? undefined}
        crumbs={[{ label: "التصنيفات", href: "/app/catalog" }, { label: q.data?.name ?? "" }]}
      />
      {!!q.data?.children?.length && (
        <div className="-mt-2 mb-6 flex flex-wrap gap-2">
          {q.data.children.map((c) => (
            <Link key={c.id} href={`/app/catalog/${c.slug}`} className="rounded-[2px] border border-gray-200 bg-white px-4 py-1.5 text-[13px] text-gray-700 hover:border-gold-300 hover:text-gold-700">{c.name}</Link>
          ))}
        </div>
      )}
      <ProductBrowser category={slug} />
    </>
  );
}
