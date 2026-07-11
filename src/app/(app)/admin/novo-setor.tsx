"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { criarSetor, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { ok: false, erro: null };

export function NovoSetor() {
  const [estado, acao, pendente] = useActionState(criarSetor, estadoInicial);

  return (
    <form action={acao} className="flex flex-wrap items-center gap-3">
      <Input
        name="nome"
        aria-label="Nome do setor"
        placeholder="Ex.: Comercial, Marketing…"
        required
        minLength={2}
        className="w-56"
      />
      <Button type="submit" variant="secondary" disabled={pendente}>
        {pendente ? "Criando…" : "Criar setor"}
      </Button>
      {estado.erro && (
        <p role="alert" className="w-full text-[13px] text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
