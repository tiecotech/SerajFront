"use client";

import { RequestList } from "@/components/app/warehouse";
import { PageHeader } from "@/components/ui";

export default function WarehouseBoardPage() {
  return (
    <>
      <PageHeader title="لوحة المستودع" subtitle="راجع الطلبات الواردة، حدّد توفر الأصناف، وحدّث حالة التجهيز." />
      <RequestList basePath="/app/warehouse" />
    </>
  );
}
