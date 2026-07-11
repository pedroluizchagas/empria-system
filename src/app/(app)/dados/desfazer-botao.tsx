"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { desfazerImportacao } from "./actions";

export function DesfazerBotao({ importacaoId }: { importacaoId: string }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={pendente}
        onClick={() => {
          if (!window.confirm("Desfazer esta importação? As vendas dela saem dos painéis na hora.")) {
            return;
          }
          iniciar(async () => {
            const r = await desfazerImportacao(importacaoId);
            setErro(r.ok ? null : r.erro);
          });
        }}
      >
        {pendente ? "Desfazendo…" : "Desfazer"}
      </Button>
      {erro && <span className="text-[12px] text-destructive">{erro}</span>}
    </span>
  );
}
