# Empria

**Gestão e inteligência para empresas de vestuário.** A planilha entra, a clareza sai: painéis prontos para o dia a dia e para a reunião, com permissões por papel, setor e unidade.

Documentos que governam o projeto:

- [`ESCOPO.md`](./ESCOPO.md) — o que é o produto, módulos, roadmap por fases
- [`DESIGN.md`](./DESIGN.md) — design system oficial (tokens, componentes, dataviz)

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS v4 · Supabase (Postgres com RLS, Auth, Storage) · Fontes Switzer + Inter (self-hosted via `next/font`).

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:3000
```

Sem configuração extra o app sobe em **modo prévia**: navegação e telas visíveis, sem login nem dados.

## Conectando o Supabase (ativa login e dados)

1. Crie um projeto em [supabase.com](https://supabase.com) e copie `URL` e `anon key` de *Project Settings → API*.
2. `cp .env.example .env.local` e preencha as duas chaves.
3. Aplique o schema: cole `supabase/migrations/0001_fundacao.sql` no *SQL Editor* (ou use `supabase db push` com a CLI).
4. (Dev) Rode `supabase/seed.sql` para criar as duas empresas fictícias e siga o comentário do arquivo para criar usuários de teste.

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/     # autenticação
│   ├── (app)/            # área logada: painel, vendas, marketing, agenda, dados, admin
│   ├── fonts.ts          # Switzer (local) + Inter
│   └── globals.css       # tokens do design system (DESIGN.md §11)
├── components/           # ui/ (button, card, badge…), app-nav, page-header, logo
├── lib/
│   ├── dominio.ts        # vocabulário do domínio (papéis, unidades, módulos)
│   └── supabase/         # clients browser/server + modo prévia
└── middleware.ts         # sessão + proteção de rotas
supabase/
├── migrations/           # schema multi-tenant com RLS
└── seed.sql              # empresas fictícias p/ teste de isolamento
```

## Status — Fase 0 (Fundação)

- [x] Projeto Next.js + design system aplicado (tokens, componentes, fontes)
- [x] Layout base: navegação por módulos, telas de todos os módulos, login
- [x] Modelo multi-tenant (Empresa → Unidades → Setores → Pessoas) com RLS
- [x] Autenticação e proteção de rotas (com modo prévia sem env)
- [ ] CRUD de unidades, setores e pessoas na tela de Administração
- [ ] Convite de usuários por e-mail
- [ ] Teste de isolamento com as duas empresas seed (critério de pronto da fase)
