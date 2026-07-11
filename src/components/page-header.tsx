interface PageHeaderProps {
  eyebrow: string;
  titulo: string;
  descricao?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.02em] text-muted-2">
          {eyebrow}
        </p>
        <h1 className="font-display text-[39px] font-bold leading-[1.2] tracking-[-0.03em]">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1.5 text-sm text-muted-foreground">{descricao}</p>
        )}
      </div>
      {children && <div className="flex gap-2.5">{children}</div>}
    </div>
  );
}
