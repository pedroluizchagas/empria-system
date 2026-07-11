"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { formatarMesAno } from "@/lib/formato";

export function FiltrosVendas({
  meses,
  mesAtual,
  unidades,
  unidadeAtual,
}: {
  meses: string[]; // "2026-07", mais recente primeiro
  mesAtual: string;
  unidades: { id: string; nome: string }[];
  unidadeAtual: string; // "" = todas
}) {
  const router = useRouter();
  const params = useSearchParams();

  function atualizar(chave: string, valor: string) {
    const novos = new URLSearchParams(params.toString());
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    router.push(`/vendas?${novos.toString()}`);
  }

  return (
    <div className="flex gap-2.5">
      <Select
        aria-label="Mês"
        className="w-44"
        value={mesAtual}
        onChange={(e) => atualizar("mes", e.target.value)}
      >
        {meses.map((mes) => (
          <option key={mes} value={mes}>
            {formatarMesAno(mes)}
          </option>
        ))}
      </Select>
      {unidades.length > 1 && (
        <Select
          aria-label="Unidade"
          className="w-44"
          value={unidadeAtual}
          onChange={(e) => atualizar("unidade", e.target.value)}
        >
          <option value="">Todas as unidades</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
