-- =============================================================
-- Empria · Fase 3 — Agenda central (ESCOPO.md §5.4)
-- A linha do tempo única da empresa: campanhas, liquidações, troca de
-- coleção, inventários, feriados… Todo evento pode ser sobreposto aos
-- gráficos de venda — é o que transforma número em narrativa (§1).
-- =============================================================

create type public.tipo_evento as enum (
  'campanha', 'liquidacao', 'troca_colecao', 'inventario',
  'reuniao', 'treinamento', 'feriado', 'outro'
);

create table public.evento_agenda (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresa (id) on delete cascade,
  tipo         public.tipo_evento not null default 'outro',
  titulo       text not null,
  descricao    text,
  inicio       date not null,
  fim          date,                 -- null = evento de um dia
  unidade_id   uuid references public.unidade (id) on delete cascade,  -- null = empresa toda
  investimento numeric(14,2),        -- campanhas: base do ROAS (tráfego pago na F3)
  criado_por   uuid references public.pessoa (id) on delete set null,
  criado_em    timestamptz not null default now(),
  constraint evento_fim_apos_inicio check (fim is null or fim >= inicio)
);
create index evento_agenda_empresa_idx on public.evento_agenda (empresa_id, inicio);

alter table public.evento_agenda enable row level security;

create policy evento_leitura on public.evento_agenda
  for select using (empresa_id = public.empria_empresa_atual());
create policy evento_escrita on public.evento_agenda
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  );
