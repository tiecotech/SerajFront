"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Field, Input, PageHeader, PageLoader, Textarea } from "@/components/ui";
import { errorMessage, get, post, put } from "@/lib/api";
import type { Json } from "@/lib/types";

type Settings = {
  company: Record<string, Json>;
  commerce: { currency: string; currency_code: string; max_discount_percent: number };
  quotation: Record<string, Json>;
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: async () => (await get<{ data: Settings }>("/settings")).data });
  const visual = useQuery({ queryKey: ["visual-admin"], queryFn: async () => (await get<{ data: { engine: string; available: boolean; indexed_products: number; total_products: number; ready: boolean } }>("/admin/visual-search")).data });
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { if (q.data) setS(structuredClone(q.data)); }, [q.data]);

  const save = useMutation({
    mutationFn: (group: keyof Settings) => put(`/settings/${group}`, s![group]),
    onSuccess: () => { toast.success("تم حفظ الإعدادات."); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const reindex = useMutation({ mutationFn: () => post<{ message: string }>("/admin/visual-search/reindex"), onSuccess: (r) => { toast.success(r.message); setTimeout(() => visual.refetch(), 3000); } });

  if (!s) return <PageLoader />;
  const c = s.company;
  const setC = (k: string, v: unknown) => setS({ ...s, company: { ...c, [k]: v } });
  const setQ = (k: string, v: unknown) => setS({ ...s, quotation: { ...s.quotation, [k]: v } });

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="معلومات الشركة، سياسة الحسم، وإعدادات عرض السعر." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-[16px] font-semibold text-brand-green">معلومات الشركة</h2><Button size="sm" loading={save.isPending && save.variables === "company"} onClick={() => save.mutate("company")}><Save className="h-4 w-4" /> حفظ</Button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الشركة"><Input value={c.name ?? ""} onChange={(e) => setC("name", e.target.value)} /></Field>
            <Field label="الاسم بالإنجليزية"><Input value={c.name_en ?? ""} onChange={(e) => setC("name_en", e.target.value)} dir="ltr" /></Field>
            <Field label="الوصف" className="sm:col-span-2"><Textarea rows={3} value={c.description ?? ""} onChange={(e) => setC("description", e.target.value)} /></Field>
            <Field label="الرؤية"><Textarea rows={2} value={c.vision ?? ""} onChange={(e) => setC("vision", e.target.value)} /></Field>
            <Field label="الرسالة"><Textarea rows={2} value={c.mission ?? ""} onChange={(e) => setC("mission", e.target.value)} /></Field>
            <Field label="العنوان" className="sm:col-span-2"><Input value={c.address ?? ""} onChange={(e) => setC("address", e.target.value)} /></Field>
            <Field label="الهاتف الرئيسي"><Input value={c.phone ?? ""} onChange={(e) => setC("phone", e.target.value)} dir="ltr" /></Field>
            <Field label="واتساب"><Input value={c.whatsapp ?? ""} onChange={(e) => setC("whatsapp", e.target.value)} dir="ltr" /></Field>
            <Field label="أرقام إضافية (افصل بفاصلة)" className="sm:col-span-2"><Input value={(c.phones ?? []).join(", ")} onChange={(e) => setC("phones", e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean))} dir="ltr" /></Field>
            <Field label="البريد الإلكتروني"><Input value={c.email ?? ""} onChange={(e) => setC("email", e.target.value)} dir="ltr" /></Field>
            <Field label="ساعات العمل"><Input value={c.working_hours ?? ""} onChange={(e) => setC("working_hours", e.target.value)} /></Field>
            <Field label="رابط تضمين الخريطة (Google Maps embed)" className="sm:col-span-2"><Input value={c.map_url ?? ""} onChange={(e) => setC("map_url", e.target.value)} dir="ltr" /></Field>
            {Object.keys(c.social ?? {}).map((k) => (
              <Field key={k} label={`حساب ${k}`}><Input value={c.social[k] ?? ""} onChange={(e) => setC("social", { ...c.social, [k]: e.target.value })} dir="ltr" placeholder="اسم الحساب أو الرابط" /></Field>
            ))}
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between"><span className="text-[13px] font-medium text-gray-700">معلومات إضافية</span><Button size="sm" variant="ghost" onClick={() => setC("extra", [...(c.extra ?? []), { label: "", value: "" }])}><Plus className="h-4 w-4" /> إضافة</Button></div>
              {(c.extra ?? []).map((x: { label: string; value: string }, i: number) => (
                <div key={i} className="mb-2 flex gap-2">
                  <Input value={x.label} placeholder="العنوان" onChange={(e) => setC("extra", c.extra.map((y: Json, j: number) => (j === i ? { ...y, label: e.target.value } : y)))} />
                  <Input value={x.value} placeholder="القيمة" onChange={(e) => setC("extra", c.extra.map((y: Json, j: number) => (j === i ? { ...y, value: e.target.value } : y)))} />
                  <Button variant="ghost" size="icon" onClick={() => setC("extra", c.extra.filter((_: Json, j: number) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-[16px] font-semibold text-brand-green">التسعير والحسم</h2><Button size="sm" loading={save.isPending && save.variables === "commerce"} onClick={() => save.mutate("commerce")}><Save className="h-4 w-4" /> حفظ</Button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الحد الأعلى للحسم %" hint="موحد للمهندسين وموظفي المبيعات، ويُفرض من الخادم."><Input type="number" min={0} max={100} step="0.5" value={s.commerce.max_discount_percent} onChange={(e) => setS({ ...s, commerce: { ...s.commerce, max_discount_percent: Number(e.target.value) } })} /></Field>
              <Field label="رمز العملة"><Input value={s.commerce.currency} onChange={(e) => setS({ ...s, commerce: { ...s.commerce, currency: e.target.value } })} /></Field>
            </div>
          </Card>
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-[16px] font-semibold text-brand-green">عرض السعر (PDF)</h2><Button size="sm" loading={save.isPending && save.variables === "quotation"} onClick={() => save.mutate("quotation")}><Save className="h-4 w-4" /> حفظ</Button></div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="مدة الصلاحية (أيام)"><Input type="number" min={1} value={s.quotation.validity_days ?? 7} onChange={(e) => setQ("validity_days", Number(e.target.value))} /></Field>
                <Field label="طريقة الدفع"><Input value={s.quotation.payment_method ?? ""} onChange={(e) => setQ("payment_method", e.target.value)} /></Field>
              </div>
              <Field label="الشروط والملاحظات"><Textarea rows={4} value={s.quotation.terms ?? ""} onChange={(e) => setQ("terms", e.target.value)} /></Field>
              <Field label="الشعار التسويقي في التذييل"><Input value={s.quotation.footer_slogan ?? ""} onChange={(e) => setQ("footer_slogan", e.target.value)} /></Field>
              <Field label="مسمى التوقيع"><Input value={s.quotation.signature_title ?? ""} onChange={(e) => setQ("signature_title", e.target.value)} /></Field>
              <Field label="رابط الكتالوج"><Input value={s.quotation.catalog_url ?? ""} onChange={(e) => setQ("catalog_url", e.target.value)} dir="ltr" /></Field>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-brand-green"><ScanSearch className="h-5 w-5 text-gold-500" /> البحث بالصورة</h2>
            {visual.data && (
              <div className="mt-4 space-y-2 text-[14px]">
                <div className="flex justify-between"><span className="text-gray-500">المحرك</span><span dir="ltr">{visual.data.engine}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">الحالة</span>{visual.data.ready ? <Badge tone="green">جاهز</Badge> : <Badge tone="amber">غير جاهز</Badge>}</div>
                <div className="flex justify-between"><span className="text-gray-500">المنتجات المفهرسة</span><span className="tabular">{visual.data.indexed_products} / {visual.data.total_products}</span></div>
              </div>
            )}
            <p className="mt-3 text-[12px] leading-5 text-gray-500">تتم الفهرسة تلقائياً عند تعديل صور المنتجات (عبر طابور المهام). لتفعيل محرك ذكاء اصطناعي خارجي (CLIP) راجع docs/VISUAL_SEARCH.md.</p>
            <Button size="sm" variant="secondary" className="mt-4" loading={reindex.isPending} onClick={() => reindex.mutate()}>إعادة فهرسة جميع المنتجات</Button>
          </Card>
        </div>
      </div>
    </>
  );
}
