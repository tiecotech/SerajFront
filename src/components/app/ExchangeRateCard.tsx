"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, History, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Input } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { date } from "@/lib/utils";
import { fmtSyp, useExchange } from "./Price";

type Row = { id: number; rate: string; effective_date: string; set_by: string | null; note: string | null };

/** Admin: record today's USD → SYP rate. All SYP prices in the platform derive from it. */
export function ExchangeRateCard() {
  const qc = useQueryClient();
  const current = useExchange();
  const history = useQuery({ queryKey: ["exchange-history"], queryFn: async () => (await get<{ data: Row[] }>("/exchange-rates")).data });
  const [rate, setRate] = useState("");
  useEffect(() => { if (current.data?.rate) setRate(String(Number(current.data.rate))); }, [current.data?.rate]);

  const save = useMutation({
    mutationFn: () => post<{ message: string }>("/exchange-rates", { rate: Number(rate) }),
    onSuccess: (r) => {
      toast.success(r.message);
      ["exchange", "exchange-history", "products", "product", "cart", "admin-products"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const prev = history.data?.[1];
  const delta = prev && current.data?.rate ? ((Number(current.data.rate) - Number(prev.rate)) / Number(prev.rate)) * 100 : null;

  return (
    <Card id="exchange-rate" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gold-50/50 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-gold-gradient text-white"><BadgeDollarSign className="h-5 w-5" /></span>
          <div>
            <div className="text-[15px] font-semibold text-brand-green">سعر صرف الدولار اليوم</div>
            <div className="text-[12px] text-gray-500">تُحسب جميع الأسعار بالليرة السورية تلقائياً من هذا السعر</div>
          </div>
        </div>
        {current.data && (current.data.is_today ? <Badge tone="green">محدَّث اليوم</Badge> : <Badge tone="amber">آخر تحديث {current.data.effective_date ?? "—"}</Badge>)}
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_1.2fr]">
        <div>
          <label className="text-[13px] text-gray-500">1 دولار أمريكي =</label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative flex-1">
              <Input type="number" min={0} step="any" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="h-[50px] pe-14 text-[20px] font-semibold tabular" />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-500">ل.س</span>
            </div>
            <Button size="lg" loading={save.isPending} disabled={!rate || Number(rate) <= 0} onClick={() => save.mutate()}><Save className="h-4 w-4" /> حفظ</Button>
          </div>
          {current.data?.rate && (
            <div className="mt-3 text-[13px] text-gray-500">
              المعتمد حالياً: <b className="text-brand-green tabular">{fmtSyp(current.data.rate)}</b>
              {delta !== null && <span className={delta >= 0 ? "ms-2 text-danger" : "ms-2 text-success"} dir="ltr">({delta >= 0 ? "+" : ""}{delta.toFixed(2)}%)</span>}
            </div>
          )}
          <p className="mt-2 text-[12px] leading-5 text-gray-400">عروض الأسعار الصادرة سابقاً تحتفظ بسعر الصرف المعتمد يوم إصدارها ولا تتغير.</p>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-gray-700"><History className="h-4 w-4 text-gold-500" /> السجل</div>
          <div className="scroll-thin max-h-44 overflow-y-auto rounded-[3px] border border-gray-100">
            <table className="w-full text-[13px]">
              <tbody className="divide-y divide-gray-100">
                {history.data?.map((r) => (
                  <tr key={r.id}><td className="px-3 py-2 text-gray-500">{date(r.effective_date)}</td><td className="px-3 py-2 font-medium tabular">{fmtSyp(r.rate)}</td><td className="px-3 py-2 text-[12px] text-gray-400">{r.set_by}</td></tr>
                ))}
                {history.data?.length === 0 && <tr><td className="px-3 py-4 text-center text-gray-400">لا يوجد سجل</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
