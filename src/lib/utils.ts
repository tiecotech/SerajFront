import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display-only formatting of server-computed decimal strings (never used for math). */
export function money(value: string | number | null | undefined, currency?: string) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  const s = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return currency ? `${s} ${currency}` : s;
}

export function qty(value: string | number) {
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export function date(value?: string | null, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function relative(value?: string | null) {
  if (!value) return "—";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  if (diff < 60) return "الآن";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 2592000) return rtf.format(-Math.round(diff / 86400), "day");
  return date(value);
}
