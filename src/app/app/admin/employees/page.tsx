"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PeriodFilter, type Period } from "@/components/app/PeriodFilter";
import { Badge, Card, EmptyState, ErrorState, Input, PageHeader, Select } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import { date, money } from "@/lib/utils";

type Row = {
  id: number; name: string; email: string; employee_type: string; employee_type_label: string; status: string; last_login_at: string | null;
  logins: number; carts: number; products_added: number; quotations: number; quotations_value: string; quotations_cancelled: number;
  warehouse_requests: number; requests_completed: number; requests_cancelled: number; activity_score: number;
};

export default function EmployeesPage() {
  const [period, setPeriod] = useState<Period>({ period: "30d" });
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("activity");
  const list = useQuery({ queryKey: ["employees", period, type, q, sort], queryFn: () => get<{ data: Row[]; period: { from: string; to: string } }>("/dashboard/employees", { ...period, employee_type: type, q, sort }) });

  return (
    <>
      <PageHeader title="أداء الموظفين" subtitle="نشاط المهندسين وموظفي المبيعات محسوباً من البيانات الفعلية (تسجيل الدخول، السلات، العروض، الطلبات)." actions={<PeriodFilter value={period} onChange={setPeriod} />} />
      <div className="mb-5 flex flex-wrap gap-3">
        <Input placeholder="بحث باسم الموظف" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-44"><option value="">المهندسون والمبيعات</option><option value="engineer">المهندسون</option><option value="sales">موظفو المبيعات</option></Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-52">
          <option value="activity">ترتيب حسب النشاط</option><option value="quotations">عدد عروض الأسعار</option><option value="quotations_value">قيمة عروض الأسعار</option><option value="logins">مرات الدخول</option><option value="warehouse_requests">طلبات المستودع</option>
        </Select>
      </div>
      {list.isError && <ErrorState message={errorMessage(list.error)} />}
      {list.data?.data.length === 0 ? <EmptyState title="لا يوجد موظفون مطابقون" /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead className="bg-gray-50 text-[12px] text-gray-500">
              <tr>{["الموظف", "النوع", "آخر دخول", "الدخول", "السلات", "منتجات أضيفت", "عروض الأسعار", "قيمة العروض", "طلبات المستودع", "مكتملة / ملغاة"].map((h) => <th key={h} className="px-3 py-3 text-start font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.isLoading && <tr><td colSpan={10} className="p-4"><div className="skeleton h-24 rounded" /></td></tr>}
              {list.data?.data.map((r, i) => (
                <tr key={r.id} className="hover:bg-gold-50/40">
                  <td className="px-3 py-3"><Link href={`/app/admin/employees/${r.id}`} className="font-medium text-brand-green hover:text-gold-700">{i === 0 && r.activity_score > 0 && <span className="me-1 text-gold-500">★</span>}{r.name}</Link><div className="text-[11px] text-gray-400">{r.email}</div></td>
                  <td className="px-3 py-3"><Badge tone={r.employee_type === "engineer" ? "blue" : "gold"}>{r.employee_type_label}</Badge></td>
                  <td className="px-3 py-3 text-gray-500">{date(r.last_login_at)}</td>
                  <td className="px-3 py-3 tabular">{r.logins}</td>
                  <td className="px-3 py-3 tabular">{r.carts}</td>
                  <td className="px-3 py-3 tabular">{r.products_added}</td>
                  <td className="px-3 py-3 tabular font-medium">{r.quotations}</td>
                  <td className="px-3 py-3 tabular">{money(r.quotations_value)}</td>
                  <td className="px-3 py-3 tabular">{r.warehouse_requests}</td>
                  <td className="px-3 py-3 tabular"><span className="text-success">{r.requests_completed}</span> / <span className="text-gray-400">{r.requests_cancelled + r.quotations_cancelled}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
