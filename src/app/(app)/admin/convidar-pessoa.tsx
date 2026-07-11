"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PAPEIS, ROTULO_PAPEL, type Setor } from "@/lib/dominio";
import { convidarPessoa, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { ok: false, erro: null };

interface ConvidarPessoaProps {
  setores: Setor[];
  podeConcederProprietario: boolean;
}

export function ConvidarPessoa({
  setores,
  podeConcederProprietario,
}: ConvidarPessoaProps) {
  const [estado, acao, pendente] = useActionState(convidarPessoa, estadoInicial);

  const papeisDisponiveis = PAPEIS.filter(
    (papel) => papel !== "proprietario" || podeConcederProprietario,
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={acao} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor="pessoa-nome">Nome</Label>
          <Input id="pessoa-nome" name="nome" placeholder="Nome completo" required minLength={2} />
        </div>
        <div className="flex min-w-52 flex-1 flex-col gap-1.5">
          <Label htmlFor="pessoa-email">E-mail</Label>
          <Input id="pessoa-email" name="email" type="email" placeholder="pessoa@empresa.com.br" required />
        </div>
        <div className="flex w-44 flex-col gap-1.5">
          <Label htmlFor="pessoa-papel">Papel</Label>
          <Select id="pessoa-papel" name="papel" defaultValue="colaborador">
            {papeisDisponiveis.map((papel) => (
              <option key={papel} value={papel}>
                {ROTULO_PAPEL[papel]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex w-44 flex-col gap-1.5">
          <Label htmlFor="pessoa-setor">Setor</Label>
          <Select id="pessoa-setor" name="setor_id" defaultValue="">
            <option value="">Sem setor</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Convidando…" : "Convidar"}
        </Button>
        {estado.erro && (
          <p role="alert" className="w-full text-[13px] text-destructive">
            {estado.erro}
          </p>
        )}
      </form>

      {estado.ok && estado.senha && (
        <div className="rounded-control border border-success/30 bg-success/10 px-4 py-3 text-[13px]">
          <p className="font-medium text-success">Pessoa convidada!</p>
          <p className="mt-1 text-muted-foreground">
            Senha temporária (aparece só agora — copie e envie junto com o
            e-mail de acesso):{" "}
            <code className="rounded-control bg-surface px-1.5 py-0.5 font-medium text-foreground">
              {estado.senha}
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
