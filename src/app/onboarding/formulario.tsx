"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarEmpresa, type EstadoOnboarding } from "./actions";

const estadoInicial: EstadoOnboarding = { erro: null };

export function FormularioOnboarding({ email }: { email: string }) {
  const [estado, acao, pendente] = useActionState(criarEmpresa, estadoInicial);

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-[25px] font-medium tracking-[-0.03em]">
        Crie sua empresa
      </h1>
      <p className="mb-6 mt-1 text-[13px] text-muted-3">
        Você ({email}) será o proprietário — depois é só cadastrar unidades e
        convidar a equipe.
      </p>
      <form action={acao} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome_empresa">Nome da empresa</Label>
          <Input
            id="nome_empresa"
            name="nome_empresa"
            placeholder="Ex.: Moda Aurora"
            required
            minLength={2}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome_pessoa">Seu nome</Label>
          <Input id="nome_pessoa" name="nome_pessoa" placeholder="Como aparecer no sistema" />
        </div>
        {estado.erro && (
          <p role="alert" className="text-[13px] text-destructive">
            {estado.erro}
          </p>
        )}
        <Button type="submit" disabled={pendente} className="mt-1 w-full">
          {pendente ? "Criando…" : "Criar empresa"}
        </Button>
      </form>
    </Card>
  );
}
