-- =============================================================
-- Empria · Fase 3 — Tarefas (ESCOPO.md §5.4)
-- Delegação: responsável, unidade e prazo. O gerente distribui
-- funções e acompanha sem sair do sistema.
-- =============================================================

create type public.status_tarefa as enum ('aberta', 'concluida');

create table public.tarefa (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresa (id) on delete cascade,
  titulo         text not null,
  descricao      text,
  responsavel_id uuid references public.pessoa (id) on delete set null,
  unidade_id     uuid references public.unidade (id) on delete cascade,
  prazo          date,
  status         public.status_tarefa not null default 'aberta',
  concluida_em   timestamptz,
  criado_por     uuid references public.pessoa (id) on delete set null,
  criado_em      timestamptz not null default now()
);
create index tarefa_empresa_idx on public.tarefa (empresa_id, status, prazo);

alter table public.tarefa enable row level security;

create policy tarefa_leitura on public.tarefa
  for select using (empresa_id = public.empria_empresa_atual());

-- Gestão completa por proprietário/gerente/líder.
create policy tarefa_gestao on public.tarefa
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  );

-- O responsável conclui (ou reabre) a própria tarefa.
create policy tarefa_responsavel on public.tarefa
  for update using (
    empresa_id = public.empria_empresa_atual()
    and responsavel_id = auth.uid()
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and responsavel_id = auth.uid()
  );
