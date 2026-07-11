"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { salvarMeta } from "./actions";

/** Campo de meta com salvamento ao sair do campo (Enter ou blur). */
export function MetaInput({
  anoMes,
  unidadeId,
  vendedor,
  valorAtual,
}: {
  anoMes: string;
  unidadeId: string | null;
  vendedor: string | null;
  valorAtual: number | null;
}) {
  const [texto, setTexto] = useState(
    valorAtual !== null ? String(valorAtual).replace(".", ",") : "",
  );
  const [pendente, iniciar] = useTransition();
  const [estado, setEstado] = useState<"ok" | "erro" | null>(null);

  function salvar() {
    const valor = texto.trim() === "" ? 0 : Number(texto.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(valor)) {
      setEstado("erro");
      return;
    }
    iniciar(async () => {
      const r = await salvarMeta({ anoMes, unidadeId, vendedor, valor });
      setEstado(r.ok ? "ok" : "erro");
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[13px] text-muted-3">R$</span>
      <Input
        className="h-8 w-32 text-right tabular-nums"
        inputMode="decimal"
        placeholder="—"
        value={texto}
        disabled={pendente}
        onChange={(e) => {
          setTexto(e.target.value);
          setEstado(null);
        }}
        onBlur={salvar}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      <span className="w-4 text-[13px]" aria-live="polite">
        {pendente ? "…" : estado === "ok" ? "✓" : estado === "erro" ? "✗" : ""}
      </span>
    </span>
  );
}
