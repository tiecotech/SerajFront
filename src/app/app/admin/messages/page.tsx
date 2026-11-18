"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, ChevronDown, Mail, MailOpen, MessageCircle, Phone, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Pagination, Skeleton, useConfirm } from "@/components/ui";
import { del, errorMessage, get, patch, post } from "@/lib/api";
import { cn, date, relative } from "@/lib/utils";

/** Messages sent by visitors through the «تواصل معنا» form on the public website. */
type Message = { id: number; name: string; phone: string | null; email: string | null; subject: string | null; message: string; read_at: string | null; created_at: string };
type Status = "" | "unread" | "read";

/** wa.me needs digits only, in international form (00963… → 963…). */
const waNumber = (phone: string) => phone.replace(/[^\d]/g, "").replace(/^00/, "");

export default function MessagesPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [status, setStatus] = useState<Status>("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => { const t = setTimeout(() => { setSearch(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const list = useQuery({
    queryKey: ["admin-messages", status, search, page],
    queryFn: () => get<{ data: Message[]; meta: { current_page: number; last_page: number; total: number } }>("/admin/messages", { status, q: search, page }),
    placeholderData: keepPreviousData,
  });
  const counts = useQuery({
    queryKey: ["admin-messages-counts"],
    queryFn: async () => (await get<{ data: { total: number; unread: number } }>("/admin/messages/counts")).data,
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-messages"] }); qc.invalidateQueries({ queryKey: ["admin-messages-counts"] }); };

  const setRead = useMutation({
    mutationFn: ({ id, read }: { id: number; read: boolean }) => patch(`/admin/messages/${id}/read`, { read }),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const readAll = useMutation({
    mutationFn: () => post<{ data: { updated: number } }>("/admin/messages/read-all"),
    onSuccess: (r) => { refresh(); toast.success(r.data.updated ? `تم تعليم ${r.data.updated} رسالة كمقروءة` : "لا توجد رسائل جديدة"); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => del(`/admin/messages/${id}`),
    onSuccess: () => { refresh(); toast.success("تم حذف الرسالة"); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // opening an unread message marks it as read
  const toggle = (m: Message) => {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && !m.read_at) setRead.mutate({ id: m.id, read: true });
  };
  const askDelete = async (m: Message) => {
    if (await confirm({ title: "حذف الرسالة؟", text: `سيتم حذف رسالة «${m.name}» نهائياً.`, danger: true, confirmLabel: "حذف" })) remove.mutate(m.id);
  };

  const unread = counts.data?.unread ?? 0;
  const tabs: { value: Status; label: string; count?: number }[] = [
    { value: "", label: "كل الرسائل", count: counts.data?.total },
    { value: "unread", label: "غير مقروءة", count: unread },
    { value: "read", label: "مقروءة" },
  ];

  return (
    <>
      <PageHeader
        title="رسائل التواصل"
        subtitle="الرسائل التي يرسلها الزوار من نموذج «تواصل معنا» في الموقع."
        actions={<Button variant="secondary" onClick={() => readAll.mutate()} loading={readAll.isPending} disabled={!unread}><CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-[3px] border border-gray-200 bg-white p-1">
          {tabs.map((t) => (
            <button key={t.value} onClick={() => { setStatus(t.value); setPage(1); }}
              className={cn("flex items-center gap-2 rounded-[2px] px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer", status === t.value ? "bg-brand-green text-white" : "text-gray-500 hover:text-brand-green")}>
              {t.label}
              {t.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px] tabular", status === t.value ? "bg-white/20" : t.value === "unread" && t.count ? "bg-gold-700 text-white" : "bg-gray-100")}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الهاتف أو النص…" className="ps-9" />
        </div>
      </div>

      {list.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !list.data?.data.length ? (
        <EmptyState icon={<Mail className="h-6 w-6" />} title={search || status ? "لا توجد رسائل مطابقة" : "لا توجد رسائل بعد"} text="تظهر هنا كل رسالة يرسلها زائر من صفحة «تواصل معنا»." />
      ) : (
        <div className={cn("space-y-3 transition-opacity", list.isFetching && "opacity-70")}>
          {list.data.data.map((m) => {
            const open = openId === m.id;
            const isNew = !m.read_at;
            return (
              <Card key={m.id} className={cn("overflow-hidden transition-colors", isNew && "border-gold-200 bg-gold-50/40")}>
                <button onClick={() => toggle(m)} className="flex w-full items-start gap-4 p-5 text-start cursor-pointer" aria-expanded={open}>
                  <span className={cn("mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", isNew ? "bg-gold-700 text-white" : "bg-gray-50 text-gray-400")}>
                    {isNew ? <Mail className="h-[18px] w-[18px]" /> : <MailOpen className="h-[18px] w-[18px]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn("text-[15px] text-brand-green", isNew ? "font-semibold" : "font-medium")}>{m.name}</span>
                      {isNew && <Badge tone="gold">جديدة</Badge>}
                      {m.subject && <span className="text-[14px] text-gray-500">— {m.subject}</span>}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-gray-500">
                      {m.phone && <span dir="ltr">{m.phone}</span>}
                      {m.email && <span dir="ltr">{m.email}</span>}
                    </span>
                    {!open && <span className="mt-2 block line-clamp-1 text-[13.5px] text-gray-600">{m.message}</span>}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-[12px] text-gray-400" title={date(m.created_at, true)}>{relative(m.created_at)}</span>
                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
                  </span>
                </button>

                {open && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 sm:ps-[76px]">
                    <p className="whitespace-pre-wrap text-[14.5px] leading-8 text-gray-700" dir="auto">{m.message}</p>
                    <p className="mt-3 text-[12px] text-gray-400">أُرسلت {date(m.created_at, true)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {m.phone && (
                        <a href={`https://wa.me/${waNumber(m.phone)}?text=${encodeURIComponent(`مرحباً ${m.name}، شكراً لتواصلك مع السراج المضيء.`)}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex h-[34px] items-center gap-1.5 rounded-[2px] bg-success px-4 text-[13px] font-medium text-white hover:brightness-110">
                          <MessageCircle className="h-4 w-4" /> رد عبر واتساب
                        </a>
                      )}
                      {m.phone && <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="inline-flex h-[34px] items-center gap-1.5 rounded-[2px] border border-gray-200 bg-white px-4 text-[13px] font-medium text-brand-green hover:border-brand-green"><Phone className="h-4 w-4" /> اتصال</a>}
                      {m.email && (
                        <a href={`mailto:${m.email}?subject=${encodeURIComponent(`رد: ${m.subject || "رسالتك إلى السراج المضيء"}`)}`}
                          className="inline-flex h-[34px] items-center gap-1.5 rounded-[2px] border border-gray-200 bg-white px-4 text-[13px] font-medium text-brand-green hover:border-brand-green">
                          <Mail className="h-4 w-4" /> رد بالبريد
                        </a>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setRead.mutate({ id: m.id, read: !m.read_at })}>
                        {m.read_at ? <><Mail className="h-4 w-4" /> تعليم كغير مقروءة</> : <><MailOpen className="h-4 w-4" /> تعليم كمقروءة</>}
                      </Button>
                      <Button size="sm" variant="ghost" className="ms-auto text-danger hover:text-danger" onClick={() => askDelete(m)}><Trash2 className="h-4 w-4" /> حذف</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {list.data && <Pagination page={page} lastPage={list.data.meta.last_page} onChange={setPage} />}
      {dialog}
    </>
  );
}
