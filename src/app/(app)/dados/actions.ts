"use server";

import { revalidatePath } from "next/cache";
import type { TipoDado } from "@/lib/dominio";
import { CAMPOS_TRAFEGO, CAMPOS_VENDA } from "@/lib/importacao/campos";
import type { Celula } from "@/lib/importacao/planilha";
import { validarTrafego, validarVendas } from "@/lib/importacao/validar";
import { exigirGestor, type Contexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";

const TAMANHO_LOTE = 1000;

// ---------- Deduplicação (ESCOPO §6: aviso claro se o período já tem dados) ----------

export interface ImportacaoExistente {
  id: string;
  arquivo_nome: string;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  linhas_aceitas: number;
  criado_em: string;
}

export async function verificarPeriodo(
  unidadeId: string,
  tipoDado: TipoDado,
  inicio: string,
  fim: string,
): Promise<ImportacaoExistente[]> {
  const contexto = await exigirGestor();
  if (!contexto?.pessoa) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("importacao")
    .select("id, arquivo_nome, periodo_inicio, periodo_fim, linhas_aceitas, criado_em")
    // o RLS já isola por empresa; o filtro explícito é defesa em profundidade
    .eq("empresa_id", contexto.pessoa.empresa_id)
    .eq("unidade_id", unidadeId)
    .eq("tipo_dado", tipoDado)
    .eq("status", "concluida")
    .lte("periodo_inicio", fim)
    .gte("periodo_fim", inicio)
    .order("criado_em", { ascending: false });

  return (data as ImportacaoExistente[]) ?? [];
}

// ---------- Confirmar importação ----------

export interface EntradaImportacao {
  tipoDado: TipoDado;
  unidadeId: string;
  arquivoNome: string;
  /** Campos mapeados, na ordem das células de cada linha. */
  colunas: string[];
  /** Linhas cruas projetadas nas colunas mapeadas: n = linha no arquivo. */
  linhas: { n: number; c: Celula[] }[];
  /** Modelo aplicado (se reconhecido) — registrado na importação. */
  modeloId: string | null;
  /** Salvar o mapeamento como modelo desta origem. */
  salvarModelo: { nome: string; assinatura: string; mapeamento: Record<string, number> } | null;
  /** Importações a desfazer antes de gravar (opção "substituir"). */
  substituirIds: string[];
}

export interface ResultadoImportacao {
  ok: boolean;
  erro: string | null;
  importacaoId?: string;
  aceitas?: number;
  ignoradas?: number;
}

export async function confirmarImportacao(
  entrada: EntradaImportacao,
): Promise<ResultadoImportacao> {
  const contexto = await exigirGestor();
  if (!contexto?.pessoa) {
    return { ok: false, erro: "Apenas proprietário ou gerente podem importar dados." };
  }
  const camposValidos: Record<string, readonly string[]> = {
    vendas: CAMPOS_VENDA,
    trafego: CAMPOS_TRAFEGO,
  };
  const campos = camposValidos[entrada.tipoDado];
  if (!campos) {
    return { ok: false, erro: "Este tipo de dado ainda não pode ser importado." };
  }
  if (entrada.colunas.some((c) => !campos.includes(c))) {
    return { ok: false, erro: "Mapeamento inválido." };
  }

  const supabase = await createClient();
  const empresaId = contexto.pessoa.empresa_id;

  // unidade precisa ser da empresa (RLS barraria o insert, mas o erro fica claro aqui)
  const { data: unidade } = await supabase
    .from("unidade")
    .select("id")
    .eq("id", entrada.unidadeId)
    .maybeSingle();
  if (!unidade) return { ok: false, erro: "Unidade não encontrada." };

  // Revalida tudo no servidor — a prévia do navegador não é fonte de verdade.
  const mapeamento: Record<string, number> = {};
  entrada.colunas.forEach((campo, i) => {
    mapeamento[campo] = i;
  });
  const linhasCruas = entrada.linhas.map((l) => ({ numero: l.n, celulas: l.c }));
  const resultado =
    entrada.tipoDado === "trafego"
      ? validarTrafego(linhasCruas, mapeamento)
      : validarVendas(linhasCruas, mapeamento);
  const tabelaFato = entrada.tipoDado === "trafego" ? "fato_trafego" : "fato_venda";

  if (resultado.aceitas.length === 0) {
    return { ok: false, erro: "Nenhuma linha válida para importar." };
  }

  // opção "substituir": desfaz as importações sobrepostas antes de gravar
  for (const id of entrada.substituirIds) {
    const erro = await desfazerInterno(id, contexto);
    if (erro) return { ok: false, erro };
  }

  // modelo de mapeamento (salvo antes, para vincular na importação)
  let modeloId = entrada.modeloId;
  if (entrada.salvarModelo) {
    const { data: modelo } = await supabase
      .from("modelo_mapeamento")
      .upsert(
        {
          empresa_id: empresaId,
          tipo_dado: entrada.tipoDado,
          nome: entrada.salvarModelo.nome,
          assinatura: entrada.salvarModelo.assinatura,
          mapeamento: entrada.salvarModelo.mapeamento,
        },
        { onConflict: "empresa_id,tipo_dado,assinatura" },
      )
      .select("id")
      .maybeSingle();
    if (modelo) modeloId = modelo.id;
  }

  const { data: importacao, error: erroImportacao } = await supabase
    .from("importacao")
    .insert({
      empresa_id: empresaId,
      unidade_id: entrada.unidadeId,
      tipo_dado: entrada.tipoDado,
      arquivo_nome: entrada.arquivoNome,
      modelo_id: modeloId,
      linhas_total: entrada.linhas.length,
      linhas_aceitas: resultado.aceitas.length,
      linhas_ignoradas: resultado.ignoradas.length,
      motivos_ignoradas: resultado.ignoradas.slice(0, 100),
      periodo_inicio: resultado.periodoInicio,
      periodo_fim: resultado.periodoFim,
      criado_por: contexto.pessoa.id,
    })
    .select("id")
    .single();

  if (erroImportacao || !importacao) {
    return { ok: false, erro: "Não foi possível registrar a importação." };
  }

  // gravação em lote marcada com o id da importação (é isso que permite desfazer)
  for (let i = 0; i < resultado.aceitas.length; i += TAMANHO_LOTE) {
    const lote = resultado.aceitas.slice(i, i + TAMANHO_LOTE).map((v) => ({
      empresa_id: empresaId,
      unidade_id: entrada.unidadeId,
      importacao_id: importacao.id,
      ...v,
    }));
    const { error: erroLote } = await supabase.from(tabelaFato).insert(lote);
    if (erroLote) {
      // rollback: apagar a importação leva os fatos junto (on delete cascade)
      await supabase.from("importacao").delete().eq("id", importacao.id);
      return { ok: false, erro: "Falha ao gravar as vendas — nada foi importado." };
    }
  }

  await supabase.from("auditoria").insert({
    empresa_id: empresaId,
    pessoa_id: contexto.pessoa.id,
    acao: "importacao.criar",
    entidade: "importacao",
    entidade_id: importacao.id,
    detalhes: {
      arquivo: entrada.arquivoNome,
      unidade_id: entrada.unidadeId,
      linhas_aceitas: resultado.aceitas.length,
      linhas_ignoradas: resultado.ignoradas.length,
    },
  });

  revalidatePath("/dados");
  revalidatePath("/vendas");
  revalidatePath("/painel");
  revalidatePath("/marketing");

  return {
    ok: true,
    erro: null,
    importacaoId: importacao.id,
    aceitas: resultado.aceitas.length,
    ignoradas: resultado.ignoradas.length,
  };
}

// ---------- Desfazer (reversível em um clique) ----------

async function desfazerInterno(
  importacaoId: string,
  contexto: Contexto,
): Promise<string | null> {
  const supabase = await createClient();
  // o RLS já isola por empresa; o filtro explícito é defesa em profundidade
  const empresaId = contexto.pessoa!.empresa_id;

  const { data: importacao } = await supabase
    .from("importacao")
    .select("id, status, arquivo_nome")
    .eq("id", importacaoId)
    .eq("empresa_id", empresaId)
    .maybeSingle();
  if (!importacao) return "Importação não encontrada.";
  if (importacao.status === "desfeita") return "Essa importação já foi desfeita.";

  for (const tabela of ["fato_venda", "fato_trafego"]) {
    const { error: erroFatos } = await supabase
      .from(tabela)
      .delete()
      .eq("importacao_id", importacaoId)
      .eq("empresa_id", empresaId);
    if (erroFatos) return "Não foi possível remover os dados importados.";
  }

  const { error: erroStatus } = await supabase
    .from("importacao")
    .update({ status: "desfeita", desfeita_em: new Date().toISOString() })
    .eq("id", importacaoId)
    .eq("empresa_id", empresaId);
  if (erroStatus) return "Não foi possível marcar a importação como desfeita.";

  await supabase.from("auditoria").insert({
    empresa_id: contexto.pessoa!.empresa_id,
    pessoa_id: contexto.pessoa!.id,
    acao: "importacao.desfazer",
    entidade: "importacao",
    entidade_id: importacaoId,
    detalhes: { arquivo: importacao.arquivo_nome },
  });

  return null;
}

export async function desfazerImportacao(
  importacaoId: string,
): Promise<{ ok: boolean; erro: string | null }> {
  const contexto = await exigirGestor();
  if (!contexto?.pessoa) {
    return { ok: false, erro: "Apenas proprietário ou gerente podem desfazer importações." };
  }

  const erro = await desfazerInterno(importacaoId, contexto);
  if (erro) return { ok: false, erro };

  revalidatePath("/dados");
  revalidatePath("/vendas");
  revalidatePath("/painel");
  return { ok: true, erro: null };
}
