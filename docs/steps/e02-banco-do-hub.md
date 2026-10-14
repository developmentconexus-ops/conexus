# Etapa 2: Banco do Hub

## A página do fundador

**No fim desta etapa** você restaura o banco do Hub a um minuto que escolheu e vê a mudança na
página do Hub. Depois vê o banco dormir no Neon e acordar quando o Hub é aberto.

**O roteiro de uso.**

1. Abra https://hub.conexus.fun. Abaixo da versão aparece "Último início gravado no banco", com
   uma hora, por exemplo 14:02.
2. No GitHub, em Actions, rode "Reiniciar o Hub". Em até 2 minutos, recarregue a página: a hora
   passa a ser a de agora, por exemplo 15:10.
3. No Neon, no projeto do Hub, abra Backup & Restore e restaure o banco a um minuto entre as duas
   horas, por exemplo 15:00. Recarregue o Hub: volta a hora do passo 1, 14:02.
4. Em Branches, apague o ramo de cópia que o Neon criou na restauração (o nome termina em `_old_` e
   uma data). Feche o Neon.
5. Não abra o Hub nem o Neon por dez minutos. Abra o Neon em Branches: o banco aparece "Idle".
6. Abra o Hub: ele demora um pouco mais, responde e mostra a mesma hora do passo 3.

**O que você faz, e quando.** Antes: cria a organização do Neon no plano grátis e entrega ao
Firstmate uma chave dela, apagada no fim. Libera o SSH do servidor para o Firstmate gravar as duas
chaves do banco, e fecha de novo. Entrega uma chave da Cloudflare só de Workers, para a prova do
caminho dos apps, apagada no fim. No começo: aprova esta página. No fim: faz o roteiro e diz o que
viu.

**Fica de fora.** Entrar com e-mail e senha, e empresas: são as etapas 3 e 4. O banco do Mastra:
nasce na etapa 12, com o Builder. A lista de todas as publicações: a página mostra só o último
início, porque é o que mostra a restauração.

**A decisão sua pedida nesta etapa.** Nenhuma. Três pedidos de acesso, com o que o Firstmate
recomenda, vão com esta página: a chave do Neon, o SSH aberto por um tempo, e a chave da
Cloudflare.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 Banco | O módulo do banco, o leitor de segredo, o subcomando `migrate`, a recusa de subir sem migração, o login do Hub | `apps/server/src/platform/`, `apps/server/migrations/`, `apps/server/` (raiz) | dados | `node`, `neon:neon-postgres` | — |
| U2 Último início | A tabela do `status`, a gravação na subida, `getStatus` e a página | `apps/server/src/hub/status/`, `apps/server/migrations/`, `packages/hub-api/`, `apps/web/src/hub/status/` | dados | `fastify-best-practices` | U1 |
| U3 Conferências do banco | PostgreSQL no CI, a conferência do catálogo, das migrações, das travas e a parede do driver | `scripts/`, `.github/workflows/`, raiz | dados | nenhuma | U1 |
| U4 Servidor | As chaves no Compose, `migrate` antes de subir, "Reiniciar o Hub", os procedimentos | `infra/`, `.github/workflows/`, `docs/how-to/` | segurança | nenhuma | U1 |
| U5 Provas | O registro 0037, o banco dormindo (0009), a verificação 3 do 0035 | nenhuma pasta; contas do fundador | dados | `neon:neon-postgres`, `cloudflare:workers-best-practices`, `cloudflare:wrangler` | U1 a U4 no ar |

U2 e U3 correm em paralelo depois da U1. U4 vem depois da U3, porque as duas mudam
`.github/workflows/`. U5 roda depois do merge, com o Firstmate.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O programa recusa subir quando o banco não tem uma migração que ele traz: sai com código 1 e uma linha `DATABASE_BEHIND`; sobe quando o banco tem migrações a mais (imagem anterior) | `apps/server/src/main.test.ts`, "recusa subir sem migração" e "sobe com migração a mais" | must |
| 2 | U1 | `migrate` duas vezes: a segunda não aplica nada. O login do Hub entra com a senha do seu arquivo; outra senha é recusada com 28P01 | `apps/server/src/platform/database.test.ts`, "migrate é idempotente", "senha do arquivo" | must |
| 3 | U1 | O login do Hub não é superusuário, não tem `BYPASSRLS`, não é dono de tabela; `DELETE` e DDL recusados com 42501 | `database.test.ts`, "login estreito"; e o critério 10 | must |
| 4 | U1 | Sem pedidos, o pool fica com zero conexões depois do prazo de ocioso | `database.test.ts`, "pool ocioso fecha tudo", contando `pg_stat_activity` | must |
| 5 | U1 | `migrate` sem o arquivo da chave do dono, ou com um arquivo que outros leem, sai com 1 e `CONFIG_INVALID` com o nome da variável | `main.test.ts`, "migrate sem chave" | must |
| 6 | U2 | `GET /api/status` responde 200 com `lastStart` `RECORDED`, a versão e a hora do último início; sem linha, `NONE` | `apps/server/src/hub/status/status.test.ts`, corpo literal | must |
| 7 | U2 | Com o banco fora, `GET /api/status` responde 503 `DATABASE_UNAVAILABLE` em `application/problem+json`, e `GET /api/health` continua 200 | `status.test.ts`, "banco fora" | must |
| 8 | U2 | Uma linha fora do formato do contrato é recusada na leitura: 500 `INTERNAL_UNEXPECTED`, nada da linha no log | `status.test.ts`, "linha fora do formato", plantada pelo dono num banco de teste | must |
| 9 | U2 | A página mostra "Último início gravado no banco" com a hora; "Nenhum início gravado no banco" para `NONE`; a frase da falha para 503 | `apps/web/src/hub/status/status-page.test.tsx` | must |
| 10 | U3 | O CI recusa um catálogo diferente de `roles.json`: uma concessão a mais, um atributo a mais | `scripts/check-catalog.test.ts`, um caso plantado por recusa | must |
| 11 | U3 | O CI recusa uma migração nova que apaga ou renomeia, uma migração já aplicada alterada, e uma colisão de histórico (`drizzle-kit check`) | `scripts/check-migrations.test.ts` | must |
| 12 | U3 | O CI recusa `pg_advisory_lock`, `pg_try_advisory_lock`, `SET SESSION` e `set_config(..., false)` no código do servidor | `scripts/check-migrations.test.ts`, "travas de sessão" | must |
| 13 | U3 | O CI recusa importar `pg` ou `drizzle-orm/node-postgres` fora de `platform/database.ts` | `scripts/rules.test.ts`, arquivo plantado | must |
| 14 | U4 | Uma publicação cujo servidor não tem a chave do banco termina vermelha e o Hub anterior continua respondendo (verificação 3 do 0035) | Firstmate, ao vivo, com a publicação `v0.2.0` | must |
| 15 | U4 | "Reiniciar o Hub" muda o último início em até 2 minutos | Firstmate e o passo 2 do roteiro | must |
| 16 | U4 | "Voltar atrás" para v0.1.x termina vermelho e o Hub continua na versão atual | Firstmate, ao vivo | must |
| 17 | U4 | O contêiner `hub` não monta a chave do dono do banco | Firstmate, `docker inspect` das montagens | must |
| 18 | U4 | Restaurar a antes da primeira migração: a página mostra a falha; "Reiniciar o Hub" a traz de volta com um início novo | Firstmate, ao vivo, pelo procedimento | must |
| 19 | U5 | Dez minutos sem pedido e com o Neon fechado: o banco aparece "Idle"; o pedido seguinte responde, com o tempo de acordar medido ([0009](../decisions/0009-neon-free-plan-database-asleep.md)) | Firstmate, ao vivo, e o passo 5 do roteiro | must |
| 20 | U5 | As seis verificações do [0037](../decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md) | Firstmate, fora do repositório | must |

Se a verificação 3, 4 ou 5 do 0037 falhar pela versão do PostgreSQL ou do driver, as etapas 7 a 10
são replanejadas antes de a 3 começar. Se o banco não dormir e a causa não puder sair, a etapa volta
ao fundador com as duas saídas do 0009.

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Pool, transação e linhas (`db.ts:192-232`, `313-345`) | Nova | `apps/server/src/platform/database.ts` | — | Leitura em REPEATABLE READ READ ONLY (D23). Uma transação por unidade (D22). Toda linha conferida (D21, "3. A"). Ouvinte de erro do pool (propósito: na prova D4 o Hub caiu quando a sessão caiu) |
| Mapa de erros (`db.ts:164-187`) | Nova, menor | `database.ts` | — | Por SQLSTATE e nome de restrição, sem a mensagem (C52, D24, S41: propósito). Só os códigos desta etapa |
| Recusa de transação aninhada (`db.ts:314`) | Não entra | — | — | "Implementado assim": protegia o invólucro antigo. O Drizzle aninha como savepoint dentro de uma transação |
| Etiqueta `sql`, troca de papel, `sql-lexer.ts`, `connection-census.ts` | Não entram | — | — | Sobras da troca de papel, que saiu |
| `session()` e a trava de instância | Não entram | — | — | Recusadas por D25; a concessão vem com o primeiro trabalho agendado |
| Recusa de subir atrasado (`lifecycle.ts:34-38`) | Nova, sobre o registro do Drizzle | `database.ts` | — | D9. O código de saída 78: "implementado assim", sai |
| Aplicador de migrações (`run-hub-migrations.mjs`) | Substituído pelo Drizzle | `apps/server/migrations/` | — | Uma transação (nativo). Login do dono por arquivo (S31). A trava consultiva sai: o grupo `hub-server` dos workflows já põe um de cada vez. O mapa de digests sai: a conferência D7 do CI e o hash do registro |
| Criação de papel (`0001_baseline.sql:11-39`) | Trazida como decisão | migração própria da U1 | `CREATE ROLE` num bloco que ignora `duplicate_object` | Propósito, provado: papéis valem para o servidor inteiro, e os testes criam muitos bancos num só |
| Senha do login (`provision-hub-roles.mjs`) | Trazida como decisão | subcomando `migrate` | Valor ligado como parâmetro, gravado a cada execução, sem sondagem | Senha em arquivo, gravada pelo login do dono (S31, D10). O literal sai (D20). A sondagem: "implementado assim", sai |
| Prazos no papel (30 s, 5 s, 60 s) | Valores novos | migração da U1 | — | Prazo do lado do banco fica: propósito, `query_timeout` deixa a consulta rodando. Os números: "implementado assim", trocados (U1) |
| `secret-file.ts` (15 linhas) | Trazida | `apps/server/src/platform/secret-file.ts` | Importação `.ts`, o nome da variável no detalhe | Recusa arquivo que outros leem, ou vazio (S31: propósito) |
| Ajudante do banco de teste (`hub-database.mjs:37-70`) | Nova | `apps/server/src/platform/test-database.ts` | — | Banco único por suíte, apagado no fim (T19). O superusuário sai (T19) |
| Os registros de repetição e `jobs.ts` (`platform/`) | Fora desta etapa | — | — | Nenhuma rota cria algo (C37) e nenhum trabalho roda sozinho |

**A medida do transplante.** `secret-file.ts`: 15 linhas trazidas, cerca de 3 mudam, nenhum teste
antigo, menos de uma hora. Abaixo de um terço: trazida. O resto é novo ou fica fora.

**A dívida.** Nenhuma.

**Leitura de D2, a confirmar no fechamento.** A tabela de inícios do `status` não tem a coluna da
empresa: não guarda dado de empresa e nenhuma empresa existe. O cartão lê D2 e 0012 como "toda
tabela com dado de uma empresa"; a emenda do guia vai para a fila do método.

## U1 Banco

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/database.ts` | cria | `main.ts`; stores dos assuntos |
| `apps/server/src/platform/database.test.ts` | cria | `npm test` |
| `apps/server/src/platform/secret-file.ts` | cria | `config.ts` |
| `apps/server/src/platform/test-database.ts` | cria | testes do servidor |
| `apps/server/src/platform/config.ts` | muda | `main.ts` |
| `apps/server/src/main.ts`, `main.test.ts` | muda | `CMD` da imagem, serviço `migrate`, testes |
| `apps/server/drizzle.config.ts` | cria | `drizzle-kit` |
| `apps/server/migrations/<data>_hub_runtime_login/` | cria | `migrate`, a imagem |
| `apps/server/migrations/roles.json` | cria | conferência do catálogo (U3) |
| `apps/server/package.json`, `package-lock.json` | muda | npm, CI, imagem |
| `packages/hub-api/src/failures.ts` | muda | servidor, web |
| `biome.json` | muda: `noProcessEnv` desligado para `test-database.ts` | `npm run lint` |
| `knip.json` | muda, se `drizzle.config.ts` pedir entrada | `npm run knip` |

### Os contratos que a unidade cria

- `readSecretFile(path: string): string`; falha `CONFIG_INVALID` com `variable`.
- Variáveis: `HUB_DATABASE_URL_FILE` (sempre), `HUB_MIGRATION_DATABASE_URL_FILE` (só `migrate`),
  lidas no esquema único de `config.ts` (C67). `Config` ganha `databaseUrl: DatabaseUrl` e
  `migrationDatabaseUrl: DatabaseUrl | undefined`; `DatabaseUrl` guarda o valor em `#value` (C17).
- `openDatabase(deps: { url: DatabaseUrl; log: FailureLog }): Database`, objeto congelado com
  `read<T>(work: (tx: ReadTx) => Promise<T>): Promise<T>`,
  `command<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>`, `close(): Promise<void>`.
- `assertMigrated(database: Database): Promise<void>`; falha `DATABASE_BEHIND`.
- `migrate(deps: { ownerUrl: DatabaseUrl; runtimeUrl: DatabaseUrl }): Promise<void>`.
- Subcomando: `node src/main.ts migrate`, saída 0 ou 1; sem argumento, o servidor.
- Falhas novas em `FAILURES`: `DATABASE_UNAVAILABLE` (`SYSTEM`, 503), `DATABASE_BEHIND`
  (`SYSTEM`, 500).
- Pool: `connectionTimeoutMillis` 5000 (acordar mediu 0,82 a 0,93 s na prova D2),
  `query_timeout` 15000, `idleTimeoutMillis` 10000 e `min` 0 do `pg`, sem `keepAlive`.
- Papel `hub_runtime`: `LOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS`;
  `statement_timeout` 10 s (um terço dos 30 s do pedido, para o Hub responder 503 antes do Fastify);
  `idle_in_transaction_session_timeout` 10 s (uma transação aberta e parada mantém o Neon
  acordado). Sem `lock_timeout`: nenhuma trava nesta etapa (C73).
- `drizzle.config.ts`: `dialect: 'postgresql'`, `schema: './src/**/tables.ts'`,
  `out: './migrations'`, `casing: 'snake_case'`; registro em `drizzle.__drizzle_migrations`.
- `roles.json`: cada papel com seus atributos e concessões.

### A ordem do trabalho

1. `secret-file.ts` e as variáveis. Regras: S31, C67, C17. Funções: `node:fs` `statSync`,
   `readFileSync`.
2. `database.ts`: pool, `read`, `command`, mapa de erros, ouvinte de erro do pool. Regras: D19,
   D21, D22, D23, D24, D25, D27, C52, C57. Funções: `drizzle-orm@1.0.0-rc.4` `drizzle({ client })`,
   `db.transaction(work, { isolationLevel, accessMode })`; `pg@8.23.1` `Pool`, `pool.on('error')`.
   Um erro sem SQLSTATE vindo do pool, uma classe 08, 57P01 a 57P03 e 57014 viram
   `DATABASE_UNAVAILABLE`; o resto, `INTERNAL_UNEXPECTED`.
3. A migração própria do papel, por `drizzle-kit@1.0.0-rc.4 generate --custom`. Regras: D5, D8,
   D10, D11.
4. `migrate`: `migrate(db, { migrationsFolder })` como dono, depois a senha do login do Hub tirada
   de `HUB_DATABASE_URL_FILE`, na mesma transação, com `set_config(..., true)` ligado como parâmetro
   e `EXECUTE format('ALTER ROLE ... PASSWORD %L', current_setting(...))`. Regras: D9, D20, C64.
5. `assertMigrated`: `readMigrationFiles({ migrationsFolder })` contra `select name, hash` do
   registro, sem chamar `migrate`; tabela ausente conta como nada aplicado. Regra: D9.
6. `test-database.ts`: banco de nome único por suíte, migrado, apagado no fim, por um dono sem
   superusuário com `CREATEDB CREATEROLE` lido de `CONEXUS_TEST_DATABASE_URL`. Regra: T19, T20.

### Como se prova

`npm test -w @conexus/server` com `CONEXUS_TEST_DATABASE_URL` apontando um PostgreSQL 18 local.
Critério 1: um banco sem a última migração faz `main.ts` sair com 1; tirar `assertMigrated` faz o
teste falhar (T12). Critério 2: a senha errada recebe 28P01. Critério 3: `DELETE` recebe 42501.
Critério 4: `pg_stat_activity` sem sessão de `hub_runtime` depois do prazo de ocioso de teste.
Critério 5: arquivo modo 0644 recusado.

## U2 Último início

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/status/tables.ts` | cria | `drizzle-kit`, `store.ts` |
| `apps/server/src/hub/status/store.ts` | cria | `status.ts` |
| `apps/server/src/hub/status/status.ts`, `public.ts`, `status.test.ts` | muda | `main.ts` |
| `apps/server/src/main.ts` | muda: grava o início antes de ouvir | imagem |
| `apps/server/migrations/<data>_hub_status_starts/`, `<data>_hub_status_grants/` | cria | `migrate` |
| `apps/server/migrations/roles.json` | muda | U3 |
| `packages/hub-api/src/status.ts` | muda | servidor, web |
| `apps/web/src/hub/status/status-page.tsx`, `status-page.test.tsx` | muda | `main.tsx` |

### Os contratos que a unidade cria

- Tabela `hub.starts`: `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `version text NOT
  NULL CHECK (version ~ '^v[0-9]+\.[0-9]+\.[0-9]+$')`, `started_at timestamptz NOT NULL DEFAULT
  now()`. Sem coluna de empresa (leitura de D2 acima).
- Concessões: `USAGE` no schema `hub`, `SELECT, INSERT` em `hub.starts` ao `hub_runtime`.
- `HubStatus = { version: Version; lastStart: LastStart }`, com
  `LastStart = { state: 'RECORDED'; version: Version; startedAt: string } | { state: 'NONE' }`;
  `startedAt` em RFC 3339 UTC (C40, C41).
- `getStatus`: `GET /api/status`, `public`, saída 200 `HubStatus`, falhas `DATABASE_UNAVAILABLE`.
- `createStatus(deps: { version: Version; database: Database })` devolve, congelado,
  `recordStart(): Promise<void>` e `read(): Promise<HubStatus>`.

### A ordem do trabalho

1. `tables.ts` com `pgSchema('hub')`; `drizzle-kit generate`; ler o SQL (D8); migração própria
   das concessões. Regras: D4, D5, D8, D12, D15, D18.
2. `store.ts`: `insert` e `select ... orderBy(desc(id)).limit(1)`, cada linha conferida com
   `createSelectSchema` de `drizzle-orm/zod`. Regras: D21, D22, C8.
3. `main.ts`: `assertMigrated`, `recordStart`, depois `listen`. Regra: C9.
4. Contrato e rota. Regras: C28, C31, C43.
5. Página. Regra: web W1 e o guia de design para o texto.

### Como se prova

Critério 6: `inject` em `GET /api/status`, corpo literal. Critério 7: banco parado no teste, 503 e
corpo literal; `/api/health` 200. Critério 8: o dono tira o `CHECK` no banco de teste e grava
`version = 'x'`; o status responde 500 e o log não traz `x` (S41). Critério 9: Vitest da página.

## U3 Conferências do banco

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/workflows/ci.yml` | muda: serviço PostgreSQL 18 por digest, papel dono sem superusuário, novos passos | GitHub |
| `scripts/check-catalog.ts`, `check-catalog.test.ts` | cria | CI |
| `scripts/check-migrations.ts`, `check-migrations.test.ts` | cria | CI |
| `.dependency-cruiser.cjs`, `scripts/rules.test.ts` | muda | `npm run deps`, `test:scripts` |
| `package.json` (raiz) | muda: `catalog`, `migrations` em `verify` | CI |

### Os contratos que a unidade cria

- `node scripts/check-catalog.ts`: migra um banco novo e compara papéis, atributos e concessões
  com `roles.json`; sai com 1 e a diferença.
- `node scripts/check-migrations.ts --base <ref>`: recusa arquivo alterado ou apagado em
  `apps/server/migrations/` já presente na base, SQL novo com `DROP` ou `RENAME`, falha de
  `drizzle-kit check`, e as travas e ajustes de sessão no código do servidor.
- Regra `driver-only-in-database-module`, com o comentário "D19".

### A ordem do trabalho

1. Serviço no CI e papel dono. Regras: T19, L15.
2. Catálogo. Regras: D10, D11, D12.
3. Migrações e travas. Regras: D6, D7, D25, C78.
4. Parede do driver. Regras: D19, C56.

### Como se prova

`npm run test:scripts`: cada recusa plantada num caso (critérios 10 a 13); tirar a conferência faz
o caso falhar.

## U4 Servidor

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/compose.yaml` | muda: segredo `hub_database_url` no `hub`; serviço `migrate` em perfil próprio, com as duas chaves | `deploy.sh` |
| `infra/deploy.sh` | muda: `compose run --rm migrate` com prazo de 60 s antes de `up`; modo `restart` | `publish.yml`, `rollback.yml`, `restart.yml` |
| `.github/workflows/restart.yml` | cria: "Reiniciar o Hub", grupo `hub-server` | o fundador |
| `scripts/setup-server.test.ts` | muda, se a forma do Compose que ele lê mudar | `test:scripts` |
| `docs/how-to/hub-server.md` | muda: as duas chaves, donos e modos, "Reiniciar o Hub" | Firstmate |
| `docs/how-to/hub-database-restore.md` | cria, em português | o fundador |
| `docs/index.md` | muda | `check-docs` |

### Os contratos que a unidade cria

- Arquivos no servidor: `/etc/conexus/secrets/hub_database_url` e
  `/etc/conexus/secrets/hub_migration_database_url`, dono uid 1000, modo 0400.
- `deploy.sh <imagem>` e `deploy.sh --restart`; a saída é a de hoje.
- `restart.yml`: `workflow_dispatch` sem entrada, no executor `[self-hosted, hub]`.

### A ordem do trabalho

1. Compose. Regras: S31, S36, S37.
2. `deploy.sh`: `migrate` antes de parar o Hub atual; falhou, o Hub atual fica. Regras: C60, C64,
   D9.
3. `restart.yml`. Regra: [0035](../decisions/0035-publish-through-a-runner-on-the-server.md).
4. Procedimentos. Regras: S46, L23. O de restaurar diz: escolher o minuto, restaurar, conferir,
   apagar o ramo `_old_`, e rodar "Reiniciar o Hub" quando o minuto é anterior a uma migração.

### Como se prova

Critérios 14 a 18, ao vivo, pelo Firstmate, depois do merge. A verificação 3 do 0035: a publicação
`v0.2.0` roda antes de as chaves estarem no servidor; termina vermelha e v0.1.x responde. Com as
chaves gravadas, o Firstmate reexecuta o job falho da mesma publicação, que termina verde. Nenhum
nome de versão é gasto.

## U5 Provas

Fora do repositório, pelo Firstmate, com as chaves do fundador, apagadas no fim. O projeto do Hub:
São Paulo, PostgreSQL 18, banco `hub`. O 0037 recebe o seu resultado num commit posterior; o 0009
recebe o do banco dormindo. Nenhuma publicação é criada pela prova.
