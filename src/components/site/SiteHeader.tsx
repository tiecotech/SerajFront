"use client";

import { Menu, X, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SiteHeader({ menu, announcement, previewBase = "" }: { menu: { slug: string; title: string }[]; announcement?: string | null; previewBase?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const links = [{ slug: "", title: "الرئيسية" }, ...menu];
  const href = (slug: string) => (previewBase ? previewBase : "") + "/" + slug;

  return (
    <header className={cn("sticky top-0 z-40 bg-white/95 backdrop-blur transition-shadow", scrolled ? "shadow-sm" : "")}>
      {announcement && <div className="bg-gold-50 py-1.5 text-center text-[13px] text-gold-700">{announcement}</div>}
      <div className="container-lux flex h-16 md:h-[76px] items-center justify-between gap-6">
        <Link href={previewBase || "/"} className="shrink-0" aria-label="السراج المضيء">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/seraj-horizontal.png" alt="السراج المضيء — AlSeraj Almuodea" className="h-10 md:h-12 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="القائمة الرئيسية">
          {links.map((l) => {
            const active = (l.slug === "" && pathname === "/") || (l.slug && pathname.startsWith("/" + l.slug));
            return (
              <Link
                key={l.slug}
                href={href(l.slug)}
                className={cn(
                  "relative px-3.5 py-2 text-[15px] transition-colors",
                  active ? "text-brand-green font-medium" : "text-gray-500 hover:text-brand-green",
                )}
              >
                {l.title}
                <span className={cn("absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded bg-gold-gradient transition-opacity", active ? "opacity-100" : "opacity-0")} />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex h-10 items-center gap-2 rounded-[3px] border border-gold-300 px-4 text-[14px] font-medium text-gold-700 transition-colors hover:bg-gold-50">
            <LogIn className="h-4 w-4" /> بوابة الموظفين
          </Link>
          <button className="lg:hidden rounded-[3px] p-2 text-brand-green hover:bg-gray-50 cursor-pointer" onClick={() => setOpen((o) => !o)} aria-label="القائمة" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="container-lux flex flex-col py-3">
            {links.map((l) => (
              <Link key={l.slug} href={href(l.slug)} className="rounded-[3px] px-3 py-3 text-[15px] text-brand-green hover:bg-gold-50">
                {l.title}
              </Link>
            ))}
            <Link href="/login" className="mt-2 rounded-[3px] bg-gold-gradient px-3 py-3 text-center text-[15px] font-medium text-white">
              بوابة الموظفين
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
