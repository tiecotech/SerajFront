"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Download, ExternalLink, MessageCircle, Send, Warehouse } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { adjustedPdfUrl, downloadPdf, pdfUrl, shareViaWhatsApp } from "@/components/app/share";
import { InvoiceCard } from "@/components/app/warehouse";
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, PageLoader, Textarea, statusTone, useConfirm } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Quotation, WarehouseRequest } from "@/lib/types";
import { date, qty } from "@/lib/utils";
import { Price, fmtSyp, fmtUsd } from "@/components/app/Price";

export default function QuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const me = useMe();
  const { confirm, dialog } = useConfirm();
  const [sendOpen, setSendOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["quotation", id], queryFn: async () => (await get<{ data: Quotation }>(`/quotations/${id}`)).data });

  const send = useMutation({
    mutationFn: () => post<{ data: WarehouseRequest; message: string }>(`/quotations/${id}/warehouse-requests`, { notes }),
    onSuccess: (r) => { toast.success(r.message); setSendOpen(false); qc.invalidateQueries({ queryKey: ["quotation", id] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const cancel = useMutation({
    mutationFn: () => post(`/quotations/${id}/cancel`),
    onSuccess: () => { toast.success("تم إلغاء عرض السعر."); qc.invalidateQueries({ queryKey: ["quotation", id] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (q.isLoading) return <PageLoader />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} />;
  const d = q.data;
  const isOwner = me.data?.id === d.user?.id && me.data?.role === "commercial_user";
  const canSend = isOwner && d.status === "issued" && !d.warehouse_request;

  async function onDownload() {
    setBusy("download");
    try { await downloadPdf(d); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  async function onShare() {
    setBusy("share");
    try {
      const r = await shareViaWhatsApp(d);
      if (r === "shared") toast.success("تمت مشاركة ملف PDF.");
      if (r === "link") toast.success("تم فتح واتساب — اختر جهة الاتصال. الرسالة تحتوي رابطاً آمناً لملف PDF صالحاً لمدة 14 يوماً.", { duration: 8000 });
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }

  return (
    <>
      {dialog}
      <PageHeader
        title={`عرض سعر ${d.number.replace(/-/g, "‑")}`}
        crumbs={[{ label: "عروض الأسعار", href: "/app/quotations" }, { label: d.number }]}
        actions={
          <>
            <Button variant="secondary" onClick={onDownload} loading={busy === "download"}><Download className="h-4 w-4" /> تحميل PDF</Button>
            <Button variant="secondary" onClick={onShare} loading={busy === "share"}><MessageCircle className="h-4 w-4 text-success" /> مشاركة عبر واتساب</Button>
            {canSend && <Button onClick={() => setSendOpen(true)}><Send className="h-4 w-4" /> إرسال للمستودع</Button>}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Phones: one card per item instead of a sideways-scrolling table. */}
          <Card className="divide-y divide-gray-100 sm:hidden">
            {d.items?.map((it) => (
              <div key={it.id} className="flex gap-3 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image_url ? <img src={it.image_url} alt="" className="h-16 w-16 shrink-0 rounded-[3px] bg-white object-cover ring-1 ring-gray-100" /> : <div className="h-16 w-16 shrink-0 rounded-[3px] bg-gray-50" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium leading-snug text-brand-green">{it.name}</div>
                  <div className="mt-0.5 truncate text-[12px] text-gray-500"><span dir="ltr">{it.sku}</span>{it.brand_name ? ` · ${it.brand_name}` : ""}</div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="text-[13px] text-gray-500"><span className="font-semibold tabular text-brand-green">{qty(it.quantity)}</span> {it.unit} × <span dir="ltr" className="tabular">{fmtUsd(it.unit_price)}</span></div>
                    <Price usd={it.line_total} syp={it.line_total_syp} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <Card className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[640px] text-[14px]">
              <thead className="bg-brand-green text-[12px] text-white">
                <tr><th className="px-3 py-3 text-start font-medium">م</th><th className="px-3 py-3 text-start font-medium">المنتج</th><th className="px-3 py-3 text-start font-medium">الكمية</th><th className="px-3 py-3 text-start font-medium">سعر الوحدة</th><th className="px-3 py-3 text-start font-medium">الإجمالي</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.items?.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-3 text-gray-400">{it.line_no}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {it.image_url && <img src={it.image_url} alt="" className="h-12 w-12 rounded-[3px] object-cover" />}
                        <div><div className="font-medium text-brand-green">{it.name}</div><div className="text-[12px] text-gray-500"><span dir="ltr">{it.sku}</span>{it.brand_name ? ` · ${it.brand_name}` : ""}</div></div>
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular">{qty(it.quantity)} <span className="text-[12px] text-gray-400">{it.unit}</span></td>
                    <td className="px-3 py-3"><Price usd={it.unit_price} syp={it.unit_price_syp} size="sm" /></td>
                    <td className="px-3 py-3"><Price usd={it.line_total} syp={it.line_total_syp} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <span className="text-[14px] font-medium text-brand-green">معاينة ملف PDF</span>
              <a href={pdfUrl(d, true)} target="_blank" className="inline-flex items-center gap-1.5 text-[13px] text-gold-600"><ExternalLink className="h-4 w-4" /> فتح في نافذة جديدة</a>
            </div>
            {/* Phone browsers can't render a PDF inline — show a clear open button instead. */}
            <iframe src={pdfUrl(d, true)} className="hidden h-[720px] w-full bg-gray-50 md:block" title={`PDF ${d.number}`} />
            <div className="flex flex-col items-center gap-3 px-5 py-8 text-center md:hidden">
              <span className="text-[13px] text-gray-500">اعرض ملف عرض السعر بملء الشاشة</span>
              <a href={pdfUrl(d, true)} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-[3px] bg-gold-gradient px-5 text-[14px] font-medium text-white shadow-gold"><ExternalLink className="h-4 w-4" /> فتح ملف PDF</a>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between"><span className="text-[13px] text-gray-500">الحالة</span><Badge tone={statusTone[d.status]}>{d.status_label}</Badge></div>
            <dl className="mt-4 space-y-2.5 text-[14px]">
              <Row k="التاريخ" v={date(d.issued_at, true)} />
              <Row k="صالح حتى" v={date(d.valid_until)} />
              <Row k="أعدّه" v={d.user?.name} />
              <Row k="العميل" v={d.customer_name} />
              <Row k="المشروع" v={d.project_name} />
              <Row k="الهاتف" v={d.customer_phone} ltr />
            </dl>
            {d.notes && <p className="mt-4 rounded-[3px] bg-gold-50 p-3 text-[13px] leading-6 text-gray-700">{d.notes}</p>}
          </Card>
          <Card className="p-5">
            <dl className="space-y-3 text-[14px]">
              <MoneyRow k="الإجمالي قبل الحسم" usd={fmtUsd(d.subtotal)} syp={fmtSyp(d.subtotal_syp)} />
              <Row k="نسبة الحسم" v={`${Number(d.discount_percent)}%`} />
              <MoneyRow k="قيمة الحسم" usd={fmtUsd(d.discount_amount)} syp={fmtSyp(d.discount_amount_syp)} />
            </dl>
            <div className="mt-4 flex items-baseline justify-between rounded-[3px] bg-brand-green px-4 py-3 text-white">
              <span className="text-[14px]">الإجمالي النهائي</span>
              <span className="text-end"><span className="block font-display text-[22px] font-semibold tabular" dir="ltr">{fmtUsd(d.total)}</span><span className="block text-[13px] text-gold-300 tabular">{fmtSyp(d.total_syp)}</span></span>
            </div>
            {d.exchange_rate && <div className="mt-3 text-center text-[12px] text-gray-400">سعر الصرف المعتمد في العرض: 1$ = {fmtSyp(d.exchange_rate)}</div>}
          </Card>
          {d.warehouse_request && (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-[14px] font-medium text-brand-green"><Warehouse className="h-4 w-4 text-gold-600" /> طلب المستودع</div>
              <div className="mt-3 flex items-center justify-between">
                <Link href={me.data?.role === "commercial_user" ? `/app/requests/${d.warehouse_request.id}` : `/app/warehouse/${d.warehouse_request.id}`} className="font-semibold text-gold-700" dir="ltr">{d.warehouse_request.number}</Link>
                <Badge tone={statusTone[d.warehouse_request.status]}>{d.warehouse_request.status_label}</Badge>
              </div>
              {d.warehouse_request.invoice?.has_shortage && (
                <a href={adjustedPdfUrl(d.warehouse_request.id, true)} target="_blank" className="mt-3 inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-[3px] border border-warning bg-[#fbf4e8] px-4 text-[13px] text-warning hover:opacity-90"><Download className="h-4 w-4" /> PDF بعد خصم النواقص</a>
              )}
            </Card>
          )}
          {d.warehouse_request?.invoice?.has_shortage && <InvoiceCard inv={d.warehouse_request.invoice} />}
          {(isOwner || me.data?.role === "admin") && d.status !== "cancelled" && (
            <Button variant="ghost" className="w-full text-danger" loading={cancel.isPending} onClick={async () => (await confirm({ title: "إلغاء عرض السعر؟", text: "سيبقى العرض محفوظاً في السجل بحالة «ملغى».", danger: true, confirmLabel: "إلغاء العرض" })) && cancel.mutate()}>
              <Ban className="h-4 w-4" /> إلغاء عرض السعر
            </Button>
          )}
        </div>
      </div>

      <Modal open={sendOpen} onOpenChange={setSendOpen} title="إرسال طلب تجهيز للمستودع" description={`سيتم إرسال ${d.items_count} صنف من العرض ${d.number} إلى فريق المستودع للمراجعة والتجهيز.`}
        footer={<><Button variant="secondary" onClick={() => setSendOpen(false)}>إلغاء</Button><Button loading={send.isPending} onClick={() => send.mutate()}><Send className="h-4 w-4" /> إرسال الطلب</Button></>}>
        <Field label="ملاحظات للمستودع (اختياري)"><Textarea autoFocus value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="مثال: التسليم مطلوب يوم الخميس صباحاً" /></Field>
      </Modal>
    </>
  );
}

/** Amount in both currencies, stacked so it never wraps mid-number on narrow screens. */
function MoneyRow({ k, usd, syp }: { k: string; usd: string; syp: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-end tabular">
        <span className="block whitespace-nowrap font-medium text-brand-green" dir="ltr">{usd}</span>
        <span className="block whitespace-nowrap text-[12px] text-gold-700">{syp}</span>
      </dd>
    </div>
  );
}

function Row({ k, v, ltr }: { k: string; v?: string | null; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-end font-medium text-brand-green tabular" dir={ltr ? "ltr" : undefined}>{v || "—"}</dd>
    </div>
  );
}
