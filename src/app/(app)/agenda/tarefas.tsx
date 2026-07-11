"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { alternarTarefa, criarTarefa, excluirTarefa, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { ok: false, erro: null };

export function NovaTarefa({
  pessoas,
  unidades,
}: {
  pessoas: { id: string; nome: string }[];
  unidades: { id: string; nome: string }[];
}) {
  const [estado, acao, pendente] = useActionState(criarTarefa, estadoInicial);

  return (
    <form action={acao} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-52 flex-1 flex-col gap-1.5">
        <Label htmlFor="tf-titulo">Tarefa</Label>
        <Input id="tf-titulo" name="titulo" placeholder="Ex.: Trocar vitrine da coleção de inverno" required />
      </div>
      <div className="flex w-44 flex-col gap-1.5">
        <Label htmlFor="tf-resp">Responsável</Label>
        <Select id="tf-resp" name="responsavel_id" defaultValue="">
          <option value="">Sem responsável</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-40 flex-col gap-1.5">
        <Label htmlFor="tf-unidade">Unidade</Label>
        <Select id="tf-unidade" name="unidade_id" defaultValue="">
          <option value="">Empresa toda</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <Label htmlFor="tf-prazo">Prazo</Label>
        <Input id="tf-prazo" name="prazo" type="date" />
      </div>
      <Button type="submit" disabled={pendente}>
        {pendente ? "Criando…" : "Delegar tarefa"}
      </Button>
      {estado.erro && (
        <p role="alert" className="w-full text-[13px] text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}

export function TarefaCheck({
  tarefaId,
  concluida,
}: {
  tarefaId: string;
  concluida: boolean;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={concluida}
        disabled={pendente}
        onChange={(e) => {
          const marcada = e.target.checked;
          iniciar(async () => {
            const r = await alternarTarefa(tarefaId, marcada);
            setErro(r.ok ? null : r.erro);
          });
        }}
        aria-label={concluida ? "Reabrir tarefa" : "Concluir tarefa"}
      />
      {erro && <span className="text-[12px] text-destructive">{erro}</span>}
    </span>
  );
}

export function ExcluirTarefa({ tarefaId }: { tarefaId: string }) {
  const [pendente, iniciar] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pendente}
      onClick={() => {
        if (window.confirm("Excluir esta tarefa?")) iniciar(() => excluirTarefa(tarefaId));
      }}
    >
      {pendente ? "…" : "Excluir"}
    </Button>
  );
}
