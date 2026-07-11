-- =============================================================
-- Empria · Fase 4 — E-commerce (ESCOPO.md §5.6)
-- Relatórios diários exportados das plataformas (Nuvemshop, Shopify,
-- Tray…): sessões, pedidos, receita, frete e devoluções.
-- =============================================================

alter type public.tipo_dado add value if not exists 'ecommerce';

create table public.fato_ecommerce (
  id            bigint generated always as identity primary key,
  empresa_id    uuid not null references public.empresa (id) on delete cascade,
  unidade_id    uuid not null references public.unidade (id) on delete cascade,
  importacao_id uuid not null references public.importacao (id) on delete cascade,
  linha_origem  integer not null,
  data          date not null,
  receita       numeric(14,2) not null,
  sessoes       numeric(14,0),
  pedidos       numeric(14,0),
  frete         numeric(14,2),
  devolucoes    numeric(14,2)
);
create index fato_ecommerce_empresa_idx on public.fato_ecommerce (empresa_id, data);
create index fato_ecommerce_importacao_idx on public.fato_ecommerce (importacao_id);

alter table public.fato_ecommerce enable row level security;

create policy fato_ecommerce_leitura on public.fato_ecommerce
  for select using (empresa_id = public.empria_empresa_atual());
create policy fato_ecommerce_escrita on public.fato_ecommerce
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );
