"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileText, Percent, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QtyStepper } from "@/components/app/catalog";
import { Button, ButtonLink, Card, EmptyState, ErrorState, Field, Img, Input, PageHeader, PageLoader, Textarea, useConfirm } from "@/components/ui";
import { ApiError, del, errorMessage, get, patch, post } from "@/lib/api";
import type { Cart, Quotation } from "@/lib/types";
import { Price, fmtSyp, fmtUsd } from "@/components/app/Price";

type Totals = { subtotal: string; discount_percent: string; discount_amount: string; total: string; subtotal_syp: string | null; discount_amount_syp: string | null; total_syp: string | null; currency: string; max_discount_percent: string; exchange: { rate: string | null; effective_date: string | null } };

export default function CartPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const cart = useQuery({ queryKey: ["cart"], queryFn: async () => (await get<{ data: Cart }>("/carts/current")).data });
  const [discount, setDiscount] = useState("0");
  const [totals, setTotals] = useState<Totals | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [form, setForm] = useState({ customer_name: "", project_name: "", customer_phone: "", customer_address: "", notes: "" });

  const setCart = (c: Cart) => qc.setQueryData(["cart"], c);
  const updateQty = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => patch<{ data: Cart }>(`/carts/current/items/${id}`, { quantity }),
    onSuccess: (r) => setCart(r.data),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => del<{ data: Cart; message: string }>(`/carts/current/items/${id}`),
    onSuccess: (r) => { setCart(r.data); toast.success(r.message); },
  });
  const clear = useMutation({ mutationFn: () => del<{ data: Cart }>("/carts/current"), onSuccess: (r) => setCart(r.data) });

  // Server-side totals preview (the backend is the only place prices & discounts are computed)
  useEffect(() => {
    if (!cart.data?.items_count) return setTotals(null);
    const t = setTimeout(async () => {
      try {
        const r = await post<{ data: Totals }>("/carts/current/preview", { discount_percent: discount === "" ? 0 : Number(discount) });
        setTotals(r.data);
        setDiscountError(null);
      } catch (e) {
        if (e instanceof ApiError && e.status === 422) setDiscountError(e.message);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [discount, cart.data?.subtotal, cart.data?.items_count]);

  const create = useMutation({
    mutationFn: () => post<{ data: Quotation; message: string }>("/quotations", { ...form, discount_percent: Number(discount || 0) }),
    onSuccess: (r) => {
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
      router.push(`/app/quotations/${r.data.id}`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (cart.isLoading) return <PageLoader />;
  if (cart.isError) return <ErrorState message={errorMessage(cart.error)} onRetry={() => cart.refetch()} />;
  const c = cart.data!;
  const max = c.max_discount_percent;

  return (
    <>
      {dialog}
      <PageHeader title="السلة" subtitle="راجع المنتجات والكميات، ثم أدخل نسبة الحسم وأنشئ عرض السعر." actions={c.items_count > 0 && <Button variant="ghost" size="sm" onClick={async () => (await confirm({ title: "تفريغ السلة؟", text: "سيتم حذف جميع المنتجات من السلة.", danger: true, confirmLabel: "تفريغ" })) && clear.mutate()}><Trash2 className="h-4 w-4" /> تفريغ السلة</Button>} />

      {c.items_count === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="سلتك فارغة" text="تصفح الكتالوج وأضف المنتجات لإعداد عرض سعر." action={<ButtonLink href="/app/catalog">تصفح الكتالوج</ButtonLink>} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            {c.issues.length > 0 && (
              <div className="rounded-[3px] border border-[#efdcb8] bg-[#fbf4e8] px-4 py-3 text-[14px] text-warning">
                {c.issues.map((i) => <div key={i.item_id} className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {i.message}</div>)}
              </div>
            )}
            <Card className="divide-y divide-gray-100">
              {c.items.map((it) => (
                <div key={it.id} className={`flex flex-wrap md:flex-nowrap items-center gap-4 p-4 ${!it.is_purchasable ? "bg-gray-25 opacity-75" : ""}`}>
                  <Link href={`/app/products/${it.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-[3px] bg-gray-50"><Img media={it.image} variant="thumb" className="h-full w-full object-cover" /></Link>
                  <div className="min-w-[160px] flex-1">
                    <Link href={`/app/products/${it.slug}`} className="text-[15px] font-medium text-brand-green hover:text-gold-700">{it.name}</Link>
                    <div className="mt-0.5 text-[12px] text-gray-500"><span dir="ltr">{it.sku}</span>{it.brand ? ` · ${it.brand}` : ""}</div>
                    <div className="mt-1 text-[13px] text-gray-700 tabular"><span dir="ltr">{fmtUsd(it.unit_price)}</span> · {fmtSyp(it.unit_price_syp)} / {it.unit}</div>
                  </div>
                  <QtyStepper size="sm" value={Number(it.quantity)} onChange={(v) => updateQty.mutate({ id: it.id, quantity: v })} />
                  <div className="w-32 text-end">
                    <Price usd={it.line_total} syp={it.line_total_syp} size="md" align="end" />
                  </div>
                  <button onClick={() => remove.mutate(it.id)} className="rounded-[3px] p-2 text-gray-400 hover:bg-[#fbefee] hover:text-danger cursor-pointer" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </Card>

            <Card className="p-5">
              <h2 className="text-[16px] font-semibold text-brand-green">بيانات العميل والمشروع <span className="text-[12px] font-normal text-gray-400">(اختياري)</span></h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="اسم العميل / الشركة"><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} maxLength={160} /></Field>
                <Field label="اسم المشروع"><Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} maxLength={160} /></Field>
                <Field label="رقم الهاتف"><Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} dir="ltr" className="text-right" maxLength={30} /></Field>
                <Field label="العنوان"><Input value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} maxLength={255} /></Field>
                <Field label="ملاحظات" className="sm:col-span-2"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} /></Field>
              </div>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24 p-5">
              <h2 className="text-[16px] font-semibold text-brand-green">ملخص عرض السعر</h2>
              <span className="gold-rule mt-2 !w-10" />
              <Field label={`نسبة الحسم على كامل الفاتورة (الحد الأعلى ${max}%)`} error={discountError ?? undefined} className="mt-5">
                <div className="relative">
                  <Input type="number" inputMode="decimal" min={0} max={Number(max)} step="0.5" value={discount} onChange={(e) => setDiscount(e.target.value)} className="pe-10 tabular" />
                  <Percent className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>
              <dl className="mt-5 space-y-3 text-[14px]">
                <div className="flex justify-between"><dt className="text-gray-500">الإجمالي قبل الحسم</dt><dd><Price usd={totals?.subtotal ?? c.subtotal} syp={totals?.subtotal_syp ?? c.subtotal_syp} size="sm" align="end" /></dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">نسبة الحسم</dt><dd className="font-medium tabular">{Number(totals?.discount_percent ?? 0)}%</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">قيمة الحسم</dt><dd className="text-end"><div className="font-medium tabular text-gold-700" dir="ltr">− {fmtUsd(totals?.discount_amount ?? "0")}</div><div className="text-[12px] text-gray-500 tabular">− {fmtSyp(totals?.discount_amount_syp ?? "0")}</div></dd></div>
                <div className="flex items-baseline justify-between border-t border-gray-100 pt-4"><dt className="font-semibold text-brand-green">الإجمالي النهائي</dt><dd><Price usd={totals?.total ?? c.subtotal} syp={totals?.total_syp ?? c.subtotal_syp} size="lg" align="end" /></dd></div>
                {totals?.exchange?.rate && <div className="text-center text-[12px] text-gray-400">سعر الصرف: 1$ = {fmtSyp(totals.exchange.rate)} ({totals.exchange.effective_date})</div>}
              </dl>
              <Button size="lg" className="mt-6 w-full" disabled={!!discountError || c.issues.length > 0} loading={create.isPending} onClick={() => create.mutate()}>
                <FileText className="h-4 w-4" /> إنشاء عرض السعر
              </Button>
              <p className="mt-3 text-center text-[12px] leading-5 text-gray-400">تُحسب جميع المبالغ وتُعتمد من الخادم بالأسعار الحالية لحظة الإصدار.</p>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
