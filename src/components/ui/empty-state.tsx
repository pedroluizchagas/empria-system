import { type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  fase?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Estado vazio padrão: módulos futuros e telas aguardando dados. */
export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
  fase,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-card px-8 py-16 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-card bg-surface-2 text-muted-2">
        <Icon className="size-5" strokeWidth={1.5} />
      </span>
      <h2 className="font-display text-[25px] font-medium tracking-[-0.03em]">
        {titulo}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>
      {fase && <Badge variant="info">{fase}</Badge>}
      {children && <div className="mt-3 flex gap-2.5">{children}</div>}
    </div>
  );
}
