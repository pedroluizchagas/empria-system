-- =============================================================
-- Empria · Fase 4 — Estoque (ESCOPO.md §5.5)
-- Posição de estoque via planilha: cada importação é um retrato;
-- o painel usa a posição mais recente por unidade.
-- Mínimo: produto e quantidade; tamanho/cor/custo/coleção desbloqueiam
-- grade, valor de custo e sell-through (princípio 6).
-- =============================================================

create table public.fato_estoque (
  id            bigint generated always as identity primary key,
  empresa_id    uuid not null references public.empresa (id) on delete cascade,
  unidade_id    uuid not null references public.unidade (id) on delete cascade,
  importacao_id uuid not null references public.importacao (id) on delete cascade,
  linha_origem  integer not null,
  data          date not null,        -- data da posição (padrão: dia da importação)
  produto       text not null,
  quantidade    numeric(12,2) not null,
  tamanho       text,
  cor           text,
  categoria     text,
  colecao       text,
  custo         numeric(14,2)
);
create index fato_estoque_empresa_idx on public.fato_estoque (empresa_id, unidade_id, data);
create index fato_estoque_importacao_idx on public.fato_estoque (importacao_id);

alter table public.fato_estoque enable row level security;

create policy fato_estoque_leitura on public.fato_estoque
  for select using (empresa_id = public.empria_empresa_atual());
create policy fato_estoque_escrita on public.fato_estoque
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );
