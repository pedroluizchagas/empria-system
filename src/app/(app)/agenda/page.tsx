import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabela, Th, Td } from "@/components/ui/table";
import {
  ROTULO_TIPO_EVENTO,
  type EventoAgenda,
  type Unidade,
} from "@/lib/dominio";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { hojeSaoPaulo } from "@/lib/metas";
import { datasDoVarejoNoPeriodo } from "@/lib/varejo";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";
import { NovoEvento, ExcluirEvento } from "./novo-evento";
import { NovaTarefa, TarefaCheck, ExcluirTarefa } from "./tarefas";
import { NovoComunicado, ExcluirComunicado } from "./comunicados";

interface Comunicado {
  id: string;
  titulo: string;
  corpo: string | null;
  criado_em: string;
  autor: { nome: string } | null;
}

interface Tarefa {
  id: string;
  titulo: string;
  prazo: string | null;
  status: "aberta" | "concluida";
  responsavel: { nome: string } | null;
  unidade: { nome: string } | null;
}

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage() {
  if (!isSupabaseConfigurado()) {
    return (
      <>
        <PageHeader eyebrow="Agenda & Tarefas" titulo="Agenda central" />
        <EmptyState
          icon={CalendarDays}
          titulo="A linha do tempo única da empresa"
          descricao="Modo prévia — configure o Supabase para registrar campanhas, liquidações, inventários e feriados."
        />
      </>
    );
  }

  const contexto = await obterContexto();
  const papel = contexto?.pessoa?.papel;
  const editor = !!papel && ["proprietario", "gerente", "lider"].includes(papel);

  const supabase = await createClient();
  const [
    { data: dataEventos },
    { data: dataUnidades },
    { data: dataTarefas },
    { data: dataPessoas },
    { data: dataComunicados },
  ] =
    await Promise.all([
      supabase
        .from("evento_agenda")
        .select("*, unidade(nome)")
        .order("inicio", { ascending: false })
        .limit(100),
      supabase.from("unidade").select("id, nome").eq("ativa", true).order("nome"),
      supabase
        .from("tarefa")
        .select("id, titulo, prazo, status, responsavel:pessoa!tarefa_responsavel_id_fkey(nome), unidade(nome)")
        .order("status")
        .order("prazo", { ascending: true, nullsFirst: false })
        .limit(100),
      supabase.from("pessoa").select("id, nome").order("nome"),
      supabase
        .from("comunicado")
        .select("id, titulo, corpo, criado_em, autor:pessoa!comunicado_criado_por_fkey(nome)")
        .order("criado_em", { ascending: false })
        .limit(20),
    ]);
  const eventos =
    (dataEventos as (EventoAgenda & { unidade: Pick<Unidade, "nome"> | null })[]) ?? [];
  const unidades = dataUnidades ?? [];
  const tarefas = (dataTarefas as unknown as Tarefa[]) ?? [];
  const pessoas = dataPessoas ?? [];
  const comunicados = (dataComunicados as unknown as Comunicado[]) ?? [];
  const hoje = hojeSaoPaulo();
  const fimJanela = `${Number(hoje.slice(0, 4))}-12-31`;
  const datasVarejo = datasDoVarejoNoPeriodo(hoje, fimJanela).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Agenda & Tarefas"
        titulo="Agenda central"
        descricao="Campanhas, liquidações, troca de coleção, inventários e feriados — sobrepostos aos gráficos de venda."
      />

      <Card className="mb-4">
        <CardLabel>Próximas datas do varejo (pré-carregadas)</CardLabel>
        <div className="mt-1 flex flex-wrap gap-2">
          {datasVarejo.map((d) => (
            <Badge key={d.data} variant="info">
              {d.nome} · {formatarData(d.data)}
            </Badge>
          ))}
        </div>
      </Card>

      {editor && (
        <Card className="mb-4">
          <CardLabel>Novo evento</CardLabel>
          <NovoEvento unidades={unidades} />
        </Card>
      )}

      {eventos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          titulo="Nenhum evento ainda"
          descricao="Cadastre a primeira campanha ou liquidação — ela aparece sobreposta ao gráfico de vendas do período."
        />
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Período</Th>
              <Th>Evento</Th>
              <Th>Tipo</Th>
              <Th>Unidade</Th>
              <Th className="text-right">Investimento</Th>
              {editor && <Th />}
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr key={ev.id}>
                <Td className="whitespace-nowrap tabular-nums">
                  {formatarData(ev.inicio)}
                  {ev.fim && ev.fim !== ev.inicio ? ` – ${formatarData(ev.fim)}` : ""}
                </Td>
                <Td className="font-medium">{ev.titulo}</Td>
                <Td>
                  <Badge variant={ev.tipo === "campanha" || ev.tipo === "liquidacao" ? "info" : "neutro"}>
                    {ROTULO_TIPO_EVENTO[ev.tipo]}
                  </Badge>
                </Td>
                <Td>{ev.unidade?.nome ?? "Empresa toda"}</Td>
                <Td className="text-right tabular-nums">
                  {ev.investimento !== null ? formatarMoeda(ev.investimento) : "—"}
                </Td>
                {editor && (
                  <Td className="text-right">
                    <ExcluirEvento eventoId={ev.id} />
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-medium tracking-[-0.02em]">
          Tarefas
        </h2>
        {editor && (
          <Card className="mb-4">
            <CardLabel>Delegar</CardLabel>
            <NovaTarefa pessoas={pessoas} unidades={unidades} />
          </Card>
        )}
        {tarefas.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa — delegue a primeira e acompanhe sem sair do sistema.
            </p>
          </Card>
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th />
                <Th>Tarefa</Th>
                <Th>Responsável</Th>
                <Th>Unidade</Th>
                <Th>Prazo</Th>
                {editor && <Th />}
              </tr>
            </thead>
            <tbody>
              {tarefas.map((t) => {
                const atrasada = t.status === "aberta" && t.prazo !== null && t.prazo < hoje;
                return (
                  <tr key={t.id} className={t.status === "concluida" ? "opacity-55" : ""}>
                    <Td className="w-10">
                      <TarefaCheck tarefaId={t.id} concluida={t.status === "concluida"} />
                    </Td>
                    <Td className={`font-medium ${t.status === "concluida" ? "line-through" : ""}`}>
                      {t.titulo}
                    </Td>
                    <Td>{t.responsavel?.nome ?? "—"}</Td>
                    <Td>{t.unidade?.nome ?? "Empresa toda"}</Td>
                    <Td className="whitespace-nowrap">
                      {t.prazo ? (
                        atrasada ? (
                          <Badge variant="erro">venceu {formatarData(t.prazo)}</Badge>
                        ) : (
                          formatarData(t.prazo)
                        )
                      ) : (
                        "—"
                      )}
                    </Td>
                    {editor && (
                      <Td className="text-right">
                        <ExcluirTarefa tarefaId={t.id} />
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-medium tracking-[-0.02em]">
          Comunicados
        </h2>
        {editor && (
          <Card className="mb-4">
            <CardLabel>Publicar no mural</CardLabel>
            <NovoComunicado />
          </Card>
        )}
        {comunicados.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              Mural vazio — avise a equipe de uma meta batida ou mudança de campanha.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {comunicados.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.titulo}</p>
                    {c.corpo && (
                      <p className="mt-1 text-sm text-muted-foreground">{c.corpo}</p>
                    )}
                    <p className="mt-2 text-[12px] text-muted-3">
                      {c.autor?.nome ?? "—"} · {formatarData(c.criado_em.slice(0, 10))}
                    </p>
                  </div>
                  {editor && <ExcluirComunicado comunicadoId={c.id} />}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
