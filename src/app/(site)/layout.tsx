import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getLayout } from "@/lib/site";
import { SerajLogo } from "@/components/brand/SerajLogo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const layout = await getLayout();
  if (!layout) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <SerajLogo id="fallback" draw className="h-14" />
        <p className="text-gray-500">الموقع قيد التحديث، يرجى المحاولة بعد قليل.</p>
      </main>
    );
  }
  return (
    <>
      <SiteHeader menu={layout.menu} announcement={layout.site.announcement} />
      <main>{children}</main>
      <SiteFooter company={layout.company} menu={layout.menu} footerText={layout.site.footer_text} />
    </>
  );
}
