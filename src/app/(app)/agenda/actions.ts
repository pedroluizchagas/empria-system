"use server";

import { revalidatePath } from "next/cache";
import { TIPOS_EVENTO, type TipoEvento } from "@/lib/dominio";
import { obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";

export interface EstadoAcao {
  ok: boolean;
  erro: string | null;
}

/** Agenda é escrita por proprietário, gerente ou líder de setor (RLS confere). */
async function exigirEditor() {
  const contexto = await obterContexto();
  const papel = contexto?.pessoa?.papel;
  if (!papel || !["proprietario", "gerente", "lider"].includes(papel)) return null;
  return contexto;
}

export async function criarEvento(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) {
    return { ok: false, erro: "Apenas proprietário, gerente ou líder criam eventos." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as TipoEvento;
  const inicio = String(formData.get("inicio") ?? "");
  const fim = String(formData.get("fim") ?? "");
  const unidadeId = String(formData.get("unidade_id") ?? "");
  const investimentoTexto = String(formData.get("investimento") ?? "").trim();

  if (titulo.length < 2) return { ok: false, erro: "Dê um título ao evento." };
  if (!TIPOS_EVENTO.includes(tipo)) return { ok: false, erro: "Tipo inválido." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return { ok: false, erro: "Informe a data de início." };
  if (fim && fim < inicio) return { ok: false, erro: "O fim não pode vir antes do início." };

  const investimento = investimentoTexto
    ? Number(investimentoTexto.replace(/\./g, "").replace(",", "."))
    : null;
  if (investimento !== null && Number.isNaN(investimento)) {
    return { ok: false, erro: "Investimento inválido — use 1.234,56." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("evento_agenda").insert({
    empresa_id: contexto.pessoa.empresa_id,
    tipo,
    titulo,
    inicio,
    fim: fim || null,
    unidade_id: unidadeId || null,
    investimento,
    criado_por: contexto.pessoa.id,
  });
  if (error) return { ok: false, erro: "Não foi possível criar o evento." };

  revalidatePath("/agenda");
  revalidatePath("/vendas");
  return { ok: true, erro: null };
}

export async function excluirEvento(eventoId: string): Promise<void> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) return;

  const supabase = await createClient();
  await supabase
    .from("evento_agenda")
    .delete()
    .eq("id", eventoId)
    .eq("empresa_id", contexto.pessoa.empresa_id);
  revalidatePath("/agenda");
  revalidatePath("/vendas");
}
