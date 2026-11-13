"use client";

import { Plus, Trash2 } from "lucide-react";
import { ImageField } from "@/components/app/media";
import { Button, Field, Input, Select, Switch, Textarea } from "@/components/ui";
import type { Media } from "@/lib/types";
import type { Json } from "@/lib/types";

/** Client mirror of backend App\Services\Cms\SectionSchema (backend remains the validator). */
type F =
  | { k: string; t: "text" | "textarea" | "url"; l: string; rows?: number }
  | { k: string; t: "number"; l: string; min?: number; max?: number }
  | { k: string; t: "bool"; l: string }
  | { k: string; t: "select"; l: string; o: [string, string][] }
  | { k: string; t: "image"; l: string }
  | { k: string; t: "items"; l: string; fields: F[]; max: number };

const COMMON: F[] = [
  { k: "eyebrow", t: "text", l: "عنوان صغير (Overline)" },
  { k: "title", t: "text", l: "العنوان" },
  { k: "subtitle", t: "textarea", l: "الوصف", rows: 2 },
  { k: "background", t: "select", l: "الخلفية", o: [["white", "أبيض"], ["soft", "رمادي فاتح جداً"], ["sand", "ذهبي فاتح"]] },
];
const CTA: F[] = [{ k: "cta_label", t: "text", l: "نص الزر" }, { k: "cta_url", t: "url", l: "رابط الزر" }];

export const SECTION_FIELDS: Record<string, F[]> = {
  scroll_story: [
    { k: "video_id", t: "image", l: "فيديو الجولة (اختياري، MP4) — عند رفعه يُعرض بالتمرير إطاراً بإطار بدل الصور" },
    { k: "scenes", t: "items", l: "المشاهد (صورة لكل غرفة/مساحة — تقترب الكاميرا وتُضاء ثم تنتقل للتالية)", max: 8, fields: [{ k: "image_id", t: "image", l: "الصورة" }, { k: "title", t: "text", l: "العنوان" }, { k: "text", t: "text", l: "النص" }] },
    { k: "final_title", t: "text", l: "العنوان الختامي" },
    { k: "final_text", t: "textarea", l: "النص الختامي", rows: 2 },
    { k: "cta_label", t: "text", l: "نص الزر الرئيسي" }, { k: "cta_url", t: "url", l: "رابط الزر الرئيسي" },
    { k: "secondary_cta_label", t: "text", l: "نص الزر الثانوي" }, { k: "secondary_cta_url", t: "url", l: "رابط الزر الثانوي" },
  ],
  light_show: [
    { k: "eyebrow", t: "text", l: "عنوان صغير أعلى المشهد" },
    { k: "title", t: "text", l: "العنوان الافتتاحي (قبل الإضاءة)" },
    { k: "stages", t: "items", l: "مراحل الإضاءة (تظهر تباعاً أثناء التمرير)", max: 4, fields: [{ k: "title", t: "text", l: "العنوان" }, { k: "text", t: "text", l: "النص" }] },
    { k: "final_title", t: "text", l: "العنوان النهائي (بعد اكتمال الإضاءة)" },
    { k: "final_text", t: "textarea", l: "النص النهائي", rows: 2 },
    { k: "cta_label", t: "text", l: "نص الزر الرئيسي" }, { k: "cta_url", t: "url", l: "رابط الزر الرئيسي" },
    { k: "secondary_cta_label", t: "text", l: "نص الزر الثانوي" }, { k: "secondary_cta_url", t: "url", l: "رابط الزر الثانوي" },
  ],
  hero: [
    { k: "autoplay", t: "bool", l: "تشغيل تلقائي للشرائح" },
    { k: "interval_ms", t: "number", l: "مدة الانتقال بين الشرائح (ملي ثانية)", min: 2000, max: 20000 },
    { k: "height", t: "select", l: "ارتفاع الغلاف", o: [["full", "ملء الشاشة"], ["large", "كبير"], ["medium", "متوسط"]] },
  ],
  about: [...COMMON, { k: "body", t: "textarea", l: "النص", rows: 6 }, { k: "image_id", t: "image", l: "الصورة" },
    { k: "highlights", t: "items", l: "نقاط مميزة", max: 6, fields: [{ k: "title", t: "text", l: "العنوان" }, { k: "text", t: "text", l: "الوصف" }] }, ...CTA],
  brands: [...COMMON, { k: "show_description", t: "bool", l: "إظهار وصف البراند" }],
  categories: [...COMMON, { k: "items", t: "items", l: "العناصر", max: 12, fields: [{ k: "title", t: "text", l: "العنوان" }, { k: "text", t: "text", l: "الوصف" }, { k: "image_id", t: "image", l: "صورة (اختياري)" }] }],
  featured_collections: [...COMMON, { k: "items", t: "items", l: "المجموعات", max: 8, fields: [{ k: "title", t: "text", l: "العنوان" }, { k: "text", t: "text", l: "الوصف" }, { k: "image_id", t: "image", l: "الصورة" }] }],
  projects: [...COMMON, { k: "limit", t: "number", l: "عدد المشاريع", min: 1, max: 24 }, { k: "only_featured", t: "bool", l: "المشاريع المميزة فقط" }, ...CTA],
  why_us: [...COMMON, { k: "items", t: "items", l: "المزايا", max: 8, fields: [
    { k: "icon", t: "select", l: "الأيقونة", o: [["gem", "جوهرة"], ["ruler", "مسطرة"], ["shield", "درع"], ["truck", "شاحنة"], ["eye", "عين"], ["target", "هدف"], ["sun", "شمس"], ["lamp", "مصباح"], ["sparkles", "لمعان"]] },
    { k: "title", t: "text", l: "العنوان" }, { k: "text", t: "text", l: "الوصف" }] }],
  stats: [...COMMON, { k: "items", t: "items", l: "الأرقام", max: 6, fields: [{ k: "value", t: "text", l: "الرقم" }, { k: "label", t: "text", l: "الوصف" }] }],
  contact: [...COMMON, { k: "body", t: "textarea", l: "النص" }, { k: "show_form", t: "bool", l: "إظهار نموذج التواصل" }, { k: "show_map", t: "bool", l: "إظهار الخريطة" }],
  rich_text: [...COMMON, { k: "body", t: "textarea", l: "النص (افصل الفقرات بسطر فارغ)", rows: 10 }],
  image_text: [...COMMON, { k: "body", t: "textarea", l: "النص", rows: 6 }, { k: "image_id", t: "image", l: "الصورة" }, { k: "image_side", t: "select", l: "موضع الصورة", o: [["end", "يسار"], ["start", "يمين"]] }, ...CTA],
  cta: [...COMMON, ...CTA],
};

type Content = Record<string, Json>;

export function SectionEditor({ type, content, media, onChange }: { type: string; content: Content; media: Record<string, Media>; onChange: (c: Content, media: Record<string, Media>) => void }) {
  const fields = SECTION_FIELDS[type] ?? COMMON;
  return <FieldsEditor fields={fields} value={content} media={media} onChange={onChange} />;
}

function FieldsEditor({ fields, value, media, onChange }: { fields: F[]; value: Content; media: Record<string, Media>; onChange: (c: Content, media: Record<string, Media>) => void }) {
  const set = (k: string, v: unknown, m = media) => onChange({ ...value, [k]: v }, m);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const v = value[f.k];
        switch (f.t) {
          case "text": case "url":
            return <Field key={f.k} label={f.l}><Input value={v ?? ""} onChange={(e) => set(f.k, e.target.value)} dir={f.t === "url" ? "ltr" : undefined} /></Field>;
          case "textarea":
            return <Field key={f.k} label={f.l} className="sm:col-span-2"><Textarea rows={f.rows ?? 3} value={v ?? ""} onChange={(e) => set(f.k, e.target.value)} /></Field>;
          case "number":
            return <Field key={f.k} label={f.l}><Input type="number" min={f.min} max={f.max} value={v ?? ""} onChange={(e) => set(f.k, e.target.value === "" ? undefined : Number(e.target.value))} /></Field>;
          case "bool":
            return <div key={f.k} className="flex items-end pb-2"><Switch checked={!!v} onChange={(x) => set(f.k, x)} label={f.l} /></div>;
          case "select":
            return <Field key={f.k} label={f.l}><Select value={v ?? ""} onChange={(e) => set(f.k, e.target.value)}><option value="">—</option>{f.o.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</Select></Field>;
          case "image":
            return (
              <div key={f.k} className="sm:col-span-2 max-w-sm">
                <ImageField label={f.l} value={v ? media[v] ?? null : null} folder="pages" onChange={(m) => set(f.k, m?.id ?? null, m ? { ...media, [m.id]: m } : media)} />
              </div>
            );
          case "items": {
            const items: Content[] = Array.isArray(v) ? v : [];
            return (
              <div key={f.k} className="sm:col-span-2 rounded-[3px] border border-gray-100 bg-gray-25 p-4">
                <div className="mb-3 flex items-center justify-between"><span className="text-[13px] font-medium text-gray-700">{f.l} ({items.length}/{f.max})</span>
                  <Button size="sm" variant="secondary" disabled={items.length >= f.max} onClick={() => set(f.k, [...items, {}])}><Plus className="h-4 w-4" /> إضافة</Button></div>
                <div className="space-y-3">
                  {items.map((it, i) => (
                    <div key={i} className="relative rounded-[3px] border border-gray-100 bg-white p-4 pe-12">
                      <button onClick={() => set(f.k, items.filter((_, j) => j !== i))} className="absolute top-3 end-3 rounded-[3px] p-1.5 text-gray-400 hover:text-danger cursor-pointer" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                      <FieldsEditor fields={f.fields} value={it} media={media} onChange={(c, m) => set(f.k, items.map((x, j) => (j === i ? c : x)), m)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        }
      })}
    </div>
  );
}
