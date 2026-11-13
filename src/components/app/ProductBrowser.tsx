"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState, Pagination } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Paginated, Product } from "@/lib/types";
import { ProductCard, ProductFilters, ProductGridSkeleton, useCurrency, type Filters } from "./catalog";

export function ProductBrowser({ category }: { category?: string }) {
  const me = useMe();
  const currency = useCurrency();
  const [filters, setFilters] = useState<Filters>({ q: "", brand: "", availability: "", sort: "name", category: category ?? "" });
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["products", filters, page],
    queryFn: () => get<Paginated<Product>>("/products", { ...filters, category: category ?? filters.category, page, per_page: 24 }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <ProductFilters value={filters} onChange={(f) => { setFilters(f); setPage(1); }} showCategory={!category} />
      {query.isError && <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />}
      {query.isLoading ? (
        <ProductGridSkeleton />
      ) : query.data && query.data.data.length === 0 ? (
        <EmptyState icon={<PackageSearch className="h-6 w-6" />} title="لا توجد منتجات مطابقة" text="جرّب كلمات بحث أخرى أو أزل بعض الفلاتر." />
      ) : (
        <>
          {query.data && <div className="mb-3 text-[13px] text-gray-500">{query.data.meta.total} منتج</div>}
          <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 transition-opacity ${query.isFetching ? "opacity-70" : ""}`}>
            {query.data?.data.map((p) => <ProductCard key={p.id} p={p} canBuy={me.data?.role === "commercial_user"} currency={currency} />)}
          </div>
          {query.data && <Pagination page={page} lastPage={query.data.meta.last_page} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
        </>
      )}
    </>
  );
}
