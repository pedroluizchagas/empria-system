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
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";
import { NovoEvento, ExcluirEvento } from "./novo-evento";

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
  const [{ data: dataEventos }, { data: dataUnidades }] = await Promise.all([
    supabase
      .from("evento_agenda")
      .select("*, unidade(nome)")
      .order("inicio", { ascending: false })
      .limit(100),
    supabase.from("unidade").select("id, nome").eq("ativa", true).order("nome"),
  ]);
  const eventos =
    (dataEventos as (EventoAgenda & { unidade: Pick<Unidade, "nome"> | null })[]) ?? [];
  const unidades = dataUnidades ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Agenda & Tarefas"
        titulo="Agenda central"
        descricao="Campanhas, liquidações, troca de coleção, inventários e feriados — sobrepostos aos gráficos de venda."
      />

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
    </>
  );
}
