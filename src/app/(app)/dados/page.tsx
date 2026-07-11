import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Central de Dados" };

export default function DadosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Central de Dados"
        titulo="Importações"
        descricao="A única tarefa manual do Empria: soltar o arquivo. Mapeamento, validação e organização ficam com o sistema."
      />

      <div className="grid grid-cols-3 gap-4 max-[1000px]:grid-cols-1">
        <Card className="col-span-2 max-[1000px]:col-span-1">
          <CardLabel>Nova importação</CardLabel>
          <CardTitle>Suba uma planilha</CardTitle>
          <CardDescription className="mb-5">
            Vendas, tráfego pago, estoque ou metas — .xls, .xlsx ou .csv.
          </CardDescription>
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-muted-4 bg-background px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-card bg-surface-2 text-muted-2">
              <Upload className="size-5" strokeWidth={1.5} />
            </span>
            <p className="text-sm text-muted-foreground">
              Arraste o arquivo aqui ou selecione do computador
            </p>
            <Button variant="secondary" disabled title="Disponível na Fase 1">
              Selecionar arquivo
            </Button>
            <Badge variant="info">Fase 1 · em construção</Badge>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardLabel>Modelos de mapeamento</CardLabel>
            <p className="text-sm text-muted-foreground">
              Na primeira planilha de cada origem você confirma as colunas uma
              única vez; das próximas, é só soltar o arquivo.
            </p>
          </Card>
          <Card>
            <CardLabel>Saúde dos dados</CardLabel>
            <p className="text-sm text-muted-foreground">
              Última atualização por loja e por tipo de dado, com cobrança
              automática do responsável.
            </p>
          </Card>
          <Card>
            <CardLabel>Regra da casa</CardLabel>
            <p className="text-sm text-muted-foreground">
              Toda importação é validada, rastreável até a linha e{" "}
              <strong className="font-medium text-foreground">
                reversível em um clique
              </strong>
              .
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
