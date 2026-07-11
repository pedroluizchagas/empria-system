"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarComunicado, excluirComunicado, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { ok: false, erro: null };

export function NovoComunicado() {
  const [estado, acao, pendente] = useActionState(criarComunicado, estadoInicial);

  return (
    <form action={acao} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-48 flex-col gap-1.5">
        <Label htmlFor="cm-titulo">Título</Label>
        <Input id="cm-titulo" name="titulo" placeholder="Ex.: Meta de junho batida 🎯" required />
      </div>
      <div className="flex min-w-64 flex-1 flex-col gap-1.5">
        <Label htmlFor="cm-corpo">Mensagem</Label>
        <Input id="cm-corpo" name="corpo" placeholder="Detalhe curto para a equipe (opcional)" />
      </div>
      <Button type="submit" disabled={pendente}>
        {pendente ? "Publicando…" : "Publicar"}
      </Button>
      {estado.erro && (
        <p role="alert" className="w-full text-[13px] text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}

export function ExcluirComunicado({ comunicadoId }: { comunicadoId: string }) {
  const [pendente, iniciar] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pendente}
      onClick={() => {
        if (window.confirm("Remover este comunicado do mural?")) {
          iniciar(() => excluirComunicado(comunicadoId));
        }
      }}
    >
      {pendente ? "…" : "Remover"}
    </Button>
  );
}
