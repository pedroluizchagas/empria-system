import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardLabel } from "@/components/ui/card";
import { Tabela, Th, Td } from "@/components/ui/table";
import {
  ROTULO_TIPO_DADO,
  type Importacao,
  type ModeloMapeamento,
  type Unidade,
} from "@/lib/dominio";
import { formatarData, formatarDataHora } from "@/lib/formato";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { ehGestor, obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";
import { DesfazerBotao } from "./desfazer-botao";
import { Importador } from "./importador";

export const metadata: Metadata = { title: "Central de Dados" };

const UNIDADE_PREVIA = [{ id: "previa", nome: "Loja Exemplo" }];

export default async function DadosPage() {
  const configurado = isSupabaseConfigurado();

  let unidades: { id: string; nome: string }[] = UNIDADE_PREVIA;
  let modelos: ModeloMapeamento[] = [];
  let importacoes: (Importacao & { unidade: Pick<Unidade, "nome"> | null })[] = [];
  let gestor = true;

  if (configurado) {
    const contexto = await obterContexto();
    gestor = ehGestor(contexto?.pessoa ?? null);

    const supabase = await createClient();
    const [{ data: dataUnidades }, { data: dataModelos }, { data: dataImportacoes }] =
      await Promise.all([
        supabase
          .from("unidade")
          .select("id, nome")
          .eq("ativa", true)
          .order("nome"),
        supabase.from("modelo_mapeamento").select("*"),
        supabase
          .from("importacao")
          .select("*, unidade(nome)")
          .order("criado_em", { ascending: false })
          .limit(30),
      ]);

    unidades = dataUnidades ?? [];
    modelos = (dataModelos as ModeloMapeamento[]) ?? [];
    importacoes =
      (dataImportacoes as (Importacao & { unidade: Pick<Unidade, "nome"> | null })[]) ??
      [];
  }

  return (
    <>
      <PageHeader
        eyebrow="Central de Dados"
        titulo="Importações"
        descricao="A única tarefa manual do Empria: soltar o arquivo. Mapeamento, validação e organização ficam com o sistema."
      />

      <div className="grid grid-cols-3 gap-4 max-[1000px]:grid-cols-1">
        {!gestor ? (
          <Card className="col-span-2 max-[1000px]:col-span-1">
            <CardLabel>Nova importação</CardLabel>
            <p className="text-sm text-muted-foreground">
              Importar dados é uma ação de proprietário ou gerente. Peça a quem
              gerencia sua empresa — ou um papel com permissão de importação.
            </p>
          </Card>
        ) : configurado && unidades.length === 0 ? (
          <Card className="col-span-2 max-[1000px]:col-span-1">
            <CardLabel>Nova importação</CardLabel>
            <p className="text-sm text-muted-foreground">
              Antes da primeira planilha, cadastre ao menos uma unidade em{" "}
              <Link href="/admin" className="text-primary underline-offset-2 hover:underline">
                Administração
              </Link>
              . Cada importação pertence a uma unidade — é isso que permite comparar lojas.
            </p>
          </Card>
        ) : (
          <Importador
            configurado={configurado}
            unidades={unidades}
            modelos={modelos}
          />
        )}

        <div className="flex flex-col gap-4">
          <Card>
            <CardLabel>Modelos de mapeamento</CardLabel>
            {modelos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Na primeira planilha de cada origem você confirma as colunas uma
                única vez; das próximas, é só soltar o arquivo.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {modelos.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{m.nome}</span>
                    <Badge variant="neutro">{ROTULO_TIPO_DADO[m.tipo_dado]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardLabel>Regra da casa</CardLabel>
            <p className="text-sm text-muted-foreground">
              Toda importação é validada, rastreável até a linha e{" "}
              <strong className="font-medium text-foreground">
                reversível em um clique
              </strong>
              .
            </p>
          </Card>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-medium tracking-[-0.02em]">
          Histórico de importações
        </h2>
        {importacoes.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              {configurado
                ? "Nenhuma importação ainda — a primeira planilha inaugura o histórico."
                : "Modo prévia — o histórico aparece quando o Supabase estiver configurado."}
            </p>
          </Card>
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Quando</Th>
                <Th>Arquivo</Th>
                <Th>Tipo</Th>
                <Th>Unidade</Th>
                <Th>Período</Th>
                <Th className="text-right">Linhas</Th>
                <Th>Status</Th>
                {gestor && <Th />}
              </tr>
            </thead>
            <tbody>
              {importacoes.map((imp) => (
                <tr key={imp.id}>
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {formatarDataHora(imp.criado_em)}
                  </Td>
                  <Td className="max-w-56 truncate font-medium" title={imp.arquivo_nome}>
                    {imp.arquivo_nome}
                  </Td>
                  <Td>{ROTULO_TIPO_DADO[imp.tipo_dado]}</Td>
                  <Td>{imp.unidade?.nome ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {imp.periodo_inicio && imp.periodo_fim
                      ? `${formatarData(imp.periodo_inicio)} – ${formatarData(imp.periodo_fim)}`
                      : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {imp.linhas_aceitas.toLocaleString("pt-BR")}
                    {imp.linhas_ignoradas > 0 && (
                      <span
                        className="text-muted-3"
                        title={`${imp.linhas_ignoradas} linhas ignoradas`}
                      >
                        {" "}
                        / {imp.linhas_total.toLocaleString("pt-BR")}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {imp.status === "concluida" ? (
                      <Badge variant="ok">Concluída</Badge>
                    ) : (
                      <Badge variant="neutro">Desfeita</Badge>
                    )}
                  </Td>
                  {gestor && (
                    <Td className="text-right">
                      {imp.status === "concluida" && (
                        <DesfazerBotao importacaoId={imp.id} />
                      )}
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </section>
    </>
  );
}
