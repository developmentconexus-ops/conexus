# Etapa 21.1: Ver o que acontece

O roteiro chama esta etapa de "21.1 Ver o que acontece. Vê a Atividade, o painel e o uso por
empresa", depende da 24.7, e o fundador fornece "Grafana no Brasil, provado". A linha diz: "Um só
caminho OTel (0052). O uso por empresa. O rastro por ferramenta: as ferramentas de conector
(`connector_read`, `connector_notes`, `connector_note_save`) escondem entrada e saída no span, com o
exportador de lista permitida, porque o `TracingPolicy` do Mastra só tem `internal` (veio da 20,
critério 29)".

Cada linha citada foi lida no `main` em `44fb4040`, com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0
e, fora do repositório, `@mastra/observability` 1.23.1, `@mastra/otel-exporter` 1.5.1 e
`@mastra/otel-bridge` 1.5.21, que esta etapa instala. As tabelas da 24.6 (`workflow_run`) e da 24.7
(`channel_link`, a marca **Telegram**) vêm dos cartões delas, ainda não no `main`: o cartão da 24.6
na https://github.com/developmentconexus-ops/conexus/pull/842 e o da 24.7 na
https://github.com/developmentconexus-ops/conexus/pull/890. O construtor de cada unidade reabre as
linhas no `main` do dia; uma linha que mudou para a unidade (regra "Parar se" de cada uma).

## A página do fundador

**No fim desta etapa** você abre a **Atividade** de uma empresa e vê quem fez o quê: cada escrita
de um agente no Sankhya com quem aprovou e como terminou, cada execução de workflow, quem entrou,
saiu ou mudou de papel, cada agente publicado e cada canal ligado. De uma execução que falhou, você
abre o **passo a passo** e vê em que passo ela parou, quanto tempo cada passo levou e o código do
erro. Na Central, você vê quanto cada empresa usou no mês. E o mesmo turno aparece no Grafana, no
Brasil, sem nenhum texto de conversa.

**O roteiro de uso.** Você é a Ana (dona) da empresa de teste, com o agente "Pedidos" publicado com
**Lançar pedido** em **Pergunta antes**, um workflow que lê o Sankhya, e a Bia como Membro.

1. Na conversa do "Pedidos", peça um pedido e toque **Aprovar**. Rode o workflow uma vez de um jeito
   que ele falhe (por exemplo, com a ligação do Sankhya desligada).
2. No menu da empresa, toque **Atividade**. Aparecem, do mais novo para o mais velho: "O workflow
   ... falhou", "O Pedidos lançou um pedido no Sankhya, aprovado por Ana", e mais embaixo as
   entradas de pessoas e publicações. Cada linha diz quem, o quê, quando, e o desfecho.
3. Toque **Ver o passo a passo** na linha do workflow que falhou. Aparece a árvore: o workflow, cada
   passo, o agente, cada chamada ao modelo e cada ferramenta, com o tempo e os tokens; o passo que
   falhou aparece marcado, com o código do erro. Nenhum texto da conversa nem dado do Sankhya
   aparece ali.
4. Em **Configurações**, abra **Uso**: o mês corrente da empresa, com tokens de entrada e de saída e
   as chamadas a ferramentas, as de conector separadas.
5. Entre como a Bia. **Atividade** não aparece no menu, nem **Uso** nas Configurações; o endereço
   da Atividade digitado diz que a página não existe.
6. Na Central, abra **Uso por empresa**: cada empresa do mês, com as mesmas contas. Depois, no
   Grafana (a conta que você criou, região Brasil), procure o turno do passo 1: ele aparece como um
   rastro só, com o pedido do Hub como pai, e nenhum texto da conversa nem o CPF que o teste plantou.

**O que você faz, e quando.** Antes: lê a página **O Grafana: o que você cria e quanto custa**,
abaixo, e só cria a conta quando a U6 começar. No começo: responde às decisões abaixo e aprova esta
página. No fim: faz o roteiro na instalação da nuvem, diz o que viu e aprova os textos das telas.

**Fica de fora.**

- Texto de conversa, entrada e saída de ferramenta e mensagem de erro no rastro: a regra de segurança
  S41 e a sua resposta de 2026-10-19 ("`D1` A", "sem texto") já decidem; nada disso é guardado nem
  sai do servidor. Fica o nome de cada passo, o tempo, os tokens e o código do erro.
- Custo em reais ou dólares por empresa, se a decisão E ficar em E1.
- Limite de uso por empresa e cobrança: não há plano nem preço por empresa no produto.
- Logs dos apps (a sua resposta "`D4` A": só os de invocação da Cloudflare).
- O coletor do OpenTelemetry (Alloy) entre o Hub e o Grafana: o Grafana recomenda um para produção;
  com um Hub só e o plano grátis, o Hub manda direto. Entra quando houver um segundo Hub ou o volume
  passar do plano grátis.
- A Atividade não se apaga sozinha: fica enquanto a empresa existir e some com ela. O passo a passo
  fica 30 dias, como você respondeu em 2026-10-19.

**As suas respostas anteriores que esta etapa usa.** Cada uma como você escreveu.

- 2026-10-19, ao estudo de observabilidade: "`D1`. A `D2`. A `D3`. A `D4`. A". Rastreio nativo do Mastra sem
  texto, 30 dias; Atividade por empresa, visão da instalação, OpenTelemetry no Hub, um painel;
  Grafana Cloud grátis no Brasil, com o Jaeger como plano B; apps só com os logs da Cloudflare.
- Na decisão 0052: "Okay di grafana e um so da telemtria do builder pro hub(B)".
- 2026-11-08: "Se a gente já vai ter essa funcionalidade do Mastra, não tem nenhum sentido a gente só
  não colocar".

**As decisões suas nesta etapa.**

**A. Onde fica o passo a passo.** Exemplo: a execução de workflow do passo 3 falhou ontem às 15h.
Hoje, a decisão 0052 diz que nenhum rastro do Builder vai a banco: ele iria só ao Grafana, que só
você abre, em inglês, e a Ana não veria nada.

- **A1 (recomendada).** O Mastra guarda o passo a passo no banco dele, sem texto, por 30 dias, e a
  Ana o vê na Atividade; o mesmo rastro, também sem texto, vai ao Grafana para você. É como o próprio
  Mastra faz no Studio (traços guardados e filtrados por `organizationId`), como o Langfuse e o
  Activepieces fazem (cada execução guardada, com o passo que falhou). Objetivo: a empresa vê a
  própria execução; você continua com o Grafana para o Hub inteiro. Como, nativo: o
  `MastraStorageExporter` grava os spans no `PostgresStoreVNext` do `@mastra/pg`, a consulta é a
  `listTraces`/`getTrace` com o filtro de empresa, e a ponte `@mastra/otel-bridge` leva os mesmos
  spans ao Grafana. Veredito: nativo. Muda a 0052 (a U3 a emenda). Prova: rodou com Postgres 18
  (cerca de 43 KB por turno de dois passos sem a limpeza; a limpeza corta perto da metade) e com a
  ponte (a árvore do Mastra fica filha do pedido do Hub).
- **A2.** A 0052 como está: o rastro só no Grafana; a Ana vê a Atividade sem passo a passo. Exemplo
  real: o n8n mostra a execução, mas manda auditoria só para fora, sem tela. Menos código (sem a
  tela de passo a passo nem o armazenamento), e você investiga cada falha pela empresa.
- **A3.** Só o banco do Mastra, sem Grafana. Sem conta de fora; mas o Hub (pedidos, banco, chamadas
  a terceiros) fica sem rastro, e a 0052 cai inteira.

**B. Quem vê a Atividade, o passo a passo e o Uso da empresa.** Exemplo: a Carla é Desenvolvedora e
monta o workflow que falhou.

- **B1 (recomendada).** Dono e Administrador, como Papéis e Pessoas hoje. O Langfuse deixa o log de
  auditoria só a dono e administrador (`projectAuditLogs:read`), e o Activepieces só ao administrador
  da plataforma. Objetivo: quem responde pela empresa vê tudo o que nela se faz, inclusive quem
  aprovou cada escrita. Como, nativo: uma permissão nova `activity: ['read']` nos papéis fixos de dono
  e administrador do plugin de organização do Better Auth, como `manageRoles`.
- **B2.** Dono, Administrador e Desenvolvedor. A Carla vê a falha do workflow que ela fez, e também
  as escritas aprovadas por outras pessoas e as mudanças de papel. O Langfuse dá o rastro (não a
  auditoria) até ao VIEWER.
- **B3.** Todos veem só o que eles mesmos fizeram. Nenhuma referência lida faz assim; a Ana deixa de
  ver o que o agente da Carla fez.

**E. O que o Uso mostra.** Exemplo: em outubro a empresa gastou 2,1 milhões de tokens de entrada.

- **E1 (recomendada).** Tokens de entrada e de saída e chamadas a ferramentas, sem dinheiro. As
  contas de modelo da empresa são da empresa, e boa parte é assinatura (Codex, Claude), sem preço por
  token: um valor em dinheiro seria inventado. O n8n e o Flowise mostram contagens sem dinheiro.
  Como, nativo: as métricas automáticas do Mastra (`mastra_model_total_input_tokens`,
  `mastra_model_total_output_tokens`, `mastra_tool_duration_ms`) somadas por `organizationId` com
  `getMetricBreakdown`.
- **E2.** Também o custo estimado em dólar, rotulado "estimado". O Mastra o calcula da tabela de
  preços que ele baixa do models.dev, só para modelos que ela conhece, e o Langfuse faz igual com uma
  tabela própria. Numa conta por assinatura o número não é o que a empresa paga.

**O Grafana: o que você cria e quanto custa.** Leia antes de criar qualquer conta. Nada é criado
nesta etapa até a U6.

- **O que é.** O Grafana Cloud guarda os rastros que o Hub manda, para você procurar um turno, um
  pedido lento ou um erro. Só você entra nele. A empresa nunca o vê.
- **O que você cria, na U6.** Uma conta no grafana.com, sem cartão de crédito. Na criação do
  "stack", escolha a região **Brazil (São Paulo), AWS `sa-east-1`**, a mesma do Neon: a região não
  muda depois. Depois, um token de acesso com uma permissão só, `traces:write`, e você o entrega
  pelo firstmate, que o guarda como arquivo secreto do Hub. O token nunca vai ao repositório.
- **Quanto custa.** O plano grátis dá 50 GB de rastros por mês, guardados 14 dias, até 3 pessoas.
  Um turno de agente pesa dezenas de KB; 50 GB são mais de um milhão de turnos por mês. Se passar,
  o que excede é descartado, não cobrado (resposta da equipe do Grafana no fórum; a página de preços
  não diz). O plano pago começa em US$ 19 por mês, com rastros a US$ 0,55 por GB (processar,
  gravar e guardar), guardados 30 dias. Esta etapa não precisa dele.
- **O que vai para lá.** Só nomes de passos, tempos, tokens, códigos de erro e ids (da empresa, da
  conversa, da execução). Uma lista de atributos permitidos corta todo o resto antes de sair e conta
  o que cortou; um teste planta um texto e um CPF e prova que nenhum dos dois sai (regra S42).
- **Se não der.** Se o rastro não chegar inteiro do Brasil no plano grátis, o plano B que você já
  aprovou é o Jaeger rodando ao lado do Hub, sem conta de fora.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A Atividade no Hub | A tabela só de inclusão, a porta `recordActivity`, a rota de leitura e os escritores do Hub (pessoas, ligações, escritas) | `apps/server/src/hub/activity/`, `hub/identity/`, `hub/connectors/`, `packages/hub-api/src/activity.ts`, `apps/server/migrations/`, `apps/server/database-grants.sql` | dados | 24.7 no `main` |
| U2 A Atividade do Builder | Os escritores do Builder: publicação de agente, execução de workflow, canal, turno de agente que falhou | `apps/server/src/builder/agents/`, `builder/workflows/` (24.6), `builder/channels/` (24.7), `builder/conversation/` | dados | U1 |
| U3 O passo a passo guardado | A observabilidade do Mastra no banco dele, sem texto, 30 dias; o span do conector; as rotas do passo a passo e do uso; a emenda da 0052 | `apps/server/src/builder/observability/`, `builder/mastra/`, `hub/connectors/` (só a porta do span), `packages/hub-api/src/observability.ts`, `docs/decisions/` | segurança | U1 |
| U4 O OpenTelemetry do Hub | O provedor do Hub, as instrumentações, a lista permitida, a ponte do Mastra e a saída OTLP | `apps/server/src/platform/telemetry/`, `platform/http.ts`, `platform/config.ts`, `main.ts`, `infra/compose.yaml` | segurança | U3 |
| U5 As telas | Atividade, passo a passo, Uso nas Configurações, Uso por empresa na Central | `apps/web/src/routes/_app/companies/`, `apps/web/src/routes/_app/operations/`, `apps/web/src/activity/` | web | U1, U2, U3 |
| U6 A prova no Grafana | A conta do fundador, o token no Hub da nuvem, o roteiro passo 6, a 0052 aceita | `docs/decisions/`, a configuração da nuvem | entrega | U4, U5 |

U2 e U3 correm em paralelo depois da U1: não dividem pasta (a U3 toca `hub/connectors/` só para a
porta do span, que a U1 não toca; a U1 toca `write.ts` para o registro da escrita, a U3 o toca para o
span; a U3 rebase depois da U1). U4 e U5 correm em paralelo depois da U3.

**Orçamento de código alterado.** U1: 650. U2: 350. U3: 850. U4: 450. U5: 1.050. U6: 40 (texto).
Total da etapa: cerca de 3.400 linhas, dentro dos 4.000 da regra L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies/{companyId}/activity` devolve 200 com as entradas da empresa, da mais nova para a mais velha, 50 por página, e `next` quando há mais; um Membro recebe 404 `NOT_FOUND`, um Desenvolvedor 404 em B1, quem não é da empresa 404, sem sessão 401 | `hub/activity/activity.test.ts`, "lists newest first", "member gets not found" | must |
| 2 | U1 | A Atividade de uma empresa nunca mostra uma entrada de outra: a linha de B, lida com a sessão de A, não aparece, e a política de linha recusa um `SELECT` sem a empresa | `platform/isolation-activity.test.ts` | must |
| 3 | U1 | Convidar, aceitar convite, mudar papel, remover pessoa, ligar e remover uma ligação deixam cada uma a sua entrada, com quem fez; uma ação recusada (por exemplo, sem permissão) não deixa entrada | `hub/activity/writers.test.ts` | must |
| 4 | U1 | Uma escrita de agente deixa uma entrada com o agente, a operação, quem aprovou (ou "sozinho") e o desfecho `DONE`, `REFUSED` ou `UNCERTAIN`; a entrada entra na mesma transação que muda o estado do `connector_write`, e uma transação desfeita não deixa entrada | `hub/activity/writes.test.ts` | must |
| 5 | U1 | A tabela só aceita inclusão: o login do Hub não tem `UPDATE` nem `DELETE` nela, e apagar a empresa apaga as entradas dela | `platform/catalog.test.ts`; `hub/operations/client-deletion-database.test.ts`, caso novo | must |
| 6 | U2 | Publicar e ativar uma versão de agente, uma execução de workflow que termina (`DONE`, `FAILED`, `DECLINED`, `INTERRUPTED`, `STOPPED_BEFORE_WRITE`), ligar e desligar um canal, e um turno de agente publicado que termina em falha deixam cada um a sua entrada, com quem iniciou ou "agendado" | `builder/agents/activity.test.ts`, `builder/workflows/activity.test.ts`, `builder/channels/activity.test.ts` | must |
| 7 | U2 | Um turno que termina bem não deixa entrada na Atividade (a conversa não é auditoria) | `builder/conversation/activity.test.ts` | must |
| 8 | U3 | Um turno de agente pela rota do controlador deixa no banco do Mastra um rastro com o agente, cada passo, cada chamada ao modelo com tokens e cada ferramenta, com `organizationId` da empresa em todo span, também depois de uma retomada por aprovação | `builder/observability/stored.test.ts`, com a gravação T26 do turno | must |
| 9 | U3 | Um texto e um CPF plantados na mensagem, na entrada de um conector, na resposta dele e na mensagem de um erro de ferramenta não aparecem em nenhum span guardado (`input`, `output`, `attributes`, `metadata`, `errorInfo`, `error`, `*Preview`); o span do erro guarda só o código | `builder/observability/planted.test.ts` | must |
| 10 | U3 | `GET /api/companies/{companyId}/traces?thread={t}` ou `?run={r}` devolve os rastros daquela conversa ou execução da empresa; `GET .../traces/{traceId}` devolve a árvore; um rastro de outra empresa dá 404 `NOT_FOUND`, como um que não existe; um Membro 404; um rastro de mais de 30 dias 404 com `TRACE_EXPIRED` quando a entrada da Atividade ainda existe | `builder/observability/routes.test.ts` | must |
| 11 | U3 | `GET /api/companies/{companyId}/usage?month=2026-11` devolve tokens de entrada, de saída e chamadas por ferramenta da empresa no mês; `GET /api/operations/usage?month=` devolve o mesmo por empresa, só ao operador (a pessoa da empresa recebe 404); um mês malformado 400 `REQUEST_MALFORMED` | `builder/observability/usage.test.ts` | must |
| 12 | U3 | Cada chamada a conector (leitura de app, de agente, do Builder, e escrita) deixa um span `connector_call` com o conector, a operação, o resultado, o tempo e os bytes; dentro de uma ferramenta ele é filho dela | `hub/connectors/span.test.ts` | should |
| 13 | U3 | O banco do Mastra mantém partições do dia: com a partição de amanhã apagada, o trabalho diário a recria; um rastro de 31 dias some na limpeza; o turno nunca falha porque o rastro não pôde ser guardado | `builder/observability/retention.test.ts` | must |
| 14 | U4 | Um pedido ao Hub que roda um turno sai como um rastro só: o span do pedido do Hub é o pai do `invoke_agent` do Mastra, e os spans do banco e das chamadas de saída ficam no mesmo rastro | `platform/telemetry/one-trace.test.ts`, com um exportador em memória | must |
| 15 | U4 | Só atributos da lista saem: o texto e o CPF plantados do critério 9, um cabeçalho e uma consulta SQL não aparecem em nenhum span exportado, e cada span leva `conexus.telemetry.attributes_dropped` com a contagem | `platform/telemetry/allowlist.test.ts` | must |
| 16 | U4 | Um `traceparent` vindo de fora é ignorado: o rastro do pedido começa no Hub | `platform/telemetry/inbound.test.ts` | must |
| 17 | U4 | Sem `HUB_OTLP_ENDPOINT` o Hub sobe sem exportar e sem aviso; com o endpoint fora do ar o pedido responde igual, e o Hub imprime `TELEMETRY_EXPORT_FAILED` uma vez por minuto no máximo; ao parar, os spans pendentes saem antes do fim (C62) | `platform/telemetry/export.test.ts` | must |
| 18 | U4 | O Mastra não manda log por OTel: nenhum `POST /v1/logs` sai | `platform/telemetry/export.test.ts`, "no logs" | must |
| 19 | U5 | **Atividade** aparece no menu da empresa só para quem pode lê-la; cada linha diz quem, o quê, quando e o desfecho; **Ver o passo a passo** aparece só nas linhas com conversa ou execução | `apps/web/src/activity/activity.test.tsx` | must |
| 20 | U5 | O passo a passo mostra a árvore com nome, tempo, tokens e o código do erro no passo que falhou, nos estados da matriz | `apps/web/src/activity/trace.test.tsx` | must |
| 21 | U5 | **Uso** nas Configurações e **Uso por empresa** na Central mostram o mês, com a troca de mês; a seção some para quem não pode | `apps/web/src/activity/usage.test.tsx` | must |
| 22 | U6 | No Grafana da região Brasil, o turno do roteiro aparece como um rastro só com o pedido do Hub como pai, e nenhum texto ou CPF plantado | o roteiro, passo 6, com a captura no PR da U6 | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Atividade | "Aqui aparece o que se faz na empresa: escritas dos agentes, execuções, pessoas e publicações." | Igual à primeira vez | Linhas-esqueleto | "Não deu para carregar a Atividade." com **Tentar de novo** | — | O botão não aparece no menu; o endereço dá a página de não encontrado | — |
| Passo a passo | — | "Esta execução não deixou passos." | Esqueleto da árvore | "Não deu para carregar o passo a passo." com **Tentar de novo** | Página de não encontrado | Página de não encontrado | "O passo a passo desta execução já foi apagado. Guardamos 30 dias." |
| Uso (Configurações) | "O uso aparece depois da primeira conversa." | "Nenhum uso neste mês." | Esqueleto | "Não deu para carregar o uso." com **Tentar de novo** | — | A seção não aparece; o endereço dá não encontrado | — |
| Uso por empresa (Central) | Igual ao vazio | "Nenhuma empresa usou neste mês." | Esqueleto | Igual ao do Uso | — | Só o operador entra na Central | — |

Os textos vão à rodada de textos do fim. O desenho de caixas, a 1280 e a 390 px, e a captura de
referência de cada tela entram no PR da U5 antes do código (W34); a Atividade segue a lista de
execuções do Activepieces (quem, o quê, quando, desfecho, ação na linha) e o passo a passo a árvore
de spans do Mastra Studio (`packages/playground-ui/src/domains/traces/`, na prateleira em
`6e8dfcb8`), com as colunas de entrada e saída tiradas.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ActivityEntry.kind` | os escritores de U1 e U2 | a tela da Atividade, que escolhe a frase |
| `ActivityEntry.actor` (`PERSON` com id e nome, `AGENT` com id e nome, `SCHEDULE`) | os escritores | a tela |
| `ActivityEntry.outcome` | os escritores de escrita, workflow e turno | a tela (o tom da linha) |
| `ActivityEntry.trail` (`THREAD` ou `RUN`, com o id) | escrita, workflow, turno falho | a tela, que leva ao passo a passo |
| `ActivityEntry.approvedBy` | U1, da coluna `approved_by` do `connector_write` | a tela |
| `TraceSpan.errorCode` | o processador da U3 | o passo a passo |
| `TraceSpan.tokens` | o Mastra, nos spans `chat` | o passo a passo |
| `UsageMonth.tools[].connector` | U3, do prefixo do nome da ferramenta | Uso e Uso por empresa |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `recordActivity` (U1, U2), na transação do dono | Duas entradas, uma por ação; não há chave natural a colidir | Desfeita com a transação do dono: nenhuma entrada sem a ação | O banco do Hub fora: a ação falha como hoje, com o código dela | Nada novo | 3, 4, 6 |
| Upsert de span e métrica (`MastraStorageExporter`, biblioteca) | O Mastra grava por lote; upsert por `traceId`+`spanId` | O lote falha: o exportador tenta 3 vezes e descarta, e o turno segue | Banco do Mastra fora ou sem partição: turno normal, rastro perdido | `TRACE_STORE_FAILED` com o código do Mastra, uma vez por lote | 8, 13 |
| `ensurePartitions()` e `prune()` (U3, diário) | Duas cópias do Hub: a segunda acha as partições criadas; a corrida de `CREATE` falha uma e loga | `prune()` desfeito no meio deixa a partição velha para o dia seguinte | Banco fora: tenta no dia seguinte | `TRACE_PARTITIONS_FAILED` com o código | 13 |
| Exportação OTLP (U4, `BatchSpanProcessor`) | Lotes independentes | Resposta cortada, 502 ou 503: o lote é descartado, sem nova tentativa além da do SDK | Grafana fora: o pedido do Hub não espera nem falha | `TELEMETRY_EXPORT_FAILED`, no máximo uma vez por minuto | 17 |
| Flush no desligamento (U4) | — | O prazo do desligamento corta o flush: o que não saiu se perde | Grafana fora: o flush espera o prazo e segue | `TELEMETRY_FLUSH_TIMEOUT` | 17 |

## A tabela de referência

Cada linha foi lida na versão citada; "provado" quer dizer que rodou no estudo, fora do repositório,
com modelo simulado e Postgres 18 local.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A trilha de quem fez o quê | U1 | Nada: nenhum escritor de auditoria em `apps/server/src` | Mastra Factory `mastracode/factory/src/storage/domains/audit/base.ts:1-95` (prateleira `6e8dfcb8`); Activepieces `audit-event-entity.ts:10-60` (`f34c43cd`); Langfuse `schema.prisma:1077-1101` (`8ee97c4`) | Tabela só de inclusão, separada do rastro: ator (pessoa, agente, sistema), ação `namespace.verbo`, alvo, metadados curtos, nunca carga inteira | nativo (tabela do produto, como as três) | lido | 0052 ("the audit trail is the Hub's own append-only table, shown as Atividade"); "`D2` A" | `apps/server/src/hub/activity/tables.ts`, `record.ts`, `routes.ts`, `public.ts` |
| O registro da escrita | U1 | `connectors.connector_write` com `approved_by` (`apps/server/src/hub/connectors/tables.ts:205-247`) | Activepieces `agent.action.executed` (`core/shared/src/lib/ee/audit-events/index.ts:22-60`) | O evento de auditoria aponta para o registro, não o copia | nativo | lido | 24.5, resposta 4 | — (escritor em `hub/connectors/write.ts`) |
| As execuções de workflow | U2 | Fora do `main`: `workflow_run` no cartão da 24.6 | Activepieces `flow.run.finished`; Dify `WorkflowRun` (`api/models/workflow.py:784-870`, `208a2489`) | Uma entrada quando a execução termina, com o desfecho e o passo que falhou | nativo | lido | cartão 24.6 | `builder/workflows/activity.ts` |
| Os canais | U2 | Fora do `main`: `channel_link` no cartão da 24.7 | Activepieces `connection.upserted` | Uma entrada ao ligar e ao desligar | nativo | lido | cartão 24.7 | `builder/channels/activity.ts` |
| Quem vê a Atividade | U1 | `CompanyMay` sem leitura de atividade (`packages/hub-api/src/roles.ts:47-52`); ações em `hub/identity/admission.ts:85-120`; papéis em `hub/identity/roles.ts:24-113` | Langfuse `organizationAccessRights.ts:43-62`, `projectAccessRights.ts:77,165,240`; Activepieces `audit-event-module.ts:51` | Auditoria só para dono e administrador | nativo (permissão do Better Auth) | lido | decisão B | — (`activity: ['read']` em `roles.ts`) |
| O rastro guardado | U3 | Nenhum `observability` no `new Mastra` (`builder/mastra/mastra.ts:13-33`); a arquitetura já põe "traces" no banco do Mastra (`docs/architecture.md`, tabela de bancos) | `@mastra/pg@1.35.0` `PostgresStoreVNext`, `ObservabilityStoragePostgresVNext` (`dist/storage/domains/observability/v-next/index.d.ts:41-134`); `@mastra/observability@1.23.1` `MastraStorageExporter` | Spans e métricas em tabelas particionadas por dia; consulta por empresa | nativo | provado (Q6, Q9) | decisão A; 2026-11-08 | `apps/server/src/builder/observability/store.ts`, `observability.ts` |
| Esconder texto no rastro | U3 | — | `@mastra/core@1.82.0` `dist/observability/types/tracing.d.ts:2027-2031,2147-2160`; `spanOutputProcessors` (`@mastra/observability` `dist/index.js:5434,5836`) | Um processador de span roda antes de todo exportador e muda o span | embrulhado (processador nosso no gancho nativo) | provado (Q3 d3, Q8) | S41; "`D1` A" | `builder/observability/scrub.ts` |
| `TracingPolicy` | fica de fora | — | `@mastra/observability` `isSpanInternal` (`dist/index.js:3354,3517`) | `internal` descarta o span inteiro, não esconde | nativo, não serve | provado (Q3 b2): perde a ferramenta `calc` e não tira a entrada dos spans do modelo | — | — |
| `hideInput`/`hideOutput` por rastro | fica de fora | — | `tracingOptions` (`tracing.d.ts:2147-2160`) | Esconde tudo de um rastro, mas não o erro; e as rotas do controlador não recebem `tracingOptions` | nativo, não serve | provado (Q3 c, Q8) | — | — |
| A empresa em cada span | U3 | O guard põe o autor no `requestContext` (`builder/conversation/guard.ts:180-240`) | `requestContextKeys` da configuração (`@mastra/observability`, Q7) | Copia a chave do `requestContext` para o span, também na retomada | nativo | provado (Q7, Q10 d) | — | — (em `guard.ts`) |
| O span do conector | U3 | `readThrough` loga `CONNECTOR_CALLED` (`hub/connectors/read.ts:133-215`); `writeThrough` (`write.ts:155`) | Conexus OS `apps/hub/src/connectors/record.ts` (`e0353c36`); Mastra `startSpan`/`createChildSpan` | Span `GENERIC` filho da ferramenta, ou raiz numa leitura de app | nativo | provado (Q8 1) | — | `hub/connectors/span.ts` (porta) |
| O uso por empresa | U3 | Só a linha `CONVERSATION_TURN_ENDED` com `tokens` (`builder/conversation/end.ts:324-330`, `turn-line.ts:48-69`) | Mastra métricas automáticas e `getMetricBreakdown` por `organizationId`; Langfuse `usageBreakdown.ts:8,100-134` | Soma na leitura sobre eventos guardados | nativo | provado (Q5, Q9 b) | decisão E | `builder/observability/usage.ts` |
| Retenção | U3 | Nada limpa rastro | `PostgresStoreVNext` `retention` + `prune()` + `ensurePartitions()` (`@mastra/pg` `dist/index.js:18857`) | Apaga partições inteiras vencidas; não roda sozinho | embrulhado (o trabalho diário é nosso) | provado (Q9 d, e) | "30 dias" (D1 A) | `builder/observability/retention.ts` |
| OpenTelemetry no Hub | U4 | `requestIdLogLabel: 'traceId'`, `genReqId: randomUUID` (`platform/http.ts:165-166`); `MASTRA_TELEMETRY_DISABLED` (`infra/compose.yaml:75-76`) | Conexus OS `apps/hub/src/telemetry/start.ts` (77 linhas, `e0353c36`) | `NodeSDK` com Fastify, pg, undici; flush no SIGTERM | nativo | lido | 0052; "`D2` A" | `apps/server/src/platform/telemetry/start.ts` |
| A lista permitida | U4 | — | Conexus OS `apps/hub/src/telemetry/redact.ts` (85 linhas) | Envolve o `SpanExporter`, mantém nomes e prefixos exatos, conta os cortados | embrulhado | provado (Q3 e) | S42 | `platform/telemetry/allowlist.ts` |
| Os spans do Mastra no OTel | U4 | — | `@mastra/otel-bridge@1.5.21`; o `OtelExporter` como alternativa | A ponte cria os spans do Mastra no provedor do Hub, filhos do span ativo | nativo (marcado experimental pelo Mastra) | provado (Q10 a-e), sem as rotas HTTP | 0052 ("one tracing path") | — (em `observability.ts`) |
| Logs do Mastra | U4 | — | `logging: { enabled: false }` (`@mastra/observability` `dist/index.js:5685`) | Desliga o sinal de logs | nativo | provado (Q4) | 0052 ("logs off") | — |
| O Grafana | U6 | — | Grafana Cloud, região `sa-east-1`, gateway OTLP com `traces:write` (páginas lidas em 2026-11-08) | Envio direto do SDK, documentado como "não para produção" | nativo | não verificado (pede a conta) | "`D3` A"; "Okay di grafana" | — |
| As telas | U5 | Menu em `apps/web/src/routes/_app/companies/$companyId/route.tsx:34-80`; seções em `$companyId_/settings/route.tsx:27-44`; Central em `routes/_app/operations/` | Activepieces `runs-table/columns.tsx:209-340`; Mastra Studio `domains/traces/`; Langfuse `TracesTable.tsx` | Lista com quem, o quê, quando, desfecho; árvore de spans com tempo e tokens | nativo (componentes do produto) | lido | "`D2` A" | `apps/web/src/activity/`, rotas novas |

**A medida do transplante.** `redact.ts` (85 linhas) e `start.ts` (77 linhas) do produto antigo
entram pela U4: a lista de nomes muda para os atributos do Mastra (`gen_ai.usage.*`,
`mastra.span.type`, `mastra.metadata.organizationId`) e o `start.ts` perde o Pino (o Hub já tem o
logger dele) e ganha a ponte. Se mais de um terço das linhas mudar, a U4 escreve novo e diz no PR.
`observability.ts` do produto antigo (`apps/hub/src/builder/observability.ts:60-90`) não entra: ele
guardava texto (`maxStringLength 32768`), o que a S41 recusa.

**A dívida.** "Trace ids are Fastify's request ids until 21.1 [0052]" sai da seção 11 da
arquitetura com a U4. A recomendação do Grafana por um coletor em produção entra na seção 11.

## U1 A Atividade no Hub

**Base e modelo.** O `main` do dia, com a 24.7 fechada. Sonnet: uma tabela, uma porta e escritores
em transações que já existem.

### As linhas da tabela

- **A trilha.** Ler `mastracode/factory/src/storage/domains/audit/base.ts:1-95` e `audit/actions.ts:5-25`
  na prateleira do Mastra em `6e8dfcb8`: ator, ação `namespace.verbo`, alvo, metadados curtos.
  Copiar a forma, não o código.
- **O registro da escrita.** `apps/server/src/hub/connectors/tables.ts:205-247` e o ponto onde
  `write.ts` passa o estado de `SENDING` para `DONE`, `REFUSED` ou `UNCERTAIN` (`write.ts:37-39`,
  `155`).
- **Quem vê.** `apps/server/src/hub/identity/roles.ts:24-30` (`MANAGE_COMPANY`), `:67-80` (o
  controle de acesso), `admission.ts:105-106` (`manageRoles` como modelo), `packages/hub-api/src/roles.ts:47-52`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/activity/` | Cria | `hub/identity/`, `hub/connectors/`, U2, `main.ts` (rotas) |
| `apps/server/src/hub/identity/` | Muda: `roles.ts`, `admission.ts`, os pontos de convite, aceite, papel e remoção | as rotas de identidade |
| `apps/server/src/hub/connectors/` | Muda: `write.ts`, `connections.ts` | Builder, Assistente, agentes |
| `packages/hub-api/src/activity.ts`, `roles.ts`, `index.ts` | Cria e muda | server, web |
| `apps/server/migrations/` | Cria duas migrações (tabela; grants) | `migrate` |
| `apps/server/database-grants.sql`, `platform/catalog.test.ts` | Muda | o catálogo (D11: aprovar esta página é a palavra do fundador) |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/activity.ts
export const ActivityKind = z.enum([
  'person.invited', 'person.joined', 'person.role_changed', 'person.removed',
  'connection.linked', 'connection.removed',
  'write.done', 'write.refused', 'write.uncertain',
  'agent.published', 'agent.activated',
  'workflow.finished',
  'channel.linked', 'channel.unlinked',
  'turn.failed',
])
export const ActivityActor = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PERSON'), personId: PersonId, name: z.string() }),
  z.object({ kind: z.literal('AGENT'), agentId: AgentId, name: z.string() }),
  z.object({ kind: z.literal('SCHEDULE') }),
])
export const ActivityTrail = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('THREAD'), threadId: z.string() }),
  z.object({ kind: z.literal('RUN'), runId: z.string() }),
])
export const ActivityEntry = z.object({
  id: ActivityId, at: z.iso.datetime(), kind: ActivityKind, actor: ActivityActor,
  target: z.object({ label: z.string(), id: z.string().nullable() }),
  outcome: z.string().nullable(),       // o código do desfecho, nunca texto livre
  approvedBy: ActivityActor.nullable(), // só nas escritas
  trail: ActivityTrail.nullable(),
})
export const ActivityPage = z.object({ entries: z.array(ActivityEntry), next: z.string().nullable() })
// CompanyMay ganha readActivity: z.boolean()
```

```ts
// apps/server/src/hub/activity/public.ts
export type ActivityRecord = Omit<ActivityEntry, 'id' | 'at' | 'actor' | 'approvedBy'> & {
  actor: { kind: 'PERSON'; personId: PersonId } | { kind: 'AGENT'; agentId: AgentId } | { kind: 'SCHEDULE' }
  approvedBy?: PersonId | 'UNATTENDED'
}
export function recordActivity(tx: CompanyTx, companyId: CompanyId, record: ActivityRecord): Promise<void>
```

- **Tabela** `activity.entry`: `company_id text not null references` a empresa `on delete cascade`,
  `id uuid` (v7), `at timestamptz not null default now()`, `kind text not null` com `check` na
  lista, `actor jsonb not null`, `target jsonb not null`, `outcome text`, `approved_by text`,
  `trail jsonb`; chave `(company_id, id)`; índice `(company_id, at desc, id desc)`; RLS por empresa
  como `connector_write`. Os nomes das pessoas e agentes são lidos na consulta, não guardados (D18).
- **Grants.** `hub_company`: `SELECT, INSERT`. Nenhum `UPDATE` nem `DELETE` (critério 5).
- **Rota** `GET /api/companies/{companyId}/activity?before={cursor}`: ação `readActivity`
  (`MEMBER`, `statement: READ_ACTIVITY = { activity: ['read'] }`, `locks: false`); 200
  `ActivityPage`; 404 `NOT_FOUND` sem a permissão (W34, como as outras rotas escondidas); 400
  `REQUEST_MALFORMED` para cursor malformado.
- **Modelo.** `hub/connectors/tables.ts` (cumpre C21, C23, C26) para a tabela e a RLS; a rota de
  `hub/requests/` para a leitura paginada.

### As skills e a leitura

`fastify-best-practices`; o guia de dados (D9, D10, D11, D17, D18); `docs/reference/stack.md`, linhas
de `drizzle-orm` e `better-auth`; `organization-best-practices` para a permissão nova.

### A ordem do trabalho

1. Contrato `activity.ts` e `CompanyMay.readActivity`. Regras: C21, C22, C23, C26, C27.
2. Migração da tabela; migração própria dos grants e `database-grants.sql`, com o snapshot do
   catálogo. Regras: D9, D10, D11, D17, D18.
3. `READ_ACTIVITY` em `admission.ts` e `activity: ['read']` no controle de acesso e em
   `MANAGE_COMPANY` (dono e administrador; B2 acrescenta ao desenvolvedor). Regras: S6.
4. `recordActivity` e a rota. Os escritores do Hub, cada um na transação que já faz a ação:
   convite, aceite, papel, remoção, ligação criada e removida, e a escrita ao sair de `SENDING`.
5. Testes dos critérios 1 a 5, pela porta HTTP do servidor (T5).

### Como se prova

Critérios 1 a 5: `npm test -w apps/server -- hub/activity platform/isolation-activity
platform/catalog hub/operations/client-deletion-database`. O teste do critério 4 falha hoje porque
nenhuma entrada existe; o do 5 falha porque a tabela não existe.

### Parar se

- A escrita que sai de `SENDING` não roda numa transação da empresa: o registro fica fora dela e
  a U1 volta ao firstmate com a linha.
- A permissão nova obriga a migrar os papéis próprios das empresas (o Better Auth guarda as
  permissões): reportar antes de escrever a migração.

## U2 A Atividade do Builder

**Base e modelo.** O `main` com a U1. Sonnet.

### As linhas da tabela

- **Publicação.** O ponto de `builder/agents/` que publica e o que ativa uma versão (`publishAgent`,
  `admission.ts`).
- **Workflow.** A passagem de `workflow_run` para um estado final, no cartão da 24.6
  (`docs/steps/e246-workflows-e-automacoes.md`, seção da tabela `workflow_run`), como estiver no
  `main`.
- **Canal.** `channel_link` criado e apagado, no cartão da 24.7 (`docs/steps/e247-canais.md`).
- **Turno falho.** `watchRuns` em `builder/conversation/end.ts:303-345`, que já tira a empresa do
  `resourceId` (`controller-kit/kinds.ts:61-67`); só os controladores `agents` e `assistant` (o
  Builder e o Construtor ficam fora: o erro do Builder a pessoa vê na própria conversa).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/agents/` | Muda (publicar, ativar) | rotas de agentes |
| `builder/workflows/` | Muda (fim da execução) | o executor da 24.6 |
| `builder/channels/` | Muda (ligar, desligar) | rotas de canais |
| `builder/conversation/end.ts` | Muda (`watchRuns`) | `hub-mastra.ts` |

### Os contratos que a unidade cria

Nenhum novo: os tipos são da U1. `trail` é `RUN` com o `runId` do workflow, ou `THREAD` com o
`threadId` do turno. `actor` de um workflow agendado é `SCHEDULE`; iniciado por alguém, `PERSON`.

### As skills e a leitura

`mastra` (o `watchRuns` e os eventos do controlador); o guia de dados.

### A ordem do trabalho

1. Os quatro escritores, cada um na transação que já existe; o do turno falho numa transação
   própria, porque `watchRuns` não tem uma. Regras: C26, D18.
2. Testes do critério 6 e 7 pela porta pública.

### Como se prova

`npm test -w apps/server -- builder/agents/activity builder/workflows/activity
builder/channels/activity builder/conversation/activity`.

### Parar se

- O fim de uma execução de workflow não passa por uma transação do Hub: reportar com a linha.
- O evento do fim do turno não diz se falhou: reportar o evento como o Mastra o emite.

## U3 O passo a passo guardado

**Base e modelo.** O `main` com a U1. Opus: cruza Builder e Hub, mexe no banco do Mastra e no
ciclo de vida.

### As linhas da tabela

- **Armazenamento.** `@mastra/pg@1.35.0` `PostgresStoreVNext`: `observability: { connectionString }`
  separado do principal, `disableInit`, `retention: { observability: { spans: { maxAge }, metrics:
  { maxAge } } }`, `prune()`, `ensurePartitions()`. O dono das partições é quem roda `init()`; o
  login `mastra_runtime` já tem `CREATE` no banco do Mastra (`apps/server/database-grants.sql`, a
  linha `GRANT CREATE,CONNECT ON DATABASE mastra_database TO mastra_runtime`), então ele é o dono,
  como já é das tabelas de memória.
- **Configuração.** `@mastra/observability@1.23.1` `Observability({ configs: { default: {
  serviceName, exporters: [new MastraStorageExporter()], spanOutputProcessors: [scrub],
  excludeSpanTypes: [MODEL_CHUNK, PROCESSOR_RUN], requestContextKeys: ['organizationId'],
  sensitiveDataFilter: true } }, logging: { enabled: false } })`. Ler
  `node_modules/@mastra/observability/dist/docs/` antes.
- **Processador.** Contrato `SpanOutputProcessor` (`@mastra/core@1.82.0`
  `dist/observability/types/tracing.d.ts`, o tipo; na prateleira `tracing.ts:2317-2331`): para todo
  span, `input` e `output` vazios, `attributes` sem `toolCalls[].args` nem texto, `errorInfo`
  reduzido a `{ message: <código> }`, onde o código é `errorInfo.id` ou `ERROR`.
- **Empresa.** `guard.ts:180-240` já põe valores no `requestContext`; acrescentar `organizationId`
  = a empresa da sessão. Nos workflows agendados (24.6) e nos turnos do Telegram (24.7), o ponto que
  monta o `requestContext` faz o mesmo.
- **Span do conector.** `mastra.observability.getDefaultInstance().startSpan({ type: GENERIC, name:
  'connector_call', metadata: { organizationId } })` fora de ferramenta; dentro dela,
  `tracingContext.currentSpan.createChildSpan(...)`. O Hub não importa o Builder: `hub/connectors/`
  recebe uma porta `ConnectorSpans` que a composição em `main.ts` liga.
- **Consultas.** `getStore('observability')`: `listTraces({ filters: { organizationId, threadId } })`
  ou `runId`, `getTrace({ traceId })`, `getMetricBreakdown({ name: [<nome>], groupBy:
  ['organizationId', 'entityName'], ... })` (o `name` é lista no Postgres).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/observability/` | Cria | `builder/mastra/mastra.ts`, `main.ts`, rotas |
| `builder/mastra/mastra.ts`, `hub-mastra.ts` | Muda (`observability`, `prepare`, o trabalho diário) | `main.ts` |
| `builder/conversation/guard.ts` | Muda (`organizationId`) | as rotas do controlador |
| `hub/connectors/read.ts`, `write.ts`, `span.ts` | Muda e cria (a porta) | todos os leitores |
| `packages/hub-api/src/observability.ts` | Cria | web |
| `apps/server/package.json`, `package-lock.json`, `docs/reference/stack.md` | Muda (`@mastra/observability`) | — |
| `docs/decisions/0052-...` | Emenda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/observability.ts
export const TraceSpan = z.object({
  spanId: z.string(), parentSpanId: z.string().nullable(),
  kind: z.enum(['AGENT', 'MODEL_CALL', 'TOOL', 'WORKFLOW', 'WORKFLOW_STEP', 'CONNECTOR', 'OTHER']),
  name: z.string(), startedAt: z.iso.datetime(), endedAt: z.iso.datetime().nullable(),
  tokens: z.object({ input: z.number(), output: z.number() }).nullable(),
  errorCode: z.string().nullable(),
})
export const Trace = z.object({ traceId: z.string(), startedAt: z.iso.datetime(), spans: z.array(TraceSpan) })
export const TraceList = z.object({ traces: z.array(Trace.omit({ spans: true })) })
export const UsageMonth = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  inputTokens: z.number(), outputTokens: z.number(),
  tools: z.array(z.object({ name: z.string(), connector: z.boolean(), calls: z.number() })),
})
export const UsageByCompany = z.object({ month: z.string(), companies: z.array(UsageMonth.extend({ companyId: CompanyId })) })
```

- **Rotas.** `GET /api/companies/{companyId}/traces?thread=|run=` (200 `TraceList`); `GET
  /api/companies/{companyId}/traces/{traceId}` (200 `Trace`; 404 `NOT_FOUND` se algum span tiver
  outra `organizationId` ou o rastro não existir; 404 `TRACE_EXPIRED` quando não existe e a
  Atividade da empresa tem uma entrada com esse `trail` de mais de 30 dias); `GET
  /api/companies/{companyId}/usage?month=` (200 `UsageMonth`); todas com `readActivity`. `GET
  /api/operations/usage?month=` com `operateClients` (200 `UsageByCompany`).
- **Códigos de log.** `TRACE_STORE_FAILED`, `TRACE_PARTITIONS_FAILED`, no dono dos códigos de log do
  Builder.
- **Configuração.** Nenhuma nova: o banco é o do Mastra (`HUB_MASTRA_DATABASE_URL_FILE`). Retenção
  de 30 dias numa constante.
- **Emenda da 0052.** "Decision": o Builder grava spans sem texto no banco do Mastra, 30 dias, e a
  empresa os vê; o mesmo caminho OTel vai ao Grafana pela ponte. Dentro de 350 palavras (L24).

### As skills e a leitura

`mastra` (observabilidade, `@mastra/pg`); `node_modules/@mastra/observability/dist/docs/`;
`node_modules/@mastra/pg/dist/docs/`; o guia de segurança (S41, S42).

### A ordem do trabalho

1. Instalar `@mastra/observability` na versão que casa com `@mastra/core` 1.82.0, com a linha em
   `docs/reference/stack.md`.
2. `store.ts`: o `PostgresStoreVNext` só para o domínio de observabilidade, com
   `MastraCompositeStore` se o principal continuar o `PostgresStore` de hoje
   (`conversation/storage.ts:9-11`). `init()` e `ensurePartitions()` no `prepare()` de
   `hub-mastra.ts`.
3. `scrub.ts` e `observability.ts`. Regras: S41.
4. `organizationId` no `requestContext` do guard e dos outros pontos de entrada.
5. A porta `ConnectorSpans` e o span em `readThrough` e `writeThrough`, com os mesmos campos do log
   `CONNECTOR_CALLED`.
6. `retention.ts`: um trabalho ao subir e a cada 24 h (`unref`), que chama `ensurePartitions()` e
   `prune()`; nada se não houver rastro (arquitetura, "Work that runs alone").
7. As rotas e `usage.ts`. Regras: S6, W34 (404 para quem não pode).
8. A gravação T26 de um turno com ferramenta e aprovação, e os testes 8 a 13.
9. A emenda da 0052.

### Como se prova

`npm test -w apps/server -- builder/observability hub/connectors/span`. O 9 planta as strings da
prova Q3 e Q8 do estudo. O 10 cria rastros de duas empresas. O 13 apaga a partição de amanhã e a de
31 dias atrás num banco de teste.

### Parar se

- O `PostgresStoreVNext` avisa ou falha com a mesma URL do principal: usar a URL com outro
  `search_path` ou outro esquema, e reportar o que o Mastra exige.
- Um texto plantado sobrevive num campo que o processador não alcança: reportar o campo e o tipo
  do span, não escrever filtro por conteúdo.
- O `getMetricBreakdown` do Postgres não agrupa por `entityName`: reportar e contar as ferramentas
  pelos spans `TOOL_CALL` de `listTraces`/`getTrace`.
- `mastra_runtime` não consegue criar as partições com `statement_timeout` de 10 s.

## U4 O OpenTelemetry do Hub

**Base e modelo.** O `main` com a U3. Opus: o contexto assíncrono atravessa o Fastify e o
controlador do Mastra, e o desligamento muda.

### As linhas da tabela

- **Início.** `git show e0353c36:apps/hub/src/telemetry/start.ts`: `NodeSDK`, `HttpInstrumentation`
  com o `traceparent` de fora descartado, `UndiciInstrumentation`, `PgInstrumentation`,
  `FastifyOtelInstrumentation`, flush no SIGTERM.
- **Lista.** `git show e0353c36:apps/hub/src/telemetry/redact.ts`: chaves exatas, prefixos
  `network.`, `gen_ai.usage.`, `conexus.`; o resto cortado e contado em
  `conexus.telemetry.attributes_dropped`; o status reduzido ao código. Acrescentar
  `mastra.span.type`, `mastra.metadata.organizationId`, `gen_ai.tool.name`, `gen_ai.tool.call.id`.
- **Ponte.** `@mastra/otel-bridge@1.5.21` como `bridge` da configuração da U3; com o provedor do Hub
  registrado, o `OtelExporter` não entra.
- **Logs.** `logging: { enabled: false }` (já na U3).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/telemetry/` | Cria | `main.ts` |
| `platform/http.ts` | Muda (o `requestIdLogLabel` passa a levar o id do rastro) | todas as rotas |
| `platform/config.ts`, `config.test.ts` | Muda (`HUB_OTLP_ENDPOINT`, `HUB_OTLP_TOKEN_FILE`) | `main.ts` |
| `platform/lifecycle.ts` | Muda (o flush no desligamento) | `main.ts` |
| `builder/observability/observability.ts` | Muda (a ponte) | — |
| `infra/compose.yaml`, `docs/how-to/hub-server.md` | Muda (a variável e o segredo) | — |
| `package.json`, `package-lock.json`, `docs/reference/stack.md` | Muda (pacotes OTel e a ponte) | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/telemetry/start.ts
export type Telemetry = { flush(deadlineMs: number): Promise<void> }
export function startTelemetry(config: { endpoint: URL | null; token: Secret | null }, log: Logger): Telemetry
// apps/server/src/platform/telemetry/allowlist.ts
export function allowlisted(inner: SpanExporter): SpanExporter
export const ALLOWED_KEYS: ReadonlySet<string>; export const ALLOWED_PREFIXES: readonly string[]
```

- **Configuração.** `HUB_OTLP_ENDPOINT` (URL, opcional) e `HUB_OTLP_TOKEN_FILE` (S31); sem o
  endpoint, nenhum exportador. O token vai no `Authorization: Basic` (id da instância e token), lido
  do arquivo.
- **Códigos de log.** `TELEMETRY_EXPORT_FAILED`, `TELEMETRY_FLUSH_TIMEOUT`.

### As skills e a leitura

`fastify-best-practices`; `node`; `mastra` (a ponte); o guia de segurança (S31, S41, S42); o README
de `@opentelemetry/sdk-node` e de `@fastify/otel` na versão instalada.

### A ordem do trabalho

1. Pacotes e linhas em `stack.md`. `startTelemetry` antes de qualquer `import` que crie o servidor
   (a instrumentação precisa vir primeiro). Regras: C62.
2. `allowlist.ts` e o teste que planta (S42).
3. Ignorar o contexto de fora (S41).
4. A ponte na configuração da U3; tirar `MASTRA_TELEMETRY_DISABLED` só se ela o exigir.
5. O flush no desligamento.
6. Testes 14 a 18, com um exportador em memória e um sumidouro HTTP local.

### Como se prova

`npm test -w apps/server -- platform/telemetry`. O 14 faz um turno pela rota do controlador com o
modelo dublê (T24) e confere o pai do `invoke_agent`; a prova do estudo (Q10) chamou o agente direto,
não pela rota.

### Parar se

- O turno do controlador roda fora do contexto do pedido e o `invoke_agent` sai sem pai: reportar
  como o controlador agenda a execução, antes de propagar o contexto à mão.
- A ponte exige o `OtelExporter` também.

## U5 As telas

**Base e modelo.** O `main` com U1, U2 e U3. Sonnet.

### As linhas da tabela

- **Menu.** `apps/web/src/routes/_app/companies/$companyId/route.tsx:34-80` (`RailPlaces`, o botão
  sob `may.manageAgents` como modelo, agora `may.readActivity`).
- **Seção.** `apps/web/src/routes/_app/companies/$companyId_/settings/route.tsx:27-44`: uma seção é
  um arquivo com `staticData.section` e `needs` (W32).
- **Central.** `apps/web/src/routes/_app/operations/`.
- **Desenho.** Activepieces `runs-table/columns.tsx:209-340`; Mastra Studio `domains/traces/`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/activity/` | Cria (lista, árvore, uso) | as rotas |
| `apps/web/src/routes/_app/companies/$companyId/activity*.tsx` | Cria | o menu |
| `apps/web/src/routes/_app/companies/$companyId_/settings/usage.tsx` | Cria | o índice das Configurações |
| `apps/web/src/routes/_app/operations/usage.tsx`, `route.tsx` | Cria e muda | a Central |
| `apps/web/src/routes/_app/companies/$companyId/route.tsx` | Muda (o botão) | — |

### A ordem do trabalho

1. O desenho de caixas e as capturas de referência no PR, antes do código (W34).
2. A lista da Atividade, com a frase de cada `kind` num só lugar (C26).
3. O passo a passo, com os estados da matriz.
4. Uso e Uso por empresa, com o mesmo componente.
5. Testes 19 a 21.

### Como se prova

`npm test -w apps/web -- activity`; depois o `conexus-qa` percorre o roteiro.

### Parar se

- Uma frase da Atividade precisa de um dado que a entrada não traz: reportar, não buscar em outra
  rota.

## U6 A prova no Grafana

**Base e modelo.** O `main` com U4 e U5. Sonnet, com o fundador.

### As linhas da tabela

- **O Grafana.** As páginas lidas em 2026-11-08: o gateway `otlp-gateway-<região>.grafana.net/otlp`
  com `Authorization: Basic`, o token com `traces:write`, a busca TraceQL `{ resource.service.name =
  "conexus-hub" }`.

### A ordem do trabalho

1. O fundador cria a conta e o token como diz a página dele; o firstmate grava o token como arquivo
   secreto da nuvem. Nada disso entra no repositório.
2. O roteiro, passo 6, na nuvem. A captura vai ao PR, sem dado de empresa.
3. A 0052 passa a "Accepted", com o resultado do critério dela. Se falhar, o plano B (Jaeger) vira
   uma unidade nova do cartão.

### Parar se

- O rastro chega quebrado (spans do Mastra num rastro, os do Hub noutro): voltar à U4 com a captura.
