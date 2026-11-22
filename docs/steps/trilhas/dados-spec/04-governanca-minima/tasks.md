# Plano de implementação: parte 4, a governança mínima

> O cartão Registro e conformidade (no histórico do `main`, no commit `07aa2924`) construiu os requisitos 6 e 7, o `C6` e o grupo 9 desta parte, e o que ele decidiu vale sobre este texto (o fechamento dele, 2026-11-21). Só Dono e Administrador veem o Registro de dados, e o requisito 7.2 volta a valer. A leitura deixa uma linha só, gravada depois de ler e antes de devolver. A consulta que nomeia uma tabela fora do catálogo de quem pergunta volta `NOT_IN_CATALOG` sem rodar, como a tabela que não existe ("1. B"). O registro do cartão está em [aprovações](../../../../approvals/registro-e-conformidade.md).

## Visão geral

Nove grupos, um pull request cada. O grupo 1 cria as duas tabelas. Os grupos 2 e 3 dão as permissões delas no banco do Hub, cada uma num PR só dela, com a palavra do fundador dada em 2026-11-14 (P2, no índice). O grupo 4 faz o banco da empresa garantir a leitura por papel. O grupo 5 muda só o contrato. O grupo 6 liga o catálogo, as rotas e o membro ao papel. O grupo 7 muda as telas. O grupo 8 foi desfeito em 2026-11-15. O grupo 9 grava e mostra o Registro de dados.

Tudo parte de que as partes 1 e 3 estão no `main`: `READ_LOGIN`, `ensureReader`, `readerAddress` e `readCopies` em `apps/server/src/platform/copy-sql.ts`; a pasta `apps/server/src/hub/data/` com `createCompanyData`, `catalogOf`, `rowsOf` e `queryOf`; `sampleOf` em `apps/server/src/hub/copies/sample.ts` e a ação `readCopyRows`; a página Dados nas rotas `data.index.tsx` e `data.$copyId.tsx`; as ferramentas em `apps/server/src/builder/data-tools/` com `order.ts`; e `apps/web/src/builder/conversation/data-specs.ts`. Um nome dessas partes que não estiver no `main` quando a unidade começar é um passo 2 da skill `conexus-build`: pare e diga.

## Como ler este plano

- Cada unidade é um commit. A última de cada grupo é o ponto de conferência. Os grupos 2, 3 e 5 têm uma unidade de commit só, porque a permissão nova e a mudança do contrato são sempre um PR só delas; cada ponto de conferência registra a exceção no PR. Nos grupos 7 e 9, o item da QA vem depois do ponto de conferência e não é um commit: é a skill `conexus-qa` (testing T25), por um agente que não construiu.
- Todo caminho é relativo à raiz do repositório. `(novo)` marca o arquivo que não existe.
- Os testes do servidor rodam assim, da raiz, depois de `npm ci` e `npm run build -w @conexus/server`, com `CONEXUS_TEST_DATABASE_URL`, `CONEXUS_TEST_RUNTIME_PASSWORD` e `CONEXUS_TEST_DATABASE_CONTAINER` do `docs/how-to/local-database.md`:
  `MASTRA_AGENT_THREAD_LEASE_TTL_MS=3000 node scripts/test-run.ts --test-concurrency=1 --test-timeout=120000 <arquivos>`
- Os do kit e do contrato: `node scripts/test-run.ts <arquivos>`. Os da tela: `npm run test:unit -w @conexus/web -- <arquivos>`.
- Toda recusa desta parte é teste de isolamento ou de recusa (testing T4, `T10`, `T13`). O arquivo de teste de cada unidade que diz "entra em `scripts/rerun-never.json`" entra na lista `files` desse arquivo, em ordem alfabética, no mesmo commit. `scripts/rerun-exempt.test.ts` confere.
- Nenhum `catch` genérico, `.catch(() => null)` ou pulo calado. Cada falha tem o nome, o log e a resposta da tabela "Tratamento de erros" do `design.md`.
- Os textos em português de cada tela estão na unidade. Um texto que falta é uma pergunta, não uma invenção.

## Tarefas

- [ ] 1. Grupo 1: as tabelas (um PR)
  - [ ] 1.1 `copies.copy_reader` e a coluna `readers_set` (um commit)
    - **Arquivos:** `apps/server/src/hub/copies/tables.ts`, `apps/server/src/hub/identity/public-tables.ts`, `apps/server/migrations/<data>_copy_reader/migration.sql` e `snapshot.json` (novos, gerados), `apps/server/database-grants.sql`.
    - **Referência a seguir:** `projectCopy` em `apps/server/src/hub/copies/tables.ts:128-153`: chave primária composta, as chaves estrangeiras com nome e `onDelete('cascade')`, `grantedBy` e `grantedAt`, e a política `policy(SCOPE_ROLES.COMPANY, 'all', sql\`company_id = ${scoped.companyId}\`)`. A tabela `organizationRole` está em `apps/server/src/hub/identity/tables.ts:276-300`, com `id: text('id').primaryKey()`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // apps/server/src/hub/identity/public-tables.ts
      export { company, member, organizationRole, session } from './tables.ts'

      // apps/server/src/hub/copies/tables.ts, dentro de `copy`, depois de lastRunId
      // Verdadeiro depois que os leitores da cópia foram gravados uma vez, por N3b-1, pela semeadura ou por uma pessoa.
      readersSet: boolean('readers_set').notNull().default(false),

      // apps/server/src/hub/copies/tables.ts, depois de projectCopy
      /** Um papel editável da empresa que lê uma cópia (N3b). Dono e administrador leem todas e não têm linha aqui. */
      export const copyReader = copies.table('copy_reader', {
        companyId: text('company_id').notNull(),
        copyId: uuid('copy_id').notNull(),
        // O id da linha do papel em auth.organization_role: o desenvolvedor, o membro ou um papel da empresa.
        roleId: text('role_id').notNull(),
        grantedBy: text('granted_by').notNull(),
        grantedAt: instant('granted_at').notNull(),
      }, (table) => [
        primaryKey({ columns: [table.copyId, table.roleId] }),
        foreignKey({ name: 'copy_reader_copy_fkey', columns: [table.companyId, table.copyId],
          foreignColumns: [copy.companyId, copy.id] }).onDelete('cascade'),
        foreignKey({ name: 'copy_reader_role_fkey', columns: [table.roleId],
          foreignColumns: [organizationRole.id] }).onDelete('cascade'),
        index('copy_reader_role_idx').on(table.roleId),
        policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
      ])
      ```
      A migração sai de `npm run generate -w @conexus/server -- --name copy_reader`. Ela só acrescenta (data D6): `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, `ALTER TABLE ... ADD COLUMN "readers_set" boolean DEFAULT false NOT NULL`.
      Em `database-grants.sql` entra só a linha de dono que o `pg_dump` passa a mostrar: `ALTER TABLE copies.copy_reader OWNER TO test_owner;`, no lugar em que o dump a imprime (entre as linhas de `copies.copy_proposal_source` e `copies.copy_run`, conferido rodando o teste). Nenhum `GRANT`: as permissões são o grupo 2.
    - **Testes:** nenhum teste novo nesta unidade: a tabela é provada pelos testes do grupo 4. Rodam `apps/server/src/platform/catalog.test.ts` (com `CONEXUS_TEST_DATABASE_CONTAINER`) e `npm run migrations -- --base origin/main`.
    - **Mutações à mão:** tirar `.onDelete('cascade')` de `copy_reader_role_fkey` faz falhar, no grupo 4, o caso "apagar o papel apaga a marca" de `apps/server/src/hub/copies/readers.test.ts`. Esta mutação é feita na unidade 4.2.
    - **Pronto quando:** `npm run migrations -- --base origin/main` passa, `catalog.test.ts` passa com o contêiner, e `\d copies.copy_reader` no banco de teste mostra as duas chaves estrangeiras e a política `company_all`.
    - _Requisitos: 1.1, 1.6_
  - [ ] 1.2 O esquema `data` e a tabela `data.data_read` (um commit)
    - **Arquivos:** `apps/server/src/hub/data/tables.ts` (novo), `apps/server/migrations/<data>_data_read/migration.sql` e `snapshot.json` (novos, gerados), `apps/server/database-grants.sql`.
    - **Referência a seguir:** `connectorWrite` em `apps/server/src/hub/connectors/tables.ts:218-249`: a chave estrangeira à empresa com cascade e nenhuma à pessoa (data D17), as `check` dos enums, a política por empresa. O esquema próprio, como `pgSchema('connectors')` em `apps/server/src/hub/connectors/tables.ts:26`. O `drizzle.config.ts` lê todo `src/**/tables.ts` (`apps/server/drizzle.config.ts:3-7`).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // apps/server/src/hub/data/tables.ts
      import { company } from '../identity/public-tables.ts'
      import { policy } from '../identity/public.ts'
      export const data = pgSchema('data')
      export const DATA_READ_AGENTS = ['ASSISTANT', 'BUILDER', 'AGENT', 'APP'] as const
      export const DATA_READ_VERBS = ['SAMPLE', 'QUERY', 'LIVE'] as const
      export const DATA_READ_QUERY_MAX = 4000
      /** Uma leitura de dado da empresa por um agente ou um app: quem, o quê, a consulta e o resultado. Nunca as linhas. */
      export const dataRead = data.table('data_read', {
        id: uuid('id').primaryKey(),
        companyId: text('company_id').notNull(),
        at: instant('at').notNull(),
        personId: text('person_id').notNull(),
        agent: text('agent', { enum: DATA_READ_AGENTS }).notNull(),
        projectId: text('project_id'),
        agentId: text('agent_id'),
        threadId: text('thread_id'),
        verb: text('verb', { enum: DATA_READ_VERBS }).notNull(),
        tables: text('tables').array().notNull(),
        connectionId: uuid('connection_id'),
        operation: text('operation'),
        query: text('query'),
        outcome: text('outcome').notNull(),
        rows: integer('rows'),
        ms: integer('ms').notNull(),
      }, (table) => [
        foreignKey({ name: 'data_read_company_id_fkey', columns: [table.companyId],
          foreignColumns: [company.id] }).onDelete('cascade'),
        index('data_read_company_at_idx').on(table.companyId, table.at),
        check('data_read_agent', sql`${table.agent} in ('ASSISTANT', 'BUILDER', 'AGENT', 'APP')`),
        check('data_read_verb', sql`${table.verb} in ('SAMPLE', 'QUERY', 'LIVE')`),
        check('data_read_live', sql`(${table.verb} = 'LIVE') = (${table.connectionId} is not null and ${table.operation} is not null)`),
        check('data_read_query', sql`(${table.query} is null or ${table.verb} = 'QUERY') and char_length(${table.query}) <= 4000`),
        check('data_read_counts', sql`(${table.rows} is null or ${table.rows} >= 0) and ${table.ms} >= 0`),
        policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
      ])
      ```
      `instant` é uma função local de cada `tables.ts`, sem exportação (`apps/server/src/hub/copies/tables.ts:31`): o construtor a copia para este arquivo e completa os imports (`pgSchema`, `uuid`, `text`, `integer`, `index`, `check`, `foreignKey` de `drizzle-orm/pg-core`, `sql` de `drizzle-orm`, `SCOPE_ROLES` e `scoped` como `copies/tables.ts` os importa).
      A migração sai de `npm run generate -w @conexus/server -- --name data_read`, com `CREATE SCHEMA "data"`. Em `database-grants.sql` entram só as linhas de dono que o dump mostra: `ALTER SCHEMA data OWNER TO test_owner;` e `ALTER TABLE data.data_read OWNER TO test_owner;`, nos lugares em que o dump as imprime.
    - **Testes:** nenhum teste novo nesta unidade. Rodam `apps/server/src/platform/catalog.test.ts` e `npm run migrations -- --base origin/main`. As `check` são provadas na unidade 9.1.
    - **Mutações à mão:** trocar `= 'LIVE'` por `<> 'LIVE'` em `data_read_live` faz falhar o caso "cada verbo grava uma linha" de `apps/server/src/hub/data/record.test.ts` (unidade 9.1).
    - **Pronto quando:** as mesmas três linhas da 1.1 passam, e `\d data.data_read` mostra as cinco `check`, o índice e a política.
    - _Requisitos: 6.4, 6.6_
  - [ ] 1.3 Ponto de conferência do grupo 1
    - Rodar `apps/server/src/platform/catalog.test.ts` com o contêiner, `npm run migrations -- --base origin/main`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: a migração aplicada num banco descartável, pstack `deslop` e `no-comments`, as mutações que esta unidade pode provar, um commit por unidade.
    - Linha da tabela de referência para o PR: "Quem lê cada tabela", `apps/server/src/hub/copies/tables.ts:128-153` como molde, embrulhado.
    - O PR diz que nenhum `GRANT` muda: as linhas de `database-grants.sql` são só de dono. Se o revisor ler uma linha de dono como mudança da lista de permissões (data D11), este grupo e os grupos 2 e 3 entram juntos.
    - A CI roda `check`, os testes do servidor em quatro partes e `catalog.test.ts` no cluster dela.
- [ ] 2. Grupo 2: a permissão de `copies.copy_reader` no banco do Hub (um PR, data D11, palavra do fundador dada em 2026-11-14 (P2))
  - [ ] 2.1 As permissões de `copies.copy_reader` e de `readers_set` (um commit)
    - **Arquivos:** `apps/server/migrations/<data>_copy_reader_grants/migration.sql` e `snapshot.json` (novos), `apps/server/database-grants.sql`.
    - **Referência a seguir:** `apps/server/migrations/20261107125733_e245_connector_write_grants/migration.sql:1-7`: o cabeçalho `-- Custom SQL: Drizzle cannot generate a grant (data D5).`, a frase do porquê, a palavra do fundador, e um `--> statement-breakpoint` entre instruções. A forma das linhas no snapshot: `apps/server/database-grants.sql:373-381` (uma linha `GRANT UPDATE(<coluna>)` por coluna) e o comentário acima de cada bloco.
    - **O que sai:** nada.
    - **O que entra:** a migração vem de `npm run generate -w @conexus/server -- --custom --name copy_reader_grants`, com:
      ```sql
      -- Custom SQL: Drizzle cannot generate a grant (data D5). A governança mínima, grupo 2, with the
      -- founder's word of 2026-11-14 (P2), in a pull request of its own (data D11): a company's routes
      -- read which roles read each copy, mark and unmark them, and mark a copy whose readers were written once.
      GRANT SELECT, INSERT, DELETE ON TABLE copies.copy_reader TO hub_company;
      --> statement-breakpoint
      GRANT UPDATE (readers_set) ON TABLE copies.copy TO hub_company;
      ```
      `GRANT UPDATE(definition) ON TABLE copies.copy TO hub_company;` já vem do grupo 0 da parte 1, que é anterior. Esta migração não o repete.
      Em `database-grants.sql`, as linhas como o dump as imprime: `GRANT SELECT,INSERT,DELETE ON TABLE copies.copy_reader TO hub_company;` e `GRANT UPDATE(readers_set) ON TABLE copies.copy TO hub_company;`, com um comentário `--` acima, no estilo dos de `:370-372`.
    - **Testes:** `apps/server/src/platform/catalog.test.ts` com o contêiner. O uso da permissão é provado pelo grupo 4.
    - **Mutações à mão:** tirar `DELETE` do `GRANT` faz falhar o caso "tirar uma tabela recusa a leitura seguinte" de `apps/server/src/hub/copies/readers-routes.test.ts` (unidade 6.2) com `42501` do banco do Hub.
    - **Pronto quando:** `catalog.test.ts` passa com o contêiner e `npm run migrations -- --base origin/main` passa.
    - _Requisitos: 1.1, 2.1_
  - [ ] 2.2 Ponto de conferência do grupo 2
    - Rodar `catalog.test.ts` com o contêiner, `npm run migrations -- --base origin/main`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`, sem pular nenhum.
    - O PR leva no título "(data D11, pull request próprio)" e no corpo a palavra do fundador dada em 2026-11-14 (P2, no índice): o login do Hub ganha `SELECT, INSERT, DELETE` em `copies.copy_reader` e `UPDATE(readers_set)` em `copies.copy`.
    - Exceção registrada no PR: o grupo tem uma unidade de commit só, porque uma permissão nova é sempre um PR só dela (data D11, resposta à P2).
    - Linha da tabela de referência: "Quem lê cada tabela", `apps/server/migrations/20261107125733_e245_connector_write_grants` como molde.
    - A CI roda `check` e `catalog.test.ts` no cluster dela.
- [ ] 3. Grupo 3: a permissão de `data.data_read` no banco do Hub (um PR, data D11, palavra do fundador dada em 2026-11-14 (P2))
  - [ ] 3.1 As permissões do esquema `data` e de `data.data_read` (um commit)
    - **Arquivos:** `apps/server/migrations/<data>_data_read_grants/migration.sql` e `snapshot.json` (novos), `apps/server/database-grants.sql`.
    - **Referência a seguir:** a mesma da 2.1, e `apps/server/migrations/20261113184110_ontology_grants/migration.sql` para o `GRANT USAGE ON SCHEMA` de um esquema novo.
    - **O que sai:** nada.
    - **O que entra:** a migração vem de `npm run generate -w @conexus/server -- --custom --name data_read_grants`, com:
      ```sql
      -- Custom SQL: Drizzle cannot generate a grant (data D5). A governança mínima, grupo 3, with the
      -- founder's word of 2026-11-14 (P2), in a pull request of its own (data D11; E4a): a company's
      -- routes record each read of the company's data and list them. A record is never changed or
      -- deleted by the Hub; it leaves only with its company, by the cascade.
      GRANT USAGE ON SCHEMA data TO hub_company;
      --> statement-breakpoint
      GRANT SELECT, INSERT ON TABLE data.data_read TO hub_company;
      ```
      Em `database-grants.sql`: `GRANT USAGE ON SCHEMA data TO hub_company;` e `GRANT SELECT,INSERT ON TABLE data.data_read TO hub_company;`, nos lugares do dump, com o comentário acima.
    - **Testes:** `apps/server/src/platform/catalog.test.ts` com o contêiner. A recusa de `UPDATE` e `DELETE` é provada na unidade 9.1.
    - **Mutações à mão:** acrescentar `UPDATE` ao `GRANT` faz falhar o caso "o login do Hub não muda nem apaga uma linha do registro" de `apps/server/src/hub/data/record.test.ts` (unidade 9.1).
    - **Pronto quando:** `catalog.test.ts` passa com o contêiner e `npm run migrations -- --base origin/main` passa.
    - _Requisitos: 6.6_
  - [ ] 3.2 Ponto de conferência do grupo 3
    - Rodar `catalog.test.ts` com o contêiner, `npm run migrations -- --base origin/main`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`, sem pular nenhum.
    - O PR leva no título "(data D11, pull request próprio)" e no corpo a palavra do fundador dada em 2026-11-14 (P2, no índice): o login do Hub ganha `USAGE` em `data` e `SELECT, INSERT` em `data.data_read`, nunca `UPDATE` nem `DELETE` no registro.
    - Exceção registrada no PR: o grupo tem uma unidade de commit só, pela mesma regra do grupo 2.
    - Linha da tabela de referência: "O registro", `apps/server/migrations/20261107125733_e245_connector_write_grants` como molde.
    - A CI roda `check` e `catalog.test.ts` no cluster dela.
- [ ] 4. Grupo 4: o banco garante (um PR)
  - [ ] 4.1 `roleLogin`, `roleAddress`, o bilhete e `reconcileReaders` (um commit)
    - **Arquivos:** `apps/server/src/platform/copy-sql.ts`, `apps/server/src/platform/company-postgres.ts`, `apps/server/src/platform/test-company-postgres.ts`, `apps/server/src/platform/copy-readers.test.ts` (novo), `scripts/rerun-never.json`.
    - **Referência a seguir:** `ensureSync` em `apps/server/src/platform/copy-sql.ts:107-125` (logins pelo dono com `missingLogins`, uma nova tentativa só em `42710`, `:123-124`), `syncAddress` em `copy-sql.ts:128-133` (o endereço pelo host gravado, a senha por `appLoginPassword` de `app-sql.ts:75`), `grantCopy` e `revokeCopy` em `copy-sql.ts:331-377` (o `GRANT` e o `REVOKE` como `conexus_sync`, os SQLSTATE de nada a tirar), `missingLogins` em `apps/server/src/platform/app-sql.ts:63-79`, `quoted` em `app-sql.ts:38-40`, e as quatro configurações de `ensureReader` da parte 1 (`C3`). A fachada em `apps/server/src/platform/company-postgres.ts:349-373`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // apps/server/src/platform/copy-sql.ts
      const ROLE_LOGIN_PREFIX = 'conexus_role_'
      const IDENTIFIER_BYTES = 63
      /** O login que lê as tabelas de um papel da empresa. O id é o da linha em auth.organization_role:
       *  um uuid (os dois semeados, company-roles.ts:61) ou 32 letras e dígitos da biblioteca
       *  (@better-auth/core 1.7.8, utils/id), com maiúsculas: o nome vai sempre entre aspas e guarda a caixa. */
      export function roleLogin(roleId: string): string {
        const login = `${ROLE_LOGIN_PREFIX}${roleId}`
        if (Buffer.byteLength(login) > IDENTIFIER_BYTES)
          throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'COPY_READER_NAME' } })
        return login
      }

      /** Onde o Hub alcança o login de um papel, pelo host gravado, sem chamar a Neon (como syncAddress, :128-133). */
      export async function roleAddress(context: Context, host: string, roleId: string): Promise<DatabaseUrl> {
        const login = roleLogin(roleId)
        const url = new URL(`postgresql://${host}/${COMPANY_DATABASE}?sslmode=require`)
        url.username = login
        url.password = await appLoginPassword({ key: context.key, login })
        return DatabaseUrl.parse(url.toString())
      }

      export type WantedReader = Readonly<{ roleId: string; tables: readonly string[] }>
      export type ReadersAnswer = SqlAnswer | Readonly<{ kind: 'SUPERSEDED' }>
      /** SQLSTATE nosso: um bilhete maior já aplicou; a transação inteira volta. */
      const SUPERSEDED = 'CXR01'
      const LEDGER = `${SYNC_SCHEMA}._readers_applied`
      const TICKETS = `${SYNC_SCHEMA}.readers_ticket`

      /** O livro das reconciliações, do login conexus_sync, criado de forma repetível; nenhum login de leitura o lê. */
      function readersLedger(): SqlStatement[] {
        return [
          { text: `CREATE SEQUENCE IF NOT EXISTS ${TICKETS}` },
          { text: `CREATE TABLE IF NOT EXISTS ${LEDGER} (single boolean PRIMARY KEY DEFAULT true CHECK (single), ticket bigint NOT NULL)` },
          { text: `INSERT INTO ${LEDGER} (ticket) VALUES (0) ON CONFLICT DO NOTHING` },
          { text: `REVOKE ALL ON TABLE ${LEDGER} FROM PUBLIC` },
          { text: `REVOKE ALL ON SEQUENCE ${TICKETS} FROM PUBLIC` },
          // conexus_read (parte 1) ganha SELECT nas tabelas novas de sync por ALTER DEFAULT PRIVILEGES.
          { text: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${READ_LOGIN}') THEN REVOKE ALL ON TABLE ${LEDGER} FROM ${quoted(READ_LOGIN)}; END IF; END $$` },
        ]
      }
      /** A trava das permissões de sync: a primeira instrução de toda chamada que mexe nelas. Dois GRANT ou REVOKE
       *  ao mesmo tempo no mesmo objeto falham com XX000 (tuple concurrently updated). */
      const READERS_LOCK: SqlStatement = { text: `SELECT pg_advisory_xact_lock(hashtext('conexus.readers'))` }
      // O livro é criado uma vez, em ensureSync (:107-125): READERS_LOCK antes de ...created (:116) e, depois do
      // CREATE SCHEMA (:118), { text: `SET LOCAL ROLE ${sync}` }, ...readersLedger().
      // grantCopy: READERS_LOCK antes do GRANT USAGE (:341). revokeCopy: READERS_LOCK antes dos dois ramos de
      // statements (:366-372). ensureReader (parte 1, no mesmo arquivo): READERS_LOCK como primeira instrução.

      /** Um bilhete, numa chamada curta: quem pega depois lê o Hub depois. */
      export async function takeReadersTicket(context: Context, owner: DatabaseUrl): Promise<SqlAnswer> {
        const sync = { text: `SET LOCAL ROLE ${quoted(SYNC_LOGIN)}` }
        const next = { text: `SELECT nextval('${TICKETS}')::text AS ticket` }
        const first = await context.transport(owner, [READERS_LOCK, sync, next], budget())
        // Uma empresa de antes desta parte não tem o livro: só então ele é criado aqui, uma vez.
        return first.kind === 'REFUSED' && first.code === UNDEFINED_TABLE
          ? context.transport(owner, [READERS_LOCK, sync, ...readersLedger(), next], budget()) : first
      }
      const UNDEFINED_TABLE = '42P01'
      // o chamador lê o bilhete com z.coerce.bigint() da última resposta

      /** Uma aplicação no banco da empresa, numa transação só, com o bilhete dado; a mais velha é abandonada. */
      export async function reconcileReaders(context: Context, owner: DatabaseUrl, ticket: bigint,
        wanted: readonly WantedReader[]): Promise<ReadersAnswer> {
        const first = await reconcileOnce(context, owner, ticket, wanted)
        // Uma corrida com outra chamada: login criado ao mesmo tempo (42710), catálogo atualizado ao mesmo tempo
        // (XX000), objeto criado ao mesmo tempo (23505, 42P07). Uma nova tentativa só, como ensureSync (:123-124).
        const answer = first.kind === 'REFUSED' && RACES.has(first.code)
          ? await reconcileOnce(context, owner, ticket, wanted) : first
        return answer.kind === 'REFUSED' && answer.code === SUPERSEDED ? { kind: 'SUPERSEDED' } : answer
      }

      const RACES = new Set([DUPLICATE_OBJECT, 'XX000', '23505', '42P07'])

      async function reconcileOnce(context: Context, owner: DatabaseUrl, ticket: bigint,
        wanted: readonly WantedReader[]): Promise<SqlAnswer> {
        const signal = budget()
        const logins = wanted.map((one) => ({ login: roleLogin(one.roleId), tables: one.tables }))
        // 0. Os logins de papel que este banco conhece: os que seguram USAGE no sync daqui.
        //    O servidor de teste é um só para muitas empresas; um login de outra não é tocado.
        const found = await context.transport(owner, [{ text:
          `SELECT rolname FROM pg_roles WHERE rolname LIKE 'conexus\\_role\\_%'
             AND has_schema_privilege(oid, 'sync', 'USAGE')` }], signal)
        if (found.kind !== 'DONE') return found
        const gone = (found.value[0] ?? []).map((row) => String(row.rolname))
          .filter((name) => !logins.some((one) => one.login === name))
        const created = await missingLogins(context, owner, logins.map((one) => one.login), signal)
        if (!Array.isArray(created)) return created
        const sync = quoted(SYNC_LOGIN)
        const mine = ticket.toString()   // um bigint do nextval: número literal, porque um DO não tem parâmetro
        // Uma chamada, uma transação (company-postgres.ts:104-140; test-company-postgres.ts:53, :71).
        const statements: SqlStatement[] = [
          READERS_LOCK,
          { text: `SET LOCAL ROLE ${sync}` },
          { text: `DO $$ BEGIN IF (SELECT ticket FROM ${LEDGER}) >= ${mine} THEN RAISE EXCEPTION USING ERRCODE = '${SUPERSEDED}'; END IF; END $$` },
          { text: 'RESET ROLE' },
          ...created,
          ...logins.flatMap(({ login }) => readSettingsOf(login)),  // as quatro ALTER ROLE ... SET de ensureReader
          { text: `SET LOCAL ROLE ${sync}` },
          ...logins.flatMap(({ login, tables }) => [
            { text: `REVOKE ALL ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} FROM ${quoted(login)}` },
            { text: `GRANT USAGE ON SCHEMA ${SYNC_SCHEMA} TO ${quoted(login)}` },
            ...(tables.length === 0 ? [] :
              [{ text: `GRANT SELECT ON ${tables.map(tableOf).join(', ')} TO ${quoted(login)}` }]),
          ]),
          ...gone.flatMap((login) => [
            { text: `REVOKE ALL ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} FROM ${quoted(login)}` },
            { text: `REVOKE USAGE ON SCHEMA ${SYNC_SCHEMA} FROM ${quoted(login)}` },
          ]),
          { text: `UPDATE ${LEDGER} SET ticket = ${mine}` },
          { text: 'RESET ROLE' },
          ...gone.map((login) => ({ text: `DROP ROLE ${quoted(login)}` })),
        ]
        return context.transport(owner, statements, signal)
      }
      ```
      O transporte manda as instruções de uma chamada numa transação só (`sql.transaction` em `company-postgres.ts:104-140`; `BEGIN` e `COMMIT` em `test-company-postgres.ts:53` e `:71`), e um bloco `DO` é uma instrução comum nos dois. A exceção do bloco aborta a transação inteira; `answerOf` (`company-postgres.ts:43-59`) devolve o SQLSTATE em `REFUSED.code`, e `CXR01` não cai em `CONNECTION_LOST` (`:37`, `^(08|57P0)`). Se `check-migrations` (`scripts/check-migrations.ts:21`) recusar algum texto deste arquivo, o construtor diz qual no relatório: o arquivo não é migração.
      `readSettingsOf(login)` é a função que a parte 1 escreveu para `ensureReader` (as quatro `ALTER ROLE ... SET`), extraída para as duas usarem. Se a parte 1 a deixou dentro de `ensureReader`, este commit a extrai sem mudar o que `ensureReader` manda. `ensureReader` (parte 1, no mesmo arquivo) ganha, depois do seu `GRANT SELECT ON ALL TABLES IN SCHEMA sync`, `DO $$ BEGIN IF to_regclass('sync._readers_applied') IS NOT NULL THEN REVOKE ALL ON TABLE sync._readers_applied FROM conexus_read; END IF; END $$`. Na fachada: `takeReadersTicket: (owner) => takeReadersTicket(context, owner)`, `reconcileReaders: (owner, ticket, wanted) => reconcileReaders(context, owner, ticket, wanted)` e `roleAddress: (host, roleId) => roleAddress(context, host, roleId)`, com os tipos em `CompanyPostgres`. Em `test-company-postgres.ts:133`, a expressão dos logins a derrubar passa a `'^(app_.*_(run|migrate|read)|conexus_sync|conexus_read|conexus_role_.*)$'`.
    - **Testes:** `apps/server/src/platform/copy-readers.test.ts` (novo), sobre `createCompanyDatabase` (`test-company-postgres.ts:119-151`), `testCompanyPostgres` e `asLogin` como em `apps/server/src/platform/company-postgres.test.ts:42-55` e `:141-163`; as tabelas criadas como `conexus_sync` (`copy-sql.test.ts:18-26`). Casos:
      - "cada login de papel lê as suas tabelas e é recusado nas outras com 42501": dois papéis, três tabelas.
      - "reconciliar duas vezes deixa o banco igual": `pg_class.relacl` das três tabelas e `pg_roles` iguais depois da segunda.
      - "tirar uma tabela do conjunto recusa a leitura seguinte".
      - "um login de papel fora da lista perde tudo e é apagado".
      - "o login de um papel não troca de papel, não escreve e não lê a tabela de outro papel": `SET ROLE conexus_sync`, `select set_config('role','conexus_sync',true), query_to_xml('select * from sync.b', true, false, '')`, `insert`, e `select` da tabela do outro papel, cada um recusado pelo banco (testing T13, a prova foi rodada no Postgres 18).
      - "o information_schema do login lista só as tabelas dele".
      - "o id da biblioteca e o uuid cabem; um id que passa de 63 bytes falha sem login": `roleLogin('A'.repeat(32))`, `roleLogin(randomUUID())` e `roleLogin('x'.repeat(51))`.
      - "o login de outra empresa no mesmo servidor fica": um segundo banco descartável com o seu login de papel, que a reconciliação do primeiro não toca.
      - "roleAddress entra como o login do papel": `select current_user` pelo endereço devolve `conexus_role_<id>`, com a caixa do id.
      - "a reconciliação mais velha aplicada depois da mais nova não muda nada": dois bilhetes `t1 < t2`; `reconcileReaders(t2, A)` e depois `reconcileReaders(t1, B)`; a segunda devolve `SUPERSEDED`, e `pg_class.relacl` e `sync._readers_applied` ficam como depois da primeira (propriedade 9).
      - "o mesmo bilhete duas vezes também é abandonado": `reconcileReaders(t2, A)` duas vezes; a segunda devolve `SUPERSEDED`.
      - "o livro não aparece para nenhum login de leitura": `information_schema.tables` lido como `conexus_read` e como cada login de papel não lista `_readers_applied`, e `select * from sync._readers_applied` e `select nextval('sync.readers_ticket')` dão `42501` para os dois, mesmo com `ensureReader` rodado depois do livro.
      - "ensureSync duas vezes cria o livro uma vez": a sequência, a tabela e a linha única, sem erro na segunda.
      - "o bilhete numa empresa sem livro cria o livro e devolve 1": `sync` criado sem o livro (o `CREATE SCHEMA` de hoje como dono); `takeReadersTicket` devolve `1` e o livro existe.
      - "duas reconciliações e um grantCopy ao mesmo tempo terminam sem erro": dois bilhetes, `Promise.all` de `reconcileReaders(t1, A)`, `reconcileReaders(t2, B)` e `grantCopy` de uma tabela que A e B também dão, a um login de app, repetido 20 vezes; nenhuma resposta `REFUSED`, uma das duas reconciliações `DONE` e a outra `DONE` ou `SUPERSEDED`, e `pg_class.relacl` igual ao de B.
      O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** trocar `login` por `READ_LOGIN` em `roleAddress` faz falhar "roleAddress entra como o login do papel"; trocar `>=` por `>` no bloco `DO` faz falhar "o mesmo bilhete duas vezes"; tirar o `UPDATE` do livro faz falhar "a reconciliação mais velha"; tirar o `REVOKE` de `conexus_read` em `readersLedger` faz falhar "o livro não aparece"; tirar `READERS_LOCK` de `grantCopy` faz falhar "duas reconciliações e um grantCopy ao mesmo tempo" com `XX000` numa das 20 voltas; tirar o ramo `42P01` de `takeReadersTicket` faz falhar "o bilhete numa empresa sem livro"; tirar o `REVOKE ALL` antes do `GRANT` faz falhar "tirar uma tabela do conjunto recusa a leitura seguinte"; tirar `has_schema_privilege` faz falhar "o login de outra empresa no mesmo servidor fica" com `2BP01`; trocar `> IDENTIFIER_BYTES` por `>= 64 * 2` faz falhar o caso dos 63 bytes.
    - **Pronto quando:** o arquivo passa, e `select rolname from pg_roles where rolname like 'conexus_role_%'` depois do teste não mostra login nenhum deixado.
    - _Requisitos: 2.1, 2.2, 2.7, 2.8, 2.9, 2.10, 3.2_
  - [ ] 4.2 Quem lê, a porta da identidade, N3b-1 e a semeadura (um commit)
    - **Arquivos:** `apps/server/src/hub/identity/role-rows.ts` (novo), `apps/server/src/hub/identity/public.ts`, `apps/server/src/hub/connectors/copy-sources.ts`, `apps/server/src/hub/connectors/public.ts`, `apps/server/src/hub/copies/readers.ts` (novo), `apps/server/src/hub/copies/accept.ts`, `apps/server/src/hub/copies/enable.ts`, `apps/server/src/hub/copies/run.ts`, `apps/server/src/hub/copies/service.ts`, `apps/server/src/hub/copies/readers.test.ts` (novo), `scripts/rerun-never.json`.
    - **Referência a seguir:** `readRoles` em `apps/server/src/hub/identity/company-roles.ts:82-129` (a leitura das linhas de papel e a contagem de membros por papel), `Statements` em `apps/server/src/hub/identity/roles.ts:11-12`, o recurso `connector_<id>` como `may-use.ts:106` o pede. A regra de hoje para quem liga: `lackedReadOf` em `apps/server/src/hub/connectors/copy-sources.ts:48-63` (versão 1, todas as leituras da porta) e `lackedSourceReadOf` em `:70-96` (versão 2, a leitura de lista). `insertedCopy` em `apps/server/src/hub/copies/accept.ts:62-93`, chamado em `accept.ts:204-207` e em `enable.ts:70-75`. A ordem "linha primeiro, depois o banco": `grantCopy` em `apps/server/src/hub/copies/grants.ts:74-101`. O dono do banco por ato: `companyOwner` em `apps/server/src/hub/copies/store.ts:155-180`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // apps/server/src/hub/identity/role-rows.ts
      export type CompanyRoleRow = Readonly<{ id: string; role: Role; label: string; members: number }>
      /** As linhas de papel da empresa (o desenvolvedor, o membro e os próprios), com quantas pessoas cada uma tem. */
      export async function companyRoleRows(tx: ReadTx, companyId: CompanyId): Promise<CompanyRoleRow[]>
      //  select id, role, label from auth.organization_role where company_id = $1
      //  e a contagem de auth.member por role, como readRoles (company-roles.ts:100-105)
      /** Os papéis editáveis que seguram todas as operações pedidas do conector; nenhum quando não há operação. */
      export async function rolesHolding(tx: ReadTx, input: { companyId: CompanyId; connectorId: string;
        operations: readonly string[] }): Promise<{ id: string; role: Role }[]> {
        if (input.operations.length === 0) return []
        const rows = await tx.select({ id: organizationRole.id, role: organizationRole.role,
          permission: organizationRole.permission }).from(organizationRole)
          .where(eq(organizationRole.organizationId, input.companyId))
        return rows.flatMap((row) => {
          const held = new Set(Statements.parse(JSON.parse(row.permission))[`connector_${input.connectorId}`] ?? [])
          return input.operations.every((one) => held.has(one)) ? [{ id: row.id, role: Role.parse(row.role) }] : []
        })
      }
      // apps/server/src/hub/identity/public.ts, em ports:  companyRoleRows, rolesHolding,

      // apps/server/src/hub/connectors/copy-sources.ts (e exportado em connectors/public.ts)
      /** As leituras que a origem de uma cópia pede ao papel: a porta inteira na versão 1, a leitura de lista na 2. */
      export function sourceReadsOf(connectorId: string, definition: CopyDefinition): readonly string[]
      //  versão 1: Object.values(connectorOf(connectorId)?.readDoor ?? {}).map((read) => read.id)
      //  versão 2: [definition.source.operation]

      // apps/server/src/hub/copies/readers.ts
      export async function readersOf(tx: ReadTx, companyId: CompanyId): Promise<Map<CopyId, string[]>>
      /** As cópias que um papel lê; o dono e o administrador, todas. */
      export async function copiesReadBy(deps, tx, input: { companyId; role: Role }): Promise<'ALL' | CopyId[]>
      //  role 'owner' | 'admin' -> 'ALL'
      //  linha = (await deps.identity.companyRoleRows(tx, companyId)).find((one) => one.role === role)
      //  sem linha -> []   (um papel que ninguém tem mais não lê nada)
      //  senão: select copy_id from copies.copy_reader where company_id = $1 and role_id = linha.id
      export async function rolesReadingSource(deps, tx, input: { companyId; connectorId; definition })
        : Promise<string[]>
      //  (await deps.identity.rolesHolding(tx, { companyId, connectorId,
      //     operations: sourceReadsOf(connectorId, definition) })).map((one) => one.id)
      /** Com que login uma pessoa lê na empresa: conexus_read para dono e administrador, o do papel para os outros. */
      export type CopyReader = Readonly<{ kind: 'ALL' } | { kind: 'ROLE'; roleId: string } | { kind: 'NONE' }>
      export async function readerOf(deps, tx, input: { companyId; role: Role }): Promise<CopyReader>
      //  owner | admin -> ALL; linha do papel -> { kind: 'ROLE', roleId: linha.id }; sem linha -> NONE
      /** Há cópia cujas marcas ainda não foram gravadas: a semeadura deve rodar antes de mostrar. */
      export async function unseeded(tx, companyId): Promise<boolean>
      //  select 1 from copies.copy where company_id = $1 and readers_set = false limit 1
      /** Lê como o login de quem pergunta, com o conserto: o único lugar que escolhe o endereço de leitura. */
      export async function readAs(deps, input: InCompany & { host: string; reader: CopyReader;
        statements: readonly SqlStatement[]; signal: AbortSignal }): Promise<SyncRead | { kind: 'NOT_IN_ROLE' }>   // SyncRead: o nome da parte 1 (CopyRead já existe em hub/connectors/copy-port.ts:46)
      //  NONE -> { kind: 'NOT_IN_ROLE' }
      //  ALL  -> readCopies(readerAddress(host)); NO_LOGIN -> ensureReader pelo dono, COPY_READER_MADE, e uma
      //          nova tentativa (o que readCopyTable da parte 1 faz hoje e passa a pedir aqui)
      //  ROLE -> readCopies(roleAddress(host, roleId))
      //          REFUSED 42501 ou NO_LOGIN, e copiesReadBy do papel não vazio (o catálogo lista ao menos uma tabela):
      //            reconciled(deps, input) === 'FAILED' -> devolve a resposta da primeira leitura
      //            senão uma nova tentativa, uma só; a segunda passa -> log.info({ companyId, personId }, 'COPY_READERS_REPAIRED')
      //          REFUSED 42501 sem tabela no catálogo, ou de novo na segunda -> { kind: 'NOT_IN_ROLE' }
      //            com log.info({ companyId, personId }, 'DATA_READ_REFUSED'), sem a consulta (security S41)
      /** O que o banco da empresa deve dizer: cada papel editável, com os nomes das cópias que ele lê. */
      async function wantedOf(deps, tx, companyId): Promise<WantedReader[]>
      /** Semeia as cópias sem leitor gravado (readers_set falso) pela regra N3b-1, uma vez. */
      async function seeded(deps, tx, input: InCompany): Promise<number>
      //  as cópias de readers_set falso; para cada uma: rolesReadingSource, insert em copy_reader
      //  (granted_by = input.personId) com .onConflictDoNothing(), update copy set readers_set = true;
      //  devolve quantas. Duas primeiras leituras ao mesmo tempo semeiam uma vez, sem 23505.
      /** Uma aplicação: bilhete, leitura curta do Hub, aplicação no banco da empresa; nenhuma transação do Hub aberta
       *  durante uma chamada ao banco da empresa (data D22, grants.ts:69, enable.ts:126). */
      async function appliedOnce(deps, input: InCompany & { owner: DatabaseUrl })
        : Promise<{ answer: ReadersAnswer; wanted: WantedReader[] }>
      //  taken = await deps.companyPostgres.takeReadersTicket(input.owner)
      //  taken.kind !== 'DONE' -> { answer: taken, wanted: [] }
      //  ticket = z.coerce.bigint().parse(taken.value.at(-1)?.[0]?.ticket)
      //  wanted = await deps.database.read(personScope(input), (tx) => wantedOf(deps, tx, input.companyId))
      //  try { return { answer: await deps.companyPostgres.reconcileReaders(input.owner, ticket, wanted), wanted } }
      //  catch (error) {
      //    if (error instanceof Failure && error.details?.reason === 'COPY_READER_NAME')
      //      deps.log.error({ companyId: input.companyId }, 'COPY_READER_NAME')
      //    throw error            // nenhum outro erro é tratado aqui
      //  }
      /** A reconciliação inteira de uma empresa; o banco calado não lança. É `reconciled`; `reconcileReaders` é a aplicação. */
      export async function reconciled(deps, input: InCompany): Promise<'DONE' | 'FAILED'>
      //  1. owner = await companyOwner(deps, input); undefined -> log COPY_READERS_FAILED { reason: 'NO_OWNER' }, 'FAILED'
      //  2. a semeadura numa transação própria, com commit, antes de qualquer aplicação:
      //     seededCount = await deps.database.command(personScope(input), (tx) => seeded(deps, tx, input))
      //     seededCount > 0 -> log.info({ companyId, copies: seededCount }, 'COPY_READERS_SEEDED')
      //  3. for (const round of [1, 2]):
      //       { answer, wanted } = await appliedOnce(deps, { ...input, owner })
      //       answer.kind === 'SUPERSEDED' -> log.info({ companyId }, 'COPY_READERS_SUPERSEDED'); 'DONE'
      //         (um bilhete maior leu o Hub depois deste e já aplicou)
      //       answer.kind !== 'DONE' -> log.error({ companyId, code }, 'COPY_READERS_FAILED'); 'FAILED'
      //       again = await deps.database.read(personScope(input), (tx) => wantedOf(deps, tx, input.companyId))
      //       igual a wanted (papéis e tabelas ordenados) -> 'DONE'
      //       diferente e round === 1 -> segue para a segunda volta, com bilhete novo
      //     diferente depois da segunda -> 'DONE': o ato que mudou o Hub roda a sua própria reconciled
      ```
      `insertedCopy` ganha o parâmetro `readers: readonly string[]` e grava, na mesma transação, `tx.insert(copyReader).values(readers.map((roleId) => ({ companyId, copyId: row.id, roleId, grantedBy: input.personId, grantedAt: sql\`statement_timestamp()\` })))` quando há leitor, e `readersSet: true` no `insert` da cópia. `fromModel` (`enable.ts:59-77`) e `acceptedIn` (`accept.ts:185-221`) calculam `readers = await rolesReadingSource(deps, tx, {...})` antes de `insertedCopy`; `fromModel` passa a receber `deps`. Em `enableCopy` (`enable.ts:132-172`), depois de a tabela existir (`table.kind === 'DONE'`) e antes do relógio: `if ((await reconciled(deps, input)) === 'FAILED') deps.log.info({ companyId, copyId }, 'COPY_READERS_PENDING')` e segue. `service.ts` põe `readers` dentro de `data`, a porta que a parte 1 deu a `hub/data` (`CopyService['data']`, com `catalogTables` e `tableRows`): `readers: { copiesReadBy, readerOf, unseeded, readAs: (input) => readAs(full, input), reconcile: (input) => reconciled(full, input) }`. As chamadas de `hub/data` ficam `deps.copies().readers.*`. A semeadura é `reconcile`: ela semeia e faz commit antes de aplicar. Em `apps/server/src/hub/copies/run.ts`, `ended` chama, depois do log `COPY_RUN_ENDED` (`:122-130`) e antes do `return { kind: 'ENDED', outcome }` da `:131`: `await reconciled(deps, { companyId, personId: claimed.copy.createdBy })`, com o `companyId` já tirado de `claimed.copy` na `:95`. `'FAILED'` só segue, porque `reconciled` já registrou `COPY_READERS_FAILED`; o resultado da rodada não muda. `claimed.copy` é um `StoredCopy` (`source-pass.ts:12-13`), com `createdBy` (`store.ts:131`). É quem conserta o que um ato deixou pendente: a reconciliação seguinte vem no máximo no intervalo da cópia, 30 minutos por padrão (`COPY_INTERVAL_DEFAULT`, `packages/hub-api/src/copies.ts:22`). Nenhum chamador de `reconciled` está dentro de uma transação do Hub: `enableCopy` depois da sua, `ended` depois da sua, e `summaries`, `listed`, o catálogo e `readAs` fora das deles.
    - **Testes:** `apps/server/src/hub/copies/readers.test.ts` (novo), com `copiesOn` de `apps/server/src/hub/copies/test-copies.ts:137-204`, os papéis criados pela rota `POST /api/companies/{companyId}/roles` como `ATENDENTE` em `apps/server/src/hub/identity/test-roles.ts:26`, e `memberOn` (`test-hub.ts:329`). Casos:
      - "a cópia nasce marcada para o papel que segura as leituras da origem e não para o outro": um papel "Vendas" com todas as leituras da porta do Sankhya e um "Financeiro" sem elas; `on.enable('vendas')`; a linha só de Vendas, e `readers_set` verdadeiro.
      - "a proposta aceita nasce marcada pela leitura de lista", com `apps/server/src/hub/copies/test-proposals.ts`.
      - "ligar dá o SELECT ao login do papel e o outro é recusado com 42501", lido como o login pela senha derivada.
      - "o banco da empresa calado ao ligar deixa a cópia ligada e diz COPY_READERS_PENDING": `t.mock.method(on.hub.postgres.companyPostgres, 'reconcileReaders', async () => ({ kind: 'NO_ANSWER' }))`, como `grants.test.ts:81-83`.
      - "as cópias de antes são marcadas uma vez": `plantCopy(on, copyId, 'readers_set = false')` e as linhas apagadas como dono; `reconcile` duas vezes; `COPY_READERS_SEEDED` uma vez só.
      - "a cópia que ficou sem leitor não volta a ser marcada": `readers_set` verdadeiro e nenhuma linha; `reconcile`; continua sem linha.
      - "apagar o papel apaga a marca": `DELETE /api/companies/{companyId}/roles/{role}` do papel sem membro; nenhuma linha dele.
      - "a reconciliação mais velha aplicada depois da mais nova não muda nada": `t.mock.method(on.hub.postgres.companyPostgres, 'reconcileReaders', ...)` que, na primeira chamada, espera uma promessa aberta pelo teste e depois chama a função real; a reconciliação R1 pega o bilhete, lê o Hub com `sankhya_clientes` no Financeiro e para ali; o teste tira a linha de `copy_reader` como dono e roda R2 inteira, com bilhete maior; solta R1; R1 recebe `SUPERSEDED` e devolve `'DONE'`; o login do Financeiro é recusado com `42501` em `sankhya_clientes` (propriedade 9).
      - "o Hub mudou entre a leitura e a aplicação: uma segunda volta com bilhete novo": o dublê para a primeira aplicação; o teste acrescenta uma linha de `copy_reader` como dono; solta; `takeReadersTicket` foi chamado duas vezes e o login lê a tabela nova.
      - "a semeadura faz commit antes da aplicação": `reconcileReaders` dublado para falhar com `NO_ANSWER`; depois de `reconcile`, as linhas semeadas estão no Hub (`readers_set` verdadeiro) e o login não ganhou `GRANT` nenhum.
      - "duas primeiras leituras ao mesmo tempo semeiam uma vez": `plantCopy` com `readers_set = false` e as linhas apagadas; `Promise.all` de dois `reconcile`; nenhum lança, e cada papel tem uma linha só.
      - "o fim da rodada reconcilia; a falha só loga": uma linha de `copy_reader` acrescentada como dono, sem reconciliar; `runCopy` até o fim; o login lê a tabela nova. Com `reconcileReaders` dublado para `NO_ANSWER`, a rodada termina com o mesmo resultado e o log tem `COPY_READERS_FAILED`.
      - "o nome longo demais diz COPY_READER_NAME": `identity.companyRoleRows` trocado por `t.mock.method` devolve um papel com id de 51 caracteres; `reconcile` lança `INTERNAL_UNEXPECTED` e o log tem `COPY_READER_NAME`.
      O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** trocar `every` por `some` em `rolesHolding` faz falhar o primeiro caso; tirar `readersSet: true` do `insert` faz falhar "as cópias de antes são marcadas uma vez" com duas linhas; tirar o filtro `readers_set = false` de `seeded` faz falhar "a cópia que ficou sem leitor não volta a ser marcada"; tirar `onDelete('cascade')` de `copy_reader_role_fkey` (unidade 1.1) faz falhar "apagar o papel apaga a marca"; pegar o bilhete depois de ler o Hub faz falhar "a reconciliação mais velha"; tirar a segunda volta faz falhar "o Hub mudou entre a leitura e a aplicação"; tirar `.onConflictDoNothing()` de `seeded` faz falhar "duas primeiras leituras ao mesmo tempo" com `23505`; tirar a chamada de `ended` faz falhar "o fim da rodada reconcilia".
    - **Pronto quando:** `readers.test.ts` e `apps/server/src/hub/copies/enable.test.ts`, `accept.test.ts`, `accept-v2.test.ts`, `run.test.ts` passam; `npm run deps` passa (a trilha Dados lê os papéis só pela porta).
    - _Requisitos: 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.5, 2.8, 2.10, 2.11_
  - [ ] 4.3 Ponto de conferência do grupo 4
    - Rodar os testes que o grupo toca: `apps/server/src/platform/copy-readers.test.ts`, `apps/server/src/platform/copy-sql.test.ts`, `apps/server/src/platform/company-postgres.test.ts`, `apps/server/src/hub/copies/readers.test.ts`, `enable.test.ts`, `accept.test.ts`, `accept-v2.test.ts`, `run.test.ts`, `grants.test.ts`, `apps/server/src/hub/identity/roles.test.ts`, `roles-delete.test.ts`, e `node scripts/test-run.ts scripts/rerun-exempt.test.ts`. Depois `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: a reconciliação rodada num banco descartável, pstack `deslop` e `no-comments`, as mutações das duas unidades, um commit por unidade.
    - Linha da tabela de referência: "O banco garante", `copy-sql.ts:331-347` e `app-read.ts:41-67`, nativo, com a prova rodada no Postgres 18.
    - A CI roda `check` e os testes do servidor em quatro partes. Os dois arquivos novos nunca ganham segunda rodada.
- [ ] 5. Grupo 5: o contrato (um PR, só o contrato e a conformidade, `docs/steps/trilhas/dados.md:72-78`)
  - [ ] 5.1 `withheld` no catálogo e `NOT_IN_ROLE` da tabela retida (um commit)
    - **Arquivos:** `packages/hub-api/src/company-data.ts`, `packages/hub-api/src/company-data-conformance.ts`, `packages/hub-api/src/company-data.test.ts`, `apps/server/src/hub/data/catalog.ts` (uma linha, para compilar), `apps/server/src/builder/data-tools/test-data.ts` e `apps/server/src/builder/data-tools/tools.test.ts` (da parte 3: os catálogos fixos ganham `withheld: []`), `scripts/rerun-never.json`.
    - **Referência a seguir:** `Catalog` em `packages/hub-api/src/company-data.ts:54-58`, `sourceOf` em `:192-207`, a forma das leis e de `LAWS` em `packages/hub-api/src/company-data-conformance.ts:260-313`, e o mundo falso em `packages/hub-api/src/company-data.test.ts:103-146`. O molde do "existe e não é seu": `allowed: false` em `packages/hub-api/src/connectors.ts:42-48`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // packages/hub-api/src/company-data.ts
      /** Uma tabela que existe e o papel de quem pergunta não lê: só o nome e o rótulo, nunca coluna ou descrição. */
      export const WithheldTable = z.object({ name: z.string(), label: z.string() })
      export const Catalog = z.object({
        kind: z.literal('CATALOG'),
        systems: z.array(CatalogSystem),
        tables: z.array(CatalogTable),
        withheld: z.array(WithheldTable),
      })
      const NOT_IN_ROLE = { kind: 'NOT_IN_ROLE' } as const
      type Source = ... | typeof NOT_IN_ROLE
      // sourceOf, caso TABLE:
      if (catalog.withheld.some(({ name }) => name === request.table)) return NOT_IN_ROLE
      // read: case 'NOT_IN_ROLE': return source
      ```
      Em `apps/server/src/hub/data/catalog.ts`, o retorno de `catalogOf` ganha `withheld: []`: é a linha que mantém o servidor compilando até o grupo 6.
      `DataWorld` (`company-data-conformance.ts:18-29`, com o `queries` da parte 3) ganha, para as duas leis novas:
      ```ts
      /** Uma tabela que o catálogo do mundo põe em `withheld`, e uma consulta que só ela responde. */
      withheld: Readonly<{ table: string; query: string }>
      ```
      `withheld` é obrigatório em `DataWorld`, e nenhuma lei pula. O único mundo que existe quando este PR entra é o falso, que o ganha aqui. O mundo real da parte 3 (grupos 5 e 6 dela) entra depois da unidade 6.1 desta parte, e já nasce com a tabela retida.
      Leis novas em `LAWS`, cada uma com o caso recusado:
      - "uma tabela retida nunca aparece em tables e a leitura dela responde NOT_IN_ROLE sem pedir linhas": `world.reached.rows` vazio depois de `read({ kind: 'TABLE', table: retida.name })`, e nenhum nome de `withheld` em `tables`.
      - "uma consulta que o banco recusa por permissão responde NOT_IN_ROLE e não devolve linha": o mundo falso responde `NOT_IN_ROLE` em `query` quando o texto nomeia a tabela retida; a resposta não tem `rows`.
      O `CATALOG` falso de `company-data.test.ts` ganha `withheld: [{ name: 'erp_titulos', label: 'Títulos a receber' }]`, o mundo falso ganha `withheld: { table: 'erp_titulos', query: 'select 1 from erp_titulos' }`, e o `query` falso (parte 3) responde `{ kind: 'NOT_IN_ROLE' }` para esse texto. O `CATALOG` de `test-data.ts` e os catálogos falsos de `tools.test.ts` ganham `withheld: []`.
    - **Testes:** `packages/hub-api/src/company-data.test.ts` roda `runDataConformance` com as leis novas. Ele entra em `scripts/rerun-never.json` como teste pelo nome: `{ "file": "packages/hub-api/src/company-data.test.ts", "name": "uma tabela retida nunca aparece em tables e a leitura dela responde NOT_IN_ROLE sem pedir linhas" }` e a da consulta.
    - **Mutações à mão:** tirar a linha `withheld.some` de `sourceOf` faz falhar a primeira lei com `NOT_IN_CATALOG`; mandar `sources.query` passar as linhas numa recusa faz falhar a segunda.
    - **Pronto quando:** `node scripts/test-run.ts packages/hub-api/src/company-data.test.ts` passa, `npm run typecheck` passa, e o PR muda só o contrato, a conformidade, o teste, a linha de `catalog.ts` e os `withheld: []` das fixturas.
    - _Requisitos: 3.3, 3.4, 3.5_
  - [ ] 5.2 Ponto de conferência do grupo 5
    - Rodar `packages/hub-api/src/company-data.test.ts`, os testes da parte 3 que usam o catálogo (`apps/server/src/hub/data/*.test.ts`), `scripts/rerun-exempt.test.ts`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`.
    - O PR responde à issue `contrato` desta parte, com o exemplo do escopo 6.2 (Bruno pede o contas a receber). O consumidor entra no grupo 6, noutro PR.
    - Exceção registrada no PR: o grupo tem uma unidade de commit só, porque a mudança do contrato é sempre um PR só dela (`docs/steps/trilhas/dados.md:75`, o índice). O corpo do PR lista, como o mínimo para compilar, a linha `withheld: []` em `apps/server/src/hub/data/catalog.ts` e as duas leis em `scripts/rerun-never.json`, como a decisão `D19` do índice faz na parte 1: não carregam comportamento.
    - Linha da tabela de referência: "A lista do que o papel não lê", `connectors.ts:42-48`, remendo pequeno.
- [ ] 6. Grupo 6: o catálogo por papel (um PR)
  - [ ] 6.1 `catalogOf` filtrado, a leitura pelo login do papel e o conserto em `42501` (um commit)
    - **Arquivos:** `apps/server/src/hub/copies/catalog-view.ts`, `apps/server/src/hub/copies/read-table.ts`, `apps/server/src/hub/copies/service.ts`, `apps/server/src/hub/copies/sample.ts`, `apps/server/src/hub/data/catalog.ts`, `apps/server/src/hub/data/query.ts`, `apps/server/src/hub/data/rows.ts`, `apps/server/src/hub/data/catalog-role.test.ts` (novo), `scripts/rerun-never.json`. Os de `hub/copies` e os de `hub/data` são da parte 1 e da parte 3: esta unidade os muda como abaixo, e não muda os arquivos da spec delas.
    - **Referência a seguir:** na parte 1, `catalogTables` e `tableRowsByName` em `catalog-view.ts` (o `tasks.md` da parte 1, unidade 4.1), `readCopyTable` em `read-table.ts` com a leitura sempre por `readerAddress` e o conserto de `NO_LOGIN` por `ensureReader` (unidade 2.2), e `catalogOf` e `rowsOf` em `hub/data` (unidade 4.2). Na parte 3, a escolha do login em linha no passo 2 de `queryOf` (`C2`). A admissão que devolve o papel: `admit` em `apps/server/src/hub/identity/admission.ts:355-361`, entregue como `deps.identity.admitMember` (`apps/server/src/hub/identity/public.ts:101`), que devolve um `MemberProof` com `role` (`admission.ts:196-212`).
    - **O que sai:** em `catalogOf`, a regra "nenhuma para os outros" do lugar `COMPANY` (parte 1, `C7`) e a linha `withheld: []` do grupo 5. Em `queryOf`, o passo 2 em linha e a recusa `NOT_IN_ROLE` de "outro papel" no lugar `COMPANY`. Em `readCopyTable`, a escolha fixa de `readerAddress` e o conserto de `NO_LOGIN`, que passam a `readAs` (unidade 4.2).
    - **O que entra:**
      ```ts
      // apps/server/src/hub/copies/catalog-view.ts (parte 1): o filtro novo
      export async function catalogTables(deps: CopiesDeps, tx: ReadTx, input: { companyId: CompanyId;
        only: 'ALL' | { projectId: ProjectId } | { copies: readonly CopyId[] } }): Promise<CatalogTable[]>
      //  { copies } -> select from copy where company_id and id in (copies); o resto como a parte 1
      // a assinatura nova de tableRows: o leitor vai junto
      export async function tableRowsByName(deps: CopiesDeps, input: { companyId: CompanyId; personId: PersonId;
        name: string; limit: number; signal: AbortSignal; reader: CopyReader })
        : Promise<TableRead | { kind: 'NO_COPY' }>

      // apps/server/src/hub/copies/read-table.ts (parte 1)
      //  readCopyTable recebe { ..., personId, reader: CopyReader } e lê por
      //  readAs(deps, { companyId, personId, host: ready.host, reader, statements: [statement], signal });
      //  TableRead ganha { kind: 'NOT_IN_ROLE' } para o que readAs devolve assim
      // service.ts: data.tableRows: (input) => tableRowsByName(full, input), com a assinatura nova
      // sample.ts (parte 1): sampleOf passa { ..., personId, reader: { kind: 'ALL' } } a readCopyTable, para o commit
      //   compilar; a unidade 6.3 troca pelo leitor do papel

      // apps/server/src/hub/data/catalog.ts, dentro da mesma leitura do Hub
      const proof = await deps.identity.admitMember({ tx, companyId, personId, action: 'readCompany' })
      const reads = scope.place.kind === 'PROJECT' ? 'ALL'
        : await deps.copies().readers.copiesReadBy(tx, { companyId, role: proof.role })
      const tables = scope.place.kind === 'PROJECT'
        ? await deps.copies().catalogTables(tx, { companyId, only: { projectId } })
        : await deps.copies().catalogTables(tx, { companyId, only: reads === 'ALL' ? 'ALL' : { copies: reads } })
      const withheld = reads === 'ALL' ? [] : (await deps.copies().catalogTables(tx, { companyId, only: 'ALL' }))
        .filter((one) => !tables.some((kept) => kept.name === one.name))
        .map(({ name, label }) => ({ name, label }))
      const needsSeed = scope.place.kind === 'COMPANY' && await deps.copies().readers.unseeded(tx, companyId)
      // fora da leitura: needsSeed -> await deps.copies().readers.reconcile({ companyId, personId }), que semeia,
      //   e a leitura do catálogo roda de novo, uma vez

      // apps/server/src/hub/data/rows.ts
      //  reader = PROJECT ? { kind: 'ALL' } (a parte 1 lê o Projeto por conexus_read, sobre o catálogo do Projeto)
      //         : database.read: admitMember(readCompany).role -> deps.copies().readers.readerOf(tx, { companyId, role })
      //  read = await deps.copies().tableRows({ companyId, personId, name, limit, signal, reader })
      //  NOT_IN_ROLE -> a tabela estava no catálogo e o banco recusou depois do conserto:
      //                 log DATA_ROWS_FAILED { reason: 'NOT_IN_ROLE' }; { kind: 'TABLE_UNAVAILABLE' } (Page não tem NOT_IN_ROLE)

      // apps/server/src/hub/data/query.ts, o passo 2 de queryOf (parte 3)
      //  PROJECT -> como a parte 3: readAddress do Projeto e o conserto dela
      //  COMPANY -> reader = readerOf(role); read = await deps.copies().readers.readAs({ companyId, personId, host,
      //             reader, statements: [EXPLAIN, a consulta], signal })
      //             NOT_IN_ROLE -> { kind: 'NOT_IN_ROLE' } (o log DATA_READ_REFUSED já saiu em readAs)
      //             o resto do switch da parte 3 segue igual
      ```
      `seeData` (unidade 6.3) não entra aqui: o catálogo continua admitindo `readCompany`, como a parte 1.
    - **Testes:** `apps/server/src/hub/data/catalog-role.test.ts` (novo), pela porta pública, com `copiesOn` e as cinco cópias do Sankhya ligadas, Bruno no papel Vendas (vendas, itens, vendedores, produtos) e Carla no Financeiro (clientes). Casos:
      - "o catálogo de um papel lista exatamente as tabelas que o login do papel lê": `catalog().tables` contra `select table_name from information_schema.tables where table_schema = 'sync'` lido pelo `roleAddress` de cada papel.
      - "a tabela que o papel não lê vem em withheld só com o nome e o rótulo".
      - "Bruno lê sankhya_clientes e recebe NOT_IN_ROLE, sem linha".
      - "uma consulta de Bruno que junta vendas e clientes é recusada pelo banco e não devolve linha".
      - "o banco que perdeu o GRANT é consertado na primeira leitura": o `REVOKE` dado à mão como `conexus_sync`; a leitura de `sankhya_vendas` passa e `COPY_READERS_REPAIRED` sai.
      - "o catálogo semeia as cópias de antes": `readers_set = false` plantado; o primeiro `describe` traz as tabelas pela regra N3b-1 e `COPY_READERS_SEEDED` sai.
      - "o dono lê tudo com conexus_read e withheld vem vazio".
      - "no Projeto, withheld vem vazio e o login é o do Projeto".
      - "DATA_READ_REFUSED leva a pessoa e não leva a consulta": nenhum campo do log contém o texto SQL (security S41).
      O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** tirar o filtro `{ copies: reads }` em `catalogOf` faz falhar o primeiro caso; devolver `{ kind: 'ALL' }` para todo papel em `readerOf` faz falhar "Bruno lê sankhya_clientes"; tirar a nova tentativa de `readAs` faz falhar "o banco que perdeu o GRANT"; tirar a chamada de `reconcile` quando `needsSeed` faz falhar "o catálogo semeia".
    - **Pronto quando:** o arquivo passa, e `apps/server/src/hub/copies/catalog-view.test.ts` e `sample.test.ts` da parte 1 continuam passando.
    - _Requisitos: 1.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ] 6.2 As rotas `listCopyReaders` e `setRoleCopies` (um commit)
    - **Arquivos:** `packages/hub-api/src/copies.ts`, `apps/server/src/hub/copies/readers.ts`, `apps/server/src/hub/copies/service.ts`, `apps/server/src/hub/copies/routes.ts`, `apps/server/src/hub/copies/readers-routes.test.ts` (novo), `scripts/rerun-never.json`.
    - **Referência a seguir:** `listCopies` e as listas de falhas em `packages/hub-api/src/copies.ts:155-178`, `updateRole` e `OfRole` em `packages/hub-api/src/company-roles.ts:47-100`, `serve` em `apps/server/src/hub/copies/routes.ts:33-94`. A ordem "o Hub primeiro, depois o banco": `grantCopy` em `apps/server/src/hub/copies/grants.ts:74-101`. Aqui ela vale também para tirar: o login do Hub só lê, inclui e apaga em `copy_reader`, e apagar a marca é o que diz "saindo". A admissão de quem muda papéis: `admitted` em `apps/server/src/hub/identity/company-roles.ts:173-181` (`manageRoles`, numa transação de escrita: `manageRoles` tem `locks: true`, `admission.ts:124`, e a admissão faz `.for('share')`, `admission.ts:325`, que uma transação só de leitura recusa, `apps/server/src/platform/database.ts:203`).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // packages/hub-api/src/copies.ts
      const OfRole = InCompany.extend({ role: Role })
      export const CopyReaders = z.object({ copyId: CopyId,
        roles: z.array(z.object({ role: Role, label: z.string(), members: z.int().min(0) })) })
      export const listCopyReaders = defineOperation({
        id: 'listCopyReaders', summary: 'Lists the roles that read each copy of the company, with how many people each holds.',
        access: 'session', method: 'GET', path: '/api/companies/{companyId}/copy-readers', bodyLimit: 1024,
        input: { params: InCompany },
        success: { status: 200, body: z.object({ readers: z.array(CopyReaders) }) },
        failures: READ_FAILURES,
      })
      export const ROLE_COPIES_MAX = 200
      export const setRoleCopies = defineOperation({
        id: 'setRoleCopies', summary: 'Replaces the copies a role of the company reads; the owner and the administrator read every copy.',
        access: 'session', method: 'PUT', path: '/api/companies/{companyId}/roles/{role}/copies', bodyLimit: 16384,
        input: { params: OfRole, body: z.object({ copies: z.array(CopyId).max(ROLE_COPIES_MAX) }) },
        success: { status: 200, body: z.object({ copies: z.array(CopyId) }) },
        failures: [...READ_FAILURES, 'ROLE_FIXED', 'ROLE_NOT_FOUND', 'COPY_NOT_FOUND', 'COPY_DATABASE_UNAVAILABLE'],
      })

      // apps/server/src/hub/copies/readers.ts
      export async function listedReaders(deps, input: InCompany)
      //  database.read: admitMember(seeData); rows = identity.companyRoleRows; readersOf
      //  quem não tem manageCopies: só as cópias de copiesReadBy
      //  cada cópia: Dono e Administrador primeiro (members da contagem de auth.member), depois os papéis da linha
      export async function setRoleCopies(deps, input: InCompany & { role: Role; copies: readonly CopyId[] })
      //  1. role owner | admin -> Failure('ROLE_FIXED')
      //  2. o Hub primeiro, numa transação de escrita, sem chamada ao banco da empresa:
      //     { roleId, tirado, novo } = await database.command(personScope(input), async (tx) => {
      //       admitMember(manageRoles)   // locks: true faz .for('share'): só cabe em database.command
      //       a linha do papel (senão ROLE_NOT_FOUND); cada cópia da empresa (senão COPY_NOT_FOUND)
      //       antes = as linhas do papel em copy_reader; tirado = antes - pedido; novo = pedido - antes
      //       delete das linhas de tirado, devolvendo granted_by e granted_at de cada uma (returning)
      //       insert das linhas de novo (granted_by = personId, granted_at = statement_timestamp())
      //       update copy set readers_set = true nas tocadas })
      //  3. depois do commit: result = await reconciled(deps, input)   // o bilhete é pego depois do commit
      //     se reconciled lança: a reposição do passo 5 e o mesmo erro relançado
      //  4. result === 'DONE' -> log.info({ companyId, role, by: personId, added, removed }, 'COPY_READERS_SET'),
      //     e devolve o pedido (200)
      //  5. result === 'FAILED' e tirado não vazio: a reposição, numa transação do Hub:
      //       database.command(personScope(input), async (tx) => { insert das linhas de tirado com o granted_by e o
      //         granted_at guardados, .onConflictDoNothing(); delete das linhas de novo })
      //       passou -> log.error({ companyId, role }, 'COPY_READERS_FAILED'); throw new Failure('COPY_DATABASE_UNAVAILABLE')
      //       lançou -> log.error({ companyId, role, error }, 'COPY_READERS_PENDING'); throw new Failure('COPY_DATABASE_UNAVAILABLE')
      //         (o Hub diz menos que o banco até a reconciliação seguinte: o fim da próxima rodada de cópia)
      //  6. result === 'FAILED' e tirado vazio -> log.info({ companyId, role }, 'COPY_READERS_PENDING'), e o passo 4
      //     devolve 200: o banco lê menos que o Hub, e o conserto em 42501 (unidade 6.1) libera
      //  Nenhuma transação do Hub fica aberta durante uma chamada ao banco da empresa (data D22).
      //  Apagar um papel segue a mesma ordem: a cascata de copy_reader_role_fkey apaga as marcas no Hub, e o login
      //  sai na reconciled seguinte; o papel apagado não tem pessoa (roles-delete).
      ```
      `routes.ts` serve as duas com `serve(app, listCopyReaders, ...)` e `serve(app, setRoleCopies, ...)`. O log nunca leva nome de tabela de outra empresa: só contagens e ids (security S41).
    - **Testes:** `apps/server/src/hub/copies/readers-routes.test.ts` (novo), pela porta HTTP do Hub de teste (`call`, `post` de `apps/server/src/hub/identity/test-hub.ts:253-292`), com estado e corpo literais (testing T6, `T10`). Casos:
      - "o dono marca clientes para o Financeiro e Carla passa a ler": 200, `{ copies: [<id>] }`, e `select` como o login do papel passa.
      - "tirar uma tabela recusa a leitura seguinte".
      - "o banco calado ao tirar responde 503 e nada muda": `reconcileReaders` mudo; 503 `COPY_DATABASE_UNAVAILABLE`; a linha está de volta no Hub com o mesmo `granted_by` e `granted_at`, o login continua lendo, e o log tem `COPY_READERS_FAILED`.
      - "a reposição que falha diz COPY_READERS_PENDING como erro e a rodada seguinte conserta": `reconcileReaders` mudo e a reposição dublada para lançar; 503; o log de erro tem `COPY_READERS_PENDING` com a empresa e o papel; a linha não está no Hub; com o dublê tirado, `runCopy` da empresa até o fim, e o login é recusado na tabela com `42501`.
      - "o banco calado ao dar responde 200, diz COPY_READERS_PENDING e o login ainda não lê", depois o conserto da 6.1 libera.
      - "com o banco falhando, a resposta nunca deixa o login lendo mais do que o Hub diz": tirar e dar com `reconcileReaders` mudo na primeira chamada, depois na segunda volta; depois de cada resposta, com a reposição passando, as tabelas do login estão contidas nas linhas de `copy_reader` (propriedade 1).
      - "a ordem da rodada 3, item 1(c): uma reconciliação que leu o Hub antes de tirar e aplicou depois não devolve o GRANT": `reconcileReaders` dublado para parar a primeira chamada até o teste soltar; um `enableCopy` pega o bilhete, lê o Hub com `sankhya_clientes` no Financeiro e para ali; `PUT .../roles/financeiro/copies` sem `sankhya_clientes` responde 200, porque a `reconciled` dele pega um bilhete maior depois do commit e aplica; o teste solta; o `enableCopy` recebe `SUPERSEDED`; o login do Financeiro é recusado em `sankhya_clientes` com `42501` (propriedades 1 e 9).
      - "Dono e Administrador respondem ROLE_FIXED".
      - "um membro e um desenvolvedor recebem 404 em setRoleCopies".
      - "outra empresa recebe 404, e a cópia de outra empresa responde COPY_NOT_FOUND".
      - "a sessão vencida responde 401".
      - "listCopyReaders dá Dono, Administrador e cada papel com a contagem de pessoas".
      O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** tirar a reposição do passo 5 faz falhar "o banco calado ao tirar responde 503 e nada muda"; responder 200 no passo 5 faz falhar o mesmo caso; pegar o bilhete antes do commit do passo 2 (chamar `reconciled` dentro da transação) faz falhar "a ordem da rodada 3" e quebra data D22; trocar `log.error` por `log.info` em `COPY_READERS_PENDING` faz falhar "a reposição que falha"; trocar `database.command` por `database.read` no passo 2 faz a admissão falhar com `25006` em todo caso.
    - **Pronto quando:** o arquivo passa e `npm run openapi > /dev/null` gera as duas rotas.
    - _Requisitos: 2.3, 2.4, 2.5, 2.10, 2.12, 4.2, 4.6_
  - [ ] 6.3 O membro: `seeData`, `listCopies`, `listCopyRuns` e `sampleCopy` por papel (um commit)
    - **Arquivos:** `apps/server/src/hub/identity/admission.ts`, `apps/server/src/hub/identity/companies.ts`, `apps/server/src/hub/identity/test-roles.ts`, `apps/server/src/hub/identity/developer.test.ts`, `packages/hub-api/src/roles.ts`, `apps/web/src/platform/test-may.ts`, `apps/web/src/hub/copies/copy-detail.tsx`, `apps/web/src/hub/copies/copy-detail.test.tsx`, `apps/server/src/hub/copies/list.ts`, `apps/server/src/hub/copies/sample.ts`, `packages/hub-api/src/copies.ts`, `apps/server/src/hub/copies/member-data.test.ts` (novo), `scripts/rerun-never.json`. Os que citam `readCopyRows` vêm da parte 1, unidade 2.2 (`CompanyMay`, `may`, `NO_MAY`, `developer.test.ts:100-118`, `mayOf`) e unidade 5.2 (a condição da aba Amostra).
    - **Referência a seguir:** `ACTIONS` em `apps/server/src/hub/identity/admission.ts:66-136`, com `readCompany: { by: 'MEMBER', statement: undefined, locks: false }` em `:67` como molde de "todo membro". `summaries`, `listed` e `runs` em `apps/server/src/hub/copies/list.ts:119-218`. `sampleOf` da parte 1 (`C4`).
    - **O que sai:** a ação `readCopyRows` da parte 1, em `ACTIONS`, e todo chamador dela: o campo `readCopyRows` de `CompanyMay` (`packages/hub-api/src/roles.ts`) e de `may` (`companies.ts`), de `NO_MAY` (`test-roles.ts`), de `developer.test.ts` e de `mayOf` (`test-may.ts`), e a condição `may.readCopyRows` da aba Amostra em `copy-detail.tsx`. Tirar o campo de `CompanyMay` muda o contrato das telas (decisão `L6` da parte 1): o corpo do PR diz isso. Depois, a aba Amostra aparece para quem abre a tabela: o membro só abre as tabelas do papel dele, e a amostra do desenvolvedor numa tabela fora do papel volta `NOT_IN_ROLE`, que a unidade 7.2 escreve. Em `list.ts`, a admissão `readCopies` de `summaries`, `listed`, `models` e `runs` troca por `seeData`.
    - **O que entra:**
      ```ts
      // admission.ts, em ACTIONS
      // Every member sees the copied data their role reads (governança mínima, p1-11); who reads which copy is copy_reader's.
      seeData: { by: 'MEMBER', statement: undefined, locks: false },

      // list.ts, summaries e listed
      const admitted = await deps.identity.admitMember({ tx, ...input, action: 'seeData' })
      const manages = deps.identity.allows(admitted.role, 'manageCopies')
      const reads = manages ? 'ALL' : await copiesReadBy(deps, tx, { companyId, role: admitted.role })
      //  stored filtrado por reads; only fora de reads -> Failure('COPY_NOT_FOUND')
      //  listed: quem não tem manageCopies recebe proposals: []
      //  antes da leitura, a mesma semeadura do catálogo (unidade 6.1): unseeded(tx, companyId) ->
      //    fora da transação, reconciled(deps, input) e a lista lida de novo, uma vez (critério 1.4)
      // runs: a mesma conferência antes da página

      // sample.ts
      //  admitMember(seeData); a cópia fora de copiesReadBy de quem não tem manageCopies -> COPY_NOT_FOUND
      //  a cópia fora de copiesReadBy de quem tem manageCopies (o desenvolvedor) -> Failure('NOT_IN_ROLE')
      //  reader = readerOf(deps, tx, { companyId, role }); NONE -> Failure('NOT_IN_ROLE')
      //  readCopyTable(deps, { ..., personId, reader }) (unidade 6.1), que lê por readAs com o conserto;
      //  TableRead NOT_IN_ROLE -> Failure('NOT_IN_ROLE')
      ```
      `sampleCopy` em `packages/hub-api/src/copies.ts` ganha `'NOT_IN_ROLE'` nas falhas. `listCopyModels` continua `readCopies`.
    - **Testes:** `apps/server/src/hub/copies/member-data.test.ts` (novo), pela porta HTTP. Casos:
      - "o membro lista só as tabelas do papel dele e nenhuma proposta".
      - "o membro abre as rodadas de uma tabela que o papel lê".
      - "o membro abre uma tabela que o papel não lê e recebe 404": o mesmo corpo de uma cópia que não existe (security S10).
      - "o desenvolvedor vê todas as tabelas e as rodadas".
      - "o desenvolvedor pede a amostra de uma tabela que o papel não lê e recebe NOT_IN_ROLE".
      - "a amostra do membro vem pelo login do papel": a amostra de uma tabela que o papel lê tem 5 linhas.
      - "quem não é da empresa recebe 404".
      - `copy-detail.test.tsx`: "a aba Amostra aparece para o membro que abre uma tabela do papel dele", no lugar do caso da parte 1 que a escondia sem `readCopyRows`.
      - "a página Dados semeia as cópias de antes": `readers_set = false` plantado; o primeiro `listCopies` de Carla traz `sankhya_clientes` e `COPY_READERS_SEEDED` sai.
      O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** tirar a semeadura de `summaries` faz falhar "a página Dados semeia"; trocar `seeData` por `readCopies` faz falhar "o membro lista só as tabelas do papel dele" com 404; tirar o filtro de `reads` faz falhar o mesmo caso com a tabela a mais; trocar `COPY_NOT_FOUND` por `NOT_IN_ROLE` para o membro faz falhar o caso de `S10`.
    - **Pronto quando:** o arquivo e `apps/server/src/hub/copies/routes.test.ts` passam, e nenhum arquivo cita `readCopyRows`.
    - _Requisitos: 1.4, 4.8, 4.9, 4.10_
  - [ ] 6.4 Ponto de conferência do grupo 6
    - Rodar `apps/server/src/hub/data/catalog-role.test.ts`, os testes de `apps/server/src/hub/data/`, `apps/server/src/hub/copies/readers-routes.test.ts`, `member-data.test.ts`, `routes.test.ts`, `readers.test.ts`, `apps/server/src/hub/identity/roles.test.ts`, `scripts/rerun-exempt.test.ts`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: o Hub local de pé, `PUT .../roles/{role}/copies` chamado e lido no banco da empresa, pstack `deslop` e `no-comments`, as mutações das três unidades.
    - As duas leis da tabela retida passam no mundo falso de `packages/hub-api/src/company-data.test.ts`, sem `skip`. O mundo real da conformidade entra depois, pela parte 3.
    - Linhas da tabela de referência: "O banco garante" e "A recusa" (`read.ts:178-195`, o `42501` do PostgreSQL, nativo).
    - A CI roda `check` e os testes do servidor. A rodada com modelo real (`CONEXUS_EVAL_REAL_MODEL`) roda à mão as perguntas do `design.md`, "As perguntas com resposta conhecida", contra o dublê do Sankhya.
- [ ] 7. Grupo 7: as telas de quem lê (um PR)
  - [ ] 7.1 A tela Papéis com o bloco Dados copiados (`p4-01`) (um commit)
    - **Arquivos:** `apps/web/src/routes/_app/companies/$companyId_/settings/roles.tsx`, `apps/web/src/hub/identity/roles.tsx`, `apps/web/src/hub/identity/role-editor.tsx`, `apps/web/src/hub/identity/role-picker.tsx`, `apps/web/src/hub/identity/queries.ts`, `apps/web/src/hub/copies/public.ts`, `apps/web/src/hub/copies/queries.ts`, `apps/web/src/hub/identity/roles.test.tsx`.
    - **Referência a seguir:** a rota passa o kit à tela por propriedade, para a identidade não importar os conectores: `apps/web/src/routes/_app/companies/$companyId_/settings/roles.tsx:28-63`. `OpenRole` em `apps/web/src/hub/identity/role-editor.tsx:117-161`, com a frase de dono e administrador em `:130-134` e o envio `send.mutateAsync` em `:139-146`. `ConnectorPicker` em `apps/web/src/hub/identity/role-picker.tsx:104-131`. A frase de falha do Hub: `sentenceOf(error)` como `apps/web/src/hub/copies/copy-delete.tsx:18-22`. `Checkbox` de `apps/web/src/ui/checkbox.tsx:8`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // apps/web/src/hub/copies/queries.ts
      export function copyReadersQuery(companyId: CompanyId)  // hubQuery de listCopyReaders
      export const sendRoleCopies = hubMutation(setRoleCopies)
      // apps/web/src/hub/copies/public.ts: export { copyReadersQuery, sendRoleCopies }

      // a rota roles.tsx: o loader também carrega copiesQuery e copyReadersQuery; RolesPage passa
      <Roles kit={...} logo={...} tables={tablesOf(copies, readers)} saveTables={(role, ids) => ...} />
      // tablesOf: por conector, cada cópia { id, name, label } e os papéis que a leem

      // apps/web/src/hub/identity/role-editor.tsx, dentro de cada ConnectorPicker, um bloco:
      <CopiedTables entry={entry} tables={tables[entry.id] ?? []} held={marked} readOnly={fixed} onChange={...} />
      // Salvar: primeiro send.mutateAsync (updateRole), depois saveTables(role.role, marcadas);
      // uma falha do segundo: setWriteError com sentenceOf(error) e as marcas ficam
      ```
      Textos: o título do bloco "Dados copiados"; um sistema sem cópia, "Nenhuma tabela copiada"; um papel sem nenhuma tabela marcada em nenhum sistema, na linha do papel da lista, "Não lê nenhuma tabela"; cada linha da tabela mostra o rótulo e, abaixo, o nome (`sankhya_clientes`). Para Dono e Administrador, todas as caixas marcadas e só de leitura, sob a frase de hoje. Sob o bloco, em todo papel: "Desmarcar uma tabela não tira a leitura ao vivo do sistema. Ela segue as operações marcadas acima." (no contrato, uma operação servida por uma tabela retida cai na leitura ao vivo, `packages/hub-api/src/company-data.ts:205-206`). Nenhuma importação de `hub/copies` em `apps/web/src/hub/identity/`.
    - **Testes:** `apps/web/src/hub/identity/roles.test.tsx`, com msw e `hubServer()` (`apps/web/src/platform/test-hub.tsx`), no molde dos casos de hoje do arquivo. Casos:
      - "o papel Financeiro mostra Dados copiados no Sankhya com sankhya_clientes desmarcada".
      - "marcar e salvar manda updateRole e depois setRoleCopies com a tabela".
      - "o banco calado ao salvar mostra a frase do Hub e mantém a marca".
      - "Dono mostra todas as tabelas marcadas e nenhuma caixa que mude".
      - "um sistema sem cópia diz Nenhuma tabela copiada".
      - "o bloco diz que desmarcar não tira a leitura ao vivo".
    - **Mutações à mão:** inverter a ordem dos dois envios faz falhar "marcar e salvar"; tirar `readOnly` do bloco para o Dono faz falhar o caso do Dono.
    - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/hub/identity/roles.test.tsx` passa, e a tela vista no navegador a 1366 e 390 px nos dois temas (testing T23) mostra o bloco sob cada sistema.
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.13_
  - [ ] 7.2 A aba Quem lê e a página Dados do membro (`p4-02`, `p1-11`) (um commit)
    - **Arquivos:** `apps/web/src/hub/copies/copy-detail.tsx`, `apps/web/src/hub/copies/copy-list.tsx`, `apps/web/src/hub/copies/copy-readers.tsx` (novo), `apps/web/src/hub/copies/text.ts`, `apps/web/src/hub/copies/public.ts`, `apps/web/src/routes/_app/companies/$companyId/route.tsx`, `apps/web/src/routes/_app/companies/$companyId/data.index.tsx`, `apps/web/src/routes/_app/companies/$companyId/data.$copyId.tsx`, `apps/web/src/hub/copies/copy-readers.test.tsx` (novo), `apps/web/src/hub/copies/copy-list.test.tsx`, `scripts/rerun-never.json`.
    - **Referência a seguir:** as abas da tabela da parte 1, com `apps/web/src/ui/tabs.tsx` e o estado no endereço (web W18). O item do trilho em `apps/web/src/routes/_app/companies/$companyId/route.tsx:87-94`, hoje sob `may.manageCopies`. A guarda `manageCopiesOrNotFound` em `apps/web/src/hub/copies/public.ts:24-26`. `NotFound` de `apps/web/src/ui/states.tsx:105`.
    - **O que sai:** a guarda `manageCopiesOrNotFound` nas rotas `data.index.tsx` e `data.$copyId.tsx` (o Hub responde 404 por papel; a tela mostra o não encontrado que o carregador recebe). A condição `may.manageCopies` do item **Dados** no trilho.
    - **O que entra:**
      - O item **Dados** aparece para todo membro.
      - O carregador da página Dados pede os modelos (`listCopyModels`, que continua `readCopies`) só com `may.manageCopies`; sem ela, a página não os pede e não mostra **Ligar um sistema**.
      - `CopyList`: **Ligar um sistema**, as propostas e o menu da linha só com `may.manageCopies`.
      - Uma aba **Quem lê** na página da tabela, lida de `copyReadersQuery`: uma lista com Dono, Administrador e cada papel, cada um com "1 pessoa" ou "<n> pessoas"; com `may.manageRoles`, o link **Abrir em Papéis** para `/companies/$companyId/settings/roles?role=<role>` em cada papel editável.
      - A aba Amostra, com a falha `NOT_IN_ROLE`, diz "Seu papel não lê esta tabela. Peça a quem administra a empresa.".
      - Os textos em `apps/web/src/hub/copies/text.ts`.
    - **Testes:** `apps/web/src/hub/copies/copy-readers.test.tsx` (novo) e `copy-list.test.tsx`, com msw e `hubServer()`. Casos:
      - "a aba Quem lê lista Dono, Administrador e Financeiro com as pessoas".
      - "Abrir em Papéis aparece para o dono e não para o desenvolvedor".
      - "o membro vê Dados no trilho e só as tabelas do papel, sem Ligar e sem menu".
      - "o membro que abre uma tabela de outro papel vê a página de não encontrado": o Hub de teste responde 404.
      - "o desenvolvedor vê a recusa do papel na aba Amostra".
      `copy-readers.test.tsx` entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** devolver a condição `may.manageCopies` ao item do trilho faz falhar o caso do membro; mostrar o menu da linha sempre faz falhar o mesmo caso.
    - **Pronto quando:** os dois arquivos passam, e o membro, no navegador, vê a página Dados com as tabelas do papel e a página de não encontrado num endereço de outra tabela.
    - _Requisitos: 4.6, 4.7, 4.8, 4.9, 4.10_
  - [ ] 7.3 O texto da recusa com o rótulo na conversa (`p4-03`) (um commit)
    - **Arquivos:** `apps/server/src/builder/data-tools/tools.ts`, `apps/server/src/builder/data-tools/order.ts`, `apps/web/src/builder/conversation/data-specs.ts`, `apps/server/src/builder/data-tools/tools.test.ts`, `apps/web/src/builder/assistant/refusals.test.tsx`.
    - **Referência a seguir:** `listed` e `described` da parte 3 (`C3`) em `tools.ts`; a tabela das recusas e o `reason` em inglês da parte 3 (`C3`); o spec da recusa em `data-specs.ts` da parte 3 (`C5`), no molde de `APP_DATA_SPECS` em `apps/web/src/builder/conversation/app-data-specs.ts:21`; o teste de recusas da tela no bloco "a leitura que não passou" de `apps/web/src/builder/assistant/refusals.test.tsx:30-56`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // tools.ts: data_describe() traz o que existe e o papel não lê
      { kind: 'CATALOG', systems, tables, withheld: [{ name, label }] }
      // data_describe({ table }) de uma tabela retida
      { kind: 'NOT_IN_ROLE', table, label, reason: 'The role of the person does not read this table. Say so; do not look for the data elsewhere.' }
      //  label = catálogo.withheld.find((one) => one.name === table)?.label

      // order.ts, dataOrder(), uma linha depois do passo 1:
      // "A table under `withheld` exists and this person's role does not read it. Call data_describe with it once, then tell the person their role does not read it."

      // data-specs.ts, data_describe com tabela, recusa NOT_IN_ROLE:
      label === undefined ? 'Seu papel não lê esta tabela. Peça a quem administra a empresa.'
                          : `Seu papel não lê ${label}. Peça a quem administra a empresa.`
      ```
      O resultado que não passa no esquema continua a linha genérica, sem texto inventado (parte 3, tabela de erros).
    - **Testes:** `apps/server/src/builder/data-tools/tools.test.ts`: "data_describe de uma tabela retida devolve NOT_IN_ROLE com o rótulo" e "data_describe sem tabela lista withheld só com nome e rótulo", no molde de `apps/server/src/builder/connectors/connector-tools-scope.test.ts:12-58`. `apps/web/src/builder/assistant/refusals.test.tsx`: "a recusa do papel mostra Seu papel não lê Clientes" e "a consulta recusada pelo papel mostra a frase sem rótulo". `refusals.test.tsx` já está em `scripts/rerun-never.json`; `tools.test.ts`, que a parte 3 criou e não pôs lá, entra nele neste commit.
    - **Mutações à mão:** devolver `label` vazio faz falhar "a recusa do papel mostra Seu papel não lê Clientes"; tirar `withheld` do resultado de `listed` faz falhar o caso do catálogo.
    - **Pronto quando:** os dois arquivos passam, e uma conversa no Hub local com o dublê mostra a linha "Seu papel não lê Clientes. Peça a quem administra a empresa." para Bruno.
    - _Requisitos: 3.3, 4.11, 4.12_
  - [ ] 7.4 Ponto de conferência do grupo 7
    - Rodar `npm run test:unit -w @conexus/web -- src/hub/identity/roles.test.tsx src/hub/copies src/builder/assistant/refusals.test.tsx`, `npm run test:browser -w @conexus/web` (inclui `roles.layout.test.ts`), o teste das ferramentas do servidor, `scripts/rerun-exempt.test.ts`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: cada tela vista a 1366 e 390 px nos dois temas (testing T23), pstack `deslop` e `no-comments`, as mutações das três unidades.
    - Linhas da tabela de referência: "A tela do registro" não; "Quem lê cada tabela" (a tela) e "A recusa", com as peças de `apps/web/src/ui/`.
  - [ ] 7.5 QA do grupo 7 (depois do ponto de conferência, por outro agente; não é um commit)
    - Skill `conexus-qa` (testing T25) no commit candidato, com o Hub local e os dublês, a 1366 e 390 px e nos dois temas: `p4-01` (o papel Financeiro aberto, marcar `sankhya_clientes`, salvar), `p4-02` (a aba Quem lê de `sankhya_clientes`), `p4-03` (Bruno pergunta "Quantos clientes novos entraram no mês?"), `p1-11` (Bruno abre Dados e o endereço de `sankhya_clientes`), e os estados vazio ("Nenhuma tabela copiada", "Não lê nenhuma tabela"), carregando e erro.
- [x] 8. Grupo 8: o documento do cliente, desfeito em 2026-11-15
  - A regra saiu do código nos PRs A, B e C (#1079 e #1082) e no PR D, que tirou a declaração de dado pessoal do kit dos conectores. Nada fica no lugar: a leitura respeita só o papel de quem pergunta (fundador, 2026-11-15: "Pode remover tudo que tem relacionado a isso").
- [ ] 9. Grupo 9: o Registro de dados (um PR)
  - [ ] 9.1 `withDataLog` e a gravação em `readThrough` (um commit)
    - **Arquivos:** `apps/server/src/hub/data/record.ts` (novo), `apps/server/src/hub/data/public.ts`, `apps/server/src/hub/connectors/read.ts`, `apps/server/src/hub/connectors/public.ts`, `apps/server/src/hub/connectors/rows.ts`, `apps/server/src/main.ts`, `apps/server/src/builder/data-tools/tools.ts`, `apps/server/src/hub/data/conformance.test.ts` (da parte 3; ele existe aqui porque os grupos 5 e 6 da parte 3 entram depois da unidade 6.1 desta parte e antes deste grupo; o mundo real passa a montar o contrato por `createCompanyData(deps)(scope, context)`), `apps/server/src/hub/data/record.test.ts` (novo), `scripts/rerun-never.json`.
    - **Referência a seguir:** só o nome do log vem do registro de escrita (`CONNECTOR_WRITE_UNRECORDED`, `apps/server/src/hub/connectors/write-record.ts:333-343`); a função dele não é molde, porque registra a falha e devolve a resposta mesmo assim. "Sem registro, sem linhas" é regra nova desta unidade: se a linha do registro não foi gravada, a leitura não devolve linha nenhuma. O único ponto de leitura ao vivo: `readThrough` em `apps/server/src/hub/connectors/read.ts:178-249`, com `ReadBy` em `:18`. A dependência entregue tarde, para `hub/connectors` não importar outro assunto: `copies: () => ConnectionCopies` em `apps/server/src/hub/connectors/public.ts:96-97` e o fio em `apps/server/src/main.ts:193-205`. A conversa da chamada de ferramenta: `context.agent?.threadId` do Mastra (`node_modules/@mastra/core/dist/tools/types.d.ts:172-183`, `ToolExecutionContext.agent` em `:573`).
    - **O que sai:** nada. A linha de log `CONNECTOR_CALLED` fica.
    - **O que entra:**
      ```ts
      // apps/server/src/hub/data/record.ts
      export type ReadBy = Readonly<{ agent: 'ASSISTANT' | 'BUILDER' | 'AGENT' | 'APP'; agentId?: string; threadId?: string }>
      type Entry = Omit<typeof dataRead.$inferInsert, 'id' | 'at'>
      async function recordOne(deps, scope: SessionScope, entry: Entry): Promise<'RECORDED' | 'UNRECORDED'>
      //  database.command({ kind: 'COMPANY', companyId, personId }, tx => tx.insert(dataRead).values({
      //    id: randomUUID(), at: sql`statement_timestamp()`, ...entry }))
      //  Failure do banco -> log.error({ companyId, verb, code }, 'DATA_READ_UNRECORDED'), 'UNRECORDED'
      //  outro erro sobe
      /** O contrato que grava cada leitura de tabela e cada consulta depois de responder. Não se chama recordedData,
       *  que a parte 3 já usa no ajudante de teste apps/server/src/builder/data-tools/test-data.ts. */
      export function withDataLog(data: CompanyData, deps, scope: SessionScope, by: ReadBy): CompanyData
      //  describe e act passam
      //  read(request):
      //    started = performance.now(); answer = await data.read(request)
      //    TABLE pedido     -> verb SAMPLE, tables [request.table], outcome answer.kind,
      //                        rows = answer.kind === 'TABLE' ? answer.rows.length : null
      //    QUERY pedido     -> verb QUERY, tables = answer.kind === 'QUERY' ? answer.tables.map(t => t.table) : [],
      //                        query = request.sql.slice(0, DATA_READ_QUERY_MAX), rows = answer.rows.length ou null
      //    OPERATION servido por tabela (answer.kind === 'TABLE') -> verb SAMPLE, tables [answer.table]
      //    OPERATION ao vivo ou recusado -> não grava aqui (readThrough grava o LIVE)
      //    'UNRECORDED' -> { kind: 'TABLE_UNAVAILABLE' }
      //  campos comuns: personId, agent, agentId, threadId, projectId do lugar, ms
      // createCompanyData: uma assinatura só nas partes 3 e 4
      export function createCompanyData(deps: DataDeps): (scope: SessionScope,
        context?: Readonly<{ by?: ReadBy; turn?: TurnBinding }>) => CompanyData
      //  (scope, context) => withDataLog(companyData({ sources: sourcesFor(deps, scope, context), now }),
      //                                   deps, scope, context?.by ?? { agent: 'ASSISTANT' })
      //  sourcesFor recebe o context inteiro, como na parte 3 (DataContext); sem turn, live e funnel respondem
      //  NOT_GRANTED (parte 3, `sourcesFor`); sem by, a linha sai com o agente
      //  ASSISTANT, sem agentId e sem threadId: escolha desta spec, para nenhuma leitura ficar sem linha
      //  TurnBinding é o tipo da parte 3, em hub/data/public.ts

      /** A porta que hub/connectors recebe: grava uma leitura ao vivo. */
      export function liveReadRecorder(deps): RecordRead

      // apps/server/src/hub/connectors/read.ts
      export type LiveRead = Readonly<{ companyId; personId; projectId?: string;
        agent: 'ASSISTANT' | 'BUILDER' | 'AGENT' | 'APP'; connectionId; operation: string;
        outcome: string; rows: number | null; ms: number }>
      export type RecordRead = (entry: LiveRead) => Promise<'RECORDED' | 'UNRECORDED'>
      // o corpo de hoje vira readOnce; readThrough é:
      export async function readThrough(deps, a) {
        const started = performance.now()
        const result = await readOnce(deps, a)
        if (a.by === 'copy') return result
        const recorded = await deps.recordRead()({
          companyId: a.ids.companyId, personId: a.viewer.person.id, projectId: a.ids.projectId,
          agent: a.by === 'app' ? 'APP' : a.by === 'builder' ? 'BUILDER'
            : a.speaker.kind === 'VERSION' ? 'AGENT' : 'ASSISTANT',
          connectionId: a.opened.id, operation: a.operation.id,
          outcome: result.kind === 'OK' ? 'LIVE' : result.kind,
          rows: linhasOf(result),   // linhas.length quando o valor tem `linhas`, senão null
          ms: Math.round(performance.now() - started) })
        return recorded === 'RECORDED' ? result : { kind: 'UNREACHABLE' }
      }
      // Deps (rows.ts:39-57) e createConnectors (public.ts:87-99) ganham recordRead: () => RecordRead
      // hub/data/public.ts exporta liveReadRecorder; main.ts, depois de montar as deps de hub/data:
      //   const recordRead = liveReadRecorder(dataDeps); createConnectors({ ..., recordRead: () => recordRead })
      //   (createCompanyData devolve só a função (scope, context) => CompanyData, sem campo recordRead)
      ```
      Na leitura ao vivo, `readThrough` não tem a conversa nem o agente salvo (`ReadRequest`, `read.ts:20-33`): a linha `LIVE` sai sem `threadId` e sem `agentId`. Nas ferramentas `data_describe` e `data_query`, `dataOf` não muda: cada agente já chama a porta montada `data(scope, { by })`, como a parte 3 faz (no Assistente, `deps.companyData(scope, { by: { agent: 'ASSISTANT', threadId } })`), e `withDataLog` grava esse `by`.
    - **Testes:** `apps/server/src/hub/data/record.test.ts` (novo), pela porta pública, com `copiesOn`, o Hub de teste e o dublê do Sankhya. Casos:
      - "cada verbo grava uma linha": uma leitura de tabela, uma consulta e uma leitura ao vivo do Assistente; três linhas, `SAMPLE`, `QUERY`, `LIVE`, com a contagem.
      - "a recusa do papel grava uma linha SAMPLE NOT_IN_ROLE sem contagem".
      - "nenhuma célula lida aparece no registro": o valor de `NOMEPARC` da primeira linha lida, procurado com `select count(*) from data.data_read where data_read::text like '%' || $1 || '%'`, dá 0.
      - "a gravação derrubada não devolve linha": `INSERT` recusado (o login do Hub sem permissão por um `REVOKE` dado como dono no teste, devolvido no fim); a leitura de tabela responde `TABLE_UNAVAILABLE`, a ao vivo `UNREACHABLE`, e sai `DATA_READ_UNRECORDED`.
      - "a rodada de uma cópia não grava".
      - "o login do Hub não muda nem apaga uma linha do registro": `update` e `delete` como `hub_runtime` recusados com `42501`.
      - "a linha de outra empresa não aparece": a política por empresa.
      O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** devolver `result` quando a gravação falha faz falhar "a gravação derrubada não devolve linha"; gravar `answer.rows` no lugar da contagem faz falhar "nenhuma célula lida aparece no registro" no `typecheck` ou no teste; tirar `if (a.by === 'copy')` faz falhar "a rodada de uma cópia não grava".
    - **Pronto quando:** o arquivo passa, e `apps/server/src/hub/connectors/*.test.ts` que leem ao vivo continuam passando.
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [ ] 9.2 As rotas `listDataReads` e `exportDataReads` e a ação `readDataLog` (um commit)
    - **Arquivos:** `packages/hub-api/src/data-reads.ts` (novo), `packages/hub-api/src/index.ts` (a exportação), `packages/hub-api/src/roles.ts`, `apps/server/src/hub/identity/admission.ts`, `apps/server/src/hub/identity/companies.ts`, `apps/server/src/hub/identity/test-roles.ts`, `apps/web/src/platform/test-may.ts`, `apps/server/src/hub/data/list.ts` (novo), `apps/server/src/hub/data/routes.ts` (novo), `apps/server/src/hub/data/public.ts`, `apps/server/src/main.ts`, `apps/server/src/hub/data/list.test.ts` (novo), `scripts/rerun-never.json`.
    - **Referência a seguir:** `CompanyMay` em `packages/hub-api/src/roles.ts:47-54` e o `may` de `readCompany` em `apps/server/src/hub/identity/companies.ts:98-104`. `manageRoles` em `apps/server/src/hub/identity/admission.ts:124`. A página por chave: `pageKey` e `pageOf` de `apps/server/src/platform/pages.ts:12-45`, usados em `apps/server/src/hub/copies/list.ts:187-218`. "Não encontrado" a quem não pode: `admit` em `admission.ts:355-361` (security S10). O nome de quem leu: `memberNameColumn` de `apps/server/src/hub/identity/public.ts:48`. O nome do Projeto: `deps.projects.liveProjectNamesOf` como em `apps/server/src/hub/copies/list.ts:92-95`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // admission.ts, em ACTIONS
      // The record of reads of the company's data is the owner's and the administrator's (E4a).
      readDataLog: { by: 'MEMBER', statement: MANAGE_ROLES, locks: false },
      // roles.ts: CompanyMay ganha readDataLog: z.boolean()
      // companies.ts: readDataLog: allows(admitted.role, 'readDataLog')
      // test-roles.ts NO_MAY e test-may.ts mayOf ganham readDataLog (governs)

      // packages/hub-api/src/data-reads.ts
      export const DATA_READS_PAGE = 50
      export const DATA_READS_EXPORT_MAX = 5000
      export const DataReadAgent = z.enum(['ASSISTANT', 'BUILDER', 'AGENT', 'APP'])
      export const DataReadEntry = z.object({
        id: z.uuid(), at: z.iso.datetime(), person: z.object({ id: PersonId, name: z.string().nullable() }),
        agent: DataReadAgent, project: z.object({ id: ProjectId, name: z.string() }).nullable(),
        agentId: z.string().nullable(), threadId: z.string().nullable(),
        verb: z.enum(['SAMPLE', 'QUERY', 'LIVE']), tables: z.array(z.string()),
        system: z.string().nullable(), operation: z.string().nullable(),
        query: z.string().nullable(), outcome: z.string(), rows: z.int().nullable(), ms: z.int() })
      const Filters = z.object({ person: PersonId.optional(), agent: DataReadAgent.optional(),
        table: z.string().max(40).optional(), outcome: z.enum(['OK', 'REFUSED']).optional() })
      export const listDataReads = defineOperation({ id: 'listDataReads', summary: 'Lists the reads of the company’s data, newest first, 50 a page.',
        access: 'session', method: 'GET', path: '/api/companies/{companyId}/data-reads', bodyLimit: 1024,
        input: { params: InCompany, query: Filters.extend({ page: z.string().optional() }) },
        success: { status: 200, body: z.object({ reads: z.array(DataReadEntry), next: z.string().nullable() }) },
        failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] })
      export const exportDataReads = defineOperation({ id: 'exportDataReads', summary: 'The reads of the filter, newest first, up to 5000, for a file.',
        access: 'session', method: 'GET', path: '/api/companies/{companyId}/data-reads/export', bodyLimit: 1024,
        input: { params: InCompany, query: Filters },
        success: { status: 200, body: z.object({ reads: z.array(DataReadEntry).max(DATA_READS_EXPORT_MAX), complete: z.boolean() }) },
        failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] })

      // apps/server/src/hub/data/list.ts
      //  database.read(personScope): admitMember(readDataLog)
      //  where company_id, e os filtros: person_id; agent; $table = ANY(tables);
      //    OK -> outcome in ('TABLE', 'QUERY', 'LIVE'); REFUSED -> outcome not in (...)
      //  order by at desc, id desc; a âncora por pageKey(input.page, z.uuid()) como list.ts:196-206; limit 51; pageOf
      //  system: o nome da conexão por connectionNamesOf (connectors/public.ts) quando connection_id não é nulo
      //  agentId continua o id; a tela acha o nome (unidade 9.3)
      ```
      O contrato só serve JSON (`packages/hub-api/src/operation.ts:27-31`), então `exportDataReads` devolve as linhas e a tela monta o CSV (unidade 9.3).
    - **Testes:** `apps/server/src/hub/data/list.test.ts` (novo), pela porta HTTP, com estado e corpo literais. Casos:
      - "o dono lista as leituras da mais nova para a mais antiga, 50 por página, e a página seguinte continua".
      - "o filtro por pessoa, por agente, por tabela e por resultado".
      - "a exportação devolve até 5000 e diz se cortou".
      - "o desenvolvedor e o membro recebem 404 nas duas rotas, com o mesmo corpo de uma empresa que não existe".
      - "outra empresa recebe 404".
      - "a sessão vencida responde 401".
      - "getCompany diz readDataLog verdadeiro ao dono e falso ao membro".
      O arquivo entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** trocar `MANAGE_ROLES` por `undefined` em `readDataLog` faz falhar o caso do membro; tirar `desc` da ordem faz falhar o primeiro caso.
    - **Pronto quando:** o arquivo passa, `npm run openapi > /dev/null` gera as duas rotas, e `apps/server/src/hub/identity/*.test.ts` que comparam `may` passam.
    - _Requisitos: 7.2, 7.3, 7.4, 7.6_
  - [ ] 9.3 A página Registro de dados em Configurações (`p4-04` a `p4-06`) (um commit)
    - **Arquivos:** `apps/web/src/routes/_app/companies/$companyId_/settings/data-reads.tsx` (novo), `apps/web/src/hub/copies/data-reads.tsx` (novo), `apps/web/src/hub/copies/queries.ts`, `apps/web/src/hub/copies/text.ts`, `apps/web/src/hub/copies/public.ts`, `apps/web/src/hub/copies/data-reads.test.tsx` (novo), `apps/web/src/routes/_app/companies/$companyId_/settings/settings.test.tsx`, `scripts/rerun-never.json`.
    - **Referência a seguir:** uma seção nova de Configurações é um arquivo de rota com `staticData.section` e `needs` (web W32): `apps/web/src/routes/_app/companies/$companyId_/settings/roles.tsx:15-43` e o filtro de `needs` em `settings/route.tsx:30-45`; o tipo em `apps/web/src/ui/settings-index.tsx:11-21`. A linha aberta no endereço, como o papel aberto em `apps/web/src/hub/identity/roles.tsx:92-110`. `FramedTable` de `apps/web/src/ui/table.tsx:73`, `Pager` de `apps/web/src/ui/pager.tsx:9`, `Empty`, `Loading` e `ReadFailure` de `apps/web/src/ui/states.tsx:31-125`, `ChoiceSelect` de `apps/web/src/ui/select.tsx:85`, `CodeBlock` de `apps/web/src/ui/code-block.tsx:7`. O teste de seção em `settings.test.tsx:113` ("uma filha de settings com staticData.section aparece na sua ordem"). Os agentes de todos os Projetos vivos: `agentsQuery(companyId, undefined)` de `apps/web/src/builder/agents/queries.ts:24-27`, que chama `listAgents` sem `projectId` (`apps/server/src/builder/agents/routes.ts:18-23`, `agents.listCompany`).
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // settings/data-reads.tsx
      const Search = z.object({ person, agent, table, outcome, page, read: z.uuid().optional() }) // cada um .optional().catch(undefined)
      export const Route = createFileRoute('/_app/companies/$companyId_/settings/data-reads')({
        staticData: { section: { group: 'company', label: 'Registro de dados', icon: ScrollTextIcon,
          summary: 'O que cada agente e cada app leu dos dados da empresa.', order: 27,
          keywords: ['registro', 'leitura', 'auditoria', 'agente', 'consulta'], needs: 'readDataLog' } },
        validateSearch: Search,
        loader: ... companyQuery; !may.readDataLog -> throw notFound(); dataReadsQuery(companyId, filtros)
        errorComponent: () => <ReadFailure text="Não deu para ler o registro agora." onRetry={...} />,
      })
      ```
      `DataReads` (em `apps/web/src/hub/copies/data-reads.tsx`):
      - `p4-04`: os filtros acima da tabela (pessoa, agente, tabela, resultado), no endereço (web W18); a tabela com as colunas "Quando", "Quem", "Agente", "O que foi lido", "Resultado" e "Linhas"; **Exportar**; `Pager` abaixo. Os agentes se leem "Assistente", "Builder" e "App"; uma linha `AGENT` mostra o nome do agente pela lista de `agentsQuery(companyId, undefined)`, e "Agente apagado" quando o id não está na lista (o agente, ou o Projeto dele, não vive mais). O resultado se lê "Lido" para `TABLE`, `QUERY` e `LIVE`, "Recusado pelo papel" para `NOT_IN_ROLE`, e "Não lido" para os outros, com o código num `title`. "O que foi lido" é a tabela, ou as tabelas separadas por vírgula, ou "<sistema> · <operação>" numa leitura ao vivo.
      - `p4-05`: a linha aberta por `?read=<id>`: Quem, Agente, Conversa, Tabela, Consulta (num `CodeBlock`), Resultado, Linhas e Tempo ("<ms> ms"); **Abrir a conversa** quando `threadId` não é nulo (para a conversa do Início no lugar empresa, ou a do Projeto); **Copiar a consulta** quando há consulta. Nenhuma linha de dado.
      - `p4-06`: sem leitura nenhuma e sem filtro, `<Empty>` com "Nenhuma leitura ainda." e, abaixo, "Cada vez que um agente ou um app ler uma tabela, consultar ou ler um sistema ao vivo, a leitura aparece aqui, com quem pediu e o resultado. As linhas lidas nunca aparecem.". Com filtro e nada achado: "Nenhuma leitura com esses filtros.".
      - Carregando: o `Loading` da rota, com esqueletos nas linhas.
      - **Exportar** chama `exportDataReads` com os filtros e baixa `registro-de-dados.csv` por um `Blob` com `text/csv`, as colunas na ordem da tabela, mais "Consulta"; quando `complete` é falso, a tela diz "O arquivo traz as 5000 leituras mais novas.".
    - **Testes:** `apps/web/src/hub/copies/data-reads.test.tsx` (novo), com msw e `hubServer()`: "lista as leituras com quem, agente, o que foi lido e o resultado", "o filtro por pessoa vai ao endereço e à chamada", "abrir uma leitura mostra a consulta e Copiar a consulta", "Abrir a conversa só aparece com a conversa", "uma leitura de agente mostra o nome dele e o id que falta mostra Agente apagado", "o registro vazio diz Nenhuma leitura ainda.", "o Hub calado diz Não deu para ler o registro agora. e Tentar de novo lê de novo", "Exportar baixa o CSV". `settings.test.tsx`: "Registro de dados aparece para o dono e não para o membro", e "o membro que abre o endereço vê não encontrado". `data-reads.test.tsx` entra em `scripts/rerun-never.json`.
    - **Mutações à mão:** trocar `needs: 'readDataLog'` por nada faz falhar o caso do membro em `settings.test.tsx`; mostrar o botão **Abrir a conversa** sempre faz falhar o caso dele.
    - **Pronto quando:** os dois arquivos passam, e a página, vista a 1366 e 390 px nos dois temas, mostra a lista, uma leitura aberta e o vazio.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_
  - [ ] 9.4 Ponto de conferência do grupo 9
    - Rodar `apps/server/src/hub/data/record.test.ts`, `list.test.ts`, os testes de `apps/server/src/hub/connectors/` que leem ao vivo, `apps/server/src/hub/identity/*.test.ts`, `npm run test:unit -w @conexus/web -- src/hub/copies/data-reads.test.tsx src/routes`, `scripts/rerun-exempt.test.ts`, `npm run check` e `npm run quality`.
    - Passos 6 e 7 da skill `conexus-build`: o Hub local com uma conversa que lê, a página aberta, pstack `deslop` e `no-comments`, as mutações das três unidades.
    - Linhas da tabela de referência: "O registro" (`connectors/tables.ts:218-249`, `read.ts:231-247`, embrulhado) e "A tela do registro" (nativo, as peças de `apps/web/src/ui/`).
    - A rodada com modelo real roda à mão as perguntas do `design.md` e confere a coluna "O que fica no registro".
  - [ ] 9.5 QA do grupo 9 (depois do ponto de conferência, por outro agente; não é um commit)
    - Skill `conexus-qa` (testing T25): `p4-04` com as 14 leituras do exemplo do escopo 6.6 plantadas pelo dublê, os quatro filtros, `p4-05` com uma consulta e com uma leitura ao vivo, `p4-06`, carregando e erro, a 1366 e 390 px e nos dois temas, e Bruno no endereço do Registro (não encontrado).

## Notas

- **A ordem dos PRs.** Os grupos 2 e 3 esperam o grupo 1 no `main`; a palavra do fundador já foi dada (P2, 2026-11-14), um PR para cada permissão. O grupo 4 precisa do 2 (o login do Hub escreve em `copy_reader`). O grupo 5 não depende de nenhum e pode ir junto com o 1. O 6 precisa do 4 e do 5. O 7 precisa do 6. O 8 não depende dos outros desta parte. O 9 precisa do 3, do 6 e da unidade 7.3 (as duas mudam `apps/server/src/builder/data-tools/tools.ts`). Fora desta parte: os grupos 5 e 6 da parte 3 entram depois da unidade 6.1 e antes do grupo 9.
- **Num Projeto, decidido (resposta do fundador à P1, no índice).** O Builder lê pela liberação do Projeto, como hoje, e o catálogo do Projeto vem com `withheld` vazio. O agente salvo, nesta spec, também lê pela liberação do Projeto dele; a regra por papel de quem conversa com ele é entrada da parte 7. Até lá, quem conversa num Projeto lê por ele uma cópia liberada ao Projeto que o papel dele não lê fora dali.
- **As cópias de antes.** A semeadura N3b-1 roda na primeira leitura do catálogo (unidade 6.1) ou da página Dados (unidade 6.3) de uma empresa que tem cópia com `readers_set` falso. Até ela, o membro dessa empresa não vê tabela nenhuma. Nenhuma migração de dados marca essas cópias, porque a regra lê as operações de cada papel.
- **Uma reconciliação de cada vez, pelo bilhete.** Nenhuma transação do Hub fica aberta enquanto o banco da empresa é chamado (data D22). A serialização é no banco da empresa: `sync.readers_ticket` e `sync._readers_applied`, do login `conexus_sync`, sem permissão a nenhum login de leitura (unidade 4.1). Cada reconciliação pega o bilhete antes de ler o Hub, e a aplicação de bilhete menor ou igual ao guardado é abandonada inteira e devolvida como `SUPERSEDED`. Uma ordem só: o Hub grava primeiro, e a `reconciled` pega o bilhete depois do commit; se ela falha depois de tirar, `setRoleCopies` repõe as marcas e responde 503 (unidade 6.2). O que sobra, com exatidão: sem falha, nenhuma intercalação deixa o login lendo uma tabela que o Hub tirou depois que o ato respondeu. Com a reposição também falhando, ou com o servidor caindo entre o commit e a aplicação, o login lê a tabela até a reconciliação seguinte, que vem no máximo no intervalo da cópia (30 minutos por padrão), pelo fim de uma rodada (unidade 4.2). Nesse intervalo, `companyData().read` recusa a consulta com `NOT_IN_CATALOG`, porque confere as tabelas lidas contra o catálogo do Hub (parte 3).
- **Dois nomes, duas coisas.** `reconcileReaders` (`apps/server/src/platform/copy-sql.ts`) é uma aplicação no banco da empresa, numa transação de lá, com um bilhete. `reconciled` (`apps/server/src/hub/copies/readers.ts`) é a reconciliação inteira: semeia com commit, pega o bilhete, lê o Hub, chama `reconcileReaders`, relê o Hub e repete uma vez se ele mudou. O conserto em `42501` e os atos do Hub chamam sempre `reconciled`.
- **Fora desta spec.** A coluna **Quem lê** na lista da página Dados e a aba **Leituras** de uma tabela não são construídas aqui. A unidade 7.2 constrói só a aba **Quem lê** da página de uma tabela.
- **`createCompanyData`, uma assinatura só.** `createCompanyData(deps)(scope, context?: { by?: ReadBy; turn?: TurnBinding })` nas partes 3 e 4. Sem `turn`, `live` e `funnel` respondem `NOT_GRANTED`. Sem `by`, a leitura é registrada com o agente `ASSISTANT`, sem `agentId` e sem `threadId`: escolha desta spec (unidade 9.1). A ordem é firme: os grupos 5 e 6 da parte 3 entram depois da unidade 6.1 desta parte, e o mundo real da conformidade nasce com o `withheld` de Bruno, no papel Vendas, perguntando no lugar `COMPANY` (`{ table: 'sankhya_clientes', query: 'select 1 from sync.sankhya_clientes' }`). O grupo 9 entra depois deles.
- **O conserto em `42501` de uma consulta.** O PostgreSQL não diz qual tabela recusou (`permission denied for table`, sem o campo `table`). Então `readAs` reconcilia uma vez sempre que o papel lê ao menos uma tabela, e não só quando a tabela recusada está no catálogo.
- **Apagar um papel, decidido.** A rota de hoje (`deleteRoleCommand`, `apps/server/src/hub/identity/company-roles.ts:280-323`) é da identidade e não chama a trilha Dados. As marcas do papel saem pela cascata. O login dele fica até a reconciliação seguinte da empresa. Nenhuma pessoa tem o papel (a rota recusa apagar um papel com membro, `ROLE_IN_USE`) e só o Hub tem a senha, então ninguém entra por ele. Nenhuma chamada nova da identidade para a trilha Dados.
- **Desmarcar uma tabela não tira a leitura ao vivo.** No contrato, uma operação servida por uma tabela retida cai na leitura ao vivo, liberada pela operação do papel (`packages/hub-api/src/company-data.ts:205-206`). Hoje nenhum agente chama `live`. A tela Papéis diz isso sob o bloco Dados copiados (unidade 7.1).
- **O nome do agente no Registro, decidido.** A linha guarda `agentId`. A tela do Registro mostra o nome pela lista de `agentsQuery(companyId, undefined)` (`apps/web/src/builder/agents/queries.ts:24-27`), que lista os agentes de todos os Projetos vivos. Um id que a lista não traz aparece como "Agente apagado". Nenhuma porta nova no servidor.
- **A leitura ao vivo que não registra, decidido.** Responde `UNREACHABLE`, que é o par de "o dado não veio" no contrato da leitura ao vivo. A linha `LIVE` sai sem `threadId` e sem `agentId` nesta parte, porque nenhum agente chama `live` ainda.
- **As linhas de dono em `database-grants.sql`.** O grupo 1 acrescenta só as linhas `OWNER TO` que o dump imprime para as tabelas novas. Elas não dão nada ao login do Hub, então não são mudança da lista de permissões (data D11). As permissões ficam nos grupos 2 e 3.
- **A aba Quem lê, decidido.** Todo membro a vê, só para as cópias que o papel dele lê, com a contagem de pessoas e sem os nomes. Só quem tem `manageCopies` muda as marcas.
- **Os testes de isolamento.** Cada arquivo novo das unidades 4.1, 4.2, 6.1, 6.2, 6.3, 7.2, 9.1, 9.2 e 9.3 entra em `scripts/rerun-never.json`, e `apps/server/src/builder/data-tools/tools.test.ts` entra na unidade 7.3; as leis novas do contrato entram pelo nome (unidade 5.1).

## Grafo de dependência das tarefas

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "5.1"] },
    { "id": 1, "tasks": ["1.3", "5.2"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["4.3"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["6.2"] },
    { "id": 9, "tasks": ["6.3"] },
    { "id": 10, "tasks": ["6.4"] },
    { "id": 11, "tasks": ["7.1", "7.2", "7.3"] },
    { "id": 12, "tasks": ["7.4", "9.1"] },
    { "id": 13, "tasks": ["7.5", "9.2"] },
    { "id": 14, "tasks": ["9.3"] },
    { "id": 15, "tasks": ["9.4"] },
    { "id": 16, "tasks": ["9.5"] }
  ]
}
```
