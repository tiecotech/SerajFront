import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getBrand((await params).slug);
  return b ? { title: `${b.name} | السراج المضيء للإضاءة`, description: b.description || undefined } : {};
}

export default async function BrandPage({ params }: Props) {
  const b = await getBrand((await params).slug);
  if (!b) notFound();
  const color = b.colors.primary || "#B8956F";
  const palette = [b.colors.primary, b.colors.secondary, b.colors.accent].filter(Boolean) as string[];

  return (
    <>
      <section className="relative border-b border-gray-100 bg-white">
        <div className="h-1" style={{ background: color }} />
        <div className="container-lux grid items-center gap-12 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <nav className="mb-6 flex items-center gap-1.5 text-[13px] text-gray-500">
              <Link href="/" className="hover:text-gold-600">الرئيسية</Link> / <Link href="/brands" className="hover:text-gold-600">البراندات</Link> / <span className="text-gray-700">{b.name}</span>
            </nav>
            <h1 className="text-[34px] md:text-[48px] font-semibold text-brand-green">{b.name}</h1>
            {b.tagline && <div className="mt-2 text-[16px] tracking-wide" style={{ color }} dir="auto">{b.tagline}</div>}
            <span className="gold-rule mt-5" />
            {b.description && <p className="mt-6 max-w-xl text-[17px] leading-9 text-gray-700">{b.description}</p>}
            {palette.length > 0 && (
              <div className="mt-8">
                <div className="text-[13px] text-gray-500">ألوان الهوية</div>
                <div className="mt-2 flex gap-2">
                  {palette.map((p) => (
                    <div key={p} className="flex items-center gap-2 rounded-full border border-gray-100 py-1 ps-1 pe-3 text-[12px] text-gray-500" dir="ltr">
                      <span className="h-6 w-6 rounded-full border border-black/5" style={{ background: p }} />{p}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex h-[50px] items-center gap-2 rounded-[3px] bg-gold-gradient px-7 text-[15px] font-medium text-white shadow-gold">اطلب الكتالوج <ArrowLeft className="h-4 w-4" /></Link>
              {b.website_url && <a href={b.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-[50px] items-center gap-2 rounded-[3px] border border-gray-200 px-7 text-[15px] text-brand-green">الموقع الرسمي <ExternalLink className="h-4 w-4" /></a>}
            </div>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-[4px] border border-gray-100 bg-white p-12 shadow-sm">
            {/* Original logo — untouched proportions & colours */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {b.logo && <img src={b.logo.lg} alt={b.name} className="max-h-full max-w-full object-contain" />}
          </div>
        </div>
      </section>
      {b.gallery.length > 0 && (
        <section className="py-16">
          <div className="container-lux grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {b.gallery.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.id} src={m.md} alt={b.name} loading="lazy" className="aspect-[4/3] w-full rounded-[4px] object-cover" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
