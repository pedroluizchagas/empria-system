import type { Metadata } from "next";
import { Building2, Store, Users, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabela, Td, Th } from "@/components/ui/table";
import {
  ROTULO_PAPEL,
  ROTULO_TIPO_UNIDADE,
  type Pessoa,
  type Setor,
  type Unidade,
} from "@/lib/dominio";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { ehGestor, obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";
import { alternarUnidade, excluirSetor } from "./actions";
import { ConvidarPessoa } from "./convidar-pessoa";
import { NovaUnidade } from "./nova-unidade";
import { NovoSetor } from "./novo-setor";

export const metadata: Metadata = { title: "Administração" };

export default async function AdminPage() {
  if (!isSupabaseConfigurado()) return <AdminPrevia />;

  const contexto = await obterContexto();
  const pessoaAtual = contexto!.pessoa!;
  const empresa = contexto!.empresa!;
  const gestor = ehGestor(pessoaAtual);

  const supabase = await createClient();
  const [{ data: unidades }, { data: setores }, { data: pessoas }] =
    await Promise.all([
      supabase.from("unidade").select("*").order("criado_em"),
      supabase.from("setor").select("*").order("nome"),
      supabase.from("pessoa").select("*").order("nome"),
    ]);

  const listaUnidades = (unidades ?? []) as Unidade[];
  const listaSetores = (setores ?? []) as Setor[];
  const listaPessoas = (pessoas ?? []) as Pessoa[];
  const nomeSetor = new Map(listaSetores.map((s) => [s.id, s.nome]));

  return (
    <>
      <PageHeader
        eyebrow={`Administração · ${empresa.nome}`}
        titulo="Empresa, unidades e pessoas"
        descricao={
          gestor
            ? "A estrutura que define o que cada pessoa vê no Empria."
            : "Visualização — cadastros são feitos por proprietário ou gerente."
        }
      >
        <Badge variant="info">{ROTULO_PAPEL[pessoaAtual.papel]}</Badge>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <Card>
          <CardLabel>Empresa</CardLabel>
          <CardTitle>{empresa.nome}</CardTitle>
          <CardDescription>
            Identificador: {empresa.slug} · criada em{" "}
            {new Date(empresa.criado_em).toLocaleDateString("pt-BR")}
          </CardDescription>
        </Card>

        <Card>
          <CardLabel>Unidades</CardLabel>
          <CardTitle className="mb-1">Lojas, e-commerce, fábrica</CardTitle>
          <CardDescription className="mb-4">
            {listaUnidades.length === 0
              ? "Nenhuma unidade ainda — crie a primeira abaixo."
              : `${listaUnidades.length} unidade(s) cadastrada(s).`}
          </CardDescription>

          {listaUnidades.length > 0 && (
            <Tabela className="mb-5">
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Tipo</Th>
                  <Th>Cidade</Th>
                  <Th>Status</Th>
                  {gestor && <Th className="w-28" />}
                </tr>
              </thead>
              <tbody>
                {listaUnidades.map((unidade) => (
                  <tr key={unidade.id} className="hover:bg-surface-2">
                    <Td className="font-medium">{unidade.nome}</Td>
                    <Td>{ROTULO_TIPO_UNIDADE[unidade.tipo]}</Td>
                    <Td className="text-muted-foreground">
                      {unidade.cidade ?? "—"}
                    </Td>
                    <Td>
                      {unidade.ativa ? (
                        <Badge variant="ok">Ativa</Badge>
                      ) : (
                        <Badge variant="neutro">Inativa</Badge>
                      )}
                    </Td>
                    {gestor && (
                      <Td className="text-right">
                        <form
                          action={alternarUnidade.bind(
                            null,
                            unidade.id,
                            !unidade.ativa,
                          )}
                        >
                          <Button variant="ghost" size="sm" type="submit">
                            {unidade.ativa ? "Desativar" : "Reativar"}
                          </Button>
                        </form>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}

          {gestor && <NovaUnidade />}
        </Card>

        <Card>
          <CardLabel>Setores</CardLabel>
          <CardTitle className="mb-1">Áreas da empresa</CardTitle>
          <CardDescription className="mb-4">
            Comercial, marketing, estoque… — usados para delimitar o que cada
            pessoa vê.
          </CardDescription>

          {listaSetores.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {listaSetores.map((setor) => (
                <span
                  key={setor.id}
                  className="inline-flex items-center gap-1.5 rounded-control bg-surface-2 py-1 pl-3 pr-1.5 text-[13px] text-foreground"
                >
                  {setor.nome}
                  {gestor && (
                    <form action={excluirSetor.bind(null, setor.id)}>
                      <button
                        type="submit"
                        aria-label={`Excluir setor ${setor.nome}`}
                        className="flex size-5 items-center justify-center rounded-control text-muted-3 transition-colors hover:bg-surface hover:text-destructive"
                      >
                        <X className="size-3.5" strokeWidth={2} />
                      </button>
                    </form>
                  )}
                </span>
              ))}
            </div>
          )}

          {gestor && <NovoSetor />}
        </Card>

        <Card>
          <CardLabel>Pessoas</CardLabel>
          <CardTitle className="mb-1">Quem vê o quê</CardTitle>
          <CardDescription className="mb-4">
            Login individual; o painel se monta conforme papel, setor e
            unidades.
          </CardDescription>

          <Tabela className="mb-5">
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>E-mail</Th>
                <Th>Papel</Th>
                <Th>Setor</Th>
              </tr>
            </thead>
            <tbody>
              {listaPessoas.map((pessoa) => (
                <tr key={pessoa.id} className="hover:bg-surface-2">
                  <Td className="font-medium">
                    {pessoa.nome}
                    {pessoa.id === pessoaAtual.id && (
                      <span className="ml-2 text-[11px] text-muted-3">você</span>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">{pessoa.email}</Td>
                  <Td>
                    <Badge
                      variant={pessoa.papel === "proprietario" ? "info" : "neutro"}
                    >
                      {ROTULO_PAPEL[pessoa.papel]}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {pessoa.setor_id
                      ? (nomeSetor.get(pessoa.setor_id) ?? "—")
                      : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>

          {gestor && (
            <ConvidarPessoa
              setores={listaSetores}
              podeConcederProprietario={pessoaAtual.papel === "proprietario"}
            />
          )}
        </Card>
      </div>
    </>
  );
}

/** Versão exibida sem Supabase configurado (modo prévia). */
function AdminPrevia() {
  return (
    <>
      <PageHeader
        eyebrow="Administração"
        titulo="Empresa, unidades e pessoas"
        descricao="A estrutura organizacional que define o que cada pessoa vê: Empresa → Unidades → Setores → Pessoas."
      />
      <div className="grid grid-cols-3 gap-4 max-[1000px]:grid-cols-1">
        {[
          {
            icone: Building2,
            rotulo: "Empresa",
            titulo: "Dados da empresa",
            texto: "Criada no primeiro acesso, no fluxo de onboarding.",
          },
          {
            icone: Store,
            rotulo: "Unidades",
            titulo: "Lojas, e-commerce, fábrica",
            texto: "Cadastro completo com tipo, cidade e status.",
          },
          {
            icone: Users,
            rotulo: "Pessoas e papéis",
            titulo: "Quem vê o quê",
            texto: "Convites com papel, setor e senha temporária.",
          },
        ].map((item) => (
          <Card key={item.rotulo}>
            <span className="mb-3 flex size-9 items-center justify-center rounded-control bg-surface-2 text-muted-2">
              <item.icone className="size-4" strokeWidth={1.5} />
            </span>
            <CardLabel>{item.rotulo}</CardLabel>
            <CardTitle>{item.titulo}</CardTitle>
            <CardDescription className="mt-1">{item.texto}</CardDescription>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-[13px] text-muted-3">
        Conecte o Supabase (README) para ativar cadastro, convites e login.
      </p>
    </>
  );
}
