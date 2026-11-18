import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SerajMark } from "@/components/SerajLoader";

/** Arabic 404: the AlSeraj mark lights up once, with a way back into the site. */
export function NotFoundView() {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center bg-white px-4 py-20 text-center">
      <SerajMark size={88} once id="nf-mark" />
      <p className="mt-8 font-display text-[13px] tracking-[0.3em] text-gold-600" dir="ltr">404</p>
      <h1 className="mt-2 font-display text-[28px] font-semibold text-brand-green sm:text-[36px]">لم نجد هذه الصفحة</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-500">ربما تغيّر الرابط أو أُزيلت الصفحة. يمكنك العودة إلى الرئيسية أو تصفّح مشاريعنا وبرانداتنا.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-green px-6 text-[14px] font-medium text-white transition hover:bg-[#1f2a23]">
          الرئيسية <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link href="/projects" className="inline-flex h-11 items-center rounded-full border border-gold-200 px-5 text-[14px] font-medium text-gold-700 transition hover:bg-gold-50">المشاريع</Link>
        <Link href="/brands" className="inline-flex h-11 items-center rounded-full border border-gold-200 px-5 text-[14px] font-medium text-gold-700 transition hover:bg-gold-50">البراندات</Link>
      </div>
    </main>
  );
}
