"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, CircleDashed, ClipboardList, Download, MinusCircle, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageLoader, Pagination, Textarea, statusTone, useConfirm } from "@/components/ui";
import { errorMessage, get, patch, post } from "@/lib/api";
import type { AdjustedInvoice, Paginated, WarehouseItem, WarehouseRequest } from "@/lib/types";
import { cn, date, qty, relative } from "@/lib/utils";
import { fmtSyp, fmtUsd } from "./Price";
import { RequestJourney } from "./RequestJourney";
import { adjustedPdfUrl, pdfUrl } from "./share";

export const TABS = [
  { key: "new", label: "الطلبات الجديدة", statuses: "submitted" },
  { key: "review", label: "قيد المراجعة", statuses: "under_review" },
  { key: "processing", label: "قيد التجهيز", statuses: "processing,partially_available" },
  { key: "ready", label: "جاهزة", statuses: "ready" },
  { key: "done", label: "المكتملة", statuses: "completed" },
  { key: "rejected", label: "المرفوضة والملغاة", statuses: "rejected,cancelled" },
  { key: "all", label: "الكل", statuses: "" },
];

export function RequestList({ basePath, tabs = true }: { basePath: string; tabs?: boolean }) {
  const [tab, setTab] = useState(tabs ? "new" : "all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const statuses = TABS.find((t) => t.key === tab)?.statuses ?? "";
  const counts = useQuery({ queryKey: ["wr-counts"], queryFn: async () => (await get<{ data: Record<string, number> }>("/warehouse-requests/counts")).data, refetchInterval: 30_000 });
  const list = useQuery({
    queryKey: ["warehouse-requests", statuses, q, page],
    queryFn: () => get<Paginated<WarehouseRequest>>("/warehouse-requests", { status: statuses, q, page }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const countFor = (s: string) => (s ? s.split(",").reduce((n, k) => n + (counts.data?.[k] ?? 0), 0) : Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0));

  return (
    <>
      {tabs && (
        <div className="scroll-thin mb-5 flex gap-1.5 overflow-x-auto rounded-[3px] border border-gray-100 bg-white p-1.5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }} className={cn("flex shrink-0 items-center gap-2 rounded-[3px] px-4 py-2 text-[14px] transition cursor-pointer", tab === t.key ? "bg-gold-50 font-medium text-brand-green" : "text-gray-500 hover:bg-gray-50")}>
              {t.label}
              <span className={cn("min-w-6 rounded-full px-1.5 text-[11px] tabular", tab === t.key ? "bg-gold-gradient text-white" : "bg-gray-100 text-gray-500")}>{countFor(t.statuses)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="relative mb-5 max-w-md"><Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="رقم الطلب أو العرض أو اسم صاحب الطلب" className="ps-10" /></div>
      {list.isError && <ErrorState message={errorMessage(list.error)} />}
      {list.isLoading ? <PageLoader /> : list.data?.data.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="لا توجد طلبات" text="ستظهر هنا طلبات التجهيز المرسلة من فريق المبيعات والمهندسين." />
      ) : (
        <div className="grid gap-3">
          {list.data?.data.map((r) => (
            <Link key={r.id} href={`${basePath}/${r.id}`} className="group grid items-center gap-3 rounded-[4px] border border-gray-100 bg-white p-4 transition hover:border-gold-200 hover:shadow-sm md:grid-cols-[1.2fr_1.5fr_1fr_auto]">
              <div>
                <div className="font-semibold text-brand-green" dir="ltr" style={{ textAlign: "right" }}>{r.number}</div>
                <div className="text-[12px] text-gray-500">عرض <span dir="ltr">{r.quotation?.number}</span></div>
              </div>
              <div>
                <div className="text-[14px] text-brand-green">{r.requester?.name} <span className="text-[12px] text-gray-400">· {r.requester?.employee_type_label}</span></div>
                <div className="text-[12px] text-gray-500">{r.quotation?.customer_name || r.quotation?.project_name || "—"}</div>
              </div>
              <div className="text-[13px] text-gray-500">
                <div>{r.items_summary?.total} صنف{r.items_summary && r.items_summary.unavailable + r.items_summary.partial > 0 ? <span className="text-warning"> · {r.items_summary.unavailable + r.items_summary.partial} بنقص</span> : null}</div>
                <div className="text-[12px]">{relative(r.submitted_at ?? r.created_at)}</div>
              </div>
              <Badge tone={statusTone[r.status]} className="justify-self-start md:justify-self-end">{r.status_label}</Badge>
            </Link>
          ))}
        </div>
      )}
      {list.data && <Pagination page={page} lastPage={list.data.meta.last_page} onChange={setPage} />}
    </>
  );
}

const ITEM_STATUS: Record<WarehouseItem["item_status"], { label: string; icon: React.ComponentType<{ className?: string }>; tone: "gray" | "green" | "amber" | "red" }> = {
  pending: { label: "بانتظار المراجعة", icon: CircleDashed, tone: "gray" },
  available: { label: "متوفر", icon: CheckCircle2, tone: "green" },
  partial: { label: "متوفر جزئياً", icon: MinusCircle, tone: "amber" },
  unavailable: { label: "غير متوفر", icon: XCircle, tone: "red" },
};

export function RequestDetail({ id, mode }: { id: string; mode: "requester" | "warehouse" }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [transition, setTransition] = useState<{ value: string; label: string } | null>(null);
  const [note, setNote] = useState("");
  const [partial, setPartial] = useState<{ item: WarehouseItem; qty: string; note: string } | null>(null);
  const q = useQuery({ queryKey: ["warehouse-request", id], queryFn: async () => (await get<{ data: WarehouseRequest }>(`/warehouse-requests/${id}`)).data });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["warehouse-request", id] }); qc.invalidateQueries({ queryKey: ["warehouse-requests"] }); qc.invalidateQueries({ queryKey: ["wr-counts"] }); };

  const move = useMutation({
    mutationFn: () => post<{ message: string }>(`/warehouse-requests/${id}/status`, { status: transition!.value, note: note || undefined }),
    onSuccess: (r) => { toast.success(r.message); setTransition(null); setNote(""); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const setItem = useMutation({
    mutationFn: (p: { itemId: number; item_status: string; available_quantity?: string; note?: string }) => patch(`/warehouse-requests/${id}/items/${p.itemId}`, p),
    onSuccess: () => { setPartial(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const cancel = useMutation({ mutationFn: () => post(`/warehouse-requests/${id}/cancel`), onSuccess: () => { toast.success("تم إلغاء الطلب."); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });

  if (q.isLoading) return <PageLoader />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} />;
  const r = q.data;
  const editable = mode === "warehouse" && !["completed", "rejected", "cancelled"].includes(r.status);

  return (
    <>
      {dialog}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[r.status]} className="text-[13px] px-3 py-1">{r.status_label}</Badge>
        <span className="text-[13px] text-gray-500">أُرسل {date(r.submitted_at, true)}</span>
        <div className="ms-auto flex flex-wrap gap-2">
          {r.quotation && <a href={pdfUrl({ id: r.quotation.id }, true)} target="_blank" className="inline-flex h-[42px] items-center gap-2 rounded-[3px] border border-gray-200 bg-white px-4 text-[14px] text-brand-green hover:border-gold-300"><Download className="h-4 w-4" /> ملف PDF</a>}
          {r.invoice?.has_shortage && <a href={adjustedPdfUrl(r.id, true)} target="_blank" className="inline-flex h-[42px] items-center gap-2 rounded-[3px] border border-warning bg-[#fbf4e8] px-4 text-[14px] text-warning hover:opacity-90"><Download className="h-4 w-4" /> PDF بعد خصم النواقص</a>}
          {mode === "warehouse" && r.allowed_transitions.map((t) => (
            <Button key={t.value} variant={["rejected"].includes(t.value) ? "secondary" : "primary"} className={t.value === "rejected" ? "text-danger" : ""} onClick={() => setTransition(t)}>{t.label}</Button>
          ))}
          {mode === "requester" && r.can_cancel && <Button variant="secondary" className="text-danger" onClick={async () => (await confirm({ title: "إلغاء الطلب؟", danger: true, confirmLabel: "إلغاء الطلب" })) && cancel.mutate()}><Ban className="h-4 w-4" /> إلغاء الطلب</Button>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-3.5"><span className="text-[15px] font-semibold text-brand-green">الأصناف والكميات</span>
            {r.items_summary && <span className="text-[12px] text-gray-500">{r.items_summary.available} متوفر · {r.items_summary.partial} جزئي · {r.items_summary.unavailable} غير متوفر · {r.items_summary.pending} بانتظار</span>}
          </div>
          {r.items?.map((it) => {
            const S = ITEM_STATUS[it.item_status];
            const line = r.invoice?.lines.find((l) => l.item_id === it.id);
            return (
              <div key={it.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image_url ? <img src={it.image_url} alt="" className="h-14 w-14 rounded-[3px] object-cover" /> : <div className="h-14 w-14 rounded-[3px] bg-gray-50" />}
                <div className="min-w-[180px] flex-1">
                  <div className="font-medium text-brand-green">{it.name}</div>
                  <div className="text-[12px] text-gray-500"><span dir="ltr">{it.sku}</span>{it.brand_name ? ` · ${it.brand_name}` : ""}</div>
                  {it.note && <div className="mt-1 text-[12px] text-warning">ملاحظة: {it.note}</div>}
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-400">المطلوب</div>
                  <div className="text-[17px] font-semibold tabular text-brand-green">{qty(it.requested_quantity)} <span className="text-[11px] font-normal text-gray-400">{it.unit}</span></div>
                  {it.available_quantity !== null && it.item_status === "partial" && <div className="text-[11px] text-warning">المتوفر: {qty(it.available_quantity)}</div>}
                  {line && Number(line.missing_value) > 0 && <div className="text-[11px] text-danger tabular" dir="ltr">-{fmtUsd(line.missing_value)}</div>}
                </div>
                {editable ? (
                  <div className="flex gap-1">
                    {(["available", "partial", "unavailable"] as const).map((s) => {
                      const I = ITEM_STATUS[s];
                      return (
                        <button key={s} title={I.label} onClick={() => (s === "partial" ? setPartial({ item: it, qty: it.available_quantity ?? "", note: it.note ?? "" }) : setItem.mutate({ itemId: it.id, item_status: s }))}
                          className={cn("flex h-9 items-center gap-1 rounded-[3px] border px-2.5 text-[12px] transition cursor-pointer", it.item_status === s ? (s === "available" ? "border-success bg-[#eef5f0] text-success" : s === "partial" ? "border-warning bg-[#fbf4e8] text-warning" : "border-danger bg-[#fbefee] text-danger") : "border-gray-200 text-gray-500 hover:border-gold-300")}>
                          <I.icon className="h-4 w-4" /> <span className="hidden sm:inline">{I.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Badge tone={S.tone}><S.icon className="h-3.5 w-3.5" /> {S.label}</Badge>
                )}
              </div>
            );
          })}
        </Card>

        <div className="space-y-5">
          <Card className="p-5 text-[14px]">
            <dl className="space-y-2.5">
              <div className="flex justify-between"><dt className="text-gray-500">رقم الطلب</dt><dd className="font-semibold" dir="ltr">{r.number}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">عرض السعر</dt><dd>{mode === "requester" ? <Link href={`/app/quotations/${r.quotation?.id}`} className="font-medium text-gold-700" dir="ltr">{r.quotation?.number}</Link> : <span dir="ltr">{r.quotation?.number}</span>}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">صاحب الطلب</dt><dd className="font-medium">{r.requester?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">العميل</dt><dd>{r.quotation?.customer_name || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">المشروع</dt><dd>{r.quotation?.project_name || "—"}</dd></div>
              {r.assignee && <div className="flex justify-between"><dt className="text-gray-500">المسؤول في المستودع</dt><dd>{r.assignee.name}</dd></div>}
            </dl>
            {r.requester_notes && <div className="mt-4 rounded-[3px] bg-gold-50 p-3 text-[13px] leading-6"><span className="font-medium text-gold-700">ملاحظات صاحب الطلب: </span>{r.requester_notes}</div>}
          </Card>
          {r.invoice && <InvoiceCard inv={r.invoice} />}
          {mode === "warehouse" && <WarehouseNotes r={r} onSaved={refresh} />}
          {mode === "requester" && r.warehouse_notes && <Card className="p-5 text-[13px] leading-6"><div className="mb-1 font-medium text-brand-green">ملاحظات المستودع</div>{r.warehouse_notes}</Card>}
          <Card className="p-5">
            <div className="mb-5 text-[15px] font-semibold text-brand-green">مسار الطلب</div>
            <RequestJourney r={r} />
          </Card>
        </div>
      </div>

      <Modal open={!!transition} onOpenChange={(o) => !o && setTransition(null)} title={`تغيير الحالة إلى «${transition?.label}»`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setTransition(null)}>إلغاء</Button><Button loading={move.isPending} onClick={() => move.mutate()}>تأكيد</Button></>}>
        <Field label={transition?.value === "rejected" ? "سبب الرفض" : "ملاحظة (اختياري)"} required={transition?.value === "rejected"}><Textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3} /></Field>
      </Modal>
      <Modal open={!!partial} onOpenChange={(o) => !o && setPartial(null)} title="صنف متوفر جزئياً" description={partial?.item.name} size="sm"
        footer={<><Button variant="secondary" onClick={() => setPartial(null)}>إلغاء</Button><Button loading={setItem.isPending} onClick={() => partial && setItem.mutate({ itemId: partial.item.id, item_status: "partial", available_quantity: partial.qty, note: partial.note })}>حفظ</Button></>}>
        {partial && (
          <div className="space-y-4">
            <Field label={`الكمية المتوفرة (من أصل ${qty(partial.item.requested_quantity)})`}><Input autoFocus type="number" min={0} value={partial.qty} onChange={(e) => setPartial({ ...partial, qty: e.target.value })} /></Field>
            <Field label="ملاحظة"><Input value={partial.note} onChange={(e) => setPartial({ ...partial, note: e.target.value })} placeholder="مثال: الباقي يتوفر خلال أسبوع" /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}

/** Invoice after removing the items the warehouse can't supply (all figures from the backend). */
export function InvoiceCard({ inv }: { inv: Omit<AdjustedInvoice, "lines"> }) {
  const row = (k: string, usd: string, syp: string | null, cls = "") => (
    <div className={cn("flex items-start justify-between gap-3", cls)}><dt className="text-gray-500">{k}</dt><dd className="text-end tabular"><span className="block font-medium" dir="ltr">{usd}</span>{syp && <span className="block text-[12px] text-gold-700">{syp}</span>}</dd></div>
  );
  return (
    <Card className="p-5 text-[14px]">
      <div className="mb-3 text-[15px] font-semibold text-brand-green">{inv.has_shortage ? "الفاتورة بعد خصم النواقص" : "الفاتورة"}</div>
      <dl className="space-y-2.5">
        {inv.has_shortage && row("إجمالي العرض الأصلي", fmtUsd(inv.original.total), inv.original.total_syp && fmtSyp(inv.original.total_syp))}
        {inv.has_shortage && row("المخصوم (بعد الحسم)", "-" + fmtUsd(inv.deducted), inv.deducted_syp && "-" + fmtSyp(inv.deducted_syp), "text-danger [&_dt]:text-danger")}
        {row("الإجمالي قبل الحسم", fmtUsd(inv.subtotal), inv.subtotal_syp && fmtSyp(inv.subtotal_syp))}
        {row(`الحسم (${Number(inv.discount_percent)}%)`, fmtUsd(inv.discount_amount), inv.discount_amount_syp && fmtSyp(inv.discount_amount_syp))}
      </dl>
      <div className="mt-4 flex items-baseline justify-between rounded-[3px] bg-brand-green px-4 py-3 text-white">
        <span className="text-[14px]">{inv.has_shortage ? "الإجمالي بعد الخصم" : "الإجمالي النهائي"}</span>
        <span className="text-end"><span className="block font-display text-[20px] font-semibold tabular" dir="ltr">{fmtUsd(inv.total)}</span>{inv.total_syp && <span className="block text-[12px] text-gold-300 tabular">{fmtSyp(inv.total_syp)}</span>}</span>
      </div>
    </Card>
  );
}

function WarehouseNotes({ r, onSaved }: { r: WarehouseRequest; onSaved: () => void }) {
  const [v, setV] = useState(r.warehouse_notes ?? "");
  const save = useMutation({ mutationFn: () => patch(`/warehouse-requests/${r.id}/notes`, { warehouse_notes: v }), onSuccess: () => { toast.success("تم حفظ الملاحظات."); onSaved(); } });
  return (
    <Card className="p-5">
      <Field label="ملاحظات المستودع"><Textarea value={v} onChange={(e) => setV(e.target.value)} rows={3} /></Field>
      <Button size="sm" variant="secondary" className="mt-3" loading={save.isPending} onClick={() => save.mutate()}>حفظ الملاحظات</Button>
    </Card>
  );
}
