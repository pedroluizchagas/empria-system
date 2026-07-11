/**
 * Vocabulário do domínio Empria (ESCOPO.md §4 e §7).
 * O domínio é modelado em pt-BR — mesmos nomes no banco (supabase/migrations).
 */

export const PAPEIS = [
  "proprietario",
  "gerente",
  "lider",
  "colaborador",
  "convidado",
] as const;
export type Papel = (typeof PAPEIS)[number];

export const ROTULO_PAPEL: Record<Papel, string> = {
  proprietario: "Proprietário / Diretor",
  gerente: "Gerente geral",
  lider: "Líder de setor",
  colaborador: "Colaborador",
  convidado: "Convidado (leitura)",
};

export const TIPOS_UNIDADE = ["loja", "ecommerce", "fabrica", "atacado"] as const;
export type TipoUnidade = (typeof TIPOS_UNIDADE)[number];

export const ROTULO_TIPO_UNIDADE: Record<TipoUnidade, string> = {
  loja: "Loja física",
  ecommerce: "E-commerce",
  fabrica: "Fábrica",
  atacado: "Atacado",
};

/** Módulos do produto e a fase do roadmap em que chegam (ESCOPO.md §5 e §11). */
export const MODULOS = [
  { rotulo: "Painel", href: "/painel" },
  { rotulo: "Vendas", href: "/vendas" },
  { rotulo: "Marketing", href: "/marketing" },
  { rotulo: "Agenda", href: "/agenda" },
  { rotulo: "Dados", href: "/dados" },
] as const;

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  criado_em: string;
}

export interface Unidade {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: TipoUnidade;
  cidade: string | null;
  ativa: boolean;
}

export interface Setor {
  id: string;
  empresa_id: string;
  nome: string;
}

export interface Pessoa {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  papel: Papel;
  setor_id: string | null;
  criado_em: string;
}
