"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { GalleryField, SortableList } from "@/components/app/media";
import { Button, Card, ErrorState, Field, Input, PageHeader, PageLoader, Select, Switch, Textarea } from "@/components/ui";
import { ApiError, errorMessage, get, post, put } from "@/lib/api";
import type { Brand, Category, Media, Product } from "@/lib/types";

type Spec = { id: number; group: string; label: string; value: string };
type Form = {
  sku: string; name: string; name_en: string; short_description: string; description: string; brand_id: string; category_id: string;
  price: string; unit: string; availability: string; is_active: boolean; is_featured: boolean; images: Media[]; specs: Spec[];
};

const SPEC_TEMPLATE: [string, string][] = [
  ["كهربائية", "القدرة"], ["كهربائية", "الجهد"], ["ضوئية", "درجة اللون"], ["ضوئية", "التدفق الضوئي"], ["ضوئية", "مؤشر تجسيد اللون"], ["ضوئية", "زاوية الشعاع"],
  ["ميكانيكية", "الأبعاد"], ["ميكانيكية", "درجة الحماية"], ["ميكانيكية", "الخامة"], ["ميكانيكية", "اللون"], ["عام", "الضمان"],
];
let tmpId = 1;
const empty: Form = { sku: "", name: "", name_en: "", short_description: "", description: "", brand_id: "", category_id: "", price: "", unit: "قطعة", availability: "available", is_active: true, is_featured: false, images: [], specs: [] };

export default function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const product = useQuery({ queryKey: ["admin-product", id], queryFn: async () => (await get<{ data: Product }>(`/admin/products/${id}`)).data, enabled: !isNew });
  const cats = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await get<{ data: Category[] }>("/admin/categories")).data });
  const brands = useQuery({ queryKey: ["admin-brands"], queryFn: async () => (await get<{ data: Brand[] }>("/admin/brands")).data });

  useEffect(() => {
    const p = product.data;
    if (!p) return;
    setForm({
      sku: p.sku, name: p.name, name_en: p.name_en ?? "", short_description: p.short_description ?? "", description: p.description ?? "",
      brand_id: String(p.brand?.id ?? ""), category_id: String(p.category?.id ?? ""), price: p.price, unit: p.unit, availability: p.availability,
      is_active: p.is_active, is_featured: p.is_featured, images: p.images?.map((i) => i.image) ?? [],
      specs: (p.specifications ?? []).map((s) => ({ id: tmpId++, group: s.group ?? "", label: s.label, value: s.value })),
    });
  }, [product.data]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        sku: form.sku, name: form.name, name_en: form.name_en || null, short_description: form.short_description || null, description: form.description || null,
        brand_id: form.brand_id ? Number(form.brand_id) : null, category_id: form.category_id ? Number(form.category_id) : null,
        price: form.price, unit: form.unit, availability: form.availability, is_active: form.is_active, is_featured: form.is_featured,
        image_ids: form.images.map((m) => m.id),
        specifications: form.specs.filter((s) => s.label.trim() && s.value.trim()).map((s) => ({ group: s.group || null, label: s.label, value: s.value })),
      };
      return isNew ? post<{ data: Product }>("/admin/products", body) : put<{ data: Product }>(`/admin/products/${id}`, body);
    },
    onSuccess: (r) => {
      toast.success("تم حفظ المنتج.");
      setErrors({});
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      if (isNew) router.replace(`/app/admin/products/${r.data.id}`);
      else qc.invalidateQueries({ queryKey: ["admin-product", id] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.errors) setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])));
      toast.error(errorMessage(e));
    },
  });

  if (!isNew && product.isLoading) return <PageLoader />;
  if (!isNew && product.isError) return <ErrorState message={errorMessage(product.error)} />;
  const s = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <PageHeader title={isNew ? "منتج جديد" : form.name || "تعديل منتج"} crumbs={[{ label: "المنتجات", href: "/app/admin/products" }, { label: isNew ? "جديد" : form.sku }]} actions={<Button onClick={() => save.mutate()} loading={save.isPending}><Save className="h-4 w-4" /> حفظ المنتج</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-brand-green">البيانات الأساسية</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم المنتج" required error={errors.name}><Input value={form.name} onChange={(e) => s("name", e.target.value)} /></Field>
              <Field label="الاسم بالإنجليزية" error={errors.name_en}><Input value={form.name_en} onChange={(e) => s("name_en", e.target.value)} dir="ltr" /></Field>
              <Field label="كود المنتج SKU" required error={errors.sku}><Input value={form.sku} onChange={(e) => s("sku", e.target.value)} dir="ltr" /></Field>
              <Field label="وحدة البيع"><Input value={form.unit} onChange={(e) => s("unit", e.target.value)} /></Field>
              <Field label="وصف مختصر" className="sm:col-span-2" error={errors.short_description}><Input value={form.short_description} onChange={(e) => s("short_description", e.target.value)} maxLength={500} /></Field>
              <Field label="الوصف التفصيلي" className="sm:col-span-2"><Textarea rows={5} value={form.description} onChange={(e) => s("description", e.target.value)} /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-1 text-[15px] font-semibold text-brand-green">صور المنتج</h2>
            <p className="mb-4 text-[12px] text-gray-500">اسحب لإعادة الترتيب — الصورة الأولى هي الرئيسية. تُستخدم الصور أيضاً لفهرسة البحث بالصورة تلقائياً.</p>
            <GalleryField value={form.images} onChange={(m) => s("images", m)} folder="products" />
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-brand-green">المواصفات الفنية</h2>
              <div className="flex gap-2">
                {form.specs.length === 0 && <Button size="sm" variant="secondary" onClick={() => s("specs", SPEC_TEMPLATE.map(([g, l]) => ({ id: tmpId++, group: g, label: l, value: "" })))}>استخدام قالب مواصفات الإنارة</Button>}
                <Button size="sm" variant="outline-gold" onClick={() => s("specs", [...form.specs, { id: tmpId++, group: "", label: "", value: "" }])}><Plus className="h-4 w-4" /> إضافة مواصفة</Button>
              </div>
            </div>
            {form.specs.length === 0 ? <p className="text-[13px] text-gray-400">لا توجد مواصفات بعد.</p> : (
              <SortableList items={form.specs} onReorder={(items) => s("specs", items)} render={(sp, handle) => (
                <div className="flex items-center gap-2 rounded-[3px] border border-gray-100 bg-white p-2">
                  {handle}
                  <Input value={sp.group} onChange={(e) => s("specs", form.specs.map((x) => (x.id === sp.id ? { ...x, group: e.target.value } : x)))} placeholder="المجموعة" className="h-9 w-32" />
                  <Input value={sp.label} onChange={(e) => s("specs", form.specs.map((x) => (x.id === sp.id ? { ...x, label: e.target.value } : x)))} placeholder="الخاصية (مثال: القدرة)" className="h-9 flex-1" />
                  <Input value={sp.value} onChange={(e) => s("specs", form.specs.map((x) => (x.id === sp.id ? { ...x, value: e.target.value } : x)))} placeholder="القيمة (مثال: 12W)" className="h-9 flex-1" dir="auto" />
                  <button onClick={() => s("specs", form.specs.filter((x) => x.id !== sp.id))} className="rounded-[3px] p-2 text-gray-400 hover:text-danger cursor-pointer" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                </div>
              )} />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-brand-green">السعر والتوفر</h2>
            <div className="space-y-4">
              <Field label="السعر" required error={errors.price} hint="يُخزن بدقة عشرية (منزلتان)"><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => s("price", e.target.value)} className="tabular" /></Field>
              <Field label="حالة التوفر" error={errors.availability}>
                <Select value={form.availability} onChange={(e) => s("availability", e.target.value)}><option value="available">متوفر</option><option value="out_of_stock">غير متوفر حالياً</option><option value="inactive">غير مفعّل</option></Select>
              </Field>
              <Switch checked={form.is_active} onChange={(v) => s("is_active", v)} label="مفعّل في الكتالوج" />
              <Switch checked={form.is_featured} onChange={(v) => s("is_featured", v)} label="منتج مميز" />
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-brand-green">التصنيف والبراند</h2>
            <div className="space-y-4">
              <Field label="التصنيف" error={errors.category_id}><Select value={form.category_id} onChange={(e) => s("category_id", e.target.value)}><option value="">—</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}</Select></Field>
              <Field label="البراند" error={errors.brand_id}><Select value={form.brand_id} onChange={(e) => s("brand_id", e.target.value)}><option value="">—</option>{brands.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
