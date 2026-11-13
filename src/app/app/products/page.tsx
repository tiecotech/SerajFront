"use client";

import { ProductBrowser } from "@/components/app/ProductBrowser";
import { PageHeader } from "@/components/ui";

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="جميع المنتجات" subtitle="ابحث بالاسم أو كود المنتج أو البراند، وصفِّ النتائج حسب التصنيف والتوفر." crumbs={[{ label: "الكتالوج", href: "/app/catalog" }, { label: "جميع المنتجات" }]} />
      <ProductBrowser />
    </>
  );
}
