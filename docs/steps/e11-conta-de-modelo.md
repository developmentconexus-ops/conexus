# Etapa 11: Conta de modelo

## A página do fundador

**No fim desta etapa** você liga numa empresa várias contas de modelo (chave de API de qualquer
fornecedor do Mastra, a sua assinatura Claude, a sua conta Google pelo CLIProxy), uma fila por
fornecedor na ordem que quiser, pausa, dá contas a pessoas e escolhe o modelo padrão. A Conexus
escolhe os tipos de cada empresa.

**O roteiro de uso.** No Hub publicado.

1. Em **Clientes › Empresa A › Tipos de conta**, ligue "Assinatura Claude" e "Google". Na Empresa
   B só aparece "Chave de API".
2. Na A, **Configurar a empresa › Conta de modelo › Ligar conta**: Anthropic, "Time 1", a sua
   chave: "Time 1 · chave …x7Qa · ligada".
3. **Assinatura Claude**: cola o código da Anthropic, "Time 2". **Google**: entra, "Google 1".
4. Na fila Anthropic, suba a Time 2; pause a Time 1; escolha Claude Sonnet como modelo padrão.
5. Dê a Time 2 à Ana: "reservada para Ana". Como Ana, em **Minha conta de modelo**: "Sua ordem
   para Anthropic: Time 2, Time 1", e uma chave só sua.
6. Remova a Time 1: "Apague também a chave no Console da Anthropic".

**O que você faz, e quando.** Autoriza as chamadas da prova (U1) e do roteiro, com a sua chave
Anthropic, assinatura Claude e conta Google. Antes de U2: a chave da instalação, com cópia fora do
servidor (S33). Antes de U3: a palavra da permissão. No fim: o roteiro e os textos.

**As suas respostas, como o cartão as lê; confirme ou corrija.** 1 B: assinatura e chave; a
suspensão, na Anthropic e no Google ("suspension or termination"), cai em quem liga. 2: todo
fornecedor só com chave. 3, 6, 11: sem limite; uma fila por fornecedor em cada dono. 7, P1–P3:
pessoa, depois as dadas a ela, depois a empresa; a dada sai da fila geral, pode ir a várias pessoas
e guarda a posição da empresa. 12: a conta não guarda modelo; dono e administrador definem o
padrão. 14: sem grupos. 8: ChatGPT na 21. 9: os tipos da empresa valem também para as contas
pessoais nela. 4: dono e administrador não veem contas pessoais.

**Sem teste ao ligar (5, agora C).** Nas suas palavras: "Se eu conectar com uma conta errada, já não
vai dar certo. Isso já é intrínseco." Ligar só lacra e guarda; a assinatura se prova na troca do
código. Na 12, a primeira chamada recusada (401, 403) marca a conta "recusada, ligue de novo" e
passa à próxima.

**13.** Acabadas as contas do fornecedor, o Builder para e avisa. A troca automática seria ajuste
da empresa, desligado, com uma cadeia: da 12, pendente da sua confirmação.

**Decididas (2026-10-19).** Sai a última pessoa de uma conta dada: ela volta "para todos". Tipo
desligado: as contas param e voltam ao religar. O padrão é qualquer modelo do registro.

**Decisão sua: a permissão (regra D11).** Exemplo: um defeito manda a credencial lacrada para a
tela. **A.** O papel da empresa grava a coluna mas não a lê; uma função a entrega, uma conta por
vez (Grant A da 8): o banco recusa. **B.** Lê a linha inteira. **Recomendação: A** (D12).

**Só a prova diz** (U1) se a assinatura Claude entra hoje, quanto dura o token e se renova; se o
Google entra pelo CLIProxy; se um fornecedor recusa. Falhou: o tipo fica desligado e volta a você.

**Fica de fora, para a 12.** Toda chamada ao modelo: escolher o modelo, a recusa na primeira
chamada, a troca de conta, a pausa por limite, a renovação do token. ChatGPT (21). As issues
`next-card` 25, 39 e 45: nada nestas pastas.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0048 e prova | `docs/` | testes | mastra | — |
| U2 | Lacre e chave da instalação | `platform/`, `infra/`, how-to | segurança | node | U1 |
| U3 | Tabelas e permissões, PR próprio (D11) | `builder/model-accounts/tables.ts`, migrações, grants | dados | neon:neon-postgres | U2 |
| U4 | Lista de fornecedores | `builder/model-accounts/providers.ts` | código | mastra | U1 |
| U5 | Fila, tipos e rotas | `builder/model-accounts/`, `hub-api`, `hub/identity/`, `main.ts` | segurança | fastify-best-practices | U2–U4 |
| U6 | Entrada por assinatura e Claude | `builder/model-accounts/claude/`, `sign-ins.ts` | segurança | mastra | U5 |
| U7 | Google pelo CLIProxy | `builder/model-accounts/google/`, `infra/` | segurança | node | U6 |
| U8 | Telas | `apps/web/src/builder/model-accounts/`, rotas | design, web | shadcn | U5 |
| U9 | Percurso | `tests/e2e/`, `package.json` | testes | — | U7, U8 |

U2 e U4 correm em paralelo; U6 e U8 também. Uma revisão, um merge (L9, L13); U3 em PR próprio.

**Orçamento de código alterado** (sem testes nem gerados): U2 180; U3 150; U4 80; U5 780; U6 250;
U7 350; U8 900; U9 30. Total **2.720**, teto 4.000 (L2). Estudos: 1.500 a 1.900 com testes, sem
Google nem telas. Base: Projetos, um dono, tem 782 linhas no servidor, 354 nas telas, 117 no
contrato. Sem chamada ao modelo, o Google é só o login: 350 contra 663 do antigo (`google-ai-pro/`,
`e0353c36`).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0048 "proposed" antes da prova; Result, na versão instalada: os fornecedores só com chave, derivados do registro (sem modelo de URL `${VAR}`, um só `apiKeyEnvVar`), e os de fora; nenhuma credencial | o registro | must |
| 2 | U1 | Ao vivo, Claude: entrar pelo `@mastra/code-sdk` fixado, 1 token, o `expires_in` cru, uma renovação, 20 turnos sem 401/403 | o registro | must |
| 3 | U1 | Ao vivo, Google: CLIProxyAPI v8.0.33 por sha256, Antigravity, 1 token em `127.0.0.1` pelo roteador `google` com `url` e chave do processo; o login renovado volta | o registro | must |
| 4 | U1 | Cada resposta da prova anotada; uma recusa por termos volta ao fundador | o registro | must |
| 5 | U2 | `HUB_SEAL_KEYS_FILE` ausente, vazio, legível por outros, chave fora de 32 bytes: não inicia, `CONFIG_INVALID` | `config.test.ts` | must |
| 6 | U2 | Lacre em outra linha, dono, tipo ou fornecedor, ou bit virado: recusado; chave aposentada abre; após `reseal` a antiga sai sem perda | `seal.test.ts` | must |
| 7 | U3 | A Empresa B não lê nem grava conta da A; o papel da empresa recebe 42501 em `sealed` (A); o retrato bate | `isolation-model-accounts.test.ts`, `catalog.test.ts` | must |
| 8 | U3 | Tirar a pessoa apaga as contas dela e as atribuições a ela (a conta volta "para todos"); apagar a empresa apaga tudo | `model-accounts-removal.test.ts` | must |
| 9 | U4 | `listModelProviders` dá só os do crit. 1; com `fetch` dublê, importar e listar fazem zero chamadas | `providers.test.ts` | must |
| 10 | U5 | Ligar por chave lacra e grava no fim da fila do fornecedor, sem chamada; chave vazia ou fornecedor fora da lista: 422 `MODEL_ACCOUNT_INVALID`; a chave nunca volta, só `…` e quatro caracteres | `model-accounts.test.ts` | must |
| 11 | U5 | Chave plantada fora do log, da resposta e da falha | idem | must |
| 12 | U5 | Mesmo `Idempotency-Key`: uma conta; outro corpo: `IDEMPOTENCY_CONFLICT` | idem | must |
| 13 | U5 | Membro lê a fila da empresa; mudá-la: 404 (S10); ninguém vê conta pessoal alheia | idem | must |
| 14 | U5 | Ordenar uma fila com todos os seus ids: grava; velha, incompleta ou de outro fornecedor: 409 `MODEL_ACCOUNT_ORDER_STALE`; duas juntas: uma vence | `model-accounts-order.test.ts` | must |
| 15 | U5 | Pausar e retomar; revisão velha: 412 | `model-accounts.test.ts` | must |
| 16 | U5 | Só o operador muda os tipos; dono: 404; chave de API sempre ligada; tipo desligado: as contas dele "desligada pela Conexus", e voltam ao religar | `model-account-kinds.test.ts` | must |
| 17 | U5 | Dar uma conta da empresa a uma ou várias pessoas: sai da fila geral; a ordem de cada uma é própria, dadas na posição da empresa, empresa; só dono e administrador; não membro: 404; conta pessoal: 422 | `model-accounts-assign.test.ts` | must |
| 18 | U5 | Modelo padrão: dono e administrador, do registro; membro: 404; fora: 422 `MODEL_UNKNOWN` | `model-accounts.test.ts` | must |
| 19 | U6 | Tipo desligado na empresa: `startModelAccountSignIn` e `complete` dão 422 `MODEL_ACCOUNT_KIND_OFF`, na fila da empresa e na pessoal | `sign-ins.test.ts` | must |
| 20 | U6 | `start` dá o endereço e guarda o verificador lacrado 10 min; `complete` troca o código e grava; troca recusada: 422 `MODEL_ACCOUNT_REFUSED`, nada gravado; repetido ou tarde: 410 `MODEL_ACCOUNT_SIGN_IN_EXPIRED` | `claude.test.ts`, Anthropic dublê | must |
| 21 | U7 | O login num processo em `127.0.0.1`; binário diferente: não inicia; o processo para depois do login, o arquivo é lacrado e a pasta apagada | `google.test.ts`, CLIProxy dublê | must |
| 22 | U7 | Entrar pela gestão; `state` errado ou tarde: 410; a conta é `google`, na fila Google | idem | must |
| 23 | U8 | As telas da matriz, textos, teclado e foco | `model-accounts.test.tsx` | must |
| 24 | U8 | 390 px, 200%, dois temas, sem erro de CSP | navegador (T23) | should |
| 25 | U9 | O roteiro, Hub real, dublês | `tests/e2e/model-accounts.test.ts` | must |
| 26 | U9 | Publicado: passos 1 a 6 | firstmate, fundador (T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Conta de modelo, em Configurar a empresa | "Nenhuma conta ligada", **Ligar conta**; cada conta "para todos" ou "reservada para Ana, Diego" | a partilhada | a de `ui/` | a da empresa | "recusada · Ligue de novo" (a 12 grava), "pausada", "desligada pela Conexus" |
| Minha conta de modelo (trilho) | "Nenhuma conta sua"; a sua ordem por fornecedor | idem | idem | idem | idem |
| Ligar conta | fornecedor com busca | "Ligando…" | a de `ui/` | fora da lista: 422 | tipo desligado: 422 |
| Entrar com assinatura | endereço e campo do código | "Entrando…" | troca recusada: 422 | — | "O código venceu. Entre de novo." |
| Tipos de conta (operador) | só "Chave de API" | idem | idem | a do cliente | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `id`, `owner` (`company` ou `me`), `kind`, `provider`, `label`; `position` | ligar; ordenar | telas; a 12 |
| `state` (`ready`, `paused`, `refused`) | ligar, pausar; `refused` a 12 | telas; a 12 |
| `hint`, `linkedBy`, `linkedAt` | ligar | telas |
| `assignees` | dar | telas, a ordem da pessoa; a 12 |
| `defaultModel` | dono, administrador | tela; a 12 |
| `revision` | ligar, mudar | mudar (412) |
| `kindOff` (derivado) | operador | telas, rotas |
| `signInId`, `url`, `expiresAt` | `start` | entrar |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Ligar por chave | `Idempotency-Key` | uma transação | banco: 503 da 2 | `MODEL_ACCOUNT_LINKED` | 10, 12 |
| `start` | duas linhas | — | — | `MODEL_ACCOUNT_SIGN_IN_STARTED` | 19, 20 |
| `complete` | `DELETE … RETURNING` (S22) | troca recusada: nada grava | 502 `MODEL_ACCOUNT_UNAVAILABLE` | `MODEL_ACCOUNT_LINKED` | 19, 20, 22 |
| Mudar, pausar, dar, padrão | 412; dar envia o estado final | uma transação | banco | `MODEL_ACCOUNT_CHANGED` | 15, 17, 18 |
| Ordenar | linhas travadas; única adiável | uma transação | banco | `MODEL_ACCOUNTS_ORDERED` | 14 |
| Remover | o segundo: 204 | uma instrução | banco | `MODEL_ACCOUNT_REMOVED` | 10 |
| Tipos | estado final | uma transação | banco | `ACCOUNT_KINDS_SET` | 16 |
| Processo de login CLIProxy | um por entrada | morre com o programa | Google: 502 | `CLIPROXY_STARTED`, `_STOPPED` | 21 |
| `reseal` | por `key_id` | linha a linha | banco | linhas | 6 |
| Tirar pessoa, apagar empresa | os da 5 e 6 | chave estrangeira | — | os da 5 e 6 | 8 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Lacre | nova | `platform/seal.ts` | — | `keyId`, chaves que só abrem (S32), propósito |
| Fila, tipos, rotas | nova | `builder/model-accounts/` | — | "nunca devolver a chave" (`routes.ts:55`, `e0353c36`), propósito; sem teste ao ligar, como LibreChat (`keys.js:7-19`, `e081b566`) |
| Assinatura Claude | nova, sobre o `@mastra/code-sdk` | `claude/` | — | "colar o código", o fluxo do Mastra |
| Login Google pelo CLIProxy | nova, o antigo como especificação | `google/` | — | `127.0.0.1`, sha256, morre com o pai (`pool.ts:57-80,188`), propósito |

**A medida do transplante.** Nada é copiado: o lacre antigo (`registry/seal.ts`, 95 linhas) muda
os dados associados e o formato; de `pool.ts` e `login.ts` (505) só o login entra, com outro lacre.

**A dívida.** Nenhuma. No fechamento (L20), S34 cita a 0048. A 12 recebe: a primeira chamada
recusada grava `refused`; a chave só ao host do registro, com o ambiente só no `compose.yaml`; a
renovação Claude com reserva (S34) e os cabeçalhos; o processo CLIProxy por conta para chamar.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0048-…`, `index.md`; `0030` substituída | cria | U4–U7 |
| `architecture.md` §8, §11; `roadmap.md` (etapas 11 e 21: chave e Google na 11) | muda | `check-docs` |

### Os contratos que a unidade cria

0048: tipos, filas por fornecedor, ordem P2, tipos por operador, sem teste ao ligar, chave da
instalação. Criterion: crit. 1 a 4, nas versões instaladas e fixadas de `@mastra/core` e
`@mastra/code-sdk` (as linhas citadas são do fork `ce7e9c30`, core 1.69.0, code-sdk 1.8.1, e se
conferem na instalada); o login por `anthropic.ts:39,61,130`; CLIProxyAPI v8.0.33 (`2422c6b0`) por
`/antigravity-auth-url`; o roteador por `router.ts:332-335`. Falha no 2 ou no 3: o tipo não entra
e volta ao fundador.

### A ordem do trabalho

Só documentos (L13); credenciais da prova apagadas. Regras: L21, T14, S40.

## U2 Lacre e chave da instalação

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/seal.ts` | cria | U5–U7 |
| `platform/config.ts` | `HUB_SEAL_KEYS_FILE` | `main.ts`, leitores de `config` |
| `main.ts` | subcomando `reseal` | `infra/deploy.sh` |
| `infra/compose.yaml`, `deploy.sh` (`require_secrets`), `setup-server.sh`, `how-to/hub-server.md` | o arquivo, 0600; a troca | publicar |

### Os contratos que a unidade cria

`seal(keys, context: SealContext, plain: Secret): Sealed`; `open(keys, context, sealed): Secret`;
`Sealed = {keyId; blob: Uint8Array}`; `SealContext = {purpose: 'model-account'; rowId; companyId;
personId: string | null; kind; provider}`. Arquivo: linhas `id:base64`, a última lacra. Falha
`SEAL_REFUSED` (`SYSTEM`).

### A ordem do trabalho

1. Ler o arquivo. Regras: S31, S33, C67. Funções: `readSecretFile`.
2. Lacrar e abrir. Regras: S32, S41, C27. Funções: `node:crypto` `createCipheriv('aes-256-gcm')`,
   IV de 12 bytes, `setAAD`, etiqueta de 16 bytes.
3. `reseal` relacra o que está em chave antiga; ensaio de três fases (S32).

### Como se prova

5, 6: `npm run test -w @conexus/server`.

## U3 Tabelas e permissões

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/tables.ts` | cria o schema `builder` | U5–U7 |
| `apps/server/migrations/`, `database-grants.sql` | tabelas; permissões; o retrato | `migrate`, `catalog.test.ts` |

### Os contratos que a unidade cria

`builder.model_account`: `id` uuid; `company_id`, `person_id` nulo, para `auth.member (company_id,
user_id)`, `ON DELETE CASCADE`; `kind` em (`api_key`, `claude_subscription`, `google_cliproxy`);
`provider`, `label`, sem modelo; `position`; `state` em (`ready`, `paused`, `refused`); `sealed`
bytea; `key_id`; `hint`; `linked_by`, `linked_at`, `revision`. Única `NULLS NOT DISTINCT
(company_id, person_id, provider, position)` adiável (não provada: crit. 14).
`builder.model_account_assignee (account_id, company_id, person_id)`, `ON DELETE CASCADE` nas duas.
`builder.company_model (company_id, model)`. `builder.company_account_kind (company_id, kind)`.
`builder.model_account_sign_in`: `id`, `company_id`, `person_id`, `owner`, `kind`, `label`,
`sealed`, `key_id`, `expires_at`. Política de linha (0039). Com A: `hub_company` sem `SELECT` em
`sealed`; `SECURITY DEFINER` `builder.sealed_of(account uuid)` presa à empresa da transação.

### A ordem do trabalho

Regras: D1, D4, D6, D10, D11, D12, D15, D17, D18, 0038, 0039. Funções: `drizzle-orm` 1.0.0-rc.4
`pgSchema`, `pgTable`, `unique().nullsNotDistinct()`.

### Como se prova

7, 8: `npm run test -w @conexus/server`.

## U4 Lista de fornecedores

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/providers.ts` | a lista | U5 |
| `apps/server/package.json`, `package-lock.json` | `@mastra/core` fixo (0027) | — |
| `infra/compose.yaml` | `MASTRA_OFFLINE=1` (`provider-registry.ts:40-43,1020`) | — |

### Os contratos que a unidade cria

`listKeyProviders(): Provider[]`, `Provider = {id; name; models: string[]}`, os do crit. 1.

### A ordem do trabalho

Regras: C26, C56, C75. Funções: `@mastra/core/llm` `PROVIDER_REGISTRY`, `parseModelString`.

### Como se prova

9: `npm run test -w @conexus/server`, `fetch` dublê.

## U5 Fila, tipos e rotas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/` | `store.ts`, `routes.ts`, `kinds.ts`, `public.ts` | `main.ts` |
| `packages/hub-api/src/model-accounts.ts`, `failures.ts`, `index.ts` | operações e falhas | web, OpenAPI |
| `hub/identity/admission.ts`, `auth.ts` | ações; `MANAGE_MODEL_ACCOUNTS` (dono, administrador) | Builder |
| `main.ts` | liga o Builder | — |

### Os contratos que a unidade cria

Ações: `readModelAccounts`, `manageModelAccounts`, `manageOwnModelAccounts` (`MEMBER`);
`setAccountKinds` (`OPERATOR`). `Owner = 'company' | 'me'`. Operações `session`, sob
`/api/companies/{companyId}`:

| Operação | Método e caminho | Saída e falhas |
| --- | --- | --- |
| `listModelAccounts` | `GET /model-accounts` | `{company, mine, order, kinds, defaultModel}` |
| `listModelProviders` | `GET /api/model-providers` | `Provider[]` |
| `connectModelAccount` | `POST /model-accounts`, `Idempotency-Key`; `{owner, provider, label, key}` | 201; 422 `MODEL_ACCOUNT_INVALID` |
| `changeModelAccount` | `PATCH /model-accounts/{accountId}`, `If-Match`; `{label?, state?: 'ready' \| 'paused'}` | 200; 412 |
| `assignModelAccount` | `PUT /model-accounts/{accountId}/assignees`; `{personIds}` | 200; 404; 422 |
| `setDefaultModel` | `PUT /default-model`; `{model}` | 200; 422 `MODEL_UNKNOWN` |
| `orderModelAccounts` | `PUT /model-account-orders/{owner}/{provider}`; `{ids}` | 200; 409 |
| `removeModelAccount` | `DELETE /model-accounts/{accountId}` | 204 |
| `setAccountKinds` | `PUT /api/operations/clients/{companyId}/account-kinds`; `{kinds}` | 200 |

`order` é a ordem da pessoa por fornecedor (P2): própria, dadas na posição da empresa, empresa; ela
não reordena as dadas.

### A ordem do trabalho

1. Contrato e falhas. Regras: C28, C29, C30, C33, C35, C37, C38, C48, C51, S24, S48.
2. Admissão e loja. Regras: S6–S11, S41, C8, C65, D20, D22.
3. Rotas e `main.ts`. Regras: C4, C13, C14.

### Como se prova

10–18: `npm run test -w @conexus/server`; T10 com membro, outra empresa, operador.

## U6 Entrada por assinatura e Claude

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/sign-ins.ts`, `claude/`; `hub-api` | a porta `SignInKind`, as duas rotas, Claude | U7, web |
| `apps/server/package.json`, `package-lock.json` | `@mastra/code-sdk` fixo | — |

### Os contratos que a unidade cria

`type SignInKind = {start(): Promise<{url; pending: Secret}>; complete(pending, code):
Promise<Secret>}`, criada aqui com Claude; o Google a segue. `startModelAccountSignIn` `POST
/model-account-sign-ins` `{owner, kind, label}`: 201 `{signInId, url, expiresAt}`;
`completeModelAccountSignIn` `POST /model-account-sign-ins/{signInId}` `{code}`: 201; 410; 422
`MODEL_ACCOUNT_REFUSED`; as duas 422 `MODEL_ACCOUNT_KIND_OFF`. O pacote exporta os módulos por
`"./*"` (`package.json:21-25`).

### A ordem do trabalho

Funções: `startAnthropicLogin`, `completeAnthropicLogin` (`anthropic.ts:39,61`); o resultado,
com `refresh`, `access` e `expires`, é lacrado inteiro. Regras: C57, C63, S22, S32, S41.

### Como se prova

19, 20: `npm run test -w @conexus/server`, Anthropic dublê.

## U7 Login Google pelo CLIProxy

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/google/` | `SignInKind` do Google, o processo de login | U6, `main.ts` |
| `infra/hub.Dockerfile`, `compose.yaml`; `platform/config.ts` | binário v8.0.33 e sha256; pasta em `tmpfs` | publicar |

### Os contratos que a unidade cria

O `SignInKind` do Google, com um processo por entrada. A conta tem `provider` `google`: fica na
fila Google, com as chaves Google. Falhas `CLIPROXY_BINARY_REFUSED`, `CLIPROXY_UNAVAILABLE`.

### A ordem do trabalho

1. Processo: `127.0.0.1`, `--local-model`, `management.secret-key` aleatória
   (`config.example.yaml`, `2422c6b0`, a conferir em U1); `setpriv --pdeathsig`. Regras: C57, C62,
   S36, S37.
2. Entrar: `/antigravity-auth-url`, `/get-auth-status`, `/oauth-callback`; lacrar o arquivo de
   login e apagar a pasta. Regras: S22, S32, S41.

### Como se prova

21, 22: `npm run test -w @conexus/server`, CLIProxy dublê.

## U8 Telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/model-accounts/` | filas, formulário, entrar, tipos | rotas |
| `routes/_app/route.tsx` (trilho), `companies/$companyId/setup.tsx`, `model-account.tsx`, `operations/clients/$companyId.tsx` | as seções | `routeTree.gen.ts` |

### A ordem do trabalho

Regras: W1, W4, W6, W8, W9, W12, W17, W23, W24; V29–V31, V35, V39, V55. Ordenar por "Subir" e
"Descer" (V30).

### Como se prova

23: `npm run test -w @conexus/web`; 24: o navegador.

## U9 Percurso

25: `npm run e2e`, com o arquivo na lista do `e2e` do `package.json`; 26: após o Release (T13,
T14).
