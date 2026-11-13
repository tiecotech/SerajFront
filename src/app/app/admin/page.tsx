"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Boxes, ClipboardList, FileText, HardHat, PackageX, Briefcase, Users, Warehouse, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PeriodFilter, type Period } from "@/components/app/PeriodFilter";
import { Card, ErrorState, PageHeader, PageLoader, StatCard } from "@/components/ui";
import { errorMessage, get } from "@/lib/api";
import { ExchangeRateCard } from "@/components/app/ExchangeRateCard";
import { fmtUsd as money } from "@/components/app/Price";

type Leader = { id: number; name: string; quotations: number; quotations_value: string; logins: number; activity_score: number } | null;
type Overview = {
  users: { total: number; engineers: number; sales: number; warehouse: number; pending: number };
  products: { total: number; out_of_stock: number; inactive: number };
  quotations: { total: number; in_period: number; value_in_period: string };
  warehouse: { total: number; in_period: number; processing: number; ready: number };
  trend: { date: string; quotations: number; value: string }[];
  leaders: { engineer: Leader; sales: Leader };
  period: { from: string; to: string };
};

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>({ period: "30d" });
  const q = useQuery({ queryKey: ["dashboard", period], queryFn: async () => (await get<{ data: Overview }>("/dashboard/overview", period)).data });

  return (
    <>
      <PageHeader title="لوحة التحكم" subtitle={q.data ? `الفترة من ${q.data.period.from} إلى ${q.data.period.to}` : undefined} actions={<PeriodFilter value={period} onChange={setPeriod} />} />
      {q.isError && <ErrorState message={errorMessage(q.error)} />}
      {q.isLoading || !q.data ? <PageLoader /> : (
        <>
          {q.data.users.pending > 0 && (
            <Link href="/app/admin/users?status=pending" className="mb-6 flex items-center justify-between rounded-[4px] border border-gold-200 bg-gold-50 px-5 py-4 text-[14px] text-gold-700 transition hover:shadow-sm">
              <span className="flex items-center gap-2.5"><UserPlus className="h-5 w-5" /> لديك <b className="tabular">{q.data.users.pending}</b> طلبات إنشاء حساب بانتظار الموافقة.</span>
              <span className="font-medium">مراجعة الطلبات ←</span>
            </Link>
          )}
          <div className="mb-6"><ExchangeRateCard /></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="إجمالي المستخدمين" value={q.data.users.total} icon={<Users className="h-5 w-5" />} hint={`${q.data.users.pending} بانتظار الموافقة`} />
            <StatCard label="المهندسون" value={q.data.users.engineers} icon={<HardHat className="h-5 w-5" />} tone="green" />
            <StatCard label="موظفو المبيعات" value={q.data.users.sales} icon={<Briefcase className="h-5 w-5" />} tone="green" />
            <StatCard label="موظفو المستودع" value={q.data.users.warehouse} icon={<Warehouse className="h-5 w-5" />} tone="gray" />
            <StatCard label="المنتجات" value={q.data.products.total} icon={<Boxes className="h-5 w-5" />} hint={`${q.data.products.inactive} غير مفعّل`} />
            <StatCard label="غير متوفر حالياً" value={q.data.products.out_of_stock} icon={<PackageX className="h-5 w-5" />} tone="gray" />
            <StatCard label="عروض الأسعار" value={q.data.quotations.total} icon={<FileText className="h-5 w-5" />} hint={`${q.data.quotations.in_period} خلال الفترة`} />
            <StatCard label="طلبات المستودع" value={q.data.warehouse.total} icon={<ClipboardList className="h-5 w-5" />} hint={`${q.data.warehouse.processing} قيد التجهيز · ${q.data.warehouse.ready} جاهز`} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
            <Card className="p-5">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[15px] font-semibold text-brand-green">قيمة عروض الأسعار</div>
                  <div className="mt-1 font-display text-[26px] font-semibold text-brand-green tabular">{money(q.data.quotations.value_in_period)}</div>
                </div>
                <div className="text-[13px] text-gray-500">{q.data.quotations.in_period} عرض خلال الفترة</div>
              </div>
              <div className="mt-4 h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={q.data.trend.map((t) => ({ ...t, value: Number(t.value) }))} margin={{ left: 0, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#B8956F" stopOpacity={0.35} /><stop offset="100%" stopColor="#B8956F" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EFEEEB" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#A5A29C" }} tickFormatter={(d: string) => d.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#A5A29C" }} axisLine={false} tickLine={false} width={64} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                    <Tooltip formatter={(v) => [money(Number(v)), "القيمة"]} labelStyle={{ fontFamily: "var(--font-plex)" }} contentStyle={{ borderRadius: 12, border: "1px solid #EFEEEB" }} />
                    <Area type="monotone" dataKey="value" stroke="#A27A5B" strokeWidth={2} fill="url(#gold)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-brand-green"><Award className="h-5 w-5 text-gold-500" /> الأكثر نشاطاً</div>
              {(["engineer", "sales"] as const).map((k) => {
                const l = q.data.leaders[k];
                return (
                  <div key={k} className="mt-4 rounded-[3px] border border-gray-100 p-4">
                    <div className="text-[12px] text-gray-500">{k === "engineer" ? "أكثر المهندسين نشاطاً" : "أكثر موظفي المبيعات نشاطاً"}</div>
                    {l && l.activity_score > 0 ? (
                      <>
                        <Link href={`/app/admin/employees/${l.id}`} className="mt-1 block text-[16px] font-semibold text-brand-green hover:text-gold-700">{l.name}</Link>
                        <div className="mt-2 flex gap-4 text-[12px] text-gray-500"><span>{l.quotations} عرض</span><span>{money(l.quotations_value)}</span><span>{l.logins} دخول</span></div>
                      </>
                    ) : <div className="mt-1 text-[13px] text-gray-400">لا يوجد نشاط في هذه الفترة</div>}
                  </div>
                );
              })}
              <Link href="/app/admin/employees" className="mt-4 block text-center text-[13px] font-medium text-gold-600">تحليل أداء جميع الموظفين ←</Link>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
