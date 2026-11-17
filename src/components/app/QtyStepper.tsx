"use client";

import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const PRESETS = [1, 2, 5, 10, 20, 50, 100];

/**
 * Fast quantity control for the showroom (tablet-first):
 *  - tap +/− for one step; press and hold to keep counting, faster the longer you hold
 *  - tap the number to open a quick panel: preset amounts or type any quantity on the number pad
 *  - with `delay`, rapid changes are shown at once but sent to `onChange` only once you pause
 *    (one API call instead of one per tap)
 */
export function QtyStepper({ value, onChange, min = 0, max = 9999, small, dark, delay = 0 }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  small?: boolean;
  dark?: boolean;
  delay?: number;
}) {
  const [v, setV] = useState(value);
  const [open, setOpen] = useState(false);
  const vRef = useRef(value);
  const pending = useRef(0);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const numBtn = useRef<HTMLButtonElement>(null);

  // follow the server value unless the visitor is in the middle of changing it
  useEffect(() => { if (!pending.current) { setV(value); vRef.current = value; } }, [value]);
  useEffect(() => () => window.clearTimeout(pending.current), []);

  const set = (n: number) => {
    const next = Math.min(max, Math.max(min, Math.round(n)));
    vRef.current = next;
    setV(next);
    if (!delay) { if (next !== latest.current.value) latest.current.onChange(next); return; }
    window.clearTimeout(pending.current);
    pending.current = window.setTimeout(() => {
      pending.current = 0;
      if (vRef.current !== latest.current.value) latest.current.onChange(vRef.current);
    }, delay);
  };

  const plus = useHold(() => set(vRef.current + 1));
  const minus = useHold(() => set(vRef.current - 1));
  const h = small ? "h-10" : "h-14";
  const w = small ? "w-10" : "w-12";

  return (
    <div className={cn("relative flex select-none items-center rounded-full border", dark ? "border-white/20 bg-white/5 text-white" : "border-gold-300 bg-white text-brand-green", h)}>
      <button {...plus} disabled={v >= max} className={cn("flex h-full touch-none items-center justify-center rounded-full transition hover:text-gold-500 active:scale-90 disabled:opacity-30 cursor-pointer", w)} aria-label="زيادة (اضغط مطوّلاً للتسريع)"><Plus className="h-5 w-5" /></button>
      <button ref={numBtn} onClick={() => setOpen(true)} className={cn("min-w-9 rounded-md px-1 text-center font-semibold tabular underline decoration-dotted decoration-gold-400/70 underline-offset-4 transition hover:text-gold-500 cursor-pointer", small ? "text-[15px]" : "text-[18px]")} aria-label={`الكمية ${v} — اضغط لإدخال كمية`}>
        <span key={v} className="sr-pop inline-block">{v}</span>
      </button>
      <button {...minus} disabled={v <= min} className={cn("flex h-full touch-none items-center justify-center rounded-full transition hover:text-gold-500 active:scale-90 disabled:opacity-30 cursor-pointer", w)} aria-label="إنقاص (اضغط مطوّلاً للتسريع)">
        {min === 0 && v === 1 ? <Trash2 className="h-[18px] w-[18px]" /> : <Minus className="h-5 w-5" />}
      </button>
      {open && <QtyPanel anchor={numBtn.current} value={v} min={min} max={max} onPick={(n) => { set(n); setOpen(false); }} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Pointer handlers for a button that repeats while held: once at once, again after 380ms, then faster and faster. */
function useHold(step: () => void) {
  const t = useRef(0);
  const ticks = useRef(0);
  const stepRef = useRef(step);
  stepRef.current = step;
  const stop = () => { window.clearTimeout(t.current); t.current = 0; };
  const loop = () => {
    ticks.current++;
    stepRef.current();
    const wait = ticks.current < 6 ? 140 : ticks.current < 16 ? 80 : 40;
    t.current = window.setTimeout(loop, wait);
  };
  useEffect(() => stop, []);
  return {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0 || e.currentTarget.disabled) return;
      e.preventDefault();
      ticks.current = 0;
      stepRef.current();
      t.current = window.setTimeout(loop, 380);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(), // long-press on touch shouldn't open a menu
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stepRef.current(); } },
  };
}

function QtyPanel({ anchor, value, min, max, onPick, onClose }: { anchor: HTMLElement | null; value: number; min: number; max: number; onPick: (n: number) => void; onClose: () => void }) {
  const [text, setText] = useState(String(value));
  const panel = useRef<HTMLDivElement>(null);
  const r = anchor?.getBoundingClientRect();
  const below = !!r && r.top < 300; // not enough room above → open underneath

  useEffect(() => {
    const out = (e: PointerEvent) => { if (!panel.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", out, true);
    window.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", out, true); window.removeEventListener("keydown", key); };
  }, [onClose]);

  if (!r) return null;
  const left = Math.min(window.innerWidth - 150, Math.max(150, r.left + r.width / 2));
  const commit = () => { const n = parseInt(text, 10); if (Number.isFinite(n)) onPick(n); else onClose(); };

  return createPortal(
    // outer layer positions the panel, inner layer animates (an animated transform would override the offset)
    <div ref={panel} role="dialog" aria-label="اختر الكمية" dir="rtl" className="fixed z-[90] w-[280px]"
      style={{ left, top: below ? r.bottom + 10 : r.top - 10, transform: `translate(-50%, ${below ? "0" : "-100%"})` }}>
      <div className="sr-pop rounded-[16px] bg-white p-4 text-brand-green shadow-[0_24px_60px_-12px_rgba(44,57,48,.45)] ring-1 ring-gold-200">
      <div className="flex items-center justify-between">
        <span className="text-[12px] tracking-[0.14em] text-gold-600">الكمية</span>
        {min === 0 && value > 0 && <button onClick={() => onPick(0)} className="flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-danger cursor-pointer"><Trash2 className="h-3.5 w-3.5" />إزالة</button>}
      </div>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); commit(); }}>
        <input autoFocus type="number" inputMode="numeric" min={min} max={max} value={text} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setText(e.target.value)}
          className="h-12 w-full rounded-[10px] border border-gold-200 bg-[#fbf9f5] px-3 text-center font-display text-[22px] font-semibold tabular focus:border-gold-500 focus:outline-none focus:ring-[3px] focus:ring-gold-500/20" />
        <button type="submit" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-brand-green text-white transition hover:bg-[#1f2a23] cursor-pointer" aria-label="تأكيد"><Check className="h-5 w-5" /></button>
      </form>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {PRESETS.filter((n) => n >= Math.max(1, min) && n <= max).map((n) => (
          <button key={n} onClick={() => onPick(n)} className={cn("h-10 rounded-[10px] text-[15px] font-semibold tabular transition cursor-pointer", n === value ? "bg-brand-green text-white" : "bg-gold-50 text-brand-green hover:bg-gold-100")}>{n}</button>
        ))}
        <button onClick={() => onPick(value + 10)} className="h-10 rounded-[10px] border border-dashed border-gold-300 text-[13px] font-semibold text-gold-700 transition hover:bg-gold-50 cursor-pointer">+10</button>
      </div>
      </div>
    </div>,
    document.body,
  );
}
