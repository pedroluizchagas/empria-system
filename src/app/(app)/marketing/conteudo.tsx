"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CANAIS_CONTEUDO,
  ROTULO_CANAL,
  STATUS_CONTEUDO,
  type CanalConteudo,
  type StatusConteudo,
} from "@/lib/dominio";
import { formatarData } from "@/lib/formato";
import { criarConteudo, excluirConteudo, moverConteudo, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { ok: false, erro: null };

export interface Pauta {
  id: string;
  titulo: string;
  canal: CanalConteudo;
  status: StatusConteudo;
  data_publicacao: string | null;
  responsavel: { nome: string } | null;
}

export function NovaPauta({ pessoas }: { pessoas: { id: string; nome: string }[] }) {
  const [estado, acao, pendente] = useActionState(criarConteudo, estadoInicial);

  return (
    <form action={acao} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-52 flex-1 flex-col gap-1.5">
        <Label htmlFor="ct-titulo">Pauta</Label>
        <Input id="ct-titulo" name="titulo" placeholder="Ex.: Reels look do fim de semana" required />
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <Label htmlFor="ct-canal">Canal</Label>
        <Select id="ct-canal" name="canal" defaultValue="instagram">
          {CANAIS_CONTEUDO.map((c) => (
            <option key={c} value={c}>
              {ROTULO_CANAL[c]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-44 flex-col gap-1.5">
        <Label htmlFor="ct-resp">Responsável</Label>
        <Select id="ct-resp" name="responsavel_id" defaultValue="">
          <option value="">Sem responsável</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <Label htmlFor="ct-data">Publicar em</Label>
        <Input id="ct-data" name="data_publicacao" type="date" />
      </div>
      <Button type="submit" disabled={pendente}>
        {pendente ? "Criando…" : "Adicionar à pauta"}
      </Button>
      {estado.erro && (
        <p role="alert" className="w-full text-[13px] text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}

export function CardPauta({ pauta, editor }: { pauta: Pauta; editor: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const indice = STATUS_CONTEUDO.indexOf(pauta.status);

  function mover(delta: number) {
    const novo = STATUS_CONTEUDO[indice + delta];
    if (!novo) return;
    iniciar(async () => {
      const r = await moverConteudo(pauta.id, novo);
      setErro(r.ok ? null : r.erro);
    });
  }

  return (
    <div className="rounded-card border border-border bg-surface p-3">
      <p className="text-[13px] font-medium leading-snug">{pauta.titulo}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="neutro">{ROTULO_CANAL[pauta.canal]}</Badge>
        {pauta.data_publicacao && (
          <span className="text-[11px] text-muted-3">{formatarData(pauta.data_publicacao)}</span>
        )}
      </div>
      {pauta.responsavel && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{pauta.responsavel.nome}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="flex gap-1">
          <button
            type="button"
            aria-label="Voltar etapa"
            disabled={pendente || indice === 0}
            onClick={() => mover(-1)}
            className="rounded-control p-1 text-muted-2 hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Avançar etapa"
            disabled={pendente || indice === STATUS_CONTEUDO.length - 1}
            onClick={() => mover(1)}
            className="rounded-control p-1 text-muted-2 hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
          >
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </button>
        </span>
        {editor && (
          <button
            type="button"
            aria-label="Excluir pauta"
            disabled={pendente}
            onClick={() => {
              if (window.confirm("Excluir esta pauta?")) {
                iniciar(() => excluirConteudo(pauta.id));
              }
            }}
            className="rounded-control p-1 text-muted-3 hover:bg-surface-2 hover:text-destructive"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
      {erro && <p className="mt-1 text-[11px] text-destructive">{erro}</p>}
    </div>
  );
}
