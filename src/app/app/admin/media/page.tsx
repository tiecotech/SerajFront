"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, RefreshCw, Search, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadButton } from "@/components/app/media";
import { Badge, Button, EmptyState, Field, Img, Input, Modal, PageHeader, Pagination, Select } from "@/components/ui";
import { api, ApiError, del, errorMessage, get, put } from "@/lib/api";
import type { Media, Paginated } from "@/lib/types";
import { cn, date } from "@/lib/utils";

type Detail = Media & { usages: { type: string; id: number; field: string }[]; title?: string | null };
const USAGE_LABEL: Record<string, string> = { product_image: "صورة منتج", brand: "براند", brand_image: "معرض براند", category: "تصنيف", website_slide: "شريحة الغلاف", website_section: "قسم في الموقع", website_seo: "صورة SEO", project: "غلاف مشروع", project_image: "معرض مشروع" };

export default function MediaLibraryPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [unused, setUnused] = useState(false);
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<number | null>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const folders = useQuery({ queryKey: ["media-folders"], queryFn: async () => (await get<{ data: Record<string, number> }>("/admin/media/folders")).data });
  const list = useQuery({ queryKey: ["media", q, folder, unused, page], queryFn: () => get<Paginated<Media>>("/admin/media", { q, folder, unused: unused ? 1 : undefined, page, per_page: 36 }), placeholderData: keepPreviousData });
  const detail = useQuery({ queryKey: ["media-item", sel], queryFn: async () => (await get<{ data: Detail }>(`/admin/media/${sel}`)).data, enabled: !!sel });
  const [alt, setAlt] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["media"] }); qc.invalidateQueries({ queryKey: ["media-folders"] }); qc.invalidateQueries({ queryKey: ["media-item"] }); };

  const saveAlt = useMutation({ mutationFn: () => put(`/admin/media/${sel}`, { alt }), onSuccess: () => { toast.success("تم الحفظ."); refresh(); } });
  const remove = useMutation({
    mutationFn: (detach: boolean) => del(`/admin/media/${sel}`, { detach: detach ? 1 : undefined }),
    onSuccess: () => { toast.success("تم حذف الملف."); setSel(null); refresh(); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : errorMessage(e)),
  });

  return (
    <>
      <PageHeader title="مكتبة الوسائط" subtitle="رفع الصور مع ضغطها وإنشاء أحجام مناسبة للكمبيوتر والهاتف تلقائياً، ومعرفة أماكن استخدام كل صورة." actions={<UploadButton folder={folder || "general"} onUploaded={refresh} variant="primary" />} />
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm"><Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="اسم الملف أو الوصف" className="ps-10" /></div>
        <Select value={folder} onChange={(e) => { setFolder(e.target.value); setPage(1); }} className="w-48"><option value="">كل المجلدات</option>{Object.entries(folders.data ?? {}).map(([f, c]) => <option key={f} value={f}>{f} ({c})</option>)}</Select>
        <Select value={unused ? "1" : ""} onChange={(e) => { setUnused(e.target.value === "1"); setPage(1); }} className="w-48"><option value="">كل الملفات</option><option value="1">غير المستخدمة فقط</option></Select>
      </div>
      {list.data?.data.length === 0 ? <EmptyState title="لا توجد ملفات" /> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {list.data?.data.map((m) => (
            <button key={m.id} onClick={() => { setSel(m.id); setAlt(m.alt ?? ""); }} className="group relative aspect-square overflow-hidden rounded-[3px] border border-gray-100 bg-white cursor-pointer hover:border-gold-300">
              <Img media={m} variant="thumb" className="h-full w-full object-cover" />
              <span className={cn("absolute bottom-1.5 start-1.5 rounded-full px-1.5 text-[10px] font-medium", m.usages_count ? "bg-white/90 text-gold-700" : "bg-gray-900/60 text-white")}>{m.usages_count ? `مستخدمة ×${m.usages_count}` : "غير مستخدمة"}</span>
            </button>
          ))}
        </div>
      )}
      {list.data && <Pagination page={page} lastPage={list.data.meta.last_page} onChange={setPage} />}

      <Modal open={!!sel} onOpenChange={(o) => !o && setSel(null)} title="تفاصيل الملف" size="lg">
        {detail.data && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-[3px] bg-gray-50"><Img media={detail.data} variant="md" className="w-full object-contain" /></div>
            <div className="space-y-4 text-[14px]">
              <div className="text-[13px] text-gray-500 break-all">{detail.data.original_name}</div>
              <div className="flex flex-wrap gap-2 text-[12px] text-gray-500"><Badge>{detail.data.width}×{detail.data.height}</Badge><Badge>{Math.round((detail.data.size ?? 0) / 1024)} KB</Badge><Badge>{detail.data.folder}</Badge><Badge>{date(detail.data.created_at)}</Badge></div>
              <Field label="النص البديل (Alt)"><div className="flex gap-2"><Input value={alt} onChange={(e) => setAlt(e.target.value)} /><Button variant="secondary" loading={saveAlt.isPending} onClick={() => saveAlt.mutate()}>حفظ</Button></div></Field>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 font-medium text-brand-green"><Link2 className="h-4 w-4 text-gold-500" /> أماكن الاستخدام</div>
                {detail.data.usages.length === 0 ? <div className="text-[13px] text-gray-400">غير مستخدمة في أي مكان.</div> : (
                  <ul className="space-y-1 text-[13px] text-gray-700">{detail.data.usages.map((u, i) => <li key={i}>• {USAGE_LABEL[u.type] ?? u.type} #{u.id}</li>)}</ul>
                )}
              </div>
              <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const fd = new FormData(); fd.append("file", f);
                try { await api(`/admin/media/${sel}/replace`, { method: "POST", body: fd }); toast.success("تم استبدال الصورة في جميع أماكن استخدامها."); refresh(); } catch (err) { toast.error(errorMessage(err)); }
                e.target.value = "";
              }} />
              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <Button variant="secondary" onClick={() => replaceRef.current?.click()}><RefreshCw className="h-4 w-4" /> استبدال الصورة</Button>
                {detail.data.usages.length === 0
                  ? <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(false)}><Trash2 className="h-4 w-4" /> حذف</Button>
                  : <Button variant="danger" loading={remove.isPending} onClick={() => { if (window.confirm(`هذه الصورة مستخدمة في ${detail.data!.usages.length} موضع. سيتم فك ارتباطها من هذه المواضع ثم حذفها. متابعة؟`)) remove.mutate(true); }}><Trash2 className="h-4 w-4" /> فك الارتباط والحذف</Button>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
