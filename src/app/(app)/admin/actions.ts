"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { PAPEIS, TIPOS_UNIDADE, type Papel, type TipoUnidade } from "@/lib/dominio";
import { createAdminClient, isServiceRoleConfigurado } from "@/lib/supabase/admin";
import { ehGestor, obterContexto, type Contexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";

export interface EstadoAcao {
  ok: boolean;
  erro: string | null;
  /** Senha temporária gerada num convite — exibida uma única vez. */
  senha?: string;
}

const SEM_PERMISSAO: EstadoAcao = {
  ok: false,
  erro: "Apenas proprietário ou gerente podem fazer isso.",
};

async function exigirGestor(): Promise<Contexto | null> {
  const contexto = await obterContexto();
  if (!contexto?.pessoa || !ehGestor(contexto.pessoa)) return null;
  return contexto;
}

// ---------- Unidades ----------

export async function criarUnidade(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const contexto = await exigirGestor();
  if (!contexto?.pessoa) return SEM_PERMISSAO;

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as TipoUnidade;
  const cidade = String(formData.get("cidade") ?? "").trim();

  if (nome.length < 2) return { ok: false, erro: "Informe o nome da unidade." };
  if (!TIPOS_UNIDADE.includes(tipo)) {
    return { ok: false, erro: "Tipo de unidade inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("unidade").insert({
    empresa_id: contexto.pessoa.empresa_id,
    nome,
    tipo,
    cidade: cidade || null,
  });

  if (error) return { ok: false, erro: "Não foi possível criar a unidade." };

  revalidatePath("/admin");
  return { ok: true, erro: null };
}

export async function alternarUnidade(
  unidadeId: string,
  ativa: boolean,
): Promise<void> {
  const contexto = await exigirGestor();
  if (!contexto) return;

  const supabase = await createClient();
  await supabase.from("unidade").update({ ativa }).eq("id", unidadeId);
  revalidatePath("/admin");
}

// ---------- Setores ----------

export async function criarSetor(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const contexto = await exigirGestor();
  if (!contexto?.pessoa) return SEM_PERMISSAO;

  const nome = String(formData.get("nome") ?? "").trim();
  if (nome.length < 2) return { ok: false, erro: "Informe o nome do setor." };

  const supabase = await createClient();
  const { error } = await supabase.from("setor").insert({
    empresa_id: contexto.pessoa.empresa_id,
    nome,
  });

  if (error) {
    const duplicado = error.code === "23505";
    return {
      ok: false,
      erro: duplicado ? "Já existe um setor com esse nome." : "Não foi possível criar o setor.",
    };
  }

  revalidatePath("/admin");
  return { ok: true, erro: null };
}

export async function excluirSetor(setorId: string): Promise<void> {
  const contexto = await exigirGestor();
  if (!contexto) return;

  const supabase = await createClient();
  await supabase.from("setor").delete().eq("id", setorId);
  revalidatePath("/admin");
}

// ---------- Pessoas (convite) ----------

export async function convidarPessoa(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const contexto = await exigirGestor();
  if (!contexto?.pessoa) return SEM_PERMISSAO;

  if (!isServiceRoleConfigurado()) {
    return {
      ok: false,
      erro: "Convites exigem a SUPABASE_SERVICE_ROLE_KEY no .env.local (veja o README).",
    };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const papel = String(formData.get("papel") ?? "") as Papel;
  const setorId = String(formData.get("setor_id") ?? "");

  if (nome.length < 2) return { ok: false, erro: "Informe o nome da pessoa." };
  if (!email.includes("@")) return { ok: false, erro: "E-mail inválido." };
  if (!PAPEIS.includes(papel)) return { ok: false, erro: "Papel inválido." };
  if (papel === "proprietario" && contexto.pessoa.papel !== "proprietario") {
    return { ok: false, erro: "Só o proprietário pode conceder o papel de proprietário." };
  }

  // Senha temporária legível: o gestor repassa e a pessoa troca depois.
  const senha = `empria-${randomBytes(6).toString("base64url")}`;

  const admin = createAdminClient();
  const { data: criado, error: erroAuth } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (erroAuth || !criado.user) {
    const jaExiste =
      erroAuth?.code === "email_exists" ||
      erroAuth?.message.toLowerCase().includes("already");
    return {
      ok: false,
      erro: jaExiste
        ? "Já existe um usuário com esse e-mail."
        : "Não foi possível criar o usuário.",
    };
  }

  const { error: erroPessoa } = await admin.from("pessoa").insert({
    id: criado.user.id,
    empresa_id: contexto.pessoa.empresa_id,
    nome,
    email,
    papel,
    setor_id: setorId || null,
  });

  if (erroPessoa) {
    // rollback: não deixar usuário órfão sem vínculo
    await admin.auth.admin.deleteUser(criado.user.id);
    return { ok: false, erro: "Não foi possível vincular a pessoa à empresa." };
  }

  revalidatePath("/admin");
  return { ok: true, erro: null, senha };
}
