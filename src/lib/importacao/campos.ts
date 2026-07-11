/**
 * Campos de destino da importação (ESCOPO.md §6).
 * Só data e valor são obrigatórios: cada opcional presente desbloqueia
 * uma análise — o sistema nunca quebra por falta de coluna.
 */

export const CAMPOS_VENDA = [
  "data",
  "valor",
  "hora",
  "cupom",
  "quantidade",
  "vendedor",
  "produto",
  "categoria",
  "desconto",
  "canal",
] as const;
export type CampoVenda = (typeof CAMPOS_VENDA)[number];

export interface DefinicaoCampo {
  campo: string;
  rotulo: string;
  obrigatorio: boolean;
  /** O que a coluna desbloqueia — exibido no passo de mapeamento. */
  desbloqueia: string | null;
  /** Nomes de coluna comuns nos relatórios dos ERPs (normalizados). */
  apelidos: string[];
}

export const DEFINICOES_VENDA: DefinicaoCampo[] = [
  {
    campo: "data",
    rotulo: "Data da venda",
    obrigatorio: true,
    desbloqueia: null,
    apelidos: ["data", "dia", "data venda", "data da venda", "dt venda", "emissao", "data emissao", "dt"],
  },
  {
    campo: "valor",
    rotulo: "Valor (R$)",
    obrigatorio: true,
    desbloqueia: null,
    apelidos: ["valor", "total", "valor total", "vlr", "vl total", "receita", "faturamento", "valor liquido", "total liquido", "valor venda", "valor da venda"],
  },
  {
    campo: "hora",
    rotulo: "Hora",
    obrigatorio: false,
    desbloqueia: "análise por horário e mapa de calor dia × hora",
    apelidos: ["hora", "horario", "hora venda", "hora da venda"],
  },
  {
    campo: "cupom",
    rotulo: "Nº do cupom / pedido",
    obrigatorio: false,
    desbloqueia: "nº de atendimentos e ticket médio real",
    apelidos: ["cupom", "cupom fiscal", "pedido", "numero pedido", "n pedido", "nota", "nf", "documento", "doc", "ticket"],
  },
  {
    campo: "quantidade",
    rotulo: "Quantidade de peças",
    obrigatorio: false,
    desbloqueia: "peças por atendimento (PA) e preço médio por peça",
    apelidos: ["quantidade", "qtde", "qtd", "pecas", "qtde pecas", "itens", "unidades", "quant"],
  },
  {
    campo: "vendedor",
    rotulo: "Vendedor(a)",
    obrigatorio: false,
    desbloqueia: "ranking e metas individuais",
    apelidos: ["vendedor", "vendedora", "funcionario", "colaborador", "atendente", "operador"],
  },
  {
    campo: "produto",
    rotulo: "Produto",
    obrigatorio: false,
    desbloqueia: "curva ABC e análise por coleção",
    apelidos: ["produto", "descricao", "descricao produto", "item", "mercadoria", "modelo", "referencia", "ref"],
  },
  {
    campo: "categoria",
    rotulo: "Categoria",
    obrigatorio: false,
    desbloqueia: "análise por categoria",
    apelidos: ["categoria", "grupo", "secao", "familia", "linha", "departamento", "colecao"],
  },
  {
    campo: "desconto",
    rotulo: "Desconto (R$)",
    obrigatorio: false,
    desbloqueia: "desconto médio",
    apelidos: ["desconto", "desc", "valor desconto", "vlr desconto"],
  },
  {
    campo: "canal",
    rotulo: "Canal",
    obrigatorio: false,
    desbloqueia: "análise por canal (loja, online, atacado)",
    apelidos: ["canal", "origem", "tipo venda", "canal venda"],
  },
];

export const CAMPOS_TRAFEGO = [
  "data",
  "campanha",
  "investimento",
  "cliques",
  "impressoes",
  "conversoes",
  "receita",
] as const;
export type CampoTrafego = (typeof CAMPOS_TRAFEGO)[number];

/** Cabeçalhos dos exports do Gerenciador de Anúncios (Meta) e Google Ads. */
export const DEFINICOES_TRAFEGO: DefinicaoCampo[] = [
  {
    campo: "data",
    rotulo: "Data",
    obrigatorio: true,
    desbloqueia: null,
    apelidos: ["dia", "data", "day", "inicio dos relatorios", "data de inicio"],
  },
  {
    campo: "campanha",
    rotulo: "Campanha",
    obrigatorio: true,
    desbloqueia: null,
    apelidos: ["campanha", "nome da campanha", "campaign", "campaign name"],
  },
  {
    campo: "investimento",
    rotulo: "Investimento (R$)",
    obrigatorio: true,
    desbloqueia: null,
    apelidos: ["valor gasto", "valor gasto (brl)", "custo", "gasto", "investimento", "amount spent", "cost"],
  },
  {
    campo: "cliques",
    rotulo: "Cliques",
    obrigatorio: false,
    desbloqueia: "CPC",
    apelidos: ["cliques", "cliques no link", "clicks", "link clicks"],
  },
  {
    campo: "impressoes",
    rotulo: "Impressões",
    obrigatorio: false,
    desbloqueia: "CPM e alcance",
    apelidos: ["impressoes", "impressions", "exibicoes"],
  },
  {
    campo: "conversoes",
    rotulo: "Conversões",
    obrigatorio: false,
    desbloqueia: "custo por conversão",
    apelidos: ["conversoes", "resultados", "compras", "conversions", "results", "purchases"],
  },
  {
    campo: "receita",
    rotulo: "Receita (R$)",
    obrigatorio: false,
    desbloqueia: "ROAS — receita sobre investimento",
    apelidos: ["valor de conversao", "valor de conversao da compra", "receita", "conv value", "purchase conversion value", "valor de conversoes"],
  },
];

export const DEFINICOES_POR_TIPO: Record<string, DefinicaoCampo[]> = {
  vendas: DEFINICOES_VENDA,
  trafego: DEFINICOES_TRAFEGO,
};
