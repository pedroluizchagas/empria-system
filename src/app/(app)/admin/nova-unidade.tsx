"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROTULO_TIPO_UNIDADE, TIPOS_UNIDADE } from "@/lib/dominio";
import { criarUnidade, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { ok: false, erro: null };

export function NovaUnidade() {
  const [estado, acao, pendente] = useActionState(criarUnidade, estadoInicial);

  return (
    <form action={acao} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-44 flex-1 flex-col gap-1.5">
        <Label htmlFor="unidade-nome">Nome</Label>
        <Input id="unidade-nome" name="nome" placeholder="Ex.: Loja Centro" required minLength={2} />
      </div>
      <div className="flex w-40 flex-col gap-1.5">
        <Label htmlFor="unidade-tipo">Tipo</Label>
        <Select id="unidade-tipo" name="tipo" defaultValue="loja">
          {TIPOS_UNIDADE.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ROTULO_TIPO_UNIDADE[tipo]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-44 flex-col gap-1.5">
        <Label htmlFor="unidade-cidade">Cidade</Label>
        <Input id="unidade-cidade" name="cidade" placeholder="Opcional" />
      </div>
      <Button type="submit" disabled={pendente}>
        {pendente ? "Criando…" : "Criar unidade"}
      </Button>
      {estado.erro && (
        <p role="alert" className="w-full text-[13px] text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
