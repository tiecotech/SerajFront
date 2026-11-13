import { API_PREFIX, post } from "@/lib/api";
import type { Quotation } from "@/lib/types";
import { fmtSyp, fmtUsd } from "./Price";

export const pdfUrl = (q: Pick<Quotation, "id">, inline = false) => `${API_PREFIX}/quotations/${q.id}/pdf${inline ? "?inline=1" : ""}`;
/** Quotation PDF re-priced after warehouse shortages. */
export const adjustedPdfUrl = (warehouseRequestId: number, inline = false) => `${API_PREFIX}/warehouse-requests/${warehouseRequestId}/adjusted-pdf${inline ? "?inline=1" : ""}`;

/**
 * Browsers only allow attaching files to the share sheet — and blob downloads — on secure
 * (HTTPS or localhost) pages. A phone opening the PC by its Wi-Fi IP (http://192.168.x.x) is not.
 */
const secure = () => typeof window !== "undefined" && window.isSecureContext;

export async function fetchPdfFile(q: Quotation): Promise<File> {
  const res = await fetch(pdfUrl(q), { credentials: "include" });
  if (!res.ok) throw new Error("تعذّر تحميل ملف PDF.");
  const blob = await res.blob();
  return new File([blob], `عرض-سعر-${q.number}.pdf`, { type: "application/pdf" });
}

export function shareText(q: Quotation) {
  return `عرض سعر ${q.number} من السراج المضيء${q.customer_name ? ` — ${q.customer_name}` : ""}\nالإجمالي: ${fmtUsd(q.total)} — ${fmtSyp(q.total_syp)}`;
}

/** Download the PDF. On non-secure pages a blob download is blocked, so let the server send it. */
export async function downloadPdf(q: Quotation) {
  if (!secure()) {
    window.location.href = pdfUrl(q);
    return;
  }
  const file = await fetchPdfFile(q);
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Signed, expiring link the customer can open without an account. */
export async function quotationShareLink(q: Quotation): Promise<string> {
  const r = await post<{ data: { url: string } }>(`/quotations/${q.id}/share-link`);
  return `${window.location.origin}/backend${r.data.url}`;
}

/** Opens WhatsApp with the message and NO preset number — the user picks the chat. */
function openWhatsApp(message: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const w = window.open(url, "_blank", "noopener");
  if (!w) window.location.href = url; // popup blocked (common on phones after an await)
}

/**
 * Share via WhatsApp:
 *  1. Secure page + device can share files → native share sheet with the PDF attached
 *     (the user chooses WhatsApp and the contact).
 *  2. Otherwise → WhatsApp opens with the message + a secure link to the PDF; the user picks the contact.
 *
 * Returns: "shared" | "cancelled" | "link"
 */
export async function shareViaWhatsApp(q: Quotation): Promise<"shared" | "cancelled" | "link"> {
  const text = shareText(q);
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (secure() && nav.share && nav.canShare) {
    const file = await fetchPdfFile(q);
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: `عرض سعر ${q.number}`, text });
        return "shared";
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      }
    }
  }
  const link = await quotationShareLink(q);
  openWhatsApp(`${text}\n\nملف عرض السعر (PDF):\n${link}`);
  return "link";
}
