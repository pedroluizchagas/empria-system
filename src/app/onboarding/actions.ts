"use server";

import { redirect } from "next/navigation";
import { gerarSlug } from "@/lib/slug";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface EstadoOnboarding {
  erro: string | null;
}

export async function criarEmpresa(
  _anterior: EstadoOnboarding,
  formData: FormData,
): Promise<EstadoOnboarding> {
  if (!isSupabaseConfigurado()) {
    return { erro: "Ambiente não configurado (veja o README)." };
  }

  const nomeEmpresa = String(formData.get("nome_empresa") ?? "").trim();
  const nomePessoa = String(formData.get("nome_pessoa") ?? "").trim();

  if (nomeEmpresa.length < 2) {
    return { erro: "Informe o nome da empresa." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("empria_criar_empresa", {
    p_nome: nomeEmpresa,
    p_slug: gerarSlug(nomeEmpresa) || "empresa",
    p_nome_pessoa: nomePessoa || null,
  });

  if (error) {
    if (error.message.includes("usuario_ja_vinculado")) {
      redirect("/painel");
    }
    return { erro: "Não foi possível criar a empresa. Tente novamente." };
  }

  redirect("/painel");
}
