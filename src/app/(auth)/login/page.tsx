"use client";

import { useActionState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EstadoLogin } from "./actions";

const estadoInicial: EstadoLogin = { erro: null };

export default function LoginPage() {
  const [estado, acao, pendente] = useActionState(entrar, estadoInicial);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5">
      <Logo />
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-[25px] font-medium tracking-[-0.03em]">
          Entrar
        </h1>
        <p className="mb-6 mt-1 text-[13px] text-muted-3">
          Use o acesso criado pela sua empresa.
        </p>
        <form action={acao} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@suaempresa.com.br"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>
          {estado.erro && (
            <p role="alert" className="text-[13px] text-destructive">
              {estado.erro}
            </p>
          )}
          <Button type="submit" disabled={pendente} className="mt-1 w-full">
            {pendente ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </Card>
      <p className="max-w-sm text-center text-[12px] leading-relaxed text-muted-3">
        Cada pessoa da equipe tem login individual — o painel se monta conforme
        papel, setor e unidades.
      </p>
    </div>
  );
}
