"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROTULO_TIPO_EVENTO, TIPOS_EVENTO } from "@/lib/dominio";
import { criarEvento, excluirEvento, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { ok: false, erro: null };

export function NovoEvento({ unidades }: { unidades: { id: string; nome: string }[] }) {
  const [estado, acao, pendente] = useActionState(criarEvento, estadoInicial);

  return (
    <form action={acao} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <Label htmlFor="ev-titulo">Título</Label>
        <Input id="ev-titulo" name="titulo" placeholder="Ex.: Campanha Dia dos Pais" required />
      </div>
      <div className="flex w-40 flex-col gap-1.5">
        <Label htmlFor="ev-tipo">Tipo</Label>
        <Select id="ev-tipo" name="tipo" defaultValue="campanha">
          {TIPOS_EVENTO.map((t) => (
            <option key={t} value={t}>
              {ROTULO_TIPO_EVENTO[t]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <Label htmlFor="ev-inicio">Início</Label>
        <Input id="ev-inicio" name="inicio" type="date" required />
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <Label htmlFor="ev-fim">Fim</Label>
        <Input id="ev-fim" name="fim" type="date" />
      </div>
      <div className="flex w-40 flex-col gap-1.5">
        <Label htmlFor="ev-unidade">Unidade</Label>
        <Select id="ev-unidade" name="unidade_id" defaultValue="">
          <option value="">Empresa toda</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <Label htmlFor="ev-inv">Investimento</Label>
        <Input id="ev-inv" name="investimento" placeholder="R$ (opcional)" inputMode="decimal" />
      </div>
      <Button type="submit" disabled={pendente}>
        {pendente ? "Criando…" : "Criar evento"}
      </Button>
      {estado.erro && (
        <p role="alert" className="w-full text-[13px] text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}

export function ExcluirEvento({ eventoId }: { eventoId: string }) {
  const [pendente, iniciar] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pendente}
      onClick={() => {
        if (window.confirm("Excluir este evento da agenda?")) {
          iniciar(() => excluirEvento(eventoId));
        }
      }}
    >
      {pendente ? "Excluindo…" : "Excluir"}
    </Button>
  );
}
