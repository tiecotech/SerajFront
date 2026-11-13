"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Eye, EyeOff, FilePlus2, History, Images, LayoutTemplate, Pencil, Plus, Rocket, RotateCcw, Settings2, Trash2, FolderKanban, CircleAlert, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SectionEditor } from "@/components/app/cms/SectionEditor";
import { GalleryField, ImageField, SortableList } from "@/components/app/media";
import { Badge, Button, Card, EmptyState, Field, Img, Input, Modal, PageHeader, PageLoader, Select, Switch, Textarea, statusTone, useConfirm } from "@/components/ui";
import { del, errorMessage, get, post, put } from "@/lib/api";
import type { Media } from "@/lib/types";
import { cn, date } from "@/lib/utils";
import type { Json } from "@/lib/types";

type Slide = { id: number; title: string; subtitle: string | null; eyebrow: string | null; desktop_image: Media | null; mobile_image: Media | null; primary_cta_label: string | null; primary_cta_url: string | null; secondary_cta_label: string | null; secondary_cta_url: string | null; text_align: string; text_position: string; overlay_opacity: number; text_theme: string; is_active: boolean };
type Page = { id: number; slug: string; title: string; is_system: boolean; show_in_menu: boolean; status: string; sections_count: number; seo: { meta_title: string | null; meta_description: string | null; og_image: Media | null; indexable: boolean } | null };
type Section = { id: number; type: string; type_label: string; admin_label: string; is_visible: boolean; archived: boolean; content: Record<string, Json>; media: Record<string, Media> };
type Project = { id: number; title: string; client: string | null; location: string | null; project_type: string | null; year: number | null; summary: string | null; description: string | null; cover: Media | null; gallery: { media_id: number; caption: string | null; image: Media }[]; is_visible: boolean; is_featured: boolean };

const TABS = [
  { k: "hero", l: "غلاف الموقع", icon: Images },
  { k: "pages", l: "الصفحات والأقسام", icon: LayoutTemplate },
  { k: "projects", l: "المشاريع", icon: FolderKanban },
  { k: "settings", l: "إعدادات العرض", icon: Settings2 },
  { k: "history", l: "النشر والإصدارات", icon: History },
];

export default function WebsiteAdmin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("hero");
  const [publishOpen, setPublishOpen] = useState(false);
  const [note, setNote] = useState("");
  const status = useQuery({ queryKey: ["cms-status"], queryFn: async () => (await get<{ data: { has_unpublished_changes: boolean; current: { version: number; published_at: string; published_by: string } | null } }>("/admin/website/status")).data });
  const changed = () => qc.invalidateQueries({ queryKey: ["cms-status"] });

  const publish = useMutation({
    mutationFn: () => post<{ message: string }>("/admin/website/publish", { note }),
    onSuccess: (r) => { toast.success(r.message); setPublishOpen(false); setNote(""); qc.invalidateQueries({ queryKey: ["cms-status"] }); qc.invalidateQueries({ queryKey: ["cms-revisions"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  async function openPreview(page = "home") {
    try {
      const r = await post<{ data: { query: string } }>("/admin/website/preview-link");
      window.open(`/preview?${r.data.query}&page=${page}`, "_blank");
    } catch (e) { toast.error(errorMessage(e)); }
  }

  return (
    <>
      <PageHeader title="إدارة واجهة الموقع" subtitle="عدّل الغلاف والأقسام والصفحات والمشاريع كمسودة، عاينها، ثم انشرها للزوار."
        actions={<>
          <Button variant="secondary" onClick={() => openPreview()}><Eye className="h-4 w-4" /> معاينة المسودة</Button>
          <Button onClick={() => setPublishOpen(true)}><Rocket className="h-4 w-4" /> نشر التغييرات</Button>
        </>} />
      {status.data && (
        <div className={cn("mb-6 flex flex-wrap items-center gap-3 rounded-[3px] border px-4 py-3 text-[14px]", status.data.has_unpublished_changes ? "border-gold-200 bg-gold-50 text-gold-700" : "border-[#d6e8dc] bg-[#eef5f0] text-success")}>
          {status.data.has_unpublished_changes ? <CircleAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          {status.data.has_unpublished_changes ? "توجد تعديلات محفوظة كمسودة لم تُنشر بعد — لن يراها الزوار قبل الضغط على «نشر التغييرات»." : "الموقع العام مطابق لآخر نسخة منشورة."}
          {status.data.current && <span className="ms-auto text-[12px] opacity-80">الإصدار المنشور: <span dir="ltr">v{status.data.current.version}</span> · {date(status.data.current.published_at, true)} · {status.data.current.published_by}</span>}
        </div>
      )}
      <div className="scroll-thin mb-6 flex gap-1.5 overflow-x-auto rounded-[3px] border border-gray-100 bg-white p-1.5">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={cn("flex shrink-0 items-center gap-2 rounded-[3px] px-4 py-2 text-[14px] cursor-pointer", tab === t.k ? "bg-gold-50 font-medium text-brand-green" : "text-gray-500 hover:bg-gray-50")}>
            <t.icon className={cn("h-4 w-4", tab === t.k ? "text-gold-600" : "text-gray-400")} /> {t.l}
          </button>
        ))}
      </div>
      {tab === "hero" && <SlidesTab onChanged={changed} />}
      {tab === "pages" && <PagesTab onChanged={changed} onPreview={openPreview} />}
      {tab === "projects" && <ProjectsTab onChanged={changed} />}
      {tab === "settings" && <DisplaySettingsTab onChanged={changed} />}
      {tab === "history" && <RevisionsTab />}

      <Modal open={publishOpen} onOpenChange={setPublishOpen} title="نشر التغييرات للزوار" description="سيتم التحقق من جميع الأقسام ثم نشر نسخة جديدة من الموقع، مع الاحتفاظ بالنسخة الحالية في سجل الإصدارات."
        footer={<><Button variant="secondary" onClick={() => setPublishOpen(false)}>إلغاء</Button><Button loading={publish.isPending} onClick={() => publish.mutate()}><Rocket className="h-4 w-4" /> نشر الآن</Button></>}>
        <Field label="ملاحظة على هذا الإصدار (اختياري)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: تحديث غلاف الصفحة الرئيسية" /></Field>
      </Modal>
    </>
  );
}

/* ---------------------------------- Slides ---------------------------------- */
function SlidesTab({ onChanged }: { onChanged: () => void }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const q = useQuery({ queryKey: ["cms-slides"], queryFn: async () => (await get<{ data: Slide[] }>("/admin/website/slides")).data });
  const [items, setItems] = useState<Slide[]>([]);
  useEffect(() => setItems(q.data ?? []), [q.data]);
  const [edit, setEdit] = useState<Partial<Slide> | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["cms-slides"] }); onChanged(); };

  const save = useMutation({
    mutationFn: () => {
      const e = edit!;
      const b = { title: e.title, subtitle: e.subtitle || null, eyebrow: e.eyebrow || null, desktop_image_id: e.desktop_image?.id ?? null, mobile_image_id: e.mobile_image?.id ?? null, primary_cta_label: e.primary_cta_label || null, primary_cta_url: e.primary_cta_url || null, secondary_cta_label: e.secondary_cta_label || null, secondary_cta_url: e.secondary_cta_url || null, text_align: e.text_align ?? "start", text_position: e.text_position ?? "center", overlay_opacity: e.overlay_opacity ?? 40, text_theme: e.text_theme ?? "light", is_active: e.is_active ?? true };
      return e.id ? put(`/admin/website/slides/${e.id}`, b) : post("/admin/website/slides", b);
    },
    onSuccess: () => { toast.success("تم الحفظ كمسودة."); setEdit(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const reorder = useMutation({ mutationFn: (ids: number[]) => post("/admin/website/slides/reorder", { ids }), onSuccess: () => { toast.success("تم حفظ ترتيب الشرائح."); onChanged(); } });
  const remove = useMutation({ mutationFn: (id: number) => del(`/admin/website/slides/${id}`), onSuccess: () => { toast.success("تم الحذف من المسودة."); refresh(); } });
  const toggle = useMutation({ mutationFn: (s: Slide) => put(`/admin/website/slides/${s.id}`, { is_active: !s.is_active }), onSuccess: refresh });

  if (q.isLoading) return <PageLoader />;
  return (
    <>
      {dialog}
      <div className="mb-4 flex items-center justify-between"><p className="text-[14px] text-gray-500">اسحب الشرائح لتغيير ترتيب ظهورها. يمكن تحديد صورة مستقلة للهاتف.</p><Button onClick={() => setEdit({ is_active: true, text_align: "start", text_position: "center", overlay_opacity: 40, text_theme: "light" })}><Plus className="h-4 w-4" /> شريحة جديدة</Button></div>
      {items.length === 0 ? <EmptyState title="لا توجد شرائح" text="أضف شريحة لعرض غلاف الصفحة الرئيسية." /> : (
        <SortableList items={items} onReorder={(it) => { setItems(it); reorder.mutate(it.map((x) => x.id)); }} render={(s, handle) => (
          <Card className={cn("flex items-center gap-4 p-3", !s.is_active && "opacity-60")}>
            {handle}
            <Img media={s.desktop_image} variant="thumb" className="h-20 w-36 rounded-[3px] object-cover" />
            <div className="flex-1"><div className="text-[12px] text-gold-600">{s.eyebrow}</div><div className="font-medium text-brand-green">{s.title}</div><div className="line-clamp-1 text-[12px] text-gray-500">{s.subtitle}</div></div>
            <Button size="sm" variant="ghost" title={s.is_active ? "إخفاء" : "إظهار"} onClick={() => toggle.mutate(s)}>{s.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit(s)}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" className="hover:text-danger" onClick={async () => (await confirm({ title: "حذف الشريحة؟", danger: true, confirmLabel: "حذف" })) && remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
          </Card>
        )} />
      )}

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "تعديل الشريحة" : "شريحة جديدة"} size="xl"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>إلغاء</Button><Button loading={save.isPending} onClick={() => save.mutate()}>حفظ كمسودة</Button></>}>
        {edit && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="عنوان صغير"><Input value={edit.eyebrow ?? ""} onChange={(e) => setEdit({ ...edit, eyebrow: e.target.value })} /></Field>
              <Field label="العنوان الرئيسي" required><Input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
              <Field label="النص التعريفي"><Textarea rows={3} value={edit.subtitle ?? ""} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="نص الزر الرئيسي"><Input value={edit.primary_cta_label ?? ""} onChange={(e) => setEdit({ ...edit, primary_cta_label: e.target.value })} /></Field>
                <Field label="رابط الزر الرئيسي"><Input value={edit.primary_cta_url ?? ""} onChange={(e) => setEdit({ ...edit, primary_cta_url: e.target.value })} dir="ltr" /></Field>
                <Field label="نص الزر الثانوي"><Input value={edit.secondary_cta_label ?? ""} onChange={(e) => setEdit({ ...edit, secondary_cta_label: e.target.value })} /></Field>
                <Field label="رابط الزر الثانوي"><Input value={edit.secondary_cta_url ?? ""} onChange={(e) => setEdit({ ...edit, secondary_cta_url: e.target.value })} dir="ltr" /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="محاذاة النص"><Select value={edit.text_align} onChange={(e) => setEdit({ ...edit, text_align: e.target.value })}><option value="start">يمين</option><option value="center">وسط</option><option value="end">يسار</option></Select></Field>
                <Field label="موضع النص"><Select value={edit.text_position} onChange={(e) => setEdit({ ...edit, text_position: e.target.value })}><option value="top">أعلى</option><option value="center">وسط</option><option value="bottom">أسفل</option></Select></Field>
                <Field label="لون النص"><Select value={edit.text_theme} onChange={(e) => setEdit({ ...edit, text_theme: e.target.value })}><option value="light">فاتح</option><option value="dark">داكن</option></Select></Field>
              </div>
              <Field label={`شفافية الطبقة فوق الصورة: ${edit.overlay_opacity ?? 40}%`}><input type="range" min={0} max={90} value={edit.overlay_opacity ?? 40} onChange={(e) => setEdit({ ...edit, overlay_opacity: Number(e.target.value) })} className="w-full accent-[#B8956F]" /></Field>
              <Switch checked={edit.is_active ?? true} onChange={(v) => setEdit({ ...edit, is_active: v })} label="الشريحة مفعّلة" />
            </div>
            <div className="space-y-5">
              <ImageField label="صورة الكمبيوتر (يفضل 2400×1350)" value={edit.desktop_image} onChange={(m) => setEdit({ ...edit, desktop_image: m })} folder="hero" />
              <ImageField label="صورة الهاتف (اختياري، يفضل عمودية)" value={edit.mobile_image} onChange={(m) => setEdit({ ...edit, mobile_image: m })} folder="hero" aspect="aspect-[3/4] max-w-[220px]" />
              {edit.desktop_image && (
                <div>
                  <div className="mb-1.5 text-[13px] font-medium text-gray-700">معاينة سريعة</div>
                  <div className="relative aspect-[16/8] overflow-hidden rounded-[3px]">
                    <Img media={edit.desktop_image} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0" style={{ background: edit.text_theme === "dark" ? `rgba(255,255,255,${(edit.overlay_opacity ?? 40) / 100})` : `rgba(20,22,20,${(edit.overlay_opacity ?? 40) / 100})` }} />
                    <div className={cn("absolute inset-0 flex flex-col p-6", { start: "items-start text-start", center: "items-center text-center", end: "items-end text-end" }[edit.text_align ?? "start"], { top: "justify-start", center: "justify-center", bottom: "justify-end" }[edit.text_position ?? "center"])}>
                      <div className={cn("text-[11px]", edit.text_theme === "dark" ? "text-gold-600" : "text-gold-300")}>{edit.eyebrow}</div>
                      <div className={cn("text-[18px] font-semibold leading-snug", edit.text_theme === "dark" ? "text-brand-green" : "text-white")}>{edit.title}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ---------------------------------- Pages & Sections ---------------------------------- */
function PagesTab({ onChanged, onPreview }: { onChanged: () => void; onPreview: (slug: string) => void }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const pages = useQuery({ queryKey: ["cms-pages"], queryFn: () => get<{ data: Page[]; section_types: { type: string; label: string }[] }>("/admin/website/pages") });
  const [slug, setSlug] = useState<number | null>(null);
  const current = slug ?? pages.data?.data[0]?.id ?? null;
  const page = useQuery({ queryKey: ["cms-page", current], queryFn: async () => (await get<{ data: Page & { sections: Section[] } }>(`/admin/website/pages/${current}`)).data, enabled: !!current });
  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => setSections(page.data?.sections ?? []), [page.data]);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [newType, setNewType] = useState("");
  const [pageEdit, setPageEdit] = useState<Partial<Page> | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["cms-page"] }); qc.invalidateQueries({ queryKey: ["cms-pages"] }); onChanged(); };

  const reorder = useMutation({ mutationFn: (ids: number[]) => post(`/admin/website/pages/${current}/sections/reorder`, { ids }), onSuccess: () => { toast.success("تم حفظ ترتيب الأقسام."); onChanged(); } });
  const updateSection = useMutation({
    mutationFn: (s: Partial<Section> & { id: number }) => put(`/admin/website/sections/${s.id}`, s),
    onSuccess: () => { toast.success("تم الحفظ كمسودة."); setEditSection(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const addSection = useMutation({
    mutationFn: () => post(`/admin/website/pages/${current}/sections`, { type: newType, content: newType === "hero" ? { autoplay: true, interval_ms: 6000, height: "full" } : { title: "عنوان القسم" } }),
    onSuccess: () => { toast.success("تمت إضافة القسم."); setNewType(""); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const removeSection = useMutation({ mutationFn: (id: number) => del(`/admin/website/sections/${id}`), onSuccess: refresh });
  const savePage = useMutation({
    mutationFn: () => {
      const p = pageEdit!;
      const body = { title: p.title, slug: p.slug, show_in_menu: p.show_in_menu, status: p.status, seo: { meta_title: p.seo?.meta_title || null, meta_description: p.seo?.meta_description || null, og_image_id: p.seo?.og_image?.id ?? null, indexable: p.seo?.indexable ?? true } };
      return p.id ? put(`/admin/website/pages/${p.id}`, body) : post("/admin/website/pages", body);
    },
    onSuccess: () => { toast.success("تم حفظ الصفحة."); setPageEdit(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const archivePage = useMutation({ mutationFn: (id: number) => del(`/admin/website/pages/${id}`), onSuccess: () => { setSlug(null); refresh(); } });

  if (pages.isLoading) return <PageLoader />;
  const cp = pages.data?.data.find((p) => p.id === current);
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {dialog}
      <Card className="h-fit p-2">
        {pages.data?.data.map((p) => (
          <button key={p.id} onClick={() => setSlug(p.id)} className={cn("flex w-full items-center justify-between rounded-[3px] px-3 py-2.5 text-[14px] cursor-pointer", current === p.id ? "bg-gold-50 font-medium text-brand-green" : "text-gray-700 hover:bg-gray-50")}>
            <span>{p.title}</span><Badge tone={statusTone[p.status]}>{p.status === "published" ? "منشورة" : p.status === "draft" ? "مسودة" : "غير منشورة"}</Badge>
          </button>
        ))}
        <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => setPageEdit({ title: "", show_in_menu: true, status: "draft", seo: { meta_title: null, meta_description: null, og_image: null, indexable: true } })}><FilePlus2 className="h-4 w-4" /> صفحة جديدة</Button>
      </Card>

      <div>
        {cp && (
          <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1"><div className="font-semibold text-brand-green">{cp.title}</div><div className="text-[12px] text-gray-500" dir="ltr" style={{ textAlign: "right" }}>/{cp.slug === "home" ? "" : cp.slug}</div></div>
            <Button size="sm" variant="secondary" onClick={() => onPreview(cp.slug)}><Eye className="h-4 w-4" /> معاينة</Button>
            <Button size="sm" variant="secondary" onClick={() => setPageEdit(cp)}><Settings2 className="h-4 w-4" /> إعدادات الصفحة و SEO</Button>
            {!cp.is_system && <Button size="sm" variant="ghost" className="hover:text-danger" onClick={async () => (await confirm({ title: "أرشفة الصفحة؟", danger: true, confirmLabel: "أرشفة" })) && archivePage.mutate(cp.id)}><Archive className="h-4 w-4" /></Button>}
          </Card>
        )}
        {page.isLoading ? <PageLoader /> : (
          <SortableList items={sections} onReorder={(it) => { setSections(it); reorder.mutate(it.map((x) => x.id)); }} render={(s, handle) => (
            <Card className={cn("flex items-center gap-3 p-3", (!s.is_visible || s.archived) && "opacity-60")}>
              {handle}
              <div className="flex-1"><div className="font-medium text-brand-green">{s.admin_label}</div><div className="text-[12px] text-gray-500">{s.type_label}{s.content?.title ? ` — ${s.content.title}` : ""}</div></div>
              {s.archived && <Badge>مؤرشف</Badge>}
              <Button size="sm" variant="ghost" title={s.is_visible ? "إخفاء" : "إظهار"} onClick={() => updateSection.mutate({ id: s.id, is_visible: !s.is_visible })}>{s.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditSection(structuredClone(s))}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" title={s.archived ? "إلغاء الأرشفة" : "أرشفة"} onClick={() => updateSection.mutate({ id: s.id, archived: !s.archived } as never)}>{s.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
              <Button size="sm" variant="ghost" className="hover:text-danger" onClick={async () => (await confirm({ title: "حذف القسم نهائياً؟", text: "يمكنك بدلاً من ذلك أرشفته أو إخفاؤه.", danger: true, confirmLabel: "حذف" })) && removeSection.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          )} />
        )}
        <Card className="mt-4 flex flex-wrap items-center gap-3 p-4">
          <span className="text-[14px] text-gray-700">إضافة قسم:</span>
          <Select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-60"><option value="">اختر نوع القسم</option>{pages.data?.section_types.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}</Select>
          <Button size="sm" disabled={!newType} loading={addSection.isPending} onClick={() => addSection.mutate()}><Plus className="h-4 w-4" /> إضافة</Button>
        </Card>
      </div>

      <Modal open={!!editSection} onOpenChange={(o) => !o && setEditSection(null)} title={`تعديل القسم: ${editSection?.type_label ?? ""}`} size="xl"
        footer={<><Button variant="secondary" onClick={() => setEditSection(null)}>إلغاء</Button><Button loading={updateSection.isPending} onClick={() => editSection && updateSection.mutate({ id: editSection.id, admin_label: editSection.admin_label, content: editSection.content, is_visible: editSection.is_visible })}>حفظ كمسودة</Button></>}>
        {editSection && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم القسم في لوحة التحكم"><Input value={editSection.admin_label} onChange={(e) => setEditSection({ ...editSection, admin_label: e.target.value })} /></Field>
              <div className="flex items-end pb-2"><Switch checked={editSection.is_visible} onChange={(v) => setEditSection({ ...editSection, is_visible: v })} label="القسم ظاهر" /></div>
            </div>
            {editSection.type === "hero" && <p className="rounded-[3px] bg-gold-50 p-3 text-[13px] text-gold-700">محتوى الشرائح (الصور والنصوص والأزرار) يُدار من تبويب «غلاف الموقع».</p>}
            {editSection.type === "brands" && <p className="rounded-[3px] bg-gold-50 p-3 text-[13px] text-gold-700">البراندات المعروضة وترتيبها تُدار من صفحة «البراندات» في الكتالوج (خيار «يظهر في الموقع العام»).</p>}
            {editSection.type === "projects" && <p className="rounded-[3px] bg-gold-50 p-3 text-[13px] text-gold-700">المشاريع تُدار من تبويب «المشاريع».</p>}
            <SectionEditor type={editSection.type} content={editSection.content} media={editSection.media ?? {}} onChange={(c, m) => setEditSection({ ...editSection, content: c, media: m })} />
          </div>
        )}
      </Modal>

      <Modal open={!!pageEdit} onOpenChange={(o) => !o && setPageEdit(null)} title={pageEdit?.id ? "إعدادات الصفحة" : "صفحة جديدة"} size="lg"
        footer={<><Button variant="secondary" onClick={() => setPageEdit(null)}>إلغاء</Button><Button loading={savePage.isPending} onClick={() => savePage.mutate()}>حفظ</Button></>}>
        {pageEdit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان الصفحة" required><Input value={pageEdit.title ?? ""} onChange={(e) => setPageEdit({ ...pageEdit, title: e.target.value })} /></Field>
            <Field label="الرابط (Slug)" hint="أحرف إنجليزية صغيرة وأرقام وشرطات"><Input value={pageEdit.slug ?? ""} disabled={pageEdit.is_system} onChange={(e) => setPageEdit({ ...pageEdit, slug: e.target.value })} dir="ltr" /></Field>
            <Field label="حالة النشر"><Select value={pageEdit.status} disabled={pageEdit.slug === "home"} onChange={(e) => setPageEdit({ ...pageEdit, status: e.target.value })}><option value="draft">مسودة</option><option value="published">منشورة</option><option value="unpublished">غير منشورة</option></Select></Field>
            <div className="flex items-end pb-2"><Switch checked={pageEdit.show_in_menu ?? true} onChange={(v) => setPageEdit({ ...pageEdit, show_in_menu: v })} label="تظهر في القائمة الرئيسية" /></div>
            <div className="sm:col-span-2 mt-2 border-t border-gray-100 pt-4 text-[14px] font-semibold text-brand-green">تحسين محركات البحث (SEO)</div>
            <Field label="Meta Title" hint="حتى 70 حرفاً"><Input maxLength={70} value={pageEdit.seo?.meta_title ?? ""} onChange={(e) => setPageEdit({ ...pageEdit, seo: { ...pageEdit.seo!, meta_title: e.target.value } })} /></Field>
            <div className="flex items-end pb-2"><Switch checked={pageEdit.seo?.indexable ?? true} onChange={(v) => setPageEdit({ ...pageEdit, seo: { ...pageEdit.seo!, indexable: v } })} label="السماح بالفهرسة في محركات البحث" /></div>
            <Field label="Meta Description" hint="حتى 170 حرفاً" className="sm:col-span-2"><Textarea maxLength={170} rows={2} value={pageEdit.seo?.meta_description ?? ""} onChange={(e) => setPageEdit({ ...pageEdit, seo: { ...pageEdit.seo!, meta_description: e.target.value } })} /></Field>
            <div className="max-w-xs"><ImageField label="صورة المشاركة (Open Graph)" value={pageEdit.seo?.og_image} onChange={(m) => setPageEdit({ ...pageEdit, seo: { ...pageEdit.seo!, og_image: m } })} folder="pages" /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------------------------------- Projects ---------------------------------- */
function ProjectsTab({ onChanged }: { onChanged: () => void }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const q = useQuery({ queryKey: ["cms-projects"], queryFn: async () => (await get<{ data: Project[] }>("/admin/website/projects")).data });
  const [items, setItems] = useState<Project[]>([]);
  useEffect(() => setItems(q.data ?? []), [q.data]);
  const [edit, setEdit] = useState<(Partial<Project> & { galleryMedia?: Media[] }) | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["cms-projects"] }); onChanged(); };

  const save = useMutation({
    mutationFn: () => {
      const e = edit!;
      const b = { title: e.title, client: e.client || null, location: e.location || null, project_type: e.project_type || null, year: e.year || null, summary: e.summary || null, description: e.description || null, cover_id: e.cover?.id ?? null, is_visible: e.is_visible ?? true, is_featured: e.is_featured ?? false, gallery: (e.galleryMedia ?? []).map((m) => ({ media_id: m.id })) };
      return e.id ? put(`/admin/website/projects/${e.id}`, b) : post("/admin/website/projects", b);
    },
    onSuccess: () => { toast.success("تم الحفظ كمسودة."); setEdit(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const reorder = useMutation({ mutationFn: (ids: number[]) => post("/admin/website/projects/reorder", { ids }), onSuccess: () => { toast.success("تم حفظ الترتيب."); onChanged(); } });
  const archive = useMutation({ mutationFn: (id: number) => del(`/admin/website/projects/${id}`), onSuccess: refresh });

  if (q.isLoading) return <PageLoader />;
  return (
    <>
      {dialog}
      <div className="mb-4 flex justify-end"><Button onClick={() => setEdit({ is_visible: true, is_featured: true, galleryMedia: [] })}><Plus className="h-4 w-4" /> مشروع جديد</Button></div>
      <SortableList items={items} onReorder={(it) => { setItems(it); reorder.mutate(it.map((x) => x.id)); }} render={(p, handle) => (
        <Card className={cn("flex items-center gap-4 p-3", !p.is_visible && "opacity-60")}>
          {handle}
          <Img media={p.cover} variant="thumb" className="h-16 w-24 rounded-[3px] object-cover" />
          <div className="flex-1"><div className="font-medium text-brand-green">{p.title}</div><div className="text-[12px] text-gray-500">{[p.project_type, p.location, p.year].filter(Boolean).join(" · ")} · {p.gallery.length} صور</div></div>
          {p.is_featured && <Badge tone="gold">مميز</Badge>}
          {!p.is_visible && <Badge>مخفي</Badge>}
          <Button size="sm" variant="ghost" onClick={() => setEdit({ ...p, galleryMedia: p.gallery.map((g) => g.image) })}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" className="hover:text-danger" onClick={async () => (await confirm({ title: "أرشفة المشروع؟", danger: true, confirmLabel: "أرشفة" })) && archive.mutate(p.id)}><Archive className="h-4 w-4" /></Button>
        </Card>
      )} />
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "تعديل المشروع" : "مشروع جديد"} size="xl"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>إلغاء</Button><Button loading={save.isPending} onClick={() => save.mutate()}>حفظ كمسودة</Button></>}>
        {edit && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2 content-start">
              <Field label="اسم المشروع" required className="sm:col-span-2"><Input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
              <Field label="نوع المشروع"><Input value={edit.project_type ?? ""} onChange={(e) => setEdit({ ...edit, project_type: e.target.value })} placeholder="سكني، فندقي..." /></Field>
              <Field label="الموقع"><Input value={edit.location ?? ""} onChange={(e) => setEdit({ ...edit, location: e.target.value })} /></Field>
              <Field label="العميل"><Input value={edit.client ?? ""} onChange={(e) => setEdit({ ...edit, client: e.target.value })} /></Field>
              <Field label="السنة"><Input type="number" value={edit.year ?? ""} onChange={(e) => setEdit({ ...edit, year: e.target.value ? Number(e.target.value) : null })} /></Field>
              <Field label="ملخص" className="sm:col-span-2"><Textarea rows={2} value={edit.summary ?? ""} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} /></Field>
              <Field label="الوصف" className="sm:col-span-2"><Textarea rows={5} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <Switch checked={edit.is_visible ?? true} onChange={(v) => setEdit({ ...edit, is_visible: v })} label="ظاهر للزوار" />
              <Switch checked={edit.is_featured ?? false} onChange={(v) => setEdit({ ...edit, is_featured: v })} label="مشروع مميز (يظهر في الرئيسية)" />
            </div>
            <div className="space-y-5">
              <ImageField label="صورة الغلاف" value={edit.cover} onChange={(m) => setEdit({ ...edit, cover: m })} folder="projects" />
              <div><div className="mb-1.5 text-[13px] font-medium text-gray-700">صور المشروع</div><GalleryField value={edit.galleryMedia ?? []} onChange={(m) => setEdit({ ...edit, galleryMedia: m })} folder="projects" /></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ---------------------------------- Display settings ---------------------------------- */
function DisplaySettingsTab({ onChanged }: { onChanged: () => void }) {
  const q = useQuery({ queryKey: ["cms-settings"], queryFn: async () => (await get<{ data: Record<string, Json> }>("/admin/website/settings")).data });
  const [s, setS] = useState<Record<string, Json>>({});
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  const save = useMutation({ mutationFn: () => put("/admin/website/settings", s), onSuccess: () => { toast.success("تم الحفظ كمسودة."); onChanged(); }, onError: (e) => toast.error(errorMessage(e)) });
  if (q.isLoading) return <PageLoader />;
  return (
    <Card className="max-w-2xl p-6 space-y-5">
      <Switch checked={s.hero_enabled ?? true} onChange={(v) => setS({ ...s, hero_enabled: v })} label="إظهار غلاف الصفحة الرئيسية" />
      <Field label="مدة الانتقال الافتراضية بين الشرائح (ملي ثانية)"><Input type="number" min={2000} max={20000} step={500} value={s.hero_interval_ms ?? 6000} onChange={(e) => setS({ ...s, hero_interval_ms: Number(e.target.value) })} /></Field>
      <Field label="شريط إعلان أعلى الموقع (اتركه فارغاً للإخفاء)"><Input value={s.announcement ?? ""} onChange={(e) => setS({ ...s, announcement: e.target.value })} /></Field>
      <Field label="نص التذييل"><Textarea rows={2} value={s.footer_text ?? ""} onChange={(e) => setS({ ...s, footer_text: e.target.value })} /></Field>
      <p className="text-[12px] text-gray-500">معلومات التواصل والعنوان وروابط التواصل الاجتماعي تُدار من صفحة «الإعدادات ← معلومات الشركة».</p>
      <Button loading={save.isPending} onClick={() => save.mutate()}>حفظ كمسودة</Button>
    </Card>
  );
}

/* ---------------------------------- Revisions ---------------------------------- */
function RevisionsTab() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const q = useQuery({ queryKey: ["cms-revisions"], queryFn: async () => (await get<{ data: { id: number; version: number; note: string | null; is_current: boolean; published_by: string | null; restored_from_id: number | null; created_at: string }[] }>("/admin/website/revisions")).data });
  const restore = useMutation({
    mutationFn: (id: number) => post<{ message: string }>(`/admin/website/revisions/${id}/restore`),
    onSuccess: (r) => { toast.success(r.message); qc.invalidateQueries(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (q.isLoading) return <PageLoader />;
  return (
    <Card className="divide-y divide-gray-100">
      {dialog}
      {q.data?.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold tabular", r.is_current ? "bg-gold-gradient text-white" : "bg-gray-50 text-gray-500")}>v{r.version}</span>
          <div className="flex-1"><div className="text-[14px] font-medium text-brand-green">{r.note || "نشر تغييرات الموقع"}</div><div className="text-[12px] text-gray-500">{date(r.created_at, true)} · {r.published_by}</div></div>
          {r.is_current ? <Badge tone="green">النسخة الحالية</Badge> : (
            <Button size="sm" variant="secondary" loading={restore.isPending && restore.variables === r.id} onClick={async () => (await confirm({ title: `استعادة الإصدار v${r.version}؟`, text: "سيُعاد الموقع العام إلى هذه النسخة فوراً، وستُستبدل المسودة الحالية بمحتواها. تبقى جميع الإصدارات محفوظة في السجل.", confirmLabel: "استعادة ونشر" })) && restore.mutate(r.id)}>
              <RotateCcw className="h-4 w-4" /> استعادة
            </Button>
          )}
        </div>
      ))}
    </Card>
  );
}
