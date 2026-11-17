import { cn } from "@/lib/utils";

/** Gold hairline with a glowing hexagon at its centre and beams of light travelling towards it. Pure CSS. */
export function LightDivider({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("light-divider", dark && "is-dark", className)} aria-hidden>
      <span className="ld-line" />
      <span className="ld-mark" />
      <span className="ld-line" />
    </div>
  );
}
