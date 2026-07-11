# Empria — guia do repositório

SaaS multi-tenant para empresas de vestuário no Brasil. Persona: o gerente sobrecarregado. Tese do produto: "a planilha entra, a clareza sai" — ingestão só por upload de .xls/.xlsx.

## Fontes da verdade

- `ESCOPO.md` — produto, módulos e roadmap por fases (F0 fundação → F5). Não implementar além da fase atual sem decidir no escopo.
- `DESIGN.md` — design system. **Nunca** usar cores/raios/fontes fora dos tokens (`src/app/globals.css`). Azul `#0a3eff` é raro e intencional; hairline em vez de sombra; radius 2px controles / 11px cards.

## Convenções

- Idioma: UI, domínio e banco em **pt-BR** (`empresa`, `unidade`, `pessoa`…); utilitários/infra em inglês. Formatos brasileiros (R$, dd/mm/aaaa, fuso America/Sao_Paulo).
- Domínio tipado em `src/lib/dominio.ts` — espelha os enums do banco.
- Multi-tenant: **toda** tabela de domínio tem `empresa_id` + policies RLS (ver `supabase/migrations/0001_fundacao.sql`). Nunca confiar só no filtro da aplicação.
- Sem Supabase configurado o app roda em "modo prévia" (`isSupabaseConfigurado()`); novas features devem degradar bem nesse modo.
- Componentes UI em `src/components/ui` seguem o padrão shadcn (cva + cn); rotas autenticadas no grupo `(app)`.

## Comandos

- `npm run dev` · `npm run build` · `npm run lint`
