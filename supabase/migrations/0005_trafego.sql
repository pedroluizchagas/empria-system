-- =============================================================
-- Empria · Fase 3 — Tráfego pago (ESCOPO.md §5.3)
-- Relatórios exportados do Gerenciador de Anúncios (Meta) e Google Ads,
-- importados pelo mesmo motor da Central de Dados (reversível/rastreável).
-- =============================================================

create table public.fato_trafego (
  id            bigint generated always as identity primary key,
  empresa_id    uuid not null references public.empresa (id) on delete cascade,
  unidade_id    uuid not null references public.unidade (id) on delete cascade,
  importacao_id uuid not null references public.importacao (id) on delete cascade,
  linha_origem  integer not null,
  data          date not null,
  campanha      text not null,
  investimento  numeric(14,2) not null,
  cliques       numeric(14,0),
  impressoes    numeric(14,0),
  conversoes    numeric(14,2),
  receita       numeric(14,2)      -- valor de conversão → ROAS
);
create index fato_trafego_empresa_data_idx on public.fato_trafego (empresa_id, data);
create index fato_trafego_importacao_idx on public.fato_trafego (importacao_id);

alter table public.fato_trafego enable row level security;

create policy fato_trafego_leitura on public.fato_trafego
  for select using (empresa_id = public.empria_empresa_atual());
create policy fato_trafego_escrita on public.fato_trafego
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );
