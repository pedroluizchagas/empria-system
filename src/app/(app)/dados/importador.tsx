"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabela, Th, Td } from "@/components/ui/table";
import {
  FASE_TIPO_DADO,
  ROTULO_TIPO_DADO,
  TIPOS_DADO,
  type ModeloMapeamento,
} from "@/lib/dominio";
import { formatarData, formatarMoeda, formatarNumero } from "@/lib/formato";
import { CAMPOS_VENDA, DEFINICOES_VENDA, type CampoVenda } from "@/lib/importacao/campos";
import {
  assinaturaColunas,
  detectarEstrutura,
  sugerirMapeamento,
  type Celula,
  type EstruturaPlanilha,
} from "@/lib/importacao/planilha";
import { validarVendas, type ResultadoValidacao } from "@/lib/importacao/validar";
import { cn } from "@/lib/utils";
import {
  confirmarImportacao,
  verificarPeriodo,
  type ImportacaoExistente,
} from "./actions";

interface ImportadorProps {
  configurado: boolean;
  unidades: { id: string; nome: string }[];
  modelos: ModeloMapeamento[];
}

type Passo = 1 | 2 | 3 | 4;

const PASSOS: { numero: Passo; rotulo: string }[] = [
  { numero: 1, rotulo: "Arquivo" },
  { numero: 2, rotulo: "Mapeamento" },
  { numero: 3, rotulo: "Revisão" },
  { numero: 4, rotulo: "Concluído" },
];

export function Importador({ configurado, unidades, modelos }: ImportadorProps) {
  const [passo, setPasso] = useState<Passo>(1);
  const [unidadeId, setUnidadeId] = useState(unidades[0]?.id ?? "");
  const [arquivoNome, setArquivoNome] = useState("");
  const [estrutura, setEstrutura] = useState<EstruturaPlanilha | null>(null);
  const [assinatura, setAssinatura] = useState("");
  const [mapeamento, setMapeamento] = useState<Partial<Record<CampoVenda, number>>>({});
  const [modeloAplicado, setModeloAplicado] = useState<ModeloMapeamento | null>(null);
  const [salvarModelo, setSalvarModelo] = useState(true);
  const [nomeModelo, setNomeModelo] = useState("");
  const [existentes, setExistentes] = useState<ImportacaoExistente[]>([]);
  const [decisao, setDecisao] = useState<"complementar" | "substituir">("complementar");
  const [lendo, setLendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ aceitas: number; ignoradas: number } | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  // calculado uma única vez por transição para a revisão (arquivos grandes)
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null);

  const camposMapeados = useMemo(
    () => CAMPOS_VENDA.filter((c) => mapeamento[c] !== undefined),
    [mapeamento],
  );

  function reiniciar() {
    setPasso(1);
    setArquivoNome("");
    setEstrutura(null);
    setResultado(null);
    setAssinatura("");
    setMapeamento({});
    setModeloAplicado(null);
    setSalvarModelo(true);
    setNomeModelo("");
    setExistentes([]);
    setDecisao("complementar");
    setErro(null);
    setSucesso(null);
    if (inputArquivo.current) inputArquivo.current.value = "";
  }

  async function irParaRevisao(
    est: EstruturaPlanilha,
    map: Partial<Record<CampoVenda, number>>,
  ) {
    const r = validarVendas(est.linhas, map);
    setResultado(r);
    setPasso(3);
    setExistentes([]);
    setDecisao("complementar");
    if (!configurado) return;
    if (r.periodoInicio && r.periodoFim && unidadeId) {
      const sobrepostas = await verificarPeriodo(
        unidadeId,
        "vendas",
        r.periodoInicio,
        r.periodoFim,
      );
      setExistentes(sobrepostas);
    }
  }

  async function aoReceberArquivo(arquivo: File) {
    setErro(null);
    setLendo(true);
    try {
      const XLSX = await import("xlsx");
      const dados = await arquivo.arrayBuffer();
      const pasta = XLSX.read(dados, { type: "array" });
      const primeiraAba = pasta.Sheets[pasta.SheetNames[0]];
      if (!primeiraAba) throw new Error("planilha vazia");

      const matriz = XLSX.utils.sheet_to_json<Celula[]>(primeiraAba, {
        header: 1,
        raw: true,
        defval: null,
      });
      const est = detectarEstrutura(matriz);
      if (!est || est.linhas.length === 0) {
        setErro("Não encontramos um cabeçalho e linhas de dados nesse arquivo. Confira se a primeira aba contém a tabela de vendas.");
        return;
      }

      const ass = assinaturaColunas(est.colunas);
      setArquivoNome(arquivo.name);
      setEstrutura(est);
      setAssinatura(ass);
      setNomeModelo(arquivo.name.replace(/\.(xlsx?|csv)$/i, ""));

      // origem conhecida? aplica o modelo salvo e vai direto para a revisão
      const modelo = modelos.find((m) => m.assinatura === ass);
      const indicesValidos = (m: Record<string, number>) =>
        Object.values(m).every((i) => i >= 0 && i < est.colunas.length);

      if (modelo && indicesValidos(modelo.mapeamento) && modelo.mapeamento.data !== undefined && modelo.mapeamento.valor !== undefined) {
        const map = modelo.mapeamento as Partial<Record<CampoVenda, number>>;
        setMapeamento(map);
        setModeloAplicado(modelo);
        setSalvarModelo(false);
        void irParaRevisao(est, map);
      } else {
        setMapeamento(sugerirMapeamento(est.colunas, DEFINICOES_VENDA));
        setModeloAplicado(null);
        setSalvarModelo(true);
        setPasso(2);
      }
    } catch {
      setErro("Não foi possível ler o arquivo. Use .xls, .xlsx ou .csv.");
    } finally {
      setLendo(false);
    }
  }

  async function confirmar() {
    if (!estrutura || !resultado) return;
    setEnviando(true);
    setErro(null);

    const colunas = camposMapeados;
    const linhas = estrutura.linhas.map((l) => ({
      n: l.numero,
      c: colunas.map((campo) => l.celulas[mapeamento[campo]!] ?? null),
    }));

    const r = await confirmarImportacao({
      tipoDado: "vendas",
      unidadeId,
      arquivoNome,
      colunas,
      linhas,
      modeloId: modeloAplicado?.id ?? null,
      salvarModelo:
        salvarModelo && nomeModelo.trim()
          ? {
              nome: nomeModelo.trim(),
              assinatura,
              mapeamento: Object.fromEntries(
                colunas.map((campo) => [campo, mapeamento[campo]!]),
              ),
            }
          : null,
      substituirIds: decisao === "substituir" ? existentes.map((e) => e.id) : [],
    });

    setEnviando(false);
    if (r.ok) {
      setSucesso({ aceitas: r.aceitas ?? 0, ignoradas: r.ignoradas ?? 0 });
      setPasso(4);
    } else {
      setErro(r.erro);
    }
  }

  return (
    <Card className="col-span-2 max-[1000px]:col-span-1">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <CardLabel>Nova importação</CardLabel>
          <h3 className="font-display text-xl font-medium tracking-[-0.02em]">
            {passo === 1 && "Suba uma planilha"}
            {passo === 2 && "Confira o mapeamento"}
            {passo === 3 && "Revise e confirme"}
            {passo === 4 && "Importação concluída"}
          </h3>
        </div>
        <ol className="flex items-center gap-1.5 pt-1">
          {PASSOS.map((p) => (
            <li key={p.numero} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-medium",
                  passo === p.numero && "bg-primary text-primary-foreground",
                  passo > p.numero && "bg-success/15 text-success",
                  passo < p.numero && "bg-surface-2 text-muted-3",
                )}
              >
                {passo > p.numero ? "✓" : p.numero}
              </span>
              <span
                className={cn(
                  "text-[11px]",
                  passo === p.numero ? "font-medium text-foreground" : "text-muted-3",
                  "max-[700px]:hidden",
                )}
              >
                {p.rotulo}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* ---------- Passo 1 · Arquivo ---------- */}
      {passo === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex w-44 flex-col gap-1.5">
              <Label htmlFor="imp-tipo">Tipo de dado</Label>
              <Select id="imp-tipo" value="vendas" onChange={() => {}}>
                {TIPOS_DADO.map((tipo) => (
                  <option key={tipo} value={tipo} disabled={tipo !== "vendas"}>
                    {ROTULO_TIPO_DADO[tipo]}
                    {tipo !== "vendas" ? ` · Fase ${FASE_TIPO_DADO[tipo]}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-1.5">
              <Label htmlFor="imp-unidade">Unidade</Label>
              <Select
                id="imp-unidade"
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value)}
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputArquivo.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputArquivo.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              const arquivo = e.dataTransfer.files?.[0];
              if (arquivo) void aoReceberArquivo(arquivo);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border border-dashed px-6 py-14 text-center transition-colors",
              arrastando
                ? "border-primary bg-primary/5"
                : "border-muted-4 bg-background hover:border-muted-2",
            )}
          >
            <span className="flex size-11 items-center justify-center rounded-card bg-surface-2 text-muted-2">
              <Upload className="size-5" strokeWidth={1.5} />
            </span>
            <p className="text-sm text-muted-foreground">
              {lendo
                ? "Lendo o arquivo…"
                : "Arraste o arquivo aqui ou selecione do computador"}
            </p>
            <Button variant="secondary" disabled={lendo || !unidadeId} type="button">
              Selecionar arquivo
            </Button>
            <p className="text-[11px] text-muted-3">.xls · .xlsx · .csv</p>
          </div>
          <input
            ref={inputArquivo}
            type="file"
            accept=".xls,.xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) void aoReceberArquivo(arquivo);
            }}
          />
        </div>
      )}

      {/* ---------- Passo 2 · Mapeamento ---------- */}
      {passo === 2 && estrutura && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="font-medium text-foreground">{arquivoNome}</span>
            <span>
              · {estrutura.linhas.length.toLocaleString("pt-BR")} linhas ·{" "}
              {estrutura.colunas.length} colunas
            </span>
          </div>

          <p className="text-[13px] text-muted-foreground">
            Reconhecemos as colunas abaixo. Confirme uma única vez — nas próximas
            planilhas desta origem, é só soltar o arquivo.
          </p>

          <div className="overflow-hidden rounded-card border border-border">
            {DEFINICOES_VENDA.map((def, i) => (
              <div
                key={def.campo}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-2.5",
                  i > 0 && "border-t border-border",
                )}
              >
                <div className="w-48 max-[700px]:w-full">
                  <span className="text-sm font-medium">{def.rotulo}</span>{" "}
                  {def.obrigatorio && (
                    <span className="text-[11px] text-destructive">obrigatório</span>
                  )}
                </div>
                <Select
                  className="h-8 w-56 max-[700px]:w-full"
                  value={mapeamento[def.campo] ?? ""}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setMapeamento((atual) => {
                      const novo = { ...atual };
                      if (valor === "") delete novo[def.campo];
                      else novo[def.campo] = Number(valor);
                      return novo;
                    });
                  }}
                >
                  <option value="">— não tem —</option>
                  {estrutura.colunas.map((coluna, idx) => (
                    <option key={idx} value={idx}>
                      {coluna}
                    </option>
                  ))}
                </Select>
                {def.desbloqueia && (
                  <span className="flex-1 text-[11px] text-muted-3 max-[700px]:w-full">
                    desbloqueia {def.desbloqueia}
                  </span>
                )}
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={salvarModelo}
              onChange={(e) => setSalvarModelo(e.target.checked)}
              className="size-4 accent-primary"
            />
            Salvar como modelo desta origem
          </label>
          {salvarModelo && (
            <Input
              value={nomeModelo}
              onChange={(e) => setNomeModelo(e.target.value)}
              placeholder="Nome do modelo — ex.: Relatório do ERP · Loja Centro"
              className="max-w-md"
            />
          )}

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" type="button" onClick={reiniciar}>
              <ArrowLeft className="size-4" strokeWidth={1.5} /> Trocar arquivo
            </Button>
            <Button
              type="button"
              disabled={mapeamento.data === undefined || mapeamento.valor === undefined}
              onClick={() => void irParaRevisao(estrutura, mapeamento)}
            >
              Continuar
            </Button>
            {(mapeamento.data === undefined || mapeamento.valor === undefined) && (
              <span className="text-[12px] text-muted-3">
                Aponte pelo menos a data e o valor.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ---------- Passo 3 · Revisão ---------- */}
      {passo === 3 && estrutura && resultado && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="font-medium text-foreground">{arquivoNome}</span>
            {modeloAplicado && (
              <Badge variant="ok">Modelo aplicado · {modeloAplicado.nome}</Badge>
            )}
            <button
              type="button"
              onClick={() => setPasso(2)}
              className="text-[12px] text-primary underline-offset-2 hover:underline"
            >
              revisar mapeamento
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
            <div className="rounded-card border border-border bg-background p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.02em] text-muted-2">
                Linhas aceitas
              </p>
              <p className="font-display text-2xl font-medium">
                {resultado.aceitas.length.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-card border border-border bg-background p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.02em] text-muted-2">
                Ignoradas
              </p>
              <p
                className={cn(
                  "font-display text-2xl font-medium",
                  resultado.ignoradas.length > 0 && "text-warning",
                )}
              >
                {resultado.ignoradas.length.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-card border border-border bg-background p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.02em] text-muted-2">
                Período
              </p>
              <p className="pt-1 text-sm font-medium">
                {resultado.periodoInicio && resultado.periodoFim
                  ? `${formatarData(resultado.periodoInicio)} – ${formatarData(resultado.periodoFim)}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-card border border-border bg-background p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.02em] text-muted-2">
                Total em vendas
              </p>
              <p className="pt-1 text-sm font-medium">
                {formatarMoeda(resultado.somaValor)}
              </p>
            </div>
          </div>

          {resultado.ignoradas.length > 0 && (
            <details className="rounded-card border border-border bg-background px-4 py-3">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Por que {resultado.ignoradas.length.toLocaleString("pt-BR")}{" "}
                {resultado.ignoradas.length === 1 ? "linha foi ignorada" : "linhas foram ignoradas"}
              </summary>
              <ul className="mt-2 flex flex-col gap-1 text-[13px] text-muted-foreground">
                {resultado.ignoradas.slice(0, 20).map((ig) => (
                  <li key={ig.linha}>
                    Linha {ig.linha}: {ig.motivo}
                  </li>
                ))}
                {resultado.ignoradas.length > 20 && (
                  <li className="text-muted-3">
                    … e mais {(resultado.ignoradas.length - 20).toLocaleString("pt-BR")}.
                  </li>
                )}
              </ul>
            </details>
          )}

          {existentes.length > 0 && (
            <div className="rounded-card border border-warning/40 bg-warning/10 p-4">
              <p className="mb-2 text-sm font-medium">
                Esse período já tem dados nesta unidade
              </p>
              <ul className="mb-3 flex flex-col gap-1 text-[13px] text-muted-foreground">
                {existentes.map((e) => (
                  <li key={e.id}>
                    {e.arquivo_nome} —{" "}
                    {e.periodo_inicio && e.periodo_fim
                      ? `${formatarData(e.periodo_inicio)} a ${formatarData(e.periodo_fim)}`
                      : "período não identificado"}{" "}
                    · {e.linhas_aceitas.toLocaleString("pt-BR")} linhas
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-1.5 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decisao"
                    checked={decisao === "complementar"}
                    onChange={() => setDecisao("complementar")}
                    className="accent-primary"
                  />
                  Complementar — manter o que existe e adicionar este arquivo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decisao"
                    checked={decisao === "substituir"}
                    onChange={() => setDecisao("substituir")}
                    className="accent-primary"
                  />
                  Substituir — desfazer{" "}
                  {existentes.length === 1
                    ? "a importação acima"
                    : `as ${existentes.length} importações acima`}{" "}
                  e gravar só este arquivo
                </label>
              </div>
            </div>
          )}

          {resultado.aceitas.length > 0 && (
            <Tabela>
              <thead>
                <tr>
                  <Th>Linha</Th>
                  {camposMapeados.map((campo) => (
                    <Th key={campo}>
                      {DEFINICOES_VENDA.find((d) => d.campo === campo)?.rotulo ?? campo}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultado.aceitas.slice(0, 6).map((v) => (
                  <tr key={v.linha_origem}>
                    <Td className="text-muted-3">{v.linha_origem}</Td>
                    {camposMapeados.map((campo) => (
                      <Td key={campo}>
                        {campo === "data" && formatarData(v.data)}
                        {campo === "valor" && formatarMoeda(v.valor)}
                        {campo === "desconto" &&
                          (v.desconto !== null ? formatarMoeda(v.desconto) : "—")}
                        {campo === "quantidade" &&
                          (v.quantidade !== null ? formatarNumero(v.quantidade) : "—")}
                        {campo !== "data" &&
                          campo !== "valor" &&
                          campo !== "desconto" &&
                          campo !== "quantidade" &&
                          (v[campo] ?? "—")}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="ghost" type="button" onClick={reiniciar}>
              <ArrowLeft className="size-4" strokeWidth={1.5} /> Recomeçar
            </Button>
            <Button
              type="button"
              disabled={!configurado || enviando || resultado.aceitas.length === 0}
              onClick={() => void confirmar()}
            >
              {enviando
                ? "Importando…"
                : `Confirmar importação (${resultado.aceitas.length.toLocaleString("pt-BR")} linhas)`}
            </Button>
            {!configurado && (
              <span className="text-[12px] text-muted-3">
                Modo prévia — configure o Supabase para gravar de verdade.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ---------- Passo 4 · Concluído ---------- */}
      {passo === 4 && sucesso && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-card bg-success/10 text-success">
            <CheckCircle2 className="size-5" strokeWidth={1.5} />
          </span>
          <p className="font-display text-xl font-medium tracking-[-0.02em]">
            {sucesso.aceitas.toLocaleString("pt-BR")} vendas importadas
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {sucesso.ignoradas > 0
              ? `${sucesso.ignoradas.toLocaleString("pt-BR")} linhas foram ignoradas — o detalhe fica no histórico abaixo. `
              : ""}
            Errou o arquivo? Toda importação é reversível em um clique.
          </p>
          <div className="mt-2 flex gap-2.5">
            <Button asChild>
              <Link href="/vendas">Ver vendas</Link>
            </Button>
            <Button variant="secondary" type="button" onClick={reiniciar}>
              Nova importação
            </Button>
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-4 text-[13px] text-destructive">
          {erro}
        </p>
      )}
    </Card>
  );
}
