"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { SerajLoader } from "@/components/SerajLoader";
import Link from "next/link";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------ Button ------------------------------ */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline-gold";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
};

// Flat, sharp-cornered and quiet: solid bronze for the one main action, hairline outlines for the rest.
const variants = {
  primary: "bg-gold-700 text-white hover:bg-brand-green",
  secondary: "bg-white text-brand-green border border-gray-200 hover:border-brand-green",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-50 hover:text-brand-green",
  danger: "bg-danger text-white hover:bg-[#9c3a33]",
  "outline-gold": "bg-transparent text-gold-700 border border-gold-500 hover:bg-gold-700 hover:border-gold-700 hover:text-white",
};
const sizes = {
  sm: "h-[34px] px-4 text-[13px] gap-1.5",
  md: "h-[42px] px-6 text-[14px] gap-2",
  lg: "h-[52px] px-9 text-[15px] gap-2.5",
  icon: "h-10 w-10 justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-[2px] font-medium whitespace-nowrap transition-colors duration-300 ease-lux",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold-500/35 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

export function ButtonLink({ href, className, variant = "primary", size = "md", children }: { href: string; className?: string; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-[2px] font-medium whitespace-nowrap transition-colors duration-300 ease-lux focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold-500/35",
        variants[variant ?? "primary"],
        sizes[size ?? "md"],
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ------------------------------ Inputs ------------------------------ */
const fieldBase =
  // 16px on phones: iOS/Android zoom the whole page when a smaller field is focused (and stay zoomed).
  "w-full rounded-[3px] border border-gray-200 bg-white px-3.5 text-[16px] sm:text-[14px] text-brand-green placeholder:text-gray-400 transition-colors focus:outline-none focus:border-gold-500 focus:ring-[3px] focus:ring-gold-500/20 disabled:bg-gray-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-[42px]", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, "py-2.5 min-h-[96px] leading-7", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(fieldBase, "h-[42px] pe-3 cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
});

export function Field({ label, error, hint, children, className, required }: { label?: string; error?: string; hint?: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-gray-700">
          {label} {required && <span className="text-gold-600">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-gray-500">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] text-danger">{error}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        dir="ltr"
        className="relative h-[22px] w-[40px] rounded-full bg-gray-200 transition-colors data-[state=checked]:bg-gold-500 disabled:opacity-50"
      >
        <SwitchPrimitive.Thumb className="block h-[18px] w-[18px] translate-x-[2px] rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[20px]" />
      </SwitchPrimitive.Root>
      {label && <span className="text-[14px] text-gray-700">{label}</span>}
    </label>
  );
}

/* ------------------------------ Display ------------------------------ */
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-[4px] border border-gray-100 bg-white", className)} {...props}>
      {children}
    </div>
  );
}

const badgeTones = {
  gray: "bg-gray-50 text-gray-700 border-gray-100",
  gold: "bg-gold-50 text-gold-700 border-gold-200",
  green: "bg-[#eef5f0] text-success border-[#d6e8dc]",
  red: "bg-[#fbefee] text-danger border-[#f1d6d3]",
  amber: "bg-[#fbf4e8] text-warning border-[#efdcb8]",
  blue: "bg-[#eef2f7] text-info border-[#d5dfea]",
};
export function Badge({ tone = "gray", children, className }: { tone?: keyof typeof badgeTones; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-[2px] border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap", badgeTones[tone], className)}>{children}</span>;
}

export const statusTone: Record<string, keyof typeof badgeTones> = {
  pending: "amber", approved: "green", rejected: "red", suspended: "gray",
  available: "green", out_of_stock: "gray", inactive: "gray", partial: "amber", unavailable: "red",
  draft: "gray", issued: "gold", sent_to_warehouse: "blue", cancelled: "gray",
  submitted: "gold", under_review: "blue", processing: "blue", partially_available: "amber", ready: "green", completed: "green",
  published: "green", unpublished: "gray",
};

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-gold-500", className)} />;
}

export function PageLoader() {
  return <SerajLoader size={60} className="!min-h-[40vh]" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[3px]", className)} />;
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[4px] border border-dashed border-gray-200 bg-gray-25 px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[2px] border border-gold-200 text-gold-600">{icon}</div>}
      <h3 className="text-[17px] font-semibold text-brand-green">{title}</h3>
      {text && <p className="mt-1.5 max-w-md text-[14px] text-gray-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[4px] border border-[#f1d6d3] bg-[#fbefee] px-5 py-4 text-[14px] text-danger flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>إعادة المحاولة</Button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, crumbs }: { title: string; subtitle?: string; actions?: React.ReactNode; crumbs?: { label: string; href?: string }[] }) {
  return (
    <div className="mb-7">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px] text-gray-500">
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {c.href ? <Link href={c.href} className="hover:text-gold-600 transition-colors">{c.label}</Link> : <span className="text-gray-700">{c.label}</span>}
              {i < crumbs.length - 1 && <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight text-brand-green">{title}</h1>
          <span className="gold-rule mt-3" />
          {subtitle && <p className="mt-3 text-[14px] text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Pagination({ page, lastPage, onChange }: { page: number; lastPage: number; onChange: (p: number) => void }) {
  if (lastPage <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronRight className="h-4 w-4" /> السابق
      </Button>
      <span className="px-3 text-[13px] text-gray-500 tabular">
        صفحة {page} من {lastPage}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        التالي <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ------------------------------ Dialogs ------------------------------ */
export function Modal({ open, onOpenChange, title, description, children, footer, size = "md" }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children?: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(35,31,32,0.35)] backdrop-blur-[2px] data-[state=open]:animate-[fadein_.2s_ease-out]" />
        {/* Phones: bottom sheet sized to the visible viewport (dvh shrinks with the keyboard). sm+: centred dialog. */}
        <Dialog.Content dir="rtl" className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] w-full flex-col rounded-t-[6px] bg-white pb-[env(safe-area-inset-bottom)] shadow-lg focus:outline-none animate-[sheet-up_.28s_var(--ease-out)]",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-32px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[4px] sm:pb-0 sm:animate-none",
          w,
        )}>
          <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-gray-200 sm:hidden" />
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-[18px] font-semibold text-brand-green">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-[13px] text-gray-500">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-full p-1.5 text-gray-500 hover:bg-gray-50 cursor-pointer" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="scroll-thin min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
          {/* Phones: full-width buttons, primary action on top. */}
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{ title: string; text?: string; danger?: boolean; confirmLabel?: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = (opts: { title: string; text?: string; danger?: boolean; confirmLabel?: string }) =>
    new Promise<boolean>((resolve) => setState({ ...opts, resolve }));
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  const dialog = (
    <Modal
      open={!!state}
      onOpenChange={(o) => !o && close(false)}
      title={state?.title ?? ""}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>إلغاء</Button>
          <Button variant={state?.danger ? "danger" : "primary"} onClick={() => close(true)}>{state?.confirmLabel ?? "تأكيد"}</Button>
        </>
      }
    >
      {state?.text && <p className="text-[14px] leading-7 text-gray-700">{state.text}</p>}
    </Modal>
  );
  return { confirm, dialog };
}

export function StatCard({ label, value, hint, icon, tone = "gold" }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; tone?: "gold" | "green" | "gray" }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] text-gray-500">{label}</div>
          <div className="mt-1.5 text-[26px] font-semibold leading-none text-brand-green tabular font-display">{value}</div>
          {hint && <div className="mt-2 text-[12px] text-gray-500">{hint}</div>}
        </div>
        {icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-[3px]", tone === "gold" ? "bg-gold-50 text-gold-600" : tone === "green" ? "bg-[#eef5f0] text-success" : "bg-gray-50 text-gray-500")}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function Img({ media, variant = "md", alt, className, ...props }: { media?: { url: string; thumb?: string; md?: string; lg?: string; alt?: string | null } | null; variant?: "thumb" | "md" | "lg" | "url"; alt?: string; className?: string } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src">) {
  if (!media) return <div className={cn("bg-gray-50", className)} />;
  if ((media as { type?: string }).type === "video") {
    return <video src={media.url} muted playsInline preload="metadata" className={className} />;
  }
  const src = (variant === "url" ? media.url : media[variant]) || media.url;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? media.alt ?? ""} loading="lazy" decoding="async" className={className} {...props} />;
}
