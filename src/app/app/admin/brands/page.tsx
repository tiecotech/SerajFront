"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GalleryField, ImageField, SortableList } from "@/components/app/media";
import { Badge, Button, Card, Field, Img, Input, Modal, PageHeader, Select, Switch, Textarea, useConfirm } from "@/components/ui";
import { del, errorMessage, get, post, put } from "@/lib/api";
import type { Brand, Media } from "@/lib/types";

type Edit = Partial<Omit<Brand, "gallery">> & { galleryMedia?: Media[] };

export default function BrandsAdmin() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [archived, setArchived] = useState(false);
  const [edit, setEdit] = useState<Edit | null>(null);
  const list = useQuery({ queryKey: ["admin-brands", archived], queryFn: async () => (await get<{ data: Brand[] }>("/admin/brands", { archived: archived ? 1 : undefined })).data });
  const [items, setItems] = useState<Brand[]>([]);
  useEffect(() => setItems(list.data ?? []), [list.data]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-brands"] });

  const save = useMutation({
    mutationFn: () => {
      const e = edit!;
      const b = {
        name: e.name, tagline: e.tagline || null, description: e.description || null, logo_id: e.logo?.id ?? null, cover_id: e.cover?.id ?? null,
        primary_color: e.colors?.primary || null, secondary_color: e.colors?.secondary || null, accent_color: e.colors?.accent || null,
        website_url: e.website_url || null, is_active: e.is_active ?? true, show_on_website: e.show_on_website ?? true, gallery_ids: (e.galleryMedia ?? []).map((m) => m.id),
      };
      return e.id ? put(`/admin/brands/${e.id}`, b) : post("/admin/brands", b);
    },
    onSuccess: () => { toast.success("تم حفظ البراند. ستظهر التغييرات في الموقع العام بعد النشر."); setEdit(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const reorder = useMutation({ mutationFn: (ids: number[]) => post("/admin/brands/reorder", { ids }), onSuccess: () => toast.success("تم حفظ الترتيب.") });
  const archive = useMutation({ mutationFn: (id: number) => del(`/admin/brands/${id}`), onSuccess: () => { toast.success("تمت الأرشفة."); refresh(); } });
  const restore = useMutation({ mutationFn: (id: number) => post(`/admin/brands/${id}/restore`), onSuccess: () => { toast.success("تمت الاستعادة."); refresh(); } });
  const color = (k: "primary" | "secondary" | "accent", v: string) => setEdit({ ...edit!, colors: { primary: null, secondary: null, accent: null, ...edit!.colors, [k]: v } });

  return (
    <>
      {dialog}
      <PageHeader title="البراندات" subtitle="كل براند يحتفظ بشعاره وألوانه الأصلية. اسحب لتغيير ترتيب الظهور." actions={<>
        <Select value={archived ? "1" : ""} onChange={(e) => setArchived(e.target.value === "1")} className="w-40"><option value="">النشطة</option><option value="1">الأرشيف</option></Select>
        <Button onClick={() => setEdit({ is_active: true, show_on_website: true, colors: { primary: "#B8956F", secondary: null, accent: null }, galleryMedia: [] })}><Plus className="h-4 w-4" /> براند جديد</Button>
      </>} />
      <SortableList items={items} onReorder={(it) => { setItems(it); reorder.mutate(it.map((x) => x.id)); }} render={(b, handle) => (
        <Card className="flex items-center gap-4 p-3" style={{ borderInlineStart: `4px solid ${b.colors.primary ?? "#eee"}` }}>
          {!archived && handle}
          <div className="flex h-16 w-28 items-center justify-center rounded-[3px] bg-white"><Img media={b.logo} variant="thumb" className="max-h-12 max-w-24 object-contain" /></div>
          <div className="flex-1"><div className="font-medium text-brand-green">{b.name}</div><div className="text-[12px] text-gray-500">{b.tagline} · {b.products_count ?? 0} منتج</div></div>
          <div className="hidden gap-1 sm:flex">{[b.colors.primary, b.colors.secondary, b.colors.accent].filter(Boolean).map((c) => <span key={c} className="h-5 w-5 rounded-full border border-black/5" style={{ background: c! }} />)}</div>
          {b.show_on_website ? <Badge tone="blue">يظهر في الموقع</Badge> : <Badge>مخفي من الموقع</Badge>}
          {archived ? <Button size="sm" variant="secondary" onClick={() => restore.mutate(b.id)}><RotateCcw className="h-4 w-4" /> استعادة</Button> : <>
            <Button size="sm" variant="ghost" onClick={() => setEdit({ ...b, galleryMedia: b.gallery?.map((g) => g.image) ?? [] })}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" className="hover:text-danger" onClick={async () => (await confirm({ title: "أرشفة البراند؟", danger: true, confirmLabel: "أرشفة" })) && archive.mutate(b.id)}><Archive className="h-4 w-4" /></Button>
          </>}
        </Card>
      )} />

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? `تعديل ${edit.name}` : "براند جديد"} size="xl"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>إلغاء</Button><Button loading={save.isPending} onClick={() => save.mutate()}>حفظ</Button></>}>
        {edit && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="اسم البراند" required><Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="الشعار اللفظي (Tagline)"><Input value={edit.tagline ?? ""} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} /></Field>
              <Field label="الوصف"><Textarea rows={4} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <Field label="ألوان الهوية (كما في دليل البراند)">
                <div className="flex flex-wrap gap-3">
                  {(["primary", "secondary", "accent"] as const).map((k) => (
                    <label key={k} className="flex items-center gap-2 rounded-[3px] border border-gray-200 px-2 py-1.5">
                      <input type="color" value={edit.colors?.[k] ?? "#ffffff"} onChange={(e) => color(k, e.target.value.toUpperCase())} className="h-7 w-7 cursor-pointer rounded border-0" />
                      <input value={edit.colors?.[k] ?? ""} onChange={(e) => color(k, e.target.value)} placeholder="#000000" className="w-20 text-[12px] focus:outline-none" dir="ltr" />
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="رابط الموقع الرسمي"><Input value={edit.website_url ?? ""} onChange={(e) => setEdit({ ...edit, website_url: e.target.value })} dir="ltr" /></Field>
              <div className="flex flex-wrap gap-5"><Switch checked={edit.is_active ?? true} onChange={(v) => setEdit({ ...edit, is_active: v })} label="مفعّل" /><Switch checked={edit.show_on_website ?? true} onChange={(v) => setEdit({ ...edit, show_on_website: v })} label="يظهر في الموقع العام" /></div>
            </div>
            <div className="space-y-5">
              <ImageField label="الشعار (PNG شفاف — يُعرض دون أي تعديل)" value={edit.logo} onChange={(m) => setEdit({ ...edit, logo: m })} folder="brands" aspect="aspect-[3/1.4]" contain />
              <ImageField label="صورة الغلاف" value={edit.cover} onChange={(m) => setEdit({ ...edit, cover: m })} folder="brands" />
              <div><div className="mb-1.5 text-[13px] font-medium text-gray-700">معرض الصور</div><GalleryField value={edit.galleryMedia ?? []} onChange={(m) => setEdit({ ...edit, galleryMedia: m })} folder="brands" /></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
