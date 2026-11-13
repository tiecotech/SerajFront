import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="self-start" aria-label="السراج المضيء">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/seraj-horizontal.png" alt="السراج المضيء" className="h-12 w-auto" />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <p className="text-center text-[12px] text-gray-400">© {new Date().getFullYear()} السراج المضيء — AlSeraj Almuodea</p>
      </div>
      <div className="relative hidden overflow-hidden bg-gold-50 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/watermark-outline.png" alt="" aria-hidden className="absolute -left-24 top-1/2 w-[120%] max-w-none -translate-y-1/2 opacity-[0.18]" />
        <div className="pattern-band absolute inset-x-0 top-0 h-16 opacity-70" />
        <div className="relative flex h-full flex-col items-center justify-center px-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/seraj-icon.png" alt="" className="h-28 w-auto" />
          <h2 className="mt-8 text-[30px] font-semibold text-brand-green">منصة السراج المضيء</h2>
          <span className="gold-rule mx-auto mt-4" />
          <p className="mt-5 max-w-md text-[16px] leading-8 text-gray-700">
            كتالوج المنتجات، عروض الأسعار، وطلبات المستودع — في مكان واحد، بأمان وسرعة.
          </p>
        </div>
      </div>
    </div>
  );
}
