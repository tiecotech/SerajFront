"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { cn } from "@/lib/utils";

export type Exchange = { rate: string | null; effective_date: string | null; is_today: boolean; base_symbol: string; quote_symbol: string };

export function useExchange() {
  return useQuery({ queryKey: ["exchange"], queryFn: async () => (await get<{ data: Exchange }>("/exchange-rate")).data, staleTime: 5 * 60_000 });
}

/** Display only — all USD and SYP amounts are computed by the backend. */
export const fmtUsd = (v?: string | number | null) =>
  v === null || v === undefined || v === "" ? "—" : "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v));
export const fmtSyp = (v?: string | number | null) =>
  v === null || v === undefined || v === "" ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(v)) + " ل.س";

export function Price({ usd, syp, size = "md", align = "start", className }: { usd: string | number | null | undefined; syp?: string | number | null; size?: "sm" | "md" | "lg" | "xl"; align?: "start" | "end" | "center"; className?: string }) {
  const big = { sm: "text-[14px]", md: "text-[18px]", lg: "text-[24px]", xl: "text-[34px]" }[size];
  const small = { sm: "text-[11px]", md: "text-[12px]", lg: "text-[14px]", xl: "text-[16px]" }[size];
  return (
    <div className={cn("leading-tight", { start: "text-start", end: "text-end", center: "text-center" }[align], className)}>
      <div className={cn("font-semibold text-brand-green tabular", big, size === "xl" && "font-display")} dir="ltr" style={{ textAlign: "inherit" }}>{fmtUsd(usd)}</div>
      {syp !== undefined && <div className={cn("mt-0.5 font-medium text-gold-700 tabular", small)}>{fmtSyp(syp)}</div>}
    </div>
  );
}
