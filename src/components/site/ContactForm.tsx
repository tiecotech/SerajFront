"use client";

import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { errorMessage, post } from "@/lib/api";

export function ContactForm({ whatsapp }: { whatsapp?: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { website, ...data } = form;
      const res = await post<{ message: string }>("/public/website/contact", website ? form : data);
      toast.success(res.message);
      setDone(true);
      setForm({ name: "", phone: "", email: "", subject: "", message: "", website: "" });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[4px] border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
      {done && <div className="mb-5 rounded-[3px] bg-[#eef5f0] px-4 py-3 text-[14px] text-success">تم استلام رسالتك بنجاح، شكراً لتواصلك معنا.</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم" required><Input value={form.name} onChange={set("name")} required maxLength={120} /></Field>
        <Field label="رقم الهاتف"><Input value={form.phone} onChange={set("phone")} dir="ltr" className="text-right" maxLength={30} /></Field>
        <Field label="البريد الإلكتروني"><Input type="email" value={form.email} onChange={set("email")} dir="ltr" className="text-right" /></Field>
        <Field label="الموضوع"><Input value={form.subject} onChange={set("subject")} maxLength={160} /></Field>
        <Field label="الرسالة" required className="sm:col-span-2"><Textarea value={form.message} onChange={set("message")} required rows={5} maxLength={3000} /></Field>
        <input type="text" name="website" value={form.website} onChange={set("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={loading}><Send className="h-4 w-4" /> إرسال الرسالة</Button>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-[50px] items-center gap-2 rounded-[3px] border border-gray-200 px-6 text-[15px] font-medium text-brand-green hover:border-gold-300">
            <MessageCircle className="h-4 w-4 text-success" /> تواصل عبر واتساب
          </a>
        )}
      </div>
    </form>
  );
}
