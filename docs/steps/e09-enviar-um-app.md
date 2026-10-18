# Etapa 9: Enviar um app

## A página do fundador

**No fim desta etapa** o dono ou o administrador da empresa envia, nas Configurações de um Projeto,
uma versão de um app pronto; o app grava no banco da empresa; voltar a uma versão anterior troca só o
código; apagar o Projeto apaga o app, o banco dele e as versões. Na etapa 14 o Builder envia pelo
mesmo caminho interno, e o botão **Enviar versão** sai do Hub.

**O roteiro de uso.** No Hub publicado, com a Empresa A e o Projeto Pedidos da 8, e as pastas
`recados-1` e `recados-2` no seu computador (P1).

1. Em Pedidos, abra **Configurações**: "Nenhuma versão enviada. O endereço mostra o app de exemplo."
   Clique em **Enviar versão**, escolha `recados-1`: "Versão 1 · no ar". O membro não vê
   **Configurações**.
2. **Abrir app**: o Recados. Escreva um recado e recarregue: continua lá.
3. Envie `recados-2`: "Versão 2 · no ar", o app com outra cor e o recado lá.
4. Na Versão 1, **Voltar para esta**: "Os dados ficam como estão." Confirme: a cor antiga, os
   recados lá.
5. Apague Pedidos e recarregue o app: "Este app não existe."

**O que você faz, e quando.** Com a 8 publicada: autoriza aqui as chamadas da prova U1; cria o
token da prova (papel Admin dos Workers) e uma chave de prova do Neon na organização das empresas, e
os apaga no fim. Antes de U2: a palavra do grant (D11). Antes do Release: o token do Hub para os apps
(papel Admin dos Workers) num arquivo do servidor, separado do da 8; e guarda fora do servidor a
cópia da chave dos logins dos apps, que o firstmate gera. No fim: o roteiro e os textos.

**As chamadas da prova U1**, todas `cx-prova-`, apagadas no fim: na Cloudflare, um namespace, um
despachante em `workers.dev` com a chave por `wrangler secret put`, e pela API três Workers de app,
um enviado duas vezes; no Neon, dois projetos pelo SDK, com logins e esquemas por SQL. **Depois do Release (U8):** um app de ataque em `conexus-apps`,
apagado no fim; restaurar a um minuto, no console do Neon, o projeto da Empresa A.

**Decisões já dadas** (2026-10-18): 1A; 2, Versões nas Configurações; 3A; 4A; 5A; 6C, ficam a do ar
e as 3 anteriores; 7A; 8A, risco aceito.

**O que muda.** O 0043 substitui o 0022 (sua 4A), depois da prova. No mapa de telas das etapas
12 e 14, o "Versão 3 ▾" sai do topo do Projeto para **Configurações**; **Publicar** é da 17.

**Fica de fora.** Recusar um app com defeito e os limites (a 10). Recusar uma migração que a versão
antiga não aguenta (a 15). Preview (a 14). Publicar (a 17). Levar Apagar para Configurações (a 18).
As issues `next-card` 25, 39 e 45: nada nas pastas da 9.

**As decisões suas pedidas nesta etapa.**

**P1. Como as pastas `recados-1` e `recados-2` chegam ao seu computador, sem terminal?**
**A.** O Release da 9 traz `recados-1.zip` e `recados-2.zip`: você baixa na página da v0.9.0,
descompacta e escolhe a pasta. **B.** As pastas montadas ficam no repositório, baixado em zip.
**C.** O firstmate envia por você no Chromium. Recomendo **A**: a 10 precisa do mesmo caminho para o
app com defeito, e nada montado fica no repositório.

**P2. Depois de restaurar um banco, o que recria os Workers e os logins dos apps?**
**A.** "Reiniciar o Hub", já obrigatório depois de restaurar: ao subir, o Hub recria o que falta.
**B.** Cada app, no próximo envio ou **Voltar para esta**. **C.** Um botão novo na Central.
Recomendo **A**: nenhum passo nem tela a mais.

## O que mudou desde o estudo

A resposta 2 cria a tela **Configurações do Projeto**. Os arquivos são endereçados por `(empresa,
SHA-256)`: toda tabela tem a coluna da empresa [0012]. O ponteiro e a trava de um envio por vez
vivem numa linha por Projeto, `apps.app`, travada como `company_database` na 7: um índice parcial
prenderia um envio morto. O registro é 0043 (a 8 toma 0041 e 0042).

**Encaixes da etapa 8** (https://github.com/developmentconexus-ops/conexus/pull/96, em `ea04210`),
conferidos quando a 8 entrar; se um faltar, a construção para:

F1, `checkAppCall` devolve `{caller}` (a 9 acrescenta `version`, `database`). F2,
`env.DISPATCHER.get(nome, props, {outbound})`, o Hub só por `src/hub.ts`. F3, `AppProps = {caller}`.
F4, o exemplo atende o Projeto sem versão. F5, `host_label` anulável. F6, `limits.cpu_ms` 50 e o
`wrangler` de 0041. F7, o esquema `apps` e seus grants. F8, segredos do despachante só no ambiente da
chamada (0042). F9, Projeto apagado: 404 antes do Worker.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | 0043 e a prova; 0022 substituído | `docs/` | testes | cloudflare:wrangler, cloudflare:workers-best-practices, neon:neon-postgres | a 8 em `main` |
| U2 | Tabelas, políticas, grants (PR próprio) | migrações | dados | neon:neon-postgres | U1, D11 |
| U3 | Contrato v1, manifesto, executor, Recados | `app-contract`, `tests/apps/`, `scripts/` | segurança | cloudflare:workers-best-practices | U1 |
| U4 | Adaptadores e o envio | servidor, `hub-api` | dados | fastify-best-practices, neon:neon-postgres | U2, U3 |
| U5 | Voltar, poda, apagar, reparo | servidor | dados | neon:neon-postgres | U4, P2 |
| U6 | O despachante entrega `db` | `apps/edge/` | segurança | cloudflare:workers-best-practices, cloudflare:wrangler | contrato de U4 |
| U7 | As telas | web | web | shadcn | contrato de U4 |
| U8 | Chave, Release, ensaio, percurso | `.github/`, `infra/`, `docs/how-to/`, `tests/e2e/` | testes | cloudflare:wrangler | U5–U7, P1 |

U2 e U3 correm juntas; U6 e U7 depois do contrato de U4. Uma revisão, um merge (L9, L13); a prova
não cria release (L17).

**Orçamento de código alterado** (sem testes nem gerados): U1 0; U2 220; U3 450; U4 600; U5 350; U6
250; U7 400; U8 150; espalhados 100. Total **2.520**, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0043 "proposed" antes da prova; Result com versões; 0022 "Superseded"; nada `cx-prova-` vivo | os registros | must |
| 2 | U2 | Colunas, restrições, políticas, grants; catálogo igual ao arquivo | `catalog.test.ts` | must |
| 3 | U2 | Uma empresa não lê nem grava versão, arquivo ou `apps.app` de outra | `isolation.test.ts` | must |
| 4 | U3 | O schema do executor recusa operação sem forma, `contract` ≠ 1, caminho com `..`, campo a mais | `manifest.test.ts` | must |
| 5 | U3 | Entrada fora da forma: 400; saída fora: 500 sem o valor; operação desconhecida: 404 | `runtime.test.ts` | must |
| 6 | U3 | `app:pack` monta `recados-1` e `recados-2`, aceitos; o Recados roda em Node com `db` falso | `pack.test.ts` | must |
| 7 | U4 | `createAppVersion`, dono e administrador: 201, no ar; membro, outra empresa, Projeto apagado: a mesma 404 (S10); sem sessão: 401 | `versions.test.ts` | must |
| 8 | U4 | Mesma chave: a mesma versão; outro corpo: 409 `IDEMPOTENCY_CONFLICT`; dois juntos: 201 e 409 `APP_VERSION_SENDING` | idem, barreira (C65) | must |
| 9 | U4 | Pasta recusada: 422; acima dos tetos: 413, sem ler o resto | idem | must |
| 10 | U4 | Neon ou Cloudflare fora: 502 `APP_VERSION_FAILED`, a versão "falhou", o ponteiro igual; migração que falha: 422, sem SQL em resposta ou registro | idem, dublês (T14) | must |
| 11 | U4 | Login do app por SQL, sem `neon_superuser`; envio repetido após corte acha login e esquema e não migra duas vezes | `app-database.test.ts` | must |
| 12 | U4 | `checkAppCall`: `version`, `database` com versão; `{example: true}`, `null` sem | `app-handoff.test.ts` | must |
| 13 | U5 | `setLiveVersion`: 200, a chamada seguinte já usa; podada ou de outro Projeto: 404; durante envio: 409; membro: 404 | `live-version.test.ts` | must |
| 14 | U5 | Na sexta versão ficam a do ar e as 3 mais novas; Workers e arquivos das outras saem; "falhou" sai no próximo envio certo | `prune.test.ts` | must |
| 15 | U5 | Apagar Projeto: Workers, esquema, logins antes das linhas; cortado, repete; apagar a empresa leva os Workers | `projects-delete.test.ts`, `client-deletion.test.ts` | must |
| 16 | U5 | Ao subir, Worker e login que faltam são recriados dos arquivos do Hub; Cloudflare fora: sobe e registra (P2 A) | `repair.test.ts` | must |
| 17 | U6 | `props` só `caller`, `db`; `query` e `batch` com o login derivado; a senha fora de `props`, resposta e registro; erro do PostgreSQL só com código | `db.test.ts` | must |
| 18 | U6 | Versão sem Worker: a 502 da 8 e `APP_VERSION_MISSING`; sem versão: o exemplo | `dispatcher.test.ts` | must |
| 19 | U7 | Cada célula da matriz; Configurações só a dono e administrador; T23 | testes de U7, navegador | must |
| 20 | U8 | Tirar uma proteção de `removals.json` faz seu teste falhar | `npm run removals` | must |
| 21 | U8 | O roteiro em Node, Hub real, dublês de Neon e Cloudflare | `tests/e2e/versions.test.ts` | must |
| 22 | U8 | Publicado: passos 1 a 5; um app de ataque, pelo `db`, recusado em outro esquema e outra empresa; restaurar a Empresa A e reiniciar devolve o app com os dados do minuto | firstmate (T13, T14) | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Projeto | o da 8; **Configurações** a dono e administrador | 7 | 7 | 7 | — |
| Versões | "Nenhuma versão enviada. O endereço mostra o app de exemplo." | `Skeleton` | 503, **Tentar de novo** | `NotFound` | — |
| Enviar versão | a pasta: nome, arquivos, tamanho | "Enviando a versão…" | 422, 413 com o que corrigir; 502 "A versão não entrou." e **Tentar de novo** | `NotFound` | 409 "Já tem uma versão sendo enviada neste Projeto."; corte: a mesma versão |
| A lista | número, data, quem enviou, "no ar", "Falhou" e o motivo | — | — | — | — |
| Voltar para esta | "Os dados ficam como estão." | "Voltando…" | 503 | podada: 404, relê | trocada antes: relê |
| App | sem versão, o exemplo | — | as da 8 | as da 8 | as da 8 |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Project.mayManageVersions` | admissão | Projeto, Configurações |
| `AppVersion {id, number, state, failure, sentBy, createdAt, live}` | envio, poda | lista |
| `createAppVersion {manifest, files: [{path, mediaType, base64}]}` | tela; o Builder pela porta | Hub |
| `setLiveVersion {versionId}` | tela | Hub |
| `AppCall.version`, `AppCall.database` | `checkAppCall` | despachante |
| `AppProps.db` | despachante | app |

Falhas novas (C48), USER e settles salvo dito: `APP_VERSION_INVALID` 422, "A pasta não é uma
versão do Conexus." / "Escolha a pasta montada pelo app."; `APP_VERSION_TOO_LARGE` 413, "A versão
passa de 10 MB ou de 1.000 arquivos."; `APP_VERSION_SENDING` 409, "Já tem uma versão sendo
enviada neste Projeto." / "Espere ela terminar."; `APP_VERSION_FAILED` 502, THIRD_PARTY, RETRY,
"A versão não entrou."; `APP_MIGRATION_FAILED` 422, "Uma migração do app falhou no banco.";
`APP_VERSION_NOT_FOUND` 404. `APP_VERSION_MISSING`: só registro, no despachante.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Transação 1: arquivos, versão, trava | `apps.app` travada: 409; vencida, a anterior "falhou" | rollback | banco: 503 | `APP_VERSION_RECEIVED` | 7–9 |
| Login e esquema | a trava | conferidos antes; a senha derivada é a mesma | Neon: 502 | `APP_DATABASE_READY` | 10, 11 |
| Migrações do app | a trava | uma transação, com o registro delas | Neon: 502 | `APP_MIGRATION_FAILED` | 10, 11 |
| Worker `v-<id>` | a trava | `PUT` repete; sessão nova após 1 hora | Cloudflare: 502 | `APP_VERSION_UPLOADED` | 10 |
| Transação 2: no ar, poda marcada | a trava | rollback; a trava vence | banco: 503 | `APP_VERSION_LIVE` | 7, 14 |
| Poda | a trava | 404 conta como apagado; repete | fica marcada | `APP_VERSION_PRUNED` | 14 |
| `setLiveVersion` | a trava; envio: 409 | rollback | banco: 503 | `APP_VERSION_LIVE` | 13 |
| Apagar Projeto, empresa | fases da 7 | marcado, repete | fica "apagando" | `PROJECT_APP_DELETED` | 15 |
| Reparo ao subir | uma passagem | o próximo início repete | registra; sobe | `APP_REPAIRED`, `APP_REPAIR_FAILED` | 16 |
| `APP_LOGIN_KEY` no despachante | `concurrency` | a anterior segue | o Release falha | `wrangler`, sem a chave | 22 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Versões e ponteiro | nova | `hub/apps/versions.ts` | — | versão imutável e ponteiro (ToolJet `app.entity.ts:58-59`); estados de `served.ts:46-53` como especificação |
| Fechamento do envio | nova | `hub/apps/send.ts` | — | ficha 3.5 como regra: morte no meio não deixa versão nem ponteiro |
| Manifesto e executor | nova | `app-contract/src/manifest.ts`, `runtime.ts` | Zod de verdade | vocabulário de formas (`server-manifest.ts:304-346`); seus testes como especificação |
| `db` | nova | `apps/edge/src/db.ts` | — | stub por `ctx.exports` (D9, propósito) |
| Adaptadores | novas | `platform/cloudflare.ts`, `company-postgres.ts` | — | C56 |
| Recados, telas | novas | `tests/apps/recados/`, `web/src/hub/apps/` | — | — |

**A medida do transplante.** `registry` (3.5, 197 linhas "com consertos") e manifesto (3.20B, ~190)
mudam mais de um terço: escrita nova. Larga o servir de arquivos, a miniatura (C30) e o JSON em
base64.

**A dívida.** `statement_timeout` 5 s e `limits.cpu_ms` 50 valem até a 10.

## U1 Registro 0043 e a prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0043-app-logins-derived-from-one-key.md`, `index.md` | cria; a linha | U4–U6, `check-docs` |
| `0022`, `architecture.md` §5, §7, §11 | estado "Superseded by [0043]"; a chave, o reparo, os riscos 4 e 8 | `check-docs` |

### Os contratos que a unidade cria

0043: a senha de cada login de app é `HMAC-SHA-256(chave, nome do login)`, em base64url; a chave
vive no despachante e num arquivo do servidor; cada versão é um Worker `v-<id>` enviado pela API do
namespace. Criterion: (1) o login criado por SQL pelo HTTP do Neon não é membro de `neon_superuser`;
(2) `CREATE ROLE` após um corte: a conferência acha o login, a senha derivada entra; (3) o app 1 não
lê o esquema do app 2, nem o login de A entra em B; (4) Worker com arquivos pela API, de Node, e o
mesmo nome de novo, com tempos, de onde sai `CLOUDFLARE_DEADLINE_MS`; (5) o token Admin cria e apaga
Worker de app; (6) `ctx.exports.Db` como `props.db`; (7) a senha fora de resposta, registro e
`props`; (8) os tetos de 10 MB e 1.000 arquivos; (9) `secret put` pela entrada padrão. Fora: token
por Worker, carga. Se 3 falhar, a 9 volta ao fundador.

### A ordem do trabalho

PR só de documentos (L13). O Result fixa as versões de `@neondatabase/serverless` e do `wrangler`.
0022 muda só no estado, no PR do Result (proof, passo 3). Regras: L13, L21, T13, T14.

### Como se prova

1: os registros.

## U2 Tabelas, políticas e grants

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/`, `database-grants.sql`, `isolation.test.ts` | duas migrações; grants; caso “versões” | `migrate`, `catalog.test.ts` |
| `hub/apps/tables.ts`; `hub/projects/tables.ts` | cria; `host_label` NOT NULL, `company_database.host` | U4, U5 |
| `scripts/removals.json` | `version-company-policy`, `app-row-lock`, `blob-company-key` | `npm run removals` |

### Os contratos que a unidade cria

Esquema `apps`, not null salvo dito, com `company_id` e a política de [0039]: `app`
(`project_id` PK e FK; anuláveis `live_version_id`, `sending_version_id`, `claimed_until`;
`database_ready`); `app_version` (`id` PK, `project_id`, `number`, `state` `sending | ready |
failed`, `failure` código anulável, `manifest` jsonb, `sent_by`, `attempt_key`, `created_at`;
únicos `(project_id, number)`, `(project_id, attempt_key)`); `version_file` (`version_id` FK `ON
DELETE CASCADE`, `path`, `sha256`, `size`, `media_type`; PK `(version_id, path)`); `blob` (PK
`(company_id, sha256)`, `bytes` bytea, check do tamanho). `company_database.host` anulável.
`hub_runtime`: SELECT, INSERT, UPDATE, DELETE nas quatro; UPDATE(`host`).

### A ordem do trabalho

PR próprio, à espera da palavra (D11). D10 e D11 valem para o banco do Hub; os logins dos apps nascem
por SQL no banco da empresa, em tempo de execução ([0021], [0038]). Regras: D4–D7, D10–D12, D15, D17,
D18, D30, [0012], [0039]. Funções: drizzle-orm 1.0.0-rc.4 `pgSchema`, `customType` para `bytea` (a
conferir), `uniqueIndex`, `check`, `foreignKey`.

### Como se prova

2, 3: `npm run test -w @conexus/server`, `npm run migrations -- --base origin/main`.

## U3 O contrato, o manifesto, o executor e o Recados

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/` | `db.ts`, `manifest.ts`, `runtime.ts`, `limits.ts`; `AppProps` | edge, `hub-api`, `tests/apps` |
| `packages/hub-api/src/app-login.ts` | cria: nomes de login e esquema, a derivação | servidor, despachante |
| `tests/apps/recados/`, `scripts/app-pack.ts`, `package.json` | cria; `app:pack` | U8, e2e |

### Os contratos que a unidade cria

`Db = {query(text, values), batch(statements)}`. `AppProps = {caller, db}` (S4, [0019]). Manifesto v1,
`z.strictObject`: `{contract: 1, entry, operations: {nome: {input, output}}, migrations: [{id,
file}], assets}`; formas por união discriminada, `null` declarável. `APP_LIMITS`: 10 MB, 1.000
arquivos (C26). `serveApp({manifest, handlers})`: `POST /api/<operação>` vira `handler(input, {db,
caller})`; o resto, os arquivos. `appLogin(projectId)` → `{schema, runLogin, migrateLogin}`;
`appLoginPassword({key, login})` por Web Crypto, igual em Node e no Worker. A pasta: `manifest.json`,
`worker.js`, `assets/`, `migrations/`.

### A ordem do trabalho

Nada mutável no módulo (S5). `app:pack` monta o Worker com `wrangler deploy --dry-run --outdir`
(C75); `recados-2` muda só a cor. Regras: C21, C26, C27, S4, S5. Funções: zod 4.6.5
`z.strictObject`, `z.discriminatedUnion`; `crypto.subtle.importKey`, `sign`.

### Como se prova

4–6: `npm run test -w @conexus/app-contract`, `npm run test:scripts`.

## U4 Os adaptadores e o envio

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | `apps.ts`, `app-failures.ts`, `projects.ts`, `failures.ts`, `index.ts` | servidor, edge, web, OpenAPI |
| `hub/apps/` | `versions.ts`, `send.ts`, `app-database.ts`, `routes.ts`, `public.ts` | `main.ts`, projects |
| `hub/identity/auth.ts`, `admission.ts`; `hub/projects/` | `appVersion: ['create']` a dono e administrador; `manageAppVersions`; `mayManageVersions`; o host | apps |
| `platform/cloudflare.ts`, `company-postgres.ts`, `neon.ts`, `config.ts`; `main.ts` | criam; `ownerConnection`; `CLOUDFLARE_APPS_TOKEN_FILE`, `APP_LOGIN_KEY_FILE`, `CLOUDFLARE_ACCOUNT_ID`, `APPS_NAMESPACE` | `main.ts` |
| `package.json`, lock, `.dependency-cruiser.cjs` | `@neondatabase/serverless` só em `company-postgres.ts` | CI (L16) |
| `scripts/removals.json` | `send-admission`, `send-lock`, `send-size-first`, `login-not-superuser`, `migration-ledger` | `npm run removals` |

### Os contratos que a unidade cria

`createAppVersion`: POST `/api/companies/{companyId}/projects/{projectId}/versions`, `session`,
`Idempotency-Key`, limite de corpo próprio; 201 `{version}`. `listAppVersions`: GET no mesmo
caminho; 200 `{versions}`, limitada pela poda (C44). A porta `storeAppVersion({tx, admitted,
manifest, files, attemptKey})`, que o Builder chama na 14. `CloudflareApps`: `upload({worker, files,
tags, cpuMs})`, `remove`, `exists`. `CompanyPostgres`: `ensureApp`, `migrate`, `dropApp`, com a senha
do dono lida do SDK por operação, nunca guardada.

### A ordem do trabalho

1. Transação 1: `manageAppVersions` (S7, S8); Zod e tamanhos; `blob`, `version_file`,
   `app_version` "enviando", a trava. Regras: C27, C37, C59, C65, D15.
2. Sem transação (D22): o banco da empresa (`prepareDatabase` da 7) e o `host`; esquema e logins
   conferidos antes, `statement_timeout` 5 s, `search_path`; as migrações pelo login de migração; o
   Worker com `limits.cpu_ms` 50 e tags `company-<id>`, `project-<id>`. Regras: C50, C56, C57, S14,
   S36, S41.
3. Transação 2: no ar, a trava solta, a poda marcada. `checkAppCall` lê `apps.app` e o `host`.

### Como se prova

7–12: `npm run test -w @conexus/server`, PostgreSQL de teste como banco da empresa, Cloudflare dublê
(T5, T6, T10, T14, T19).

## U5 Voltar, poda, apagar e o reparo

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/apps/` | `live.ts`, `prune.ts`, `repair.ts`, `routes.ts`, `public.ts` | `main.ts`, projects |
| `hub/projects/projects.ts`, `company-deletion.ts`, `hub/operations/` | chamam a porta de apps | rotas, Central |
| `hub-api/src/apps.ts`; `main.ts` | `setLiveVersion`; o reparo após `listen` | web |
| `scripts/removals.json` | `live-same-project`, `prune-keeps-three`, `delete-workers-first` | `npm run removals` |

### Os contratos que a unidade cria

`setLiveVersion`: PUT `/api/companies/{companyId}/projects/{projectId}/live-version`, `session`,
`{versionId}`; 200 `{version}`; 404, 409. `deleteProjectApp`, `deleteCompanyApps` (C8).
`KEPT_OLD_VERSIONS = 3`.

### A ordem do trabalho

Voltar: uma transação, sem Cloudflare. Poda: ficam a do ar e as 3 `ready` mais novas; "falhou" mais
antiga que a do ar sai. Apagar: as fases da 7; Workers, `DROP SCHEMA … CASCADE` e `DROP ROLE`, depois
as linhas. Reparo (P2 A): uma passagem ao subir (arquitetura §8). Regras:
C8, C21, C30, C65, D13, D22, D27, S8.

### Como se prova

13–16: `npm run test -w @conexus/server`.

## U6 O despachante entrega `db`

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/`, `wrangler.jsonc` | cria `db.ts`; `dispatcher.ts`, `hub.ts`, `pages.ts`; `APP_LOGIN_KEY` | o runner |
| `apps/edge/package.json`, lock | `@neondatabase/serverless` de 0043 | CI (L16) |
| `scripts/removals.json` | `edge-db-own-login`, `edge-password-not-in-props`, `edge-db-error-code-only` | `npm run removals` |

### Os contratos que a unidade cria

`Db extends WorkerEntrypoint`; `ctx.exports.Db({props: {login, schema, host, database}})` em
`props.db`.

### A ordem do trabalho

A senha derivada por chamada; `neon()` para `query`, `transaction()` para `batch`. Regras: C27, C50, C56, C57, S4, S5, S36, S41.

### Como se prova

17, 18: `npm run test -w @conexus/edge`.

## U7 As telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/apps/` | `versions.tsx`, `send-version.tsx`, `queries.ts`, `public.ts`, testes | rotas |
| `hub/projects/project.tsx`; `routes/_app/companies/$companyId/projects/` | **Configurações**; cria `$projectId.settings.tsx` | roteador |
| `platform/test-hub.tsx` | respostas novas | testes |

### A ordem do trabalho

`<input type="file" webkitdirectory>` lido no navegador, enviado em JSON (S24), o tamanho conferido
antes com `APP_LIMITS`; voltar com `alert-dialog`. Regras: W1, W8–W13, W17, W21–W24, V29, V35, V39,
V55.

### Como se prova

19: `npm run test -w @conexus/web`; navegador real em 1366, 390 e 320 px, dois temas, teclado (T23).

## U8 A chave, o Release, o ensaio e o percurso

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `publish.yml`; `infra/compose.yaml`, `setup-server.sh` | a chave ao despachante pela entrada padrão; os arquivos novos; `recados-*.zip` no Release (P1 A) | Release |
| `docs/how-to/apps-edge.md`, `hub-company-databases.md` | o token, a chave e a cópia, restaurar uma empresa | firstmate |
| `tests/e2e/`, `package.json` | `versions.test.ts` | `npm run e2e` |

### Como se prova

20, 21: `npm run removals`, `npm run e2e`; 22 depois do Release. Regras: S31, S33, S36, T12–T14, T20.
