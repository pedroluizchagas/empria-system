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

// ---------- Tarefas ----------

export async function criarTarefa(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) {
    return { ok: false, erro: "Apenas proprietário, gerente ou líder criam tarefas." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const responsavelId = String(formData.get("responsavel_id") ?? "");
  const unidadeId = String(formData.get("unidade_id") ?? "");
  const prazo = String(formData.get("prazo") ?? "");

  if (titulo.length < 2) return { ok: false, erro: "Descreva a tarefa." };

  const supabase = await createClient();
  const { error } = await supabase.from("tarefa").insert({
    empresa_id: contexto.pessoa.empresa_id,
    titulo,
    responsavel_id: responsavelId || null,
    unidade_id: unidadeId || null,
    prazo: prazo || null,
    criado_por: contexto.pessoa.id,
  });
  if (error) return { ok: false, erro: "Não foi possível criar a tarefa." };

  revalidatePath("/agenda");
  return { ok: true, erro: null };
}

export async function alternarTarefa(
  tarefaId: string,
  concluida: boolean,
): Promise<{ ok: boolean; erro: string | null }> {
  const contexto = await obterContexto();
  if (!contexto?.pessoa) return { ok: false, erro: "Sessão expirada." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("tarefa")
    .update({
      status: concluida ? "concluida" : "aberta",
      concluida_em: concluida ? new Date().toISOString() : null,
    })
    .eq("id", tarefaId)
    .eq("empresa_id", contexto.pessoa.empresa_id)
    .select("id");

  // RLS: só gestor/líder ou o responsável — 0 linhas = sem permissão
  if (!data || data.length === 0) {
    return { ok: false, erro: "Só o responsável (ou quem gerencia) conclui esta tarefa." };
  }
  revalidatePath("/agenda");
  return { ok: true, erro: null };
}

export async function excluirTarefa(tarefaId: string): Promise<void> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) return;

  const supabase = await createClient();
  await supabase
    .from("tarefa")
    .delete()
    .eq("id", tarefaId)
    .eq("empresa_id", contexto.pessoa.empresa_id);
  revalidatePath("/agenda");
}

// ---------- Comunicados ----------

export async function criarComunicado(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) {
    return { ok: false, erro: "Apenas proprietário, gerente ou líder publicam comunicados." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  if (titulo.length < 2) return { ok: false, erro: "Dê um título ao comunicado." };

  const supabase = await createClient();
  const { error } = await supabase.from("comunicado").insert({
    empresa_id: contexto.pessoa.empresa_id,
    titulo,
    corpo: corpo || null,
    criado_por: contexto.pessoa.id,
  });
  if (error) return { ok: false, erro: "Não foi possível publicar." };

  revalidatePath("/agenda");
  return { ok: true, erro: null };
}

export async function excluirComunicado(comunicadoId: string): Promise<void> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) return;

  const supabase = await createClient();
  await supabase
    .from("comunicado")
    .delete()
    .eq("id", comunicadoId)
    .eq("empresa_id", contexto.pessoa.empresa_id);
  revalidatePath("/agenda");
}
