/**
 * Teste de isolamento multi-tenant (critério de pronto da Fase 0):
 * duas empresas convivem no mesmo banco e uma NUNCA enxerga a outra.
 *
 * Pré-requisitos: migrations + seed aplicados (supabase db reset).
 * Uso: npm run db:teste-isolamento
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltam variáveis no .env.local (URL, ANON_KEY, SERVICE_ROLE_KEY).");
  process.exit(1);
}

const EMPRESA_A = "11111111-1111-1111-1111-111111111111"; // Moda Aurora
const EMPRESA_B = "22222222-2222-2222-2222-222222222222"; // Vestta

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let falhas = 0;
function checar(descricao, condicao) {
  console.log(`${condicao ? "  ✓" : "  ✗ FALHOU:"} ${descricao}`);
  if (!condicao) falhas += 1;
}

async function criarUsuarioTeste(rotulo, empresaId) {
  const email = `teste-${rotulo}-${Date.now()}@empria.dev`;
  const senha = "senha-de-teste-123";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error) throw new Error(`criar usuário ${rotulo}: ${error.message}`);

  const { error: erroPessoa } = await admin.from("pessoa").insert({
    id: data.user.id,
    empresa_id: empresaId,
    nome: `Teste ${rotulo.toUpperCase()}`,
    email,
    papel: "gerente",
  });
  if (erroPessoa) throw new Error(`vincular pessoa ${rotulo}: ${erroPessoa.message}`);

  const cliente = createClient(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: erroLogin } = await cliente.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (erroLogin) throw new Error(`login ${rotulo}: ${erroLogin.message}`);

  return { id: data.user.id, cliente };
}

async function verificarIsolamento(rotulo, cliente, minhaEmpresa, outraEmpresa) {
  console.log(`\nUsuário da empresa ${rotulo}:`);

  const { data: unidades } = await cliente.from("unidade").select("empresa_id");
  checar(
    `vê unidades apenas da própria empresa (${unidades?.length ?? 0} encontradas)`,
    (unidades?.length ?? 0) > 0 &&
      unidades.every((u) => u.empresa_id === minhaEmpresa),
  );

  const { data: empresas } = await cliente.from("empresa").select("id");
  checar(
    "vê somente a própria empresa",
    empresas?.length === 1 && empresas[0].id === minhaEmpresa,
  );

  const { data: pessoas } = await cliente.from("pessoa").select("empresa_id");
  checar(
    "vê pessoas apenas da própria empresa",
    (pessoas?.length ?? 0) > 0 &&
      pessoas.every((p) => p.empresa_id === minhaEmpresa),
  );

  const { data: inserido, error: erroInsercao } = await cliente
    .from("unidade")
    .insert({ empresa_id: outraEmpresa, nome: "Invasão", tipo: "loja" })
    .select();
  checar(
    "NÃO consegue criar unidade na outra empresa",
    Boolean(erroInsercao) || (inserido?.length ?? 0) === 0,
  );

  const { data: alterado } = await cliente
    .from("empresa")
    .update({ nome: "Hackeada" })
    .eq("id", outraEmpresa)
    .select();
  checar("NÃO consegue alterar a outra empresa", (alterado?.length ?? 0) === 0);
}

async function main() {
  console.log("Teste de isolamento — Empria Fase 0\n");

  const { data: seed } = await admin
    .from("empresa")
    .select("id")
    .in("id", [EMPRESA_A, EMPRESA_B]);
  if ((seed?.length ?? 0) < 2) {
    console.error("Seed não encontrado. Rode antes: npx supabase db reset");
    process.exit(1);
  }

  const usuarioA = await criarUsuarioTeste("a", EMPRESA_A);
  const usuarioB = await criarUsuarioTeste("b", EMPRESA_B);

  try {
    await verificarIsolamento("A (Moda Aurora)", usuarioA.cliente, EMPRESA_A, EMPRESA_B);
    await verificarIsolamento("B (Vestta)", usuarioB.cliente, EMPRESA_B, EMPRESA_A);
  } finally {
    await admin.auth.admin.deleteUser(usuarioA.id);
    await admin.auth.admin.deleteUser(usuarioB.id);
  }

  console.log(
    falhas === 0
      ? "\n✓ ISOLAMENTO OK — critério de pronto da Fase 0 atendido."
      : `\n✗ ${falhas} verificação(ões) falharam.`,
  );
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error("Erro no teste:", erro.message);
  process.exit(1);
});
