"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { errorMessage, put } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { date } from "@/lib/utils";

export default function AccountPage() {
  const me = useMe();
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);
  const u = me.data;
  if (!u) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      toast.success((await put<{ message: string }>("/auth/password", form)).message);
      setForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="حسابي" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient text-[22px] font-semibold text-white">{u.name.charAt(0)}</span>
            <div><div className="text-[18px] font-semibold text-brand-green">{u.name}</div><div className="text-[13px] text-gray-500">{u.email}</div></div>
          </div>
          <dl className="mt-6 space-y-3 text-[14px]">
            <div className="flex justify-between"><dt className="text-gray-500">الدور</dt><dd><Badge tone="gold">{u.role_label}</Badge></dd></div>
            {u.employee_type_label && <div className="flex justify-between"><dt className="text-gray-500">نوع الموظف</dt><dd>{u.employee_type_label}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-500">الهاتف</dt><dd dir="ltr">{u.phone || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">آخر دخول</dt><dd>{date(u.last_login_at, true)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">عدد مرات الدخول</dt><dd className="tabular">{u.login_count}</dd></div>
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="text-[16px] font-semibold text-brand-green">تغيير كلمة المرور</h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="كلمة المرور الحالية"><Input type="password" required value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} dir="ltr" /></Field>
            <Field label="كلمة المرور الجديدة" hint="8 أحرف على الأقل وتحتوي على حروف وأرقام"><Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} dir="ltr" /></Field>
            <Field label="تأكيد كلمة المرور"><Input type="password" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} dir="ltr" /></Field>
            <Button type="submit" loading={loading}>حفظ</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
