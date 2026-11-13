"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, Pencil, Plus, RotateCcw, Search, ShieldOff, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Pagination, Select, statusTone } from "@/components/ui";
import { errorMessage, get, post, put } from "@/lib/api";
import type { Paginated, User } from "@/lib/types";
import { cn, date } from "@/lib/utils";

const STATUS_TABS = [
  { v: "pending", l: "بانتظار الموافقة" }, { v: "approved", l: "مفعّل" }, { v: "suspended", l: "موقوف" }, { v: "rejected", l: "مرفوض" }, { v: "", l: "الكل" },
];

function UsersInner() {
  const qc = useQueryClient();
  const initial = useSearchParams().get("status") ?? "pending";
  const [status, setStatus] = useState(initial);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ user: User; kind: "approve" | "reject" | "suspend" | "reactivate" } | null>(null);
  const [reason, setReason] = useState("");
  const [edit, setEdit] = useState<Partial<User> & { password?: string } | null>(null);
  const [pwd, setPwd] = useState<{ user: User; password: string } | null>(null);

  const counts = useQuery({ queryKey: ["user-counts"], queryFn: async () => (await get<{ data: Record<string, number> }>("/users/counts")).data });
  const list = useQuery({ queryKey: ["users", status, q, type, page], queryFn: () => get<Paginated<User>>("/users", { status, q, employee_type: type, page }), placeholderData: keepPreviousData });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["users"] }); qc.invalidateQueries({ queryKey: ["user-counts"] }); };

  const act = useMutation({
    mutationFn: () => post(`/accounts/${action!.user.id}/${action!.kind}`, { reason: reason || undefined }),
    onSuccess: () => { toast.success("تم تحديث حالة الحساب."); setAction(null); setReason(""); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const save = useMutation({
    mutationFn: () => {
      const body = { name: edit!.name, email: edit!.email, username: edit!.username || null, phone: edit!.phone || null, role: edit!.role, employee_type: edit!.employee_type, password: edit!.password };
      return edit!.id ? put(`/users/${edit!.id}`, body) : post("/users", body);
    },
    onSuccess: () => { toast.success("تم حفظ بيانات المستخدم."); setEdit(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const resetPwd = useMutation({
    mutationFn: (mode: "link" | "set") => post<{ message: string }>(`/accounts/${pwd!.user.id}/password`, { mode, password: mode === "set" ? pwd!.password : undefined }),
    onSuccess: (r) => { toast.success(r.message); setPwd(null); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const ACTION_LABEL = { approve: "الموافقة على الحساب", reject: "رفض الحساب", suspend: "إيقاف الحساب", reactivate: "إعادة تفعيل الحساب" };

  return (
    <>
      <PageHeader title="المستخدمون وطلبات التسجيل" subtitle="الموافقة على الحسابات الجديدة، إدارة الأدوار، الإيقاف وإعادة التفعيل." actions={<Button onClick={() => setEdit({ role: "commercial_user", employee_type: "engineer" })}><Plus className="h-4 w-4" /> مستخدم جديد</Button>} />
      <div className="scroll-thin mb-5 flex gap-1.5 overflow-x-auto rounded-[3px] border border-gray-100 bg-white p-1.5">
        {STATUS_TABS.map((t) => (
          <button key={t.v} onClick={() => { setStatus(t.v); setPage(1); }} className={cn("flex shrink-0 items-center gap-2 rounded-[3px] px-4 py-2 text-[14px] cursor-pointer", status === t.v ? "bg-gold-50 font-medium text-brand-green" : "text-gray-500 hover:bg-gray-50")}>
            {t.l} {t.v && <span className={cn("rounded-full px-1.5 text-[11px] tabular", status === t.v ? "bg-gold-gradient text-white" : "bg-gray-100")}>{counts.data?.[t.v] ?? 0}</span>}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm"><Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="الاسم، البريد أو الهاتف" className="ps-10" /></div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-44"><option value="">كل الأنواع</option><option value="engineer">مهندس</option><option value="sales">مبيعات</option><option value="warehouse">مستودع</option></Select>
      </div>
      {list.isError && <ErrorState message={errorMessage(list.error)} />}
      {list.data?.data.length === 0 ? <EmptyState title="لا يوجد مستخدمون في هذه القائمة" /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[14px]">
            <thead className="bg-gray-50 text-[12px] text-gray-500"><tr>{["المستخدم", "الهاتف", "الدور / النوع", "الحالة", "تاريخ التسجيل", "آخر دخول", ""].map((h, i) => <th key={i} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {list.data?.data.map((u) => (
                <tr key={u.id} className="hover:bg-gold-50/30">
                  <td className="px-4 py-3"><div className="font-medium text-brand-green">{u.name}</div><div className="text-[12px] text-gray-500">{u.email}</div></td>
                  <td className="px-4 py-3 text-gray-700" dir="ltr" style={{ textAlign: "right" }}>{u.phone || "—"}</td>
                  <td className="px-4 py-3"><div>{u.role_label}</div><div className="text-[12px] text-gray-500">{u.employee_type_label}</div></td>
                  <td className="px-4 py-3"><Badge tone={statusTone[u.status]}>{u.status_label}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{date(u.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500">{date(u.last_login_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {u.status === "pending" && <><Button size="sm" onClick={() => setAction({ user: u, kind: "approve" })}><Check className="h-4 w-4" /> موافقة</Button><Button size="sm" variant="secondary" className="text-danger" onClick={() => setAction({ user: u, kind: "reject" })}><X className="h-4 w-4" /> رفض</Button></>}
                      {u.status === "rejected" && <Button size="sm" variant="secondary" onClick={() => setAction({ user: u, kind: "approve" })}>موافقة</Button>}
                      {u.status === "approved" && u.role !== "admin" && <Button size="sm" variant="ghost" title="إيقاف" onClick={() => setAction({ user: u, kind: "suspend" })}><ShieldOff className="h-4 w-4" /></Button>}
                      {u.status === "suspended" && <Button size="sm" variant="secondary" onClick={() => setAction({ user: u, kind: "reactivate" })}><RotateCcw className="h-4 w-4" /> تفعيل</Button>}
                      <Button size="sm" variant="ghost" title="تعديل" onClick={() => setEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" title="كلمة المرور" onClick={() => setPwd({ user: u, password: "" })}><KeyRound className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {list.data && <Pagination page={page} lastPage={list.data.meta.last_page} onChange={setPage} />}

      <Modal open={!!action} onOpenChange={(o) => !o && setAction(null)} title={action ? ACTION_LABEL[action.kind] : ""} description={action?.user.name} size="sm"
        footer={<><Button variant="secondary" onClick={() => setAction(null)}>إلغاء</Button><Button variant={action?.kind === "reject" || action?.kind === "suspend" ? "danger" : "primary"} loading={act.isPending} onClick={() => act.mutate()}>تأكيد</Button></>}>
        <Field label="ملاحظة / السبب (اختياري)"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        {action?.kind === "approve" && <p className="mt-3 text-[13px] text-gray-500">نوع الموظف المطلوب: {action.user.employee_type_label}. يمكنك تعديله لاحقاً.</p>}
      </Modal>

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "تعديل مستخدم" : "مستخدم جديد"}
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>إلغاء</Button><Button loading={save.isPending} onClick={() => save.mutate()}>حفظ</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم" required><Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="البريد الإلكتروني" required><Input value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} dir="ltr" /></Field>
            <Field label="اسم المستخدم"><Input value={edit.username ?? ""} onChange={(e) => setEdit({ ...edit, username: e.target.value })} dir="ltr" /></Field>
            <Field label="الهاتف"><Input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} dir="ltr" /></Field>
            <Field label="الدور" required>
              <Select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as User["role"], employee_type: e.target.value === "warehouse" ? "warehouse" : e.target.value === "admin" ? null : "engineer" })}>
                <option value="commercial_user">مستخدم تجاري</option><option value="warehouse">موظف مستودع</option><option value="admin">مدير النظام</option>
              </Select>
            </Field>
            {edit.role === "commercial_user" && (
              <Field label="نوع الموظف (للإحصائيات فقط)" hint="المهندس وموظف المبيعات لهما الصلاحيات نفسها تماماً.">
                <Select value={edit.employee_type ?? "engineer"} onChange={(e) => setEdit({ ...edit, employee_type: e.target.value as User["employee_type"] })}><option value="engineer">مهندس</option><option value="sales">موظف مبيعات</option></Select>
              </Field>
            )}
            {!edit.id && <Field label="كلمة المرور" required hint="8 أحرف على الأقل، حروف وأرقام"><Input type="password" value={edit.password ?? ""} onChange={(e) => setEdit({ ...edit, password: e.target.value })} dir="ltr" /></Field>}
          </div>
        )}
      </Modal>

      <Modal open={!!pwd} onOpenChange={(o) => !o && setPwd(null)} title="إدارة كلمة المرور" description={pwd?.user.email} size="sm">
        {pwd && (
          <div className="space-y-5">
            <div className="rounded-[3px] border border-gray-100 p-4">
              <div className="text-[14px] font-medium text-brand-green">إرسال رابط إعادة التعيين (موصى به)</div>
              <p className="mt-1 text-[12px] text-gray-500">يصل المستخدم رابط آمن لتعيين كلمة المرور بنفسه.</p>
              <Button size="sm" className="mt-3" loading={resetPwd.isPending && resetPwd.variables === "link"} onClick={() => resetPwd.mutate("link")}>إرسال الرابط</Button>
            </div>
            <div className="rounded-[3px] border border-gray-100 p-4">
              <div className="text-[14px] font-medium text-brand-green">تعيين كلمة مرور مؤقتة</div>
              <p className="mt-1 text-[12px] text-gray-500">سيتم إنهاء جميع جلسات المستخدم الحالية.</p>
              <Input type="password" className="mt-3" value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} dir="ltr" placeholder="كلمة مرور جديدة" />
              <Button size="sm" variant="secondary" className="mt-3" loading={resetPwd.isPending && resetPwd.variables === "set"} onClick={() => resetPwd.mutate("set")}>تعيين</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function UsersPage() {
  return <Suspense><UsersInner /></Suspense>;
}
