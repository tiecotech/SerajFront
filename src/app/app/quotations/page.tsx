"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FileText, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, ButtonLink, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, statusTone } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Paginated, Quotation } from "@/lib/types";
import { date } from "@/lib/utils";
import { Price } from "@/components/app/Price";

export default function QuotationsPage() {
  const me = useMe();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ["quotations", q, status, page], queryFn: () => get<Paginated<Quotation>>("/quotations", { q, status, page }), placeholderData: keepPreviousData });
  const isAdmin = me.data?.role === "admin";

  return (
    <>
      <PageHeader title="عروض الأسعار" subtitle={isAdmin ? "جميع عروض الأسعار الصادرة من المستخدمين التجاريين." : "عروض الأسعار التي أنشأتها."} actions={!isAdmin && <ButtonLink href="/app/cart">عرض سعر جديد</ButtonLink>} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="رقم العرض، العميل أو المشروع" className="ps-10" /></div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-52">
          <option value="">كل الحالات</option><option value="issued">صادر</option><option value="sent_to_warehouse">أُرسل للمستودع</option><option value="cancelled">ملغى</option>
        </Select>
      </div>
      {list.isError && <ErrorState message={errorMessage(list.error)} />}
      {list.data?.data.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="لا توجد عروض أسعار" text="أنشئ أول عرض سعر من السلة." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[14px]">
            <thead className="bg-gray-50 text-[12px] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">رقم العرض</th>
                <th className="px-4 py-3 text-start font-medium">العميل / المشروع</th>
                {isAdmin && <th className="px-4 py-3 text-start font-medium">أعدّه</th>}
                <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                <th className="px-4 py-3 text-start font-medium">الأصناف</th>
                <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.isLoading && Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-6 rounded" /></td></tr>)}
              {list.data?.data.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-gold-50/40">
                  <td className="px-4 py-3"><Link href={`/app/quotations/${row.id}`} className="font-semibold text-brand-green hover:text-gold-700" dir="ltr">{row.number}</Link></td>
                  <td className="px-4 py-3"><div className="text-brand-green">{row.customer_name || "—"}</div><div className="text-[12px] text-gray-500">{row.project_name}</div></td>
                  {isAdmin && <td className="px-4 py-3 text-gray-700">{row.user?.name}</td>}
                  <td className="px-4 py-3 text-gray-500">{date(row.created_at)}</td>
                  <td className="px-4 py-3 tabular">{row.items_count}</td>
                  <td className="px-4 py-3"><Price usd={row.total} syp={row.total_syp} size="sm" /></td>
                  <td className="px-4 py-3"><Badge tone={statusTone[row.status]}>{row.status_label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {list.data && <Pagination page={page} lastPage={list.data.meta.last_page} onChange={setPage} />}
    </>
  );
}
