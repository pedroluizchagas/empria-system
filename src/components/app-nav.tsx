"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODULOS } from "@/lib/dominio";
import { cn } from "@/lib/utils";

interface AppNavProps {
  usuario: { nome: string; email: string } | null;
  nomeEmpresa: string | null;
  configurado: boolean;
  sair: () => Promise<void>;
}

export function AppNav({ usuario, nomeEmpresa, configurado, sair }: AppNavProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center gap-8 px-10 max-[1000px]:px-5">
        <Link href="/painel" className="flex shrink-0 items-center gap-3">
          <Logo />
          {nomeEmpresa && (
            <span className="border-l border-border pl-3 text-[13px] text-muted-foreground max-[820px]:hidden">
              {nomeEmpresa}
            </span>
          )}
        </Link>

        <nav aria-label="Módulos" className="flex gap-6 max-[820px]:hidden">
          {MODULOS.map((modulo) => {
            const ativo = pathname.startsWith(modulo.href);
            return (
              <Link
                key={modulo.href}
                href={modulo.href}
                className={cn(
                  "py-1 text-[12px] font-medium uppercase tracking-[0.02em] transition-colors",
                  ativo
                    ? "text-foreground shadow-[0_14px_0_-12px_var(--primary)]"
                    : "text-muted-2 hover:text-foreground",
                )}
              >
                {modulo.rotulo}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {configurado && usuario ? (
            <>
              <span className="text-[13px] text-muted-foreground max-[820px]:hidden">
                {usuario.nome}
              </span>
              <form action={sair}>
                <Button variant="ghost" size="sm" type="submit">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <Badge variant="atencao">Modo prévia</Badge>
          )}
          <Link
            href="/admin"
            aria-label="Administração"
            className={cn(
              "flex size-8 items-center justify-center rounded-control transition-colors",
              pathname.startsWith("/admin")
                ? "bg-surface-2 text-foreground"
                : "text-muted-2 hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Settings2 className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  );
}
