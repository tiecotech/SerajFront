"use client";

import { AlertTriangle, Ban, Check, ChevronDown, ClipboardCheck, PackageCheck, Search, Send, Truck, XCircle } from "lucide-react";
import { useState } from "react";
import type { WarehouseRequest } from "@/lib/types";
import { cn, date } from "@/lib/utils";

/** The normal path every request travels (server state machine, main line). */
const STAGES = [
  { key: "submitted", label: "جديد", hint: "تم إرسال الطلب إلى المستودع", icon: Send },
  { key: "under_review", label: "قيد المراجعة", hint: "يراجع المستودع الأصناف والكميات", icon: Search },
  { key: "processing", label: "قيد التجهيز", hint: "يتم تجهيز الأصناف وتحضيرها", icon: ClipboardCheck },
  { key: "ready", label: "جاهز", hint: "الطلب جاهز للاستلام", icon: PackageCheck },
  { key: "completed", label: "مكتمل", hint: "تم تسليم الطلب", icon: Truck },
] as const;

/** "Partially available" is a variant of the processing stage. */
const stageIndex = (status: string) => (status === "partially_available" ? 2 : STAGES.findIndex((s) => s.key === status));

type History = NonNullable<WarehouseRequest["history"]>;

export function RequestJourney({ r }: { r: WarehouseRequest }) {
  const [showLog, setShowLog] = useState(false);
  const history: History = r.history ?? [];
  const terminal = r.status === "rejected" || r.status === "cancelled";
  const current = stageIndex(r.status);
  // Furthest stage reached on the main path (for a rejected/cancelled request: where it stopped).
  const reached = Math.max(0, current, ...history.map((h) => stageIndex(h.to_status)));
  const last = (keys: string[]) => [...history].reverse().find((h) => keys.includes(h.to_status));
  const terminalEntry = terminal ? last([r.status]) : undefined;
  const wentPartial = history.some((h) => h.to_status === "partially_available");

  const stages = terminal ? STAGES.slice(0, reached + 1) : STAGES;

  return (
    <div>
      <ol className="relative">
        {stages.map((s, i) => {
          const isCurrent = !terminal && i === current;
          const done = terminal ? true : i < current || (i === current && r.status === "completed");
          const upcoming = !terminal && i > current;
          const partialNow = isCurrent && r.status === "partially_available";
          const entry = last(i === 2 ? ["processing", "partially_available"] : [s.key]);
          const label = partialNow ? "متوفر جزئياً" : s.label;
          const Icon = partialNow ? AlertTriangle : (done && !isCurrent) || (isCurrent && r.status === "completed") ? Check : s.icon;
          const isLast = i === stages.length - 1 && !terminal;
          return (
            <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
              {/* connector to the next step */}
              {!isLast && (
                <span aria-hidden className={cn("absolute start-[17px] top-10 bottom-0 w-[2px] rounded-full",
                  i < reached || terminal ? "bg-gradient-to-b from-gold-500 to-gold-300" : "border-s-2 border-dashed border-gray-200 bg-transparent")} />
              )}
              {/* marker */}
              <span className={cn("relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
                isCurrent && !partialNow && "journey-current bg-brand-green-700 text-white",
                partialNow && "journey-current journey-warn bg-warning text-white",
                done && !isCurrent && "bg-gold-gradient text-white shadow-gold",
                upcoming && "border-2 border-gray-200 bg-white text-gray-300",
              )}>
                <Icon className={cn(isCurrent ? "h-[18px] w-[18px]" : "h-4 w-4")} strokeWidth={done && !isCurrent ? 3 : 2} />
              </span>
              {/* text */}
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-[15px] font-semibold", upcoming ? "text-gray-400" : isCurrent ? (partialNow ? "text-warning" : "text-brand-green-700") : "text-brand-green")}>{label}</span>
                  {isCurrent && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", partialNow ? "bg-[#fbf4e8] text-warning" : "bg-[#eef3ef] text-brand-green-700")}>
                      {r.status === "completed" ? "اكتمل الطلب" : "الحالة الحالية"}
                    </span>
                  )}
                </div>
                <div className={cn("mt-0.5 text-[12px]", upcoming ? "text-gray-400" : "text-gray-500")}>
                  {entry && !upcoming ? <>{entry.user} · {date(entry.created_at, true)}</> : s.hint}
                </div>
                {i === 2 && wentPartial && !partialNow && !upcoming && <div className="mt-1 text-[12px] text-warning">مرّ الطلب بحالة «متوفر جزئياً»</div>}
                {entry?.note && !upcoming && <div className="mt-1.5 rounded-[3px] bg-gold-50 px-3 py-2 text-[13px] leading-6 text-gray-700">{entry.note}</div>}
              </div>
            </li>
          );
        })}

        {terminal && (
          <li className="relative flex gap-4">
            <span className="journey-current journey-danger relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger text-white">
              {r.status === "rejected" ? <XCircle className="h-[18px] w-[18px]" /> : <Ban className="h-[18px] w-[18px]" />}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="text-[15px] font-semibold text-danger">{r.status === "rejected" ? "مرفوض" : "ملغى"}</div>
              {terminalEntry && <div className="mt-0.5 text-[12px] text-gray-500">{terminalEntry.user} · {date(terminalEntry.created_at, true)}</div>}
              {terminalEntry?.note && <div className="mt-1.5 rounded-[3px] bg-[#fbefee] px-3 py-2 text-[13px] leading-6 text-gray-700">{terminalEntry.note}</div>}
            </div>
          </li>
        )}
      </ol>

      {history.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-3">
          <button type="button" onClick={() => setShowLog((v) => !v)} className="flex w-full items-center justify-between text-[13px] text-gray-500 hover:text-gold-700 cursor-pointer" aria-expanded={showLog}>
            السجل التفصيلي ({history.length})
            <ChevronDown className={cn("h-4 w-4 transition-transform", showLog && "rotate-180")} />
          </button>
          {showLog && (
            <ul className="mt-3 space-y-2.5">
              {history.map((h) => (
                <li key={h.id} className="text-[12px] leading-5">
                  <span className="font-medium text-brand-green">{h.to_label}</span>
                  <span className="text-gray-500"> · {h.user} · {date(h.created_at, true)}</span>
                  {h.note && <div className="text-gray-600">{h.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
