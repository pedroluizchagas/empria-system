-- =============================================================
-- Empria · Fase 1 — Central de Dados (ESCOPO.md §6)
-- Motor de importação: modelos de mapeamento, importações
-- reversíveis e o primeiro fato (vendas).
-- Regras de confiança: rastreável até a linha, reversível,
-- deduplicação por período — tudo marcado com importacao_id.
-- =============================================================

-- ---------- Tipos ----------
create type public.tipo_dado as enum (
  'vendas', 'trafego', 'estoque', 'metas'
);

create type public.status_importacao as enum (
  'concluida', 'desfeita'
);

-- ---------- Tabelas ----------

-- Modelo de mapeamento salvo por origem ("Relatório do sistema X — Loja Centro").
-- assinatura = cabeçalhos normalizados e ordenados; permite reconhecer o
-- arquivo da mesma origem e aplicar o mapeamento sem perguntar de novo.
create table public.modelo_mapeamento (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresa (id) on delete cascade,
  tipo_dado   public.tipo_dado not null,
  nome        text not null,
  assinatura  text not null,
  mapeamento  jsonb not null,   -- { campo_destino: indice_da_coluna_no_arquivo }
  criado_em   timestamptz not null default now(),
  unique (empresa_id, tipo_dado, assinatura)
);
create index modelo_mapeamento_empresa_idx on public.modelo_mapeamento (empresa_id);

-- Cada upload confirmado vira uma importação; desfazer remove os fatos
-- gravados com o id dela e marca status = 'desfeita'.
create table public.importacao (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresa (id) on delete cascade,
  unidade_id        uuid not null references public.unidade (id) on delete cascade,
  tipo_dado         public.tipo_dado not null,
  status            public.status_importacao not null default 'concluida',
  arquivo_nome      text not null,
  modelo_id         uuid references public.modelo_mapeamento (id) on delete set null,
  linhas_total      integer not null default 0,
  linhas_aceitas    integer not null default 0,
  linhas_ignoradas  integer not null default 0,
  motivos_ignoradas jsonb,      -- amostra: [{ linha, motivo }]
  periodo_inicio    date,
  periodo_fim       date,
  criado_por        uuid references public.pessoa (id) on delete set null,
  criado_em         timestamptz not null default now(),
  desfeita_em       timestamptz
);
create index importacao_empresa_idx on public.importacao (empresa_id, criado_em desc);
create index importacao_periodo_idx on public.importacao (empresa_id, unidade_id, tipo_dado, periodo_inicio, periodo_fim);

-- Fato de vendas: só data e valor são obrigatórios; cada coluna opcional
-- presente desbloqueia uma análise (princípio 6 do escopo).
-- linha_origem aponta de volta para a linha da planilha (rastreabilidade).
create table public.fato_venda (
  id            bigint generated always as identity primary key,
  empresa_id    uuid not null references public.empresa (id) on delete cascade,
  unidade_id    uuid not null references public.unidade (id) on delete cascade,
  importacao_id uuid not null references public.importacao (id) on delete cascade,
  linha_origem  integer not null,
  data          date not null,
  hora          time,
  vendedor      text,
  produto       text,
  categoria     text,
  quantidade    numeric(12,2),
  valor         numeric(14,2) not null,
  desconto      numeric(14,2),
  canal         text,
  cupom         text
);
create index fato_venda_empresa_data_idx on public.fato_venda (empresa_id, data);
create index fato_venda_importacao_idx on public.fato_venda (importacao_id);
create index fato_venda_unidade_idx on public.fato_venda (empresa_id, unidade_id, data);

-- ---------- RLS ----------
alter table public.modelo_mapeamento enable row level security;
alter table public.importacao        enable row level security;
alter table public.fato_venda        enable row level security;

-- Leitura por qualquer membro da empresa; escrita por quem importa
-- (proprietário/gerente na Fase 1; líder de setor entra na Fase 2).
create policy modelo_mapeamento_leitura on public.modelo_mapeamento
  for select using (empresa_id = public.empria_empresa_atual());
create policy modelo_mapeamento_escrita on public.modelo_mapeamento
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );

create policy importacao_leitura on public.importacao
  for select using (empresa_id = public.empria_empresa_atual());
create policy importacao_escrita on public.importacao
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );

create policy fato_venda_leitura on public.fato_venda
  for select using (empresa_id = public.empria_empresa_atual());
create policy fato_venda_escrita on public.fato_venda
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );
