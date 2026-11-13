"use client";

import { use } from "react";
import { RequestDetail } from "@/components/app/warehouse";
import { PageHeader } from "@/components/ui";

export default function WarehouseRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <PageHeader title="مراجعة طلب التجهيز" crumbs={[{ label: "لوحة المستودع", href: "/app/warehouse" }, { label: `#${id}` }]} />
      <RequestDetail id={id} mode="warehouse" />
    </>
  );
}
