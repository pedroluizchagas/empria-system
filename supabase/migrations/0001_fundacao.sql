-- =============================================================
-- Empria · Fase 0 — Fundação multi-tenant
-- Estrutura: Empresa → Unidades → Setores → Pessoas (ESCOPO.md §7)
-- Isolamento por empresa garantido no banco via RLS (DESIGN §9 do escopo).
-- Aplicar em um projeto Supabase (SQL Editor ou `supabase db push`).
-- =============================================================

-- ---------- Tipos ----------
create type public.papel_pessoa as enum (
  'proprietario', 'gerente', 'lider', 'colaborador', 'convidado'
);

create type public.tipo_unidade as enum (
  'loja', 'ecommerce', 'fabrica', 'atacado'
);

-- ---------- Tabelas ----------
create table public.empresa (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  slug       text not null unique,
  criado_em  timestamptz not null default now()
);

create table public.unidade (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresa (id) on delete cascade,
  nome        text not null,
  tipo        public.tipo_unidade not null default 'loja',
  cidade      text,
  ativa       boolean not null default true,
  criado_em   timestamptz not null default now()
);
create index unidade_empresa_idx on public.unidade (empresa_id);

create table public.setor (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresa (id) on delete cascade,
  nome        text not null,
  criado_em   timestamptz not null default now(),
  unique (empresa_id, nome)
);
create index setor_empresa_idx on public.setor (empresa_id);

-- Perfil de acesso: 1 linha por usuário autenticado (auth.users).
create table public.pessoa (
  id          uuid primary key references auth.users (id) on delete cascade,
  empresa_id  uuid not null references public.empresa (id) on delete cascade,
  nome        text not null,
  email       text not null,
  papel       public.papel_pessoa not null default 'colaborador',
  setor_id    uuid references public.setor (id) on delete set null,
  criado_em   timestamptz not null default now()
);
create index pessoa_empresa_idx on public.pessoa (empresa_id);

-- Unidades às quais a pessoa tem acesso (vazio = definido pelo papel).
create table public.pessoa_unidade (
  pessoa_id   uuid not null references public.pessoa (id) on delete cascade,
  unidade_id  uuid not null references public.unidade (id) on delete cascade,
  primary key (pessoa_id, unidade_id)
);

create table public.auditoria (
  id          bigint generated always as identity primary key,
  empresa_id  uuid not null references public.empresa (id) on delete cascade,
  pessoa_id   uuid references public.pessoa (id) on delete set null,
  acao        text not null,           -- ex.: 'importacao.desfazer', 'meta.alterar'
  entidade    text not null,           -- ex.: 'unidade', 'pessoa', 'importacao'
  entidade_id text,
  detalhes    jsonb,
  criado_em   timestamptz not null default now()
);
create index auditoria_empresa_idx on public.auditoria (empresa_id, criado_em desc);

-- ---------- Funções de contexto (usadas pelas policies) ----------
-- security definer para poder ler public.pessoa sem recursão de RLS.
create or replace function public.empria_empresa_atual()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select empresa_id from public.pessoa where id = auth.uid();
$$;

create or replace function public.empria_papel_atual()
returns public.papel_pessoa
language sql stable security definer
set search_path = public
as $$
  select papel from public.pessoa where id = auth.uid();
$$;

-- ---------- RLS ----------
alter table public.empresa        enable row level security;
alter table public.unidade        enable row level security;
alter table public.setor          enable row level security;
alter table public.pessoa         enable row level security;
alter table public.pessoa_unidade enable row level security;
alter table public.auditoria      enable row level security;

-- Empresa: membros leem a própria; só proprietário edita.
create policy empresa_leitura on public.empresa
  for select using (id = public.empria_empresa_atual());
create policy empresa_edicao on public.empresa
  for update using (
    id = public.empria_empresa_atual()
    and public.empria_papel_atual() = 'proprietario'
  );

-- Unidade / Setor: leitura por qualquer membro da empresa;
-- escrita por proprietário ou gerente.
create policy unidade_leitura on public.unidade
  for select using (empresa_id = public.empria_empresa_atual());
create policy unidade_escrita on public.unidade
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );

create policy setor_leitura on public.setor
  for select using (empresa_id = public.empria_empresa_atual());
create policy setor_escrita on public.setor
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );

-- Pessoa: membros veem colegas da mesma empresa;
-- gestão de pessoas é de proprietário/gerente.
-- Só um proprietário pode conceder o papel de proprietário.
create policy pessoa_leitura on public.pessoa
  for select using (empresa_id = public.empria_empresa_atual());
create policy pessoa_escrita on public.pessoa
  for all using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  ) with check (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
    and (public.empria_papel_atual() = 'proprietario' or papel <> 'proprietario')
  );

create policy pessoa_unidade_leitura on public.pessoa_unidade
  for select using (
    exists (
      select 1 from public.pessoa p
      where p.id = pessoa_id and p.empresa_id = public.empria_empresa_atual()
    )
  );
create policy pessoa_unidade_escrita on public.pessoa_unidade
  for all using (
    public.empria_papel_atual() in ('proprietario', 'gerente')
    and exists (
      select 1 from public.pessoa p
      where p.id = pessoa_id and p.empresa_id = public.empria_empresa_atual()
    )
  );

-- Auditoria: qualquer membro registra (em seu próprio nome); leitura para quem gerencia.
create policy auditoria_insercao on public.auditoria
  for insert with check (
    empresa_id = public.empria_empresa_atual()
    and (pessoa_id is null or pessoa_id = auth.uid())
  );
create policy auditoria_leitura on public.auditoria
  for select using (
    empresa_id = public.empria_empresa_atual()
    and public.empria_papel_atual() in ('proprietario', 'gerente')
  );

-- ---------- Onboarding ----------
-- Cria a empresa e vincula quem chamou como proprietário, numa transação só.
-- security definer: dispensa policies de INSERT abertas em empresa/pessoa.
create or replace function public.empria_criar_empresa(
  p_nome text,
  p_slug text,
  p_nome_pessoa text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_email   text;
  v_slug    text;
  v_i       int := 1;
begin
  if auth.uid() is null then
    raise exception 'nao_autenticado';
  end if;

  if exists (select 1 from public.pessoa where id = auth.uid()) then
    raise exception 'usuario_ja_vinculado';
  end if;

  if coalesce(trim(p_nome), '') = '' then
    raise exception 'nome_obrigatorio';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  -- slug único: acrescenta sufixo numérico se necessário
  v_slug := p_slug;
  while exists (select 1 from public.empresa where slug = v_slug) loop
    v_i := v_i + 1;
    v_slug := p_slug || '-' || v_i;
  end loop;

  insert into public.empresa (nome, slug)
  values (trim(p_nome), v_slug)
  returning id into v_empresa;

  insert into public.pessoa (id, empresa_id, nome, email, papel)
  values (
    auth.uid(),
    v_empresa,
    coalesce(nullif(trim(p_nome_pessoa), ''), v_email, 'Proprietário'),
    coalesce(v_email, ''),
    'proprietario'
  );

  return v_empresa;
end;
$$;
