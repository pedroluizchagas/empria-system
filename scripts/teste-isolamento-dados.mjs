/**
 * Teste de isolamento — Fase 1 · Central de Dados.
 * Verifica o RLS de modelo_mapeamento, importacao e fato_venda:
 * uma empresa NUNCA enxerga (nem escreve) os dados da outra, e
 * colaborador lê mas não importa.
 *
 * Autossuficiente: cria duas empresas temporárias e apaga tudo no final —
 * seguro para rodar contra um banco com dados reais.
 * Uso: npm run db:teste-dados
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltam variáveis de ambiente (URL, ANON_KEY, SERVICE_ROLE_KEY).");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let falhas = 0;
function checar(descricao, condicao) {
  console.log(`${condicao ? "  ✓" : "  ✗ FALHOU:"} ${descricao}`);
  if (!condicao) falhas += 1;
}

async function criarEmpresaTeste(rotulo) {
  const sufixo = Date.now();
  const { data: empresa, error } = await admin
    .from("empresa")
    .insert({ nome: `Teste ${rotulo}`, slug: `teste-${rotulo}-${sufixo}` })
    .select("id")
    .single();
  if (error) throw new Error(`criar empresa ${rotulo}: ${error.message}`);

  const { data: unidade, error: erroUnidade } = await admin
    .from("unidade")
    .insert({ empresa_id: empresa.id, nome: `Loja ${rotulo}`, tipo: "loja" })
    .select("id")
    .single();
  if (erroUnidade) throw new Error(`criar unidade ${rotulo}: ${erroUnidade.message}`);

  return { empresaId: empresa.id, unidadeId: unidade.id };
}

async function criarUsuarioTeste(rotulo, empresaId, papel) {
  const email = `teste-dados-${rotulo}-${Date.now()}@empria.dev`;
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
    nome: `Teste ${rotulo}`,
    email,
    papel,
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

async function main() {
  console.log("Teste de isolamento — Empria Fase 1 · Central de Dados\n");

  const criados = { usuarios: [], empresas: [] };

  try {
    const A = await criarEmpresaTeste("a");
    const B = await criarEmpresaTeste("b");
    criados.empresas.push(A.empresaId, B.empresaId);

    const gerenteA = await criarUsuarioTeste("gerente-a", A.empresaId, "gerente");
    const gerenteB = await criarUsuarioTeste("gerente-b", B.empresaId, "gerente");
    const colaboradorA = await criarUsuarioTeste("colab-a", A.empresaId, "colaborador");
    criados.usuarios.push(gerenteA.id, gerenteB.id, colaboradorA.id);

    // ---- gerente A importa ----
    console.log("Gerente da empresa A:");
    const { data: importacao, error: erroImportacao } = await gerenteA.cliente
      .from("importacao")
      .insert({
        empresa_id: A.empresaId,
        unidade_id: A.unidadeId,
        tipo_dado: "vendas",
        arquivo_nome: "teste.xlsx",
        linhas_total: 2,
        linhas_aceitas: 2,
        periodo_inicio: "2026-06-01",
        periodo_fim: "2026-06-02",
      })
      .select("id")
      .single();
    checar("consegue registrar importação", !erroImportacao && Boolean(importacao));

    const { error: erroFatos } = await gerenteA.cliente.from("fato_venda").insert([
      {
        empresa_id: A.empresaId,
        unidade_id: A.unidadeId,
        importacao_id: importacao.id,
        linha_origem: 2,
        data: "2026-06-01",
        valor: 100.5,
      },
      {
        empresa_id: A.empresaId,
        unidade_id: A.unidadeId,
        importacao_id: importacao.id,
        linha_origem: 3,
        data: "2026-06-02",
        valor: 200.0,
      },
    ]);
    checar("consegue gravar vendas", !erroFatos);

    const { error: erroModelo } = await gerenteA.cliente.from("modelo_mapeamento").insert({
      empresa_id: A.empresaId,
      tipo_dado: "vendas",
      nome: "Modelo teste",
      assinatura: `assinatura-teste-${Date.now()}`,
      mapeamento: { data: 0, valor: 1 },
    });
    checar("consegue salvar modelo de mapeamento", !erroModelo);

    // ---- gerente B não enxerga nada de A ----
    console.log("\nGerente da empresa B:");
    const { data: vendasB } = await gerenteB.cliente.from("fato_venda").select("id");
    checar("NÃO vê vendas da empresa A", (vendasB?.length ?? 0) === 0);

    const { data: importacoesB } = await gerenteB.cliente.from("importacao").select("id");
    checar("NÃO vê importações da empresa A", (importacoesB?.length ?? 0) === 0);

    const { data: modelosB } = await gerenteB.cliente.from("modelo_mapeamento").select("id");
    checar("NÃO vê modelos da empresa A", (modelosB?.length ?? 0) === 0);

    const { data: invasao, error: erroInvasao } = await gerenteB.cliente
      .from("fato_venda")
      .insert({
        empresa_id: A.empresaId,
        unidade_id: A.unidadeId,
        importacao_id: importacao.id,
        linha_origem: 99,
        data: "2026-06-03",
        valor: 1,
      })
      .select();
    checar(
      "NÃO consegue gravar venda na empresa A",
      Boolean(erroInvasao) || (invasao?.length ?? 0) === 0,
    );

    const { data: desfeitaPorB } = await gerenteB.cliente
      .from("importacao")
      .update({ status: "desfeita" })
      .eq("id", importacao.id)
      .select();
    checar("NÃO consegue desfazer importação da empresa A", (desfeitaPorB?.length ?? 0) === 0);

    // ---- colaborador A lê, mas não importa ----
    console.log("\nColaborador da empresa A:");
    const { data: vendasColab } = await colaboradorA.cliente.from("fato_venda").select("id");
    checar("vê as vendas da própria empresa", (vendasColab?.length ?? 0) === 2);

    const { data: importacaoColab, error: erroColab } = await colaboradorA.cliente
      .from("importacao")
      .insert({
        empresa_id: A.empresaId,
        unidade_id: A.unidadeId,
        tipo_dado: "vendas",
        arquivo_nome: "colab.xlsx",
      })
      .select();
    checar(
      "NÃO consegue importar (escrita é de proprietário/gerente)",
      Boolean(erroColab) || (importacaoColab?.length ?? 0) === 0,
    );

    // ---- metas (Fase 2): mesma régua de isolamento ----
    console.log("\nMetas (Fase 2):");
    const { error: erroMeta } = await gerenteA.cliente.from("meta").insert({
      empresa_id: A.empresaId,
      ano_mes: "2026-06-01",
      unidade_id: A.unidadeId,
      vendedor: "Ana",
      valor: 50000,
    });
    checar("gerente define meta de vendedor", !erroMeta);

    const { data: metasB } = await gerenteB.cliente.from("meta").select("id");
    checar("outra empresa NÃO vê as metas", (metasB?.length ?? 0) === 0);

    const { data: metaInvasao, error: erroMetaInvasao } = await gerenteB.cliente
      .from("meta")
      .insert({ empresa_id: A.empresaId, ano_mes: "2026-06-01", valor: 1 })
      .select();
    checar(
      "outra empresa NÃO define meta alheia",
      Boolean(erroMetaInvasao) || (metaInvasao?.length ?? 0) === 0,
    );

    const { data: metasColab } = await colaboradorA.cliente.from("meta").select("valor");
    checar("colaborador vê a meta (a própria régua)", (metasColab?.length ?? 0) === 1);

    const { data: metaColab, error: erroMetaColab } = await colaboradorA.cliente
      .from("meta")
      .insert({ empresa_id: A.empresaId, ano_mes: "2026-07-01", valor: 10 })
      .select();
    checar(
      "colaborador NÃO define metas",
      Boolean(erroMetaColab) || (metaColab?.length ?? 0) === 0,
    );

    // ---- agenda, tarefas e comunicados (Fase 3) ----
    console.log("\nAgenda, tarefas e comunicados (Fase 3):");
    const { error: erroEvento } = await gerenteA.cliente.from("evento_agenda").insert({
      empresa_id: A.empresaId,
      tipo: "campanha",
      titulo: "Campanha teste",
      inicio: "2026-06-10",
      fim: "2026-06-20",
    });
    checar("gerente cria evento na agenda", !erroEvento);

    const { data: eventosB } = await gerenteB.cliente.from("evento_agenda").select("id");
    checar("outra empresa NÃO vê a agenda", (eventosB?.length ?? 0) === 0);

    const { data: eventoColab, error: erroEventoColab } = await colaboradorA.cliente
      .from("evento_agenda")
      .insert({ empresa_id: A.empresaId, titulo: "Invasão", inicio: "2026-06-01" })
      .select();
    checar(
      "colaborador NÃO cria evento",
      Boolean(erroEventoColab) || (eventoColab?.length ?? 0) === 0,
    );

    const { data: tarefaCriada, error: erroTarefa } = await gerenteA.cliente
      .from("tarefa")
      .insert({
        empresa_id: A.empresaId,
        titulo: "Trocar vitrine",
        responsavel_id: colaboradorA.id,
      })
      .select("id")
      .single();
    checar("gerente delega tarefa ao colaborador", !erroTarefa && Boolean(tarefaCriada));

    const { data: tarefaConcluida } = await colaboradorA.cliente
      .from("tarefa")
      .update({ status: "concluida" })
      .eq("id", tarefaCriada.id)
      .select("id");
    checar("responsável conclui a própria tarefa", (tarefaConcluida?.length ?? 0) === 1);

    const { data: tarefaB } = await gerenteB.cliente
      .from("tarefa")
      .update({ status: "aberta" })
      .eq("id", tarefaCriada.id)
      .select("id");
    checar("outra empresa NÃO mexe na tarefa", (tarefaB?.length ?? 0) === 0);

    const { error: erroComunicado } = await gerenteA.cliente.from("comunicado").insert({
      empresa_id: A.empresaId,
      titulo: "Meta batida",
    });
    checar("gerente publica comunicado", !erroComunicado);

    const { data: comunicadosB } = await gerenteB.cliente.from("comunicado").select("id");
    checar("outra empresa NÃO vê o mural", (comunicadosB?.length ?? 0) === 0);

    // ---- desfazer de verdade, como gerente A ----
    console.log("\nDesfazer (gerente A):");
    const { error: erroDesfazerFatos } = await gerenteA.cliente
      .from("fato_venda")
      .delete()
      .eq("importacao_id", importacao.id);
    const { error: erroDesfazerStatus } = await gerenteA.cliente
      .from("importacao")
      .update({ status: "desfeita", desfeita_em: new Date().toISOString() })
      .eq("id", importacao.id);
    const { data: restantes } = await gerenteA.cliente
      .from("fato_venda")
      .select("id")
      .eq("importacao_id", importacao.id);
    checar(
      "remove as vendas e marca a importação como desfeita",
      !erroDesfazerFatos && !erroDesfazerStatus && (restantes?.length ?? 0) === 0,
    );
  } finally {
    for (const id of criados.usuarios) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
    // apagar a empresa leva unidades, importações e fatos junto (cascade)
    if (criados.empresas.length > 0) {
      await admin.from("empresa").delete().in("id", criados.empresas);
    }
  }

  console.log(
    falhas === 0
      ? "\n✓ ISOLAMENTO OK — Central de Dados protegida por RLS."
      : `\n✗ ${falhas} verificação(ões) falharam.`,
  );
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error("Erro no teste:", erro.message);
  process.exit(1);
});
