/**
 * Cria dois usuários de desenvolvimento (um por empresa do seed) para
 * testar login e isolamento manualmente.
 *
 *   ana@moda-aurora.dev   → gerente da Moda Aurora
 *   bruno@vestta.dev      → proprietário da Vestta Confecções
 *   senha (ambos):          empria-dev-123
 *
 * Uso: npm run db:usuarios-dev
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error("Faltam variáveis no .env.local (URL, SERVICE_ROLE_KEY).");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USUARIOS = [
  {
    email: "ana@moda-aurora.dev",
    nome: "Ana Gerente",
    papel: "gerente",
    empresa_id: "11111111-1111-1111-1111-111111111111",
  },
  {
    email: "bruno@vestta.dev",
    nome: "Bruno Proprietário",
    papel: "proprietario",
    empresa_id: "22222222-2222-2222-2222-222222222222",
  },
];
const SENHA = "empria-dev-123";

async function obterIdPorEmail(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data?.users.find((u) => u.email === email)?.id ?? null;
}

for (const usuario of USUARIOS) {
  let id;
  const { data, error } = await admin.auth.admin.createUser({
    email: usuario.email,
    password: SENHA,
    email_confirm: true,
    user_metadata: { nome: usuario.nome },
  });

  if (error) {
    id = await obterIdPorEmail(usuario.email);
    if (!id) {
      console.error(`✗ ${usuario.email}: ${error.message}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`• ${usuario.email} já existia`);
  } else {
    id = data.user.id;
    console.log(`✓ ${usuario.email} criado`);
  }

  const { error: erroPessoa } = await admin.from("pessoa").upsert({
    id,
    empresa_id: usuario.empresa_id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  });
  if (erroPessoa) {
    console.error(`✗ vínculo de ${usuario.email}: ${erroPessoa.message}`);
    process.exitCode = 1;
  }
}

console.log(`\nSenha de ambos: ${SENHA}`);
