-- =============================================================
-- Empria · Fase 3 — Comunicados (ESCOPO.md §5.4)
-- Mural para a equipe: aviso de meta batida, mudança de campanha.
-- =============================================================

create table public.comunicado (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresa (id) on delete cascade,
  titulo      text not null,
  corpo       text,
  criado_por  uuid references public.pessoa (id) on delete set null,
  criado_em   timestamptz not null default now()
);
create index comunicado_empresa_idx on public.comunicado (empresa_id, criado_em desc);

alter table public.comunicado enable row level security;

create policy comunicado_leitura on public.comunicado
  for select using (empresa_id = public.empria_empresa_atual());
create policy comunicado_escrita on public.comunicado
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente', 'lider')
  );
