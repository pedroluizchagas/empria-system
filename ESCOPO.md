# Empria — Escopo do Produto

**Sistema de gestão e inteligência para empresas de vestuário**
Versão 0.1 · 11/07/2026 · Documento vivo — base para discussão e refinamento

---

## 1. Visão

> **A planilha entra, a clareza sai.**

O Empria é uma aplicação web que centraliza **tudo o que acontece na empresa de vestuário** — vendas, metas, marketing, campanhas, eventos e tarefas — e transforma planilhas brutas em painéis prontos tanto para o **uso prático do dia a dia** quanto para **apresentar em reunião**.

O conceito central é a **linha do tempo única da empresa**: vendas, campanhas, trocas de coleção, liquidações e eventos vivem no mesmo eixo. Por isso o Empria não mostra só *quanto* vendeu — mostra *por quê*: a semana que subiu foi a da campanha; o sábado fraco foi o do feriado local.

O que o Empria **não é**: ERP nem PDV. Ele não registra vendas, não emite nota, não controla caixa. Ele fica **por cima** dos sistemas e planilhas que a empresa já usa, organizando e traduzindo dados em decisão.

---

## 2. O problema que resolvemos

**Persona primária: o gerente sobrecarregado.** No varejo de moda brasileiro é comum um único gerente acumular comercial, marketing, gestão de equipe e prestação de contas ao dono — com time enxuto e mercado apertado.

As dores que atacamos diretamente:

- **Dados espalhados** em planilhas de sistemas diferentes, uma por loja, cada uma num formato.
- **Pouca intimidade com Excel**: muita gente competente na operação não domina tabela dinâmica, PROCV e gráfico — e não deveria precisar.
- **A apresentação do mês é refeita à mão, todo mês**, e mesmo assim sai rasa.
- **Sem visão comparativa**: entre lojas, entre meses, contra o ano passado, contra a meta.
- **Delegação sem ferramenta**: o gerente quer distribuir funções (marketing, e-commerce, estoque), mas todo mundo acaba vendo tudo ou não vendo nada.

| Papel na empresa | O que essa pessoa precisa do Empria |
|---|---|
| Dono / diretor | Visão executiva consolidada, cobrança de metas, confiança no número |
| Gerente (usuário central) | Operar o dia a dia, analisar, delegar, apresentar resultados |
| Líder de setor (marketing, e-commerce, estoque…) | Painel e ferramentas **só do seu setor** |
| Colaborador / vendedor | Suas tarefas, sua meta, seu desempenho |

---

## 3. Princípios do produto

Toda decisão de escopo e design responde a estes seis princípios:

1. **A planilha entra, a análise sai.** Nenhum usuário monta fórmula, tabela dinâmica ou gráfico. O upload do `.xls/.xlsx` é a única tarefa manual; a organização é do código.
2. **Pronto para a reunião.** Qualquer painel vira apresentação limpa em um clique. O gerente nunca mais monta slide de resultado na mão.
3. **Cada um vê só o que é seu.** Login individual; o painel se monta conforme papel, setor e unidades da pessoa.
4. **Feito para vestuário.** Coleção, grade (tamanho/cor), calendário do varejo brasileiro (Dia das Mães, Namorados, Black Friday, Natal, troca de coleção), sazonalidade.
5. **Confiança no dado.** Toda importação é validada, rastreável até a linha da planilha e **reversível**.
6. **Se o dado existe, a análise aparece.** O sistema se adapta às colunas disponíveis: planilha com hora da venda desbloqueia análise por horário; sem hora, essa análise simplesmente não aparece — nada quebra.

---

## 4. Para quem construímos

**Estrutura organizacional que o sistema modela:**
`Empresa → Unidades (loja física, e-commerce, fábrica, atacado) → Setores → Pessoas`

Três perfis de empresa, um mesmo produto:

| Perfil | Exemplo | O que muda no produto |
|---|---|---|
| Loja única | 1 loja de bairro em crescimento | Experiência simples, sem comparativos entre unidades |
| Rede de lojas | 3, 15 ou mais lojas | Consolidado da rede, comparativo e ranking entre lojas, metas por unidade |
| Verticalizada | Fábrica + lojas próprias + e-commerce | Canais distintos (varejo, atacado, online) analisados juntos e separados; módulo de produção no futuro |

A empresa cadastra suas unidades e o produto se adapta — mesmo código, experiências coerentes com o porte.

---

## 5. Mapa do produto (módulos)

```
Empria
├── Painel Executivo ............. visão consolidada (primeira tela do gerente/dono)
├── Vendas & Metas ............... o "pente fino" analítico          [Fases 1–2]
├── Marketing .................... conteúdo + campanhas + tráfego pago [Fase 3]
├── Agenda & Tarefas ............. o calendário central de eventos     [Fase 3]
├── Produto & Estoque ............ giro, grade, curva ABC              [Fase 4]
├── E-commerce ................... relatórios das plataformas          [Fase 4]
├── Produção (fábrica) ........... ordens, custo/peça, abastecimento   [Fase 5]
├── Central de Dados ............. importação de planilhas (o motor)   [Fase 1]
└── Administração ................ unidades, pessoas, papéis, auditoria [Fase 0]

Transversais: Modo Reunião · Insights automáticos · Exportação (PDF/planilha)
```

### 5.1 Painel Executivo

A primeira tela de quem gerencia. Resumo do mês em andamento:

- Venda realizada × meta (empresa e por unidade), com **ritmo**: "para bater a meta, é preciso vender R$ X/dia até o fim do mês".
- Destaques e alertas: melhor/pior loja, "Loja Centro está 22% abaixo do ritmo".
- Eventos da semana (campanhas ativas, inventário, troca de vitrine).
- **Saúde dos dados**: o que está desatualizado e quem é o responsável.

### 5.2 Vendas & Metas — o pente fino

O coração analítico. Quatro perguntas, respondidas em qualquer recorte:

**Quando se vende?**
Por ano, mês, semana, dia, **dia da semana** e **horário** — incluindo o mapa de calor *dia × hora* que mostra exatamente onde estão os picos e vales da semana.

**Onde se vende?**
Por unidade e por canal (loja física, e-commerce, atacado). Comparativo lado a lado entre lojas, consolidado da rede, participação de cada unidade.

**Quem vende?**
Por vendedor: ranking, ticket médio, peças por atendimento (PA), atingimento de meta individual.

**O que se vende?**
Por categoria, produto e coleção; curva ABC; grade tamanho/cor (quando o dado existir).

**KPIs nativos do varejo de moda:** faturamento, nº de atendimentos, peças vendidas, ticket médio, PA (peças por atendimento), preço médio por peça, desconto médio.

**Comparativos em tudo:** vs. período anterior, vs. mesmo período do ano passado, entre unidades.

**Metas:** cadastro mensal em cascata (empresa → unidade → vendedor), distribuição automática pelos dias do mês, acompanhamento diário do ritmo de atingimento.

**Insights automáticos:** frases geradas por regras sobre os dados — *"Terças entre 14h e 16h concentram 18% da venda da semana"*, *"O ticket médio caiu 9% no período da liquidação, mas o volume de peças subiu 31%"*. (Regras na Fase 2; IA generativa na Fase 5.)

### 5.3 Marketing

- **Calendário de conteúdo:** pauta por canal (Instagram, TikTok, WhatsApp…), fluxo *ideia → produção → aprovação → publicado*, responsáveis e prazos. Datas do varejo brasileiro pré-carregadas.
- **Campanhas e promoções:** cadastro com período, unidades participantes e investimento. A campanha aparece **sobreposta ao gráfico de vendas** — o efeito fica visível, sem análise manual.
- **Tráfego pago:** importação dos relatórios exportados do Gerenciador de Anúncios (Meta) e do Google Ads → investimento, alcance, cliques, CPC, CPM, conversões e **ROAS**. Visão unificada *investimento × receita* por período.
- Fase futura: conexão direta às plataformas via API (elimina até o upload).

### 5.4 Agenda & Tarefas — o centro de eventos

O "calendário oficial" da empresa, que alimenta a linha do tempo única:

- **Agenda central:** campanhas, troca de coleção/vitrine, inventários, liquidações, reuniões, treinamentos, feriados locais por cidade/loja.
- **Tarefas:** responsável, setor, unidade, prazo e checklist — o gerente delega e acompanha sem sair do sistema.
- **Comunicados:** mural para a equipe (aviso de meta batida, mudança de campanha).
- Todo evento pode ser exibido sobre os gráficos de venda — é o que transforma número em narrativa.

### 5.5 Produto & Estoque *(Fase 4)*

Via planilha de posição de estoque: giro, cobertura em dias, sell-through da coleção, curva ABC, análise de grade (tamanho/cor) — o que repor, o que remarcar, o que não comprar de novo.

### 5.6 E-commerce *(Fase 4)*

Importação de relatórios das plataformas (Nuvemshop, Shopify, Tray…): sessões, conversão, receita, ticket, frete, devoluções. Funil completo junto com o tráfego pago.

### 5.7 Produção / Fábrica *(Fase 5)*

Para as verticalizadas: ordens de produção, produção semanal, custo por peça, lead time, abastecimento das lojas.

### 5.8 Central de Dados

O motor de importação — detalhado na seção 6, porque é o diferencial nº 1 do produto.

### 5.9 Administração

Cadastro da empresa, unidades, setores e pessoas; papéis e permissões; log de auditoria; plano e cobrança.

---

## 6. Importação de planilhas — o motor (diferencial nº 1)

A promessa: **subir o arquivo é a única tarefa manual**. Fluxo em 4 passos:

1. **Escolher** o tipo de dado (vendas, tráfego pago, estoque…) e a unidade/período.
2. **Soltar** o arquivo `.xls` / `.xlsx` (também `.csv`).
3. **Conferir o mapeamento de colunas.** O sistema reconhece as colunas sozinho na maioria dos casos. Na primeira vez, o usuário confirma e o Empria salva aquilo como **modelo daquela origem** ("Relatório do sistema X — Loja Centro"). Das próximas vezes, é só soltar o arquivo: o modelo aplica tudo.
4. **Revisar e confirmar:** resumo do que será importado — linhas aceitas, linhas ignoradas e o motivo de cada uma.

**Regras de confiança (inegociáveis):**

- **Deduplicação:** aviso claro se o período já tem dados ou se o arquivo é repetido; opções de substituir ou complementar.
- **Validação em padrão brasileiro:** datas `dd/mm/aaaa`, valores `1.234,56`, colunas obrigatórias por tipo.
- **Reversível:** toda importação pode ser desfeita em um clique. Errou o arquivo? Desfez, subiu de novo. Nada de "sujou o banco".
- **Rastreável:** qualquer número do painel aponta de volta para a importação e a linha de origem.
- **Saúde dos dados:** painel mostra a última atualização por loja e por tipo, e cobra o responsável ("Loja Norte sem dados de vendas há 9 dias").

**Colunas mínimas × colunas que desbloqueiam análises:**

| Tipo de dado | Mínimo para funcionar | Colunas opcionais | O que cada opcional desbloqueia |
|---|---|---|---|
| Vendas | data, valor | hora · vendedor · produto · categoria · qtde · desconto · canal · nº do cupom | hora → análise por horário e heatmap · vendedor → ranking e metas individuais · produto/categoria → curva ABC e coleção · qtde → PA e preço médio · cupom → ticket médio real |
| Tráfego pago | data, campanha, investimento | cliques · impressões · conversões · receita | CPC, CPM, ROAS, funil |
| Estoque | produto, quantidade | tamanho · cor · custo · coleção | grade, giro, sell-through, margem |
| Metas (opcional via planilha) | unidade, mês, valor | vendedor | metas individuais em lote |

**Princípio:** o sistema **nunca quebra por falta de coluna — ele mostra menos**. Isso permite atender desde a loja que só tem "data e valor" até a rede com relatório completo do ERP, com o mesmo produto.

---

## 7. Pessoas, papéis e permissões

Cada pessoa tem **login individual**. Ao entrar, o painel se monta conforme **papel + setor + unidades** designados:

- O social media entra e vê **só** o módulo de Marketing.
- O vendedor vê **sua** meta, **seu** ranking, **suas** tarefas.
- O líder do e-commerce vê o canal online das unidades dele.
- O gerente e o dono veem o consolidado.

**Papéis padrão** (ajustáveis por empresa):

| Papel | Enxerga | Pode fazer |
|---|---|---|
| Proprietário / Diretor | Tudo, todas as unidades | Tudo, incluindo plano e cobrança |
| Gerente geral | Tudo nas unidades sob sua gestão | Administrar pessoas, importar dados, definir metas, apresentar |
| Líder de setor | Módulos do seu setor, nas unidades designadas | Editar e importar dentro do setor |
| Colaborador | Painel da sua função | Executar tarefas, consultar o próprio desempenho |
| Convidado (leitura) | Painéis liberados a ele | Somente visualizar (ex.: contador, sócio investidor) |

**Permissões por ação:** ver · editar · importar dados · apresentar · administrar — combináveis por módulo e por unidade.

**Auditoria:** registro de quem importou, alterou meta, desfez importação ou mudou permissão. Confiança exige rastro.

---

## 8. Experiência de uso

**Dois modos, um produto:**

- **Modo Operação** (dia a dia): denso, com filtros, tabelas, drill-down — feito para quem trabalha dentro do sistema.
- **Modo Reunião**: um clique transforma qualquer painel em apresentação limpa — capa com o período, páginas navegáveis (visão geral → por unidade → destaques → pontos de atenção → próximas ações), sem menus, sem poluição, tipografia grande para TV/projetor. **Exporta PDF** para mandar no WhatsApp ou e-mail do dono.

**Onboarding guiado:** criar empresa → cadastrar unidades → convidar equipe → subir a primeira planilha → **primeiro painel em menos de 15 minutos**. Esse número é meta de produto, não detalhe.

**Responsivo de verdade:** o gerente consulta do celular no chão de loja; a apresentação roda na TV da sala de reunião; a operação completa fica no desktop.

**Brasileiro nativo:** interface em pt-BR, moeda R$, datas e números no padrão local, fuso `America/Sao_Paulo`, feriados nacionais e regionais.

**Identidade visual:** definida em `DESIGN.md` (design system oficial, extraído da referência aprovada): tema claro `#f8f8f8`, azul elétrico `#0a3eff` como cor de marca, tipografia Switzer + Inter, hairlines em vez de sombras, cantos quase retos.

---

## 9. Arquitetura técnica (recomendação)

**SaaS multi-tenant**: uma única aplicação atende várias empresas, com isolamento rígido de dados por empresa.

| Camada | Recomendação | Por quê |
|---|---|---|
| Aplicação web | Next.js + TypeScript | Full-stack em um projeto só; produtivo para time pequeno; ecossistema maduro |
| Interface | Tailwind CSS + shadcn/ui | Painéis bonitos e consistentes com pouco esforço de design |
| Gráficos | Apache ECharts | Heatmap dia×hora nativo, bom desempenho com muitos pontos |
| Banco de dados | PostgreSQL com Row-Level Security | Isolamento entre empresas garantido **no banco**, não só no código |
| Auth + arquivos | Supabase (Auth + Storage) | Login, recuperação de senha e guarda dos arquivos originais sem reinventar |
| Planilhas | SheetJS + fila de processamento assíncrono | Arquivo grande não trava a tela; barra de progresso; reprocessável |
| Hospedagem | Vercel + Supabase | Deploy simples, custo próximo de zero no início, escala depois |

**Modelo de dados (esquema estrela simplificado):**

- **Fatos:** `fato_venda` (data, hora, unidade, canal, vendedor, produto, qtde, valor, desconto, id_importacao), `fato_trafego`, `fato_estoque`.
- **Dimensões:** `empresa`, `unidade`, `setor`, `pessoa`, `vendedor`, `produto` (categoria, coleção, tamanho, cor), `campanha`, `meta`.
- **Operacionais:** `importacao` (arquivo original, modelo aplicado, status, reversível), `modelo_mapeamento`, `evento_agenda`, `tarefa`, `auditoria`.
- **Agregações pré-calculadas** (venda por dia/unidade/vendedor/categoria) para os painéis abrirem instantaneamente mesmo com anos de histórico.

**Pipeline de importação:** upload → detecção de cabeçalho e colunas → aplicação do modelo de mapeamento → validação linha a linha → gravação em lote marcada com o id da importação (é isso que permite desfazer) → recálculo das agregações → relatório para o usuário.

---

## 10. Segurança e LGPD

- **Isolamento por empresa no nível do banco** (RLS) + testes automatizados de vazamento entre tenants a cada release.
- Criptografia em trânsito e em repouso; senhas com hash forte; 2FA a partir da Fase 2.
- **Minimização de dados pessoais** de colaboradores: nome, e-mail e função — nada além do necessário.
- Direitos LGPD operacionalizados: exportação completa e exclusão definitiva dos dados da empresa; política de privacidade e termos de uso desde o primeiro cliente.
- Backup diário automático com retenção definida; arquivos originais preservados (são a fonte da verdade).

---

## 11. Roadmap por fases

Regra do roadmap: **cada fase termina com algo usável e demonstrável de ponta a ponta**. Estimativas para 1 dev em dedicação alta — calibrar após a Fase 0.

| Fase | Escopo | Duração | Está pronta quando… |
|---|---|---|---|
| **0 · Fundação** | Multi-tenant, cadastro de empresa/unidades/setores/pessoas, papéis e permissões, autenticação, layout base | 3–4 sem | Duas empresas fictícias convivem isoladas e cada usuário vê só o que deve |
| **1 · MVP Vendas** ⭐ | Central de Dados (mapeamento + modelos salvos + desfazer), painel de Vendas com o pente fino (mês/dia/dia-da-semana/hora, heatmap, unidades, canais), Painel Executivo simples, Modo Reunião v1 com PDF | 5–7 sem | Um gerente real sobe a planilha da loja e apresenta a reunião do mês **sem abrir o Excel** |
| **2 · Metas, vendedores e rede** | Metas em cascata com ritmo de atingimento, ranking de vendedores, comparativos entre lojas e vs. ano anterior, saúde dos dados, insights por regras | 4–6 sem | O gerente cobra meta por loja e por vendedor de dentro do sistema |
| **3 · Marketing + Agenda** | Calendário de conteúdo com aprovação, campanhas sobrepostas às vendas, importação de tráfego pago (Meta/Google) com ROAS, agenda central + tarefas por setor | 5–7 sem | O time de marketing trabalha inteiro dentro do Empria e o ROAS aparece ao lado da venda |
| **4 · Produto/Estoque + E-commerce** | Importação de estoque, giro/cobertura/curva ABC/grade, relatórios das plataformas de e-commerce, funil com tráfego | 6–8 sem | Decisão de reposição e remarcação sai do sistema |
| **5 · Expansões** | Produção/fábrica, integrações diretas via API, insights com IA generativa (resumo executivo escrito), PWA com notificações, white-label para consultorias | contínuo | — |

⭐ **A Fase 1 é o primeiro produto vendável.** Tudo nela aponta para uma cena: *a reunião de resultados do mês feita inteiramente no Empria.*

---

## 12. Fora do escopo (por decisão, não por esquecimento)

- **Não é PDV/ERP:** não registra venda, não emite NF, não controla caixa ou financeiro contábil.
- **Não é folha de pagamento/RH** — "setores e pessoas" existem para permissão e delegação, não para departamento pessoal.
- **Sem integrações via API no início.** A planilha é a integração universal: todo ERP exporta uma. Isso barateia e acelera o MVP; APIs entram na Fase 5, quando soubermos quais sistemas os clientes reais usam.
- **Sem app nativo no início.** Web responsivo cobre o celular; PWA na Fase 5.

---

## 13. Oferta e planos (hipótese a validar com os pilotos)

Cobrança **mensal por empresa** — não por usuário, para incentivar colocar a equipe toda dentro (quanto mais gente dentro, maior a retenção).

| | **Essencial** | **Profissional** | **Rede** |
|---|---|---|---|
| Unidades | até 2 | até 6 | ilimitadas |
| Usuários | até 3 | até 15 | ilimitados |
| Módulos | Vendas & Metas · Modo Reunião | + Marketing · Agenda & Tarefas | + Estoque · E-commerce · Produção |
| Suporte | e-mail | prioritário | onboarding assistido |

Preços definidos após 2–3 pilotos com empresas reais.

---

## 14. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Planilhas muito heterogêneas entre ERPs e lojas | Modelos de mapeamento salvos por origem + onboarding assistido na 1ª importação + biblioteca de modelos prontos para os ERPs mais comuns do setor |
| Dados incompletos (sem hora, sem vendedor…) | Análises se adaptam às colunas existentes — nunca quebra, mostra menos (princípio 6) |
| Disciplina de upload cai com o tempo | Painel de saúde dos dados + lembrete automático por e-mail + tarefa recorrente na agenda |
| Escopo gigante → nunca lançar | Fases fechadas com critério de pronto; a Fase 1 é vendável sozinha |
| Concorrência (BI dos ERPs, Power BI, consultorias) | Nicho vestuário + zero configuração + Modo Reunião + permissão por função. O Power BI exige exatamente a habilidade que nossa persona não tem — essa é a brecha |
| Desconfiança no número ("esse dado tá certo?") | Relatório de importação, rastreio até a linha da planilha, desfazer em um clique, auditoria |

---

## 15. Métricas de sucesso do produto

- **Ativação:** tempo do cadastro ao primeiro painel < 15 minutos.
- **Hábito:** % de empresas com dados atualizados na última semana (meta: > 80%).
- **Valor percebido:** uso do Modo Reunião ≥ 1×/mês por empresa ativa.
- **Retenção:** empresa ativa após 3 meses; NPS do gerente.
- **Negócio:** MRR, churn mensal, CAC por canal de aquisição.

---

## 16. Decisões em aberto

1. **Nome:** "Empria" é o nome de trabalho (herdado da pasta) — confirmar ou renomear antes do domínio/marca.
2. **Pilotos:** quais 2–3 empresas reais validam o MVP? As planilhas delas definem os primeiros modelos de importação — é a decisão mais urgente.
3. **Time e dedicação:** 1 dev? Dedicação integral? Isso calibra o roadmap da seção 11.
4. **Stack:** confirmar a recomendação da seção 9 ou apontar preferências existentes.
5. **Precificação:** validar a hipótese dos 3 planos durante os pilotos.

## 17. Próximos passos imediatos

1. Revisar e ajustar este escopo (este documento é a fonte da verdade do produto).
2. **Coletar 3–5 planilhas reais** de vendas (lojas e sistemas diferentes) — elas definem o motor de importação e provam o princípio nº 1.
3. Protótipo navegável das três telas-chave: painel de Vendas, fluxo de importação e Modo Reunião.
4. Iniciar a Fase 0 (fundação técnica).
