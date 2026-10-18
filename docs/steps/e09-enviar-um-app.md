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
5. Apague Pedidos: o aviso diz que o app, o banco e as versões vão junto. Recarregue o app: "Este
   app não existe."

**O que você faz, e quando.** Com a 8 publicada: autoriza aqui as chamadas da prova U1; cria o
token da prova (papel Admin dos Workers) e uma chave de prova do Neon na organização das empresas,
apagados no fim (a chave das empresas só existe no servidor). Antes de U2: a
palavra do grant (D11). Antes do Release: o token do Hub para os apps (papel Admin dos Workers) num
arquivo do servidor, separado do da 8; o firstmate gera no servidor a chave dos logins dos apps e lhe
entrega a cópia num arquivo, que você guarda fora do servidor. No fim: o roteiro e os textos.

**As chamadas da prova U1**, todas `cx-prova-`, apagadas no fim: na Cloudflare, um namespace, um
despachante em `workers.dev` com a chave por `wrangler secret put`, três Workers de app pela API; no
Neon, dois projetos pelo SDK, logins e esquemas por SQL. **Você autoriza também, depois do Release
(U8):** um app de ataque em `conexus-apps`, apagado no fim; restaurar a um minuto, no console do
Neon, o projeto da Empresa A, a empresa de teste: o que ela gravou depois desse minuto se perde.

**Decisões já dadas** (2026-10-18): 1A; 2, Versões nas Configurações; 3A; 4A; 5A; 6C, ficam a do ar
e as 3 anteriores; 7A; 8A, risco aceito. P1A: as pastas em zip na página da v0.9.0. P2A: "Reiniciar
o Hub" recria Workers e logins. P3A: só dono e administrador veem Versões; a que falhou gasta o
número e mostra "Falhou" até o próximo envio certo.

**O que muda.** O 0043 substitui o 0022 (4A), depois da prova. No mapa de telas das etapas 12 e
14, o "Versão 3 ▾" vai para **Configurações**; **Publicar** é da 17.

**Fica de fora.** App com defeito e os limites de execução (a 10); os 10 MB e 1.000 arquivos da 9
são só o teto do envio, com os números da prova. Recusar uma migração que a versão
antiga não aguenta (a 15). Preview (a 14). Publicar (a 17). Levar Apagar para Configurações (a 18).
As issues `next-card` 25, 39 e 45: nada nas pastas da 9.

**A decisão sua pedida nesta etapa.** Nenhuma pendente.

## O que mudou desde o estudo

Arquivos por `(empresa, SHA-256)` [0012]. Ponteiro e trava numa linha por Projeto, `apps.app`, como
`company_database` na 7. O Projeto ganha uma marca de apagar.

**Encaixes da etapa 8**, achados em https://github.com/developmentconexus-ops/conexus/pull/104
(`c9ff5b4`), conferidos de novo quando ela entrar; se um faltar, a construção para:

F1 `checkAppCall` dá `{caller}`; F2 `env.DISPATCHER.get(nome, props, {outbound})`, o Hub só por
`src/hub.ts`; F3 `AppProps = {caller}`; F4 o exemplo sem versão; F5 `host_label` anulável; F6
`limits.cpu_ms` 50 e o `wrangler` de 0041; F7 o esquema `apps`; F8 segredos por chamada (0042); F9
Projeto apagado: 404 antes do Worker.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | 0043 e a prova | `docs/` | testes | cloudflare:wrangler, neon:neon-postgres | a 8 em `main` |
| U2 | Tabelas e grants (PR próprio) | migrações | dados | neon:neon-postgres | U1, D11 |
| U3 | Contrato, executor, Recados | `app-contract`, `tests/apps/`, `scripts/` | segurança | cloudflare:workers-best-practices | U1 |
| U4 | Adaptadores e o envio | servidor, `hub-api` | dados | fastify-best-practices, neon:neon-postgres | U2, U3 |
| U5 | Voltar, poda, apagar, reparo | servidor | dados | neon:neon-postgres | U4, P2 |
| U6 | Despachante entrega `db` | `apps/edge/` | segurança | cloudflare:workers-best-practices, cloudflare:wrangler | contrato de U4 |
| U7 | Telas | web | web | shadcn | contrato de U4 |
| U8 | Chave, Release, ensaio, percurso | `.github/`, `infra/`, `docs/how-to/`, `tests/e2e/` | testes | cloudflare:wrangler | U5–U7, P1 |

U2 e U3 juntas; U6 e U7 após o contrato de U4. Uma revisão, um merge (L9, L13); a prova não cria
release (L17).

**Orçamento de código alterado** (sem testes nem gerados): U2 220; U3 450; U4 600; U5 350; U6 250;
U7 400; U8 150; espalhados 100. Total **2.520**, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | 0043 "proposed" antes da prova; Result com versões; 0022 "Superseded"; nada `cx-prova-` vivo | os registros | must |
| 2 | U2 | Catálogo igual ao arquivo | `catalog.test.ts` | must |
| 3 | U2 | Uma empresa não lê nem grava versão, arquivo ou app de outra | `isolation.test.ts` | must |
| 4 | U3 | O schema recusa operação sem forma, `contract` ≠ 1, campo a mais | `manifest.test.ts` | must |
| 5 | U3 | Entrada fora da forma: 400; saída fora: 500 sem o valor; operação desconhecida: 404 | `runtime.test.ts` | must |
| 6 | U3 | `app:pack` monta `recados-1`, `recados-2`, que rodam com `db` falso | `pack.test.ts` | must |
| 7 | U4 | `createAppVersion`, dono, administrador: 201; membro, outra empresa, Projeto apagado: 404 (S10); sem sessão: 401 | `versions.test.ts` | must |
| 8 | U4 | Mesma chave: a mesma versão; outro `digest`: 409 `IDEMPOTENCY_CONFLICT`; chave de versão podada: outra; dois juntos: 201, 409 | idem, barreira (C65) | must |
| 9 | U4 | 422: caminho com `..` ou absoluto, repetido, arquivo ausente ou a mais; 413 acima do teto, sem ler o resto | idem | must |
| 10 | U4 | Neon ou Cloudflare fora: 502, "falhou", ponteiro igual; migração que falha: 422, sem SQL | idem, dublês (T14) | must |
| 11 | U4 | Login por SQL; repetido após corte, acha login e esquema e não migra duas vezes | `app-database.test.ts` | must |
| 12 | U4 | `checkAppCall` com versão: `version`, `database`; sem: `{example: true}`, `null` | `app-handoff.test.ts` | must |
| 13 | U5 | `setLiveVersion`: 200, a chamada seguinte já usa; podada, outro Projeto, membro: 404; trava viva: 409; vencida: 200 | `live-version.test.ts` | must |
| 14 | U5 | Com a 5 no ar ficam 2 a 5; a 1 sai com Worker e arquivos; "falhou" sai no próximo envio certo; arquivo de outro Projeto no mesmo instante fica | `prune.test.ts`, barreira | must |
| 15 | U5 | Apagar: a marca dá 404 nas leituras e na checagem; Workers, esquema, logins antes das linhas; trava viva: 409; envio vencido vê a marca e apaga seu Worker | `projects-delete.test.ts`, `client-deletion.test.ts` | must |
| 16 | U5 | Ao subir: Workers que faltam e esquema, logins, migrações da do ar, recriados; "enviando" vencida vira "falhou"; apagar marcado termina; Cloudflare fora: sobe | `repair.test.ts` | must |
| 17 | U6 | `props` só `caller`, `db`; login derivado; a senha fora de `props`, resposta, registro; erro só com código | `db.test.ts` | must |
| 18 | U6 | Versão sem Worker: a 502 da 8; `APP_VERSION_MISSING` se U1 (12) achar erro estável, senão `EDGE_APP_FAILED`; sem versão: o exemplo | `dispatcher.test.ts` | must |
| 19 | U7 | Cada célula da matriz; T23 | navegador | must |
| 20 | U8 | Cada linha nova de `removals.json`: `caught` | `removals` | must |
| 21 | U8 | O roteiro com Hub real e dublês | `tests/e2e/versions.test.ts` | must |
| 22 | U8 | Publicado: passos 1 a 5; ataque recusado em outro esquema e outra empresa; restaurar a Empresa A e reiniciar devolve o app do minuto | firstmate (T13, T14) | must |
| 23 | U4 | Logins do app 1 no esquema do app 2, ler e gravar: 42501. Outra empresa é outro projeto Neon: U1 (3) e o 22 | `app-database.test.ts` | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Projeto | o da 8; **Configurações** a dono e administrador | 7 | 7 | 7 | — |
| Versões | "Nenhuma versão enviada. O endereço mostra o app de exemplo."; cada uma: número, data, quem, "no ar", "Enviando…" ou "Falhou" e o motivo | `Skeleton` | 503, **Tentar de novo** | `NotFound` | — |
| Enviar versão | a pasta: nome, arquivos, tamanho | "Enviando a versão…" | 422, 413, 502 e **Tentar de novo** | `NotFound` | 409; corte: a mesma versão |
| Voltar para esta | "Os dados ficam como estão." | "Voltando…" | 503 | podada: 404, relê | 409; trocada antes: relê |
| Apagar Projeto | o aviso, com o app, o banco e as versões | 7 | 7 | 7 | 409 |
| App | sem versão, o exemplo | — | as da 8 | as da 8 | as da 8 |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Project.mayManageVersions` | admissão | Projeto, Configurações |
| `AppVersion {id, number, state, failure, sentBy, createdAt, live}` | envio, poda | lista |
| `app_version.manifest`; `app.database_ready` | envio | reparo, poda; envio, `checkAppCall` |
| `createAppVersion {manifest, files: [{path, mediaType, base64}]}` | tela; o Builder pela porta | Hub |
| `setLiveVersion {versionId}` | tela | Hub |
| `AppCall.version` `{worker}` ou `{example: true}`; `AppCall.database` `{host, database, login, schema}` ou `null` | Hub | despachante |
| `AppProps.db` | despachante | app |

Falhas novas (C48), USER e settles salvo dito: `APP_VERSION_INVALID` 422, "A pasta não é uma
versão do Conexus." / "Escolha a pasta montada pelo app."; `APP_VERSION_TOO_LARGE` 413, "A versão
passa de 10 MB ou de 1.000 arquivos."; `APP_VERSION_SENDING` 409, "Já tem uma versão sendo
enviada neste Projeto." / "Espere ela terminar."; `APP_VERSION_FAILED` 502, THIRD_PARTY, RETRY,
"A versão não entrou."; `APP_MIGRATION_FAILED` 422, "Uma migração do app falhou no banco." / "Corrija e envie de novo."; `APP_VERSION_NOT_FOUND` 404, "Essa versão não existe mais."
"Falhou" é final: **Tentar de novo** é um envio novo. `APP_VERSION_MISSING`: só registro.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Transação 1: `apps.app`, `blob` por `ON CONFLICT DO UPDATE`, versão | trava viva: 409; vencida: a anterior "falhou" | rollback | banco: 503 | `APP_VERSION_RECEIVED` | 7–9 |
| Fora: `prepareDatabase`, `host` numa transação curta; login, esquema, migrações | a trava | conferidos antes; migração e registro numa transação | Neon: 502 | `APP_DATABASE_READY` | 10, 11, 23 |
| Worker `v-<id>` | a trava | `PUT` repete; sessão nova após 1 hora | Cloudflare: 502 | `APP_VERSION_UPLOADED` | 10 |
| Transação 2: dona da trava, sem marca; no ar | a trava | rollback; vencida ou marcada: "falhou", o Worker sai | banco: 503 | `APP_VERSION_LIVE` | 7, 14, 15 |
| Poda: Workers, linhas, `blob` sem dono | a trava; `blob` reusado: 23503, fica | 404 é apagado; repete | fica `pruning` | `APP_VERSION_PRUNED` | 14 |
| `setLiveVersion` | a trava; envio: 409 | rollback | banco: 503 | `APP_VERSION_LIVE` | 13 |
| Apagar: trava e marca; Workers, esquema; linhas | trava viva: 409 | marcado; o reparo termina | fica marcado | `PROJECT_APP_DELETED` | 15, 16 |
| Reparo ao subir | uma passagem | o próximo repete | registra; sobe | `APP_REPAIRED`, `APP_REPAIR_FAILED` | 16 |
| `APP_LOGIN_KEY` no despachante | `concurrency` | a anterior segue | o Release falha | `wrangler`, sem a chave | 22 |
| `db.query`, `db.batch` | o PostgreSQL | uma transação cada | Neon: 502 | código | 17 |
| Migrações do Hub | `migrate` (D9) | uma transação | falha | código | 2 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Versões e ponteiro | nova | `hub/apps/versions.ts` | — | ToolJet `app.entity.ts:58-59`; `served.ts:46-53` como especificação |
| Envio | nova | `hub/apps/send.ts` | — | ficha 3.5: morte no meio não deixa ponteiro |
| Manifesto, executor | nova | `app-contract/src/` | Zod | formas de `server-manifest.ts:304-346`, seus testes |
| `db` | nova | `apps/edge/src/db.ts` | — | stub por `ctx.exports` (D9, propósito) |
| O resto | novas | `platform/`, `tests/apps/`, `web/` | — | C56 |

**A medida do transplante.** `registry` (3.5) e manifesto (3.20B) mudam mais de um terço: escrita
nova.

**A dívida.** `statement_timeout` 5 s e `limits.cpu_ms` 50 até a 10.

## U1 Registro 0043 e a prova

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0043-app-logins-derived-from-one-key.md`, `index.md` | cria | U4–U6 |
| `0022`, `architecture.md` §5, §7, §11 | "Superseded by [0043]"; chave, reparo, riscos | `check-docs` |

### Os contratos que a unidade cria

0043: a senha de cada login de app é `HMAC-SHA-256(chave, nome do login)` em base64url, com a chave
no despachante e num arquivo do servidor; cada versão é um Worker `v-<id>` enviado pela API.
Criterion: (1) login por SQL pelo HTTP, fora de `neon_superuser`; (2) após um corte, o login achado
e a senha derivada entra; (3) app 1 não lê o esquema do app 2, nem A entra em B; (4) Worker com arquivos pela API, duas vezes, com tempos (`CLOUDFLARE_DEADLINE_MS`), da pasta de
`--dry-run --outdir`; (5) o token Admin cria e apaga; (6) `ctx.exports.Db` como
`props.db`; (7) a senha fora de resposta, registro e `props`; (8) os números do teto do envio; (9)
`secret put` pela entrada padrão; (10) `bytea` no Drizzle instalado; (11) uma migração de vários
comandos, um defeituoso no meio, por `transaction()`: nada aplicado, nem o registro; (12) arquivo
estático servido sem binding; o erro de Worker ausente. Se 3 ou 11 falhar, a 9
volta ao fundador.

### A ordem do trabalho

PR só de documentos (L13). O Result fixa `@neondatabase/serverless` e `wrangler`; 0022 muda só no
estado (proof, passo 3). Regras: L13, L21, T13, T14.

### Como se prova

1: os registros.

## U2 Tabelas, políticas e grants

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/`, `database-grants.sql`, `isolation.test.ts` | migrações; grants; caso “versões” | `migrate`, `catalog.test.ts` |
| `hub/apps/tables.ts`; `hub/projects/tables.ts` | cria; `project.deleting_since`, `company_database.host`; `project_of_host` | U4, U5 |
| `scripts/removals.json` | `version-company-policy`, `blob-company-key` | `npm run removals` |

### Os contratos que a unidade cria

Esquema `apps`, not null salvo dito, `company_id` e política [0039]: `app`
(`project_id` PK e FK; anuláveis `live_version_id`, `sending_version_id`, `claimed_until`;
`database_ready`); `app_version` (`id` PK, `project_id`, `number`, `state` `sending | ready |
failed | pruning`, `failure` código anulável, `manifest` jsonb, `digest`, `sent_by`, `attempt_key`, `created_at`;
únicos `(project_id, number)`, `(project_id, attempt_key)`); `version_file` (`version_id` FK `ON
DELETE CASCADE`; `sha256` FK a `blob`, restrita; `path`, `size`, `media_type`; PK `(version_id, path)`); `blob` (PK
`(company_id, sha256)`, `bytes` bytea, check do tamanho). `company_database.host` anulável.
`projects.project.deleting_since` anulável, escrito por `deleteProject`, lido pelas leituras de
Projetos, `project_of_host` (mesma assinatura, D13), a transação 2 e o reparo.
`hub_runtime`: SELECT, INSERT, UPDATE, DELETE nas quatro; UPDATE(`host`), UPDATE(`deleting_since`).

### A ordem do trabalho

PR próprio, à espera da palavra (D11). O 0043 registra: D10 e D11 valem para o banco do Hub; os
logins dos apps nascem por SQL no banco da empresa ([0021], [0038]).
`host_label` fica anulável: um Projeto da 7.x voltada numa empresa sem apelido não tem endereço. Regras: D4–D7, D10–D12, D13, D15,
D17, D18. Funções: drizzle-orm 1.0.0-rc.4 `customType` (`bytea`), `uniqueIndex`, `check`.

### Como se prova

2, 3: `npm run test -w @conexus/server`.

## U3 O contrato, o manifesto, o executor e o Recados

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/` | `db.ts`, `manifest.ts`, `runtime.ts`, `limits.ts`; `AppProps` | edge, `hub-api`, `tests/apps` |
| `packages/hub-api/src/app-login.ts` | cria: nomes de login e esquema, a derivação | servidor, despachante |
| `tests/apps/recados/`, `scripts/app-pack.ts`, `package.json` | `app:pack` | U8, e2e |

### Os contratos que a unidade cria

`Db = {query(text, values), batch(statements)}`; `AppProps = {caller, db}` (S4). Manifesto v1,
`z.strictObject`: `{contract: 1, entry, operations: {nome: {input, output}}, migrations: [{id,
statements}], assets}`, um comando por item, para `transaction()` aplicar cada migração inteira; formas por união discriminada, `null` declarável. `APP_LIMITS`: 10 MB, 1.000
arquivos (C26). `serveApp({manifest, handlers})`: `POST /api/<operação>` vira `handler(input, {db,
caller})`; os arquivos estáticos a plataforma serve antes do Worker, sem binding [0018].
`APP_COMPATIBILITY_DATE`, uma por versão do contrato: o dia em que o contrato 1 entra. `appLogin(projectId)` → `{schema, runLogin, migrateLogin}`;
`appLoginPassword({key, login})`, Web Crypto. A pasta: `manifest.json`, `worker.js`, `assets/`.

### A ordem do trabalho

`app:pack` monta o Worker com `wrangler deploy --dry-run --outdir`
(C75); `recados-2` muda só a cor. Regras: C21, C26, C27, S4, S5. Funções: zod 4.6.5
`z.strictObject`, `z.discriminatedUnion`; `crypto.subtle.sign`.

### Como se prova

4–6: `npm run test -w @conexus/app-contract`.

## U4 Os adaptadores e o envio

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | `apps.ts`, `app-failures.ts`, `projects.ts`, `failures.ts` | servidor, edge, web |
| `hub/apps/` | `versions.ts`, `send.ts`, `app-database.ts`, `routes.ts`, `public.ts` | `main.ts`, projects |
| `hub/identity/auth.ts`, `admission.ts`; `hub/projects/` | `appVersion: ['create']` a dono e administrador; `manageAppVersions` (listar, enviar, voltar); `mayManageVersions` | apps |
| `platform/cloudflare.ts`, `company-postgres.ts`, `neon.ts`, `config.ts`; `main.ts` | criam; `ownerConnection`; `CLOUDFLARE_APPS_TOKEN_FILE`, `APP_LOGIN_KEY_FILE`, conta, namespace | `main.ts` |
| `package.json`, lock, `.dependency-cruiser.cjs` | `@neondatabase/serverless` só em `company-postgres.ts` | CI (L16) |
| `scripts/removals.json` | `send-admission`, `send-lock`, `login-not-superuser`, `migration-ledger`, `app-schema-isolated` | `npm run removals` |

### Os contratos que a unidade cria

`createAppVersion`: POST `/api/companies/{companyId}/projects/{projectId}/versions`, `session`,
`Idempotency-Key`, corpo até 14 MB; 201 `{version}`. `listAppVersions`: GET no mesmo caminho; 200
`{versions}`, limitada pela poda (C44). A porta `storeAppVersion({tx, admitted,
manifest, files, attemptKey})`, do Builder na 14. `CloudflareApps`: `upload({worker, mainModule,
compatibilityDate, files, tags, cpuMs})`, `remove`, `exists`. `CompanyPostgres`: `ensureApp`,
`migrate`, `dropApp`, com a senha do dono lida do SDK por operação, nunca guardada; os comandos vão a
`SqlTransport.transaction(statements)`: `neon()` no programa, `pg` no PostgreSQL de teste (T19), e U1
(11) prova o HTTP. `SEND_CLAIM_MS` soma `NEON_PREPARE_BUDGET_MS`, duas vezes `NEON_CALL_BUDGET_MS`,
`CLOUDFLARE_DEADLINE_MS` e uma margem. `digest`: SHA-256 do manifesto e dos arquivos (C37). Sem os arquivos, não sobe (C67).

### A ordem do trabalho

1. Transação 1: admissão (S7); Zod e tamanhos; `blob`, `version_file`, `app_version`, a trava.
   Regras: C27, C37, C59, C65, D15.
2. Sem transação (D22): `prepareDatabase` e o `host`; esquema e logins conferidos antes,
   `statement_timeout` 5 s, `search_path`; migrações pelo login de migração; o Worker com
   `limits.cpu_ms` 50 e tags `company-<id>`, `project-<id>`. Regras: C50, C56, C57, S14,
   S36, S41.
3. Transação 2: confere a admissão, a trava ainda sua e a marca de apagar (S8); no ar, a trava
   solta, a poda marcada.

### Como se prova

7–12, 23: `npm run test -w @conexus/server`, o banco da empresa no PostgreSQL de teste pelo
transporte `pg`, Cloudflare dublê (T5, T10, T14).

## U5 Voltar, poda, apagar e o reparo

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/apps/` | `live.ts`, `prune.ts`, `repair.ts`, `routes.ts`, `public.ts` | `main.ts`, projects |
| `hub/projects/`, `hub/operations/` | apagar chama a porta de apps | rotas, Central |
| `hub-api/src/apps.ts`; `main.ts` | `setLiveVersion`; reparo | web |
| `scripts/removals.json` | `live-same-project`, `prune-keeps-three`, `delete-workers-first` | `npm run removals` |

### Os contratos que a unidade cria

`setLiveVersion`: PUT `/api/companies/{companyId}/projects/{projectId}/live-version`, `session`,
`{versionId}`; 200 `{version}`. `deleteProjectApp`, `deleteCompanyApps` (C8).
`KEPT_OLD_VERSIONS = 3`.

### A ordem do trabalho

Voltar: uma transação. Poda: ficam a do ar e as 3 `ready` mais novas entre as outras;
as "falhou" saem quando outra fica no ar; `blob` sai um a um, e 23503 o mantém. Apagar: uma transação toma a trava (viva: 409) e marca; fora, Workers, `DROP SCHEMA … CASCADE`,
`DROP ROLE`; depois as linhas. Reparo (P2 A): uma passagem ao subir (arquitetura §8). Regras:
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

`Db extends WorkerEntrypoint`; `ctx.exports.Db({props: {login, schema, host, database}})`.

### A ordem do trabalho

`neon()`, `transaction()`. Regras: C27, C50, C56, C57, S4, S5, S36, S41.

### Como se prova

17, 18: `npm run test -w @conexus/edge`.

## U7 As telas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/apps/` | `versions.tsx`, `send-version.tsx`, `queries.ts`, `public.ts` | rotas |
| `hub/projects/project.tsx`; `routes/_app/companies/$companyId/projects/` | **Configurações**; cria `$projectId.settings.tsx` | roteador |
| `hub/projects/delete-project-dialog.tsx` | o aviso novo | Projeto |
| `platform/test-hub.tsx` | respostas novas | testes |

### A ordem do trabalho

`<input type="file" webkitdirectory>`, em JSON (S24), conferido com `APP_LIMITS`; `alert-dialog`. Regras: W1, W8–W13, W17, W21–W24, V29, V35, V39,
V55.

### Como se prova

19: `npm run test -w @conexus/web`; navegador em 1366, 390 e 320 px, dois temas, teclado (T23).

## U8 A chave, o Release, o ensaio e o percurso

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `publish.yml`; `infra/compose.yaml`, `setup-server.sh` | a chave ao despachante pela entrada padrão; os arquivos novos; `recados-*.zip` no Release (P1 A) | Release |
| `docs/how-to/apps-edge.md`, `hub-company-databases.md` | token, chave, cópia, rotação; restaurar uma empresa | firstmate |
| `tests/e2e/`, `package.json` | `versions.test.ts` | `npm run e2e` |

### Como se prova

20, 21: `npm run removals`, `npm run e2e`; 22 após o Release. Regras: S31, S33, S36, T12–T14.
