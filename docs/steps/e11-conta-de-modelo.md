# Etapa 11: Conta de modelo

## A página do fundador

**No fim desta etapa** você liga numa empresa várias contas de modelo (chave de API de qualquer
fornecedor do Mastra, a sua assinatura Claude, a sua conta Google pelo CLIProxy), as põe na ordem
que quiser, testa e pausa cada uma, e vê o estado de todas. A Conexus escolhe os tipos de cada
empresa.

**O roteiro de uso.** No Hub publicado.

1. Em **Clientes › Empresa A › Tipos de conta**, ligue "Assinatura Claude" e "Google". Na Empresa
   B só aparece "Chave de API".
2. Na A, **Configuração › Conta de modelo › Ligar conta**: Anthropic, Claude Haiku 4.5, "Time 1",
   a sua chave: "Funciona", e "Time 1 · chave …x7Qa · pronta". Uma chave errada: "A Anthropic
   recusou esta chave.", nada guardado.
3. **Assinatura Claude**: cola o código da Anthropic, "Time 2 · pronta". **Google**: entra com a
   sua conta, "Time 3 · pronta".
4. Suba a Time 3 ao topo, pause a Time 1, teste a Time 2: "Funciona".
5. Como membro comum: a fila sem botões; em **Minha conta de modelo**, uma chave só sua.
6. Remova a Time 1: "Apague também a chave no Console da Anthropic".

**O que você faz, e quando.** Antes de U1: autoriza as chamadas da prova e entra nela com a sua
assinatura Claude, a sua conta Google e uma chave da Anthropic com crédito. Antes de U2: gera a
chave da instalação e guarda cópia fora do servidor (S33). Antes de U3: a palavra da permissão
(D11). No fim: o roteiro e os textos. Gasto: centavos.

**As suas respostas, como o cartão as lê; confirme ou corrija.** 1 B: fica a assinatura da 0030,
mais a chave de API; o risco de suspensão da conta pessoal de quem liga continua seu. 2: todo
fornecedor do roteador que funciona só com chave (210 de 216), num formulário. 3 e 6: sem limite,
uma fila por dono na ordem que vocês põem; na 12, a conversa passa à próxima quando uma acaba. 7:
fila da pessoa, depois a da empresa. 8: chave, assinatura Claude e Google na 11; ChatGPT na 21. 9:
só a Conexus liga tipos; chave sempre ligada. 10: sem endereço próprio. 4 e 5 como no estudo.

**Em aberto: a forma da fila (3, 6, 7), até o terceiro estudo.** Já dito: P1 A, a conta dada sai
da fila da empresa; P2 A, a da pessoa, depois as dadas a ela, depois a da empresa; P3 A, uma conta
pode ir a várias pessoas. Falta: escolher Claude ou GPT à parte de quem paga, e o alcance
(empresa, grupo, pessoa). Tabelas e telas da fila esperam.

**Decisão sua: a permissão (D11).** Exemplo: um defeito manda a credencial lacrada para a tela.
**A.** O papel da empresa grava a coluna mas não a lê; uma função do banco a entrega, uma conta
por vez, como o Grant A da 8; o banco recusa. **B.** Lê a linha inteira; só a revisão impede.
**Recomendação: A** (D12).

**O que só a prova diz** (U1): se a assinatura Claude entra hoje, quanto dura o token e se renova;
se o Google entra pelo CLIProxy; se um fornecedor recusa no meio. Falhou: o tipo fica desligado e
volta a você.

**Fica de fora.** A troca automática na conversa, a pausa por limite e o aviso de troca: da 12, a
primeira com conversa. ChatGPT (21). As issues `next-card` 25, 39 e 45: nada nestas pastas.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0048 e prova | `docs/` | testes | mastra | — |
| U2 | Lacre e chave da instalação | `platform/`, `infra/`, how-to | segurança | node | U1 |
| U3 | Tabelas e permissões, PR próprio (D11) | `builder/model-accounts/tables.ts`, migrações, grants | dados | neon:neon-postgres | U2 |
| U4 | Fornecedores e teste por chave | `builder/model-accounts/check/` | código | mastra | U1 |
| U5 | Fila, tipos e rotas | `builder/model-accounts/`, `hub-api`, `hub/identity/admission.ts`, `main.ts` | segurança | fastify-best-practices | U2, U3, U4 |
| U6 | Assinatura Claude | `builder/model-accounts/claude/` | segurança | mastra | U5 |
| U7 | Google pelo CLIProxy | `builder/model-accounts/google/`, `infra/` | segurança | node | U5 |
| U8 | Telas | `apps/web/src/builder/model-accounts/`, rotas | design, web | shadcn | U5 |
| U9 | Percurso | `tests/e2e/` | testes | — | U6, U7, U8 |

U2 e U4 correm em paralelo; U6, U7 e U8 também. Uma revisão, um merge (L9, L13); U3 em PR próprio
(D11).

**Orçamento de código alterado** (sem testes nem gerados): U2 180; U3 150; U4 250; U5 850; U6 350;
U7 550; U8 900; U9 30. Total **3.260**, teto 4.000 (L2). Os estudos davam 1.500 a 1.900 com testes, sem
Google nem telas medidas. Base aqui: Projetos (um dono, criar e apagar) tem 782 linhas no servidor,
354 nas telas e 117 no contrato; a fila tem três donos, ordem, pausa, tipos e duas entradas. Google:
550 contra 663 do antigo (`google-ai-pro/`, `e0353c36`), sem o roteador local de 72.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0048 "proposed" antes da prova; Result com versões, os fornecedores só com chave e os 6 de fora; nenhuma credencial | o registro | must |
| 2 | U1 | Prova ao vivo, assinatura Claude: entrar pelo fluxo do `@mastra/code-sdk` 1.14.0, chamada de 1 token, `expires_in` anotado, uma renovação aceita, 20 turnos sem 401/403 | o registro | must |
| 3 | U1 | Prova ao vivo, Google: CLIProxyAPI v8.0.33 por sha256, entrar pelo Antigravity, chamada de 1 token em `127.0.0.1`; o arquivo de login renovado volta ao processo | o registro | must |
| 4 | U1 | Detecção: cada resposta da prova anotada com status e código; uma recusa por termos volta ao fundador | o registro | must |
| 5 | U2 | Sem `HUB_SEAL_KEYS_FILE`, vazio, legível por outros ou com chave fora de 32 bytes: não inicia, `CONFIG_INVALID` com o nome da variável | `config.test.ts` | must |
| 6 | U2 | Lacre em outra linha, dono, tipo ou fornecedor, ou um bit virado: recusado; chave aposentada abre; depois do `reseal` a antiga sai sem perda | `seal.test.ts` | must |
| 7 | U3 | A Empresa B não lê nem grava conta da A; o papel da empresa recebe 42501 ao ler `sealed` (A); o retrato bate | `isolation-model-accounts.test.ts`, `catalog.test.ts` | must |
| 8 | U3 | Tirar a pessoa da empresa apaga as contas dela ali e solta as que lhe foram dadas; apagar a empresa apaga todas | `model-accounts-removal.test.ts` | must |
| 9 | U4 | Cada fornecedor da lista, `fetch` dublê: a chave no cabeçalho do registro, a recusa com status; chave vazia recusada antes da rede; nenhum `*_API_KEY` ou `*_BASE_URL` lido | `check.test.ts` | must |
| 10 | U4 | Mapa: 200 `works`; 401 `refused`; 403 `no_access`; 402 e 400 de crédito `no_credit`; 429 `limited`; 5xx, corte, prazo de 15 s `unavailable`; sem repetição | idem | must |
| 11 | U4 | Chave plantada não aparece no log, na resposta nem na falha | idem | must |
| 12 | U5 | Ligar por chave: só `works` grava, no fim da fila; `refused` responde 422 `MODEL_ACCOUNT_REFUSED` e a fila fica igual; a chave nunca volta, só `…` e quatro caracteres | `model-accounts.test.ts` | must |
| 13 | U5 | Mesmo `Idempotency-Key`: uma conta; outro corpo: `IDEMPOTENCY_CONFLICT` | idem | must |
| 14 | U5 | Membro comum: lê a fila da empresa; mudar nela dá 404 (S10); muda só a sua; B não vê a fila pessoal de A | idem | must |
| 15 | U5 | Ordenar com a lista inteira dos ids: grava; lista velha ou faltando um: 409 `MODEL_ACCOUNT_ORDER_STALE`; duas ordens juntas: uma vence, posições sem buraco | `model-accounts-order.test.ts` | must |
| 16 | U5 | Pausar e retomar à mão; testar de novo abre o lacre e grava estado e hora; `refused` vira "Ligue de novo"; mudar com revisão velha: 412 | `model-accounts.test.ts` | must |
| 17 | U5 | Tipo desligado: ligar dá 422 `MODEL_ACCOUNT_KIND_OFF`; as contas dele, "desligada pela Conexus", não testam; religar as devolve | `model-account-kinds.test.ts` | must |
| 18 | U5 | Só o operador muda os tipos; dono de empresa: 404; chave de API fica | idem | must |
| 19 | U5 | Dar a conta (aberto): só dono e administrador dão, tiram e trocam; a quem não é membro: 404 | `model-accounts-assign.test.ts` | must |
| 20 | U6 | `start` dá o endereço da Anthropic e guarda o verificador lacrado 10 min; `complete` troca o código, testa e grava; repetido ou tarde: 410 `MODEL_ACCOUNT_SIGN_IN_EXPIRED` | `claude.test.ts`, Anthropic dublê | must |
| 21 | U6 | Duas renovações juntas chamam a Anthropic uma vez (S34); renovação recusada grava `refused` | idem | must |
| 22 | U6 | A chamada leva o cabeçalho e a frase do `claudeCodeMiddleware` e o token da conta; duas contas em paralelo não se trocam | idem | must |
| 23 | U7 | Um processo por conta, em `127.0.0.1`; binário diferente: não inicia; ocioso, para; o arquivo renovado é relacrado e a pasta apagada | `google.test.ts`, CLIProxy dublê | must |
| 24 | U7 | Entrar pelo endereço de gestão; `state` diferente ou atrasado: 410; o roteador chega ao processo por `url` e chave do processo | idem | must |
| 25 | U8 | As telas da matriz de estados, com textos, teclado para ordenar e foco | `model-accounts.test.tsx` | must |
| 26 | U8 | 390 px, 200%, dois temas, sem erro de CSP | navegador (T23) | should |
| 27 | U9 | O roteiro, Hub real, dublês | `tests/e2e/model-accounts.test.ts` | must |
| 28 | U9 | Publicado: passos 1 a 6, contas reais | firstmate, fundador (T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Conta de modelo da empresa | "Nenhuma conta ligada" e **Ligar conta** (dono e administrador) | a lista partilhada | a de `ui/` | a da empresa | por conta: "recusada · Ligue de novo", "pausada", "desligada pela Conexus" |
| Minha conta de modelo | "Nenhuma conta sua", e as dadas a você | idem | idem | idem | idem |
| Ligar conta | fornecedor com busca | "Testando…" | a mensagem do mapa (crit. 10) | modelo fora do registro: 422 | tipo desligado: 422 |
| Entrar com assinatura | o endereço e o campo do código | "Entrando…" | idem | — | "O código venceu. Entre de novo." |
| Tipos de conta (operador) | só "Chave de API" | idem | idem | a do cliente | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `id`, `owner`, `kind`, `provider`, `model`, `label`; `position` | ligar; ordenar | telas; a 12 |
| `state` (`ready`, `paused`, `refused`), `testedAt` | ligar, testar, pausar, renovar | telas; a 12 |
| `hint`, `linkedBy`, `linkedAt` | ligar | telas |
| `assignedTo` (aberto) | dar, tirar | telas; a 12 |
| `revision` | ligar, mudar | mudar (412) |
| `kindOff` (derivado dos tipos) | operador | telas, rotas |
| `signInId`, `url`, `expiresAt` | `start` | tela de entrar |

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Ligar por chave: teste, depois `INSERT` | `Idempotency-Key` | teste fora da transação (D22) | fornecedor: o mapa | `MODEL_ACCOUNT_CHECKED`, resultado e status | 10, 12, 13 |
| `start` da assinatura | duas linhas | — | — | `MODEL_ACCOUNT_SIGN_IN_STARTED` | 20 |
| `complete` | `DELETE … RETURNING` consome uma vez (S22) | código trocado e teste falho: nada grava, "Entre de novo" | Anthropic ou CLIProxy: 502 `MODEL_ACCOUNT_UNAVAILABLE` | o resultado | 20, 24 |
| Testar de novo | duas: a última grava | o estado só muda com a resposta | o mapa | idem | 16 |
| Mudar, pausar, dar | revisão (412) | uma instrução | banco: 503 da 2 | `MODEL_ACCOUNT_CHANGED` | 16, 19 |
| Ordenar | linhas travadas na ordem; restrição adiável | transação inteira | idem | `MODEL_ACCOUNTS_ORDERED` | 15 |
| Remover | o segundo responde 204 | uma instrução | idem | `MODEL_ACCOUNT_REMOVED` | 6, 12 |
| Tipos do operador | estado final enviado | uma transação | idem | `ACCOUNT_KINDS_SET` | 17, 18 |
| Renovar token Claude | reserva na linha (S34) | reserva vence em 30 s | Anthropic: `refused` ou `unavailable` | `MODEL_ACCOUNT_REFRESHED` | 21 |
| Processo CLIProxy | um por conta | morre com o programa; a partida limpa | Google: o mapa | `CLIPROXY_STARTED`, `CLIPROXY_STOPPED` | 23 |
| `reseal` | idempotente por `key_id` | linha a linha | banco | quantas linhas | 6 |
| Tirar pessoa, apagar empresa | as da 5 e da 6 | a chave estrangeira | — | os da 5 e da 6 | 8 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Lacre | nova | `platform/seal.ts` | — | `keyId`, chaves que só abrem (S32), propósito |
| Fila, tipos, rotas | nova | `builder/model-accounts/` | — | "nunca devolver a chave" (`routes.ts:55`, `e0353c36`), por propósito |
| Teste por chave | nova | `check/` | — | Dify, teste antes de guardar (`provider_configuration.py:388`, `8857292a`) |
| Assinatura Claude | nova, sobre o `@mastra/code-sdk` | `claude/` | — | "colar o código", que é o fluxo do Mastra |
| Google pelo CLIProxy | nova, o antigo como especificação | `google/` | — | processo por conta, `127.0.0.1`, sha256, morre com o pai (`pool.ts:57-80,188`), por propósito |

**A medida do transplante.** Nada é copiado. O lacre antigo (146 linhas) mudaria mais de um terço
(estudo 1). `pool.ts` e `login.ts` (505 linhas) mudam a chave da instância, o lacre do arquivo e a
volta do renovado: especificação.

**A dívida.** Nenhuma. No fechamento (L20), S34 cita a 0048.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0048-…`, `index.md` | cria | U4 a U7 |
| `0030` | estado: substituída pela 0048 | — |
| `architecture.md` §8, §11 | contas em fila, tipos por empresa; o risco aponta a 0048 | `check-docs` |

### Os contratos que a unidade cria

O registro 0048: tipos, fila, pessoa antes da empresa, tipos por operador, chave da instalação.
Criterion: (1) o dublê do estudo 2, refeito sobre `@mastra/core` 1.78.0: os fornecedores só com
chave e o campo que separa os 6; (2) a assinatura Claude pelo fluxo do `@mastra/code-sdk`
(`mastracode/sdk/src/auth/providers/anthropic.ts:39,61,130`, fork `ce7e9c30`), como no crit. 2; (3)
CLIProxyAPI v8.0.33 (`2422c6b0`) por `/antigravity-auth-url`, como no crit. 3; (4) o roteador com
`url` e chave do processo (`router.ts:333-334`) chega ao CLIProxy. Falha em (2) ou (3): o tipo não
entra e volta ao fundador.

### A ordem do trabalho

PR só de documentos (L13); credenciais da prova apagadas. Regras: L21, T14, S40.

### Como se prova

1–4: o registro.

## U2 Lacre e chave da instalação

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/seal.ts` | cria | U5–U7 |
| `platform/config.ts` | `HUB_SEAL_KEYS_FILE` | `main.ts` e os leitores de `config` |
| `main.ts` | subcomando `reseal` | `infra/deploy.sh` |
| `infra/compose.yaml`, `setup-server.sh`, `docs/how-to/hub-server.md` | o arquivo, 0600; a troca | publicar |

### Os contratos que a unidade cria

`type SealKeys`; `seal(keys, context: SealContext, plain: Secret): Sealed`; `open(keys, context,
sealed): Secret`; `Sealed = {keyId: string; blob: Uint8Array}`; `SealContext = {purpose:
'model-account'; rowId; companyId; personId: string | null; kind; provider}`. Arquivo: linhas
`id:base64`, a última lacra. Falha: `SEAL_REFUSED` (`SYSTEM`).

### A ordem do trabalho

1. Ler o arquivo no `config`. Regras: S31, S33, C67. Funções: `readSecretFile`.
2. Lacrar e abrir. Regras: S32, S41, C27. Funções: `node:crypto` `createCipheriv('aes-256-gcm')`,
   IV de 12 bytes de `randomBytes`, `setAAD`, etiqueta de 16 bytes.
3. `reseal`: relacra o que está em chave antiga; ensaio de três fases no teste (S32).

### Como se prova

5, 6: `npm run test -w @conexus/server`.

## U3 Tabelas e permissões

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/model-accounts/tables.ts` | cria o schema `builder` | U5–U7 |
| `apps/server/migrations/` | duas migrações: tabelas; permissões | `migrate` |
| `apps/server/database-grants.sql` | o retrato | `catalog.test.ts` |

### Os contratos que a unidade cria

`builder.model_account`: `id` uuid; `company_id`, `person_id` nulo, para `auth.member`, `ON DELETE CASCADE`; `kind` em (`api_key`, `claude_subscription`,
`google_cliproxy`); `provider`, `model`, `label` texto; `position` inteiro; `state` em (`ready`,
`paused`, `refused`); `sealed` bytea; `key_id`; `hint` nulo; a quem é dada: aberto (P3,
várias pessoas; terceiro estudo); `refresh_reserved_until` nulo;
`linked_by`, `linked_at`, `tested_at`, `revision`. Única `NULLS NOT DISTINCT (company_id, person_id,
position)` adiável (não provada: crit. 15). `builder.company_account_kind (company_id,
kind)`. `builder.model_account_sign_in`: `id`, `company_id`,
`person_id`, `owner`, `kind`, `label`, `model`, `sealed`, `key_id`, `expires_at`. Política de linha
(0039). Com A: `hub_company` sem `SELECT` em `sealed`; `SECURITY DEFINER`
`builder.sealed_of(account uuid)` presa à empresa da transação.

### A ordem do trabalho

Regras: D1, D4, D6, D10, D11, D12, D15, D17, 0038, 0039. Funções: `drizzle-orm` 1.0.0-rc.4
`pgSchema`, `pgTable`, `unique().nullsNotDistinct()`.

### Como se prova

7, 8: `npm run test -w @conexus/server`.

## U4 Fornecedores e teste por chave

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/check/` | a porta e o adaptador | U5–U7 |
| `apps/server/package.json`, `package-lock.json` | `@mastra/core` 1.78.0 fixo (0027) | — |
| `infra/compose.yaml` | `MASTRA_OFFLINE=1` | — |

### Os contratos que a unidade cria

`type ModelCheck = (input: {model: LanguageModel; signal: AbortSignal}) => Promise<CheckResult>`;
`CheckResult = {result: 'works' | 'refused' | 'no_access' | 'no_credit' | 'limited' |
'unavailable'; status?: number}`. `listKeyProviders(): Provider[]`, `Provider = {id; name;
models: string[]}`, do `PROVIDER_REGISTRY` menos os 6 do Result.

### A ordem do trabalho

1. A lista. Regras: C26, C75. Funções: `@mastra/core/llm` `PROVIDER_REGISTRY`, `parseModelString`.
2. O teste. Regras: C49, C52, C56, C57, C59, S36, S41. Funções: `ModelRouterLanguageModel({id,
   apiKey})` (`router.ts:111,137`), `doGenerate({prompt, maxOutputTokens: 1, maxRetries: 0,
   abortSignal})`; reconhecer pelo `statusCode`, nunca pelo `instanceof`; `TypeError` sem status é
   `unavailable`.

### Como se prova

9–11: `npm run test -w @conexus/server`, `fetch` dublê.

## U5 Fila, tipos e rotas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/` | `store.ts`, `routes.ts`, `kinds.ts`, `public.ts` | `main.ts` |
| `packages/hub-api/src/model-accounts.ts`, `failures.ts`, `index.ts` | as operações e falhas | web, OpenAPI |
| `hub/identity/admission.ts`, `auth.ts` | ações e a permissão `MANAGE_MODEL_ACCOUNTS` (dono, administrador) | Builder |
| `apps/server/src/main.ts` | liga o Builder | — |

### Os contratos que a unidade cria

Ações: `readModelAccounts`, `manageModelAccounts`, `manageOwnModelAccounts` (`MEMBER`);
`setAccountKinds` (`OPERATOR`). Operações, todas `session`, sob `/api/companies/{companyId}`:

| Operação | Método e caminho | Saída e falhas |
| --- | --- | --- |
| `listModelAccounts` | `GET /model-accounts` | `{company, mine, kinds}` |
| `listModelProviders` | `GET /api/model-providers` | `Provider[]` |
| `connectModelAccount` | `POST /model-accounts`, `Idempotency-Key`; `{owner, provider, model, label, key}` | 201; 422 do mapa, `MODEL_ACCOUNT_KIND_OFF`, `MODEL_UNKNOWN` |
| `startModelAccountSignIn` | `POST /model-account-sign-ins`; `{owner, kind, model, label}` | 201 `{signInId, url, expiresAt}` |
| `completeModelAccountSignIn` | `POST /model-account-sign-ins/{signInId}`; `{code}` | 201; 410; 422 do mapa |
| `testModelAccount` | `POST /model-accounts/{accountId}/tests` | `CheckResult` |
| `changeModelAccount` | `PATCH /model-accounts/{accountId}`, `If-Match`; `{label?, model?, state?: 'ready' \| 'paused', assignedTo?}` | 200; 412 |
| `orderModelAccounts` | `PUT /model-account-orders/{owner}`; `{ids}` | 200; 409 |
| `removeModelAccount` | `DELETE /model-accounts/{accountId}` | 204 |
| `setAccountKinds` | `PUT /api/operations/clients/{companyId}/account-kinds`; `{kinds}` | 200 |

Porta das entradas, uma por tipo (U6, U7): `type SignInKind = {start(): Promise<{url; pending:
Secret}>; complete(pending, code): Promise<Secret>; model(credential): LanguageModel}`.

### A ordem do trabalho

1. Contrato e falhas. Regras: C28, C29, C33, C35, C37, C38, C48, C51, S24, S48.
2. Admissão e loja. Regras: S6–S11, C8, C65, D20, D22; o teste fora da transação.
3. Rotas e `main.ts`. Regras: C4, C13, C14.

### Como se prova

12–19: `npm run test -w @conexus/server`, `fetch` dublê; T10 com membro, outra empresa e operador.

## U6 Assinatura Claude

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/claude/` | `SignInKind` e o `CredentialStore` | U5 |
| `apps/server/package.json`, `package-lock.json` | `@mastra/code-sdk` 1.14.0, `@ai-sdk/anthropic` dele | — |

### Os contratos que a unidade cria

Um `CredentialStore` por conta (`auth/types.ts:139-152`): `getApiKey` abre o lacre e renova com a
reserva (S34); nunca o global `getAuthStorage`.

### A ordem do trabalho

1. Entrar. Funções: `startAnthropicLogin`, `completeAnthropicLogin` (`anthropic.ts:39,61`). Regras:
   C63, S22.
2. Chamar. Funções: `createAnthropic({fetch: buildAnthropicOAuthFetch({authStorage})})`
   (`claude-max.ts:246`) com `claudeCodeMiddleware` (`:56`); não `opencodeClaudeMaxProvider`, que
   troca por chave de API com `NODE_ENV=test` (`:296-305`). Regras: S34, S36, S41, C57.

### Como se prova

20–22: `npm run test -w @conexus/server`, Anthropic dublê.

## U7 Google pelo CLIProxy

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/google/` | `SignInKind`, o conjunto de processos | U5, `main.ts` (parar) |
| `infra/hub.Dockerfile`, `compose.yaml` | binário v8.0.33 por sha256; pasta em `tmpfs` | publicar |
| `platform/config.ts` | caminho e sha256 do binário | — |

### Os contratos que a unidade cria

`CliproxyPool = {acquire(accountId): Promise<Lease>; startLogin(): Promise<LoginInstance>;
sweepIdle(signal); close()}`; `Lease = {url; proxyKey: Secret; release()}`. Falhas
`CLIPROXY_BINARY_REFUSED`, `CLIPROXY_UNAVAILABLE` (`SYSTEM`).

### A ordem do trabalho

1. Processo: `server.host` `127.0.0.1`, `access.api-keys` aleatória, `--local-model`,
   `management.secret-key` só no login (`config.example.yaml:25-27,86-89,104-111`, `2422c6b0`);
   `setpriv --pdeathsig`. Regras: C57, C62, S36, S37.
2. Entrar: `/antigravity-auth-url`, `/get-auth-status`, `/oauth-callback`. Regras: S22, S41.
3. Volta do arquivo renovado: relacrar ao parar. Regras: S32.

### Como se prova

23, 24: `npm run test -w @conexus/server`, CLIProxy dublê.

## U8 Telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/model-accounts/` | fila, formulário, entrar, tipos | rotas |
| `routes/_app/companies/$companyId/setup.tsx`, `model-account.tsx`; `operations/clients/$companyId.tsx` | as seções | `routeTree.gen.ts` |

### A ordem do trabalho

Regras: W1, W4, W6, W8, W9, W12, W17, W23, W24; V29–V31, V35, V39, V55. Ordenar por "Subir" e
"Descer" (V30).

### Como se prova

25: `npm run test -w @conexus/web`; 26: o navegador.

## U9 Percurso

### Como se prova

27: `npm run e2e`; 28: após o Release, pelo firstmate e pelo fundador (T13, T14).
