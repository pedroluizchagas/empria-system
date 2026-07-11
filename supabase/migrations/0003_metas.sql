-- =============================================================
-- Empria · Fase 2 — Metas em cascata (ESCOPO.md §5.2)
-- Empresa → unidade → vendedor, sempre mensais.
-- Escopo da linha: unidade_id e vendedor nulos = meta da empresa;
-- unidade_id preenchido = meta da unidade; + vendedor = meta individual
-- (vendedor é o nome vindo da planilha, não um usuário).
-- =============================================================

create table public.meta (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresa (id) on delete cascade,
  ano_mes     date not null,                -- sempre dia 1º do mês
  unidade_id  uuid references public.unidade (id) on delete cascade,
  vendedor    text,
  valor       numeric(14,2) not null check (valor >= 0),
  criado_por  uuid references public.pessoa (id) on delete set null,
  criado_em   timestamptz not null default now(),
  constraint meta_dia_primeiro check (extract(day from ano_mes) = 1),
  constraint meta_vendedor_tem_unidade check (vendedor is null or unidade_id is not null),
  unique nulls not distinct (empresa_id, ano_mes, unidade_id, vendedor)
);
create index meta_empresa_mes_idx on public.meta (empresa_id, ano_mes);

alter table public.meta enable row level security;

-- Leitura por qualquer membro (vendedor vê a própria meta e o ranking);
-- escrita por proprietário/gerente.
create policy meta_leitura on public.meta
  for select using (empresa_id = public.empria_empresa_atual());
create policy meta_escrita on public.meta
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );
