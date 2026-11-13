"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PeriodFilter, type Period } from "@/components/app/PeriodFilter";
import { Badge, Card, EmptyState, PageHeader, Pagination, Select } from "@/components/ui";
import { get } from "@/lib/api";
import { date } from "@/lib/utils";
import type { Json } from "@/lib/types";

type Log = { id: number; event: string; event_label: string; description: string; user: { id: number; name: string; employee_type: string | null } | null; subject_type: string | null; subject_id: number | null; properties: Record<string, Json> | null; ip_address: string | null; created_at: string };

export default function ActivityPage() {
  const [period, setPeriod] = useState<Period>({ period: "7d" });
  const [event, setEvent] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["activity", period, event, type, page],
    queryFn: () => get<{ data: Log[]; meta: { current_page: number; last_page: number; total: number }; events: { value: string; label: string }[] }>("/activity-logs", { ...period, event, employee_type: type, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="سجل النشاط" subtitle="جميع الأحداث المهمة في النظام: المستخدم، التوقيت، نوع الحدث والكيان المرتبط." actions={<PeriodFilter value={period} onChange={(p) => { setPeriod(p); setPage(1); }} />} />
      <div className="mb-5 flex flex-wrap gap-3">
        <Select value={event} onChange={(e) => { setEvent(e.target.value); setPage(1); }} className="w-60"><option value="">كل الأحداث</option>{q.data?.events.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}</Select>
        <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="w-44"><option value="">كل الموظفين</option><option value="engineer">المهندسون</option><option value="sales">المبيعات</option><option value="warehouse">المستودع</option></Select>
        {q.data && <span className="self-center text-[13px] text-gray-500">{q.data.meta.total} حدث</span>}
      </div>
      {q.data?.data.length === 0 ? <EmptyState title="لا يوجد نشاط في هذه الفترة" /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="bg-gray-50 text-[12px] text-gray-500"><tr>{["التوقيت", "المستخدم", "الحدث", "التفاصيل", "IP"].map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {q.data?.data.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{date(l.created_at, true)}</td>
                  <td className="px-4 py-2.5 font-medium text-brand-green">{l.user?.name ?? "—"}</td>
                  <td className="px-4 py-2.5"><Badge tone={l.event.startsWith("website") ? "blue" : l.event.startsWith("auth") ? "gray" : "gold"}>{l.event_label}</Badge></td>
                  <td className="px-4 py-2.5 text-gray-500" dir="auto">{l.properties ? Object.entries(l.properties).filter(([, v]) => v !== null && typeof v !== "object").slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" · ") : ""}</td>
                  <td className="px-4 py-2.5 text-gray-400" dir="ltr">{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {q.data && <Pagination page={page} lastPage={q.data.meta.last_page} onChange={setPage} />}
    </>
  );
}
