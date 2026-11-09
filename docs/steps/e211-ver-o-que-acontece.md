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
- O passo a passo fica 30 dias, como você respondeu em 2026-10-19. Quanto tempo fica a Atividade é a
  decisão F.
- O span de cada chamada a conector dentro do rastro: a ferramenta já aparece como passo, com tempo
  e código do erro, e a chamada de saída do Hub aparece no Grafana. Levar o contexto do rastro até a
  porta dos conectores mexe em todas as ferramentas; entra quando um caso pedir.
- O desfecho `INTERRUPTED` de um workflow (o Hub reiniciou no meio): ele é deduzido ao ler a
  execução, sem evento; a tela da execução da 24.6 já o mostra.
- As execuções de teste de um workflow (`TEST`): são de quem monta, não da empresa.

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
  própria execução; você continua com o Grafana (o "painel" da linha do roteiro) para o Hub
  inteiro. Como, nativo: o `MastraStorageExporter` grava os spans no `PostgresStoreVNext` do
  `@mastra/pg`, a consulta é a `listTraces`/`getTrace` com o filtro de empresa, e a ponte
  `@mastra/otel-bridge` leva os mesmos spans ao Grafana; o que tira o texto é um processador nosso no
  gancho nativo do Mastra. Veredito: nativo, com esse processador embrulhado. Muda a 0052 (a U3 a
  emenda). Prova: rodou com Postgres 18 (cerca de 43 KB por turno de dois passos sem a limpeza; em
  memória a limpeza cortou perto da metade, no Postgres é estimativa) e com a ponte (a árvore do
  Mastra fica filha do pedido do Hub).
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

**F. Quanto tempo fica a Atividade.** Exemplo: a Bia saiu da empresa em março; em dezembro a Ana
quer ver quem aprovou um pedido de fevereiro. A Atividade guarda o id da pessoa, não o e-mail; o
nome é lido na hora e some quando a pessoa sai do Conexus.

- **F1 (recomendada).** Enquanto a empresa existir; some com ela. A Atividade é pequena (uma linha
  por ação, sem conteúdo). O Langfuse guarda o log de auditoria sem prazo (`retentionDays` vale para
  rastros); o Activepieces e o n8n deixam o prazo como opção do operador, com padrão longo (n8n
  Insights, 365 dias). Como, nativo: nenhuma limpeza; o `on delete cascade` da empresa.
- **F2.** Um ano, com limpeza diária. Exemplo real: o Activepieces tem prazo próprio para a
  auditoria (`AP_AUDIT_LOG_RETENTION_DAYS`). Menos dado guardado; a pergunta de dezembro sobre
  janeiro do ano anterior fica sem resposta.

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
- **O que vai para lá.** Só o tipo de cada passo, tempos, tokens, códigos de erro e ids (da empresa, da
  conversa, da execução). Uma lista de atributos permitidos corta todo o resto antes de sair e conta
  o que cortou; um teste planta um texto e um CPF e prova que nenhum dos dois sai (regra S42).
- **Se não der.** Se o rastro não chegar inteiro do Brasil no plano grátis, o plano B que você já
  aprovou é o Jaeger rodando ao lado do Hub, sem conta de fora.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A Atividade no Hub | A tabela só de inclusão, a porta `recordActivity`, a rota de leitura, a permissão nova e os escritores do Hub (pessoas, ligações, escritas) | `apps/server/src/hub/activity/`, `hub/identity/`, `hub/connectors/write-record.ts`, `packages/hub-api/src/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/web/src/platform/test-may.ts` | dados | 24.7 no `main` |
| U2 A Atividade do Builder | Os escritores do Builder: publicação e ativação de agente, fim de execução de workflow, canal, turno de agente que falhou | `apps/server/src/builder/agents/`, `builder/workflows/` (24.6), `builder/channels/` (24.7), `builder/conversation/end.ts` | dados | U1 |
| U3 O passo a passo guardado | A observabilidade do Mastra no banco dele, sem texto, 30 dias; as rotas do passo a passo e do uso; a emenda da 0052 | `apps/server/src/builder/observability/`, `builder/mastra/`, `builder/conversation/guard.ts`, `packages/hub-api/src/`, `main.ts`, `docs/decisions/` | segurança | U1 |
| U4 O OpenTelemetry do Hub | O provedor do Hub, as instrumentações, a lista permitida, a ponte do Mastra e a saída OTLP | `apps/server/src/platform/telemetry/`, `platform/http.ts`, `platform/config.ts`, `platform/lifecycle.ts`, `main.ts`, `infra/compose.yaml`, `docs/architecture.md` | segurança | U3 |
| U5 As telas | Atividade, passo a passo, Uso nas Configurações, Uso por empresa na Central | `apps/web/src/activity/`, `apps/web/src/routes/_app/companies/`, `apps/web/src/routes/_app/operations/` | web | U1, U2, U3 |
| U6 A prova no Grafana | A conta do fundador, o token no Hub da nuvem, o roteiro passo 6, a 0052 aceita | `docs/decisions/`, a configuração da nuvem | entrega | U4, U5 |

U2 e U3 correm em paralelo depois da U1: não dividem pasta (`hub-api` recebe arquivos novos
diferentes; `main.ts` só na U3). U4 e U5 correm em paralelo depois da U3.

**Orçamento de código alterado.** U1: 700. U2: 350. U3: 800. U4: 450. U5: 1.050. U6: 40 (texto).
Total da etapa: cerca de 3.400 linhas, dentro dos 4.000 da regra L2.

**O que cada unidade apaga antes de acrescentar.** U1, U2, U3, U5, U6: nada, porque nada do `main`
faz isso hoje. U4: a dívida "Trace ids are Fastify's request ids until 21.1" da seção 11 da
arquitetura, e o `requestIdLogLabel: 'traceId'` com o `randomUUID` como id de rastro
(`platform/http.ts:165-166`), que passa a ser o id do pedido e o id do rastro, cada um com seu nome.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies/{companyId}/activity` devolve 200 com as entradas da empresa, da mais nova para a mais velha, 50 por página, e `next` quando há mais. A mesma rota: um Membro recebe 404 `NOT_FOUND`, um Desenvolvedor 404 em B1, quem não é da empresa 404, sem sessão 401 `SESSION_REQUIRED`, um `before` malformado 400 `REQUEST_MALFORMED` | `hub/activity/activity.test.ts` | must |
| 2 | U1 | A Atividade de uma empresa nunca mostra uma entrada de outra: a linha de B, lida com a sessão de A, não aparece, e a política de linha recusa um `SELECT` sem a empresa | `platform/isolation-activity.test.ts` | must |
| 3 | U1 | Convidar (`POST` de convite), aceitar convite, mudar papel, remover pessoa, sair da empresa, ligar e remover uma ligação deixam cada uma a sua entrada, com quem fez; a mesma rota recusada (sem permissão, 404) não deixa entrada | `hub/activity/writers.test.ts` | must |
| 4 | U1 | Uma escrita de agente deixa uma entrada com o agente, a operação, quem aprovou (ou `UNATTENDED`) e o desfecho `DONE`, `REFUSED` ou `UNCERTAIN`, na mesma transação que muda o estado do `connector_write`; se essa transação falha, nem estado nem entrada. A mesma chamada repetida (a segunda vira `UNCERTAIN`, a primeira termina `DONE`) deixa uma entrada por estado, nunca duas iguais | `hub/activity/writes.test.ts` | must |
| 5 | U1 | A tabela só aceita inclusão: o login do Hub não tem `UPDATE` nem `DELETE` nela, e apagar a empresa apaga as entradas dela | `platform/catalog.test.ts`; `hub/operations/client-deletion-database.test.ts`, caso novo | must |
| 6 | U2 | Publicar e ativar uma versão de agente, uma execução de workflow `RUN` que termina `DONE`, `FAILED`, `DECLINED` ou `CANCELED`, ligar e desligar um canal, e um turno de agente publicado ou do Assistente que termina em falha deixam cada um a sua entrada, com quem iniciou ou `SCHEDULE`; uma execução `TEST`, uma `WAITING` e um turno que termina bem não deixam; o mesmo fim avisado duas vezes deixa uma entrada | `builder/agents/activity.test.ts`, `builder/workflows/activity.test.ts`, `builder/channels/activity.test.ts`, `builder/conversation/activity.test.ts` | must |
| 7 | U3 | Um turno de agente pela rota do controlador (`POST /api/agent-controller/{chave}/...`, a mesma que a conversa usa) deixa no banco do Mastra um rastro com o agente, cada passo, cada chamada ao modelo com tokens e cada ferramenta, com `organizationId` da empresa em todo span, também depois de uma retomada por aprovação | `builder/observability/stored.test.ts`, com a gravação T26 do turno | must |
| 8 | U3 | Uma execução de workflow `RUN` que falha num passo deixa um rastro em que o passo que falhou leva o código da falha (`errorCode`), não `ERROR` | `builder/observability/stored.test.ts`, "workflow failed step" | must |
| 9 | U3 | Um texto e um CPF plantados na mensagem da pessoa, nas instruções do agente, na descrição de uma ferramenta, na entrada e na resposta de um conector, no nome do agente e na mensagem de um erro de ferramenta não aparecem em nenhuma coluna de nenhum span guardado; o teste lê o banco de teste do Mastra (a exceção da T5 para o que nenhuma rota devolve) | `builder/observability/planted.test.ts` | must |
| 10 | U3 | `GET /api/companies/{companyId}/traces?thread={t}&at={instante}` ou `?run={r}` devolve os rastros daquela conversa ou execução da empresa, o mais perto de `at` primeiro; `GET .../traces/{traceId}` devolve a árvore. Nas duas: um rastro ou conversa de outra empresa dá 404 `NOT_FOUND`, como um que não existe; um Membro 404; `thread` e `run` juntos, ou nenhum, 400 `REQUEST_MALFORMED`; na lista, nada achado com `at` de mais de 30 dias dá 404 `TRACE_EXPIRED` | `builder/observability/routes.test.ts` | must |
| 11 | U3 | `GET /api/companies/{companyId}/usage?month=2026-11` devolve tokens de entrada, de saída e chamadas por ferramenta da empresa no mês, com as de conector marcadas; um Membro 404; `GET /api/operations/usage?month=` devolve o mesmo por empresa, com o nome, só ao operador (a pessoa da empresa recebe 404); um mês malformado 400 `REQUEST_MALFORMED` nas duas | `builder/observability/usage.test.ts` | must |
| 12 | U3 | O banco do Mastra mantém partições do dia: com a partição de amanhã apagada, o trabalho ao subir a recria; um rastro de 31 dias some na limpeza; com a partição faltando, o turno termina igual e o Hub imprime `TRACE_STORE_FAILED` | `builder/observability/retention.test.ts` | must |
| 13 | U4 | Um turno pela rota do controlador sai, no sumidouro OTLP local (`HUB_OTLP_ENDPOINT`), como um rastro só: o span do pedido do Hub é o pai do `invoke_agent` do Mastra, e os spans do banco e das chamadas de saída ficam no mesmo rastro; nenhum span `pg` sem pai sai (as gravações do próprio rastro e os ticks do agendador não viram rastro) | `platform/telemetry/one-trace.test.ts` | must |
| 14 | U4 | No mesmo sumidouro, só atributos da lista saem: o texto, o CPF, o nome de agente e o nome de ferramenta plantados do critério 9, um cabeçalho e uma consulta SQL não aparecem em nenhum span nem nome de span, e cada span leva `conexus.telemetry.attributes_dropped` com a contagem | `platform/telemetry/allowlist.test.ts` | must |
| 15 | U4 | Um pedido com `traceparent` de fora começa o rastro no Hub, sem o pai de fora | `platform/telemetry/inbound.test.ts` | must |
| 16 | U4 | Sem `HUB_OTLP_ENDPOINT` o Hub sobe sem exportar e sem aviso; com o sumidouro fora do ar o pedido responde igual e o Hub imprime `TELEMETRY_EXPORT_FAILED` no máximo uma vez por minuto; ao parar, os spans pendentes saem antes do fim, e com o sumidouro mudo o Hub imprime `TELEMETRY_FLUSH_TIMEOUT` e termina no prazo (C62); nenhum `POST /v1/logs` sai | `platform/telemetry/export.test.ts` | must |
| 17 | U5 | **Atividade** aparece no menu da empresa só para quem pode lê-la; cada linha diz quem, o quê, quando e o desfecho; **Ver o passo a passo** aparece só nas linhas com conversa ou execução | `apps/web/src/activity/activity.test.tsx` | must |
| 18 | U5 | O passo a passo mostra a árvore com o tipo do passo, o nome resolvido pela tela, o tempo, os tokens e o código do erro no passo que falhou, nos estados da matriz | `apps/web/src/activity/trace.test.tsx` | must |
| 19 | U5 | **Uso** nas Configurações e **Uso por empresa** na Central mostram o mês, com a troca de mês; a seção some para quem não pode | `apps/web/src/activity/usage.test.tsx` | must |
| 20 | U6 | No Grafana da região Brasil, o turno do roteiro aparece como um rastro só com o pedido do Hub como pai, e nenhum texto ou CPF plantado | o roteiro, passo 6, com a captura no PR da U6 | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Atividade | "Aqui aparece o que se faz na empresa: escritas dos agentes, execuções, pessoas e publicações." | Igual à primeira vez | Linhas-esqueleto | "Não deu para carregar a Atividade." com **Tentar de novo** | — | O botão não aparece no menu; o endereço dá a página de não encontrado | — |
| Passo a passo | — | "Esta execução não deixou passos." | Esqueleto da árvore | "Não deu para carregar o passo a passo." com **Tentar de novo** | Página de não encontrado | Página de não encontrado | "O passo a passo desta execução já foi apagado. Guardamos 30 dias." |
| Uso (Configurações) | "O uso aparece depois da primeira conversa." | "Nenhum uso neste mês." | Esqueleto | "Não deu para carregar o uso." com **Tentar de novo** | — | A seção não aparece; o endereço dá não encontrado | — |
| Uso por empresa (Central) | Igual ao vazio | "Nenhuma empresa usou neste mês." | Esqueleto | Igual ao do Uso | — | Só o operador entra na Central | — |

Os textos vão à rodada de textos do fim. A Atividade segue a lista de execuções do Activepieces
(quem, o quê, quando, desfecho, ação na linha: `runs-table/columns.tsx:209-340`, `f34c43cd`) e o
passo a passo a árvore de spans do Mastra Studio (`packages/playground-ui/src/domains/traces/`, na
prateleira em `6e8dfcb8`), sem as colunas de entrada e saída. As capturas dessas duas telas de
referência entram no PR da U5 antes do código (W34).

O desenho de caixas, a 1280 px:

```text
+-- menu da empresa --+------------------------------------------------------------+
| Início              | Atividade                                                  |
| Projetos            | +--------------------------------------------------------+ |
| Integrações         | | 15:02  O workflow Conferir estoque falhou   FALHOU     | |
| Automações          | |        agendado               [Ver o passo a passo]    | |
| Agentes             | | 14:40  O Pedidos lançou um pedido no Sankhya  FEITO    | |
| > Atividade         | |        aprovado por Ana        [Ver o passo a passo]   | |
|                     | | 09:12  Bia entrou na empresa como Membro               | |
|                     | +--------------------------------------------------------+ |
|                     |                                     [Carregar mais]        |
+---------------------+------------------------------------------------------------+

Passo a passo (a mesma moldura)
+------------------------------------------------------------------------------+
| <- Atividade   Conferir estoque, 8 nov 15:02, 4,1 s                           |
| ▾ Workflow                                         4,1 s                      |
|   ▾ Passo 1                                        3,9 s                      |
|     ▾ Agente Estoque                               3,8 s   1.240 / 88 tokens  |
|         Chamada ao modelo                          1,1 s     620 / 40         |
|         Ferramenta connector_read   ✕ CONNECTOR_UNAVAILABLE  0,4 s            |
+------------------------------------------------------------------------------+

Uso (Configurações) e Uso por empresa (Central): o mesmo bloco
+------------------------------------------------------------------------------+
| Uso          < outubro 2026 | novembro 2026 >                                 |
| Tokens de entrada  2.104.300     Tokens de saída  184.020                     |
| Ferramenta                    Conector   Chamadas                             |
| connector_read                sim        1.204                                |
| tool_lancar_pedido            sim           38                                |
+------------------------------------------------------------------------------+
```

A 390 px, o menu vira a barra de cima como hoje; cada linha da Atividade empilha hora, frase,
desfecho e o botão; a árvore do passo a passo recua 12 px por nível e põe tempo e tokens numa
segunda linha; a tabela do Uso vira uma lista de cartões, um por ferramenta.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ActivityEntry.id`, `at` | `recordActivity` | a tela (ordem, chave, `before`) |
| `ActivityEntry.kind` | os escritores de U1 e U2 | a tela da Atividade, que escolhe a frase |
| `ActivityEntry.actor` | os escritores; o nome da pessoa lido na consulta | a tela |
| `ActivityEntry.target` (`kind`, `id`, `label`) | os escritores; `label` só para o que não é pessoa | a tela |
| `ActivityEntry.outcome` | os escritores de escrita, workflow e turno | a tela (o tom da linha) |
| `ActivityEntry.approvedBy` | U1, da coluna `approved_by` do `connector_write` | a tela |
| `ActivityEntry.trail` | escrita, workflow, turno falho | a tela, que leva ao passo a passo com `at` |
| `TraceSpan.kind`, `entityId`, `startedAt`, `endedAt`, `parentSpanId` | U3, dos spans do Mastra | o passo a passo (a árvore, o nome resolvido pelo `entityId`) |
| `TraceSpan.tokens` | o Mastra, nos spans `chat` | o passo a passo |
| `TraceSpan.errorCode` | o processador da U3 | o passo a passo |
| `Trace.startedAt` | U3 | a lista de rastros de uma conversa |
| `UsageMonth.inputTokens`, `outputTokens`, `tools[].name`, `tools[].calls` | U3, das métricas | Uso e Uso por empresa |
| `UsageMonth.tools[].connector` | U3, por `isConnectorTool` | Uso e Uso por empresa |
| `UsageByCompany.companies[].companyId`, `name` | U3, com o nome lido do Hub | Uso por empresa |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `recordActivity` de pessoas e ligações (U1), na transação da ação | Duas ações, duas entradas | Desfeita com a transação: nenhuma entrada sem a ação | O banco do Hub fora: a ação falha como hoje, com o código dela | Nada novo | 3 |
| `recordActivity` da escrita (U1), dentro de `finish()` e `found()` | Chave `dedupe` = conversa, chamada e estado, com `ON CONFLICT DO NOTHING`: a repetição dá `UNCERTAIN` e depois `DONE`, duas entradas diferentes, nunca duas iguais | A transação de `finish()` desfeita: nem estado nem entrada | O banco fora: `finish()` já imprime `CONNECTOR_WRITE_UNRECORDED` e o modelo ouve a resposta; sem entrada, como sem estado | `CONNECTOR_WRITE_UNRECORDED` (já existe) | 4 |
| `recordActivity` do Builder (U2), em transação própria | Chave `dedupe` (`workflow:{runId}:{attempt}`, `turn:{runId}`): o segundo aviso não grava | A transação desfeita: nada | O banco fora: a execução termina igual; a entrada se perde | `ACTIVITY_UNRECORDED` com o `kind` | 6 |
| Upsert de span e métrica (`MastraStorageExporter`, biblioteca) | O Mastra grava por lote; upsert por `traceId`+`spanId` | O lote falha: o exportador tenta 3 vezes e descarta, e o turno segue | Banco do Mastra fora ou sem partição: turno normal, rastro perdido | `TRACE_STORE_FAILED` (o `warn` do Mastra pelo `BuilderLogger`) | 7, 12 |
| `ensurePartitions()` e `prune()` (U3, ao subir e a cada 24 h) | Duas cópias do Hub: a segunda acha as partições criadas; a corrida de `CREATE` falha uma, que loga | `prune()` desfeito no meio deixa a partição velha para o dia seguinte | Banco fora: tenta no dia seguinte | `TRACE_PARTITIONS_FAILED` com o código | 12 |
| Exportação OTLP (U4, `BatchSpanProcessor`) | Lotes independentes | Resposta cortada, 502 ou 503: o lote é descartado, sem nova tentativa além da do SDK | Grafana fora: o pedido do Hub não espera nem falha | `TELEMETRY_EXPORT_FAILED`, no máximo uma vez por minuto | 16 |
| Flush no desligamento (U4) | — | O prazo do desligamento corta o flush: o que não saiu se perde | Grafana fora: o flush espera o prazo e segue | `TELEMETRY_FLUSH_TIMEOUT` | 16 |

## A tabela de referência

Cada linha foi lida na versão citada; "provado" quer dizer que rodou no estudo, fora do repositório,
com modelo simulado e Postgres 18 local.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A trilha de quem fez o quê | U1 | Nada: nenhum escritor de auditoria em `apps/server/src` | Mastra Factory `mastracode/factory/src/storage/domains/audit/base.ts:1-95` (prateleira `6e8dfcb8`); Activepieces `audit-event-entity.ts:10-60` (`f34c43cd`); Langfuse `schema.prisma:1077-1101` (`8ee97c4`) | Tabela só de inclusão, separada do rastro: ator (pessoa, agente, sistema), ação `namespace.verbo`, alvo, metadados curtos, nunca carga inteira | nativo (tabela do produto, como as três) | lido | 0052 ("the audit trail is the Hub's own append-only table, shown as Atividade"); "`D2` A"; decisão F | `apps/server/src/hub/activity/tables.ts`, `record.ts`, `routes.ts`, `public.ts` |
| O registro da escrita | U1 | `connectors.connector_write` com `approved_by` (`hub/connectors/tables.ts:205-247`); o estado muda em `finish()` e `found()` (`hub/connectors/write-record.ts:175-186,304-325`) | Activepieces `AgentEventData` e o evento de ação de agente (`core/shared/src/lib/ee/audit-events/index.ts:132-191`) | O evento copia o que a tela mostra (agente, ação, desfecho, ligação), para não depender do registro vivo | nativo | lido | 24.5, resposta 4 | — (escritor em `write-record.ts`) |
| As execuções de workflow | U2 | Fora do `main`: `workflow_run` no cartão da 24.6, gravada no início por `conferir`, desfecho deduzido ao ler | `@mastra/core@1.82.0` `options.onFinish` do workflow (`dist/docs/references/reference-workflows-workflow.md:152-164`); Activepieces `flow.run.finished` | Um aviso no fim, com o estado e os passos; os erros nele são pegos e logados | nativo | lido (não rodado) | cartão 24.6 | `builder/workflows/activity.ts` |
| Os canais | U2 | Fora do `main`: `channel_link` no cartão da 24.7 | Activepieces `connection.upserted` | Uma entrada ao ligar e ao desligar | nativo | lido | cartão 24.7 | `builder/channels/activity.ts` |
| Quem vê a Atividade | U1 | `CompanyMay` sem leitura de atividade (`packages/hub-api/src/roles.ts:47-52`), montado em `hub/identity/companies.ts:101`; ações em `admission.ts:85-120`; papéis em `hub/identity/roles.ts:24-113` | Langfuse `organizationAccessRights.ts:43-62`, `projectAccessRights.ts:77,165,240`; Activepieces `audit-event-module.ts:51` | Auditoria só para dono e administrador | nativo (permissão do Better Auth) | lido | decisão B | — (`activity: ['read']` em `roles.ts`) |
| O rastro guardado | U3 | Nenhum `observability` no `new Mastra` (`builder/mastra/mastra.ts:13-33`); a arquitetura já põe "traces" no banco do Mastra (`docs/architecture.md`, tabela de bancos) | `@mastra/pg@1.35.0` `PostgresStoreVNext`, `ObservabilityStoragePostgresVNext` (`dist/storage/domains/observability/v-next/index.d.ts:41-134`); `@mastra/observability@1.23.1` `MastraStorageExporter` | Spans e métricas em tabelas particionadas por dia; consulta por empresa | nativo | provado (Q6, Q9) | decisão A; 2026-11-08 | `apps/server/src/builder/observability/store.ts`, `observability.ts` |
| Esconder texto no rastro | U3 | — | `@mastra/core@1.82.0` `dist/observability/types/tracing.d.ts:2027-2031,2147-2160`; `spanOutputProcessors` (`@mastra/observability` `dist/index.js:5434,5836`) | Um processador de span roda antes de todo exportador e muda o span | embrulhado (processador nosso no gancho nativo) | provado em parte (Q3 d3, Q8): a prova plantou em ferramenta, resposta e erro; a mensagem da pessoa e as instruções ficaram nos spans do modelo e são a primeira prova da U3 | S41; "`D1` A" | `builder/observability/scrub.ts` |
| `TracingPolicy` | fica de fora | — | `@mastra/observability` `isSpanInternal` (`dist/index.js:3354,3517`) | `internal` descarta o span inteiro, não esconde | nativo, não serve | provado (Q3 b2): perde a ferramenta `calc` e não tira a entrada dos spans do modelo | — | — |
| `hideInput`/`hideOutput` por rastro | fica de fora | — | `tracingOptions` (`tracing.d.ts:2147-2160`) | Esconde tudo de um rastro, mas não o erro; e as rotas do controlador não recebem `tracingOptions` | nativo, não serve | provado (Q3 c, Q8) | — | — |
| A empresa em cada span | U3 | O guard põe valores no `requestContext` (`builder/conversation/guard.ts:180-240`) | `requestContextKeys` da configuração (`@mastra/observability`, Q7) | Copia a chave do `requestContext` para o span, também na retomada | nativo | provado (Q7, Q10 d) | — | — (em `guard.ts`) |
| O span do conector | fica de fora | `readThrough` loga `CONNECTOR_CALLED` (`hub/connectors/read.ts:133-215`) | Conexus OS `apps/hub/src/connectors/record.ts` (`e0353c36`); Mastra `createChildSpan` | Span filho da ferramenta | nativo | provado (Q8 1) | — | — (o contexto do rastro teria de atravessar as portas de todas as ferramentas; a ferramenta já é um passo) |
| O uso por empresa | U3 | Só a linha `CONVERSATION_TURN_ENDED` com `tokens` (`builder/conversation/end.ts:324-330`, `turn-line.ts:48-69`) | Mastra métricas automáticas e `getMetricBreakdown` por `organizationId`; Langfuse `usageBreakdown.ts:8,100-134` | Soma na leitura sobre eventos guardados | nativo | provado (Q5, Q9 b) | decisão E | `builder/observability/usage.ts` |
| Retenção do rastro | U3 | Nada limpa rastro | `PostgresStoreVNext` `retention` + `prune()` + `ensurePartitions()` (`@mastra/pg` `dist/index.js:18857`) | Apaga partições inteiras vencidas; não roda sozinho | embrulhado (o trabalho ao subir e diário é nosso) | provado (Q9 d, e); `ensurePartitions()` lido, não rodado | "30 dias" (`D1` A) | `builder/observability/retention.ts` |
| OpenTelemetry no Hub | U4 | `requestIdLogLabel: 'traceId'`, `genReqId: randomUUID` (`platform/http.ts:165-166`); `MASTRA_TELEMETRY_DISABLED` (`infra/compose.yaml:75-76`) | Conexus OS `apps/hub/src/telemetry/start.ts` (77 linhas, `e0353c36`) | `NodeSDK` com Fastify, pg, undici; flush no SIGTERM | embrulhado (o início é nosso, trazido) | lido | 0052; "`D2` A" | `apps/server/src/platform/telemetry/start.ts` |
| A lista permitida | U4 | — | Conexus OS `apps/hub/src/telemetry/redact.ts` (85 linhas) | Envolve o `SpanExporter`, mantém nomes e prefixos exatos, conta os cortados | embrulhado | provado (Q3 e) | S42 | `platform/telemetry/allowlist.ts` |
| Os spans do Mastra no OTel | U4 | — | `@mastra/otel-bridge@1.5.21`; o `OtelExporter` como alternativa | A ponte cria os spans do Mastra no provedor do Hub, filhos do span ativo | nativo | provado (Q10 a-e), sem as rotas HTTP | 0052 ("one tracing path") | — (em `observability.ts`) |
| Logs do Mastra | U4 | — | `logging: { enabled: false }` (`@mastra/observability` `dist/index.js:5685`) | Desliga o sinal de logs | nativo | provado (Q4) | 0052 ("logs off") | — |
| O Grafana | U6 | — | Grafana Cloud, região `sa-east-1`, gateway OTLP com `traces:write` (páginas lidas em 2026-11-08) | Envio direto do SDK, documentado como "não para produção" | nativo | não verificado (pede a conta); preços e prazos da página de preços, o descarte do excedente de uma resposta no fórum | "`D3` A"; "Okay di grafana" | — |
| As telas | U5 | Menu em `apps/web/src/routes/_app/companies/$companyId/route.tsx:34-80`; seções em `$companyId_/settings/route.tsx:27-44`; Central em `routes/_app/operations/` | Activepieces `runs-table/columns.tsx:209-340`; Mastra Studio `domains/traces/`; Langfuse `TracesTable.tsx` | Lista com quem, o quê, quando, desfecho; árvore de spans com tempo e tokens | nativo (componentes do produto) | lido | "`D2` A" | `apps/web/src/activity/`, rotas novas |

**A medida do transplante.** `redact.ts` (85 linhas) e `start.ts` (77 linhas) do produto antigo
entram pela U4: a lista de nomes muda para os atributos do Mastra e o `start.ts` perde o Pino (o
Hub já tem o logger dele) e ganha a ponte. Se mais de um terço das linhas mudar, a U4 escreve novo
e diz no PR. `observability.ts` do produto antigo (`apps/hub/src/builder/observability.ts:60-90`)
não entra: ele guardava texto (`maxStringLength 32768`), o que a S41 recusa.

**A dívida.** "Trace ids are Fastify's request ids until 21.1" sai da seção 11 da arquitetura com
a U4. A recomendação do Grafana por um coletor em produção entra na seção 11.

**Os itens `next-card`.** Os abertos com a etiqueta (#818, #806, #710, #254, #234) não tocam esta
etapa e esperam a sua.

## U1 A Atividade no Hub

**Base e modelo.** O `main` do dia, com a 24.7 fechada. Sonnet: uma tabela, uma porta e escritores
em transações que já existem.

### As linhas da tabela

- **A trilha.** Ler `mastracode/factory/src/storage/domains/audit/base.ts:1-95` e `audit/actions.ts:5-25`
  na prateleira do Mastra em `6e8dfcb8`: ator, ação `namespace.verbo`, alvo, metadados curtos.
  Copiar a forma, não o código.
- **O registro da escrita.** `hub/connectors/tables.ts:205-247`; `write-record.ts:175-186` (`found()`,
  `SENDING` para `UNCERTAIN`) e `:304-325` (`finish()`, o fim, com `CONNECTOR_WRITE_UNRECORDED`).
- **Quem vê.** `hub/identity/roles.ts:24-30` (`MANAGE_COMPANY`), `:67-80` (o controle de acesso),
  `admission.ts:105-106` (`manageRoles` como modelo), `packages/hub-api/src/roles.ts:47-52`,
  `hub/identity/companies.ts:101` (onde o `CompanyMay` é montado).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/activity/` | Cria | `hub/identity/`, `hub/connectors/`, U2, `main.ts` (rotas) |
| `hub/identity/roles.ts`, `admission.ts`, `companies.ts`, `test-roles.ts` | Muda | as rotas de identidade |
| `hub/identity/memberships.ts`, `invitation-create.ts`, `invitation-response.ts` (o aceite), `company-roles.ts` | Muda (os escritores) | as rotas de identidade |
| `hub/connectors/write-record.ts`, `connections.ts` | Muda | Builder, Assistente, agentes |
| `packages/hub-api/src/activity.ts`, `roles.ts`, `failures.ts`, `index.ts` | Cria e muda | server, web |
| `apps/web/src/platform/test-may.ts` | Muda (o campo novo) | os testes da web |
| `apps/server/src/main.ts` | Muda (as rotas) | — |
| `apps/server/migrations/` | Cria a migração da tabela | `migrate` |
| `apps/server/database-grants.sql`, a migração dos grants, `platform/catalog.test.ts` | Muda, num PR próprio dentro da U1 (D11; aprovar esta página é a palavra do fundador) | o catálogo |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/activity.ts
export const ActivityId = z.uuid().brand('ActivityId')
export const ActivityActor = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PERSON'), personId: PersonId, name: z.string().nullable() }),
  z.object({ kind: z.literal('AGENT'), agentId: AgentId }),
  z.object({ kind: z.literal('SCHEDULE') }),
])
export const ActivityApproval = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PERSON'), personId: PersonId, name: z.string().nullable() }),
  z.object({ kind: z.literal('UNATTENDED') }),
])
export const ActivityTrail = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('THREAD'), threadId: ThreadId }),
  z.object({ kind: z.literal('RUN'), runId: WorkflowRunId }),
])
const at = z.iso.datetime()
const base = { id: ActivityId, at, actor: ActivityActor }
export const ActivityEntry = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.enum(['person.invited']), target: z.object({ kind: z.literal('INVITATION'), id: z.string() }) }),
  z.object({ ...base, kind: z.enum(['person.joined', 'person.left', 'person.removed']),
    target: z.object({ kind: z.literal('PERSON'), id: PersonId, name: z.string().nullable() }) }),
  z.object({ ...base, kind: z.literal('person.role_changed'),
    target: z.object({ kind: z.literal('PERSON'), id: PersonId, name: z.string().nullable() }), role: z.string() }),
  z.object({ ...base, kind: z.enum(['connection.linked', 'connection.removed']),
    target: z.object({ kind: z.literal('CONNECTION'), id: ConnectionId, label: z.string() }) }),
  z.object({ ...base, kind: z.literal('write'), outcome: z.enum(['DONE', 'REFUSED', 'UNCERTAIN']),
    target: z.object({ kind: z.literal('OPERATION'), id: OperationId, label: z.string() }),
    approvedBy: ActivityApproval, trail: ActivityTrail }),
  z.object({ ...base, kind: z.enum(['agent.published', 'agent.activated']),
    target: z.object({ kind: z.literal('AGENT'), id: AgentId, label: z.string() }), version: z.number() }),
  z.object({ ...base, kind: z.literal('workflow.finished'), outcome: z.enum(['DONE', 'FAILED', 'DECLINED', 'CANCELED']),
    target: z.object({ kind: z.literal('WORKFLOW'), id: z.string(), label: z.string() }), trail: ActivityTrail }),
  z.object({ ...base, kind: z.enum(['channel.linked', 'channel.unlinked']),
    target: z.object({ kind: z.literal('CHANNEL'), id: z.string(), label: z.string() }) }),
  z.object({ ...base, kind: z.literal('turn.failed'), outcome: z.string().regex(/^[A-Z_]+$/),
    target: z.object({ kind: z.literal('AGENT'), id: AgentId, label: z.string() }), trail: ActivityTrail }),
])
export const ActivityPage = z.object({ entries: z.array(ActivityEntry), next: z.string().nullable() })
// CompanyMay ganha readActivity: z.boolean()
```

`ThreadId` e `WorkflowRunId` vêm de onde já existem no `hub-api` ou do contrato da 24.6; se não
houver marca, a U1 a cria ao lado de `RunId` (`runs.ts:4`). O `label` é o nome do alvo na hora da
ação (o nome de um agente, de uma ligação, de uma operação), como o Activepieces guarda o
`displayName`; nunca o e-mail nem o nome de uma pessoa, que a consulta lê de `hub/identity` e
devolve `null` quando a pessoa já não existe (D18).

```ts
// apps/server/src/hub/activity/public.ts
export type ActivityRecord = DistributiveOmit<ActivityEntry, 'id' | 'at'> & { dedupe?: string }
export function recordActivity(tx: CompanyTx, companyId: CompanyId, record: ActivityRecord): Promise<void>
```

- **Tabela** no esquema novo `activity` (D4): `activity.entry(company_id text not null references`
  a empresa `on delete cascade, id uuid not null, at timestamptz not null default now(), kind text
  not null check (kind in ...), entry jsonb not null, dedupe text null)`; chave `(company_id, id)`;
  `unique (company_id, dedupe)`; índice `(company_id, at desc, id desc)`; RLS por empresa como
  `connector_write`. `entry` guarda o resto da variante, validado pelo Zod na escrita e na leitura
  (C27).
- **Grants.** `hub_company`: `SELECT, INSERT`. Nenhum `UPDATE` nem `DELETE` (critério 5).
- **Rota** `GET /api/companies/{companyId}/activity?before={cursor}`: ação `readActivity`
  (`MEMBER`, `statement: READ_ACTIVITY = { activity: ['read'] }`, `locks: false`); 200
  `ActivityPage`; 404 `NOT_FOUND` sem a permissão (W34); 400 `REQUEST_MALFORMED` para o cursor.
- **Modelo.** `hub/connectors/tables.ts` (cumpre C21, C23, C26) para a tabela e a RLS; a leitura
  paginada de `hub/requests/` para a rota.

### As skills e a leitura

`fastify-best-practices`; o guia de dados (D4, D9, D10, D11, D17, D18); `docs/reference/stack.md`,
linhas de `drizzle-orm` e `better-auth`; `organization-best-practices` para a permissão nova.

### A ordem do trabalho

1. Contrato `activity.ts`, `CompanyMay.readActivity` e os dublês (`test-roles.ts`, `test-may.ts`).
   Regras: C21, C22, C23, C26, C27.
2. Migração da tabela. Num PR próprio dentro da unidade, a migração dos grants e
   `database-grants.sql`, com o snapshot do catálogo. Regras: D9, D10, D11, D17, D18.
3. `READ_ACTIVITY` em `admission.ts` e `activity: ['read']` no controle de acesso e em
   `MANAGE_COMPANY` (dono e administrador; B2 acrescenta ao desenvolvedor). Regras: S6.
4. `recordActivity` e a rota. Os escritores do Hub, cada um na transação que já faz a ação. A
   escrita: `recordActivity` dentro da transação de `finish()` e de `found()` (quando ele muda para
   `UNCERTAIN`), com `dedupe = write:{threadId}:{toolCallId}:{estado}`.
5. Testes dos critérios 1 a 5, pela porta HTTP do servidor (T5).

### Como se prova

`npm test -w apps/server -- hub/activity platform/isolation-activity platform/catalog
hub/operations/client-deletion-database`. O teste do critério 4 falha hoje porque nenhuma entrada
existe; o do 5 porque a tabela não existe.

### Parar se

- Uma ação de pessoa ou ligação não roda numa transação da empresa: reportar a linha.
- A permissão nova obriga a migrar os papéis próprios das empresas (o Better Auth guarda as
  permissões): reportar antes de escrever a migração.

## U2 A Atividade do Builder

**Base e modelo.** O `main` com a U1. Sonnet.

### As linhas da tabela

- **Publicação.** O ponto de `builder/agents/` que publica e o que ativa uma versão (`publishAgent`
  em `admission.ts`, e o handler da rota).
- **Workflow.** `options.onFinish` do `createWorkflow` (`@mastra/core@1.82.0`
  `dist/docs/references/reference-workflows-workflow.md:152-164`): recebe `status`, `error`,
  `steps`, `runId`; os erros nele são pegos e logados pelo Mastra. O mapeamento do estado é o da 24.6
  (`success` `DONE`; `failed` `FAILED`; `canceled` com decisão recusada `DECLINED`, sem ela
  `CANCELED`), lido do dono que a 24.6 criar, nunca copiado (C26). `suspended` não grava; `TEST` não
  grava. `actor` vem de `workflow_run.started_by`.
- **Canal.** `channel_link` criado e apagado, no cartão da 24.7 (`docs/steps/e247-canais.md`).
- **Turno falho.** `watchRuns` em `builder/conversation/end.ts:303-345`, que já tira a empresa do
  `resourceId` (`controller-kit/kinds.ts:61-67`); só os controladores `agents` e `assistant`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/agents/` | Muda (publicar, ativar) | rotas de agentes |
| `builder/workflows/` | Cria `activity.ts`; muda a fábrica do workflow (o `onFinish`) | o executor da 24.6 |
| `builder/channels/` | Cria `activity.ts`; muda ligar e desligar | rotas de canais |
| `builder/conversation/end.ts` | Muda (`watchRuns`) | `hub-mastra.ts` |

### Os contratos que a unidade cria

Nenhum tipo novo: são os da U1. `dedupe`: `workflow:{runId}:{attempt}`, `turn:{runId}`. Código de
log `ACTIVITY_UNRECORDED`, no dono dos códigos de log do Builder. Modelo: o escritor da U1 em
`write-record.ts`.

### As skills e a leitura

`mastra` (o `onFinish` do workflow, o `watchRuns` e os eventos do controlador); o guia de dados.

### A ordem do trabalho

1. Publicação e canal, nas transações que já existem. Regras: C26, D18.
2. O `onFinish` e o turno falho, cada um numa transação própria, com `dedupe`.
3. Testes do critério 6 pela porta pública.

### Como se prova

`npm test -w apps/server -- builder/agents/activity builder/workflows/activity
builder/channels/activity builder/conversation/activity`.

### Parar se

- O `onFinish` não dispara para `canceled`: gravar `DECLINED` e `CANCELED` na rota que recusa ou
  cancela, que a 24.6 já tem numa transação, e reportar.
- O evento do fim do turno não diz se falhou: reportar o evento como o Mastra o emite.

## U3 O passo a passo guardado

**Base e modelo.** O `main` com a U1. Opus: cruza Builder e Hub, mexe no banco do Mastra e no
ciclo de vida.

### As linhas da tabela

- **Armazenamento.** `@mastra/pg@1.35.0` `PostgresStoreVNext`: o domínio de observabilidade com o
  próprio pool, `{ pool }` de um segundo `openMastraPool` (`platform/database.ts:343-358`, com os
  limites e o tratamento de erro de D27; o mesmo pool ou a mesma URL faz o Mastra avisar,
  `dist/index.js:27610-27620`), no esquema `mastra` herdado. `retention: { observability: { spans:
  { maxAge }, metrics: { maxAge } } }`, `prune()`, `ensurePartitions()`. O dono das partições é quem
  roda `init()`: o `prepare()` de `hub-mastra.ts` já roda `storage.init()` como `mastra_runtime`,
  que tem `CREATE` no banco do Mastra (`database-grants.sql`, `GRANT CREATE,CONNECT ON DATABASE
  mastra_database TO mastra_runtime`).
- **Configuração.** `@mastra/observability@1.23.1` `Observability({ configs: { default: {
  serviceName, exporters: [new MastraStorageExporter()], spanOutputProcessors: [scrub],
  excludeSpanTypes: [MODEL_CHUNK, PROCESSOR_RUN], requestContextKeys: ['organizationId'],
  sensitiveDataFilter: true } }, logging: { enabled: false } })`. Ler
  `node_modules/@mastra/observability/dist/docs/` antes.
- **Processador.** Contrato `SpanOutputProcessor` (`@mastra/core@1.82.0`
  `dist/observability/types/tracing.d.ts`; na prateleira `tracing.ts:2317-2331`). Para todo span:
  `input` e `output` vazios; `attributes` reduzidos a uma lista de chaves (uso de tokens, modelo,
  `finishReason`, `toolCallId`, estado do passo), o resto apagado, como a lista da U4; `entityName`
  trocado pelo `entityId` (o nome de um agente ou ferramenta é escrito por pessoa, S41) e o nome do
  span pelo tipo; `errorInfo` reduzido a `{ message: <código> }`, onde o código é o `code` da
  `Failure` do Hub ou o `id` do erro do Mastra, e `ERROR` só quando não há nenhum.
- **Empresa.** `guard.ts:180-240` põe `organizationId` = a empresa da sessão no `requestContext`.
  Nos workflows agendados (24.6) e nos turnos do Telegram (24.7), o ponto que monta o
  `requestContext` faz o mesmo.
- **Ferramenta de conector.** `isConnectorTool(name)` num só dono (C26), em `builder/observability/`:
  verdade para os nomes de `BUILDER_TOOL` que leem ou escrevem conector
  (`builder/connectors/connector-tools.ts:183,225,245`) e para o prefixo `tool_` dos agentes
  publicados (`builder/agents/tools.ts:97,172,212`), importados de onde são definidos.
- **Consultas.** `getStore('observability')`: `listTraces({ filters: { organizationId, threadId } })`
  ou `runId`, `getTrace({ traceId })`, `getMetricBreakdown({ name: [<nome>], groupBy:
  ['organizationId', 'entityName'], ... })` (o `name` é lista no Postgres). Chamadas ao modelo não
  se contam por `mastra_model_duration_ms` (conta uma por execução e duplica na retomada, prova Q8).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/observability/` | Cria | `builder/mastra/mastra.ts`, `main.ts`, rotas |
| `builder/mastra/mastra.ts`, `hub-mastra.ts` | Muda (`observability`, `prepare`, o trabalho diário) | `main.ts` |
| `builder/conversation/guard.ts` | Muda (`organizationId`) | as rotas do controlador |
| `builder/workflows/`, `builder/channels/` | Muda (o `organizationId` no `requestContext`, se não estiver) | o executor e o canal |
| `apps/server/src/main.ts` | Muda (o segundo pool, aberto e fechado; as rotas) | — |
| `packages/hub-api/src/observability.ts`, `failures.ts` (`TRACE_EXPIRED` com a frase), `index.ts` | Cria e muda | web |
| `apps/server/package.json`, `package-lock.json`, `docs/reference/stack.md` | Muda (`@mastra/observability`) | — |
| `docs/decisions/0052-one-tracing-path-builder-to-grafana.md` | Emenda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/observability.ts
export const TraceSpan = z.object({
  spanId: z.string(), parentSpanId: z.string().nullable(),
  kind: z.enum(['AGENT', 'MODEL_CALL', 'TOOL', 'WORKFLOW', 'WORKFLOW_STEP', 'OTHER']),
  entityId: z.string().nullable(),   // a tela resolve o nome
  startedAt: z.iso.datetime(), endedAt: z.iso.datetime().nullable(),
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
export const UsageByCompany = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  companies: z.array(UsageMonth.omit({ month: true }).extend({ companyId: CompanyId, name: z.string() })),
})
```

- **Rotas.** `GET /api/companies/{companyId}/traces?thread=&at=|run=` (200 `TraceList`); `GET
  /api/companies/{companyId}/traces/{traceId}` (200 `Trace`); `GET
  /api/companies/{companyId}/usage?month=` (200 `UsageMonth`); todas com `readActivity`, e as
  recusas do critério 10 e 11. `GET /api/operations/usage?month=` com `operateClients` (200
  `UsageByCompany`). Um rastro é da empresa quando todo span tem a `organizationId` dela.
- **Códigos.** `TRACE_EXPIRED` (404) no registro de falhas do `hub-api`; de log,
  `TRACE_STORE_FAILED` e `TRACE_PARTITIONS_FAILED`.
- **Configuração.** Nenhuma nova: o banco é o do Mastra (`HUB_MASTRA_DATABASE_URL_FILE`). Retenção
  de 30 dias numa constante.
- **Emenda da 0052.** "Decision": o Builder grava spans sem texto no banco do Mastra, 30 dias, e a
  empresa os vê; o mesmo caminho OTel vai ao Grafana pela ponte. Dentro de 350 palavras (L24).
- **Modelo.** `builder/automations/runs.ts:70-190` para a leitura do que o Mastra guarda (cumpre
  C21 e C26; os ids sem marca, então C23 vem do contrato acima).

### As skills e a leitura

`mastra` (observabilidade, `@mastra/pg`); `node_modules/@mastra/observability/dist/docs/`;
`node_modules/@mastra/pg/dist/docs/`; o guia de segurança (S41, S42); o guia de dados (D27).

### A ordem do trabalho

1. A prova antes do código: o teste do critério 9 com o processador, plantando na mensagem da
   pessoa, nas instruções, na descrição de ferramenta, no nome do agente e no erro. Ele tem de
   passar antes de qualquer rota.
2. Instalar `@mastra/observability` na versão que casa com `@mastra/core` 1.82.0, com a linha em
   `docs/reference/stack.md`.
3. `store.ts`: o domínio de observabilidade com o segundo pool, por `MastraCompositeStore` se o
   principal continuar o `PostgresStore` de hoje (`conversation/storage.ts:9-11`).
4. `scrub.ts` e `observability.ts`. Regras: S41.
5. `organizationId` no `requestContext` do guard e dos outros pontos de entrada.
6. `retention.ts`: `ensurePartitions()` e `prune()` ao subir e a cada 24 h (`unref`), sempre, para
   que o primeiro turno depois de dias parado tenha partição.
7. As rotas e `usage.ts`. Regras: S6, W34 (404 para quem não pode).
8. A gravação T26 de um turno com ferramenta e aprovação, e os testes 7 a 12.
9. A emenda da 0052.

### Como se prova

`npm test -w apps/server -- builder/observability`. O 9 lê o banco de teste do Mastra. O 10 cria
rastros de duas empresas. O 12 apaga a partição de amanhã e a de 31 dias atrás.

### Parar se

- Um texto plantado sobrevive num campo que o processador não alcança: reportar o campo e o tipo
  do span, não escrever filtro por conteúdo.
- O `code` da `Failure` não chega ao `errorInfo` do span da ferramenta: reportar o que chega.
- O `getMetricBreakdown` do Postgres não agrupa por `entityName`: contar as ferramentas pelos spans
  `TOOL_CALL` de `listTraces`/`getTrace` e reportar.
- `mastra_runtime` não consegue criar as partições com `statement_timeout` de 10 s.

## U4 O OpenTelemetry do Hub

**Base e modelo.** O `main` com a U3. Opus: o contexto assíncrono atravessa o Fastify e o
controlador do Mastra, e o desligamento muda.

### As linhas da tabela

- **Início.** `git show e0353c36:apps/hub/src/telemetry/start.ts`: `NodeSDK`, `HttpInstrumentation`
  com o `traceparent` de fora descartado, `UndiciInstrumentation`, `PgInstrumentation`,
  `FastifyOtelInstrumentation`, flush no SIGTERM. `pg` e `undici` com `requireParentSpan: true`,
  para que as gravações do próprio rastro e os ticks do agendador não abram rastros.
- **Lista.** `git show e0353c36:apps/hub/src/telemetry/redact.ts`: chaves exatas, prefixos
  `network.`, `gen_ai.usage.`, `conexus.`; o resto cortado e contado em
  `conexus.telemetry.attributes_dropped`; o status reduzido ao código. Acrescentar
  `mastra.span.type`, `mastra.metadata.organizationId`, `gen_ai.tool.call.id`; o nome do span
  trocado pelo tipo (o nome de um agente ou ferramenta não sai).
- **Ponte.** `@mastra/otel-bridge@1.5.21` como `bridge` da configuração da U3; com o provedor do Hub
  registrado, o `OtelExporter` não entra.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/telemetry/` | Cria | `main.ts` |
| `platform/http.ts` | Muda (o id do pedido e o do rastro, cada um com seu nome) | todas as rotas |
| `platform/config.ts`, `config.test.ts` | Muda (`HUB_OTLP_ENDPOINT`, `HUB_OTLP_TOKEN_FILE`) | `main.ts` |
| `platform/lifecycle.ts` | Muda (o flush no desligamento) | `main.ts` |
| `apps/server/src/main.ts` | Muda (`startTelemetry` antes de tudo) | — |
| `builder/observability/observability.ts` | Muda (a ponte) | — |
| `infra/compose.yaml`, `docs/how-to/hub-server.md` | Muda (a variável e o segredo) | — |
| `docs/architecture.md` | Muda (a dívida sai da seção 11; a do coletor entra) | — |
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
- **Modelo.** `platform/memory.ts` (um trabalho do processo com `unref` e log por código).

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
6. Testes 13 a 16 pela porta pública: o Hub de teste com `HUB_OTLP_ENDPOINT` apontando para um
   sumidouro HTTP local que guarda o que recebe (T5).

### Como se prova

`npm test -w apps/server -- platform/telemetry`. O 13 faz um turno pela rota do controlador com o
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
- **Desenho.** O desenho de caixas acima; Activepieces `runs-table/columns.tsx:209-340`; Mastra
  Studio `domains/traces/`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/activity/` | Cria (lista, árvore, uso, a frase de cada `kind`) | as rotas |
| `apps/web/src/routes/_app/companies/$companyId/activity*.tsx` | Cria | o menu |
| `apps/web/src/routes/_app/companies/$companyId_/settings/usage.tsx` | Cria | o índice das Configurações |
| `apps/web/src/routes/_app/operations/usage.tsx`, `route.tsx` | Cria e muda | a Central |
| `apps/web/src/routes/_app/companies/$companyId/route.tsx` | Muda (o botão) | — |

### Os contratos que a unidade cria

Nenhum do servidor. A frase de cada `kind` num só lugar, `apps/web/src/activity/phrases.ts` (C26).
O nome de um agente ou ferramenta no passo a passo vem da lista de agentes que a web já lê, pelo
`entityId`. Modelo: a seção `settings/roles.tsx` (cumpre C26).

### As skills e a leitura

`impeccable`; `shadcn`; o guia web (W32, W34); `docs/reference/impeccable.md`.

### A ordem do trabalho

1. As capturas das duas referências no PR, antes do código (W34).
2. A lista da Atividade.
3. O passo a passo, com os estados da matriz.
4. Uso e Uso por empresa, com o mesmo componente.
5. Testes 17 a 19.

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

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0052-one-tracing-path-builder-to-grafana.md` | Muda (estado e resultado) | — |
| A configuração da nuvem (fora do repositório) | Muda (o token e o endpoint) | o Hub da nuvem |

### A ordem do trabalho

1. O fundador cria a conta e o token como diz a página dele; o firstmate grava o token como arquivo
   secreto da nuvem. Nada disso entra no repositório.
2. O roteiro, passo 6, na nuvem. A captura vai ao PR, sem dado de empresa.
3. A 0052 passa a "Accepted", com o resultado do critério dela. Se falhar, o plano B (Jaeger) vira
   uma unidade nova do cartão.

### Como se prova

O critério 20, pelo fundador, com a captura.

### Parar se

- O rastro chega quebrado (spans do Mastra num rastro, os do Hub noutro): voltar à U4 com a captura.
