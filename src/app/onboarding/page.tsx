import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { obterContexto } from "@/lib/supabase/contexto";
import { FormularioOnboarding } from "./formulario";

export const metadata: Metadata = { title: "Criar empresa" };

export default async function OnboardingPage() {
  if (!isSupabaseConfigurado()) redirect("/painel");

  const contexto = await obterContexto();
  if (!contexto) redirect("/login");
  if (contexto.pessoa) redirect("/painel");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5">
      <Logo />
      <FormularioOnboarding email={contexto.email} />
      <p className="max-w-sm text-center text-[12px] leading-relaxed text-muted-3">
        Estrutura do Empria: Empresa → Unidades (lojas, e-commerce, fábrica) →
        Setores → Pessoas.
      </p>
    </div>
  );
}
