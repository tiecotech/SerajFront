"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, GripVertical, ImagePlus, Search, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, Img, Input, Modal, Pagination, Spinner } from "@/components/ui";
import { api, errorMessage, get } from "@/lib/api";
import type { Media, Paginated } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function uploadFiles(files: FileList | File[], folder: string): Promise<Media[]> {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("files[]", f));
  fd.append("folder", folder);
  const res = await api<{ data: Media[]; message: string }>("/admin/media", { method: "POST", body: fd });
  return res.data;
}

export function UploadButton({ folder, onUploaded, multiple = true, label = "رفع صور", variant = "secondary" as const }: { folder: string; onUploaded: (m: Media[]) => void; multiple?: boolean; label?: string; variant?: "primary" | "secondary" }) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  return (
    <>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple={multiple} className="hidden" onChange={async (e) => {
        if (!e.target.files?.length) return;
        setLoading(true);
        try {
          const m = await uploadFiles(e.target.files, folder);
          toast.success("تم رفع الصور وتحسينها.");
          onUploaded(m);
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setLoading(false);
          e.target.value = "";
        }
      }} />
      <Button type="button" variant={variant} loading={loading} onClick={() => ref.current?.click()}><Upload className="h-4 w-4" /> {label}</Button>
    </>
  );
}

/** Pick one or many images from the central Media Library (with in-place upload). */
export function MediaPicker({ open, onOpenChange, onSelect, multiple = false, folder = "general" }: { open: boolean; onOpenChange: (o: boolean) => void; onSelect: (m: Media[]) => void; multiple?: boolean; folder?: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Media[]>([]);
  const list = useQuery({ queryKey: ["media", q, page], queryFn: () => get<Paginated<Media>>("/admin/media", { q, page, per_page: 24 }), enabled: open, placeholderData: keepPreviousData });

  const toggle = (m: Media) => {
    if (!multiple) return setSelected([m]);
    setSelected((s) => (s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : [...s, m]));
  };

  return (
    <Modal open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSelected([]); }} title="مكتبة الوسائط" size="xl"
      footer={<>
        <span className="me-auto text-[13px] text-gray-500">{selected.length ? `تم اختيار ${selected.length}` : "اختر صورة"}</span>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>إلغاء</Button>
        <Button disabled={!selected.length} onClick={() => { onSelect(selected); setSelected([]); onOpenChange(false); }}>اختيار</Button>
      </>}>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1"><Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ابحث باسم الملف أو الوصف" className="ps-10" /></div>
        <UploadButton folder={folder} onUploaded={(m) => { qc.invalidateQueries({ queryKey: ["media"] }); setSelected((s) => (multiple ? [...s, ...m] : [m[0]])); }} variant="primary" />
      </div>
      {list.isLoading ? <div className="flex justify-center py-16"><Spinner /></div> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {list.data?.data.map((m) => {
            const on = selected.some((s) => s.id === m.id);
            return (
              <button key={m.id} type="button" onClick={() => toggle(m)} className={cn("relative aspect-square overflow-hidden rounded-[3px] border-2 bg-gray-50 cursor-pointer", on ? "border-gold-500" : "border-transparent hover:border-gold-200")}>
                <Img media={m} variant="thumb" className="h-full w-full object-cover" />
                {on && <span className="absolute top-1.5 end-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold-gradient text-white"><Check className="h-4 w-4" /></span>}
              </button>
            );
          })}
        </div>
      )}
      {list.data && <Pagination page={page} lastPage={list.data.meta.last_page} onChange={setPage} />}
    </Modal>
  );
}

/** Single image field (logo, cover, hero image...). */
export function ImageField({ value, onChange, folder, aspect = "aspect-[16/9]", label, contain = false }: { value: Media | null | undefined; onChange: (m: Media | null) => void; folder: string; aspect?: string; label?: string; contain?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {label && <div className="mb-1.5 text-[13px] font-medium text-gray-700">{label}</div>}
      <div className={cn("group relative overflow-hidden rounded-[3px] border border-dashed border-gray-200 bg-gray-25", aspect)}>
        {value ? (
          <>
            <Img media={value} variant="md" className={cn("h-full w-full", contain ? "object-contain p-4" : "object-cover")} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Button size="sm" variant="secondary" type="button" onClick={() => setOpen(true)}>استبدال</Button>
              <Button size="sm" variant="danger" type="button" onClick={() => onChange(null)}><X className="h-4 w-4" /> إزالة</Button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 hover:text-gold-600 cursor-pointer">
            <ImagePlus className="h-8 w-8" /><span className="text-[13px]">اختيار صورة</span>
          </button>
        )}
      </div>
      <MediaPicker open={open} onOpenChange={setOpen} folder={folder} onSelect={(m) => onChange(m[0])} />
    </div>
  );
}

function SortableThumb({ m, onRemove, primary }: { m: Media; onRemove: () => void; primary: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group relative aspect-square overflow-hidden rounded-[3px] border bg-gray-50", primary ? "border-gold-500" : "border-gray-100", isDragging && "z-10 shadow-lg")}>
      <Img media={m} variant="thumb" className="h-full w-full object-cover" />
      <button type="button" {...attributes} {...listeners} className="absolute top-1.5 start-1.5 rounded-[3px] bg-white/90 p-1 text-gray-500 cursor-grab" aria-label="سحب لإعادة الترتيب"><GripVertical className="h-4 w-4" /></button>
      <button type="button" onClick={onRemove} className="absolute top-1.5 end-1.5 rounded-[3px] bg-white/90 p-1 text-danger opacity-0 group-hover:opacity-100 cursor-pointer" aria-label="إزالة"><X className="h-4 w-4" /></button>
      {primary && <span className="absolute inset-x-0 bottom-0 bg-gold-gradient py-0.5 text-center text-[11px] text-white">الصورة الرئيسية</span>}
    </div>
  );
}

/** Ordered multi-image gallery with drag & drop. First image = primary. */
export function GalleryField({ value, onChange, folder }: { value: Media[]; onChange: (m: Media[]) => void; folder: string }) {
  const [open, setOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = value.findIndex((m) => m.id === e.active.id);
    const to = value.findIndex((m) => m.id === e.over!.id);
    onChange(arrayMove(value, from, to));
  };
  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map((m) => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {value.map((m, i) => <SortableThumb key={m.id} m={m} primary={i === 0} onRemove={() => onChange(value.filter((x) => x.id !== m.id))} />)}
            <button type="button" onClick={() => setOpen(true)} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[3px] border border-dashed border-gray-200 text-gray-400 hover:border-gold-300 hover:text-gold-600 cursor-pointer">
              <ImagePlus className="h-6 w-6" /><span className="text-[12px]">إضافة</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>
      <MediaPicker open={open} onOpenChange={setOpen} multiple folder={folder} onSelect={(m) => onChange([...value, ...m.filter((x) => !value.some((v) => v.id === x.id))])} />
    </div>
  );
}

/** Generic vertical drag & drop list (sections, slides, categories...). */
export function SortableList<T extends { id: number }>({ items, onReorder, render }: { items: T[]; onReorder: (items: T[]) => void; render: (item: T, handle: React.ReactNode) => React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
      if (!e.over || e.active.id === e.over.id) return;
      const from = items.findIndex((x) => x.id === e.active.id);
      const to = items.findIndex((x) => x.id === e.over!.id);
      onReorder(arrayMove(items, from, to));
    }}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">{items.map((it) => <SortableRow key={it.id} id={it.id}>{(handle) => render(it, handle)}</SortableRow>)}</div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: number; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = <button type="button" {...attributes} {...listeners} className="cursor-grab rounded-[3px] p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gold-600" aria-label="سحب لإعادة الترتيب"><GripVertical className="h-5 w-5" /></button>;
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "relative z-10 shadow-lg")}>{children(handle)}</div>;
}
