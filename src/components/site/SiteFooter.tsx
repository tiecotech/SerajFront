import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { SiteCompany } from "@/lib/types";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter({ company, menu, footerText }: { company: SiteCompany; menu: { slug: string; title: string }[]; footerText?: string | null }) {
  return (
    <footer className="mt-0 border-t border-gray-100 bg-gray-25">
      <div className="pattern-band h-10 opacity-70" aria-hidden />
      <div className="container-lux grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/seraj-horizontal.png" alt={company.name} className="h-14 w-auto" />
          <p className="mt-5 max-w-sm text-[14px] leading-7 text-gray-500">{company.description || footerText}</p>
          <SocialLinks social={company.social} className="mt-6" />
        </div>
        <div className="md:col-span-3">
          <h3 className="text-[15px] font-semibold text-brand-green">روابط</h3>
          <span className="gold-rule mt-2.5 !w-8 !h-[2px]" />
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li><Link href="/" className="text-gray-500 hover:text-gold-600 transition-colors">الرئيسية</Link></li>
            {menu.map((m) => (
              <li key={m.slug}><Link href={`/${m.slug}`} className="text-gray-500 hover:text-gold-600 transition-colors">{m.title}</Link></li>
            ))}
            <li><Link href="/login" className="text-gray-500 hover:text-gold-600 transition-colors">بوابة الموظفين</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h3 className="text-[15px] font-semibold text-brand-green">تواصل معنا</h3>
          <span className="gold-rule mt-2.5 !w-8 !h-[2px]" />
          <ul className="mt-4 space-y-3 text-[14px] text-gray-500">
            {company.address && <li className="flex gap-2.5"><MapPin className="h-[18px] w-[18px] shrink-0 text-gold-500 mt-1" />{company.address}</li>}
            {company.phone && <li className="flex gap-2.5"><Phone className="h-[18px] w-[18px] shrink-0 text-gold-500 mt-1" /><a dir="ltr" href={`tel:${company.phone.replace(/\s/g, "")}`} className="hover:text-gold-600">{company.phone}</a></li>}
            {company.email && <li className="flex gap-2.5"><Mail className="h-[18px] w-[18px] shrink-0 text-gold-500 mt-1" /><a href={`mailto:${company.email}`} className="hover:text-gold-600">{company.email}</a></li>}
            {company.working_hours && <li className="flex gap-2.5"><Clock className="h-[18px] w-[18px] shrink-0 text-gold-500 mt-1" />{company.working_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100">
        <div className="container-lux flex flex-col items-center justify-between gap-2 py-5 text-[13px] text-gray-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {company.name} — {company.name_en}. جميع الحقوق محفوظة.</span>
          <span>
            تصميم وبرمجة{" "}
            <a href="https://tieco-tech.com" target="_blank" rel="noopener" className="font-medium text-gold-700 underline-offset-4 transition-colors hover:text-brand-green hover:underline">
              تايكو تيك
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
