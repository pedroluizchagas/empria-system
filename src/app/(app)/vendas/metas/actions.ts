"use server";

import { revalidatePath } from "next/cache";
import { exigirGestor } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";

export interface EntradaMeta {
  anoMes: string; // "2026-07"
  unidadeId: string | null;
  vendedor: string | null;
  /** 0 ou negativo remove a meta. */
  valor: number;
}

export async function salvarMeta(
  entrada: EntradaMeta,
): Promise<{ ok: boolean; erro: string | null }> {
  const contexto = await exigirGestor();
  if (!contexto?.pessoa) {
    return { ok: false, erro: "Apenas proprietário ou gerente definem metas." };
  }
  if (!/^\d{4}-\d{2}$/.test(entrada.anoMes)) {
    return { ok: false, erro: "Mês inválido." };
  }
  if (entrada.vendedor !== null && entrada.unidadeId === null) {
    return { ok: false, erro: "Meta de vendedor precisa de unidade." };
  }

  const supabase = await createClient();
  const empresaId = contexto.pessoa.empresa_id;
  const anoMesData = `${entrada.anoMes}-01`;

  // localizar meta existente no mesmo escopo (null ≠ '' — filtros is/eq)
  let consulta = supabase
    .from("meta")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("ano_mes", anoMesData);
  consulta =
    entrada.unidadeId === null
      ? consulta.is("unidade_id", null)
      : consulta.eq("unidade_id", entrada.unidadeId);
  consulta =
    entrada.vendedor === null
      ? consulta.is("vendedor", null)
      : consulta.eq("vendedor", entrada.vendedor);
  const { data: existente } = await consulta.maybeSingle();

  let erro = null;
  if (entrada.valor <= 0) {
    if (existente) {
      ({ error: erro } = await supabase.from("meta").delete().eq("id", existente.id));
    }
  } else if (existente) {
    ({ error: erro } = await supabase
      .from("meta")
      .update({ valor: entrada.valor })
      .eq("id", existente.id));
  } else {
    ({ error: erro } = await supabase.from("meta").insert({
      empresa_id: empresaId,
      ano_mes: anoMesData,
      unidade_id: entrada.unidadeId,
      vendedor: entrada.vendedor,
      valor: entrada.valor,
      criado_por: contexto.pessoa.id,
    }));
  }
  if (erro) return { ok: false, erro: "Não foi possível salvar a meta." };

  await supabase.from("auditoria").insert({
    empresa_id: empresaId,
    pessoa_id: contexto.pessoa.id,
    acao: "meta.alterar",
    entidade: "meta",
    entidade_id: `${entrada.anoMes}|${entrada.unidadeId ?? "empresa"}|${entrada.vendedor ?? ""}`,
    detalhes: { valor: entrada.valor },
  });

  revalidatePath("/vendas/metas");
  revalidatePath("/vendas");
  revalidatePath("/painel");
  return { ok: true, erro: null };
}
