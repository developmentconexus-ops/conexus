# Etapa 2: Banco do Hub

## A página do fundador

**No fim desta etapa** você restaura o banco do Hub a um minuto que escolheu e vê, na página do
Hub, que o que veio depois sumiu. Depois vê o banco dormir no Neon e acordar quando o Hub é aberto.

**O roteiro de uso.**

1. Abra https://hub.conexus.fun. Abaixo da versão aparecem "Último início" e "Início anterior",
   com dia e hora de Brasília, por exemplo 14/10 14:02 e 14/10 13:40.
2. No GitHub, em Actions, rode "Reiniciar o Hub". Em até 2 minutos, recarregue: "Último início"
   passa à hora de agora, por exemplo 15:10, e "Início anterior" passa a 14:02.
3. No Neon, no projeto do Hub, abra Backup & Restore e restaure o banco a um minuto entre 14:02 e
   15:10, por exemplo 15:00. Rode "Reiniciar o Hub" de novo, como o procedimento manda depois de
   toda restauração. Recarregue: "Último início" é a hora de agora e "Início anterior" volta a
   14:02. O início das 15:10 sumiu com a restauração.
4. Em Branches, apague o ramo de cópia que a restauração criou (termina em `_old_` e uma data): o
   plano grátis aceita só dez ramos. Feche o Neon.
5. Não abra o Hub nem o Neon por dez minutos. Abra o Neon em Branches: o banco aparece "Idle".
6. Abra o Hub: responde com cerca de um segundo a mais, e as horas do passo 3.

**O que você faz, e quando.** No começo: aprova esta página. Antes do build, com o Firstmate te
guiando na hora: cria a organização do Neon no plano grátis e entrega uma chave dela, e uma chave
da Cloudflare só de Workers; as duas são apagadas no fim. Depois do merge, quando o Firstmate
pedir: no painel de firewall do provedor, abre a porta 22 para o endereço dele, e a fecha quando ele
avisar. No fim: faz o roteiro e diz o que viu.

**Fica de fora.** Entrar com e-mail e senha, e empresas: etapas 3 e 4. O banco do Mastra: etapa
12, onde o teste do banco dormindo roda de novo.

**A decisão sua pedida nesta etapa.** A regra dos dados diz que toda tabela do Hub tem a coluna
da empresa. A tabela dos inícios do Hub não é de empresa nenhuma, e nenhuma empresa existe.

- **A.** Tabelas da instalação (os inícios, e depois a concessão dos trabalhos agendados) ficam
  sem a coluna; a regra passa a valer para toda tabela com dado de uma empresa, e o guia é
  emendado no fechamento. Exemplo: a linha "v0.2.0 às 14:02" não diz empresa nenhuma.
- **B.** Toda tabela tem a coluna, e as da instalação gravam um valor fixo, "instalação".

**Resposta** (2026-10-14): "1. A 2. A com você me guiando na hora 3. A 4. A". A, sem a coluna; e
os três acessos como recomendados: a chave do Neon com o Firstmate guiando, a porta 22 aberta só
para a instalação das chaves, a chave da Cloudflare só de Workers.

**A lista de logins do banco**, que a regra dos dados manda passar pela sua palavra: um só, o do
Hub. Ele lê e grava os inícios e lê o registro das migrações, e não apaga nem muda nada. Ao aprovar
esta página, você aprova essa lista para a etapa inteira.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 Banco | O módulo do banco, `migrate`, a recusa de subir atrasado, o login, o banco de teste no CI, a parede do driver, as correções F1, F2, F4, F8 | `apps/server/src/`, `apps/server/migrations/`, `apps/server/` (raiz), `packages/hub-api/`, `.github/workflows/`, `scripts/`, raiz | dados | `node`, `neon:neon-postgres` | — |
| U2 Inícios | A tabela, a gravação na subida, `getStatus` e a página; a correção F3 | `apps/server/src/hub/status/`, `apps/server/src/` (`main.ts`, `platform/http.ts`), `apps/server/migrations/`, `packages/hub-api/`, `apps/web/` | web | `fastify-best-practices` | U1 |
| U3 Migrações no CI | A conferência das migrações e das travas de sessão | `scripts/`, `.github/workflows/`, raiz | dados | nenhuma | U1 |
| U4 Servidor | As chaves no Compose, `migrate` antes de subir, "Reiniciar o Hub", os procedimentos, a correção F5 | `infra/`, `.github/workflows/`, `docs/` | segurança | nenhuma | U1, U3 |
| U5 Provas | O 0037, o banco dormindo (0009), a verificação 3 do 0035 | nenhuma; contas do fundador | dados | `neon:neon-postgres`, `cloudflare:wrangler` | U1 a U4 no ar |

U2 e U3 correm em paralelo depois da U1; U4 vem depois da U3 (`.github/workflows/`); U5 segue a
ordem do fim.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `node src/main.ts` recusa subir num banco sem uma migração que traz: sai com 1 e `DATABASE_BEHIND`; sobe num banco com migrações a mais | `apps/server/src/boot.test.ts`, "atrasado" e "adiantado" | must |
| 2 | U1 | Com o banco inalcançável na subida, `main.ts` sai com 1 e `DATABASE_UNAVAILABLE` | `boot.test.ts`, "banco fora na subida" | must |
| 3 | U1 | `node src/main.ts migrate` duas vezes: a segunda não aplica nada; o login do Hub entra com a senha do seu arquivo, e outra senha recebe 28P01 | `apps/server/src/platform/migrate.test.ts` | must |
| 4 | U1 | `migrate` sem `HUB_MIGRATION_DATABASE_URL_FILE`, ou com arquivo que outros leem, sai com 1 e `CONFIG_INVALID` com o nome da variável | `boot.test.ts`, "migrate sem chave" | must |
| 5 | U1 | O catálogo depois de `migrate` é igual a `database-roles.json`; um papel, atributo ou concessão a mais é recusado; o login do Hub recebe 42501 em `DELETE` e DDL | `migrate.test.ts`, "catálogo", um caso plantado por recusa | must |
| 6 | U1 | Depois de uma leitura, o pool chega a zero conexões | `apps/server/src/platform/database.test.ts`: espera `whenIdle()` e conta `pg_stat_activity` | must |
| 7 | U1 | `npm run deps` recusa importar `pg` ou `drizzle-orm/node-postgres` fora de `platform/database.ts`, `platform/migrate.ts` e `platform/test-database.ts` | `scripts/rules.test.ts`, arquivo plantado | must |
| 8 | U1 | F1: um erro não tratado ou a porta ocupada deixa `INTERNAL_UNEXPECTED` com o tipo da causa e `code=EADDRINUSE`, e sai com 1; um sinal deixa `SHUTTING_DOWN` com o sinal | `boot.test.ts`, "porta ocupada", com a porta presa pelo teste | must |
| 9 | U1 | F2: o desligamento com pedido em curso espera eventos (`once(app.server, 'connection')`, gancho `preClose`), sem `setTimeout` (T20) | `apps/server/src/main.test.ts`, o caso de hoje | must |
| 10 | U1 | F4 e F8: a subida escreve `LISTENING`, sem endereço; `z4` passa a `withTraceId` | `main.test.ts` | must |
| 11 | U2 | `GET /api/status` responde 200 com `lastStart` e `previousStart`, cada um `RECORDED` com versão e hora, ou `NONE` | `apps/server/src/hub/status/status.test.ts`, corpo literal | must |
| 12 | U2 | Com o banco fora depois da subida, `GET /api/status` responde 503 `DATABASE_UNAVAILABLE` em `application/problem+json`, e `GET /api/health` continua 200 | `status.test.ts`, "banco fora": a URL aponta uma porta que o teste fechou | must |
| 13 | U2 | Uma linha fora do contrato é recusada na leitura: `GET /api/status` responde 500 `INTERNAL_UNEXPECTED`, e o log não traz o valor | `status.test.ts`, linha plantada pelo dono sem o `CHECK` | must |
| 14 | U2 | A página mostra os dois inícios em `America/Sao_Paulo`, `dd/MM HH:mm`; "Nenhum início gravado" para `NONE`; a frase da falha para 503 | `apps/web/src/hub/status/status-page.test.tsx`, um instante fixo | must |
| 15 | U2 | F3: `build.rolldownOptions`; o build emite `favicon.svg` sem hash | `apps/web/vite.config.test.ts`: `build()` do Vite numa pasta temporária, e o arquivo existe | must |
| 16 | U3 | `npm run migrations -- --base origin/main` recusa: uma migração da base alterada ou apagada; `DROP` ou `RENAME` sem a linha `-- contract:` e o motivo; uma colisão de `drizzle-kit check`; `pg_advisory_lock`, `pg_try_advisory_lock`, `SET SESSION` e `set_config(..., false)` no servidor | `scripts/check-migrations.test.ts`, um caso plantado por recusa e um `-- contract:` aceito | must |
| 17 | U4 | A publicação `v0.2.0`, antes de as chaves estarem no servidor, termina vermelha em `migrate` e v0.1.x continua respondendo (verificação 3 do 0035); com as chaves, o job reexecutado termina verde | Firstmate, ao vivo | must |
| 18 | U4 | "Reiniciar o Hub" roda `migrate` e muda "Último início" em até 2 minutos | Firstmate e o passo 2 do roteiro | must |
| 19 | U4 | "Voltar atrás" para v0.1.x, imagem sem o rótulo de migração, pula `migrate`, termina verde e mostra v0.1.x; "Voltar atrás" para v0.2.0 volta | Firstmate, ao vivo | must |
| 20 | U4 | O contêiner `hub` monta só `hub_database_url`; só o serviço `migrate` monta a chave do dono | Firstmate, `docker inspect` | must |
| 21 | U4 | Restaurar a um minuto entre dois inícios e rodar "Reiniciar o Hub": `lastStart` é o do reinício, `previousStart` o último antes do minuto, e o posterior ao minuto sumiu | Firstmate, antes do roteiro | must |
| 22 | U4 | Restaurar a antes da primeira migração: o Hub no ar responde 500 em `/api/status`; "Reiniciar o Hub" aplica as migrações e a página volta | Firstmate, pelo procedimento | must |
| 23 | U4 | F5: a imagem não define `NODE_ENV` | job `image` do CI; `docker inspect` | must |
| 24 | U5 | Dez minutos sem pedido, com o Neon fechado: "Idle"; o pedido seguinte responde, com o tempo de acordar medido ([0009](../decisions/0009-neon-free-plan-database-asleep.md)) | Firstmate e o passo 5 do roteiro | must |
| 25 | U5 | As seis verificações do [0037](../decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md) | Firstmate, fora do repositório | must |

Se a verificação 3, 4 ou 5 do 0037 falhar pela versão do PostgreSQL ou do driver, as etapas 7 a 10
são replanejadas antes da 3. Se o banco não dormir e a causa não puder sair, a etapa volta ao
fundador com as saídas do 0009. Os dois schemas do 0005 aparecem com a primeira tabela do Builder.

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Pool, transação, linhas e mapa de erros (`db.ts:164-232`, `313-345`) | Nova | `platform/database.ts` | — | Leitura só de leitura num instantâneo (D23). Toda linha conferida: pedido do fundador. Erro pelo código, nunca pela mensagem, que muda sem aviso. Ouvinte de erro do pool: na prova D4 o Hub caiu com a sessão |
| Recusa de subir atrasado (`lifecycle.ts:34-38`) | Nova | `platform/database.ts` | — | Um programa num banco atrasado erraria no primeiro pedido, e não na subida. O código de saída 78 sai: só "implementado assim" |
| Papel criado por SQL (`0001_baseline.sql:11-39`) | Nova | migração da U1 | — | Ignora papel já existente: papéis valem para o servidor inteiro, e os testes criam muitos bancos num só |
| Senha do login por arquivo (`provision-hub-roles.mjs`) | Nova | `platform/migrate.ts` | — | A senha mora num arquivo, e o dono a grava. Saem o literal na SQL (D20) e a sondagem antes de gravar (só "implementado assim") |
| `secret-file.ts` (15 linhas) | Trazida | `platform/secret-file.ts` | Importação `.ts`, o nome da variável no detalhe | Recusa arquivo que outros leem, ou vazio: um segredo legível por outro usuário já vazou |
| Recusa de transação aninhada, etiqueta `sql`, troca de papel, `sql-lexer.ts`, `connection-census.ts`, `session()`, trava de instância, aplicador próprio | Não entram | — | — | Sobras da troca de papel; trava de sessão recusada (D25); o Drizzle aplica numa transação |
| Recibos de repetição e `jobs.ts` | Fora desta etapa | — | — | Nada cria nem roda sozinho |

**A medida do transplante.** `secret-file.ts`: 15 linhas trazidas, cerca de 3 mudam, nenhum teste
antigo, menos de uma hora: abaixo de um terço. O resto é escrito de novo.

**A dívida.** C57 pede sinal de cancelamento, e `pg@8.23.1` não o aceita; os prazos limitam a
espera.

**As correções da etapa 1.** A auditoria do código da etapa 1, pedida pelo fundador em
2026-10-14, entra como correção (critérios 8 a 10, 15, 23). F6, as linhas 413 e 415, fica para o
primeiro `POST` (seção 11 da arquitetura). F7, o `handlerTimeout`, não entra: o `pg` não aceita
sinal, e os prazos do banco terminam a espera antes dos 30 s do pedido (C73).

## U1 Banco

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/database.ts`, `database.test.ts` | cria | `main.ts`, stores |
| `apps/server/src/platform/migrate.ts`, `migrate.test.ts` | cria | `main.ts` |
| `apps/server/src/platform/test-database.ts` | cria | testes do servidor |
| `apps/server/src/platform/secret-file.ts` | cria | `config.ts` |
| `apps/server/src/platform/config.ts` | muda | `main.ts`, `test-database.ts` |
| `apps/server/src/platform/failure.ts` | muda: o `code` do sistema na cadeia de causas | `main.ts`, `http.ts` |
| `apps/server/src/main.ts`, `main.test.ts` | muda | imagem, Compose, testes |
| `apps/server/src/boot.test.ts` | cria (`main.test.ts` está no limite de linhas) | `npm test` |
| `apps/server/drizzle.config.ts`, `apps/server/tsconfig.json` | cria; muda para incluí-lo | `drizzle-kit`, `typecheck` |
| `apps/server/migrations/<data>_hub_runtime_login/` | cria | `migrate.ts`, imagem |
| `apps/server/database-roles.json` | cria, ao lado da pasta das migrações, fora dela | `migrate.test.ts` |
| `docs/how-to/local-database.md` | cria: o PostgreSQL 18 descartável, por `docker run --rm` | desenvolvedores |
| `apps/server/package.json`, `package-lock.json` | muda: `drizzle-orm`, `pg`; dev `drizzle-kit`, `@types/pg` | npm, CI, imagem |
| `packages/hub-api/src/failures.ts` | muda | servidor, web |
| `.dependency-cruiser.cjs`, `scripts/rules.test.ts` | muda: a parede do driver; testes podem importar `platform/test-database.ts` | `npm run deps`, `test:scripts` |
| `.github/workflows/ci.yml` | muda: serviço PostgreSQL 18 por digest no job `test`, um dono sem superusuário, e as duas variáveis de teste; o how-to local as define igual | GitHub |
| `knip.json` | muda, se `drizzle.config.ts` pedir entrada | `npm run knip` |

### Os contratos que a unidade cria

- `readSecretFile(variable: string, path: string): string`; falha `CONFIG_INVALID` com `variable`.
- `config.ts`: `readConfig(env, mode: 'serve' | 'migrate'): Config`. Variáveis
  `HUB_DATABASE_URL_FILE` (sempre) e `HUB_MIGRATION_DATABASE_URL_FILE` (só `migrate`). `Config`
  ganha `databaseUrl: DatabaseUrl` e, em `migrate`, `migrationDatabaseUrl: DatabaseUrl`.
  `readTestDatabase(env): { ownerUrl: DatabaseUrl; runtimePassword: string }` lê
  `CONEXUS_TEST_DATABASE_URL` e `CONEXUS_TEST_RUNTIME_PASSWORD`, para C67 ter um só leitor.
- `database.ts`: `class DatabaseUrl`, com o valor em `#value` (C17). `openDatabase(deps: { url:
  DatabaseUrl; log: FailureLog }): Database`, congelado, com `read<T>(work: (tx: ReadTx) =>
  Promise<T>): Promise<T>`, `command<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>`,
  `whenIdle(): Promise<void>` e `close(): Promise<void>`; tipos `Database`, `ReadTx`, `CommandTx`.
  `assertMigrated(database: Database): Promise<void>`, falha `DATABASE_BEHIND`.
- `migrate.ts`: `migrate(deps: { ownerUrl: DatabaseUrl; runtimeUrl: DatabaseUrl }): Promise<void>`.
- `DatabaseUrl.parse(value: string): DatabaseUrl`; o valor só sai por `reveal()`, chamado só em
  `database.ts` e `migrate.ts`.
- `test-database.ts`, a porta dos testes para o banco: `createTestDatabase(t: TestContext):
  Promise<TestDatabase>`, com `TestDatabase = { database: Database; ownerUrl: DatabaseUrl;
  runtimeUrl: DatabaseUrl; asOwner(text: string, values?: unknown[]): Promise<void> }`, migrado e
  apagado no fim; `unreachableDatabaseUrl(t: TestContext): Promise<DatabaseUrl>`, uma porta presa e
  fechada pelo teste. A senha do login nos testes é fixa por execução, para suítes em paralelo.
- `main.ts`: `node src/main.ts migrate`, saída 0 ou 1; sem argumento, o servidor:
  `assertMigrated`, `listen`, depois a gravação da U2, para uma subida que falha não gravar início. `createHub(config, deps: { database:
  Database; webRoot?: string })`.
- `FAILURES`: `DATABASE_UNAVAILABLE` (`SYSTEM`, 503, "O banco do Conexus não respondeu.", "O erro
  foi registrado. Avise quem cuida do Conexus."); `DATABASE_BEHIND` (`SYSTEM`, 500, "O Conexus não
  iniciou porque falta uma migração no banco.", "Rode a migração e inicie de novo.").
- Pool: `connectionTimeoutMillis` 5000 (acordar levou menos de 1 s na prova D2), `query_timeout`
  15000, e os padrões `idleTimeoutMillis` 10000 e `min` 0.
- Papel `hub_runtime`: `LOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS`;
  `statement_timeout` 10 s, um terço dos 30 s do pedido; `idle_in_transaction_session_timeout` 10
  s, porque uma transação parada mantém o Neon acordado. Concessões: `USAGE` no schema `drizzle` e
  `SELECT` em `drizzle.__drizzle_migrations`.
- `drizzle.config.ts`: `dialect: 'postgresql'`, `schema: './src/**/tables.ts'`, `out:
  './migrations'`, `casing: 'snake_case'`; o `drizzle()` do programa usa o mesmo `casing`.
- `database-roles.json`: cada papel, com atributos e concessões. A U1 o cria com o papel e o registro;
  a U2 acrescenta as concessões de `hub.starts`. A lista inteira da etapa é a da página, aprovada com
  ela: é a palavra que D11 pede. Que ela entre no merge único da etapa (L13), e não num pull request
  próprio, é uma exceção a D11 que vai para a fila do método.

### A ordem do trabalho

1. `secret-file.ts`, `config.ts`. Regras: S31, C17, C67.
2. `database.ts`. Regras: D19, D21 a D25, D27, C52, C57. Funções: `drizzle-orm@1.0.0-rc.4`
   `drizzle({ client, casing })`, `db.transaction(work, { isolationLevel, accessMode })`;
   `pg@8.23.1` `Pool`, `pool.on('error')`, o evento `remove`. Erro do pool sem SQLSTATE, classe 08,
   57P01 a 57P03 e 57014 viram `DATABASE_UNAVAILABLE`; o resto, `INTERNAL_UNEXPECTED`.
3. A migração do papel, por `drizzle-kit@1.0.0-rc.4 generate --custom`, com `CREATE ROLE` num bloco
   que ignora `duplicate_object`. Regras: D5, D8, D10, D11, D12.
4. `migrate.ts`: `migrate(db, { migrationsFolder })` como dono; depois, numa transação própria, a
   senha do login tirada de `HUB_DATABASE_URL_FILE`, com `set_config(..., true)` ligado como
   parâmetro e `EXECUTE format('ALTER ROLE ... PASSWORD %L', current_setting(...))`. Regras: D9,
   D20, C64.
5. `assertMigrated`: `readMigrationFiles({ migrationsFolder })` contra `select name, hash` do
   registro, sem chamar `migrate`; tabela ausente conta como nada aplicado. Regra: D9.
6. `test-database.ts` e o serviço no CI. Regras: T19, T20.
7. As correções F1, F2, F4, F8. Regras: C50, C52, C53, C69, T20. Funções: `close-with-grace@2.5.0`
   (o `err` do callback, registrado por `logFailure`), `fastify@5.12.5` `listen({
   listenTextResolver })`, o gancho `preClose`.

### Como se prova

`npm test -w @conexus/server` num PostgreSQL 18; tirar `assertMigrated` faz o critério 1 falhar
(T12).

## U2 Inícios

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/status/tables.ts`, `store.ts` | cria | `drizzle-kit`; `status.ts` |
| `apps/server/src/hub/status/status.ts`, `public.ts`, `status.test.ts` | muda | `main.ts` |
| `apps/server/src/platform/http.ts` | muda: `serve` aceita tratador assíncrono | `main.ts`, `health.ts` |
| `apps/server/src/main.ts` | muda: grava o início antes de `listen` | imagem |
| `apps/server/migrations/<data>_hub_status_starts/`, `<data>_hub_status_grants/` | cria | `migrate.ts` |
| `apps/server/database-roles.json` | muda: as concessões de `hub.starts` | `migrate.test.ts` |
| `packages/hub-api/src/status.ts`, `index.ts` | muda | servidor, web |
| `apps/web/src/hub/status/status-page.tsx`, `status-page.test.tsx` | muda | `main.tsx` |
| `apps/web/vite.config.ts`, `vite.config.test.ts` | muda; cria | `vite`, `npm test -w @conexus/web` |

### Os contratos que a unidade cria

- `hub.starts`: `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `version text NOT NULL CHECK
  (version ~ '^v[0-9]+\.[0-9]+\.[0-9]+$')`, `started_at timestamptz NOT NULL DEFAULT now()`. A
  coluna da empresa: nenhuma, pela resposta A do fundador.
- Concessões: `USAGE` no schema `hub`, `SELECT, INSERT` em `hub.starts`.
- `Start = { state: 'RECORDED'; version: Version; startedAt: string } | { state: 'NONE' }`, com
  `startedAt` em RFC 3339 UTC; `HubStatus = { version: Version; lastStart: Start; previousStart:
  Start }`. Exportados por nome.
- `getStatus`: `GET /api/status`, `public`, 200 `HubStatus`, falhas `DATABASE_UNAVAILABLE`.
- `createStatus(deps: { version: Version; database: Database })`, congelado, com `recordStart():
  Promise<void>` e `read(): Promise<HubStatus>`.

### A ordem do trabalho

1. `tables.ts` com `pgSchema('hub')`; `drizzle-kit generate`; ler o SQL (D8); a migração das
   concessões. Regras: D4, D5, D8, D12, D15, D18.
2. `store.ts`: `insert`; `select ... orderBy(desc(id)).limit(2)`; cada linha conferida com
   `createSelectSchema` de `drizzle-orm/zod`, a hora lida como `Date` e enviada com `toISOString()`.
   Regras: D21, D22, C40.
3. `http.ts`, `main.ts`, a rota. Regras: C9, C28, C31, C41, C43.
4. Página: a hora por `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day, month,
   hour, minute })`. Regras: web W1, o guia de design para o texto.

### Como se prova

Critérios 11 a 15, pelos testes nomeados.

## U3 Migrações no CI

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `scripts/check-migrations.ts`, `check-migrations.test.ts` | cria | CI |
| `.github/workflows/ci.yml` | muda: o passo `npm run migrations`, só em pull request, como o de dependências novas | GitHub |
| `package.json` (raiz) | muda: o script `migrations` | CI |

### Os contratos que a unidade cria

`node scripts/check-migrations.ts --base <ref>`: sai com 1 e o motivo, nas recusas do critério 16.
Um `DROP` ou `RENAME` passa quando a migração traz a linha `-- contract: <motivo>` (D6, D13, D30).

### A ordem do trabalho

1. Arquivos alterados contra a base (D6, D7); `drizzle-kit check` (C78); a busca das travas e
   ajustes de sessão em `apps/server/src` (D25).

### Como se prova

`npm run test:scripts` (critério 16).

## U4 Servidor

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/compose.yaml` | muda: o segredo `hub_database_url` e `HUB_DATABASE_URL_FILE` no `hub`; o serviço `migrate`, em perfil próprio, com as duas chaves e `HUB_MIGRATION_DATABASE_URL_FILE` | `deploy.sh` |
| `infra/deploy.sh` | muda: `compose run --rm migrate` com prazo de 60 s antes de `up`, só para imagem com o rótulo de migração; o modo `--restart` | `publish.yml`, `rollback.yml`, `restart.yml` |
| `infra/hub.Dockerfile` | muda: rótulo `conexus.migrate=1`; sai `NODE_ENV` (F5) | `publish.yml`, job `image` |
| `.github/workflows/restart.yml` | cria: "Reiniciar o Hub", grupo `hub-server` | o fundador |
| `.github/workflows/ci.yml` | muda: o job `image` falha se a imagem define `NODE_ENV` (F5) | GitHub |
| `scripts/setup-server.test.ts` | muda, se o Compose que ele lê mudar | `test:scripts` |
| `docs/how-to/hub-server.md` | muda: as chaves, dono uid 1000, modo 0400; "Reiniciar o Hub" | Firstmate |
| `docs/how-to/hub-database-restore.md` | cria, em português | o fundador |
| `docs/architecture.md` | muda: na seção 11, a chave do dono em repouso no servidor e a dívida de C57 | leitores |
| `docs/index.md` | muda | `check-docs` |

### Os contratos que a unidade cria

- No servidor: `/etc/conexus/secrets/hub_database_url` e `hub_migration_database_url`, dono uid
  1000, modo 0400.
- `deploy.sh <imagem>` e `deploy.sh --restart`; `migrate` falhou, o Hub atual fica.
- `restart.yml`: `workflow_dispatch` sem entrada, no executor `[self-hosted, hub]`.
- A chave do dono em repouso não é risco novo para S47: o root do servidor já lê tudo, aceito com
  gatilho pelo [0035](../decisions/0035-publish-through-a-runner-on-the-server.md), que a linha da
  seção 11 cita.

### A ordem do trabalho

1. Compose e Dockerfile. Regras: S31, S36, S37.
2. `deploy.sh`. Regras: C60, C64, D9.
3. `restart.yml`. Regra: 0035.
4. Procedimentos. Restaurar: escolher o minuto, restaurar, rodar "Reiniciar o Hub" (a senha volta à
   do arquivo e as migrações perdidas voltam), conferir, apagar o ramo `_old_`. Regras: S46, L23.

### Como se prova

Critérios 17 a 23, pelo Firstmate, na ordem abaixo.

## U5 Provas e a ordem do fim

Pelo Firstmate, com as chaves do fundador, apagadas no fim. A prova não cria publicação: `v0.2.0` é
a da etapa (L17). Entre o merge e o passo 4, "Voltar atrás" termina vermelho: falta a chave.

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md` | muda: o resultado | `check-docs` |
| `docs/decisions/0009-neon-free-plan-database-asleep.md` | muda: o resultado | `check-docs` |

No fechamento (L19): a linha da etapa 2 no roteiro ganha a decisão e as chaves; D2 e o 0012, a
resposta do fundador.

1. Merge. O Firstmate publica `v0.2.0`: termina vermelha em `migrate` (critério 17).
2. O Firstmate cria o projeto do Hub: São Paulo, PostgreSQL 18, banco `hub`.
3. O fundador abre a porta 22; o Firstmate grava as duas chaves; o fundador fecha a porta; a
   varredura de portas da verificação 4 do 0035 roda de novo.
4. O Firstmate reexecuta o job falho de `v0.2.0`: verde.
5. Critérios 18 a 25. O 0037 e o 0009 recebem o resultado num commit posterior.
6. O fundador faz o roteiro.
