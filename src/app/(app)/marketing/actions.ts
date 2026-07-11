"use server";

import { revalidatePath } from "next/cache";
import {
  CANAIS_CONTEUDO,
  STATUS_CONTEUDO,
  type CanalConteudo,
  type StatusConteudo,
} from "@/lib/dominio";
import { obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";

export interface EstadoAcao {
  ok: boolean;
  erro: string | null;
}

async function exigirEditor() {
  const contexto = await obterContexto();
  const papel = contexto?.pessoa?.papel;
  if (!papel || !["proprietario", "gerente", "lider"].includes(papel)) return null;
  return contexto;
}

export async function criarConteudo(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) {
    return { ok: false, erro: "Apenas proprietário, gerente ou líder criam pautas." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const canal = String(formData.get("canal") ?? "") as CanalConteudo;
  const responsavelId = String(formData.get("responsavel_id") ?? "");
  const dataPublicacao = String(formData.get("data_publicacao") ?? "");

  if (titulo.length < 2) return { ok: false, erro: "Descreva a pauta." };
  if (!CANAIS_CONTEUDO.includes(canal)) return { ok: false, erro: "Canal inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("conteudo").insert({
    empresa_id: contexto.pessoa.empresa_id,
    titulo,
    canal,
    responsavel_id: responsavelId || null,
    data_publicacao: dataPublicacao || null,
    criado_por: contexto.pessoa.id,
  });
  if (error) return { ok: false, erro: "Não foi possível criar a pauta." };

  revalidatePath("/marketing");
  return { ok: true, erro: null };
}

export async function moverConteudo(
  conteudoId: string,
  novoStatus: StatusConteudo,
): Promise<EstadoAcao> {
  const contexto = await obterContexto();
  if (!contexto?.pessoa) return { ok: false, erro: "Sessão expirada." };
  if (!STATUS_CONTEUDO.includes(novoStatus)) return { ok: false, erro: "Status inválido." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("conteudo")
    .update({ status: novoStatus })
    .eq("id", conteudoId)
    .eq("empresa_id", contexto.pessoa.empresa_id)
    .select("id");

  // RLS: gestor/líder ou o responsável — 0 linhas = sem permissão
  if (!data || data.length === 0) {
    return { ok: false, erro: "Só o responsável (ou quem gerencia) move esta pauta." };
  }
  revalidatePath("/marketing");
  return { ok: true, erro: null };
}

export async function excluirConteudo(conteudoId: string): Promise<void> {
  const contexto = await exigirEditor();
  if (!contexto?.pessoa) return;

  const supabase = await createClient();
  await supabase
    .from("conteudo")
    .delete()
    .eq("id", conteudoId)
    .eq("empresa_id", contexto.pessoa.empresa_id);
  revalidatePath("/marketing");
}
