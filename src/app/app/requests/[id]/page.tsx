"use client";

import { use } from "react";
import { RequestDetail } from "@/components/app/warehouse";
import { PageHeader } from "@/components/ui";

export default function MyRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <PageHeader title="تفاصيل طلب المستودع" crumbs={[{ label: "طلبات المستودع", href: "/app/requests" }, { label: `#${id}` }]} />
      <RequestDetail id={id} mode="requester" />
    </>
  );
}
