import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-control px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.02em] whitespace-nowrap",
  {
    variants: {
      variant: {
        neutro: "bg-surface-2 text-muted-foreground",
        info: "bg-primary/10 text-primary",
        ok: "bg-success/10 text-success",
        atencao: "bg-warning/15 text-[#b57d24]",
        erro: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "neutro" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
