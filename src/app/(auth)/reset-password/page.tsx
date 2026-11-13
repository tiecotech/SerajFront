"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { errorMessage, post } from "@/lib/api";

function ResetForm() {
  const sp = useSearchParams();
  const [form, setForm] = useState({ email: sp.get("email") ?? "", password: "", password_confirmation: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      setMsg((await post<{ message: string }>("/auth/reset-password", { ...form, token: sp.get("token") })).message);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-[28px] font-semibold text-brand-green">تعيين كلمة مرور جديدة</h1>
      <span className="gold-rule mt-3" />
      {msg ? (
        <div className="mt-6 rounded-[3px] border border-gold-200 bg-gold-50 px-4 py-3 text-[14px] text-gold-700">{msg} <Link href="/login" className="font-medium underline">تسجيل الدخول</Link></div>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-4">
          {err && <div className="rounded-[3px] bg-[#fbefee] px-4 py-3 text-[14px] text-danger">{err}</div>}
          <Field label="البريد الإلكتروني"><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" className="text-right" /></Field>
          <Field label="كلمة المرور الجديدة" hint="8 أحرف على الأقل وتحتوي على حروف وأرقام"><Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} dir="ltr" /></Field>
          <Field label="تأكيد كلمة المرور"><Input type="password" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} dir="ltr" /></Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>حفظ كلمة المرور</Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
