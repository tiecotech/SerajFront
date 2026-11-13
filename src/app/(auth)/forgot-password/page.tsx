"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { errorMessage, post } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      setMsg((await post<{ message: string }>("/auth/forgot-password", { email })).message);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-[28px] font-semibold text-brand-green">استعادة كلمة المرور</h1>
      <span className="gold-rule mt-3" />
      <p className="mt-4 text-[14px] text-gray-500">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.</p>
      {msg && <div className="mt-6 rounded-[3px] border border-gold-200 bg-gold-50 px-4 py-3 text-[14px] text-gold-700">{msg}</div>}
      {err && <div className="mt-6 rounded-[3px] bg-[#fbefee] px-4 py-3 text-[14px] text-danger">{err}</div>}
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field label="البريد الإلكتروني"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="text-right" /></Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>إرسال الرابط</Button>
      </form>
      <p className="mt-7 text-center text-[14px]"><Link href="/login" className="text-gold-600">العودة لتسجيل الدخول</Link></p>
    </>
  );
}
