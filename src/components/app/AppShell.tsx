"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, Bell, ChevronDown, ClipboardList, FileText, FolderTree, Globe, Images, LayoutDashboard, LayoutGrid,
  LogOut, Menu, Package, Presentation, ScanSearch, Settings, ShoppingBag, Tags, Users, Warehouse, X, BarChart3, ExternalLink, Mail,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLoader } from "@/components/ui";
import { get, post } from "@/lib/api";
import { useExchange } from "./Price";
import { useLogout, useMe } from "@/lib/auth";
import type { Cart, User } from "@/lib/types";
import { cn, relative } from "@/lib/utils";
import { SerajLogo } from "@/components/brand/SerajLogo";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean; badge?: number };
type NavGroup = { title?: string; items: NavItem[] };

function navFor(user: User, unreadMessages = 0): NavGroup[] {
  if (user.role === "warehouse") {
    return [{ items: [{ href: "/app/warehouse", label: "طلبات المستودع", icon: Warehouse }] }];
  }
  if (user.role === "commercial_user") {
    return [
      { title: "الكتالوج", items: [
        { href: "/app/catalog", label: "التصنيفات", icon: LayoutGrid },
        { href: "/app/products", label: "جميع المنتجات", icon: Package },
        { href: "/app/visual-search", label: "البحث بالصورة", icon: ScanSearch },
        { href: "/showroom", label: "وضع العرض للزبون", icon: Presentation },
      ] },
      { title: "أعمالي", items: [
        { href: "/app/cart", label: "السلة", icon: ShoppingBag },
        { href: "/app/quotations", label: "عروض الأسعار", icon: FileText },
        { href: "/app/requests", label: "طلبات المستودع", icon: ClipboardList },
      ] },
    ];
  }
  return [
    { items: [{ href: "/app/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true }] },
    { title: "الفريق", items: [
      { href: "/app/admin/employees", label: "أداء الموظفين", icon: BarChart3 },
      { href: "/app/admin/users", label: "المستخدمون والطلبات", icon: Users },
      { href: "/app/admin/activity", label: "سجل النشاط", icon: Activity },
    ] },
    { title: "الكتالوج", items: [
      { href: "/app/admin/products", label: "المنتجات", icon: Package },
      { href: "/app/admin/categories", label: "التصنيفات", icon: FolderTree },
      { href: "/app/admin/brands", label: "البراندات", icon: Tags },
      { href: "/app/catalog", label: "تصفح الكتالوج", icon: LayoutGrid },
    ] },
    { title: "العمليات", items: [
      { href: "/app/quotations", label: "عروض الأسعار", icon: FileText },
      { href: "/app/warehouse", label: "طلبات المستودع", icon: Warehouse },
    ] },
    { title: "الموقع", items: [
      { href: "/app/admin/messages", label: "رسائل التواصل", icon: Mail, badge: unreadMessages },
      { href: "/app/admin/website", label: "إدارة واجهة الموقع", icon: Globe },
      { href: "/app/admin/media", label: "مكتبة الوسائط", icon: Images },
      { href: "/app/admin/settings", label: "الإعدادات", icon: Settings },
    ] },
  ];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (me.isFetched && !me.data) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [me.isFetched, me.data, router, pathname]);
  useEffect(() => setOpen(false), [pathname]);
  // unread contact-form messages from the public website (admin sidebar badge)
  const messages = useQuery({
    queryKey: ["admin-messages-counts"],
    queryFn: async () => (await get<{ data: { total: number; unread: number } }>("/admin/messages/counts")).data,
    enabled: me.data?.role === "admin",
    refetchInterval: 60_000,
  });

  if (!me.data) return <div className="min-h-screen"><PageLoader /></div>;
  const user = me.data;
  const groups = navFor(user, messages.data?.unread ?? 0);

  const sidebar = (
    <aside className="flex h-full flex-col bg-white">
      <div className="flex h-[72px] items-center justify-between border-b border-gray-100 px-5">
        <Link href="/app" className="flex items-center gap-2.5">
          <SerajLogo id="app" className="h-10" />
        </Link>
        <button className="lg:hidden p-1.5 text-gray-500 cursor-pointer" onClick={() => setOpen(false)} aria-label="إغلاق"><X className="h-5 w-5" /></button>
      </div>
      <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-5">
        {groups.map((g, gi) => (
          <div key={gi} className="mb-5">
            {g.title && <div className="mb-2 px-3 text-[11px] font-medium tracking-[0.08em] text-gray-400">{g.title}</div>}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-[14px] transition-colors",
                        active ? "bg-gold-50 text-brand-green font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-brand-green",
                      )}
                    >
                      {active && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gold-gradient" />}
                      <it.icon className={cn("h-[18px] w-[18px]", active ? "text-gold-600" : "text-gray-400 group-hover:text-gold-500")} />
                      {it.label}
                      {!!it.badge && <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-700 px-1.5 text-[11px] font-semibold text-white tabular">{it.badge > 99 ? "99+" : it.badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-[13px] text-gray-500 hover:bg-gray-50">
          <ExternalLink className="h-4 w-4" /> عرض الموقع العام
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="fixed inset-y-0 start-0 z-30 hidden w-[272px] border-e border-gray-100 lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-[280px] shadow-lg">{sidebar}</div>
        </div>
      )}
      <div className="lg:ps-[272px]">
        <Topbar user={user} onMenu={() => setOpen(true)} />
        {user.role === "admin" && <RateReminder />}
        <main className="mx-auto w-full max-w-[1400px] px-4 py-7 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ user, onMenu }: { user: User; onMenu: () => void }) {
  const logout = useLogout();
  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await get<{ data: Cart }>("/carts/current")).data,
    enabled: user.role === "commercial_user",
  });
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => get<{ data: { id: string; data: { title: string; body: string; warehouse_request_id?: number }; read_at: string | null; created_at: string }[]; unread: number }>("/notifications"),
    refetchInterval: 60_000,
  });

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-gray-100 bg-white/90 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-[3px] p-2 text-brand-green hover:bg-gray-50 lg:hidden cursor-pointer" aria-label="القائمة"><Menu className="h-5 w-5" /></button>
        <div className="hidden sm:block text-[13px] text-gray-500">
          مرحباً، <span className="font-medium text-brand-green">{user.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {user.role === "commercial_user" && (
          <Link href="/app/cart" className="relative rounded-[3px] p-2.5 text-brand-green hover:bg-gold-50" aria-label="السلة">
            <ShoppingBag className="h-5 w-5" />
            {!!cart.data?.items_count && (
              <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-gradient px-1 text-[11px] font-semibold text-white tabular">{cart.data.items_count}</span>
            )}
          </Link>
        )}
        <DropdownMenu.Root dir="rtl" onOpenChange={(o) => { if (!o && notifications.data?.unread) post("/notifications/read").then(() => notifications.refetch()); }}>
          <DropdownMenu.Trigger className="relative rounded-[3px] p-2.5 text-brand-green hover:bg-gold-50 cursor-pointer" aria-label="الإشعارات">
            <Bell className="h-5 w-5" />
            {!!notifications.data?.unread && <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-gold-500 ring-2 ring-white" />}
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-80 rounded-[3px] border border-gray-100 bg-white p-2 shadow-lg">
              <div className="px-3 py-2 text-[13px] font-semibold text-brand-green">الإشعارات</div>
              <div className="scroll-thin max-h-96 overflow-y-auto">
                {notifications.data?.data.length ? notifications.data.data.map((n) => (
                  <DropdownMenu.Item key={n.id} asChild>
                    <Link href={n.data.warehouse_request_id ? (user.role === "commercial_user" ? `/app/requests/${n.data.warehouse_request_id}` : `/app/warehouse/${n.data.warehouse_request_id}`) : "#"} className={cn("block rounded-[3px] px-3 py-2.5 outline-none hover:bg-gray-50", !n.read_at && "bg-gold-50/60")}>
                      <div className="text-[13px] font-medium text-brand-green">{n.data.title}</div>
                      <div className="mt-0.5 text-[12px] leading-5 text-gray-500">{n.data.body}</div>
                      <div className="mt-1 text-[11px] text-gray-400">{relative(n.created_at)}</div>
                    </Link>
                  </DropdownMenu.Item>
                )) : <div className="px-3 py-6 text-center text-[13px] text-gray-400">لا توجد إشعارات</div>}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <DropdownMenu.Root dir="rtl">
          <DropdownMenu.Trigger className="flex items-center gap-2 rounded-[3px] py-1.5 ps-1.5 pe-2.5 hover:bg-gray-50 cursor-pointer">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient text-[14px] font-semibold text-white">{user.name.trim().charAt(0)}</span>
            <span className="hidden md:block text-start leading-tight">
              <span className="block text-[13px] font-medium text-brand-green">{user.name}</span>
              <span className="block text-[11px] text-gray-500">{user.employee_type_label ?? user.role_label}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-52 rounded-[3px] border border-gray-100 bg-white p-1.5 shadow-lg">
              <div className="px-3 py-2 text-[12px] text-gray-500">{user.email}</div>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item asChild><Link href="/app/account" className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-[13px] outline-none hover:bg-gray-50"><Settings className="h-4 w-4 text-gray-400" /> حسابي</Link></DropdownMenu.Item>
              <DropdownMenu.Item onSelect={logout} className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-[13px] text-danger outline-none hover:bg-[#fbefee] cursor-pointer"><LogOut className="h-4 w-4" /> تسجيل الخروج</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}



function RateReminder() {
  const fx = useExchange();
  if (!fx.data || fx.data.is_today) return null;
  return (
    <Link href="/app/admin#exchange-rate" className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-[3px] border border-[#efdcb8] bg-[#fbf4e8] px-4 py-2.5 text-[13px] text-warning md:mx-8">
      <span>لم يتم إدخال سعر صرف الدولار لليوم. الأسعار بالليرة السورية محسوبة على آخر سعر ({fx.data.effective_date ?? "غير محدد"}).</span>
      <span className="font-medium whitespace-nowrap">تحديث السعر ←</span>
    </Link>
  );
}
