"use client";

import { RequestList } from "@/components/app/warehouse";
import { PageHeader } from "@/components/ui";

export default function MyRequestsPage() {
  return (
    <>
      <PageHeader title="طلبات المستودع" subtitle="تابع حالة طلبات التجهيز التي أرسلتها إلى المستودع." />
      <RequestList basePath="/app/requests" tabs={false} />
    </>
  );
}
