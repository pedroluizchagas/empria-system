import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[12px] font-medium uppercase tracking-[0.02em] text-muted-2",
        className,
      )}
      {...props}
    />
  );
}
