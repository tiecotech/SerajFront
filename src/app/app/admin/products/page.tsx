"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, ButtonLink, Card, EmptyState, Img, Input, PageHeader, Pagination, Select, useConfirm } from "@/components/ui";
import { del, errorMessage, get, patch, post } from "@/lib/api";
import type { Brand, Category, Paginated, Product } from "@/lib/types";
import { Price } from "@/components/app/Price";

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [f, setF] = useState({ q: "", category_id: "", brand_id: "", availability: "", archived: false, sort: "newest" });
  const [page, setPage] = useState(1);
  const cats = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await get<{ data: Category[] }>("/admin/categories")).data });
  const brands = useQuery({ queryKey: ["admin-brands"], queryFn: async () => (await get<{ data: Brand[] }>("/admin/brands")).data });
  const list = useQuery({ queryKey: ["admin-products", f, page], queryFn: () => get<Paginated<Product>>("/admin/products", { ...f, archived: f.archived ? 1 : undefined, page }), placeholderData: keepPreviousData });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-products"] });

  const avail = useMutation({ mutationFn: ({ id, availability }: { id: number; availability: string }) => patch(`/admin/products/${id}/availability`, { availability }), onSuccess: () => { toast.success("تم تحديث حالة التوفر."); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const archive = useMutation({ mutationFn: (id: number) => del<{ message: string }>(`/admin/products/${id}`), onSuccess: (r) => { toast.success(r.message); refresh(); } });
  const restore = useMutation({ mutationFn: (id: number) => post(`/admin/products/${id}/restore`), onSuccess: () => { toast.success("تمت استعادة المنتج."); refresh(); } });
  const set = (k: keyof typeof f, v: string | boolean) => { setF({ ...f, [k]: v }); setPage(1); };

  return (
    <>
      {dialog}
      <PageHeader title="إدارة المنتجات" subtitle="إضافة وتعديل المنتجات، الأسعار، المواصفات والصور وحالة التوفر." actions={<ButtonLink href="/app/admin/products/new"><Plus className="h-4 w-4" /> منتج جديد</ButtonLink>} />
      <div className="mb-5 grid gap-3 md:grid-cols-6">
        <div className="relative md:col-span-2"><Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="الاسم أو SKU" className="ps-10" /></div>
        <Select value={f.category_id} onChange={(e) => set("category_id", e.target.value)}><option value="">كل التصنيفات</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}</Select>
        <Select value={f.brand_id} onChange={(e) => set("brand_id", e.target.value)}><option value="">كل البراندات</option>{brands.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        <Select value={f.availability} onChange={(e) => set("availability", e.target.value)}><option value="">كل الحالات</option><option value="available">متوفر</option><option value="out_of_stock">غير متوفر</option><option value="inactive">غير مفعّل</option></Select>
        <Select value={f.archived ? "1" : ""} onChange={(e) => set("archived", e.target.value === "1")}><option value="">المنتجات النشطة</option><option value="1">الأرشيف</option></Select>
      </div>
      {list.data?.data.length === 0 ? <EmptyState title="لا توجد منتجات" action={<ButtonLink href="/app/admin/products/new">إضافة منتج</ButtonLink>} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-[14px]">
            <thead className="bg-gray-50 text-[12px] text-gray-500"><tr>{["المنتج", "SKU", "التصنيف", "البراند", "السعر", "التوفر", ""].map((h, i) => <th key={i} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {list.isLoading && <tr><td colSpan={7} className="p-4"><div className="skeleton h-40 rounded" /></td></tr>}
              {list.data?.data.map((p) => (
                <tr key={p.id} className="hover:bg-gold-50/30">
                  <td className="px-4 py-2.5"><div className="flex items-center gap-3"><Img media={p.image} variant="thumb" className="h-12 w-12 rounded-[3px] object-cover" /><Link href={`/app/admin/products/${p.id}`} className="font-medium text-brand-green hover:text-gold-700">{p.name}</Link></div></td>
                  <td className="px-4 py-2.5 text-gray-700" dir="ltr" style={{ textAlign: "right" }}>{p.sku}</td>
                  <td className="px-4 py-2.5 text-gray-500">{p.category?.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{p.brand?.name}</td>
                  <td className="px-4 py-2.5"><Price usd={p.price} syp={p.price_syp} size="sm" /></td>
                  <td className="px-4 py-2.5">
                    {p.deleted_at ? <Badge>مؤرشف</Badge> : (
                      <select value={p.availability} onChange={(e) => avail.mutate({ id: p.id, availability: e.target.value })} className={`rounded-[2px] border px-2.5 py-1 text-[12px] font-medium cursor-pointer ${p.availability === "available" ? "border-[#d6e8dc] bg-[#eef5f0] text-success" : "border-gray-100 bg-gray-50 text-gray-700"}`}>
                        <option value="available">متوفر</option><option value="out_of_stock">غير متوفر حالياً</option><option value="inactive">غير مفعّل</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      {p.deleted_at ? <Button size="sm" variant="secondary" onClick={() => restore.mutate(p.id)}><RotateCcw className="h-4 w-4" /> استعادة</Button> : <>
                        <Link href={`/app/admin/products/${p.id}`} className="rounded-[3px] p-2 text-gray-500 hover:bg-gray-50 hover:text-gold-600" title="تعديل"><Pencil className="h-4 w-4" /></Link>
                        <button className="rounded-[3px] p-2 text-gray-500 hover:bg-[#fbefee] hover:text-danger cursor-pointer" title="أرشفة" onClick={async () => (await confirm({ title: "أرشفة المنتج؟", text: "سيختفي المنتج من الكتالوج، ويبقى محفوظاً في عروض الأسعار السابقة ويمكن استعادته.", confirmLabel: "أرشفة", danger: true })) && archive.mutate(p.id)}><Archive className="h-4 w-4" /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {list.data && <Pagination page={page} lastPage={list.data.meta.last_page} onChange={setPage} />}
    </>
  );
}
