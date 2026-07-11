import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";

async function sair() {
  "use server";
  if (isSupabaseConfigurado()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const configurado = isSupabaseConfigurado();
  let usuario: { nome: string; email: string } | null = null;
  let nomeEmpresa: string | null = null;

  if (configurado) {
    const contexto = await obterContexto();
    if (!contexto) redirect("/login");
    if (!contexto.pessoa) redirect("/onboarding");

    usuario = { nome: contexto.pessoa.nome, email: contexto.email };
    nomeEmpresa = contexto.empresa?.nome ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!configurado && (
        <p className="border-b border-warning/30 bg-warning/10 px-10 py-2 text-center text-[12px] text-[#8a6119]">
          Modo prévia — Supabase não configurado. Copie{" "}
          <code className="font-medium">.env.example</code> para{" "}
          <code className="font-medium">.env.local</code> para ativar login e
          dados (veja o README).
        </p>
      )}
      <AppNav
        usuario={usuario}
        nomeEmpresa={nomeEmpresa}
        configurado={configurado}
        sair={sair}
      />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-10 py-10 max-[1000px]:px-5">
        {children}
      </main>
    </div>
  );
}
