import { cn } from "@/lib/utils";

/**
 * Marca provisória: monograma geométrico de quadrados (direção definida em
 * DESIGN.md §9 — logo definitivo é tarefa de branding à parte).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span aria-hidden className="grid grid-cols-2 gap-[2px]">
        <i className="size-1.5 bg-primary" />
        <i className="size-1.5 bg-primary" />
        <i className="size-1.5 bg-accent-cyan" />
        <i className="size-1.5 bg-primary" />
      </span>
      <span className="font-display text-[17px] font-bold tracking-[-0.02em]">
        Empria
      </span>
    </span>
  );
}
