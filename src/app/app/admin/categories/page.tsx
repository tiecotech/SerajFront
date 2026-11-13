"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageField, SortableList } from "@/components/app/media";
import { Badge, Button, Card, Field, Img, Input, Modal, PageHeader, Select, Switch, Textarea, useConfirm } from "@/components/ui";
import { del, errorMessage, get, post, put } from "@/lib/api";
import type { Category, Media } from "@/lib/types";

type Edit = Partial<Category> & { image?: Media | null };

export default function CategoriesAdmin() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [archived, setArchived] = useState(false);
  const [edit, setEdit] = useState<Edit | null>(null);
  const list = useQuery({ queryKey: ["admin-categories", archived], queryFn: async () => (await get<{ data: Category[] }>("/admin/categories", { archived: archived ? 1 : undefined })).data });
  const [items, setItems] = useState<Category[]>([]);
  useEffect(() => setItems(list.data ?? []), [list.data]);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["catalog-categories"] }); };

  const save = useMutation({
    mutationFn: () => {
      const b = { name: edit!.name, name_en: edit!.name_en || null, parent_id: edit!.parent_id || null, description: edit!.description || null, image_id: edit!.image?.id ?? null, is_active: edit!.is_active ?? true, show_on_website: edit!.show_on_website ?? true };
      return edit!.id ? put(`/admin/categories/${edit!.id}`, b) : post("/admin/categories", b);
    },
    onSuccess: () => { toast.success("تم حفظ التصنيف."); setEdit(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const reorder = useMutation({ mutationFn: (ids: number[]) => post("/admin/categories/reorder", { ids }), onSuccess: () => { toast.success("تم حفظ الترتيب."); refresh(); } });
  const archive = useMutation({ mutationFn: (id: number) => del(`/admin/categories/${id}`), onSuccess: () => { toast.success("تمت الأرشفة."); refresh(); } });
  const restore = useMutation({ mutationFn: (id: number) => post(`/admin/categories/${id}/restore`), onSuccess: () => { toast.success("تمت الاستعادة."); refresh(); } });

  const parents = (list.data ?? []).filter((c) => !c.parent_id);
  const nameOf = (id: number | null) => list.data?.find((c) => c.id === id)?.name;

  return (
    <>
      {dialog}
      <PageHeader title="التصنيفات" subtitle="رتّب التصنيفات بالسحب والإفلات، وأضف تصنيفات فرعية وصوراً لكل تصنيف." actions={<>
        <Select value={archived ? "1" : ""} onChange={(e) => setArchived(e.target.value === "1")} className="w-40"><option value="">النشطة</option><option value="1">الأرشيف</option></Select>
        <Button onClick={() => setEdit({ is_active: true, show_on_website: true })}><Plus className="h-4 w-4" /> تصنيف جديد</Button>
      </>} />
      <SortableList items={items} onReorder={(it) => { setItems(it); reorder.mutate(it.map((x) => x.id)); }} render={(c, handle) => (
        <Card className="flex items-center gap-3 p-3">
          {!archived && handle}
          <Img media={c.image} variant="thumb" className="h-14 w-20 rounded-[3px] object-cover" />
          <div className="flex-1">
            <div className="font-medium text-brand-green">{c.parent_id && <span className="text-gray-400">{nameOf(c.parent_id)} / </span>}{c.name}</div>
            <div className="text-[12px] text-gray-500">{c.products_count ?? 0} منتج · <span dir="ltr">{c.slug}</span></div>
          </div>
          {!c.is_active && <Badge>غير مفعّل</Badge>}
          {c.show_on_website && <Badge tone="blue">يظهر في الموقع</Badge>}
          {archived ? <Button size="sm" variant="secondary" onClick={() => restore.mutate(c.id)}><RotateCcw className="h-4 w-4" /> استعادة</Button> : <>
            <Button size="sm" variant="ghost" onClick={() => setEdit(c)}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" className="hover:text-danger" onClick={async () => (await confirm({ title: "أرشفة التصنيف؟", text: "لن يظهر في الكتالوج، ويمكن استعادته لاحقاً.", danger: true, confirmLabel: "أرشفة" })) && archive.mutate(c.id)}><Archive className="h-4 w-4" /></Button>
          </>}
        </Card>
      )} />

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "تعديل التصنيف" : "تصنيف جديد"} size="lg"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>إلغاء</Button><Button loading={save.isPending} onClick={() => save.mutate()}>حفظ</Button></>}>
        {edit && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="اسم التصنيف" required><Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="الاسم بالإنجليزية"><Input value={edit.name_en ?? ""} onChange={(e) => setEdit({ ...edit, name_en: e.target.value })} dir="ltr" /></Field>
              <Field label="التصنيف الأب"><Select value={edit.parent_id ?? ""} onChange={(e) => setEdit({ ...edit, parent_id: e.target.value ? Number(e.target.value) : null })}><option value="">— تصنيف رئيسي —</option>{parents.filter((p) => p.id !== edit.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
              <Field label="الوصف"><Textarea rows={3} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <div className="flex flex-wrap gap-5"><Switch checked={edit.is_active ?? true} onChange={(v) => setEdit({ ...edit, is_active: v })} label="مفعّل" /><Switch checked={edit.show_on_website ?? true} onChange={(v) => setEdit({ ...edit, show_on_website: v })} label="يظهر في الموقع العام" /></div>
            </div>
            <ImageField label="صورة التصنيف" value={edit.image} onChange={(m) => setEdit({ ...edit, image: m })} folder="categories" aspect="aspect-[4/3]" />
          </div>
        )}
      </Modal>
    </>
  );
}
