# Assinatura ChatGPT: a conta OpenAI entra como a do Claude

Cartão curto, fora da ordem do roteiro: leva a parte OpenAI da etapa **21 Outras contas**, que o
roteiro põe na fila do molde, para a trilha da fronteira, porque traz um mecanismo novo (um tipo de
conta, uma migração e uma rota), e o modelo do cartão padrão manda esse caso para o cartão inteiro.
O estudo, fora do repositório (L21), foi feito sobre o `main` em `0d535e2a`; este cartão tira dele as
seções 3 e 4.4 e reabriu no `main` de hoje cada linha que cita. Pela L5, `docs/steps/` guarda um
cartão por trilha, e o próximo de uma trilha espera no seu pull request em rascunho até o da frente
fechar. Três cartões da fronteira esperam a mesma vaga: este, o da 24.4
(https://github.com/developmentconexus-ops/conexus/pull/771) e o da 24.3.5
(https://github.com/developmentconexus-ops/conexus/pull/643). A ordem é do fundador. Se outro
entrar antes, este fica no rascunho, e a verificação `second-card` de `check-docs` fica vermelha
nele de propósito. Referências: Mastra Code e Mastra
Factory na tag `@mastra/core@1.82.0` (`6e8dfcb8`, `mastracode/`), Codex CLI em `openai/codex`
`970111f`. O Google fica como está.

## A página do fundador

**No fim desta etapa** você liga a sua assinatura do ChatGPT em **Contas de modelo**, como liga a do
Claude: o Hub mostra um código curto, você o digita na página da OpenAI, e a conta aparece na fila da
OpenAI, sua ou da empresa. Depois disso o Builder e o Assistente conversam pelo GPT com essa conta.

**O roteiro de uso.**

1. Como operador, em **Central › Empresas**, ligue **Assinatura ChatGPT** para a sua empresa. Ela
   vem desligada, como o Google.
2. Em **Configurações › Contas de modelo**, toque **Entrar com assinatura**, escolha **Assinatura
   ChatGPT**, dê um nome e toque **Gerar código**. O Hub mostra um código curto e o botão
   **Abrir a página da OpenAI**.
3. Abra a página, entre no ChatGPT e digite o código. Sem tocar em mais nada, o Hub fecha a janela e
   a conta aparece na fila da OpenAI.
4. Faça o mesmo em **Contas da empresa**, como dono: a conta é da empresa, e um membro a vê na fila
   dele.
5. Abra uma conversa com o Builder, escolha um modelo GPT e converse. A resposta vem pela
   assinatura, sem chave de API.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro com a
sua assinatura, que é a prova da decisão 0049 para o tipo novo (entrar, um token, uma renovação com
duas conversas ao mesmo tempo, 20 respostas sem recusa); nela o Hub grava, uma vez, as respostas da
OpenAI que os testes passam a usar. Então diz o que viu e aprova os textos das telas.

**Fica de fora.** A chave de API da OpenAI, que já funciona, e a gravação da lista dela (a issue
https://github.com/developmentconexus-ops/conexus/issues/220). O programa oficial "Sign in with
ChatGPT", que para um app hospedado só abre por formulário. A entrada pelo endereço colado
(`127.0.0.1:1455`). A lista de modelos lida da assinatura: o tipo oferece os modelos OpenAI do
registro, como a assinatura Claude oferece os da Anthropic, e um modelo que a assinatura não atende
sai da fila na primeira recusa. O Google, sem mudança.

**As suas respostas de 2026-11-05.** O Google recusou o login do Hub nesse dia ("This service has
been disabled in this account for violation of Terms of Service"), e você disse: "Esqueci google
pelo menos por agora então, vamos já inserir chatgpt então como conector. Google pode manter como é
hoj, mas quero que estude nossa arquitetura, lógica, como é feito e repositóriso referencia para a
gente inserir OpenAI". Às três decisões do estudo:

- "1. B igual mastra code e igual fizemos para Claude." O tipo novo entra como o Codex e o Mastra
  Code entram no ChatGPT. Você escolheu B depois do bloqueio do Google, então aceitou para a OpenAI
  o mesmo risco: o Hub se apresenta como o aplicativo Codex, a OpenAI recomenda chave de API para
  automação, e uma conta pode ser bloqueada sem aviso.
- "2. Sua recomendação" O código digitado, como no Mastra Factory.
- "3. Da empresa também sem gambiarra aptch, seguindo nosso padrão e lógica." A conta pode ser sua
  ou da empresa, pelo mesmo caminho do Claude, sem regra própria.

**As decisões suas nesta etapa.** Nenhuma nova.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A renovação com lease passa a ser de toda assinatura, na raiz de `model-accounts/`, e o processador de erro lê o conjunto dos tipos de assinatura. Nada muda para quem usa | `apps/server/src/builder/model-accounts/` (raiz e `claude/`), `packages/hub-api/src/model-accounts.ts`, `biome.json`, `docs/reference/boundaries.md` | data | — |
| U2 | O tipo `openai_codex`, a entrada por código de dispositivo com a rota de espera, a migração, a decisão nova e o que o web precisa para compilar com o tipo | `packages/hub-api/src/`, `apps/server/src/builder/model-accounts/` (raiz e `openai/`), `apps/server/src/platform/test-openai-codex.ts`, `.dependency-cruiser.cjs`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `apps/web/src/builder/model-accounts/` (`text.ts`, `sign-in-form.tsx`, `test-writes.tsx`, `connect.test.tsx`), `docs/decisions/`, `docs/index.md` | security | U1 |
| U3 | O modelo da assinatura no endpoint do Codex, a renovação da OpenAI, o ramo da fila e o caso `openai-codex` de `record-provider` | `apps/server/src/builder/model-accounts/` (`queue.ts`, `public.ts`, `openai/`), `apps/server/src/platform/test-openai-codex.ts`, `scripts/record-provider.ts`, `apps/server/package.json`, `package-lock.json`, `docs/reference/stack.md` | testing | U2 |
| U4 | As telas: o código na janela de entrada e a espera sozinha | `apps/web/src/builder/model-accounts/` | web | U2 |
| U5 | A prova da 0049 com o fundador: as gravações e os testes que só elas permitem | `apps/server/src/platform/recordings/`, `apps/server/src/platform/recordings.test.ts`, `apps/server/src/builder/model-accounts/`, a decisão nova | testing | U3, U4 |

A U3 e a U4 correm em paralelo depois da U2: não dividem pasta. A U5 é a do fundador: ela só roda
com a assinatura dele, no roteiro de uso, e nada nela chama a OpenAI antes disso.

**Orçamento de código alterado.** U1: cerca de 120 linhas. U2: cerca de 470. U3: cerca de 230. U4:
cerca de 130. U5: cerca de 40. Total da etapa: cerca de 990, dentro da L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Duas conversas ao mesmo tempo numa assinatura Claude vencida chamam a renovação da Anthropic uma vez; uma renovação recusada (400) deixa a conta recusada e as duas conversas dizem isso. Os testes de hoje passam sem mudar uma asserção | `claude-refresh.test.ts`, os casos de hoje | must |
| 2 | U1 | Depois de uma renovação, a conversa seguinte na mesma assinatura Claude abre o token novo, selado com o tipo da própria conta, e responde sem renovar de novo; o mesmo store renova a OpenAI no critério 14 | `claude-refresh.test.ts`, o caso de hoje da conversa depois da renovação | must |
| 3 | U2 | Com o tipo desligado para a empresa, `POST /api/companies/{id}/model-account-sign-ins` com `kind: 'openai_codex'` recusa `MODEL_ACCOUNT_KIND_OFF` e não chama a OpenAI | `openai/sign-in.test.ts`, "tipo desligado: recusa sem chamar a OpenAI" | must |
| 4 | U2 | Com o tipo ligado, a partida responde 201 `{ entry: 'device', signInId, url: 'https://auth.openai.com/codex/device', userCode, retryMs, expiresAt }`, com `expiresAt` 15 minutos à frente, depois de um só `POST …/api/accounts/deviceauth/usercode` com o `client_id` do Codex. Um 4xx da partida recusa `MODEL_ACCOUNT_REFUSED`, um 5xx ou a rede `MODEL_ACCOUNT_UNAVAILABLE`, e nenhuma entrada fica gravada. A partida do Claude responde `entry: 'paste'` | `openai/sign-in.test.ts`, "a partida mostra o código", "a partida recusada" | must |
| 5 | U2 | `POST …/model-account-sign-ins/{signInId}/poll` antes de a pessoa digitar (o dublê responde 403 ou 404) responde 200 `{ status: 'waiting', retryMs }`; um segundo pedido antes de `retryMs` responde `waiting` sem chamar a OpenAI | `openai/sign-in.test.ts`, "esperando: uma chamada por intervalo" | must |
| 6 | U2 | Depois de a pessoa digitar, a espera responde 200 `{ status: 'linked', account }`: `kind: 'openai_codex'`, `provider: 'openai'`, o dono e o nome da partida, no fim da fila da OpenAI. A credencial selada guarda `{ access, refresh, expires, accountId }`. Uma terceira espera recusa `MODEL_ACCOUNT_SIGN_IN_EXPIRED` | `openai/sign-in.test.ts`, "ligada: a conta entra e a entrada some" | must |
| 7 | U2 | Duas esperas ao mesmo tempo depois de a pessoa digitar fazem uma troca de código e criam uma conta; a outra responde `waiting`, ou `linked` com a mesma conta. Uma espera repetida depois de a resposta `linked` se perder responde `linked` com a mesma conta, e não `SIGN_IN_EXPIRED` | `openai/sign-in.test.ts`, "duas esperas ao mesmo tempo: uma conta", "a resposta perdida volta ligada" | must |
| 8 | U2 | Recusas da espera: a OpenAI responde um 4xx que não é 403, 404, 408 nem 429, a troca de código é recusada, ou nenhum token traz `chatgpt_account_id`: `MODEL_ACCOUNT_REFUSED`, e a entrada acaba. Um 408, um 429, um 5xx, a rede fora ou o prazo de 15 s: `MODEL_ACCOUNT_UNAVAILABLE`, e a entrada continua. Depois de 15 minutos: `MODEL_ACCOUNT_SIGN_IN_EXPIRED` | `openai/sign-in.test.ts`, um caso por recusa | must |
| 9 | U2 | `complete` numa entrada `openai_codex`, ou `poll` numa entrada Claude, recusa `MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY` e deixa a entrada como estava | `openai/sign-in.test.ts`, "cada entrada pela sua rota" | must |
| 10 | U2 | Um dono liga uma conta `owner: 'company'`; um membro que pede `owner: 'company'` é recusado como hoje no Claude. Nenhum ramo de dono é só da OpenAI | `openai/sign-in.test.ts`, "da empresa pelo mesmo caminho" | must |
| 11 | U2 | A migração aceita `openai_codex` nos três CHECKs, e um insert direto de um tipo desconhecido é recusado; `hub_company` só pode mudar `poll_at` da entrada, e não a entrada de outra empresa | `platform/catalog.test.ts` (o retrato de `database-grants.sql`), `platform/isolation-model-accounts.test.ts` (um caso de `UPDATE` como `hub_company`) e `check-migrations` | must |
| 12 | U3 | Um turno numa conta `openai_codex` manda `POST https://chatgpt.com/backend-api/codex/responses` com `Authorization: Bearer <access>`, `ChatGPT-Account-ID`, `originator`, `store: false`, `instructions` e nenhum `id` nos itens de `input`; o esforço escolhido chega em `reasoning.effort` | `openai/codex.test.ts`, "o pedido que sai", lendo o pedido no `fetch` dublê | must |
| 13 | U3 | Um 401 do Codex renova uma vez e tenta de novo; um segundo 401 marca a conta recusada, e o turno diz a recusa com o nome da conta. Um 429 marca o limite com a hora que ele dá | `openai/codex.test.ts`, "401 renova uma vez", "429 é limite" | must |
| 14 | U3 | Duas conversas ao mesmo tempo com o token vencido chamam `POST https://auth.openai.com/oauth/token` (`grant_type=refresh_token`) uma vez, e as duas mandam o token novo; o refresh token novo fica selado. Uma renovação recusada (400 `invalid_grant`) deixa a conta recusada | `openai/codex.test.ts`, "renovação com duas conversas", "renovação recusada" | must |
| 15 | U3 | A conta `openai_codex` oferece os modelos OpenAI do registro, sem leitor de lista, como a assinatura Claude; um 404 da chamada segue a regra de hoje da fila (`missing`). Se o 404 do Codex quer dizer "modelo não atendido" só a U5 mostra | `model-served.test.ts`, caso novo `openai_codex` | must |
| 16 | U4 | Escolhida **Assinatura ChatGPT**, a janela mostra o código, o botão **Abrir a página da OpenAI** e "Esperando você digitar o código…", sem campo de código; quando a espera diz `linked`, a janela fecha e a conta aparece na fila. A 1366 e a 390 px, nos dois temas | `sign-in.test.tsx` e QA | must |
| 17 | U4 | Recusa, vencimento, tipo desligado ou entrada errada voltam ao começo com a frase do Hub; um 502 mantém a espera, mostra a frase do Hub para `MODEL_ACCOUNT_UNAVAILABLE` e tenta de novo depois de `retryMs`. **Cancelar** fica desligado enquanto uma espera está no ar | `sign-in.test.tsx`, um caso por estado | must |
| 18 | U2 | O operador vê **Assinatura ChatGPT** desligada por padrão na lista de tipos da empresa | `account-kinds` no teste de hoje, com o tipo novo | must |
| 19 | U5 | A prova da 0049 com a assinatura do fundador: entrar 200, um token, o `expires_in` cru, uma renovação com duas conversas, 20 de 20 turnos sem 401 nem 403, entre eles um com o raciocínio desligado. As gravações ficam em `platform/recordings/`, e um turno que responde passa a ser testado com elas | `record-provider --provider openai-codex`; `openai/codex.test.ts`, "o turno responde" | must |
| 20 | U2 | Uma espera de outra pessoa, ou de outra empresa, com o `signInId` de alguém recusa `MODEL_ACCOUNT_SIGN_IN_EXPIRED` e não chama a OpenAI | `openai/sign-in.test.ts`, "a entrada é só de quem a começou" | must |
| 21 | U2 | Com o tipo desligado entre a partida e a espera, a espera recusa `MODEL_ACCOUNT_KIND_OFF` sem chamar a OpenAI, e a entrada fica | `openai/sign-in.test.ts`, "tipo desligado no meio" | must |
| 22 | U5 | O que um 404 do Codex quer dizer para um modelo que a assinatura não atende, e se o Codex aceita o raciocínio `none`, ficam gravados; se um deles não for o que os critérios 13 e 15 supõem, a correção volta ao cartão | `record-provider --provider openai-codex --case unserved`, `--case off` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entrar com assinatura, tipo **Assinatura ChatGPT** | O começo de hoje, com o tipo na lista; o botão diz **Gerar código** | Sem tipo ligado: a frase de hoje | "Gerando…" no botão | A frase do Hub acima do começo | — | O membro não escolhe "da empresa", como hoje | — |
| A espera do código | O código grande, em letra fixa, selecionável; **Abrir a página da OpenAI**; "O código vale até {hora}."; "Esperando você digitar o código…" | — | A mesma frase de espera, com o indicador; **Cancelar** desligado durante cada espera | 502: a frase do Hub para `MODEL_ACCOUNT_UNAVAILABLE` (C48), e a espera tenta de novo depois de `retryMs` | `WRONG_ENTRY` ou entrada sumida: volta ao começo com a frase do Hub | — | Venceu: volta ao começo com "O código venceu. Entre de novo."; recusa ou tipo desligado: volta ao começo com a frase do Hub |
| Tipos da empresa (operador) | **Assinatura ChatGPT** na lista, desligada | — | — | A frase de hoje | — | — | — |

A frase de `MODEL_ACCOUNT_REFUSED` deixa de mandar colar ("O fornecedor recusou a entrada." e "Entre de
novo."), porque ela vale para os três tipos; o fundador aprova os textos no fim.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `startModelAccountSignIn` resposta `entry` | `sign-ins.ts`, de `SIGN_IN_ENTRY[kind]` | `sign-in-form.tsx`, que escolhe a vista |
| resposta `userCode`, `retryMs` (só `device`) | `openai/sign-in.ts` por `sign-ins.ts` | a vista da espera |
| `pollModelAccountSignIn` resposta `status`, `retryMs`, `account` | `sign-ins.ts` | a vista da espera |
| `model_account_sign_in.poll_at` | `sign-ins.ts` (lease e agenda da espera) | `sign-ins.ts` |
| credencial `openai_codex` `{ access, refresh, expires, accountId }` | `openai/sign-in.ts` e `subscription-store.ts` | `subscription-store.ts`, `openai/models.ts` |

A janela, a 1280 e a 390 px (a de hoje, com a vista nova no lugar do campo de código):

```text
1280                                         390
┌ Entrar com assinatura ─────────────────┐   ┌ Entrar com assinatura ─┐
│ Digite este código na página da OpenAI │   │ Digite este código na  │
│                                        │   │ página da OpenAI       │
│   ABCD-1234                            │   │   ABCD-1234            │
│ [ Abrir a página da OpenAI ]           │   │ [ Abrir a página da    │
│ O código vale até 05/11 14:32.         │   │   OpenAI ]             │
│ ◌ Esperando você digitar o código…     │   │ O código vale até      │
│                          [ Cancelar ]  │   │ 05/11 14:32.           │
└────────────────────────────────────────┘   │ ◌ Esperando você…      │
                                             │           [ Cancelar ] │
                                             └────────────────────────┘
```

Não há captura do produto antigo: ele não tinha este tipo. A vista segue a `DeviceCodeDialog` do
Mastra Factory (`factory-ui/src/ui/domains/settings/components/ProviderOAuthDialog.tsx:104-192`).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Partida: `POST deviceauth/usercode`, depois o insert selado da entrada | Duas entradas, cada uma com o seu código; a mais nova é a que a pessoa vê | O código da OpenAI sem a linha no banco: ninguém o espera, e ele vence lá. Resposta cortada ao cliente: a pessoa gera outro código | 4xx: `MODEL_ACCOUNT_REFUSED`. 5xx, rede ou 15 s: `MODEL_ACCOUNT_UNAVAILABLE` 502, nada gravado. Banco fora: 503 de hoje | `MODEL_ACCOUNT_SIGN_IN_STARTED` de hoje | 3, 4 |
| Espera: reservar `poll_at`, um `POST deviceauth/token`, a troca em `oauth/token`, depois apagar a entrada e inserir a conta numa transação | A reserva é um `UPDATE … WHERE poll_at <= now()`: a segunda espera não reserva e responde `waiting` | Queda entre a troca e a transação: a entrada fica reservada até vencer, nenhuma conta nasce, e a pessoa gera outro código; isto supõe que o código de dispositivo serve uma vez só, o que só a U5 mostra. Um 502 ou resposta cortada da OpenAI devolve `poll_at` ao agora e a entrada continua. A resposta `linked` cortada ao cliente: a espera repetida acha a conta pela `attemptKey` e responde `linked` de novo | 408, 429, 5xx, rede ou 15 s: `MODEL_ACCOUNT_UNAVAILABLE`, a entrada continua. Banco fora depois da troca: a conta não nasce, a pessoa gera outro código | `MODEL_ACCOUNT_SIGN_IN_LINKED`, ou a recusa com o status da OpenAI, nunca o token (S34) | 5, 6, 7, 8, 20, 21 |
| Renovação: lease de `refresh_until`, `POST oauth/token` com o refresh token rotativo, depois o store | A segunda conversa espera o lease e lê o token novo (o mesmo da U1) | Queda entre a resposta e o store: o refresh token novo se perde, o velho já foi gasto, e a próxima renovação é recusada; a conta fica recusada e a pessoa entra de novo. É a mesma janela da assinatura Claude | 4xx: recusada. 5xx ou rede: `MODEL_ACCOUNT_UNAVAILABLE`, o lease é solto | `MODEL_TOKEN_REFRESHED` de hoje | 1, 14 |
| Chamada do modelo no endpoint do Codex | Duas conversas usam o mesmo token, como no Claude | Resposta cortada no meio do stream: o turno acaba como hoje, pelo AI SDK | 401 ou 403: renova uma vez, depois recusada. 429 ou 402: limite. 404: o modelo sai da conta. 5xx: falha de hoje | `MODEL_CALL_REFUSED` ou `MODEL_CALL_FAILED` de hoje | 12, 13, 15 |
| A migração | — | Uma instrução recusada desfaz a migração inteira (a transação do migrador) | — | O migrador de hoje | 11 |
| `npm run record-provider -- --provider openai-codex` | Duas rodadas regravam o mesmo arquivo; vale a última, revista no diff | Cortada no meio: o arquivo não é escrito, porque ele grava só no fim | OpenAI fora ou 401: sai com o status, sem arquivo | O caso, o modelo, o status e o caminho do arquivo, nunca o token (S40) | 19, 22 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Ligar uma chave da OpenAI | fica de fora: já em main | `providers.ts` `KEY_PROVIDERS`; `accounts.ts` `insertAccount` | `@mastra/core@1.82.0` `dist/provider-registry.json` `providers.openai` | `gateway: models.dev`, `apiKeyEnvVar: OPENAI_API_KEY` | nativo | — | 0049 | nenhum |
| 2. Chamar o GPT com a chave | fica de fora: já em main | `queue.ts:167-171` `callModel` | `@mastra/core@1.82.0` `dist/netlify-B4WEuwxb.js:42849-42866` | `createOpenAI(...).responses(modelId)` | nativo | — | — | nenhum |
| 3. A lista da chave | fica de fora: a issue 220 | `served.ts` `OpenAiList` | — | o leitor existe, sem gravação | embrulhado | `npm run record` com uma chave real | — | nenhum |
| 4. O esforço do GPT | U3 (só lido) | `thinking.ts` `{ openai: { reasoningEffort } }` | Mastra `getModelReasoningOptions` | os esforços da Mastra | nativo | — | — | nenhum |
| 5. Entrar com o ChatGPT (código de dispositivo) | U2 | nenhum: `ACCOUNT_KINDS` em `packages/hub-api/src/model-accounts.ts:20` | Mastra Code `sdk/src/auth/providers/openai-codex.ts:46-59,404-516`; Factory `routes/oauth.ts:86-104,386-466`; Codex `codex-rs/login/src/server.rs:77-80` (issuer e portas), `auth/manager.rs:1784` (cliente), `device_code_auth.rs:62-70,83,108,131` | cliente `app_EMoamEEZ73f0CkXaXp7hrann`, `auth.openai.com`; partida em `deviceauth/usercode`; uma espera por pedido em `deviceauth/token`, onde 403 e 404 querem dizer "ainda não"; a resposta traz `authorization_code` e `code_verifier`, trocados em `oauth/token` com `redirect_uri` `…/deviceauth/callback`; 15 minutos. O Factory guarda a entrada numa linha, reserva a linha para uma espera e marca a próxima hora | embrulhado, trazido do Mastra Code com a licença Apache-2.0, como `claude/sign-in.ts` | a U5 (0049) | "1. B", "2. Sua recomendação" | `model-accounts/openai/sign-in.ts` |
| 6. Renovar o token | U1, U3 | `claude/store.ts:107-143` `subscriptionAccess` | Mastra Code `auth/providers/openai-codex.ts:209-230`; Codex `login/src/auth/manager.rs:214-215,1695` | `grant_type=refresh_token` com `client_id`; o refresh token roda, e as referências fazem uma renovação por vez; o Codex renova 5 minutos antes | nativo no padrão de hoje (o lease) | — | — | `model-accounts/subscription-store.ts` (o `claude/store.ts` movido) |
| 7. O modelo da assinatura | U3 | `claude/models.ts` `subscriptionModel` | Mastra Code `sdk/src/providers/openai-codex.ts:22-26,76-104,226-246,260-323,554-569` | `createOpenAI({ apiKey: placeholder, fetch }).responses(id)`; o `fetch` troca a URL por `chatgpt.com/backend-api/codex/responses`, põe Bearer, `originator`, `User-Agent` e `ChatGPT-Account-ID`, tira os `id` dos itens de `input`; o middleware põe `instructions` e `store: false` | embrulhado | a U5 (20 turnos) e a gravação do stream (T24) | "1. B" | `model-accounts/openai/models.ts` |
| 8. Modelos que a assinatura atende | U3 | `served.ts:15-20`, sem leitor para assinatura | Codex `codex-api/src/endpoint/models.rs:33-44` (`GET {base}/models?client_version=`) | o Codex lê a lista; o Mastra Code oferece o registro | nativo como a assinatura Claude: sem leitor, o registro vale e um 404 marca `missing` | — | — | nenhum |
| 9. Guardar o token | U2 | `platform/seal.ts`; `sign-ins.ts:77-98,154-169` | Mastra Code `auth/storage.ts`; Factory `storage/domains/credentials/base.ts` | `{ refresh, access, expires, accountId }` | nativo (o selo do Hub) | — | — | nenhum |
| 10. Fila, limite, recusa | U1, U3 | `processors.ts:265` (`resubscribe` só para `claude_subscription`); `errors.ts` `callFailureOf` | Mastra Code `auth/account-rotation-processor.ts:143-149` | 429 e 402 trocam de conta, 401 e 403 trocam de conta, 5xx pula; o 404 que marca `missing` é a regra do Hub (0054) | nativo | — | — | nenhum |
| 11. Os tipos por empresa | U2 | `kinds.ts`; migração `20261019110217_model_accounts/migration.sql:7,34,61`; `tables.ts` | nenhuma faz (peça de produto) | decisão 0049 | remendo | `docs/decisions/0049-model-accounts-keys-sign-ins-queues.md`; a entrada em `boundaries.md` vem no fechamento (L19) | 0049 e "3." | migração nova |
| 12. As telas | U4 | `text.ts:16-20` `KIND_NAMES`; `sign-in-form.tsx:27-39,115-152` | Factory UI `ProviderOAuthDialog.tsx:104-192` | o código em letra fixa, o botão da página, a espera por `setTimeout` com `nextPollMs`, a frase de erro no rodapé | embrulhado | QA a 1366 e 390 px | "2." | nenhum |
| 13. O programa oficial | fica de fora | — | developers.openai.com/siwc | registro dinâmico, só para app local ou aprovado | nativo, e não aberto ao Hub | — | "1. B" | — |
| 14. O Google | fica de fora | `google/*` | CLIProxyAPI v8.0.33 (0049) | o login Antigravity | remendo, sem mudança desde a 0049 | CLIProxyAPI v8.0.33, a prova 3 da 0049 | "Google pode manter como é hoj" | — |

**A medida do transplante.** `openai/sign-in.ts` traz de
`mastracode/sdk/src/auth/providers/openai-codex.ts` só as constantes (`:46-59`), a troca de código
(`:182-205`), a renovação (`:209-230`), a leitura do `chatgpt_account_id` do JWT, `startCodexDeviceLogin`
e `pollCodexDeviceLogin` (`:425-516`), com cabeçalho de licença e o `THIRD_PARTY_LICENSE.txt` ao
lado, como `claude/sign-in.ts:1-5`. Refatorado na entrada: TypeScript estrito, cada resposta lida por
Zod (o `interval` da partida aceita número ou texto, `:444`; o corpo do JWT também por Zod),
`console.error` trocado por uma recusa que leva o status (C50), sem o fluxo de navegador e sem
`node:http`, `originator` e `User-Agent` com um valor só do Hub. O `expires` guarda o `expires_in`
menos 5 minutos, como `claude/sign-in.ts:22,92` e o Codex (`manager.rs:215`), e 3.600 s quando a
OpenAI não manda `expires_in` (`:56,177`). O `chatgpt_account_id` vem do `id_token`, depois do token
de acesso, na reivindicação de topo ou em `https://api.openai.com/auth` (`:122-140`). Cada chamada
tem prazo de 15 s (`:58`, C57) e lê no máximo 64 KB da resposta (C59). `openai/models.ts` traz de
`providers/openai-codex.ts` o `fetch` (`:260-323`), `stripCodexInputItemIds` (`:226-246`) e o
middleware (`:76-104`), sem o ramo de teste por `NODE_ENV` (C67) e sem o Stagehand. Nenhuma decisão
antiga vem com eles. Cerca de 250 linhas trazidas, abaixo da medida da regra do estudo.

**A dívida.** O endpoint do Codex não é API pública e pode mudar sem aviso; a U5 o prova uma vez, e
uma recusa dele vira issue. As issues `next-card` da área esperam: a
https://github.com/developmentconexus-ops/conexus/issues/172 (o raciocínio do GPT no stream) pede a
gravação da U5 antes; a https://github.com/developmentconexus-ops/conexus/issues/182 (a marca da
OpenAI) é da trilha de desenho; a https://github.com/developmentconexus-ops/conexus/issues/220 é da
chave, fora deste cartão.

## U1 A renovação de toda assinatura

**Base e modelo.** `main` em `0d535e2a`. Sonnet: um movimento de arquivo e uma condição.

### As linhas da tabela

Linhas 6 e 10. Ler `claude/store.ts` inteiro (143 linhas), `processors.ts:255-275`, `queue.ts:142-158`,
`claude/sign-in.ts:24-39` (`TokenReply`, `AnthropicRefusal`) e o uso de `refreshAnthropicTokens`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/model-accounts/claude/store.ts` | Apaga (move) | `queue.ts` |
| `apps/server/src/builder/model-accounts/subscription-store.ts` | Cria | `queue.ts` |
| `apps/server/src/builder/model-accounts/claude/sign-in.ts` | Muda: a recusa e `SubscriptionTokens` saem para o store | `subscription-store.ts`, `claude/sign-in.ts` |
| `biome.json:176`, `docs/reference/boundaries.md:946-951` | Muda: a exceção do relógio passa de `claude/store.ts` para `subscription-store.ts` | o lint |
| `apps/server/src/builder/model-accounts/processors.ts` | Muda a linha 265 | — |
| `packages/hub-api/src/model-accounts.ts` | Cria `SUBSCRIPTION_KINDS` | server |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/model-accounts.ts
export const SUBSCRIPTION_KINDS = ['claude_subscription'] as const satisfies readonly SignInKind[]
export type SubscriptionKind = (typeof SUBSCRIPTION_KINDS)[number]
export function isSubscription(kind: AccountKind): kind is SubscriptionKind

// apps/server/src/builder/model-accounts/subscription-store.ts
export const SubscriptionTokens: z.ZodType<{ access: string; refresh: string; expires: number; accountId?: string }>
export class SubscriptionRefusal extends Error { readonly status: number | undefined }
export type Renewal = (refresh: string) => Promise<SubscriptionTokens>
export type SubscriptionAccount = { id; companyId; personId; kind: SubscriptionKind; provider; revision; credential }
export function subscriptionAccess(deps: Deps, account: SubscriptionAccount, renew: Renewal, force?: boolean): Promise<SubscriptionTokens>
```

`AnthropicRefusal` sai e vira `SubscriptionRefusal`. `subscriptionAccess` devolve os tokens inteiros,
porque a OpenAI precisa do `accountId`; o Claude lê `.access`. O tipo selado vem de `account.kind`,
não mais do literal de `store.ts:45,71`. Modelo: o próprio `claude/store.ts`, que cumpre C21, C23 e
C26.

### As skills e a leitura

As linhas `drizzle-orm` e `zod` de `docs/reference/stack.md`, pstack `typescript-best-practices`, e
as regras D22 e D25 de data.

### A ordem do trabalho

1. `git mv claude/store.ts subscription-store.ts`; trocar os dois `kind: 'claude_subscription'` por
   `account.kind`, e `refreshAnthropicTokens` pelo `renew` recebido. Regras: data D22 e D25,
   security S34.
2. `SUBSCRIPTION_KINDS` e `isSubscription` no hub-api; `processors.ts:265` passa a
   `isSubscription(account.kind)`.
3. `queue.ts` passa `refreshAnthropicTokens` como `renew`.
4. `biome.json:176` e o texto de `boundaries.md:946-951` passam a nomear `subscription-store.ts`. Os
   relógios do arquivo não mudam, então ele continua na lista dos três da etapa 11.

### Como se prova

Os critérios 1 e 2 com `claude-refresh.test.ts` como está. `npm run typecheck`,
`npm run lint`, `npm run knip`.

### Parar se

Um teste de hoje precisar mudar uma asserção: a unidade mudou comportamento.

## U2 O tipo e a entrada por código

**Base e modelo.** A U1 em `main`. Opus: a rota de espera tem uma reserva concorrente, e o contrato
de entrada cruza hub-api, server e web.

### As linhas da tabela

Linhas 5, 9 e 11. Ler `sign-ins.ts` inteiro (176 linhas), `routes.ts:178-203`, `public.ts:59-62`,
`kinds.ts`, `tables.ts` (as duas tabelas e os CHECKs), `packages/hub-api/src/model-accounts.ts:15-30`
e `:287-335`, `model-account-failures.ts:93-115`, e as referências da linha 5.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/model-accounts.ts` | Muda: o tipo, `SIGN_IN_ENTRY`, a resposta da partida, a operação de espera | server, web |
| `packages/hub-api/src/model-account-failures.ts` | Cria `MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY`; muda a frase de `MODEL_ACCOUNT_REFUSED` | server, web |
| `apps/web/src/builder/model-accounts/{text.ts,sign-in-form.tsx,test-writes.tsx,connect.test.tsx}` | Muda: `KIND_NAMES.openai_codex`, `CODE_FIELDS` só dos tipos `paste`, a resposta dublê da partida com `entry`, a frase nova no teste | o typecheck do web |
| `apps/server/src/platform/test-openai-codex.ts`, `.dependency-cruiser.cjs` | Cria o dublê de `auth.openai.com` e o põe em `TEST_DATABASE` (T5) | `openai/sign-in.test.ts` |
| `apps/server/src/builder/model-accounts/sign-ins.ts` | Muda: as duas entradas, a espera | `routes.ts`, `public.ts` |
| `apps/server/src/builder/model-accounts/openai/` | Cria `sign-in.ts`, `THIRD_PARTY_LICENSE.txt`, `sign-in.test.ts` | `public.ts` |
| `apps/server/src/builder/model-accounts/{routes,public,tables}.ts` | Muda | `apps/server/src/app.ts` de hoje |
| `apps/server/migrations/<novo>_openai_codex/`, `<novo>_openai_codex_grants/`, `apps/server/database-grants.sql` | Cria e muda | o migrador |
| `docs/decisions/<próximo número>-openai-subscription-sign-in.md`, `docs/index.md` | Cria e muda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/model-accounts.ts
export const ACCOUNT_KINDS = ['api_key', 'claude_subscription', 'google_cliproxy', 'openai_codex'] as const
export const SUBSCRIPTION_KINDS = ['claude_subscription', 'openai_codex'] as const
/** How each sign-in kind comes back: a pasted code, or a code typed on the vendor's page. One owner. */
export const SIGN_IN_ENTRY = {
  claude_subscription: 'paste',
  google_cliproxy: 'paste',
  openai_codex: 'device',
} as const satisfies Record<SignInKind, 'paste' | 'device'>

// startModelAccountSignIn: success 201, body
z.discriminatedUnion('entry', [
  z.object({ entry: z.literal('paste'), signInId: SignInId, url: z.url(), expiresAt: z.iso.datetime() }),
  z.object({ entry: z.literal('device'), signInId: SignInId, url: z.url(), userCode: z.string().min(1).max(32),
             retryMs: z.number().int().positive(), expiresAt: z.iso.datetime() }),
])

// pollModelAccountSignIn: POST /api/companies/{companyId}/model-account-sign-ins/{signInId}/poll,
// access 'session', no body; success 200
z.discriminatedUnion('status', [
  z.object({ status: z.literal('waiting'), retryMs: z.number().int().positive() }),
  z.object({ status: z.literal('linked'), account: ModelAccount }),
])
// failures: READ_FAILURES, MODEL_ACCOUNT_KIND_OFF, MODEL_ACCOUNT_REFUSED, MODEL_ACCOUNT_SIGN_IN_EXPIRED,
// MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY, MODEL_ACCOUNT_UNAVAILABLE
// completeModelAccountSignIn ganha MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY nas falhas.
```

```ts
// packages/hub-api/src/model-accounts.ts, derivados de SIGN_IN_ENTRY
export type PasteKind = { [K in SignInKind]: (typeof SIGN_IN_ENTRY)[K] extends 'paste' ? K : never }[SignInKind]
export type DeviceKind = Exclude<SignInKind, PasteKind>
export const DEVICE_KINDS: readonly DeviceKind[]
export function isDeviceKind(kind: SignInKind): kind is DeviceKind

// apps/server/src/builder/model-accounts/sign-ins.ts
export type SignInFlow = { provider; seconds; start(): Promise<{ url; pending: Credential }>; complete(pending, code): Promise<Credential> }
export type DevicePoll = { status: 'waiting'; retryMs: number } | { status: 'linked'; credential: Credential }
export type DeviceSignInFlow = {
  provider: ProviderId
  seconds: number
  start(): Promise<{ url: string; userCode: string; retryMs: number; pending: Credential }>
  poll(pending: Credential): Promise<DevicePoll>
}
export type SignInFlows = {
  readonly paste: Readonly<Record<PasteKind, SignInFlow>>
  readonly device: Readonly<Record<DeviceKind, DeviceSignInFlow>>
}
export function pollSignIn(deps, input: Viewer & { signInId: SignInId }): Promise<{ status: 'waiting'; retryMs: number } | { status: 'linked'; account: ModelAccount }>
```

Os fluxos ficam em dois registros, um por entrada, e `sign-ins.ts` escolhe o registro por
`isDeviceKind(kind)`, que estreita o tipo sem `as` (C24). `SignInFlow` mantém o nome e a forma, e
`google/` e `claude/sign-in.ts` não mudam; só `public.ts` monta os dois registros. `MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY`:
`category: 'USER'`, `status: 400`, frase "Esta entrada não é por aqui.", ação "Entre de novo.".
`MODEL_ACCOUNT_REFUSED` passa a dizer "O fornecedor recusou a entrada." e "Entre de novo.".

Colunas: `model_account_sign_in.poll_at timestamptz NOT NULL DEFAULT statement_timestamp()`; os três
CHECKs (`company_account_kind_kind`, `model_account_kind`, `model_account_sign_in_kind`) ganham
`'openai_codex'`; `GRANT UPDATE (poll_at) ON builder.model_account_sign_in TO hub_company`.

O `pending` selado da OpenAI: `{ deviceAuthId, userCode, retryMs }`, lido por Zod. As respostas da
OpenAI lidas por Zod: `{ device_auth_id, user_code | usercode, interval }` da partida,
`{ authorization_code, code_verifier }` da espera, `{ access_token, refresh_token, expires_in?, id_token? }`
da troca e da renovação; o `chatgpt_account_id` vem da reivindicação `https://api.openai.com/auth` do
JWT de acesso (Mastra Code `requireAccountId`), e sem ele a entrada é recusada.

O modelo: `claude/sign-in.ts` para o arquivo trazido (cumpre C21, C26, C27); a reserva por `UPDATE`
segue a de `subscription-store.ts` `reserve` (C21, C23); se o jscpd apontar as duas como clone, elas
viram uma função na raiz (C26).

A rota de espera tem o verbo no fim do caminho, como `requests/{requestId}/cancel`
(`packages/hub-api/src/requests.ts:101`) e `connections/{connectionId}/test` (`connectors.ts:184`),
dentro da C35. O limite de partidas por pessoa é o geral de hoje (S28): cada partida apaga as
entradas vencidas da pessoa (`sign-ins.ts:79-88`).

### As skills e a leitura

As linhas de `docs/reference/stack.md` das pastas: `fastify` (skill `fastify-best-practices`),
`drizzle-orm` e `zod` (`zod.dev/llms.txt`), mais pstack `typescript-best-practices`; o guia security
(S22, S34) e as regras D22 e D25 de data.

### A ordem do trabalho

1. hub-api: o tipo, `SUBSCRIPTION_KINDS`, `SIGN_IN_ENTRY` e os seus derivados, a resposta da partida
   em união, a operação `pollModelAccountSignIn`, a falha nova (também na lista de
   `completeModelAccountSignIn`), `MODEL_ACCOUNT_REFUSED` na lista da partida, e a frase. Regras: C21,
   C26, C27. No mesmo passo, o web compila: `KIND_NAMES.openai_codex = 'Assinatura ChatGPT'`,
   `CODE_FIELDS` tipado por `PasteKind`, a resposta dublê de `test-writes.tsx:96,126` com
   `entry: 'paste'`, e a frase nova em `connect.test.tsx:241`.
2. A migração e as permissões, com `npm run check-migrations` local antes de seguir; `tables.ts`
   acompanha.
3. `openai/sign-in.ts`: a partida e a espera trazidas. Uma recusa leva o status da OpenAI
   (`SubscriptionRefusal`); 403 e 404 da espera são `waiting`; 408 e 429 são `UNAVAILABLE`. A
   renovação não entra aqui: o seu único chamador é da U3 (C74).
4. `sign-ins.ts`: `startSignIn` grava `poll_at` como agora, então a primeira espera pode chamar a
   OpenAI logo, e devolve `entry`. `take` só pega uma entrada `paste`: para outra, lança
   `WRONG_ENTRY` dentro da transação, e o `DELETE` volta atrás, como o tipo desligado faz em
   `sign-ins.ts:135`. `pollSignIn`, nesta ordem:
   1. Admitir e conferir o tipo aberto (`admitOpen`), sem chamar a OpenAI.
   2. Reservar com `UPDATE … SET poll_at = expires_at WHERE id, empresa, pessoa, kind IN DEVICE_KINDS,
      expires_at > statement_timestamp(), poll_at <= statement_timestamp() RETURNING …`.
   3. Sem linha reservada, ler a entrada por id, empresa e pessoa. Existe e não é `device`:
      `WRONG_ENTRY`. Existe e está viva: `waiting`, com o que falta de `poll_at`, ou 250 ms se está
      reservada. Não existe: procurar uma conta desta pessoa com `attempt_key = signInId`; achou,
      `linked` com ela; senão `SIGN_IN_EXPIRED`.
   4. Abrir o selo e chamar `flow.poll` sem transação aberta (D22). `waiting`:
      `poll_at = statement_timestamp() + retryMs`. `linked`: numa transação, apagar a entrada,
      `admitOpen`, `insertAccount` com `attemptKey: signInId`. Recusa: apagar a entrada.
      `UNAVAILABLE`: `poll_at = statement_timestamp()`.
5. `routes.ts` serve a rota, com o log `MODEL_ACCOUNT_SIGN_IN_LINKED` sem credencial (S34);
   `public.ts:61` ganha `openai_codex: codexSignIn()`.
6. A decisão com o próximo número livre na hora da U2 (hoje 0060; os cartões em rascunho da 24.4 e
   da 24.3.5 não criam decisão), "OpenAI subscription sign-in through the Codex client": emenda a
   0049 com o terceiro tipo de entrada; critério = o 2 da 0049 para este tipo; a consequência traz o risco
   aceito pelo "1. B" de 2026-11-05; estado "Proposed" até a U5. Uma linha em `docs/index.md`.

### Como se prova

Os critérios 3 a 10, 18, 20 e 21 em `openai/sign-in.test.ts`, pela porta pública (`post` de
`test-hub.ts`), com o `fetch` dublê de `platform/test-openai-codex.ts` para `auth.openai.com`, que
responde o JSON das formas acima com conteúdo inventado (S40), como `test-anthropic.ts:267-290` faz
para a Anthropic. Hoje todos falham: a rota e o tipo não existem. O 11 em `catalog.test.ts`,
`isolation-model-accounts.test.ts` e `npm run check-migrations`.

### Parar se

- A permissão de coluna não bastar: a política `company_all` é `FOR ALL` com `USING` e `WITH CHECK`
  (`migration.sql:83-85`), então cobre o `UPDATE`, e só falta `GRANT UPDATE (poll_at)` ao lado do
  `GRANT SELECT,INSERT,DELETE` de `database-grants.sql:272`.
- Um teste precisar de uma forma da OpenAI que não está nas linhas citadas.

## U3 O modelo e a fila

**Base e modelo.** A U2 em `main`. Sonnet.

### As linhas da tabela

Linhas 4, 6, 7, 8 e 10. Ler `claude/models.ts` (153 linhas, o modelo com `fetch` próprio),
`queue.ts:142-172`, `served.ts:15-20,182-186`, `errors.ts` e `scripts/record-provider.ts:1-40`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/model-accounts/openai/models.ts`, `openai/codex.test.ts` | Cria | `queue.ts` |
| `apps/server/src/builder/model-accounts/queue.ts` | Muda: o ramo `openai_codex` | — |
| `apps/server/src/builder/model-accounts/openai/sign-in.ts` | Muda: `codexRenewal: Renewal` | `queue.ts` |
| `apps/server/src/builder/model-accounts/public.ts` | Muda: exporta `codexModel`, como `subscriptionModel` (`public.ts:17`) | `scripts/record-provider.ts` |
| `apps/server/src/platform/test-openai-codex.ts` | Muda: o dublê de `chatgpt.com` e da renovação | os testes |
| `scripts/record-provider.ts` | Muda: `--provider openai-codex` | a U5 |
| `apps/server/package.json`, `package-lock.json` | Muda: `@ai-sdk/openai` 3.x, a linha que casa com `ai` 6.0.309 | — |
| `docs/reference/stack.md` | Muda: a linha `@ai-sdk/openai` | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/model-accounts/openai/models.ts
export function codexModel(name: string, tokens: { access: string; accountId: string }): LanguageModelV3
```

O ramo da fila: `row.kind === 'openai_codex'` chama `subscriptionAccess(…, codexRenewal, force)` e
`codexModel`, o mesmo modelo para `conversation` e `system`. `instructions` é uma frase fixa de
`models.ts`, e o prompt do Hub segue em `input`, como o Mastra Code faz.

### As skills e a leitura

As linhas `ai` e `@ai-sdk/anthropic` de `docs/reference/stack.md` (a nova linha `@ai-sdk/openai` entra
nesta unidade, lida em `node_modules/@ai-sdk/openai/docs/` da versão instalada), a skill `mastra`, e
T24 e T26 de testing.

### A ordem do trabalho

1. `npm install @ai-sdk/openai@<3.x que casa com ai 6.0.309> -w apps/server`, com versão exata como
   `@ai-sdk/anthropic`.
2. `openai/models.ts`: `createOpenAI({ apiKey: 'oauth-placeholder', fetch }).responses(name)`, com o
   middleware de `instructions` e `store: false` e o `bodylessMiddleware` de hoje
   (`claude/models.ts:80-86`).
3. `queue.ts`: o ramo.
4. `record-provider.ts`: o caso `openai-codex` (`thinking`, `abort`, `tool-error`, `unserved`, `off`),
   gravado com `provider: 'openai'` em arquivos `openai-codex-<caso>`, porque `recordings.test.ts:44`
   lê o provedor no começo do nome; com o token do ambiente (`CONEXUS_RECORD_CODEX_ACCESS`, `CONEXUS_RECORD_CODEX_ACCOUNT`), nunca num arquivo (S40).

### Como se prova

Os critérios 12 a 14 em `openai/codex.test.ts`: o dublê lê o pedido que sai e responde só com status
(401, 429 com `retry-after`, 400 `invalid_grant` na renovação), que o `APICallError` do AI SDK leva
a `callFailureOf` sem forma de corpo; o 15 em `model-served.test.ts`. Um turno que responde não tem
teste nesta unidade: pede uma gravação do stream (T24), e ela é da U5.

### Parar se

- O Codex recusar `max_output_tokens`, o raciocínio `none` (`thinking.ts:91-92`; o Mastra Code sobe o
  desligado para `low`, `providers/openai-codex.ts:57-61`) ou outro campo que o Hub manda: só a U5
  mostra; a correção volta ao cartão.
- `@ai-sdk/openai` 3.x pedir outro `ai`.

## U4 As telas

**Base e modelo.** A U2 em `main`. Sonnet.

### As linhas da tabela

Linha 12. Ler `sign-in-form.tsx` inteiro, `text.ts:16-20`, `account-kinds.tsx`, `queries.ts:47-48`
e `apps/web/src/builder/automations/queries.ts:31` (um `refetchInterval` de hoje).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/model-accounts/sign-in-form.tsx` | Muda: a vista `device` | `link-account.tsx` |
| `apps/web/src/builder/model-accounts/{text,queries}.ts` | Muda | — |
| `apps/web/src/builder/model-accounts/sign-in.test.tsx` | Cria | — |

### Os contratos que a unidade cria

O nome do tipo e o `CODE_FIELDS` dos tipos `paste` vêm da U2; aqui entra
`sendSignInPoll = hubMutation(pollModelAccountSignIn)`. A vista escolhe pela `entry` da
resposta. A espera é um `useMutation` disparado por `setTimeout` com `retryMs`, também depois de um
502, e **Cancelar** fica desligado enquanto ela está no ar, como a `DeviceCodeDialog` do Factory
(`ProviderOAuthDialog.tsx:112-141`); o botão da partida diz **Gerar código** quando o tipo é `device`.
Nenhum componente novo em `apps/web/src/ui/` (trilha de desenho).

### As skills e a leitura

As linhas `@tanstack/react-query` e `react-hook-form` de `docs/reference/stack.md`, o guia web e
`docs/reference/impeccable.md`.

### Como se prova

Os critérios 16 e 17 em `sign-in.test.tsx`, pelo `test-hub.tsx` de hoje; capturas a 1366 e 390 px,
nos dois temas, abertas ao lado do desenho de caixas acima (T23).

### Parar se

A vista pedir um componente de `ui/` que não existe.

## U5 A prova com o fundador

**Base e modelo.** A U3 e a U4 no ar. Sonnet, com o fundador.

### As linhas da tabela

Linhas 5, 6, 7 e 8: a prova da 0049 para o tipo, e o que o 404 e o `none` do Codex querem dizer.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/recordings/openai-codex-*.{sse,json}` | Cria | `openai/codex.test.ts` |
| `apps/server/src/platform/recordings.test.ts` | Muda: `EXPECTED` ganha os cinco casos | — |
| `apps/server/src/builder/model-accounts/openai/codex.test.ts` | Muda: "o turno responde" | — |
| a decisão nova | Muda: o resultado e o estado | — |

### As skills e a leitura

T24 e T26 de testing, `scripts/record-provider.ts` e `platform/test-recordings.ts`.

### A ordem do trabalho

1. No roteiro de uso, o fundador entra com a sua assinatura no Hub no ar.
2. `npm run record-provider -- --provider openai-codex --case thinking|abort|tool-error|unserved|off`, com o token
   no ambiente da máquina dele, e as gravações em `platform/recordings/` com o provedor, a API, a
   versão do SDK e a data.
3. O teste "o turno responde" em `openai/codex.test.ts`, com a gravação; a linha do resultado na
   decisão nova, e o estado "Accepted" com a palavra dele.

### Como se prova

Os critérios 19 e 22.

### Parar se

Uma recusa de termos, ou um 401/403 nos 20 turnos: o tipo fica desligado e volta ao fundador (0049,
critério 4).
