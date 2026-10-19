# Etapa 11: Conta de modelo

## A página do fundador

**No fim desta etapa** você liga numa empresa várias contas de modelo (chave de API de qualquer
fornecedor do Mastra, a sua assinatura Claude, a sua conta Google pelo CLIProxy), uma fila por
fornecedor na ordem que quiser, testa, pausa, dá contas a pessoas e escolhe o modelo padrão. A
Conexus escolhe os tipos de cada empresa.

**O roteiro de uso.** No Hub publicado.

1. Em **Clientes › Empresa A › Tipos de conta**, ligue "Assinatura Claude" e "Google". Na Empresa
   B só aparece "Chave de API".
2. Na A, **Configurar a empresa › Conta de modelo › Ligar conta**: Anthropic, "Time 1", a sua
   chave, teste com Claude Haiku 4.5: "Funciona (testado com Claude Haiku 4.5)". Chave errada: "A
   Anthropic recusou esta chave.", nada guardado.
3. **Assinatura Claude**: cola o código da Anthropic, "Time 2". **Google**: entra, "Google 1".
4. Na fila Anthropic, suba a Time 2; pause a Time 1; escolha Claude Sonnet como modelo padrão.
5. Dê a Time 2 à Ana: "reservada para Ana". Como Ana, em **Minha conta de modelo**: "Sua ordem
   para Anthropic: Time 2, Time 1", e uma chave só sua.
6. Remova a Time 1: "Apague também a chave no Console da Anthropic".

**O que você faz, e quando.** Autoriza as chamadas da prova (U1) e do roteiro publicado, com a sua
chave da Anthropic, assinatura Claude e conta Google. Antes de U2: gera a
chave da instalação e guarda cópia fora do servidor (S33). Antes de U3: a palavra da permissão. No
fim: o roteiro e os textos. Gasto: centavos.

**As suas respostas, como o cartão as lê; confirme ou corrija.** 1 B: assinatura e chave; a
suspensão, na Anthropic e no Google ("suspension or termination"), cai em quem liga. 2: todo
fornecedor só com chave. 3, 6, 11: sem limite; uma fila por fornecedor em cada
dono. 7, P1–P3: pessoa, depois as dadas a ela, depois a empresa; a dada sai da fila geral, pode ir
a várias pessoas e guarda a posição da empresa. 12: a conta não guarda modelo; dono e administrador
definem o padrão. 14: sem grupos. 8: ChatGPT na 21. 9: os tipos da empresa valem também para as
contas pessoais nela. 4: dono e administrador não veem contas pessoais.

**13, a troca automática.** Na 12, acabadas as contas do fornecedor, o Builder para e avisa. A
troca automática seria ajuste da empresa, desligado, ligado por dono ou administrador com uma
cadeia: é da 12, pendente da sua confirmação.

**Decididas (2026-10-19).** Sai a última pessoa de uma conta dada: ela volta "para todos". Tipo
desligado: as contas param e voltam ao religar. O padrão é qualquer modelo do registro.
**Pendente: o teste da conta (5).** Verificamos se há validação nativa no lugar da chamada; sem
ela, você inclina a não testar.

**Decisão sua: a permissão (regra D11).** Exemplo: um defeito manda a credencial lacrada para a
tela. **A.** O papel da empresa grava a coluna mas não a lê; uma função a entrega, uma conta por
vez (Grant A da 8): o banco recusa. **B.** Lê a linha inteira. **Recomendação: A** (D12).

**O que só a prova diz** (U1): se a assinatura Claude entra hoje, quanto dura o token e se renova;
se o Google entra pelo CLIProxy; se um fornecedor recusa. Falhou: o tipo fica desligado e volta a
você.

**Fica de fora.** Escolher o modelo na conversa, a troca de conta, a pausa por limite: da 12.
ChatGPT (21). As issues `next-card` 25, 39 e 45: nada nestas pastas.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Registro 0048 e prova | `docs/` | testes | mastra | — |
| U2 | Lacre e chave da instalação | `platform/`, `infra/`, how-to | segurança | node | U1 |
| U3 | Tabelas e permissões, PR próprio (D11) | `builder/model-accounts/tables.ts`, migrações, grants | dados | neon:neon-postgres | U2 |
| U4 | Fornecedores e teste por chave | `builder/model-accounts/check/` | código | mastra | U1 |
| U5 | Fila, tipos e rotas | `builder/model-accounts/`, `hub-api`, `hub/identity/`, `main.ts` | segurança | fastify-best-practices | U2–U4 |
| U6 | Entrada por assinatura e Claude | `builder/model-accounts/claude/`, `sign-ins.ts` | segurança | mastra | U5 |
| U7 | Google pelo CLIProxy | `builder/model-accounts/google/`, `infra/` | segurança | node | U6 |
| U8 | Telas | `apps/web/src/builder/model-accounts/`, rotas | design, web | shadcn | U5 |
| U9 | Percurso | `tests/e2e/`, `package.json` | testes | — | U7, U8 |

U2 e U4 correm em paralelo; U6 e U8 também. Uma revisão, um merge (L9, L13); U3 em PR próprio.

**Orçamento de código alterado** (sem testes nem gerados): U2 180; U3 170; U4 250; U5 850; U6 450;
U7 550; U8 980; U9 30. Total **3.460**, teto 4.000 (L2). Estudos: 1.500 a 1.900 com testes, sem Google
nem telas. Base: Projetos, um dono, tem 782 linhas no servidor, 354 nas telas, 117 no contrato. Google: 550 contra 663 do antigo
(`google-ai-pro/`, `e0353c36`), sem o roteador local.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0048 "proposed" antes da prova; Result, na versão instalada: os fornecedores só com chave, derivados do registro (sem modelo de URL `${VAR}`, um só `apiKeyEnvVar`), e os de fora; nenhuma credencial | o registro | must |
| 2 | U1 | Ao vivo, Claude: entrar pelo `@mastra/code-sdk` fixado, 1 token, o `expires_in` cru, uma renovação, 20 turnos sem 401/403 | o registro | must |
| 3 | U1 | Ao vivo, Google: CLIProxyAPI v8.0.33 por sha256, Antigravity, 1 token em `127.0.0.1`; o login renovado volta | o registro | must |
| 4 | U1 | Cada resposta da prova anotada; uma recusa por termos volta ao fundador | o registro | must |
| 5 | U2 | `HUB_SEAL_KEYS_FILE` ausente, vazio, legível por outros, chave fora de 32 bytes: não inicia, `CONFIG_INVALID` | `config.test.ts` | must |
| 6 | U2 | Lacre em outra linha, dono, tipo ou fornecedor, ou bit virado: recusado; chave aposentada abre; após `reseal` a antiga sai sem perda | `seal.test.ts` | must |
| 7 | U3 | A Empresa B não lê nem grava conta da A; o papel da empresa recebe 42501 em `sealed` (A); o retrato bate | `isolation-model-accounts.test.ts`, `catalog.test.ts` | must |
| 8 | U3 | Tirar a pessoa apaga as contas dela e as atribuições a ela (a conta volta "para todos"); apagar a empresa apaga tudo | `model-accounts-removal.test.ts` | must |
| 9 | U4 | Sem `*_BASE_URL` no ambiente, `fetch` dublê: cada chave vai só ao host do registro do seu fornecedor, no cabeçalho dele; chave vazia recusada sem rede | `check.test.ts` | must |
| 10 | U4 | 200 `works`; 401 `refused`; 403 `no_access`; 402 e 400 de crédito `no_credit` (pelas palavras, como `classifyRotationError`); 429 `limited`; 5xx, corte, 15 s `unavailable` | idem | must |
| 11 | U4 | Chave plantada fora do log, da resposta e da falha | idem | must |
| 12 | U5 | Ligar por chave: só `works` grava, no fim da fila do fornecedor; `refused`: 422 `MODEL_ACCOUNT_REFUSED`; a chave nunca volta, só `…` e quatro caracteres | `model-accounts.test.ts` | must |
| 13 | U5 | Mesmo `Idempotency-Key`: uma conta; outro corpo: `IDEMPOTENCY_CONFLICT` | idem | must |
| 14 | U5 | Membro lê a fila da empresa; mudá-la: 404 (S10); ninguém vê conta pessoal alheia | idem | must |
| 15 | U5 | Ordenar uma fila com todos os seus ids: grava; velha, incompleta ou de outro fornecedor: 409 `MODEL_ACCOUNT_ORDER_STALE`; duas juntas: uma vence | `model-accounts-order.test.ts` | must |
| 16 | U5 | Pausar, retomar; testar de novo abre o lacre e grava estado e hora; `refused`: "Ligue de novo"; revisão velha: 412 | `model-accounts.test.ts` | must |
| 17 | U6 | Tipo desligado na empresa: `startModelAccountSignIn` e `complete` dão 422 `MODEL_ACCOUNT_KIND_OFF`, para a fila da empresa e a pessoal; as contas dele não testam; religar as devolve | `sign-ins.test.ts` | must |
| 18 | U5 | Só o operador muda os tipos; dono: 404; chave de API sempre ligada | `model-account-kinds.test.ts` | must |
| 19 | U5 | Dar uma conta da empresa a uma ou várias pessoas: sai da fila geral; a ordem de cada uma é própria, dadas na posição da empresa, empresa; só dono e administrador; não membro: 404; conta pessoal: 422 | `model-accounts-assign.test.ts` | must |
| 20 | U6 | `start` dá o endereço e guarda o verificador lacrado 10 min; `complete` troca, testa, grava; repetido ou tarde: 410 `MODEL_ACCOUNT_SIGN_IN_EXPIRED` | `claude.test.ts`, Anthropic dublê | must |
| 21 | U6 | Duas renovações juntas: uma chamada (S34); recusada grava `refused` | idem | must |
| 22 | U6 | A chamada leva a frase do `claudeCodeMiddleware`, e o `Authorization` e o `anthropic-beta` do `buildAnthropicOAuthFetch` com o token da conta; duas em paralelo não se trocam | idem | must |
| 23 | U7 | Um processo por conta, em `127.0.0.1`; binário diferente: não inicia; ocioso, para; o renovado é relacrado | `google.test.ts`, CLIProxy dublê | must |
| 24 | U7 | Entrar pela gestão; `state` errado ou tarde: 410; a conta é `google` e o roteador chega por `url` e chave do processo | idem | must |
| 25 | U8 | As telas da matriz, textos, teclado e foco | `model-accounts.test.tsx` | must |
| 26 | U8 | 390 px, 200%, dois temas, sem erro de CSP | navegador (T23) | should |
| 27 | U9 | O roteiro, Hub real, dublês | `tests/e2e/model-accounts.test.ts` | must |
| 28 | U9 | Publicado: passos 1 a 6 | firstmate, fundador (T14) | must |
| 29 | U5 | Modelo padrão: dono e administrador, do registro; membro: 404; fora: 422 `MODEL_UNKNOWN` | `model-accounts.test.ts` | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Conta de modelo, em Configurar a empresa | "Nenhuma conta ligada", **Ligar conta**; cada conta "para todos" ou "reservada para Ana, Diego" | a partilhada | a de `ui/` | a da empresa | "recusada · Ligue de novo", "pausada", "desligada pela Conexus" |
| Minha conta de modelo (trilho) | "Nenhuma conta sua"; a sua ordem por fornecedor | idem | idem | idem | idem |
| Ligar conta | fornecedor com busca, modelo de teste | "Testando…" | o mapa (crit. 10) | fora do registro: 422 | tipo desligado: 422 |
| Entrar com assinatura | endereço e campo do código | "Entrando…" | idem | — | "O código venceu. Entre de novo." |
| Tipos de conta (operador) | só "Chave de API" | idem | idem | a do cliente | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `id`, `owner` (`company` ou `me`), `kind`, `provider`, `label`; `position` | ligar; ordenar | telas; a 12 |
| `state` (`ready`, `paused`, `refused`), `testedAt`, `testModel` | ligar, testar, pausar, renovar | telas; a 12 |
| `hint`, `linkedBy`, `linkedAt` | ligar | telas |
| `assignees` | dar | telas, a ordem da pessoa; a 12 |
| `defaultModel` | dono, administrador | tela; a 12 |
| `revision` | ligar, mudar | mudar (412) |
| `kindOff` (derivado) | operador | telas, rotas |
| `signInId`, `url`, `expiresAt` | `start` | entrar |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Ligar por chave | `Idempotency-Key` | teste fora da transação (D22) | o mapa | `MODEL_ACCOUNT_CHECKED` | 10, 12, 13 |
| `start` | duas linhas | — | — | `MODEL_ACCOUNT_SIGN_IN_STARTED` | 17, 20 |
| `complete` | `DELETE … RETURNING` (S22) | teste falho: nada grava | 502 `MODEL_ACCOUNT_UNAVAILABLE` | o resultado | 17, 20, 24 |
| Testar de novo | a última grava | estado só com a resposta | o mapa | idem | 16 |
| Mudar, pausar, dar, padrão | 412; dar envia o estado final | uma transação | banco: 503 | `MODEL_ACCOUNT_CHANGED` | 16, 19, 29 |
| Ordenar | linhas travadas; única adiável | uma transação | idem | `MODEL_ACCOUNTS_ORDERED` | 15 |
| Remover | o segundo: 204 | uma instrução | idem | `MODEL_ACCOUNT_REMOVED` | 12 |
| Tipos | estado final | uma transação | idem | `ACCOUNT_KINDS_SET` | 17, 18 |
| Renovar Claude | reserva na linha (S34) | vence em 30 s | `refused`, `unavailable` | `MODEL_ACCOUNT_REFRESHED` | 21 |
| Processo CLIProxy | um por conta | morre com o programa | o mapa | `CLIPROXY_STARTED`, `_STOPPED` | 23 |
| `reseal` | por `key_id` | linha a linha | banco | linhas | 6 |
| Tirar pessoa, apagar empresa | os da 5 e 6 | chave estrangeira | — | os da 5 e 6 | 8 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Lacre | nova | `platform/seal.ts` | — | `keyId`, chaves que só abrem (S32), propósito |
| Fila, tipos, rotas | nova | `builder/model-accounts/` | — | "nunca devolver a chave" (`routes.ts:55`, `e0353c36`), propósito |
| Teste por chave | nova | `check/` | — | Dify, teste antes de guardar (`provider_configuration.py:388`, `8857292a`) |
| Assinatura Claude | nova, sobre o `@mastra/code-sdk` | `claude/` | — | "colar o código", o fluxo do Mastra |
| Google pelo CLIProxy | nova, o antigo como especificação | `google/` | — | processo por conta, `127.0.0.1`, sha256, morre com o pai (`pool.ts:57-80,188`), propósito |

**A medida do transplante.** Nada é copiado: o lacre antigo (`registry/seal.ts`, 95 linhas) muda
os dados associados e o formato; `pool.ts` e `login.ts` (505) mudam a chave da instância e o lacre.

**A dívida.** Nenhuma. No fechamento (L20), S34 cita a 0048.

## U1 Registro e prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0048-…`, `index.md`; `0030` substituída | cria | U4–U7 |
| `architecture.md` §8, §11; `roadmap.md` (etapas 11 e 21: chave e Google na 11) | muda | `check-docs` |

### Os contratos que a unidade cria

0048: tipos, filas por fornecedor, ordem P2, tipos por operador, chave da instalação. Criterion:
crit. 1 a 4, nas versões instaladas e fixadas de `@mastra/core` e `@mastra/code-sdk` (as linhas
citadas aqui são do fork `ce7e9c30`, core 1.69.0, code-sdk 1.8.1, e se conferem na instalada); o
login por `anthropic.ts:39,61,130`; CLIProxyAPI v8.0.33 (`2422c6b0`) por `/antigravity-auth-url`;
o roteador `google` com `url` e chave do processo (`router.ts:332-335`). Falha no 2 ou no 3: o tipo
não entra e volta ao fundador.

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
`provider`, `label`, sem modelo; `test_model`; `position`; `state` em (`ready`, `paused`,
`refused`); `sealed` bytea; `key_id`; `hint`; `refresh_reserved_until`; `linked_by`, `linked_at`,
`tested_at`, `revision`. Única `NULLS NOT DISTINCT (company_id, person_id, provider, position)`
adiável (não provada: crit. 15). `builder.model_account_assignee (account_id, company_id,
person_id)`, `ON DELETE CASCADE` nas duas. `builder.company_model (company_id, model)`.
`builder.company_account_kind (company_id, kind)`. `builder.model_account_sign_in`: `id`,
`company_id`, `person_id`, `owner`, `kind`, `label`, `test_model`, `sealed`, `key_id`,
`expires_at`. Política de linha (0039). Com A: `hub_company` sem `SELECT` em `sealed`;
`SECURITY DEFINER` `builder.sealed_of(account uuid)` presa à empresa da transação.

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
| `apps/server/package.json`, `package-lock.json` | `@mastra/core` fixo (0027) | — |
| `infra/compose.yaml` | `MASTRA_OFFLINE=1` (`provider-registry.ts:40-43,1020`); o único dono do ambiente | — |

### Os contratos que a unidade cria

`type ModelCheck = (input: {model: LanguageModel; signal: AbortSignal}) => Promise<CheckResult>`;
`CheckResult = {result: 'works' | 'refused' | 'no_access' | 'no_credit' | 'limited' |
'unavailable'; status?: number}`. `listKeyProviders(): Provider[]`, `Provider = {id; name;
models: string[]}`, os do crit. 1. **Pendente** (fundador, 2026-10-19): validação nativa no lugar
da chamada, ou nenhum teste; o teste fica como está até a resposta.

### A ordem do trabalho

1. A lista. Regras: C26, C75. Funções: `@mastra/core/llm` `PROVIDER_REGISTRY`, `parseModelString`.
2. O teste. Regras: C49, C52, C56, C57, C59, S36, S41. Funções: `ModelRouterLanguageModel({id,
   apiKey})` (`router.ts:111,137`), `doGenerate({prompt, maxOutputTokens: 1, abortSignal})`, que
   não repete; o resultado em fluxo é lido até o fim (`:378`); pelo `statusCode`, nunca
   `instanceof`.

### Como se prova

9–11: `npm run test -w @conexus/server`, `fetch` dublê.

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
| `connectModelAccount` | `POST /model-accounts`, `Idempotency-Key`; `{owner, provider, label, key, testModel}` | 201; 422 do mapa, `MODEL_UNKNOWN` |
| `testModelAccount` | `POST /model-accounts/{accountId}/tests` | `CheckResult` |
| `changeModelAccount` | `PATCH /model-accounts/{accountId}`, `If-Match`; `{label?, state?: 'ready' \| 'paused'}` | 200; 412 |
| `assignModelAccount` | `PUT /model-accounts/{accountId}/assignees`; `{personIds}` | 200; 404; 422 |
| `setDefaultModel` | `PUT /default-model`; `{model}` | 200; 422 |
| `orderModelAccounts` | `PUT /model-account-orders/{owner}/{provider}`; `{ids}` | 200; 409 |
| `removeModelAccount` | `DELETE /model-accounts/{accountId}` | 204 |
| `setAccountKinds` | `PUT /api/operations/clients/{companyId}/account-kinds`; `{kinds}` | 200 |

`order` é a ordem da pessoa por fornecedor (P2): própria, dadas na posição da empresa, empresa; ela
não reordena as dadas.

### A ordem do trabalho

1. Contrato e falhas. Regras: C28, C29, C33, C35, C37, C38, C48, C51, S24, S48.
2. Admissão e loja. Regras: S6–S11, C8, C65, D20, D22; o teste fora da transação.
3. Rotas e `main.ts`. Regras: C4, C13, C14.

### Como se prova

12–16, 18, 19, 29: `npm run test -w @conexus/server`; T10 com membro, outra empresa, operador.

## U6 Entrada por assinatura e Claude

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/sign-ins.ts`, `claude/`; `hub-api` | a porta `SignInKind`, as duas rotas, Claude | U7, web |
| `apps/server/package.json`, `package-lock.json` | `@mastra/code-sdk` fixo, `@ai-sdk/anthropic` dele | — |

### Os contratos que a unidade cria

`type SignInKind = {start(): Promise<{url; pending: Secret}>; complete(pending, code):
Promise<Secret>; model(credential, modelId): LanguageModel}`, criada aqui com Claude; o Google a
segue. `startModelAccountSignIn` `POST /model-account-sign-ins` `{owner, kind, label, testModel}`:
201 `{signInId, url, expiresAt}`; `completeModelAccountSignIn` `POST
/model-account-sign-ins/{signInId}` `{code}`: 201; 410; as duas 422 `MODEL_ACCOUNT_KIND_OFF`. Um
`CredentialStore` por conta (`auth/types.ts:139-190`), que responde por `'anthropic'`
(`claude-max.ts:251-254`) com `reload`, `get`, `getStoredApiKey` e `getApiKey`, que renova com
reserva (S34); nunca o global. O pacote exporta os módulos por `"./*"` (`package.json:21-25`).

### A ordem do trabalho

1. Entrar. Funções: `startAnthropicLogin`, `completeAnthropicLogin` (`anthropic.ts:39,61`). Regras:
   C63, S22.
2. Chamar. Funções: `createAnthropic({fetch: buildAnthropicOAuthFetch({authStorage})})`
   (`claude-max.ts:246-272,311`) com `claudeCodeMiddleware` (`:56-72`); não
   `opencodeClaudeMaxProvider`, que usa chave de API em teste (`:299-309`). Regras: S34, S36, S41,
   C57.

### Como se prova

17, 20–22: `npm run test -w @conexus/server`, Anthropic dublê.

## U7 Google pelo CLIProxy

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/model-accounts/google/` | `SignInKind`, os processos | U6, `main.ts` |
| `infra/hub.Dockerfile`, `compose.yaml`; `platform/config.ts` | binário v8.0.33 e sha256; pasta em `tmpfs` | publicar |

### Os contratos que a unidade cria

`CliproxyPool = {acquire(accountId): Promise<Lease>; startLogin(); sweepIdle(signal); close()}`;
`Lease = {url; proxyKey: Secret; release()}`. A conta tem `provider` `google`: fica na fila Google,
com as chaves Google, e chega pela forma da API do Gemini (`google-ai-pro/router.ts:6,15`,
`e0353c36`). Falhas `CLIPROXY_BINARY_REFUSED`, `CLIPROXY_UNAVAILABLE`.

### A ordem do trabalho

1. Processo: `127.0.0.1`, `access.api-keys` aleatória, `--local-model`, `management.secret-key` só
   no login (`config.example.yaml`, `2422c6b0`, a conferir em U1). Regras: C57, C62, S36, S37.
2. Entrar: `/antigravity-auth-url`, `/get-auth-status`, `/oauth-callback`. Regras: S22, S41.
3. Ao parar, relacrar o arquivo renovado. Regras: S32.

### Como se prova

23, 24: `npm run test -w @conexus/server`, CLIProxy dublê.

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

25: `npm run test -w @conexus/web`; 26: o navegador.

## U9 Percurso

27: `npm run e2e`, com o arquivo na lista do `e2e` do `package.json`; 28: após o Release (T13,
T14).
