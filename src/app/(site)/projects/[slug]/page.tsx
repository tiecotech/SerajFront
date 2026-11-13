import { Calendar, MapPin, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).slug);
  return p ? { title: `${p.title} | مشاريع السراج المضيء`, description: p.summary || undefined, openGraph: p.cover ? { images: [p.cover.lg] } : undefined } : {};
}

export default async function ProjectPage({ params }: Props) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  return (
    <>
      <section className="relative h-[52vh] min-h-[380px] overflow-hidden bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.cover && <img src={p.cover.lg} alt={p.title} className="absolute inset-0 h-full w-full object-cover kenburns" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="container-lux relative flex h-full flex-col justify-end pb-12">
          <nav className="mb-4 text-[13px] text-white/70"><Link href="/projects" className="hover:text-white">مشاريعنا</Link> / {p.title}</nav>
          <h1 className="text-[30px] md:text-[46px] font-semibold text-white">{p.title}</h1>
          <div className="mt-4 flex flex-wrap gap-5 text-[14px] text-white/85">
            {p.project_type && <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" />{p.project_type}</span>}
            {p.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{p.location}</span>}
            {p.year && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{p.year}</span>}
          </div>
        </div>
      </section>
      <section className="py-14 md:py-20">
        <div className="container-lux">
          {p.description && (
            <div className="prose-lux max-w-3xl">
              {p.description.split(/\n{2,}/).map((t, i) => <p key={i}>{t}</p>)}
            </div>
          )}
          {p.gallery.length > 1 && (
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {p.gallery.map((g, i) => (
                <figure key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.image.lg} alt={g.caption || p.title} loading="lazy" className="aspect-[4/3] w-full rounded-[4px] object-cover" />
                  {g.caption && <figcaption className="mt-2 text-[13px] text-gray-500">{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
          <div className="mt-14">
            <Link href="/contact" className="inline-flex h-[50px] items-center rounded-[3px] bg-gold-gradient px-8 text-[15px] font-medium text-white shadow-gold">ناقش مشروعك معنا</Link>
          </div>
        </div>
      </section>
    </>
  );
}
