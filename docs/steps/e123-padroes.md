# Etapa 12.3: Padrões

## A página do fundador

**No fim desta etapa** você escolhe em Configurações o modelo e o raciocínio com que as suas
conversas novas começam; o dono escolhe os da empresa para quem não escolheu.

**O roteiro de uso.** Empresa A, com as contas da 12 (Claude e chave OpenAI, da empresa).

1. Como **dono**, em Configurações › **Padrões da empresa**: **GPT-5**, raciocínio
   **Médio**, **Salvar padrão**. No topo: "Uma conversa nova começa em: GPT-5 · Médio — padrão da
   empresa".
2. Como **Ana** (membro), **Nova conversa** num Projeto: o compositor mostra **GPT-5 Médio**. Em
   Padrões da empresa ela só lê: "Só o dono ou um administrador muda os padrões da empresa."
3. Ana, em **Você › Meus padrões**: **Claude Sonnet 4.5**, **Alto**, salva. O topo passa a "— seu
   padrão"; abaixo, "Conta usada primeiro (Anthropic): Claude da empresa", **Mudar a ordem**. Uma
   nova abre em **Claude Sonnet 4.5 Alto**; a do passo 2 segue em GPT-5.
4. Dono pausa a conta Claude. Em Meus padrões, Ana lê que não tem conta Anthropic agora e que as
   novas começam no padrão da empresa; uma nova abre em GPT-5 Médio. Retome a conta.
5. Ana, **Usar o da empresa**: o topo volta a "— padrão da empresa". A 390 px e no tema escuro.

**O que você faz, e quando.** Antes: a U3 grava uma sessão curta pela sua assinatura Claude e
a conta Gemini, conteúdo inventado ("2A"). No começo: aprova e responde P1 a P5. No fim: faz o
roteiro, diz o que viu e aprova os textos das telas.

**Como funciona.** Uma conversa nova começa no escolhido ao criar; senão no padrão da pessoa; senão
no da empresa; senão no modelo inicial (P3); um padrão sem conta usável é pulado. Ela **copia** o
padrão ao nascer, como no Mastra Factory. Um nível que o modelo não aceita desce ao mais alto aceito
abaixo, como no Mastra Code.

**Fica de fora.** Padrão por Projeto; a troca automática, salvo P5. Das issues `next-card`, a
12.3 leva a #176 e a #202; as outras esperam o gatilho de cada uma, a #172 a 21.

**As decisões suas pedidas nesta etapa.**

- **P1. Onde ficam.** A: duas seções, **Você › Meus padrões** e **{empresa} › Padrões da empresa**;
  o "Modelo padrão" sai de Contas de modelo para a segunda. B: dentro das duas seções de contas. C:
  uma seção **Padrões** com a troca "Você | {empresa}". **Recomendo A**: cada grupo já tem a sua
  página.
- **P2. "Conta padrão".** A: a primeira da fila de cada fornecedor (da 11: as suas,
  depois as da empresa), mostrada com **Mudar a ordem**. B: A mais a escolha "Usar primeiro as
  contas da empresa". C: uma conta padrão fora da fila. Exemplo: em A, a chave Anthropic de Ana vai
  antes da Claude da empresa. **Recomendo A**, como o Mastra Factory.
- **P3. Sem padrão usável.** A: um modelo inicial, em **Desligado**, o primeiro com conta de: Claude
  Sonnet 4.5, GPT-5, Gemini 2.5 Pro. B: recusar, como hoje. Exemplo: empresa nova, só chave OpenAI,
  nenhum padrão: A abre em GPT-5; B avisa. **Recomendo A**; a lista é sua.
- **P4. Quem muda o da empresa.** A: dono e administrador, como as contas na 11. B: só o dono.
  **Recomendo A**: uma regra só.
- **P5. Que modelos aparecem** (#202). A: em toda escolha (compositor, padrões, fila da troca) só os
  de fornecedor com conta conectada: na sua, as suas e as que a empresa te dá; na da empresa, as
  dela. B: só nos padrões. Exemplo: só chave OpenAI, só modelos da OpenAI. **Recomendo A**, como o
  Mastra Factory.

## O que a 12.1 e a 12.2 deixam, e o que a 12.3 muda

Base: o cartão da 12.1 (#159, `b4883b9`) e o da 12.2 (#158). A 12.3 constrói depois do merge das
duas. Usa sem mudar: `ModelPicker` com `effort` (o controle deslizante da resposta 4 da 12.1),
`effortsOf`, `EFFORT_UNSUPPORTED`, `Sessions.switchModel`, a moldura de Configurações e
`staticData.section`. Muda: `conversationModel` (`queue.ts`) se divide; `created` (`routes.ts` da
conversa) troca `effort: 'off'` pelo nível resolvido; `DefaultModel` sai de `CompanyAccounts` e
`'modelo padrão'` sai das palavras de Contas de modelo; `appendText`, `put`, `appended` e `placed`
dão lugar a `applyEvent` (U4). Se a 12.1 ou a 12.2 mudar algo disso antes
do merge, este cartão volta (L7).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | Padrões no servidor, ordem de início, lista de P5 | `hub-api`, `builder/model-accounts/` e `builder/conversation/routes.ts` (servidor), `migrations/`, `database-grants.sql`; os dublês da tela que montam `Accounts` | dados | 12.1 e 12.2 fechadas |
| U2 | As duas seções; toda escolha de modelo pela lista de P5 | `routes/…/$companyId_/settings/`, `builder/model-accounts/` e `builder/conversation/model-choice.tsx` (tela) | design | U1 |
| U3 | As gravações e os dublês que as tocam | `scripts/`, `platform/` (servidor) | testes | U2 |
| U4 | Uma dobra: `applyEvent` | `hub-api`, `builder/conversation/` | código | U3 |
| U5 | Lido igual ao stream (#176) | `builder/conversation/` (servidor) | testes | U4 |
| U6 | Percurso e roteiro | `tests/e2e/`, `apps/web/*.test.ts`, `sweep-*.ts` | testes | U5 |

Em série. Sem checagem nova. O QA (T25) vem antes das revisões (L9).

**Orçamento de código alterado** (sem testes nem gerados): U1 490 (contrato 80, `defaults.ts` 130,
`changes.ts` 90, `store.ts` 60, rotas 70, `queue.ts` e `routes.ts` da conversa 40, tabela 20); U2 420
(o formulário 200, as duas rotas 60, a linha de início e a conta primeira 120, o filtro de P5 40); U3
120 (o script; os dublês são teste); U4 110 (`applyEvent` 50, o servidor 40, a tela 20); U5 50; U6
60. Total **1.250**, teto 4.000 (L2).

## Os critérios de aceite

Servidor: `npm run test -w @conexus/server`. Tela: `npm run test -w @conexus/web`. Percurso: `npm run e2e`.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `createConversation` sem `model`: com padrão pessoal usável, `{model, effort}` dele; sem ele, o da empresa; sem os dois usáveis, o modelo inicial (P3); o `readConversation` lê o par | `model-defaults.test.ts`, pela rota | must |
| 2 | U1 | Padrão cujo fornecedor não tem conta usável para a pessoa (pausada, no limite, de tipo fechado, de outra pessoa): pulado; nenhum degrau usável: 422 `MODEL_NO_ACCOUNT`, nenhuma conversa criada | idem | must |
| 3 | U1 | `createConversation` com `model`: esse modelo, nível do padrão pessoal do mesmo modelo, depois o da empresa, senão `off`; modelo sem conta: 422 `MODEL_NO_ACCOUNT` (12.1) | idem | must |
| 4 | U1 | Nível guardado que o modelo não aceita: a conversa nasce no mais alto aceito abaixo dele, senão no mais baixo aceito | idem, com um modelo de níveis só `off` | must |
| 5 | U1 | Mudar um padrão depois não muda o par de conversa existente | idem | must |
| 6 | U1 | `setMyModelDefault`: todo membro grava o seu (`manageOwnModelAccounts`, da 11); relido em `listModelAccounts.defaults.mine`; modelo fora do registro 422 `MODEL_UNKNOWN`; nível não aceito 422 `EFFORT_UNSUPPORTED`; outra empresa ou desconhecida: 404 (S10) | idem | must |
| 7 | U1 | `clearMyModelDefault`: 204; de novo, 204; `mine` volta a `null` | idem | must |
| 8 | U1 | `setDefaultModel` com `{model, effort}`: dono e administrador gravam; membro 404 como hoje na 11; as recusas de 6; linha antiga sem nível lida como `off` | `model-accounts.test.ts` | must |
| 9a | U1 | Empresa só com chave OpenAI e nenhum padrão: a conversa nasce em GPT-5 `off`; só com Claude e OpenAI: Claude Sonnet 4.5 (a ordem de P3) | `model-defaults.test.ts` | must |
| 9 | U1 | `defaults.start` diz `{model, effort, from: 'mine' \| 'company' \| 'starter'}`, o mesmo que a criação usaria, ou `null` sem conta usável | `model-defaults.test.ts` | must |
| 10 | U1 | Pessoa sai da empresa: o padrão dela some com ela (a chave do membro) | `platform/model-accounts-removal.test.ts` | must |
| 11 | U1 | A política: com o escopo de Ana, o padrão de outra pessoa não se lê nem se escreve | `platform/isolation-model-accounts.test.ts` | must |
| 12 | U2 | Índice: **Meus padrões** em Você (ordem 25) e **Padrões da empresa** na empresa (ordem 35); "raciocínio" e "modelo padrão" acham as duas; Contas de modelo sem o formulário de modelo padrão | `settings.test.tsx` | must |
| 13 | U2 | Meus padrões: o botão de modelo e o deslizante de raciocínio (o seletor da 12.1), **Salvar padrão**, **Usar o da empresa** (só com padrão próprio), o padrão da empresa escrito abaixo | `my-defaults.test.tsx` | must |
| 14 | U2 | A linha "Uma conversa nova começa em: … — seu padrão \| padrão da empresa \| modelo inicial" lê `defaults.start`; `null`: "Nenhum padrão nem modelo inicial tem conta sua disponível." e **Minhas contas de modelo** | idem | must |
| 15 | U2 | Padrão sem conta usável: "Você não tem conta disponível para {fornecedor} agora: as conversas novas começam no {próximo}." | idem | must |
| 16 | U2 | "Conta usada primeiro ({fornecedor}): {nome}", de `order`, com **Mudar a ordem** a Minhas contas de modelo | idem | must |
| 17 | U2 | Padrões da empresa: dono e administrador mudam; membro lê a frase de V29 e o valor | `defaults.test.tsx` | must |
| 18 | U2 | Recusa ao salvar: a frase do código no campo, o valor escolhido fica; salvando: "Salvando…", botão parado | idem, `my-defaults.test.tsx` | must |
| 19 | U2 | Teclado: Tab, setas no deslizante, Esc devolve o foco (V30); nomes em português (V31) | `keyboard.test.ts` | must |
| 20 | U6 | O roteiro, Hub real, fornecedor dublê | `tests/e2e/defaults.test.ts` | must |
| 21 | U6 | 390 px, 200 %, dois temas, sem rolagem lateral nem erro de CSP | `layout.test.ts`, `sweep.test.ts` | must |
| 22 | U6 | O relatório de QA no commit candidato, cada captura contra o desenho A | `conexus-qa` (T25) | must |
| 23 | U6 | Publicado: o roteiro | firstmate, fundador (L17) | must |
| 24 | U1 | `Accounts.connected.{mine, company}`: fornecedores com conta conectada, em qualquer estado, da pessoa ou dada a ela; da empresa. Salvar padrão fora da lista do escopo: 422 `MODEL_NO_ACCOUNT` | `model-defaults.test.ts` | must |
| 25 | U2 | Compositor e Meus padrões listam só `connected.mine`; Padrões da empresa e a fila, `connected.company`; vazia: "Conecte uma conta de modelo" | `model-choices.test.tsx` | must |
| 26 | U3 | Cada gravação tem fornecedor, API, versão do SDK e data (T24); nenhum cabeçalho, token, id de conta ou e-mail (S40) | `recordings.test.ts` | must |
| 27 | U3 | Pelo Hub, tocando a gravação: a busca citada dá um texto só (PR 191); o pensamento, `reasoning` com segundos; o erro, a ferramenta em `error`; a interrupção, `turnEnd` `aborted` | `conversation-recorded.test.ts` | must |
| 28 | U4 | Só `applyEvent` torna evento em partes; os testes de stream da 12.1 passam sem mudar | `conversations.test.ts` (`hub-api`), `stream.test.tsx` | must |
| 29 | U5 | Por gravação, o stream dobrado por `applyEvent` é igual a `readConversation` no fim (T24), e após reabrir o stream no meio | `conversation-recorded.test.ts` | must |
| 30 | U5 | Um pensamento reaberto mostra os segundos (#176); sem eles gravados, `seconds: null` | idem | must |

## As telas

Desenhos do estudo de 2026-10-20, fora do repositório (L21): `wf-A1280`, `wf-A390` (recomendado),
`wf-B*`, `wf-C*`. Nenhuma captura do produto antigo: ele não tinha padrão pessoal.

```text
1280 ┌ Voltar ───────────┬ Meus padrões  [Só você] ─────────────────────────────┐
     │ VOCÊ              │ ┌ Uma conversa nova começa em: Claude Sonnet 4.5 · Alto │
     │  Minha conta      │ │   — seu padrão                                        │
     │  Minhas contas…   │ ├ Modelo e raciocínio        [Claude Sonnet 4.5 Alto ▾] │
     │ ▸Meus padrões     │ │ Padrão da empresa: GPT-5 · Médio  [Usar o da empresa] │
     │  Aparência        │ │                                    [Salvar padrão]    │
     │ EMPRESA A         │ ├ Conta usada primeiro (Anthropic): Claude da empresa   │
     │  Geral, Pessoas…  │ │                                    [Mudar a ordem]    │
     │  Contas de modelo │ └───────────────────────────────────────────────────────┘
     │  Padrões da empr. │
390  [← Configurações] Padrões da empresa [Toda a empresa]; a linha de início; o botão; o
     deslizante; [Salvar padrão]; membro: a frase de V29.
```

| Tela | Desenho | O que se vê primeiro | Entra por | Sai para |
| --- | --- | --- | --- | --- |
| Meus padrões | `wf-A1280`; a 390 como `wf-A390` | a linha de início | índice, busca | Minhas contas de modelo |
| Padrões da empresa | `wf-A390`; a 1280 como `wf-A1280` | a linha de início da empresa | índice, busca | Contas de modelo |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Meus padrões | sem padrão: "Você segue o padrão da empresa." e o botão sem valor | sem conta usável: a frase do 14 | esqueleto da moldura (12.2) | na área, **Tentar de novo** | empresa desconhecida (12.2) | — (todo membro) | recusas do 6 no campo; padrão sem conta: a frase do 15 |
| Padrões da empresa | sem padrão: "A empresa ainda não tem padrão: as conversas novas começam no modelo inicial." | idem | idem | idem | idem | membro: frase e valor, só leitura (V29) | recusas do 8 no campo |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `person_model_default.{model, effort}` | `setMyModelDefault`, `clearMyModelDefault` | `startOf`; Meus padrões |
| `company_model.effort` | `setDefaultModel` | `startOf`; Padrões da empresa, Meus padrões |
| `Accounts.defaults.{company, mine}` | `list` (`store.ts`), por `listModelAccounts` | as duas seções |
| `Accounts.mayManage` (11) | o Hub | `mayChange` de Padrões da empresa |
| `Accounts.defaults.start` | `startOf`, a mesma da criação | a linha de início |
| `Accounts.order` (11) | o Hub | "Conta usada primeiro" |
| `Accounts.connected.{mine, company}` | `list` (`store.ts`) | toda escolha de modelo (P5); `setMyModelDefault`, `setDefaultModel` |
| `conexus.thinking` do fio: `{id, seconds}` | `settleThinking` (`live.ts`) | `readConversation` (`history.ts`) |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `setMyModelDefault` (upsert) | estado final, a última vale | uma instrução: nada gravado | banco: 503 | `MODEL_ACCOUNT_CHANGED {companyId, scope: 'mine'}`, o nome da 11 | 6, 18 |
| `clearMyModelDefault` (delete) | 204 nas duas | idem | idem | idem | 7 |
| `setDefaultModel` com nível (upsert) | estado final | idem | idem | `MODEL_ACCOUNT_CHANGED {companyId, scope: 'company'}` | 8 |
| Criação lê os padrões e troca o fio (`switchModel`) | a chave de tentativa da 12 (C37) devolve o modelo já posto (`threadModel`); o par se lê por `readConversation` | o da 12: sem o par, a repetição resolve de novo | banco: 503; nenhum fornecedor chamado | o da 12 | 1, 5 |
| Segundos de um pensamento (`setSetting`, por `queued`) | por `id`, o mesmo valor | nada gravado: `seconds: null` | o turno segue, como `keepFailure` | `INTERNAL_UNEXPECTED` | 30 |

## O que nasce novo e o que é trazido

Fork `ce7e9c30`; OS `e0353c36`.

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Nativo / referência |
| --- | --- | --- | --- | --- | --- |
| Padrão pessoal | nova | `model-accounts/tables.ts` | — | — | Factory: o do projeto; o pessoal não vale nele (`FactoryDefaultModelSection.tsx:28-29`); OS: por papel |
| Nível no padrão da empresa | nova | idem | — | sai o `medium` constante do antigo (`models.ts:11`): você pediu escolher | Factory: sem nível |
| Ordem de início e origem | nova; regra de `{level, source}` do Mastra Code (`thinking.ts:57-63`) | `model-accounts/defaults.ts` | — | — | Factory copia ao nascer (`factory-session.ts:338,363-366`) |
| Nível que desce | trazida da 12.1: `runLevel` de `thinking.ts`, a mesma regra de `getEffectiveThinkingLevel` (`openai-codex.ts:56-68`) | `thinking.ts` exporta `effortFor` | `runLevel` sobre `Effort` | o dono segue `thinking.ts` (C26) | Mastra Code, a mesma |
| Seções | nova | `settings/my-defaults.tsx`, `defaults.tsx`, `model-accounts/default-choice.tsx` | `default-model.tsx` vira `default-choice.tsx` | — | Factory: `FactoryDefaultModelSection.tsx:19-48` |
| Lista de P5 | nova | `model-accounts/store.ts` | — | — | Factory: o servidor filtra aos fornecedores com credencial (`useAvailableModels.ts:14-18`), como P5 A |
| `applyEvent` | nova | `hub-api/src/conversations.ts` | — | — | Mastra Code: `applyEvent` (`transcript.ts:197`); OS: `transcriptReducer` (`apps/web/src/features/builder/transcript.ts:84`); sobre eventos do Mastra, nós sobre os nossos (0050) |
| Segundos guardados, gravações | nova | `live.ts`, `history.ts`; `scripts/`, `recordings/` | — | — | — |

**A medida do transplante.** Nada trazido: o antigo tinha um padrão por papel na instalação
(`0033_model_account.sql:48-56`), sem pessoa nem nível.

**A dívida.** Nenhuma.

## U1 Os padrões no servidor e a ordem de início

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| todo arquivo que monta um `Accounts`: `web/src/builder/model-accounts/test-hub.tsx` e os `*.test.tsx` dela, `builder/conversation/test-hub.tsx`, `hub/identity/test-hub.tsx`, `welcome-step.test.tsx`, `apps/web/sweep-replies.ts`, `sweep-conversation-states.ts` | `defaultModel` vira `defaults` | testes, varredura |
| `apps/server/src/builder/model-accounts/thinking.ts` (12.1) | exporta `effortFor` | `defaults.ts` |
| `packages/hub-api/src/model-accounts.ts` | `ModelDefault`, `StartSource`, `Accounts.defaults` (sai `defaultModel`), `setDefaultModel`, `setMyModelDefault`, `clearMyModelDefault` | servidor, web, `scripts/emit-openapi.ts` |
| `apps/server/src/builder/model-accounts/tables.ts`, `defaults.ts` (novo), `queue.ts`, `changes.ts`, `store.ts`, `routes.ts`, `providers.ts`, `public.ts` | tabela, coluna, `startOf`, `effortFor`, `STARTER_MODELS` | `builder/conversation/routes.ts`, testes |
| `apps/server/src/builder/conversation/routes.ts` | `created` usa `conversationStart` | `main.ts` |
| `apps/server/migrations/`, `apps/server/database-grants.sql` | uma migração gerada que só soma (D6); as concessões | `npm run migrations`, o catálogo da CI |
| `apps/web/src/builder/model-accounts/` quem lê `defaultModel`; `apps/web/sweep-replies.ts`, `test-hub.tsx` | a forma nova | telas da 11 |

### Os contratos que a unidade cria

- `ModelDefault = z.object({model: ModelId, effort: Effort})`; `StartSource = z.enum(['mine',
  'company', 'starter'])`; `Accounts.defaults = {company: ModelDefault | null, mine: ModelDefault |
  null, start: (ModelDefault & {from: StartSource}) | null}`; `Accounts.connected = {mine:
  ProviderId[], company: ProviderId[]}` (P5), por `list`; não `usableProviders`: a conta pausada segue
  conectada.
- `setDefaultModel` `PUT /api/companies/{companyId}/default-model`, corpo `ModelDefault`: 200
  `{defaultModel: ModelDefault}`; falhas `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE`,
  `MODEL_UNKNOWN`, `EFFORT_UNSUPPORTED`.
- `setMyModelDefault` `PUT /api/companies/{companyId}/my-model-default`, corpo `ModelDefault`, 1 KiB como o `setDefaultModel`: 200
  `{mine: ModelDefault}` (a chave diz o escopo, como `defaultModel` diz o da empresa); as mesmas falhas, e as duas rotas recusam
  `MODEL_NO_ACCOUNT` fora de `connected` do escopo. `clearMyModelDefault` `DELETE` no mesmo caminho: 204.
- Tabela `builder.person_model_default`: `company_id text`, `person_id text`, `model text not null`,
  `effort text not null` com `check` nos valores de `Effort`; chave `(company_id, person_id)`; chave
  estrangeira a `member (organization_id, user_id)` `on delete cascade`, como
  `model_account_sign_in`; política `COMPANY` com `person_id = scoped.personId`. Concessões a
  `hub_company`: `SELECT`, `INSERT`, `DELETE`, `UPDATE(model)`, `UPDATE(effort)`.
- `builder.company_model.effort text not null default 'off'`, com `check`; `UPDATE(effort)`.
- `startOf(tx, asker): Promise<Start | null>` em `defaults.ts`, dono único da ordem (C26);
  `conversationStart(deps, asker, asked: ModelId | undefined): Promise<Start>` a chama e recusa
  `MODEL_UNKNOWN` ou `MODEL_NO_ACCOUNT`; `conversationModel(deps, asker, asked: ModelId)` fica só para
  a troca da 12.1. `effortFor(model: ModelId, wanted: Effort): Effort` exportada de `thinking.ts` (12.1), sobre `runLevel`: um dono da regra (C26).
- `STARTER_MODELS: readonly ModelId[]` em `providers.ts`, a lista de P3, conferida contra o registro
  num teste.
- Estado: `Start = ModelDefault & {from: StartSource}`, a variante pelo `from` (C21). Ids: `CompanyId`,
  `PersonId` da sessão (C23). Entrada externa: o corpo por `ModelDefault` (C27). Modelo: `changes.ts`
  `setDefault`, que cumpre C23 e C26; não tem `revision` porque o PUT leva o estado final.

### A ordem do trabalho

1. Contrato e migração. Regras: C27, C45, D5, D6, S32.
2. `startOf` e `effortFor`; `queuedRows` decide "usável". Regras: C21, C26. Funções:
   `@mastra/core@1.78.0` `getModelReasoningOptions`, por `effortsOf`.
3. Rotas e a criação. Regras: C37, S10, V54. `Sessions.switchModel(model, effort)`.

### As skills e a leitura

Do mapa (`docs/reference/stack.md`), na sua ordem; uma linha vale para toda pasta sob a sua. Em toda
unidade `typescript-magician`, `node` e `zod.dev/llms.txt`; no servidor, `fastify-best-practices` e
`orm.drizzle.team/llms.txt`. Aqui: `mastra`; `drizzle` (`node_modules/drizzle-kit/skills/`);
`neon:neon-postgres`; nos dublês, `vitest` e `msw`.

### Como se prova

1 a 11 e 24, pela rota e pelo banco de teste (T5, T6); a política com dois escopos.

## U2 As duas seções

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `routes/_app/companies/$companyId_/settings/my-defaults.tsx`, `defaults.tsx`, `model-accounts.tsx` | cria; a palavra sai | `routeTree.gen.ts` |
| `web/src/builder/model-accounts/default-choice.tsx` (era `default-model.tsx`), `company-accounts.tsx`, `queries.ts`, `text.ts`, `public.ts` | o formulário com nível e escopo | as rotas |
| `model-accounts/model-picker.tsx`, `model-fallback.tsx`, `conversation/model-choice.tsx` | a lista de P5 | o compositor, as seções, a fila |

### Os contratos que a unidade cria

`DefaultChoice(props: {companyId; scope: 'mine' | 'company'; defaults: Accounts['defaults'];
providers; mayChange: boolean})`. Textos em `text.ts` (C26). `mayChange` vem de `Accounts.mayManage` na empresa e é `true` no pessoal. Modelo: `my-accounts.tsx` (12.1), que cumpre C23 e C26 (textos em `text.ts`); C21 não se aplica, sem estado em união.

### A ordem do trabalho

Regras: W32, W17, V29, V30, V31. O `ModelPicker` com `effort` da 12.1.

### As skills e a leitura

`react.dev/llms.txt`; `router-core` (de `@tanstack/router-core`, não de `react-router`);
`tanstack.com/query/latest/llms.txt`; `node_modules/@base-ui/react/docs/`; `shadcn` (campos
`text-base md:text-body`, V18); `react-hook-form.com/docs`. Do Impeccable, `clarify` e `harden`.

### Como se prova

12 a 19 e 25.

## U3 As gravações

**O raio.** Cria `scripts/record-provider.ts` e `apps/server/src/platform/recordings/` (um
`<fornecedor>-<caso>.sse` e o seu `.json`); `Reply` de `platform/test-anthropic.ts` ganha `{kind:
'recorded'; name}`, e `test-cliproxy.ts` a rota de modelo `/v1`.

**Os contratos.** `Recording = z.object({provider: ProviderId, api: z.string(), sdk: z.string(),
recordedAt: z.iso.date()})`, o `.json` (T24, C27). `record-provider.ts --provider anthropic|google
--case cited|thinking|tool-error|abort`: um turno pelo `@ai-sdk/anthropic` instalado com a assinatura
Claude, ou pelo CLIProxy com a conta Gemini, e um `fetch` que copia o corpo. Pergunta inventada; a
credencial vem do ambiente, nunca a arquivo ou log (S40). Claude grava os quatro casos; Gemini,
a interrupção (o pensamento espera #172, a busca #150). Só esta sessão é autorizada ("2A", 2026-10-20).

**As skills e a leitura.** `node_modules/@ai-sdk/anthropic/docs/05-anthropic.mdx` (armadilhas: PR
188, PR 191); `node_modules/ai/docs/`; `mastra`; o README do CLIProxyAPI.

**Como se prova.** 26 e 27, `npm run test -w @conexus/server`.

## U4 Uma dobra

**O raio.** `hub-api/src/conversations.ts` cria `applyEvent`; no servidor, `put` e `appendText`
saem e `TurnLog` (`live.ts`) e `messageOf` (`parts.ts`, por `history.ts`) a chamam; na tela,
`appended` e `placed` saem de `live.ts`.

**Os contratos.** `PartEvent = Extract<ConversationEvent, {type: 'text' | 'part' | 'notice'}>`;
`applyEvent(parts: readonly MessagePart[], event: PartEvent): MessagePart[]`, pura: texto depois de
texto é um texto; parte com `id` troca a de mesmo `id`; as outras vão ao fim. Dona única (C26).

**As skills e a leitura.** `zod.dev/llms.txt`; `mastra`; `react.dev/llms.txt`.

**Como se prova.** 28, nos três workspaces; `knip` acusa o que sobrar.

## U5 Lido igual ao stream

**O raio e o contrato.** `live.ts`, `history.ts`: `THINKING_KEY = 'conexus.thinking'`, lista de `ThoughtTime = z.object({id: z.string(), seconds: z.number().int().nonnegative()})` na
metadata do fio, escrita por `settleThinking` pela fila `queued`, como `keepFailure`; lida por
`readConversation`.

**As skills e a leitura.** `mastra` e `node_modules/@mastra/memory/dist/docs/`.

**Como se prova.** 29 e 30, `npm run test -w @conexus/server`.

## U6 Percurso e roteiro

**As skills e a leitura.** `playwright-cli`; `vitest.dev/llms.txt`; o QA segue `conexus-qa`.

**Como se prova.** 20 e 21: `npm run e2e`, `npm run test -w @conexus/web`; 22 pelo QA; 23 após o
Release (L17).
