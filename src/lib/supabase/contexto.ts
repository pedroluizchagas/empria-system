import { cache } from "react";
import type { Empresa, Pessoa } from "@/lib/dominio";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface Contexto {
  userId: string;
  email: string;
  /** null = usuário autenticado mas ainda sem empresa (vai para onboarding). */
  pessoa: Pessoa | null;
  empresa: Empresa | null;
}

export function ehGestor(pessoa: Pessoa | null): boolean {
  return pessoa?.papel === "proprietario" || pessoa?.papel === "gerente";
}

/** Contexto apenas quando quem chama é proprietário/gerente; null caso contrário. */
export async function exigirGestor(): Promise<Contexto | null> {
  const contexto = await obterContexto();
  if (!contexto?.pessoa || !ehGestor(contexto.pessoa)) return null;
  return contexto;
}

/** Usuário + vínculo com empresa, memoizado por request. null = não autenticado. */
export const obterContexto = cache(async (): Promise<Contexto | null> => {
  if (!isSupabaseConfigurado()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pessoa } = await supabase
    .from("pessoa")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let empresa: Empresa | null = null;
  if (pessoa) {
    const { data } = await supabase
      .from("empresa")
      .select("*")
      .eq("id", pessoa.empresa_id)
      .maybeSingle();
    empresa = data as Empresa | null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    pessoa: pessoa as Pessoa | null,
    empresa,
  };
});
