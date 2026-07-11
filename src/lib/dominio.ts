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
  { rotulo: "Produtos", href: "/produtos" },
  { rotulo: "Marketing", href: "/marketing" },
  { rotulo: "Agenda", href: "/agenda" },
  { rotulo: "Dados", href: "/dados" },
] as const;

export const TIPOS_DADO = ["vendas", "trafego", "estoque", "ecommerce", "metas"] as const;
export type TipoDado = (typeof TIPOS_DADO)[number];

export const ROTULO_TIPO_DADO: Record<TipoDado, string> = {
  vendas: "Vendas",
  trafego: "Tráfego pago",
  estoque: "Estoque",
  ecommerce: "E-commerce",
  metas: "Metas",
};

/** Fase do roadmap em que cada tipo de dado passa a ser importável. */
export const FASE_TIPO_DADO: Record<TipoDado, number> = {
  vendas: 1,
  trafego: 3,
  estoque: 4,
  ecommerce: 4,
  metas: 2,
};

export const TIPOS_EVENTO = [
  "campanha",
  "liquidacao",
  "troca_colecao",
  "inventario",
  "reuniao",
  "treinamento",
  "feriado",
  "outro",
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const ROTULO_TIPO_EVENTO: Record<TipoEvento, string> = {
  campanha: "Campanha",
  liquidacao: "Liquidação",
  troca_colecao: "Troca de coleção",
  inventario: "Inventário",
  reuniao: "Reunião",
  treinamento: "Treinamento",
  feriado: "Feriado",
  outro: "Outro",
};

export interface EventoAgenda {
  id: string;
  empresa_id: string;
  tipo: TipoEvento;
  titulo: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  unidade_id: string | null;
  investimento: number | null;
  criado_em: string;
}

export const CANAIS_CONTEUDO = [
  "instagram",
  "tiktok",
  "whatsapp",
  "facebook",
  "email",
  "outro",
] as const;
export type CanalConteudo = (typeof CANAIS_CONTEUDO)[number];

export const ROTULO_CANAL: Record<CanalConteudo, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  email: "E-mail",
  outro: "Outro",
};

export const STATUS_CONTEUDO = ["ideia", "producao", "aprovacao", "publicado"] as const;
export type StatusConteudo = (typeof STATUS_CONTEUDO)[number];

export const ROTULO_STATUS_CONTEUDO: Record<StatusConteudo, string> = {
  ideia: "Ideia",
  producao: "Produção",
  aprovacao: "Aprovação",
  publicado: "Publicado",
};

export const STATUS_IMPORTACAO = ["concluida", "desfeita"] as const;
export type StatusImportacao = (typeof STATUS_IMPORTACAO)[number];

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

export interface ModeloMapeamento {
  id: string;
  empresa_id: string;
  tipo_dado: TipoDado;
  nome: string;
  assinatura: string;
  /** campo de destino → índice da coluna no arquivo */
  mapeamento: Record<string, number>;
  criado_em: string;
}

export interface Importacao {
  id: string;
  empresa_id: string;
  unidade_id: string;
  tipo_dado: TipoDado;
  status: StatusImportacao;
  arquivo_nome: string;
  modelo_id: string | null;
  linhas_total: number;
  linhas_aceitas: number;
  linhas_ignoradas: number;
  motivos_ignoradas: { linha: number; motivo: string }[] | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  criado_por: string | null;
  criado_em: string;
  desfeita_em: string | null;
}
