# Etapa 12: Primeira conversa

## A página do fundador

**No fim desta etapa** o Builder responde num Projeto, em português, aos poucos, buscando na web,
pela conta certa da fila, e avisa quando troca de conta ou elas acabam.

**O roteiro de uso.** Empresa A: fila Anthropic com Time 1 e Time 3 (chave errada); Ana com chave
própria; a conta Google da empresa.

1. Como **Ana**, "Encomendas" › **Conversa** › **Nova conversa**: o seletor mostra o padrão da
   empresa, só com fornecedores com conta. "Compare dois apps de encomenda de padaria da
   internet": a resposta vem aos poucos, com as páginas lidas, e a conversa ganha um título.
2. Pause a conta de Ana e suba a Time 3: "Time 3 foi recusada. Ligue de novo; continuei pela Time
   1." Em **Conta de modelo**: "recusada · Ligue de novo".
3. Pause a Time 1: "As contas Anthropic que você pode usar estão indisponíveis. Escolha outro
   modelo ou fale com quem administra a empresa."
4. Como dono, ligue a **troca automática** "Claude Sonnet → GPT": a pergunta segue no GPT, com
   "Troquei para GPT pela troca automática da empresa". A seguinte tenta o Claude.
5. Escolha o Gemini: ele responde pela conta Google.
6. Como **Diego**: a conversa de Ana não aparece; na Empresa B, nada. Dez minutos sem conversa: o
   Neon mostra o banco "Idle" (os dois bancos, um ramo). Firstmate restaura o ramo: a conversa
   depois do ponto some.

**O que você faz, e quando.** Antes de U1: autoriza turnos reais pela sua chave, assinatura e
conta Google. No começo: aprova esta página. No fim: o roteiro e os textos.

**As suas respostas ao estudo.** 1 A: a conversa é de quem a começou. 2: busca e leitura nativas,
sem lista nem limite; o risco fica **aceito pela sua resposta** (uma página pode desviar o Builder
ou levar texto da conversa num endereço; ele não grava nem tem credencial); um limite pode vir
depois, como pedido próprio. 3 A: o horário do fornecedor, senão 15 min (429) e 6 h (402). 4 A,
nativo: o controller leva o aviso (`info`) e o guarda. 5 A, 6 A, 7 A.

**As suas respostas à leitura, como o cartão as lê.**

1. **A.** A troca automática anda a cadeia no nosso processador. A lista de modelos do Mastra não
   serve: abre todas as chaves no começo e troca até num erro do pedido (400).
2. **B.** O Gemini conversa na 12, pelo CLIProxy da conta, como a prova da 11 mostrou.
3. **A.** Depois da troca automática, o modelo novo lê páginas, mas não busca de novo.
4. O Mastra 1.78.0, o da prova da 11.
5. O título nativo do Mastra, pago pela conta que a fila escolheu no turno.
6. A memória observacional, como no Mastra Code: o Builder resume a conversa longa, pela mesma
   conta.
7. No máximo 10 tentativas por pergunta.
8. Sem apagar conversa: ela some com o Projeto, a pessoa ou a empresa.

**Fica de fora.** As issues `next-card` 25, 39, 45: fora destas pastas.

**A decisão sua: as permissões (regra D11).** **A.** O login do Mastra só entra no banco dele; o
banco recusa ler as contas do Hub com ele. **B.** O Mastra num schema do banco do Hub.
**Recomendação: A**, a da 0010.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| P0 | Regra `mastra-only-in-builder` (teste 2) | `.dependency-cruiser.cjs` | código | — | — |
| U1 | Registro 0050 e prova ao vivo | `docs/` | testes | mastra | — |
| U2 | Loja e pool do Mastra | `platform/`, `storage.ts`, `infra/` | dados | neon:neon-postgres, mastra | U3 |
| U3 | Banco, login, tabelas, grants (D11); remoção | `migrate.ts`, `tables.ts`, migrações, grants, `hub/` | dados | neon:neon-postgres | U1 |
| U4 | Builder, memória, título | `builder/conversation/` | segurança | mastra | U3 |
| U5 | A fila na chamada | `builder/model-accounts/` | segurança | mastra | U4 |
| U6 | A troca automática | `builder/model-accounts/`, `hub-api` | segurança | fastify-best-practices | U5 |
| U7 | Rotas e stream | `routes.ts`, `hub-api`, `main.ts` | código | fastify-best-practices, mastra | U4 |
| U8 | Telas e protótipo | `apps/web/src/builder/`, rotas | design, web | shadcn | U6, U7 |
| U9 | Percurso, sono, restauração | `tests/e2e/`, `how-to/` | testes | neon:neon-postgres | U8 |
| U10 | Gemini pelo CLIProxy | `builder/model-accounts/google/`, `infra/` | segurança | node | U5 |

P0 antes (L20); U3 em PR próprio (D11); U6, U7, U10 em paralelo; uma revisão, um merge (L9, L13).

**Orçamento de código alterado** (sem testes nem gerados): U2 220; U3 250; U4 340; U5 620; U6 330;
U7 560; U8 950; U9 60; U10 320. Total **3.650**, teto 4.000 (L2). Base: a 11 orçou 780 (fila,
rotas), 900 (telas), 350 (login Google).

## O que é do Mastra e o que é nosso

Fixado: `@mastra/core` 1.78.0, `memory` 1.38.0, `pg` 1.31.2, `code-sdk` 1.14.0 (prova da 11); linhas
da fonte do pacote publicado, pelo mapa de fonte; nomes no Context7 (`/mastra-ai/mastra`).

| Mecanismo | Nativo do Mastra | Nosso, e por quê |
| --- | --- | --- |
| Conversa | `AgentController`: `createSession`, `deleteSession` (`agent-controller.ts:526`, `:841`); `sendMessage`, `abort` (`session.ts:5258`, `:4591`) | rotas do Hub (S39) |
| Modelo por conversa | `session.model.switch({modelId, scope: 'thread'})` (`session.ts:2597`) | o seletor |
| Chave por tentativa | `processInputStep` dá o `model` (`processors/index.ts:249`); `processAPIError`, `{retry}` (`:591`) | ordem, pausa até um horário, "recusada" |
| Aviso de troca | `writer.custom` guarda; `emitEvent({type: 'info'})` leva ao vivo (`types.ts:922`, `:1184`; `agent-controller.ts:2594`), pois `data-*` cai ao vivo (`session-run-engine.ts:1580`); assim o Mastra Code (`account-rotation-processor.ts:390-406`) | o texto em português |
| Troca automática | `Agent({model: [...]})` **não**: abre todas as chaves (`agent.ts:7577-7582`), troca em qualquer erro (`llm-execution-step.ts:1168-1185`) | o processador (resposta 1) |
| Fim das contas | `retry: false` e `writer.custom` (provado) | nunca `abort()`: **defeito provado**, calado |
| Horário do fornecedor | `getRetryAfterMs`, interno (`utils/retry-after.ts:78`) | `retry-after` do `APICallError` (C75) |
| Assinatura Claude | `opencodeClaudeMaxProvider` (`claude-max.ts:259`); `CredentialStore` (`auth/types.d.ts:119-139`); `refreshAnthropicToken` (`anthropic.ts:130`) | a loja, com reserva (S34) |
| Web | `webSearchTool` (`web-search.ts:17`), só quatro fornecedores (`:28`); `webFetchTool` (`web-fetch.ts:263`), recusa IP interno, também após o DNS (`:128-152`) | sem lista, limite nem invólucro |
| Memória | `observationalMemory` (`memory/src/index.ts:142`), como o Mastra Code (`agents/memory.ts:393-412`); dono de `createSession({resourceId})` (`agent.ts:8252`) | dono com a empresa; o índice |
| Memória e título pagos pela fila | `observation.model`, `reflection.model`, `generateTitle.model` aceitam função de `requestContext`, fora dos processadores (`observer-runner.ts:190-208`) | a função dá a conta do turno |
| Banco | `PostgresStore`; a memória sem temporizador (`observational-memory.ts:3916`) | pool do Hub (D27), login, banco |
| Log | `new Mastra({logger, agentControllers})` (`mastra/index.ts:323`, `:350`) | logger só escalar: **defeito provado**, o padrão imprime o erro cru (C50, S41) |

## Os critérios de aceite

Testes do servidor: `npm run test -w @conexus/server`, pelas rotas.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | P0 | Arquivo fora de `builder/` importa `@mastra/core`: `npm run deps` recusa | arquivo plantado | must |
| 2 | U1 | 0050 "proposed" antes. **Ao vivo**: duas empresas, eventos isolados; o modelo volta após reiniciar; a chave muda entre tentativas | o registro | must |
| 3 | U1 | **Ao vivo**: turnos por chave, assinatura e Gemini, com busca; busca recusada numa via: sai dela, volta ao fundador | o registro (T14) | must |
| 4 | U3 | O login do Mastra no banco do Hub: recusado (teste 1) | `mastra-database.test.ts` | must |
| 5 | U2 | Arquivo do Mastra ausente, vazio ou aberto a outros: `CONFIG_INVALID`; após um turno, zero conexões em 15 s | `config.test.ts`, `database.test.ts` | must |
| 6 | U3 | A Empresa B não lê nem grava conversa da A; Diego não lê a de Ana | `isolation-conversations.test.ts`, catálogo | must |
| 7 | U3 | Apagar Projeto, pessoa ou empresa: threads e memória antes das linhas; Mastra fora: pendente | `conversations-removal.test.ts` | must |
| 8 | U4 | Toda thread: linha no índice, empresa no `resourceId` (teste 4) | `conversation.test.ts`, nas tabelas do Mastra | must |
| 9 | U4 | 401 com texto plantado: fora do log, stderr, resposta e stream | idem | must |
| 10 | U4 | Fora dos quatro: sem busca; `web_fetch` a IP interno, direto, por nome ou redirecionamento: recusado | idem | must |
| 11 | U4 | Título e observação de conversa longa (dublê): pela conta do turno, nenhuma fora da fila | idem | must |
| 12 | U5 | Própria, dadas, empresa; pausada, recusada, desligada, em limite: pulada (testes 5, 6); sem conta, nenhuma chamada, nem pelo ambiente | `queue.test.ts`, fornecedor dublê | must |
| 13 | U5 | 429, 402: limite (horário do fornecedor, senão 15 min, 6 h), próxima. 401, 403: `refused` (assinatura: renova antes). 400, desconhecido: `MODEL_CALL_FAILED` | idem | must |
| 14 | U5 | Todas fora: aviso, `agent_end` com erro; na 10ª tentativa, o aviso (resposta 7) | idem | must |
| 15 | U5 | Token recusado: "recusada · Ligue de novo", dito no turno (teste 7); duas renovações: uma chamada (teste 8) | `claude-refresh.test.ts` | must |
| 16 | U6 | Dono e administrador; membro: 404; fora do registro: 422 `MODEL_UNKNOWN`; velha: 412 | `model-fallback.test.ts` | must |
| 17 | U6 | Ligada, fila acabada: o próximo modelo, com aviso e sem busca; a seguinte tenta o escolhido; desligada: para | idem | must |
| 18 | U7 | Outra empresa ou pessoa: o mesmo 404 (S10, T10); Diego sem evento de Ana (teste 3); sem rota do Mastra (S39), sem telemetria (S42) | `conversations.test.ts` | must |
| 19 | U7 | Mesma chave: um efeito, também após reiniciar; outro corpo: `IDEMPOTENCY_CONFLICT`; sem conta: 422 `MODEL_NO_ACCOUNT` | idem | must |
| 20 | U7 | Batimento de 25 s; reconectar relê; **Parar**: `turnEnd.reason`, texto parcial guardado; desligar espera o turno (C62) | idem, `main.test.ts` | must |
| 21 | U8 | Protótipo `ui/` contra `playground-ui`, com o texto parcial ao reconectar; escolha na 0050 | o registro | must |
| 22 | U8 | As telas da matriz, textos, teclado, foco, região viva | `conversation.test.tsx` | must |
| 23 | U8 | 390 px, 200%, dois temas, sem erro de CSP | navegador (T23) | should |
| 24 | U9 | O roteiro, Hub real, fornecedor dublê | `tests/e2e/conversation.test.ts` | must |
| 25 | U9 | **Ao vivo**: ramo "Idle" após dez minutos, os dois logins a zero (0009, D27) | firstmate, console do Neon | must |
| 26 | U9 | **Ao vivo**: restaurar o ramo põe os dois bancos no mesmo minuto; lista e conversa batem | firstmate | must |
| 27 | U9 | **Ao vivo, se acontecer**: 429 ou 402 sem `retry-after`, anotado | firstmate | should |
| 28 | U9 | Publicado: passos 1 a 6 | firstmate, fundador (T14) | must |
| 29 | U10 | Gemini pelo processo da conta em `127.0.0.1`; binário diferente: não inicia; 10 min parado ou o programa sai: ele sai, login relacrado | `google-calls.test.ts`, CLIProxy dublê | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Conversas do Projeto | "Nenhuma conversa", **Nova conversa**; título, ou a data | a partilhada | a de `ui/` | a do Projeto | — |
| Conversa | campo e seletor; sem conta: o aviso da 11 | "Pensando…", **Parar** | "O modelo não respondeu." | a do Projeto; linha sem thread sai | os avisos de troca, recusa, fim |
| Seletor | modelos com conta | idem | idem | — | conta recusada fora |
| Troca automática | "Desligada" | idem | 412: "Mudou antes de você salvar" | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `conversationId`, `createdAt`, `title` | criar; o Mastra | lista, conversa |
| `model` | criar, `setConversationModel` (sessão) | seletor, a fila |
| `messages[]`, com os avisos | o Mastra | conversa |
| eventos; `part` traz ferramenta e páginas lidas | o stream | conversa |
| `limitedUntil`, `state: 'refused'` da conta | a fila | telas da 11, a fila |
| `fallback {enabled, chain, revision}` | dono, administrador | tela, a fila |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `createConversation` | `Idempotency-Key` | linha antes; sem thread: 404 | 503 | `CONVERSATION_CREATED` | 8, 19 |
| `sendConversationMessage` | `Idempotency-Key` | a memória guarda o que veio | a fila | `CONVERSATION_TURN_STARTED`, `_ENDED` | 14, 19 |
| Chamada ao modelo | uma por tentativa | `retry: false` | log escalar | `MODEL_CALL_REFUSED` | 9, 13 |
| Título, observação (Mastra) | o Mastra guarda | não marca; a próxima chamada marca | nativa (`observational-memory.ts:736`) | — | 11 |
| Marca de limite, `refused` | idempotente | uma instrução | sem marca | `MODEL_ACCOUNT_LIMITED`, `_REFUSED` | 13, 15 |
| Renovação Claude | reserva com prazo (D25) | falha após a troca: "Ligue de novo" (S34) | `refused` | `MODEL_TOKEN_REFRESHED` | 15 |
| Processo CLIProxy | um por conta | ao sair, relacra com a revisão | próxima conta | `CLIPROXY_STARTED`, `_STOPPED` | 29 |
| `setConversationModel` | estado final | — | Mastra: 503 | `CONVERSATION_MODEL_SET` | 19 |
| Troca automática | `If-Match` | uma transação | banco | `MODEL_FALLBACK_SET` | 16 |
| `init` do `PostgresStore` | `IF NOT EXISTS` | não inicia | idem | `MASTRA_STORAGE_READY` | 5 |
| Apagar na remoção | já apagada conta | pendente, repete | Mastra: pendente | `CONVERSATIONS_RELEASED` | 7 |
| `stopConversation`, `deleteSession` | o segundo: 204 | guarda o que veio | — | `CONVERSATION_STOPPED` | 20 |
| `migrate` do Mastra | `IF NOT EXISTS`; senha após 28P01 (D32) | não publica | idem | `MASTRA_LOGIN_READY` | 4, 26 |
| `web_fetch`, busca | — | `isError` ao modelo | o modelo diz | — | 3, 10 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Fila | nova | `model-accounts/queue.ts` | — | credencial aberta na transação do direito (`model-routing.ts:32-39`) |
| Memória e título | nova | `conversation/builder.ts` | — | a memória observacional do antigo (`memory.ts:36`) |
| Renovação Claude | nova | `claude/store.ts` | — | compare-and-swap (`store.ts:85-90`), com reserva |
| Gemini | nova | `google/calls.ts` | — | `127.0.0.1`, morre com o pai (`pool.ts:57-80`) |
| Índice e rotas | nova | `builder/conversation/` | — | texto do fornecedor fora do navegador (`mastra-session-routes.ts:128`) |

**A medida do transplante.** Nada é copiado (`e0353c36`); as fichas 3.14 e 3.15 da auditoria viram
as regras deste cartão.

**A dívida.** Conversa criada entre a liberação e a remoção: thread órfã; a 16 varre. S36 cita uma
guarda do Hub para o `web_fetch` que não existe; fica a nativa (C75), para o fechamento.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `decisions/0050-…`, `index.md`; `architecture.md` §8, §11 | cria, muda | `check-docs` |

### Os contratos que a unidade cria

0050: conversa no `AgentController`, fila no processador, aviso por `info`. Criterion: crit. 2, 3.
Só documentos (L13). Regras: L21, T14, S40.

## U2 Loja e pool do Mastra

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `platform/config.ts`, `platform/database.ts` | `HUB_MASTRA_DATABASE_URL_FILE`; `openMastraPool` | `main.ts`, `storage.ts` |
| `builder/conversation/storage.ts` | o `PostgresStore` | `builder.ts` |
| `infra/compose.yaml`, `deploy.sh`, `how-to/hub-server.md`, `package*.json` | o arquivo; os quatro pacotes | publicar |

### Os contratos que a unidade cria

`openMastraPool(deps: {url; log}): pg.Pool`, com `POOL_LIMITS`; `createMastraStorage(pool)`, schema
`mastra`. Regras: D27, C57. Funções: `PostgresStore({id, pool, schemaName})`.

**Prova.** 5.

## U3 Índice, permissões e remoção

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/tables.ts`, `store.ts` | cria | U4, U7 |
| `platform/migrate.ts`, `migrations/`, `database-grants.sql`, `test-database.ts` | banco e login do Mastra; tabelas; grants; retrato | `migrate`, `catalog.test.ts` |
| `hub-api/src/project-failures.ts`, `people-failures.ts` | as falhas pendentes (C48) | web |
| `model-accounts/tables.ts` | `limited_until`, `refresh_until`; `UPDATE` em `state`, `sealed` | U5, U10 |
| `hub/projects/projects.ts`, `hub/identity/`, `hub/operations/clients.ts` | porta `ReleaseConversations` | `main.ts` |

### Os contratos que a unidade cria

`builder.conversation`: `id` uuid (o da thread), `company_id`, `project_id` para `hub.project`,
`person_id` para `auth.member (company_id, user_id)`, `ON DELETE CASCADE`; `created_at`.
`builder.conversation_turn (conversation_id, company_id, idempotency_key, body_hash)`, única por
conversa e chave (C37). `builder.company_model_fallback (company_id, enabled, chain text[],
revision)`. Política de linha (0039). `type ReleaseConversations = (scope: {companyId; projectId?;
personId?}) => Promise<void>`; falha: `PROJECT_DELETION_PENDING`, `PERSON_REMOVAL_PENDING`,
`CLIENT_DELETION_PENDING`.

**Ordem.** Regras: D1, D11, D12, D22, D25, D32, 0010, 0038, 0039, S31, S6–S11, W4. Funções:
`pgTable`; `Memory.deleteThread` (`memory/src/index.ts:1153`), que limpa também a memória
observacional: quem apaga é o Mastra.

**Prova.** 4, 6, 7; T10 com outra empresa e outra pessoa.

## U4 O Builder, a memória, o título

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/builder.ts`, `logger.ts`, `public.ts` | cria | U5, U7, `main.ts` |

### Os contratos que a unidade cria

`createBuilder(deps): {controller; mastra}`; `memoryOwner`: `company:<id>:person:<id>`. Agente:
`model` de `session.modelId` do contexto `controller`, sem chave; `maxRetries: 0`;
`maxProcessorRetries: 10`, e no fim o aviso de contas acabadas (o erro subiria sem ele,
`llm-execution-step.ts:2643-2664`); `errorProcessors: [StreamErrorRetryProcessor,
AccountQueue]`; `tools` por função: `web_fetch` sempre, `web_search` só nos quatro.
`accountModel({requestContext})`: a conta do turno, reaberta pelo id que a fila pôs no contexto.
`Memory` com `generateTitle: {model: accountModel, instructions em português,
emitEvent: true}` e `observationalMemory` como o Mastra Code: `scope: 'thread'`, `retrieval: true`,
`activateOnProviderChange`, `temporalMarkers`, `observation {model: accountModel, messageTokens:
30_000, bufferTokens: 1/5, bufferActivation: 2000, blockAfter: 2, threadTitle: true}`, `reflection
{model: accountModel, observationTokens: 40_000, bufferActivation: 1/2, blockAfter: 1.1}`;
sem `semanticRecall` nem observabilidade (S42).

**Ordem.**

1. Logger: `IMastraLogger` com nome, status e código ao `FailureLog`. Regras: C50, S41.
2. Agente, memória, controller. Regras: C75, S36, D27. Funções: `Agent`, `AgentController`,
   `Mastra`, `Memory`, `webSearchTool`, `webFetchTool`.

**Prova.** 8–11, `fetch` dublê.

## U5 A fila na chamada

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/queue.ts`, `errors.ts`, `claude/store.ts`, `public.ts` | cria, muda | U4 |

### Os contratos que a unidade cria

`AccountQueue implements Processor<'account-queue'>`, de entrada e de erro; loja Claude com
`allowEnvironmentFallback: false`; ambiente sem chave de fornecedor. `processInputStep` dá `{model: {id, apiKey}}` (assinatura: `opencodeClaudeMaxProvider`; Google: U10);
na troca de fornecedor, `activeTools` sem `web_search`, resolvida uma vez no início (`agent.ts:5289`).
`type CallFailure = 'limited' | 'refused' | 'unknown'`, de `APICallError.statusCode` (C52). Aviso:
parte `data-conexus-notice` `{kind: 'account-switched' | 'accounts-exhausted' | 'model-switched';
text}` e `info`.

**Ordem.**

1. A próxima conta: admissão, `builder.sealed_of`, `open` (Grant A). Regras: S32, S36.
2. Erros e marcas. Regras: C52, C57, D22. Nunca `abort()`.
3. A loja Claude (`CredentialStore`): reserva `refresh_until`, chama `refreshAnthropicToken` sem
   transação e grava com a revisão. Regras: S34, D22, D25, C65.

**Prova.** 12–15, fornecedor e Anthropic dublês.

## U6 A troca automática

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/fallback.ts` | cria (tabela em U3) | U5 |
| `packages/hub-api/src/model-accounts.ts` | `setModelFallback`; `fallback` em `listModelAccounts` | web |
| `apps/web/src/builder/model-accounts/` | a seção | rotas |

### Os contratos que a unidade cria

`setModelFallback` `PUT /api/companies/{companyId}/model-fallback`, `If-Match`, `{enabled, chain}`:
200; 404; 412; 422 `MODEL_UNKNOWN`. Só no turno. Regras: C28, C33, C38, S10. Funções:
`processInputStep` com o próximo modelo.

**Prova.** 16, 17.

## U7 Rotas e stream

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/routes.ts`, `sessions.ts` | cria | `main.ts` |
| `packages/hub-api/src/conversations.ts`, `failures.ts`, `index.ts` | operações, eventos, falhas | web, OpenAPI |
| `hub/identity/admission.ts`, `hub/projects/public.ts` | `useConversations` (`MEMBER`); o Projeto | Builder |
| `main.ts`, `infra/compose.yaml` | liga o Builder; drena turnos ao parar | — |

### Os contratos que a unidade cria

Operações `session`, sob `/api/companies/{companyId}/projects/{projectId}`; alheia: 404
`CONVERSATION_NOT_FOUND`.

| Operação | Método e caminho (`C` = `/conversations`, `I` = `C/{conversationId}`) | Saída e falhas |
| --- | --- | --- |
| `listConversations` | `GET C` | as da pessoa, com título, 50 por página (C44) |
| `createConversation` | `POST C`, `Idempotency-Key`; `{model?}` | 201; 422 `MODEL_NO_ACCOUNT` |
| `readConversation` | `GET I` | `{id, title, model, messages}` |
| `sendConversationMessage` | `POST I/messages`, `Idempotency-Key`; `{content}` | 202 |
| `streamConversation` | `GET I/events`, `text/event-stream` | `ConversationEvent` |
| `stopConversation` | `POST I/stop` | 204 |
| `setConversationModel` | `PUT I/model`; `{model}` | 200; 422 |

`ConversationEvent = {type: 'text'; delta} | {type: 'part'; part} | {type: 'notice'; text} |
{type: 'turnEnd'; reason} | {type: 'failure'; code}`. Uma sessão por conversa; `deleteSession` ao
fechar o último stream sem turno.

**Ordem.**

1. Contrato. Regras: C28–C38, C49, C51.
2. Sessões e stream. Regras: S10, S39, C57 (prazo próprio do stream), C62, C63.

**Prova.** 18, 19, 20.

## U8 Telas e protótipo

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/`, `platform/hub.ts`, `ui/`, `package.json` | as telas; o stream | rotas |
| `routes/…/projects/$projectId.conversations.tsx`, `$projectId.tsx` | a aba | `routeTree.gen.ts` |

**Ordem.**

1. Protótipo: pacote, `@mastra/core` no navegador, corte, markdown parcial, região viva,
   ferramenta, `Select`, msw. Regras: W7, 0033.
2. Telas. Regras: W1, W4, W6, W8, W9, W12, W17, W23, W24; V29–V31, V35, V39, V55.

**Prova.** 21; 22, `npm run test -w @conexus/web`; 23, o navegador.

## U9 Percurso, banco dormindo, restauração

`tests/e2e/conversation.test.ts` no `e2e`; `how-to/hub-database-restore.md`, os dois bancos num ramo.
24: `npm run e2e`; 25–28: após o Release (T13, T14).

## U10 Gemini pelo CLIProxy

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/google/calls.ts` | o processo por conta para chamar | U5 |
| `infra/compose.yaml` | a pasta em `tmpfs` | publicar |

### Os contratos que a unidade cria

`openGoogleCalls(account): Promise<{url; apiKey}>`: um CLIProxyAPI por conta (binário e sha256 da
11), em `127.0.0.1`, chave aleatória, login numa pasta `0700`; para após 10 min parado e com o
programa, relacrando o login. `CLIPROXY_UNAVAILABLE`: próxima conta.

**Ordem.** Regras: C57, C62, S32, S36, S41. Funções: o roteador com `{id: 'google/<modelo>', url:
'http://127.0.0.1:<porta>/v1', apiKey}`, como na prova da 11.

**Prova.** 29.
