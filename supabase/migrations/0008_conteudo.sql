-- =============================================================
-- Empria · Fase 3 — Calendário de conteúdo (ESCOPO.md §5.3)
-- Pauta por canal com fluxo ideia → produção → aprovação → publicado.
-- =============================================================

create type public.canal_conteudo as enum (
  'instagram', 'tiktok', 'whatsapp', 'facebook', 'email', 'outro'
);

create type public.status_conteudo as enum (
  'ideia', 'producao', 'aprovacao', 'publicado'
);

create table public.conteudo (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresa (id) on delete cascade,
  titulo          text not null,
  canal           public.canal_conteudo not null default 'instagram',
  status          public.status_conteudo not null default 'ideia',
  responsavel_id  uuid references public.pessoa (id) on delete set null,
  data_publicacao date,
  criado_por      uuid references public.pessoa (id) on delete set null,
  criado_em       timestamptz not null default now()
);
create index conteudo_empresa_idx on public.conteudo (empresa_id, status, data_publicacao);

alter table public.conteudo enable row level security;

create policy conteudo_leitura on public.conteudo
  for select using (empresa_id = public.empria_empresa_atual());

-- Gestão por proprietário/gerente/líder (o social media é líder do setor).
create policy conteudo_gestao on public.conteudo
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  );

-- O responsável move a própria pauta pelo fluxo.
create policy conteudo_responsavel on public.conteudo
  for update using (
    empresa_id = public.empria_empresa_atual()
    and responsavel_id = auth.uid()
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and responsavel_id = auth.uid()
  );
