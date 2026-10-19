# Etapa 12: Primeira conversa

## A página do fundador

**No fim desta etapa** você pergunta ao Builder dentro de um Projeto e ele responde em português,
aos poucos, buscando na web quando precisa, pela conta certa da fila, e avisa quando troca de conta
ou quando elas acabam.

**O roteiro de uso.** No Hub publicado, Empresa A: fila Anthropic com Time 1 e Time 3 (esta com
chave errada), e Ana com uma chave Anthropic só dela.

1. Como **Ana**, Projeto "Encomendas" › **Conversa** › **Nova conversa**: o seletor abre no padrão
   da empresa, só com fornecedores em que ela tem conta. Pergunte "Compare dois apps de encomenda
   de padaria da internet": a resposta vem aos poucos, com as páginas lidas.
2. Pause a conta de Ana e suba a Time 3. Pergunte de novo: "Time 3 foi recusada. Ligue de novo;
   continuei pela Time 1." Em **Conta de modelo**: "recusada · Ligue de novo".
3. Pause a Time 1: "As contas Anthropic que você pode usar estão indisponíveis. Escolha outro
   modelo ou fale com quem administra a empresa." Nenhuma outra conta é usada.
4. Como dono, ligue a **troca automática** "Claude Sonnet → GPT" (com uma conta OpenAI): a pergunta
   continua no GPT, com "Troquei para GPT pela troca automática da empresa". A seguinte tenta o
   Claude primeiro.
5. Como **Diego**, no "Encomendas": a conversa de Ana não aparece. Na Empresa B, nada da A.
6. Dez minutos sem conversa: no console do Neon, **os dois bancos** "Idle". Firstmate restaura os
   dois, e a conversa depois do ponto some.

**O que você faz, e quando.** Antes de U1: autoriza um turno real com a sua chave Anthropic e um
com a assinatura Claude. No começo: aprova esta página. No fim: o roteiro e os textos.

**As suas respostas, como o cartão as lê; confirme ou corrija.**

- **1 A.** A conversa mora no Projeto; só quem a começou a vê e continua.
- **2, a sua.** O Builder navega e busca à vontade, sem lista de sites e sem limite por pergunta: a
  busca nativa do fornecedor (OpenAI, Anthropic, Google, xAI) e a leitura de
  página do Mastra, que recusa endereço interno, também depois do DNS. O risco do estudo fica
  **aceito pela sua resposta**: uma página com instrução escondida pode tentar desviar o Builder;
  ou levar texto da conversa num endereço; na 12 ele não grava nem tem credencial. Um limite pode vir depois, como pedido
  próprio.
- **3 A.** O horário do fornecedor; sem ele, 15 minutos para 429 e 6 horas para 402.
- **4 A, e é nativo.** O agent controller leva o aviso à conversa (evento `info`) e o guarda na
  resposta. Nada paralelo.
- **5 A, 6 A, 7 A.** Depois da troca automática, a mensagem seguinte volta ao escolhido. "Mastra
  parado" é o Hub ligado e ninguém conversando há dez minutos. O servidor monta o dono da memória
  com empresa e pessoa.

**Fica de fora.** O título automático: é outra chamada ao modelo, fora da fila de contas; a lista
mostra data e hora. A conta Google pelo CLIProxy: o processo por conta não foi estudado; aparece
"ainda não conversa" e entra na 21. O Mastra 1.78: fica a 1.69.0 da 11.
As issues `next-card` 25, 39 e 45: nada nestas pastas.

**A decisão sua: as permissões (regra D11).** Exemplo: um defeito tenta ler as contas do Hub com o
login do Mastra. **A.** O login do Mastra só entra no banco dele, e o papel da empresa vê só as
conversas da empresa: o banco recusa. **B.** O Mastra num schema do banco do Hub. **Recomendação:
A**, a da 0010.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| P0 | Regra `mastra-only-in-builder` (teste 2) | `.dependency-cruiser.cjs` | código | — | — |
| U1 | Registro 0050 e prova ao vivo | `docs/` | testes | mastra | — |
| U2 | Loja e pool do Mastra | `platform/`, `builder/conversation/storage.ts`, `infra/` | dados | neon:neon-postgres, mastra | U3 |
| U3 | Banco e login do Mastra, tabelas, grants (PR próprio, D11); portas de remoção | `platform/migrate.ts`, `builder/*/tables.ts`, migrações, grants, `hub/` | dados | neon:neon-postgres | U1 |
| U4 | O Builder | `builder/conversation/` | segurança | mastra | U3 |
| U5 | A fila na chamada | `builder/model-accounts/` | segurança | mastra | U4 |
| U6 | A troca automática | `builder/model-accounts/`, `hub-api` | segurança | fastify-best-practices | U5 |
| U7 | Rotas e stream | `builder/conversation/routes.ts`, `hub-api`, `main.ts` | código | fastify-best-practices, mastra | U4 |
| U8 | Telas e protótipo | `apps/web/src/builder/conversation/`, rotas | design, web | shadcn | U6, U7 |
| U9 | Percurso, banco dormindo, restauração | `tests/e2e/`, `docs/how-to/` | testes | neon:neon-postgres | U8 |

P0 entra antes (L20); U3 em PR próprio (D11). U6 e U7 em paralelo. Uma revisão, um merge (L9, L13).

**Orçamento de código alterado** (sem testes nem gerados): U2 220; U3 250; U4 280; U5 620; U6 330;
U7 560; U8 950; U9 60. Total **3.270**, teto 4.000 (L2). Base: a 11 orçou 780 para fila e rotas, 900 para telas.

## O que é do Mastra e o que é nosso

Fixado: `@mastra/core` 1.69.0, `@mastra/memory` 1.31.0, `@mastra/pg` 1.26.0, `@mastra/code-sdk`
1.8.1; linhas do fork `ce7e9c30`, nomes conferidos no Context7 (`/mastra-ai/mastra`).

| Mecanismo | Nativo do Mastra | Nosso, e por quê |
| --- | --- | --- |
| Conversa | `AgentController`: `createSession`, `deleteSession` (`agent-controller.ts:456`, `:748`); `sendMessage`, `subscribe`, `abort` (`session.ts:3977`, `:3430`) | rotas do Hub; nenhuma do Mastra (S39) |
| Modelo por conversa | `session.model.switch({modelId, scope: 'thread'})` (`session.ts:1742-1760`) | o seletor, só com fornecedores com conta |
| Chave por tentativa | `processInputStep` devolve o `model` (`processors/index.ts:233-240`); `processAPIError`, `{retry}` (`:571-575`) | ordem das contas, pausa até um horário, marca "recusada" |
| Aviso de troca (resposta 4) | `writer.custom` guarda a parte; `emitEvent({type: 'info'})` do contexto `controller` a leva ao vivo (`types.ts:837`, `:1091-1092`; `agent-controller.ts:2346`); o controller descarta `data-*` ao vivo (`session-run-engine.ts:1300`); igual no Mastra Code (`account-rotation-processor.ts:406-423`) | o texto em português |
| Fim das contas | `retry: false` e `writer.custom`: erro e aviso (provado) | nunca `abort()`: **defeito provado**, fica calado em `running` |
| Horário do fornecedor | `getRetryAfterMs` é interno (`utils/retry-after.ts:78`) | `retry-after` de `APICallError.responseHeaders` (C75) |
| Assinatura Claude | `opencodeClaudeMaxProvider(modelId, {authStorage})` (`claude-max.ts:291`); `CredentialStore` (`auth/types.ts:139-152`, a renovação é da loja); `refreshAnthropicToken` (`anthropic.ts:130`) | a loja sobre a conta lacrada, com reserva (S34) |
| Web | `webSearchTool` (`web-search.ts:17`), que falha fora dos quatro fornecedores (`:28-50`); `webFetchTool` (`web-fetch.ts:263`): recusa `localhost` e IP interno, também depois do DNS (`:129-152`); 100.000 caracteres, 15 s (`:11-13`) | a busca só nos quatro; sem lista, limite nem invólucro (resposta 2) |
| Memória | `Memory`; o `resourceId` do servidor vence o do corpo (`agent.ts:8175-8185`) | o dono com a empresa e o índice (resposta 7) |
| Banco | `PostgresStore`, `init()` | pool com os limites do Hub (D27), login e banco |
| Log | `new Mastra({logger, agentControllers})` (`mastra/index.ts:299`, `:326`) | `IMastraLogger` só com campos escalares: **defeito provado**, o padrão imprime o erro cru (C50, S41) |

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | P0 | Um arquivo fora de `builder/` que importa `@mastra/core`: `npm run deps` recusa | arquivo plantado | must |
| 2 | U1 | 0050 "proposed" antes. **Ao vivo**: sessões de duas empresas não veem o evento uma da outra; o modelo da conversa volta após reiniciar; a chave muda entre tentativas | o registro | must |
| 3 | U1 | **Ao vivo**: um turno pela chave e um pela assinatura Claude, com busca e leitura; se a assinatura recusar a busca, ela sai da assinatura e volta ao fundador | o registro (T14) | must |
| 4 | U3 | O login do Mastra tenta entrar no banco do Hub e ler uma tabela: recusado (teste 1) | `mastra-database.test.ts` | must |
| 5 | U2 | Arquivo do banco do Mastra ausente, vazio ou legível por outros: `CONFIG_INVALID`; após um turno, as conexões do login do Mastra vão a zero em 15 s | `config.test.ts`, `database.test.ts` | must |
| 6 | U3 | A Empresa B não lê nem grava conversa da A; Diego não lê a de Ana; o retrato bate | `isolation-conversations.test.ts`, `catalog.test.ts` | must |
| 7 | U3 | Apagar Projeto, tirar pessoa, apagar empresa: as threads somem antes das linhas; Mastra fora: pendente, nada apagado | `conversations-removal.test.ts` | must |
| 8 | U4 | Toda thread do Mastra tem linha no índice e a empresa no `resourceId`; o do navegador é ignorado (teste 4) | `conversation.test.ts`, lendo as tabelas do Mastra | must |
| 9 | U4 | `fetch` dublê com 401 e texto plantado: o texto fica fora do log, do stderr, da resposta e do stream | idem | must |
| 10 | U4 | Fornecedor fora dos quatro: responde sem busca; `web_fetch` a `127.0.0.1`, a nome que resolve para IP interno e a redirecionamento para ele: "private or reserved address" | idem | must |
| 11 | U5 | Ordem: própria, dadas, empresa; pausada, recusada, tipo desligado, em limite ou `google_cliproxy`: pulada sem chamada (testes 5, 6) | `queue.test.ts`, pelas rotas, fornecedor dublê | must |
| 12 | U5 | 429, 402: limite até o horário do fornecedor, senão 15 min e 6 h, aviso, próxima. 401, 403: `refused` (assinatura: renova antes), aviso. 400 e desconhecido: sem troca, `MODEL_CALL_FAILED` | idem | must |
| 13 | U5 | Todas fora: aviso, `agent_end` com erro, nenhuma outra chamada; com 5 contas, nenhuma tentativa perdida; na 21ª tentativa, o aviso | idem | must |
| 14 | U5 | Token recusado: "recusada · Ligue de novo", e o turno termina dizendo isso (teste 7); duas renovações juntas: uma chamada (teste 8) | `claude-refresh.test.ts` | must |
| 15 | U6 | Troca automática: dono e administrador; membro: 404; modelo fora do registro: 422 `MODEL_UNKNOWN`; velha: 412 | `model-fallback.test.ts` | must |
| 16 | U6 | Ligada e fila acabada: o próximo modelo responde, com aviso, sem a busca do fornecedor anterior; a seguinte tenta o escolhido; desligada: para | idem | must |
| 17 | U7 | Cada rota, outra empresa ou pessoa: o mesmo 404 (S10, T10); o evento de Ana nunca chega a Diego (teste 3); nenhuma rota do Mastra responde (S39); nada sai por telemetria (S42) | `conversations.test.ts` | must |
| 18 | U7 | Mesma chave: uma conversa, um turno, também após reiniciar; outro corpo: `IDEMPOTENCY_CONFLICT`; modelo sem conta: 422 `MODEL_NO_ACCOUNT` | idem | must |
| 19 | U7 | Batimento a cada 25 s; reconectar relê a conversa (o texto parcial, no protótipo); desligar espera o turno vivo até o prazo (C62) | idem, `main.test.ts` | must |
| 20 | U8 | Protótipo: `ui/` contra `playground-ui`, nos pontos de U8; escolha na 0050 | o registro | must |
| 21 | U8 | As telas da matriz, textos, teclado, foco, região viva | `conversation.test.tsx` | must |
| 22 | U8 | 390 px, 200%, dois temas, sem erro de CSP | navegador (T23) | should |
| 23 | U9 | O roteiro, Hub real, fornecedor dublê | `tests/e2e/conversation.test.ts` | must |
| 24 | U9 | **Ao vivo**: os dois bancos "Idle" após dez minutos sem conversa (0009, resposta 6) | firstmate, console do Neon | must |
| 25 | U9 | **Ao vivo**: restaurar os dois bancos pelo how-to; "Reiniciar o Hub" refaz a senha do Mastra | firstmate | must |
| 26 | U9 | **Ao vivo, se acontecer**: 429 ou 402 sem `retry-after`, anotado (resposta 3) | firstmate | should |
| 27 | U9 | Publicado: passos 1 a 6 | firstmate, fundador (T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Conversas do Projeto | "Nenhuma conversa", **Nova conversa**; "Conversa de 19/10, 15h40" | a partilhada | a de `ui/` | a do Projeto | — |
| Conversa | campo e seletor; sem conta: o aviso da 11 | "Pensando…", **Parar** | `MODEL_CALL_FAILED`: "O modelo não respondeu." | a do Projeto | os avisos de troca, recusa e contas acabadas |
| Seletor | modelos com conta | idem | idem | — | "ainda não conversa" (Google) |
| Troca automática | "Desligada" | idem | 412: "Mudou antes de você salvar" | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `conversationId`, `createdAt` | `createConversation` | lista, conversa |
| `model` | criar, `setConversationModel` (sessão) | seletor, a fila |
| `messages[]`, com os avisos | o Mastra | conversa |
| evento `text`, `part`, `notice`, `turnEnd.reason`, `failure` | o stream | conversa (Parar, avisos, falha) |
| `limitedUntil`, `state: 'refused'` da conta | a fila | telas da 11, a fila |
| `fallback {enabled, chain, revision}` | dono, administrador | tela, a fila |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `createConversation` | `Idempotency-Key` | a linha antes da thread | banco ou Mastra: 503 | `CONVERSATION_CREATED` | 8, 18 |
| `sendConversationMessage` | `Idempotency-Key`; a sessão enfileira | a memória guarda o que veio | fornecedor: a fila | `CONVERSATION_TURN_STARTED`, `_ENDED` | 13, 18 |
| Chamada ao modelo | uma por tentativa | `retry: false` | só campos escalares no log | `MODEL_CALL_REFUSED` | 9, 12 |
| Marca de limite, `refused` | `UPDATE` idempotente | uma instrução | banco: falha sem marca | `MODEL_ACCOUNT_LIMITED`, `_REFUSED` | 12, 14 |
| Renovação Claude | reserva com prazo (D25); o segundo relê | falha após a troca: "Ligue de novo" (S34) | Anthropic: `refused` | `MODEL_TOKEN_REFRESHED` | 14 |
| `setConversationModel` | estado final | — | Mastra: 503 | `CONVERSATION_MODEL_SET` | 18 |
| Troca automática | `If-Match` | uma transação | banco | `MODEL_FALLBACK_SET` | 15 |
| `init` do `PostgresStore` na subida | `IF NOT EXISTS` | não inicia | banco do Mastra: não inicia | `MASTRA_STORAGE_READY` | 5 |
| Apagar threads na remoção | já apagada conta | pendente, repete | Mastra: pendente | `CONVERSATIONS_RELEASED` | 7 |
| `stopConversation`, `deleteSession` | o segundo: 204 | o turno para; a memória guarda o que veio | — | `CONVERSATION_STOPPED` | 19 |
| `migrate`: banco, login, senha do Mastra | `IF NOT EXISTS`; senha só após 28P01 (D32) | não publica | Neon: não publica | `MASTRA_LOGIN_READY` | 4, 25 |
| `web_fetch`, busca | — | `isError` ao modelo | o modelo diz | — | 3, 10 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Fila na chamada | nova | `builder/model-accounts/queue.ts` | — | credencial aberta na transação que prova o direito (`model-routing.ts:32-39`) |
| Renovação Claude | nova | `builder/model-accounts/claude/store.ts` | — | compare-and-swap (`store.ts:85-90`), agora com reserva |
| Erros do fornecedor | nova | `builder/model-accounts/errors.ts` | — | classes por status (`error-processors.ts:57-66`) |
| Índice e rotas | nova | `builder/conversation/` | — | texto do fornecedor tirado antes do navegador (`mastra-session-routes.ts:128-152`); `requestContext` do cliente recusado |

**A medida do transplante.** Nada é copiado (`e0353c36`): só a conversa entraria, mudando mais de
um terço. As fichas 3.14 e 3.15 da auditoria ficam como as regras deste cartão.

**A dívida.** Conversa criada entre a liberação e a remoção: thread órfã, com a empresa; a 16 varre.
Mais de 20 tentativas num turno: contas acabadas. S36 cita uma guarda do Hub para o `web_fetch`
que não existe; a nativa fica (C75), para o fechamento.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0050-…`, `index.md`; `architecture.md` §8, §11 (dívida, risco da resposta 2) | cria, muda | `check-docs` |

### Os contratos que a unidade cria

0050: conversa no `AgentController`, fila no processador, aviso por `info`. Criterion: crit. 2 e 3.
Só documentos (L13); credenciais da prova apagadas. Regras: L21, T14, S40.

## U2 Banco e login do Mastra

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `platform/config.ts` | `HUB_MASTRA_DATABASE_URL_FILE` | `main.ts` |
| `platform/database.ts` | `openMastraPool` | `builder/conversation/storage.ts` |
| `builder/conversation/storage.ts` | o `PostgresStore` | `builder.ts` |
| `infra/compose.yaml`, `deploy.sh`, `how-to/hub-server.md`; `package.json`, `package-lock.json` | o arquivo; `@mastra/memory`, `@mastra/pg` fixos | publicar |

### Os contratos que a unidade cria

`openMastraPool(deps: {url; log}): pg.Pool`, com `POOL_LIMITS`; `createMastraStorage(pool)`, schema `mastra`.

**Ordem.**

1. Pool e loja. Regras: D27, C57. Funções: `@mastra/pg` 1.26.0 `PostgresStore({id, pool,
   schemaName})`, `init()`.

**Prova.** 4, 5: `npm run test -w @conexus/server`.

## U3 Índice, permissões e remoção

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/tables.ts`, `store.ts` | cria | U4, U7 |
| `platform/migrate.ts`, `apps/server/migrations/`, `database-grants.sql`, `test-database.ts` | o banco e o login do Mastra; as tabelas da 12 (também a de U6); grants; o retrato | `migrate`, `catalog.test.ts` |
| `hub-api/src/project-failures.ts`, `people-failures.ts` | as falhas pendentes (C48) | web |
| `builder/model-accounts/tables.ts` | `limited_until`, `refresh_until`; `UPDATE` em `state` | U5 |
| `hub/projects/projects.ts`, `hub/identity/`, `hub/operations/clients.ts` | porta `ReleaseConversations` | `main.ts` |

### Os contratos que a unidade cria

`builder.conversation`: `id` uuid (o id da thread), `company_id`, `project_id` para
`hub.project` e `person_id` para `auth.member (company_id, user_id)`, `ON DELETE CASCADE`;
`created_at`. `builder.conversation_turn (conversation_id, company_id, idempotency_key, body_hash)`,
única por conversa e chave (C37). Política de linha (0039). Porta no Hub: `type ReleaseConversations = (scope:
{companyId; projectId?; personId?}) => Promise<void>`; falha vira `PROJECT_DELETION_PENDING`,
`PERSON_REMOVAL_PENDING`, `CLIENT_DELETION_PENDING`.

**Ordem.** Regras: D1, D11, D12, D22, D25, D32, 0010, 0038, 0039, S31, S6–S11, W4. Funções: `drizzle-orm` 1.0.0-rc.4 `pgTable`;
`Memory.deleteThread` (`memory/src/index.ts:1040`): o Mastra apaga, não o nosso código.

**Prova.** 4, 6, 7: `npm run test -w @conexus/server`; T10 com outra empresa e outra pessoa.

## U4 O Builder

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/builder.ts`, `logger.ts`, `public.ts` | cria | U5, U7, `main.ts` |

### Os contratos que a unidade cria

`createBuilder(deps): {controller; mastra}`; `memoryOwner(companyId, personId)`:
`company:<id>:person:<id>`. Agente `builder`: `model` de
`requestContext.get('controller').session.modelId`, sem chave; `maxRetries: 0`;
`maxProcessorRetries: 20`, no fim dele o aviso de contas acabadas (o Mastra descartaria calado,
`llm-execution-step.ts:2136`); `tools` por função: `web_fetch` sempre, `web_search` só nos quatro.
`Memory({options: {lastMessages: 10, generateTitle: false}})`, só isso; observabilidade desligada
(S42).

**Ordem.**

1. Logger: `IMastraLogger` que passa só nome, status e código ao `FailureLog`. Regras: C50, S41.
2. Agente, memória, controller. Regras: C75, S36. Funções: `@mastra/core` 1.69.0 `Agent`,
   `AgentController({id, agent, memory, modes})`, `init()`, `Mastra`; `webSearchTool`, `webFetchTool`.

**Prova.** 8, 9, 10: `npm run test -w @conexus/server`, `fetch` dublê.

## U5 A fila na chamada

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/queue.ts`, `errors.ts`, `claude/store.ts`, `public.ts` | cria, muda | U4 |

### Os contratos que a unidade cria

`class AccountQueue implements Processor<'account-queue'>`, em `inputProcessors` e, depois do
`StreamErrorRetryProcessor`, em `errorProcessors`. `processInputStep` devolve `{model: {id, apiKey}}`
ou, na assinatura, `opencodeClaudeMaxProvider`; na troca de fornecedor (U6), `activeTools` sem
`web_search`. `type CallFailure =
'limited' | 'refused' | 'unknown'`, de `APICallError.statusCode` (C52). Aviso: parte `data-conexus-notice`
`{kind: 'account-switched' | 'accounts-exhausted' | 'model-switched'; text}` e `info`.

**Ordem.**

1. A próxima conta: leitura com admissão, `builder.sealed_of`, `open` (Grant A). Regras: S32, S36.
2. Erros e marcas. Regras: C52, C57, D22. Nunca `abort()`.
3. A loja Claude (`CredentialStore`): reserva `refresh_until`, chama `refreshAnthropicToken` sem
   transação e grava com a revisão. Regras: S34, D22, D25, C65.

**Prova.** 11–14: `npm run test -w @conexus/server`, fornecedor e Anthropic dublês.

## U6 A troca automática

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/fallback.ts` | cria (tabela em U3) | U5 |
| `packages/hub-api/src/model-accounts.ts` | `setModelFallback`; `fallback` em `listModelAccounts` | web |
| `apps/web/src/builder/model-accounts/` | a seção | rotas |

### Os contratos que a unidade cria

`builder.company_model_fallback (company_id, enabled, chain text[], revision)`, criada em U3.
`setModelFallback` `PUT /api/companies/{companyId}/model-fallback`, `If-Match`, `{enabled, chain}`:
200; 404; 412; 422 `MODEL_UNKNOWN`. Vale só para o turno (resposta 5).

**Ordem.** Regras: C28, C33, C38, S10, D11. Funções: `processInputStep` com o próximo modelo da cadeia.

**Prova.** 15, 16: `npm run test -w @conexus/server`, pelas rotas.

## U7 Rotas e stream

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/routes.ts`, `sessions.ts` | cria | `main.ts` |
| `packages/hub-api/src/conversations.ts`, `failures.ts`, `index.ts` | operações, eventos, falhas | web, OpenAPI |
| `hub/identity/admission.ts`, `hub/projects/public.ts` | `useConversations` (`MEMBER`); admissão do Projeto | Builder |
| `main.ts`, `infra/compose.yaml` | liga o Builder; drena turnos ao parar | — |

### Os contratos que a unidade cria

Operações `session`, sob `/api/companies/{companyId}/projects/{projectId}`; alheia: 404
`CONVERSATION_NOT_FOUND`.

| Operação | Método e caminho | Saída e falhas |
| --- | --- | --- |
| `listConversations` | `GET /conversations` | as da pessoa, 50 por página (C44) |
| `createConversation` | `POST /conversations`, `Idempotency-Key`; `{model?}` | 201; 422 `MODEL_NO_ACCOUNT` |
| `readConversation` | `GET /conversations/{conversationId}` | `{id, model, messages}` |
| `sendConversationMessage` | `POST /conversations/{conversationId}/messages`, `Idempotency-Key`; `{content}` | 202 |
| `streamConversation` | `GET /conversations/{conversationId}/events`, `text/event-stream` | `ConversationEvent` |
| `stopConversation` | `POST /conversations/{conversationId}/stop` | 204 |
| `setConversationModel` | `PUT /conversations/{conversationId}/model`; `{model}` | 200; 422 |

`ConversationEvent = {type: 'text'; delta} | {type: 'part'; part} | {type: 'notice'; text} |
{type: 'turnEnd'; reason} | {type: 'failure'; code}`. Uma sessão por conversa (`resourceId` de
`memoryOwner`, `scope` e `threadId` = id); `deleteSession` ao fechar o último stream sem turno.

**Ordem.**

1. Contrato. Regras: C28–C38, C49, C51.
2. Sessões e stream. Regras: S10, S39, C57 (prazo próprio do stream), C62, C63.

**Prova.** 17, 18, 19: `npm run test -w @conexus/server`.

## U8 Telas e protótipo

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/`; `platform/hub.ts` (stream); `ui/`; `apps/web/package.json` | lista, conversa, seletor, avisos | rotas |
| `routes/_app/companies/$companyId/projects/$projectId.conversations.tsx`, `$projectId.tsx` | a aba | `routeTree.gen.ts` |

**Ordem.**

1. Protótipo: pacote, `@mastra/core` no navegador, corte, markdown parcial, região viva,
   ferramenta, `Select`, msw. Regras: W7, 0033.
2. Telas. Regras: W1, W4, W6, W8, W9, W12, W17, W23, W24; V29–V31, V35, V39, V55.

**Prova.** 20: o registro; 21: `npm run test -w @conexus/web`; 22: o navegador.

## U9 Percurso, banco dormindo, restauração

`tests/e2e/conversation.test.ts` no `e2e`; `how-to/hub-database-restore.md` com os dois bancos. 23: `npm run e2e`; 24–27: após o Release (T13, T14).
