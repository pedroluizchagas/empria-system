import { cn } from "@/lib/utils";

export function Tabela({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-card border border-border bg-card",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm [&_tbody_tr:last-child_td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-border bg-surface-2 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.02em] text-muted-2",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-border px-4 py-3 align-middle",
        className,
      )}
      {...props}
    />
  );
}
