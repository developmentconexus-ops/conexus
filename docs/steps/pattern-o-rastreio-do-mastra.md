# O rastreio do Mastra, guardado no nosso banco

Cartão curto, fora da ordem do roteiro (delivery L1). O pedido do fundador, em 2026-11-13: "vamos
habilitar o Master Traces ... vai ficar muito mais fácil da gente entender todo o comportamento do
assistente, do builder ... É nativo do Master, é fácil de habilitar"; e, logo depois, "a gente não
vai utilizar a plataforma do master, a gente vai guardar no nosso banco." No mesmo dia um turno do
Assistente falhou com 400 da Anthropic e o Hub guardou só o número. A decisão é a
[0068](../decisions/0068-mastra-tracing-in-its-own-database.md), que substitui a 0052. Lido em `main`
`f01afd98`, com `@mastra/core` 1.82.0 e `@mastra/pg` 1.35.0 instalados (os `dist/docs` deles) e a
prateleira `mastra-1.82` (tag `@mastra/core@1.82.0`, commit `6e8dfcb8`, com `@mastra/observability`
1.23.1, o Mastra Code e o Factory em `mastracode/`). Referências que o fundador mandou: as páginas
`observability/overview`, `observability/tracing/overview`, `observability/logging`,
`observability/integrations/exporters/mastra-storage`, `integrations/databases/clickhouse`,
`integrations/databases/neon` e `ai-agent-observability` do mastra.ai, conferidas na versão
instalada. Nada foi rodado: os números de volume abaixo são estimativa, e a primeira coisa da U1 é
medi-los.

Este cartão ocupa a vaga do trilho de padrão (o `pattern-` do nome, L5) só porque é um cartão curto
fora da ordem do roteiro e a vaga está livre: a frente tem a Ontologia, o assistente e o desenho
têm os seus. Ele não mexe no kit de conectores nem nos moldes. Com as unidades da Ontologia, a U1
divide só `conversations-of.ts`, onde soma um workflow à lista, e espera por elas nesse arquivo (L1).

## A página do fundador

**No fim desta etapa** cada conversa do Assistente, do Builder, do Construtor e dos agentes da
empresa deixa o seu rastro no banco do Mastra, no Brasil: cada chamada ao modelo com o que entrou, o
que saiu, o tempo e os tokens, cada ferramenta com a entrada e a resposta, e, quando o provedor
recusa, o número e o texto da recusa. Um 400 como o de hoje fica guardado com o motivo, ao lado do
turno. Nada vai para a plataforma da Mastra.

**O roteiro de uso.**

1. No Hub no ar, abra uma conversa do Assistente e peça uma coisa que use uma ligação, por exemplo
   "quais pedidos entraram hoje?".
2. No Neon, abra o banco do Mastra no **SQL Editor** e cole a consulta pronta do cartão com o
   endereço da conversa: aparece uma linha por passo, com o modelo, o tempo, os tokens, a pergunta e
   a resposta de cada ferramenta.
3. Faça o mesmo com uma conversa do Builder: aparecem os passos dele, um por chamada.
4. Diga o que viu.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e escolhe as letras abaixo.
No fim: faz o roteiro e diz o que viu.

**Fica de fora.** Uma tela de rastros no Hub, o OpenTelemetry para o Grafana (fica aberto para a
21.1, como mais um destino ao lado deste), os evals e os scorers, painéis de custo, e qualquer
mudança em como o Hub classifica um erro (é do diagnóstico do 400). A plataforma da Mastra fica de
fora pela sua palavra.

**O que o rastro guarda, e o que isso pede de você.**

- **Conteúdo completo.** O texto que a pessoa escreveu, as instruções, a resposta do modelo e a
  resposta de cada ferramenta como o modelo a viu. De uma ligação, o modelo só vê o que o
  `readThrough` deixa: o Assistente, o Builder e as cópias não recebem o tipo documento, mas recebem
  nome, contato e endereço; a porta genérica do Sankhya (`consultar`, `carregar`) ainda entrega o
  CPF ao Assistente, pela sua decisão G. Então o rastro guarda dado pessoal da empresa, no Brasil,
  dentro do banco do Mastra, pelo prazo da letra B. A regra S41 do guia de segurança (nada de texto
  de pessoa em log nem em trecho) passa a valer para o log e para o que sai; o rastro do Mastra no
  banco dele fica de fora dela, pela decisão 0068. A frase entra no guia no fechamento desta etapa,
  porque um guia não muda com uma etapa em construção (L20). A linha 21.1 do roteiro dizia "as ferramentas de conector sem entrada
  e saída no span" (da etapa 20): ela valia para o que sai para o Grafana, e continua valendo lá.
- **Apagar uma empresa** não apaga os rastros dela: eles saem pelo prazo.
- **Chaves e senhas** que aparecem com nome de chave (`token`, `apiKey`, `password` e afins) saem
  como `[REDACTED]`; o filtro do Mastra já vem ligado e olha o nome da chave, não o texto.

**As decisões suas nesta etapa.** Escolhidas por você em 2026-11-13: "A A2 B B1 E E1". A2, o
`PostgresStoreVNext`, com a regra dos cerca de 600 KB por turno no pico de 58 por dia; B1, 14 dias;
E1, o SQL Editor do Neon com a consulta pronta. As outras letras ficam abaixo como foram postas.

- **A. Onde o rastro mora.** (Nativo nas três; a medida da U1 decide entre A2 e A3 pela regra
  abaixo, que você aprova agora.)
  - **A1.** O `PostgresStore` de hoje, na tabela de rastros que o banco do Mastra já tem. Guarda só
    os trechos; não guarda os logs nem as somas, e a limpeza apaga linha por linha.
  - **A2 (recomendada).** O `PostgresStoreVNext` no mesmo banco do Mastra, na mesma conexão. Guarda
    trechos, logs e somas em tabelas por dia; a limpeza derruba o dia inteiro; o rastro aparece
    enquanto o turno ainda roda. Muda uma linha da loja; a memória e as conversas não mudam.
  - **A3.** O ClickHouse num contêiner no nosso servidor em São Paulo, só para o rastro, pela loja
    composta do Mastra. Comprime muito e apaga sozinho pelo prazo, mas é mais um banco para manter
    numa máquina de 2 vCPU e 7,9 GiB, com senha nova e sem cópia de segurança, e o rastro só aparece
    quando o turno termina. O ClickHouse Cloud tem São Paulo (`sa-east-1`), mas é mais um fornecedor
    pago.
  - **A regra.** A U1 mede um turno gravado do Builder e um do Assistente. O Hub no ar teve no pico 58
    mensagens de pessoa num dia (12/11, contagem dos últimos 14 dias). Se 58 turnos por dia durante 14
    dias couberem em 0,5 GB, quer dizer, se o turno medido ficar abaixo de cerca de 600 KB, fica A2.
    Se não couber, a U1 para e volta a você com o número: A2 no Neon pago (o armazenamento custa US$ 0,35 por GB por mês no
    Launch) ou A3.
- **B. Por quanto tempo.** **B1 (recomendada): 14 dias**, como o Mastra Code faz no rastro local dele.
  B2: 30 dias. Uma rotina do Mastra roda uma vez por dia, de madrugada, e apaga o que passou do
  prazo; o banco acorda alguns segundos para isso (regra D27).
- **E. Como você vê um rastro.**
  - **E1 (recomendada, agora).** O SQL Editor do Neon no banco do Mastra, com a consulta pronta pelo
    endereço da conversa. Sem código; o resultado é texto de tabela.
  - **E2.** O Studio do Mastra no seu computador, lendo o banco do Mastra por um login só de leitura.
    Pede um terminal, um login novo no banco (regra D11) e a senha dele no seu computador.
  - **E3.** As rotas de rastro do Mastra no Hub, atrás da porta, só para o operador, e o Studio
    apontado para elas. Pede um cartão próprio (as rotas do Mastra ficam numa lista fixa, S39).
  - O Mastra Code mostra o rastro pela plataforma da Mastra ou guarda num arquivo local; o Factory
    não liga o rastro do Mastra e mostra a sessão pela linha do tempo das mensagens.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A medida; o `Observability` com o `MastraStorageExporter` no `Mastra` do Hub; a loja da letra A; o logger do Hub ligado ao rastro; a limpeza da letra B; a consulta do roteiro | `apps/server/src/builder/mastra/`, `apps/server/src/builder/conversation/` (só `storage.ts`), `apps/server/src/conversations-of.ts`, `apps/server/package.json`, `package-lock.json`, `docs/reference/stack.md`, `docs/how-to/` | testing | — |

Uma unidade só: a loja, o rastro e a limpeza só se provam juntos.

**Orçamento de código alterado.** U1: cerca de 150 linhas (A2); cerca de 250 com A3, que soma um
serviço ao `infra/compose.yaml` e um segredo. Total da etapa: o mesmo.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um turno do Builder pela rota da conversa, com o dublê do provedor, deixa trechos `agent_run`, `model_step` e `tool_call` com `threadId` igual ao id da conversa e `resourceId` igual ao dono (`resourceOf`) | `builder/mastra/tracing.test.ts`, "um turno do Builder deixa o seu rastro" | must |
| 2 | U1 | O mesmo para o Assistente, o Construtor e os agentes, sem código por controlador: um caso por `CONTROLLER_KINDS` | o mesmo arquivo, "cada controlador é rastreado pelo registro único" | must |
| 3 | U1 | Uma recusa 400 do provedor (a forma gravada, T26) deixa no trecho do modelo `error.details.statusCode` 400 e `error.details.responseBody` com o texto do provedor; a mensagem de erro do Hub ao cliente não muda | o mesmo arquivo, "a recusa do provedor fica no rastro com o corpo" | must |
| 4 | U1 | Uma entrada de ferramenta com `apiKey` plantado chega ao banco como `[REDACTED]`; o resto da entrada fica | o mesmo arquivo, "a chave plantada sai como [REDACTED]" | must |
| 5 | U1 | Fechar o Hub logo depois de um turno grava os trechos dele (o `mastra.shutdown` esvazia o exportador) | o mesmo arquivo, "fechar o Hub não perde o último turno" | must |
| 6 | U1 | Um aviso do Mastra dentro de um turno vira uma linha de log no banco do Mastra com o `traceId` do turno; no log do contêiner a linha `MASTRA_WARNING` ganha `trace_id` e `span_id` e continua sem a mensagem (S41): o texto plantado não aparece no log do contêiner | `builder/mastra/logger.test.ts`, "o aviso vai ao rastro, o log do contêiner fica com escalares" | must (A2, A3) |
| 7 | U1 | A limpeza apaga o que passou do prazo da letra B e guarda o resto | `builder/mastra/retention.test.ts`, "a limpeza tira os dias vencidos" | must |
| 8 | U1 | Sem ninguém usando, o Hub com o rastro ligado não manda comando ao banco do Mastra (D27), fora a limpeza no seu horário | `builder/automations/scheduler.test.ts`, o caso do banco quieto, com o rastro ligado | must |
| 9 | U1 | Um banco do Mastra de hoje, com conversas, sobe com a loja nova: as tabelas novas aparecem, as conversas continuam lidas | `builder/mastra/tracing.test.ts`, "a loja nova sobe sobre o banco de hoje" | must |
| 10 | U1 | A medida: bytes e linhas por turno gravado do Builder e do Assistente, escritos no corpo do pull request com a conta da regra A | a medida da U1, passo 1 | must |
| 11 | U1 | A consulta do roteiro, colada no banco de teste com o id de uma conversa, devolve os passos dela | `docs/how-to/rastro-de-uma-conversa.md`, rodada no banco de teste | should |

## A matriz de estados

Nenhuma tela nova nem mudada.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| — | — | — |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A escrita do `MastraStorageExporter` (lotes a cada 5 s ou 1.000 eventos) | dois turnos ao mesmo tempo entram no mesmo lote | o Hub cai antes do lote: os trechos ainda no buffer se perdem; o turno e a memória não | o banco fora: 4 tentativas, depois o lote cai; o turno segue | `MASTRA_WARNING` com escalares | 5, 6 |
| `init()` das tabelas novas (A2: tabelas por dia, criadas pelo login `mastra_runtime`, dono delas) | dois Hubs subindo: `CREATE ... IF NOT EXISTS` | o próximo `init()` termina | o Hub não sobe, como hoje | o que o Mastra imprime hoje | 9 |
| A limpeza diária (`storage.prune()`) | uma rotina só, a agenda do Mastra a dispara uma vez | a próxima volta termina o que faltou (`done: false`) | a volta falha e a próxima tenta | `MASTRA_WARNING` | 7 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O rastreio na instância | U1 | sem `observability` (`builder/mastra/mastra.ts:30-36`) | `observability/overview.mdx:51-89` (prateleira); Mastra Code `mastracode/sdk/src/index.ts:786-844`; o `Mastra` registra cada controlador (`@mastra/core` `dist/mastra-D4MXu5BN.js:1288-1292`) | `new Observability({ configs: { default: { serviceName, exporters } } })` uma vez | nativo | — | 2026-11-13 | — |
| O destino | U1 | — | `observability/integrations/exporters/mastra-storage.mdx:103-143`; `observability/mastra/src/exporters/mastra-storage.ts:31-40,101-112` | `MastraStorageExporter()`, a estratégia vem da loja | nativo | — | 2026-11-13 ("guardar no nosso banco") | — |
| A loja (A) | U1 | `PostgresStore` (`conversation/storage.ts:10`); só trechos, `batch-with-updates` (`@mastra/pg` `dist/index.js:15097-15102`) | `PostgresStoreVNext extends PostgresStore`, com `observability: { pool }` (`dist/index.js:27661-27691`); `event-sourced` (`:21974-21979`); tabelas `mastra_span_events`, `mastra_log_events` e outras, por dia (`:16274-16312`); ClickHouse `integrations/databases/clickhouse.mdx` | troca a classe; o mesmo pool avisa uma vez (`:27620-27626`) | nativo | a medida (critério 10) | a letra A | — |
| A amostragem | U1 | — | `observability/mastra/src/instances/base.ts:126` | `always` por padrão | nativo | — | não precisa | — |
| O filtro de segredo | U1 | — | `observability/mastra/src/default.ts:144-157,205-216`; `span_processors/sensitive-data-filter.ts:85-110` | ligado por padrão, por nome de chave | nativo | — | não precisa | — |
| Os limites de tamanho | U1 | — | `observability/mastra/src/spans/serialization.ts:43-49` | texto até 128 KB, listas e objetos até 50 itens, 8 níveis: a resposta de uma ligação (20 linhas, 16 KB) cabe inteira; uma conversa com mais de 50 mensagens entra no passo cortada em 50 | nativo | — | não precisa | — |
| O motivo de uma recusa | U1 | o Hub guarda só o número | `observability/mastra/src/spans/default.ts:34-51,175-197` | `statusCode`, a URL sem a busca e o `responseBody` do erro de API no trecho | nativo | — | não precisa | — |
| Empresa, pessoa e conversa no trecho | U1 | `resourceOf` (`controller-kit/kinds.ts:56-57`); o id da conversa é o da thread | `packages/core/src/agent/agent.ts:9066-9093` | o `agent_run` grava `resourceId` e `threadId` sozinho | nativo; `requestContextKeys` fica vazio (`instances/base.ts:134`), porque o `RequestContext` do Hub leva o nome de quem escreve e a aprovação (`conversation/guard.ts:193,228-236`), não ids | — | não precisa | — |
| Os logs junto do rastro | U1 | `BuilderLogger` próprio, só escalares (`builder/mastra/logger.ts:32-58`) | `observability/logging.mdx` (prateleira); `@mastra/core` `dist/logger-BwbmRqfc.js:3-5,30-43,198-200` | um logger próprio sem o gancho cai na escrita dupla obsoleta; o nativo é `__attachObservability` e `getLogSink()`, nível mínimo `warn` | nativo pelo gancho; o `PinoLogger` de `@mastra/loggers` fica fora, porque o log do contêiner é o pino do Hub com destino síncrono (`stack.md`, linha `pino`) | — | não precisa | — |
| A limpeza (B) | U1 | — | `reference-storage-retention.md:7-11,38-42,131` (`@mastra/core` docs); `dist/index.js:21903-21972`; Mastra Code `mastracode/sdk/src/utils/local-observability.ts:9-17`; workflow com `schedule` (`docs-workflows-scheduled-workflows.md:9-40`) | `retention.observability` na loja e `prune()` por uma rotina; o Mastra nunca roda sozinho | nativo | — | a letra B | — |
| O esvaziar ao fechar | U1 | `hub-mastra.ts:118-125` chama `mastra.shutdown()` | `dist/mastra-D4MXu5BN.js:5671` | `shutdown` chama `observability.shutdown()` antes de fechar a loja | nativo | — | não precisa | — |
| A telemetria de uso do Mastra | — | `MASTRA_TELEMETRY_DISABLED` (`infra/compose.yaml`) | — | é outra coisa: não é o rastro | nativo; fica de fora e continua desligada | — | — | — |
| A plataforma da Mastra | — | — | `docs-mastra-platform-observability.md:87-107,167,211` | sai dos EUA por padrão | nativo; fica de fora pela palavra do fundador | — | 2026-11-13 | — |

**A medida do transplante.** Nada trazido do repositório antigo.

**A dívida.** Nenhuma nova; a linha "Trace ids are Fastify's request ids until 21.1" da arquitetura
continua, porque o trecho do Hub é da 21.1.

## O que a construção mudou no cartão

Escrito na construção (delivery L7), sem mudar o que o fundador vê nem as letras dele:

- **A medida.** Um turno gravado com uma ferramenta gravou cerca de 330 KB de trechos
  (`pg_column_size`) e 650 KB de tabela, contando as primeiras páginas das partições do dia, que se
  pagam uma vez por dia. 58 turnos por dia durante 14 dias dão cerca de 270 MB: A2 fica.
- **A loja.** O domínio v-next do Postgres (`ObservabilityStoragePostgresVNext`) entra pela loja
  composta do Mastra (`MastraCompositeStore`, `default` e `domains.observability`), no mesmo pool,
  como o guia de observabilidade do Mastra mostra. O `PostgresStoreVNext` faz o mesmo, mas imprime
  um aviso cru quando o pool é o mesmo (`@mastra/pg` 1.35.0 `dist/index.js:27620-27669`), que o log
  do contêiner e o relator dos testes recusam. Os tipos `PostgresStore` dos donos da loja viram
  `MastraCompositeStore`, sem outra mudança, inclusive em `builder/assistant/` (só o tipo).
- **O que o diagnóstico do 400 pediu** (firstmate, 2026-11-13). O trecho que falha (`model_step`,
  `model_inference`, `model_generation`, `agent_run`) guarda `statusCode`, `url`, `isRetryable` e o
  `responseBody` inteiro (`@mastra/observability` 1.23.1 `dist/index.js:3905-3918`); o cabeçalho
  `request-id` não é guardado (a mesma função não lê cabeçalhos), e um `request_id` que venha no
  corpo fica, porque o corpo fica inteiro. O pedido do passo está no `input` do `model_step`, e o
  pedido já convertido para o provedor (com as partes de raciocínio) no trecho `llm request processor:
  provider-history-compat`, campo `prompt`. Os tokens do passo estão em `attributes.usage`
  (`inputTokens`, `outputTokens`, `inputDetails.cacheRead`). Uma lista guarda só os primeiros 50
  itens (`dist/index.js:455-460`), o que cortaria as mensagens mais novas de uma conversa longa:
  `serializationOptions.maxArrayLength` passa a 500; um texto continua cortado em 128 KB (131.072
  caracteres). Os trechos de cada pedaço do stream (`model_chunk`) saem, como o exportador da
  plataforma do Mastra já faz.
- **A conta que atendeu.** O provedor e o modelo vêm no trecho, mas uma chave da Anthropic e a
  assinatura do Claude dizem os dois `anthropic`. O `conexus-account-pick`
  (`model-accounts/processors.ts`) grava no próprio trecho, pelo `args.tracing.currentSpan.update`
  nativo, o id, o tipo e o modelo da conta escolhida.
- **A limpeza** mora no `Mastra` do Hub (`hub-mastra.ts`), sem passar por `conversations-of.ts`.
  Com ela a agenda do Mastra liga sempre e dorme até as 03:30: o caso de `scheduler.test.ts` sem
  automação passa a provar isso, e nenhuma leitura entre os disparos (D27).

## U1 O rastreio ligado

**Base e modelo.** O `main` em `f01afd98`. Sonnet: a configuração é nativa e as linhas estão aqui.

### As linhas da tabela

Todas as linhas construídas da tabela de referência.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/package.json`, `package-lock.json` | Cria `@mastra/observability` 1.23.1 (A3: `@mastra/clickhouse` 1.29.0) | o servidor |
| `docs/reference/stack.md` | Cria a linha de `@mastra/observability` | `check-docs` |
| `apps/server/src/builder/conversation/storage.ts` | Muda a classe da loja e a `retention` | `conversations-of.ts` |
| `apps/server/src/builder/mastra/` | Muda `mastra.ts` (o `observability`), `logger.ts` (o gancho); cria `retention.ts` (o workflow da limpeza) e os testes | `hub-mastra.ts` |
| `apps/server/src/conversations-of.ts` | Registra o workflow da limpeza ao lado dos outros dois | `main.ts` |
| `docs/how-to/rastro-de-uma-conversa.md`, `docs/index.md` | Cria a consulta do roteiro, em português, e a linha dela no mapa (L24) | o fundador, `check-docs` |
| `infra/compose.yaml` | Só com A3: o serviço `clickhouse` e o segredo `hub_clickhouse_password` (`*_FILE`) | o servidor |

### Os contratos que a unidade cria

Nenhuma rota, coluna do Hub nem tipo exportado. Uma constante: `RETENTION_WORKFLOW` (o id do workflow
da limpeza), dona em `builder/mastra/retention.ts`. O prazo da letra B mora uma vez, em
`conversation/storage.ts`, na `retention` da loja; o workflow chama `storage.prune()` sem repetir o
prazo. Nenhum arquivo é tomado como modelo: a unidade não cria forma nova de módulo; o workflow segue
o `copyRun` de `conversations-of.ts`, registrado do mesmo jeito.

### As skills e a leitura

`mastra` (primeiro `node_modules/@mastra/core/dist/docs` e `node_modules/@mastra/pg/dist/docs`;
`@mastra/observability` 1.23.1 no `dist` instalado e na prateleira `mastra-1.82`), `node`,
`typescript-best-practices`, e as linhas de `docs/reference/stack.md` das pastas acima.

### A ordem do trabalho

1. **A medida.** Instale `@mastra/observability` 1.23.1, ligue o `Observability` com o
   `MastraStorageExporter` sobre o `PostgresStoreVNext` no banco de teste e rode um turno gravado do
   Builder (`conversation/conversation-recorded.test.ts`) e um do Assistente. Conte as linhas e os
   bytes (`pg_total_relation_size` das tabelas `mastra_*_events`). Escreva no corpo do pull request:
   bytes por turno, vezes 58 turnos por dia (o pico medido), vezes 14. A regra A decide: acima de
   0,5 GB (cerca de 600 KB por turno, na média do Builder e do Assistente pesada pelo uso), pare e
   volte ao fundador.
2. `conversation/storage.ts`: `new PostgresStoreVNext({ id, pool, schemaName: 'mastra',
   observability: { pool }, retention: { observability: { spans, logs, metrics: { maxAge } } } })`.
   Regras: data D27, decisão 0010 (o login `mastra_runtime` é dono das tabelas que cria; nada muda em
   `database-grants.sql`).
3. `builder/mastra/mastra.ts`: `observability: new Observability({ configs: { default: {
   serviceName: 'conexus-hub', exporters: [new MastraStorageExporter()] } } })`. Sem
   `spanOutputProcessors`: o `SensitiveDataFilter` entra sozinho por último. Sem `sampling` nem
   `serializationOptions`: os padrões valem.
4. `builder/mastra/logger.ts`: `__attachObservability(ctx)`; em `warn`, `error` e
   `trackException`, `ctx.getLogSink()?.[level](message, buildLogRecordData(args))` quando
   `ctx.options.export`, e `ctx.resolveTraceFields()` somado aos escalares da linha do contêiner
   quando `ctx.options.correlation`. O nível do rastro fica no padrão `warn`; `debug` e `info`
   continuam fora dos dois lados.
5. `builder/mastra/retention.ts`: um workflow com `schedule: { cron: '30 3 * * *', timezone:
   'America/Sao_Paulo' }` e um passo que chama `mastra.getStorage().prune({ maxRows: 50_000 })`;
   registrado em `conversations-of.ts`.
6. `docs/how-to/rastro-de-uma-conversa.md`: a consulta por `"threadId"` em `mastra.mastra_span_events`,
   em ordem de `startedAt`, com `spanType`, `name`, `model`, a duração, os tokens, `input`, `output` e
   `error`; e a variante por empresa (`"resourceId" LIKE '%company:<id>:%'`). A linha dele entra em
   `docs/index.md`.

### Como se prova

Os critérios 1 a 9 pela rota da conversa com os dublês de provedor (T24) e as gravações que já
existem (T26), no banco de teste; o critério 10 no corpo do pull request; o 11 colando a consulta no
banco de teste. Hoje todos falham: não há rastro.

### Parar se

- A medida passa da regra A.
- O exportador repete um aviso a cada lote (um sinal que a loja não guarda), ou o Mastra imprime o
  aviso do mesmo pool em mais de uma linha por subida.
- O critério 8 falha: o rastro ou a busca de filtros do Mastra manda comando ao banco sem uso.
- O teste do critério 3 pede uma forma de erro do provedor que nenhuma gravação tem: grave com
  `npm run record` (T26).
