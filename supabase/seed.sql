-- =============================================================
-- Empria · Seed de desenvolvimento — duas empresas fictícias
-- Critério de pronto da Fase 0: as duas convivem isoladas e cada
-- usuário vê só o que deve (ESCOPO.md §11).
-- =============================================================

-- Empresa A: rede de lojas
insert into public.empresa (id, nome, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Moda Aurora', 'moda-aurora');

insert into public.unidade (empresa_id, nome, tipo, cidade) values
  ('11111111-1111-1111-1111-111111111111', 'Loja Centro',        'loja',      'Belo Horizonte'),
  ('11111111-1111-1111-1111-111111111111', 'Loja Shopping Sul',  'loja',      'Belo Horizonte'),
  ('11111111-1111-1111-1111-111111111111', 'Loja Norte',         'loja',      'Contagem'),
  ('11111111-1111-1111-1111-111111111111', 'E-commerce',         'ecommerce', null);

insert into public.setor (empresa_id, nome) values
  ('11111111-1111-1111-1111-111111111111', 'Comercial'),
  ('11111111-1111-1111-1111-111111111111', 'Marketing'),
  ('11111111-1111-1111-1111-111111111111', 'Estoque');

-- Empresa B: verticalizada (fábrica + loja + e-commerce)
insert into public.empresa (id, nome, slug) values
  ('22222222-2222-2222-2222-222222222222', 'Vestta Confecções', 'vestta');

insert into public.unidade (empresa_id, nome, tipo, cidade) values
  ('22222222-2222-2222-2222-222222222222', 'Fábrica',       'fabrica',   'Divinópolis'),
  ('22222222-2222-2222-2222-222222222222', 'Loja Matriz',   'loja',      'Divinópolis'),
  ('22222222-2222-2222-2222-222222222222', 'Atacado',       'atacado',   'Divinópolis'),
  ('22222222-2222-2222-2222-222222222222', 'E-commerce',    'ecommerce', null);

insert into public.setor (empresa_id, nome) values
  ('22222222-2222-2222-2222-222222222222', 'Produção'),
  ('22222222-2222-2222-2222-222222222222', 'Comercial'),
  ('22222222-2222-2222-2222-222222222222', 'Marketing');

-- -------------------------------------------------------------
-- Pessoas: os usuários vivem em auth.users (criados pelo Supabase).
-- 1. Crie os usuários em Authentication → Users (e-mail + senha), ou via API admin.
-- 2. Vincule cada um a uma empresa com o INSERT abaixo (troque o UUID pelo id
--    do usuário criado):
--
-- insert into public.pessoa (id, empresa_id, nome, email, papel) values
--   ('<uuid-do-auth-user>', '11111111-1111-1111-1111-111111111111',
--    'Ana Gerente', 'ana@moda-aurora.com.br', 'gerente');
--
-- Teste de isolamento (critério da Fase 0): logue com um usuário de cada
-- empresa e confirme que um nunca enxerga unidades/setores/pessoas do outro.
-- -------------------------------------------------------------
