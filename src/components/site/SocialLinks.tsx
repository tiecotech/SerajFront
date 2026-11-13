import { cn } from "@/lib/utils";

const NETWORKS: Record<string, { label: string; url: (h: string) => string; path: string }> = {
  instagram: { label: "Instagram", url: (h) => `https://instagram.com/${h}`, path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5h.01" },
  facebook: { label: "Facebook", url: (h) => `https://facebook.com/${h}`, path: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v7h4v-7h3l1-4h-4V8a0 0 0 0 1 0 0Z" },
  linkedin: { label: "LinkedIn", url: (h) => `https://linkedin.com/company/${h}`, path: "M4 9h4v11H4zM6 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5 5h4v1.6c.6-1 1.8-1.9 3.6-1.9 3 0 3.4 2 3.4 4.6V20h-4v-5.2c0-1.3 0-2.8-1.7-2.8S14 13.3 14 14.7V20h-3z" },
  youtube: { label: "YouTube", url: (h) => `https://youtube.com/@${h}`, path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5 3z" },
  tiktok: { label: "TikTok", url: (h) => `https://tiktok.com/@${h}`, path: "M16 3c.4 2.3 1.8 3.8 4 4v3.2a7.7 7.7 0 0 1-4-1.2v6.5A5.5 5.5 0 1 1 10.5 10v3.3a2.3 2.3 0 1 0 2.2 2.2V3z" },
  x: { label: "X", url: (h) => `https://x.com/${h}`, path: "M4 4l16 16M20 4 4 20" },
};

export function SocialLinks({ social, className }: { social: Record<string, string>; className?: string }) {
  const items = Object.entries(social || {}).filter(([k, v]) => v && NETWORKS[k]);
  if (!items.length) return null;
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {items.map(([k, handle]) => {
        const n = NETWORKS[k];
        const href = handle.startsWith("http") ? handle : n.url(handle);
        return (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer" aria-label={n.label} className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-300 text-gold-600 transition-all hover:bg-gold-gradient hover:text-white hover:border-transparent">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={n.path} /></svg>
          </a>
        );
      })}
    </div>
  );
}
