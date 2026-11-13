"use client";

import { Input, Select } from "@/components/ui";

export type Period = { period: string; from?: string; to?: string; month?: string };

export function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.period} onChange={(e) => onChange({ period: e.target.value })} className="w-44">
        <option value="today">اليوم</option>
        <option value="7d">آخر 7 أيام</option>
        <option value="30d">آخر 30 يوماً</option>
        <option value="this_month">هذا الشهر</option>
        <option value="month">شهر محدد</option>
        <option value="custom">فترة مخصصة</option>
      </Select>
      {value.period === "month" && <Input type="month" value={value.month ?? ""} onChange={(e) => onChange({ ...value, month: e.target.value })} className="w-44" />}
      {value.period === "custom" && (
        <>
          <Input type="date" value={value.from ?? ""} onChange={(e) => onChange({ ...value, from: e.target.value })} className="w-40" aria-label="من" />
          <span className="text-gray-400">—</span>
          <Input type="date" value={value.to ?? ""} onChange={(e) => onChange({ ...value, to: e.target.value })} className="w-40" aria-label="إلى" />
        </>
      )}
    </div>
  );
}
