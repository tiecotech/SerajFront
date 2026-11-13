"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, LogIn, ShoppingBag, Package, ClipboardList, Coins } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { PeriodFilter, type Period } from "@/components/app/PeriodFilter";
import { Badge, Card, ErrorState, PageHeader, PageLoader, StatCard, statusTone } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import type { Quotation, User, WarehouseRequest } from "@/lib/types";
import { date, money, relative } from "@/lib/utils";
import type { Json } from "@/lib/types";

type Detail = {
  user: User;
  stats: { performance: Record<string, Json> | null; total_logins: number; top_products: { product_id: number; name: string; sku: string; times: number }[] };
  quotations: Quotation[];
  warehouse_requests: WarehouseRequest[];
  carts: { id: number; status: string; items_count: number; created_at: string }[];
};
type Log = { id: number; event_label: string; description: string; properties: Record<string, Json> | null; created_at: string };

export default function EmployeeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [period, setPeriod] = useState<Period>({ period: "30d" });
  const q = useQuery({ queryKey: ["employee", id, period], queryFn: async () => (await get<{ data: Detail }>(`/dashboard/employees/${id}`, period)).data });
  const logs = useQuery({ queryKey: ["employee-logs", id, period], queryFn: () => get<{ data: Log[] }>("/activity-logs", { ...period, user_id: id, per_page: 40 }) });

  if (q.isLoading) return <PageLoader />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} />;
  const { user, stats } = q.data;
  const p = stats.performance ?? {};

  return (
    <>
      <PageHeader title={user.name} subtitle={`${user.employee_type_label} · ${user.email}`} crumbs={[{ label: "أداء الموظفين", href: "/app/admin/employees" }, { label: user.name }]} actions={<PeriodFilter value={period} onChange={setPeriod} />} />
      <Card className="mb-6 grid gap-4 p-5 text-[14px] sm:grid-cols-2 lg:grid-cols-5">
        <div><div className="text-[12px] text-gray-500">نوع الموظف</div><Badge tone={user.employee_type === "engineer" ? "blue" : "gold"} className="mt-1">{user.employee_type_label}</Badge></div>
        <div><div className="text-[12px] text-gray-500">تاريخ إنشاء الحساب</div><div className="mt-1 font-medium">{date(user.created_at)}</div></div>
        <div><div className="text-[12px] text-gray-500">آخر دخول</div><div className="mt-1 font-medium">{date(user.last_login_at, true)}</div></div>
        <div><div className="text-[12px] text-gray-500">إجمالي مرات الدخول</div><div className="mt-1 font-medium tabular">{stats.total_logins}</div></div>
        <div><div className="text-[12px] text-gray-500">الحالة</div><Badge tone={statusTone[user.status]} className="mt-1">{user.status_label}</Badge></div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="الدخول (الفترة)" value={p.logins ?? 0} icon={<LogIn className="h-5 w-5" />} />
        <StatCard label="السلات" value={p.carts ?? 0} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="منتجات أضيفت" value={p.products_added ?? 0} icon={<Package className="h-5 w-5" />} />
        <StatCard label="عروض الأسعار" value={p.quotations ?? 0} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="قيمة العروض" value={money(p.quotations_value ?? 0)} icon={<Coins className="h-5 w-5" />} />
        <StatCard label="طلبات المستودع" value={p.warehouse_requests ?? 0} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-brand-green">عروض الأسعار</h2>
          <div className="divide-y divide-gray-100 text-[14px]">
            {q.data.quotations.length === 0 && <div className="py-6 text-center text-gray-400">لا توجد عروض في هذه الفترة</div>}
            {q.data.quotations.map((x) => (
              <Link key={x.id} href={`/app/quotations/${x.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-gold-700">
                <span><span className="font-medium" dir="ltr">{x.number}</span> <span className="text-[12px] text-gray-500">{x.customer_name}</span></span>
                <span className="flex items-center gap-3"><span className="tabular">{money(x.total, x.currency)}</span><Badge tone={statusTone[x.status]}>{x.status_label}</Badge></span>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-brand-green">الطلبات المرسلة للمستودع</h2>
          <div className="divide-y divide-gray-100 text-[14px]">
            {q.data.warehouse_requests.length === 0 && <div className="py-6 text-center text-gray-400">لا توجد طلبات</div>}
            {q.data.warehouse_requests.map((r) => (
              <Link key={r.id} href={`/app/warehouse/${r.id}`} className="flex items-center justify-between py-2.5 hover:text-gold-700">
                <span className="font-medium" dir="ltr">{r.number}</span><Badge tone={statusTone[r.status]}>{r.status_label}</Badge>
              </Link>
            ))}
          </div>
          <h2 className="mb-3 mt-6 text-[15px] font-semibold text-brand-green">أكثر المنتجات إضافة للسلة</h2>
          <div className="divide-y divide-gray-100 text-[14px]">
            {stats.top_products.length === 0 && <div className="py-4 text-center text-gray-400">—</div>}
            {stats.top_products.map((t) => <div key={t.product_id} className="flex justify-between py-2"><span>{t.name} <span className="text-[12px] text-gray-400" dir="ltr">{t.sku}</span></span><span className="tabular text-gray-500">{t.times}×</span></div>)}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-[15px] font-semibold text-brand-green">سجل النشاط الزمني</h2>
        <ol className="relative space-y-4 border-s border-gold-200 ps-5">
          {logs.data?.data.map((l) => (
            <li key={l.id} className="relative">
              <span className="absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold-500" />
              <div className="text-[14px] text-brand-green">{l.event_label}{l.properties?.number ? <span className="text-gray-500" dir="ltr"> — {l.properties.number}</span> : l.properties?.sku ? <span className="text-gray-500" dir="ltr"> — {l.properties.sku}</span> : null}</div>
              <div className="text-[12px] text-gray-400">{date(l.created_at, true)} · {relative(l.created_at)}</div>
            </li>
          ))}
          {logs.data?.data.length === 0 && <li className="text-[13px] text-gray-400">لا يوجد نشاط في هذه الفترة.</li>}
        </ol>
      </Card>
    </>
  );
}
