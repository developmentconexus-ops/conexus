# Plano de implementação: parte 3, a leitura para análise

> Os grupos 5 e 6 desta parte foram construídos pelo cartão Registro e conformidade (a U7; o cartão está no histórico do `main`, no commit `07aa2924`), e o que ele decidiu vale sobre este texto (o fechamento dele, 2026-11-21). As leis rodam contra o banco de verdade, na Empresa e num Projeto, e a consulta que nomeia a tabela que o papel não lê responde `NOT_IN_CATALOG`, e não `NOT_IN_ROLE` ("1. B"). O registro do cartão está em [aprovações](../../../../approvals/registro-e-conformidade.md).

> Os grupos 3 e 4 desta parte foram construídos pelo cartão A pergunta respondida com a origem, fechado em 2026-11-16, e o que ele decidiu vale sobre este texto. Uma tabela cuja conexão não está em `systems` é lida, e a origem vem do registro gravado da cópia, com o estado da conexão (`NAMED` ou `NOT_GIVEN`): onde esta parte manda responder `CATALOG_UNAVAILABLE` e registrar `DATA_ORIGIN_UNREAD` nesse caso, o texto está superado (a emenda de 2026-11-15, "1. A"). O registro do cartão está em [aprovações](../../../../approvals/a-pergunta-respondida-com-a-origem.md).

## Visão geral

Seis grupos, um PR cada.

- O grupo 1 muda só o contrato e a conformidade: o pedido de consulta e as cinco leis.
- O grupo 2 é da trilha Dados: a fonte `query` em `apps/server/src/hub/data/`.
- O grupo 3 é dos consumidores, na trilha Agentes e Apps (`docs/steps/trilhas/dados.md:78`): as duas ferramentas e a montagem nos três agentes.
- O grupo 4 grava os cenários e leva a origem até a tela. Depois dele vem a QA.
- O grupo 5 muda só a conformidade: `runDataConformance` passa a aceitar um mundo assíncrono.
- O grupo 6 põe o teste que impede a lista de migração de crescer e implementa `live` e `funnel` com a conformidade inteira.

Os grupos 5 e 6 podem esperar a parte 5 sem atrasar o marco `D2`, porque nenhum consumidor desta parte chama `live` nem `funnel`.

Tudo parte de que a parte 1 está construída (`../01-dado-guardado-e-catalogo/tasks.md`, unidades 2.x e 4.2):

- a pasta `apps/server/src/hub/data/` com `DataDeps`, `createCompanyData`, `sourcesFor`, `catalogOf` e `rowsOf`;
- a ligação `const data = createCompanyData({ database, identity, log, connectors: () => connectors, copies: () => copies.data })` em `apps/server/src/main.ts`, e `data: subjects.data` no Hub de teste (`apps/server/src/hub/identity/test-hub.ts`), lida nos testes por `on.hub.data`;
- `catalogSystems(tx, scope)` em `Connectors`;
- o login `conexus_read` com `ensureReader`, `readerAddress` e `readCopies` em `CompanyPostgres`, e a coluna `inactiveSince`.

## Como ler este plano

- Todo caminho é relativo à raiz do repositório, no `main` em `0d4c5730`.
- "Referência a seguir" é o trecho do `main` que serve de molde. Copie a forma, não o texto.
- Os comandos de teste do servidor pedem, numa árvore nova, `npm ci` e `npm run build -w @conexus/server` antes, e o banco de teste nas variáveis `CONEXUS_TEST_DATABASE_URL` e `CONEXUS_TEST_RUNTIME_PASSWORD` (`apps/server/src/platform/config.ts:350-367`).
- Um teste de servidor roda com `MASTRA_AGENT_THREAD_LEASE_TTL_MS=3000 node scripts/test-run.ts --test-concurrency=1 --test-timeout=120000 --test-reporter=./scripts/test-reporter.ts <arquivos>`, na forma de `apps/server/package.json:13`.
- Um teste de tela roda com `npm run test:unit -w @conexus/web -- <arquivos>`.
- Os testes do contrato rodam com `npm test -w @conexus/hub-api`.
- As decisões `L1` a `L3` e os textos `L4` estão em "Notas". Nenhuma unidade espera resposta.

## Tarefas

- [ ] 1. Grupo 1: o pedido de consulta no contrato (um PR, só contrato e conformidade, `docs/steps/trilhas/dados.md:72-78`)
  - [ ] 1.1 O pedido `QUERY`, as três respostas novas e `DataSources.query` (um commit)
    - **Arquivos:** `packages/hub-api/src/company-data.ts`, `packages/hub-api/src/company-data.test.ts`, `apps/server/src/hub/data/public.ts` (da parte 1).
    - **Referência a seguir:** `packages/hub-api/src/company-data.ts:66-75` (`ReadRequest`), `:79-87` (`REFUSALS`), `:91-112` (`ReadAnswer`), `:148-157` (`DataSources`), `:219-242` (`read`). O caso novo segue a forma do caso `TABLE` (`:227-233`).
    - **O que sai:** nada. O `read` ganha um ramo antes de `sourceOf`, porque `sourceOf` (`:192-207`) só conhece `TABLE` e `OPERATION`.
    - **O que entra:**
      ```ts
      // packages/hub-api/src/company-data.ts
      export const QUERY_ROWS = 200
      /** O mesmo teto de app_data_read (apps/server/src/builder/app-data/tools.ts:12). */
      export const QUERY_SQL_MAX = 4000

      export const ReadRequest = z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('TABLE'), table: z.string() }),
        z.object({ kind: z.literal('OPERATION'), connection: ConnectionId, operation: OperationId, input: z.unknown() }),
        /** Uma consulta só de leitura sobre as tabelas do catálogo. Quem recusa é o banco. */
        z.object({ kind: z.literal('QUERY'), sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
      ])

      // em ReadAnswer, depois de TABLE_UNAVAILABLE:
      z.object({
        kind: z.literal('QUERY'),
        columns: z.array(z.string()),
        rows: z.array(z.array(z.unknown())),
        /** Falso quando a consulta trouxe mais linhas que QUERY_ROWS. */
        complete: z.boolean(),
        /** As tabelas do catálogo que a consulta leu, cada uma com quem a guarda e a última rodada. */
        tables: z.array(z.object({ table: z.string(), kept: TableKept })),
      }),
      /** O banco recusou a consulta. O SQLSTATE vai inteiro. */
      z.object({ kind: z.literal('QUERY_REFUSED'), sqlstate: z.string().regex(/^[0-9A-Z]{5}$/) }),
      z.object({ kind: z.literal('QUERY_TOO_LARGE') }),

      /** O que a fonte de consulta devolve. NOT_IN_ROLE e DEADLINE estão em membros com enum (:85-86), e Extract daria never. */
      export type QueryPage =
        | Readonly<{ kind: 'ROWS'; columns: string[]; rows: unknown[][]; complete: boolean; used: readonly string[] }>
        | Extract<ReadAnswer, { kind: 'QUERY_REFUSED' | 'QUERY_TOO_LARGE' | 'TABLE_UNAVAILABLE' }>
        | Readonly<{ kind: 'NOT_IN_ROLE' }>
        | Readonly<{ kind: 'DEADLINE' }>
      // em DataSources:
      /** A consulta como o login de leitura de quem pergunta, e os nomes das tabelas de sync que ela leu. */
      query(a: Signal & Readonly<{ sql: string }>): Promise<QueryPage>

      // em companyData().read, depois de `if (catalog.kind === 'CATALOG_UNAVAILABLE') return catalog`:
      if (request.kind === 'QUERY') {
        const answered = await sources.query({ sql: request.sql, signal })
        if (answered.kind !== 'ROWS') return answered
        const tables = answered.used.map((name) => catalog.tables.find((one) => one.name === name))
        // Uma tabela lida fora do catálogo de quem pergunta: nenhuma linha sai.
        if (tables.some((one) => one === undefined)) return NOT_IN_CATALOG
        const { columns, rows, complete } = answered
        return { kind: 'QUERY', columns, rows, complete,
                 tables: tables.flatMap((one) => (one === undefined ? [] : [{ table: one.name, kept: one.kept }])) }
      }
      const source = sourceOf(catalog, request)   // request já sem QUERY
      ```
      O `fakeWorld` de `packages/hub-api/src/company-data.test.ts:102-144` ganha nesta unidade a fonte `query: async () => ({ kind: 'TABLE_UNAVAILABLE' })`, para o commit compilar; a 1.2 a troca pela de verdade.
      Em `apps/server/src/hub/data/public.ts`, o objeto que `sourcesFor(deps, scope)` devolve ganha `query: async () => ({ kind: 'TABLE_UNAVAILABLE' })`, na forma das linhas `live` e `funnel` da parte 1 (`../01-dado-guardado-e-catalogo/tasks.md`, unidade 4.2), sem log. Nenhum consumidor chama `read({ kind: 'QUERY' })` antes do grupo 3, e o grupo 2 troca a linha. Essa linha é uma exceção declarada ao "PR só do contrato", como a decisão `D19` do índice (`README.md`) fez na parte 1: o corpo do PR a lista e diz que sem ela o servidor não compila.
    - **Testes:** nenhum caso novo nesta unidade. `npm run typecheck` prova que `fakeWorld` e `sourcesFor` ganharam `query`.
    - **Mutações à mão:** nenhuma nesta unidade. As mutações do ramo `QUERY` vão na 1.2.
    - **Pronto quando:** `npm run typecheck` passa, e `ReadRequest.parse({ kind: 'QUERY', sql: ' ' })` lança.
    - _Requisitos: 2.1, 2.6, 3.1, 3.2_
  - [ ] 1.2 As cinco leis novas na conformidade (um commit)
    - **Arquivos:** `packages/hub-api/src/company-data-conformance.ts`, `packages/hub-api/src/company-data.test.ts`.
    - **Referência a seguir:** as leis de `packages/hub-api/src/company-data-conformance.ts:228-258` (`keepsTableWhenItsKeeperIsDown`, `callsNothingWithoutCatalog`, `passesTheSignalToEverySource`), a lista `LAWS` (`:260-302`) e `Gave` (`:15`). O mundo falso em `company-data.test.ts:102-144`.
    - **O que sai:** a fonte `query` provisória do `fakeWorld` (1.1). A lei `passesTheSignalToEverySource`, que hoje é a 14 e passa a ser a 19 depois das cinco novas, fica como está: a consulta tem a sua lei de sinal.
    - **O que entra:**
      ```ts
      type Gave<K extends 'rows' | 'live' | 'funnel' | 'query'> = Awaited<ReturnType<DataSources[K]>>
      // DataWorld ganha:
      reached: { ...; query: string[] }
      gave:    { ...; query: Gave<'query'>[] }
      /** As consultas que o mundo sabe responder, escritas para as tabelas do seu catálogo. */
      queries: Readonly<{
        reads: string      // lê uma tabela do catálogo e traz ao menos uma linha
        outside: string    // lê uma tabela que a fonte lê e o catálogo não lista
        refused: string    // o banco recusa
      }>
      down(part: 'catalog' | 'rows' | 'query'): void

      async function queriesTheCatalog(world, data)      // nova 1
      //  answer = ReadAnswer.parse(await data.read({ kind: 'QUERY', sql: world.queries.reads }))
      //  answer.kind === 'QUERY'; answer.rows.length > 0
      //  cada answer.tables[i].table está em catalogOf(world).tables, com o mesmo kept
      //  world.reached.live deepEqual []
      async function refusesRowsOutsideCatalog(world, data)   // nova 2
      //  data.read({ kind: 'QUERY', sql: world.queries.outside }) deepEqual { kind: 'NOT_IN_CATALOG' }
      async function keepsTheRefusalWhole(world, data)   // nova 3
      //  answer = await data.read({ kind: 'QUERY', sql: world.queries.refused })
      //  answer.kind === 'QUERY_REFUSED'; [answer] deepEqual world.gave.query.slice(-1)
      //  world.reached.live deepEqual []
      async function queriesNothingWithoutCatalog(world, data)   // nova 4
      //  world.down('catalog'); data.read({ kind: 'QUERY', sql: world.queries.reads }) deepEqual { kind: 'CATALOG_UNAVAILABLE' }
      //  world.reached.query deepEqual []
      async function passesTheSignalToTheQuery(world, data)   // nova 5
      //  const { signal } = new AbortController(); before = world.reached.signals.length
      //  await data.read({ kind: 'QUERY', sql: world.queries.reads, signal })
      //  passed = world.reached.signals.slice(before); passed.length === 2 (o catálogo e a consulta); todos === signal

      // LAWS ganha, nesta ordem, depois da lei 9:
      ['consulta as tabelas do catálogo e devolve cada tabela lida com quem a guarda', queriesTheCatalog],
      ['não devolve linha nenhuma de uma consulta que leu uma tabela fora do catálogo', refusesRowsOutsideCatalog],
      ['devolve inteira a recusa do banco, com o SQLSTATE, sem ler ao vivo no lugar', keepsTheRefusalWhole],
      ['sem catálogo, a consulta não chega ao banco', queriesNothingWithoutCatalog],
      ['passa o sinal de cancelamento à consulta', passesTheSignalToTheQuery],
      ```
      O `fakeWorld` ganha `queries = { reads: 'select 1 from pedidos_abertos', outside: 'select 1 from fora', refused: 'select nao_existe' }` e uma fonte `query` que empurra o sinal e o texto, e responde por texto: `reads` dá `{ kind: 'ROWS', columns: ['?column?'], rows: [[1]], complete: true, used: ['pedidos_abertos'] }`, `outside` dá o mesmo com `used: ['fora']`, `refused` dá `{ kind: 'QUERY_REFUSED', sqlstate: '42703' }`, e `isDown.query` dá `TABLE_UNAVAILABLE`. A tabela `pedidos_abertos` é do `CATALOG` do teste (`company-data.test.ts:10-99`).
    - **Testes:** `packages/hub-api/src/company-data.test.ts`, que já chama `runDataConformance('o contrato sobre um ERP e um correio falsos', fakeWorld)` (`:146`). As 5 leis novas rodam ali. Molde: `company-data.test.ts:103-146`.
    - **Mutações à mão:** (a) em `read`, tire `if (tables.some((one) => one === undefined)) return NOT_IN_CATALOG`: a nova 2 falha. (b) Mova o ramo `QUERY` para antes de `sources.catalog`: a nova 4 falha. (c) Troque `signal` por `undefined` na chamada a `sources.query`: a nova 5 falha. (d) Devolva `{ kind: 'QUERY_REFUSED', sqlstate: '00000' }` no lugar de `answered`: a nova 3 falha.
    - **Pronto quando:** `npm test -w @conexus/hub-api` passa com 19 leis em `o contrato sobre um ERP e um correio falsos`.
    - _Requisitos: 2.1, 2.2, 3.1, 3.2, 3.4, 5.1, 5.3_
  - [ ] 1.3 Ponto de conferência do grupo 1
    - Rode `npm test -w @conexus/hub-api`, `npm run typecheck` e `npm run check`. Rode `npm run quality` inteiro, em segundo plano, antes de abrir o PR: a CI roda só `quality --fast`.
    - Passos 6 e 7 da skill `conexus-build`: pstack `deslop` e `no-comments` no diff, as quatro mutações da 1.2 feitas e desfeitas com o resultado anotado (testing T27), nenhum passo pulado, `npm run check` verde antes do commit.
    - Linha da tabela de referência no PR: "Pedido de consulta | `packages/hub-api/src/company-data.ts:66-75` | uma ferramenta que executa SQL de leitura | nativo (o banco executa e recusa)".
    - O corpo do PR declara a exceção: a linha `query` provisória de `apps/server/src/hub/data/public.ts`, como `D19`.
    - A CI roda `npm run check` e os testes de todos os pacotes.

- [ ] 2. Grupo 2: a fonte de consulta, na trilha Dados (um PR de uma fonte só: exceção registrada à regra de duas ou três unidades, porque a trilha Dados vai em PR próprio, `docs/steps/trilhas/dados.md:78`)
  - [ ] 2.1 `queryOf` e `relationsOf`, e as dependências novas de `DataDeps` (um commit)
    - **Arquivos:** `apps/server/src/hub/data/query.ts` (novo), `apps/server/src/hub/data/public.ts`, `apps/server/src/main.ts`, `apps/server/src/hub/identity/test-hub.ts`, `apps/server/src/hub/data/query.test.ts` (novo).
    - **Referência a seguir:** `askApp` em `apps/server/src/hub/apps/app-database.ts:174-210` (o endereço do login, `NO_LOGIN` com o dono e a nova tentativa, os logs); `withoutPassColumn` em `app-database.ts:213-221` e `withoutPass` em `:223-233` (a coluna `_pass` fora); `readApp` em `apps/server/src/platform/app-read.ts:114-156` (o `switch` das respostas); o prazo de `app_data_read` em `apps/server/src/builder/app-data/tools.ts:56-59`; os tipos de dependência de `apps/server/src/hub/copies/store.ts:92-94`; `personScope` em `store.ts:112-114` (a forma do escopo).
    - **O que sai:** a linha provisória `query` de `sourcesFor` (1.1).
    - **O que entra:**
      ```ts
      // apps/server/src/hub/data/public.ts: DataDeps ganha
      projects: ProjectPorts             // readyDatabaseOf (apps/server/src/hub/projects/company-database.ts:103)
      companyPostgres: CompanyPostgres   // readerAddress, readAddress, readCopies, ensureReader, ensureReadLogin
      neon: NeonProjects                 // ownerConnection
      // e o sourcesFor: query: (a) => queryOf(deps, scope, a)

      // a assinatura única das partes 3 e 4, posta aqui para nenhum PR depois mudá-la (design.md, `C7`)
      import type { AgentId, PersonId } from '@conexus/hub-api'
      import type { SessionScope, TurnKey } from '../connectors/public.ts'      // TurnKey em public.ts:62
      import type { Speaker } from '../identity/public.ts'                      // como write-record.ts:16
      /** Quem lê: o agente e a conversa. Forma e leitura da parte 4 (../04-governanca-minima/design.md, ReadBy). */
      export type ReadBy = Readonly<{ agent: 'ASSISTANT' | 'BUILDER' | 'AGENT' | 'APP'; agentId?: string; threadId?: string }>
      /** O turno de uma chamada: a chave que conta as chamadas da resposta, e quem fala (write-record.ts:32-45). */
      export type TurnBinding = Readonly<{ turn: TurnKey }> &
        (
          | Readonly<{ speaker: Readonly<{ kind: 'PERSON'; personId: PersonId }> }>
          | Readonly<{ speaker: Extract<Speaker, { kind: 'VERSION' }>; agentId: AgentId; number: number }>
        )
      export type DataContext = Readonly<{ by?: ReadBy; turn?: TurnBinding }>
      export function createCompanyData(deps: DataDeps): (scope: SessionScope, context?: DataContext) => CompanyData {
        return (scope, context) => companyData({ sources: sourcesFor(deps, scope, context), now: () => new Date() })
      }
      /** Exportado: o mundo real da conformidade (6.2) embrulha as fontes que ele monta. */
      export function sourcesFor(deps: DataDeps, scope: SessionScope, context?: DataContext): DataSources
      //  nesta parte nenhuma fonte lê context.by; live e funnel seguem NOT_GRANTED até a 6.2

      // apps/server/src/main.ts: a ligação que a parte 1 já faz ganha os três, sem um segundo createCompanyData
      const data = createCompanyData({ database, identity, log, connectors: () => connectors, copies: () => copies.data,
        projects: projects.ports, companyPostgres: deps.companyPostgres, neon })
      // apps/server/src/hub/identity/test-hub.ts: a mesma ligação do Hub de teste ganha hub.projects.ports,
      // hub.postgres.companyPostgres e hub.neon.neon, como copiesOn os entrega a createCopies (test-copies.ts:177-178)

      // apps/server/src/hub/data/query.ts
      import { APP_CALL_LIMITS } from '@conexus/app-contract'
      import type { QueryPage } from '@conexus/hub-api'
      import { QUERY_ROWS } from '@conexus/hub-api'
      import { COPY_PASS_COLUMN } from '../../platform/copy-sql.ts'
      import type { ReadResult } from '../../platform/company-postgres.ts'

      /** O plano que EXPLAIN (VERBOSE, FORMAT JSON) devolve: uma linha, uma coluna json, um array com { Plan }. */
      const PlanNode: z.ZodType<PlanNode> = z.lazy(() => z.looseObject({
        'Relation Name': z.string().optional(),
        Schema: z.string().optional(),
        Plans: z.array(PlanNode).optional(),
      }))
      const Explained = z.tuple([z.looseObject({ Plan: PlanNode })])

      /** Os nomes das tabelas de sync que o plano lê, sem repetir; undefined quando o plano não tem a forma. */
      export function relationsOf(explained: ReadResult): string[] | undefined
      //  a coluna é do tipo json, e o driver já a entrega lida (o caso do plano prova isso no banco de teste)
      //  const parsed = Explained.safeParse(explained.rows[0]?.[0])     // um texto não passa: plano fora da forma
      //  if (!parsed.success) return undefined
      //  percorre parsed.data[0].Plan e cada Plans; junta node['Relation Name'] quando node.Schema === 'sync'

      export async function queryOf(deps: DataDeps, scope: SessionScope, a: { sql: string; signal?: AbortSignal }): Promise<QueryPage>
      //  const asked = { kind: 'COMPANY', companyId: scope.companyId, personId: scope.personId } as const   // a forma de personScope
      //  1. numa só leitura do Hub, como catalogOf (parte 1, unidade 4.2):
      //     const { proof, ready } = await deps.database.read(asked, async (tx) => ({
      //       proof: await deps.identity.admitMember({ tx, companyId: scope.companyId, personId: scope.personId, action: 'readCompany' }),
      //       ready: await deps.projects.readyDatabaseOf(tx, scope.companyId) }))
      //     sem host -> deps.log.error({ companyId }, 'DATA_QUERY_FAILED') com cause NO_DATABASE; { kind: 'TABLE_UNAVAILABLE' }
      //  2. reader, com o papel tirado de proof:
      //     place PROJECT -> await deps.companyPostgres.readAddress(host, scope.place.projectId)
      //     place COMPANY e deps.identity.allows(proof.role, 'readCopyRows') -> await deps.companyPostgres.readerAddress(host)
      //                   (a parte 4 troca esta regra por readerOf)
      //     place COMPANY sem readCopyRows -> deps.log.info({ companyId, personId }, 'DATA_READ_REFUSED'); { kind: 'NOT_IN_ROLE' }
      //  3. const signal = AbortSignal.any([a.signal ?? new AbortController().signal,
      //                                     AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)])
      //     let read = await deps.companyPostgres.readCopies(reader,
      //       [{ text: `EXPLAIN (VERBOSE, FORMAT JSON) ${a.sql}` }, { text: a.sql }], signal)
      //  4. read.kind === 'NO_LOGIN':
      //       owner = await deps.neon.ownerConnection(ready.neonProjectId)
      //       owner.kind !== 'DONE' -> log DATA_QUERY_FAILED cause OWNER_<kind>; TABLE_UNAVAILABLE
      //       COMPANY: made = await deps.companyPostgres.ensureReader(owner.value)
      //       PROJECT: made = await deps.companyPostgres.ensureReadLogin(owner.value, scope.place.projectId)
      //       made.kind !== 'DONE' -> log DATA_QUERY_FAILED cause READ_LOGIN_NOT_MADE; TABLE_UNAVAILABLE
      //       read = await deps.companyPostgres.readCopies(...)   // uma vez só
      //  5. switch (read.kind):
      //     'ROWS': const [plan, result] = read.results
      //             const used = plan === undefined ? undefined : relationsOf(plan)
      //             if (used === undefined || result === undefined) {
      //               deps.log.error({ companyId, personId }, 'DATA_PLAN_UNREAD')
      //               throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'DATA_PLAN_UNREAD' } })
      //             }
      //             const kept = withoutPassColumn(result)
      //             return { kind: 'ROWS', columns: kept.columns.map(({ name }) => name),
      //                      rows: kept.rows.slice(0, QUERY_ROWS), complete: kept.rows.length <= QUERY_ROWS, used }
      //     'REFUSED': sqlstate '42501' -> log DATA_READ_REFUSED { companyId, personId } (sem a consulta, security S41); { kind: 'NOT_IN_ROLE' }
      //                outro -> { kind: 'QUERY_REFUSED', sqlstate: read.sqlstate }   // sem log: o modelo corrige
      //     'TOO_LARGE': { kind: 'QUERY_TOO_LARGE' }
      //     'TIMEOUT': log DATA_QUERY_FAILED cause TIMEOUT; { kind: 'DEADLINE' }
      //     'NO_LOGIN': log DATA_QUERY_FAILED cause NO_LOGIN; { kind: 'TABLE_UNAVAILABLE' }
      //     'UNAVAILABLE': log DATA_QUERY_FAILED cause read.cause; { kind: 'TABLE_UNAVAILABLE' }
      //     default: read satisfies never
      ```
      `withoutPassColumn` não é exportado de `hub/apps`, e `hub/data` não importa o miolo de outro assunto. A função vai movida para `apps/server/src/platform/copy-sql.ts`, ao lado de `COPY_PASS_COLUMN`, e os dois a importam; `app-database.ts` só troca a definição pelo import. Os nomes `readerAddress`, `ensureReader` e `readCopies` são os que a parte 1 liga em `createCompanyPostgres` (`apps/server/src/platform/company-postgres.ts:349`).
    - **Testes:** `apps/server/src/hub/data/query.test.ts` (novo), pela porta `on.hub.data(scope).read({ kind: 'QUERY', sql })` (testing T5), sobre `copiesOn(t)` (`apps/server/src/hub/copies/test-copies.ts:137-204`) com as cópias `vendas` e `vendedores` ligadas e rodadas (`on.enable`, `on.run`) e o banco de empresa descartável. Molde: `apps/server/src/hub/copies/grants.test.ts:63-92` e as escritas recusadas de `apps/server/src/builder/agents/app-data.test.ts:150-195`. Casos:
      - "o plano de EXPLAIN (VERBOSE, FORMAT JSON) traz Schema e Relation Name": `readCopies` como `conexus_read` com `EXPLAIN (VERBOSE, FORMAT JSON) select * from sync.sankhya_vendas`; o primeiro resultado tem uma linha, uma coluna, e o valor lido (já objeto, não texto) tem `[0].Plan["Relation Name"] === 'sankhya_vendas'` e `[0].Plan.Schema === 'sync'`. A prova do login por papel não rodou o `EXPLAIN (VERBOSE)`; o redator o mediu num PostgreSQL 17.10, e este caso o prova no banco de teste.
      - "a junção nomeia as duas tabelas": `select v."APELIDO", sum(c."VLRNOTA") from sync.sankhya_vendas c join sync.sankhya_vendedores v using ("CODVEND") group by 1` dá `QUERY` com `tables` igual às duas, cada uma com o `kept` do catálogo.
      - "uma CTE e uma subconsulta nomeiam a tabela de baixo".
      - "o catálogo do sistema não conta": `select count(*) from pg_roles` dá `QUERY` com `tables` vazio.
      - "não grava": `DELETE`, `INSERT`, `UPDATE`, `CREATE TABLE sync.x (a int)` e `select 1; select 2` não mudam linha nenhuma (`syncRows`, `test-copies.ts:264`, antes e depois). `select 1; select 2` e `CREATE TABLE` dão `QUERY_REFUSED` com `42601`. Os três de escrita dão `NOT_IN_ROLE` (decisão `L1`).
      - "o corte em 200": `select generate_series(1, 201) as n` dá 200 linhas e `complete: false`; `generate_series(1, 200)` dá `complete: true`.
      - "sem _pass": `select * from sync.sankhya_vendas limit 1` não traz a coluna `_pass`.
      - "a tabela fora do catálogo": uma tabela plantada em `sync` pelo dono (`asSync`, `test-copies.ts:249`), que `conexus_read` lê pelos privilégios padrão e o catálogo não lista, dá `NOT_IN_CATALOG`.
      - "a recusa inteira": `select nao_existe from sync.sankhya_vendas` dá `QUERY_REFUSED` com `42703`, e o log não tem a consulta.
      - "42501": `vendedores` liberada ao Projeto Pedidos antes (`on.copies.grant({ companyId, personId: anaId, copyId, projectId })`, que cria o app e os logins do Projeto, `apps/server/src/hub/copies/grants.ts:60`); no lugar `PROJECT` do Pedidos, `select * from sync.sankhya_vendas`, que não foi liberada, dá `NOT_IN_ROLE`, e o log `DATA_READ_REFUSED` não tem o texto da consulta (`hubLog`, `test-copies.ts:208`).
      - "o prazo": com `pg_sleep` maior que `APP_CALL_LIMITS.statementTimeoutMs`, `DEADLINE`.
      - "o banco calado": `t.mock.method(on.hub.postgres.companyPostgres, 'readCopies', ...)` devolvendo a resposta `UNAVAILABLE` da parte 1 dá `TABLE_UNAVAILABLE`, o log tem `DATA_QUERY_FAILED`, e o dublê do Sankhya não recebe chamada (`on.fake`).
      - "o plano ilegível": `t.mock.method` em `readCopies` devolvendo `ROWS` com o primeiro resultado `{ columns: [{ name: 'QUERY PLAN', typeId: 114 }], rows: [['não é plano']] }` faz `read` lançar `INTERNAL_UNEXPECTED`, e o log tem `DATA_PLAN_UNREAD` antes da falha.
      - "o membro no Início": Carla (`copiesOn` a faz membro) é admitida e, sem `readCopyRows`, recebe `NOT_IN_ROLE` no lugar `COMPANY`.
      - "quem não é da empresa": uma pessoa de fora (`personOn` sem `memberOn`) faz `admitMember` lançar a recusa dele, e a consulta não chega ao banco da empresa.
      - "a assinatura única": `on.hub.data(scope, { by: { agent: 'ASSISTANT', threadId: 't-1' } })` responde como `on.hub.data(scope)` à mesma consulta.
    - **Mutações à mão:** (a) tire o `EXPLAIN` da lista de instruções: "a junção nomeia as duas tabelas" falha. (b) Troque `node.Schema === 'sync'` por `true`: "o catálogo do sistema não conta" passa a dar `NOT_IN_CATALOG` e falha. (c) Troque `QUERY_ROWS` por `QUERY_ROWS + 1` no `slice`: "o corte em 200" falha. (d) Mapeie `42501` para `QUERY_REFUSED`: "42501" e "não grava" falham. (e) Tire `withoutPassColumn`: "sem _pass" falha. (f) Tire o `log.error` de `DATA_PLAN_UNREAD`: "o plano ilegível" falha.
    - **Pronto quando:** `apps/server/src/hub/data/query.test.ts` passa no comando de teste do servidor, e o caso do plano mostra `"Schema": "sync"` lido do banco de teste.
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 3.1, 3.3, 3.6, 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ] 2.2 Ponto de conferência do grupo 2
    - Rode `apps/server/src/hub/data/query.test.ts`, o `data.test.ts` da parte 1 e `apps/server/src/builder/agents/app-data.test.ts` (que passa por `askApp` e prova que `withoutPassColumn` movida continua tirando `_pass`) no comando do servidor; depois `npm run deps`, `npm run check` e `npm run quality` inteiro em segundo plano.
    - Passos 6 e 7 da skill `conexus-build`: pstack `deslop` e `no-comments`, as seis mutações da 2.1 feitas e desfeitas com o resultado anotado (testing T27), `npm run check` verde antes do commit.
    - Linha da tabela de referência no PR: "Quais tabelas a consulta leu | nenhuma | uma resposta que lista as tabelas usadas | nativo (`EXPLAIN` do Postgres)".
    - A CI roda `npm run check` (com `quality --fast`) e os quatro pedaços do servidor (`TEST_SHARD`). O PR cita a decisão `L1`.

- [ ] 3. Grupo 3: as ferramentas e a montagem nos três agentes, na trilha Agentes e Apps (um PR)
  - [ ] 3.1 As duas ferramentas, os nomes, o fecho do Builder e o verificador (um commit)
    - **Arquivos:** `packages/hub-api/src/tools.ts`, `apps/server/src/builder/data-tools/tools.ts` (novo), `apps/server/src/builder/data-tools/order.ts` (novo), `apps/server/src/builder/data-tools/public.ts` (novo), `apps/server/src/builder/data-tools/tools.test.ts` (novo), `apps/server/src/builder/conversation/permissions.ts`, `.dependency-cruiser.cjs`, `scripts/rules-doors.test.ts`, `apps/web/src/builder/conversation/data-specs.ts` (novo), `apps/web/src/builder/conversation/tool-registry.ts`.
    - **Referência a seguir:** `typedTool` em `apps/server/src/builder/connectors/typed-reads.ts:97-126` (o `createTool`, o `requestContext` indefinido, o `NOT_GRANTED`); `NOT_GRANTED` em `apps/server/src/builder/connectors/connector-tools.ts:58`; as razões ao modelo em `connector-tools.ts:171-186`; o modelo `text-to-sql` do Mastra (o modelo oficial de agente SQL do Mastra 1.82, `introspect-database.ts:7-54` e `execute-sql.ts:14-44`). API: `node_modules/@mastra/core/dist/docs/references/reference-tools-create-tool.md` (1.82.0), contexto da execução em `:99-109`. Os nomes ao lado de `APP_DATA_TOOL` (`packages/hub-api/src/tools.ts:40-41`). O `READ` de `apps/server/src/builder/conversation/permissions.ts:22-38`. `BAD` de `scripts/rules-doors.test.ts:20-33`. A linha mínima de tela no molde de `APP_DATA_SPECS` (`apps/web/src/builder/conversation/app-data-specs.ts:21-42`). `FailureLog` em `apps/server/src/platform/failure.ts:12-15`.
    - **O que sai:** em `scripts/rules-doors.test.ts`, o arquivo da chave `agents-and-apps-reach-data-only-through-the-contract` de `BAD` (hoje `${SRC}/builder/assistant/rows.ts`) troca por `${SRC}/builder/data-tools/x.ts`, porque `BAD` é `Record<regra, [arquivo, alvo]>` e não aceita uma segunda entrada da mesma regra.
    - **O que entra:**
      ```ts
      // packages/hub-api/src/tools.ts
      /** As ferramentas de dado copiado, as mesmas no Assistente, no Builder e no agente salvo (code C26). */
      export const DATA_TOOL = { describe: 'data_describe', query: 'data_query' } as const
      /** A amostra de uma tabela (decisão `T7`). */
      export const DESCRIBE_SAMPLE_ROWS = 5
      // BUILDER_TOOL (:48-59) ganha: dataDescribe: DATA_TOOL.describe, dataQuery: DATA_TOOL.query
      // assim CLOSED_TOOLS (:62-68) e RowTool (apps/web/src/builder/conversation/tool-spec.ts:15-21) os herdam
      // apps/server/src/builder/conversation/permissions.ts: READ (:22-38) ganha BUILDER_TOOL.dataDescribe e
      // BUILDER_TOOL.dataQuery neste commit, para TOOL_CLOSURE continuar igual a CLOSED_TOOLS (permissions.test.ts:259-261)

      // apps/server/src/builder/data-tools/tools.ts. Importa @conexus/hub-api, @mastra/core, zod e o tipo FailureLog
      import type { ToolsInput } from '@mastra/core/agent'
      import type { RequestContext } from '@mastra/core/request-context'
      import { createTool } from '@mastra/core/tools'
      import type { FailureLog } from '../../platform/failure.ts'

      /** `threadId` é a conversa da chamada: `agent?.threadId` do contexto de execução
       *  (node_modules/@mastra/core/dist/tools/types.d.ts:172-183, campo `agent` em :573). */
      export type DataOf = (requestContext: RequestContext, call: Readonly<{ threadId?: string }>) => Promise<CompanyData | undefined>
      export const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

      export type Origin = Readonly<{ system: string; connector: string; table: string; copiedAt: string | null;
        lastRun: 'COMPLETE' | 'PARTIAL' | 'ERROR' | 'INTERRUPTED' | 'NONE' }>
      /** A origem de uma tabela pelo sistema que a guarda; undefined quando o catálogo não traz esse sistema. */
      function originOf(table: CatalogTable, catalog: Catalog): Origin | undefined
      //  const system = catalog.systems.find((s) => s.connection === table.kept.connections[0])
      //  if (system === undefined) return undefined
      //  { system: system.name, connector: system.connector, table: table.name,
      //    copiedAt: table.kept.lastRun?.endedAt ?? null, lastRun: table.kept.lastRun?.outcome.kind ?? 'NONE' }
      //  quem chama e recebe undefined: log.error({ table: table.name, connection: String(table.kept.connections[0]) },
      //  'DATA_ORIGIN_UNREAD') e refused({ kind: 'CATALOG_UNAVAILABLE' }); nenhuma linha sai e o id não vira nome

      export function dataTools({ dataOf, log }: { dataOf: DataOf; log: Pick<FailureLog, 'error'> }): ToolsInput
      //  [DATA_TOOL.describe]: createTool({ id, description: DESCRIBE_DESCRIPTION,
      //      inputSchema: z.object({ table: z.string().max(40).optional() }),
      //      execute: async ({ table }, { requestContext, abortSignal, agent }) => {
      //        const data = requestContext === undefined ? undefined : await dataOf(requestContext, { threadId: agent?.threadId })
      //        if (data === undefined) return NOT_GRANTED
      //        const described = await data.describe({ signal: abortSignal })
      //        if (described.kind === 'CATALOG_UNAVAILABLE') return refused(described)
      //        if (table === undefined) return listed(described, log)
      //        return tabled(table, described, await data.read({ kind: 'TABLE', table, signal: abortSignal }), log)
      //      } })
      //  [DATA_TOOL.query]: createTool({ id, description: QUERY_DESCRIPTION,
      //      inputSchema: z.object({ sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
      //      execute: async ({ sql }, { requestContext, abortSignal, agent }) => {
      //        ...o mesmo NOT_GRANTED...
      //        const answer = await data.read({ kind: 'QUERY', sql, signal: abortSignal })
      //        if (answer.kind !== 'QUERY') return refused(answer)
      //        const described = await data.describe({ signal: abortSignal })
      //        if (described.kind === 'CATALOG_UNAVAILABLE') return refused(described)
      //        return queried(answer, described, log)
      //      } })

      // listed  -> { kind: 'CATALOG', systems: [{ name, connector, reads: [{ operation, label, summary }] }],
      //              tables: [{ name, label, description, ...originOf(t, catalog) sem table }] }   // sem colunas
      // tabled  -> NOT_IN_CATALOG da tabela que não está em described.tables (antes de read)
      //            TABLE -> { kind: 'TABLE', name, label, description, columns: [{ name, type, description, inactiveSince }],
      //                       sample: { rows: answer.rows.slice(0, DESCRIBE_SAMPLE_ROWS),
      //                                 more: answer.rows.length > DESCRIBE_SAMPLE_ROWS || !answer.complete },
      //                       origin: originOf(t, catalog) }
      //            outra   -> refused(answer)
      // queried -> answer.tables.map((one) => originOf(tabela do catálogo, catalog))
      //            { kind: 'ROWS', columns, rows, complete, origin }
      //            origin vazia -> acrescenta reason: 'The origin of these rows was not identified: say so.'
      // refused(answer) -> { ...answer, reason: REASONS[answer.kind] } com as frases do design.md, `C3`, em inglês;
      //                    QUERY_REFUSED põe o SQLSTATE na frase: `PostgreSQL refused the query (SQLSTATE ${sqlstate}). ...`
      //                    o switch termina em `satisfies never`

      // apps/server/src/builder/data-tools/order.ts
      /** A ordem que os três agentes seguem para ler dado copiado. Uma função, um texto. */
      export function dataOrder(): string   // o texto do design.md, `C4`, sem mudar uma palavra

      // apps/server/src/builder/data-tools/public.ts
      export { dataTools, NOT_GRANTED } from './tools.ts'; export type { DataOf, Origin } from './tools.ts'
      export { dataOrder } from './order.ts'
      ```
      `DESCRIBE_DESCRIPTION` e `QUERY_DESCRIPTION` são frases em inglês que dizem o que cada uma faz e mandam escrever a tabela com o esquema (`sync.sankhya_vendas`), como `READ_DESCRIPTION` (`apps/server/src/builder/app-data/tools.ts:25`). Em `.dependency-cruiser.cjs`, `AGENTS_AND_APPS` (`:21`) ganha `data-tools` na lista de pastas, e a pasta não entra em `CONTRACT_MIGRATION` (`:23-53`).
      Na tela, o tipo `Record<RowTool, ToolSpec>` de `TOOLS` (`apps/web/src/builder/conversation/tool-registry.ts:47`) passa a exigir as duas linhas. `data-specs.ts` exporta `DATA_SPECS` com só o mínimo, que a 4.2 completa: `data_describe` com `icon: DatabaseIcon`, `running: 'Consultando o catálogo'`, `done: 'Consultou o catálogo'`, `failed: 'Não conseguiu ler o catálogo agora.'`, `verb: 'consultou'`, `body: 'generic'`, `groups: true`; `data_query` com `running: 'Consultando os dados'`, `done: 'Consultou os dados'`, `failed: 'Não conseguiu ler a tabela agora.'`, `verb: 'consultou'`, `body: 'generic'`, `groups: true`. `TOOLS` ganha `...DATA_SPECS` ao lado de `...APP_DATA_SPECS` (`:202`).
    - **Testes:** `apps/server/src/builder/data-tools/tools.test.ts` (novo), com o contrato sobre fontes falsas (`companyData({ sources, now })`, como `fakeWorld` em `packages/hub-api/src/company-data.test.ts:102-144`), um `log` que guarda as linhas, e `execute` chamado como em `apps/server/src/builder/connectors/connector-tools-scope.test.ts:56-58`. Casos:
      - "sem requestContext, NOT_GRANTED e nenhuma fonte chamada";
      - "dataOf undefined, NOT_GRANTED";
      - "describe sem tabela não traz colunas e traz o conector, a hora e o estado da última rodada";
      - "describe com tabela corta 200 linhas em 5 e diz more";
      - "describe de tabela fora do catálogo dá NOT_IN_CATALOG com a frase e não lê linha";
      - "query devolve a origem com o nome e o conector do sistema do catálogo";
      - "query sem tabela no plano diz que a origem não foi identificada";
      - "um sistema fora do catálogo dá CATALOG_UNAVAILABLE e registra DATA_ORIGIN_UNREAD": o catálogo falso com uma tabela cuja conexão não está em `systems`, nos dois caminhos (`describe` com a tabela e `query`); nenhuma linha no resultado;
      - "cada recusa leva a sua frase" (`test.each` sobre `QUERY_REFUSED`, `QUERY_TOO_LARGE`, `DEADLINE`, `TABLE_UNAVAILABLE`, `NOT_IN_ROLE`, `NOT_IN_CATALOG`, `CATALOG_UNAVAILABLE`);
      - "o SQL acima de 4000 caracteres é recusado pelo esquema".
      Em `scripts/rules-doors.test.ts`, o caso de `BAD` da regra agora planta `builder/data-tools/x.ts` importando `../../hub/connectors/public.ts`, recusado.
    - **Mutações à mão:** (a) troque `DESCRIBE_SAMPLE_ROWS` por `200` no `slice`: "describe com tabela corta" falha. (b) Tire o `return NOT_GRANTED` de `dataOf` indefinido: "dataOf undefined" falha. (c) Tire `data-tools` de `AGENTS_AND_APPS`: o caso de `BAD` em `rules-doors.test.ts` falha. (d) Faça `originOf` cair em `table.kept.connections[0]` como nome: "um sistema fora do catálogo" falha. (e) Tire os nomes de `READ`: `permissions.test.ts:259-261` falha.
    - **Pronto quando:** `apps/server/src/builder/data-tools/tools.test.ts` e `apps/server/src/builder/conversation/permissions.test.ts` passam no comando do servidor; `node scripts/test-run.ts --test-timeout=120000 --test-reporter=./scripts/test-reporter.ts scripts/rules-doors.test.ts` passa; `npm run deps` passa; e `npm run test:unit -w @conexus/web -- src/builder/conversation/tool-row.test.tsx` passa com as duas linhas novas no caso de `:185`.
    - _Requisitos: 1.3, 1.5, 1.6, 1.9, 2.6, 3.3, 3.5, 3.7, 5.1, 5.6, 6.3_
  - [ ] 3.2 A montagem nos três agentes, com a porta na raiz do servidor (um commit)
    - **Arquivos:** `apps/server/src/main.ts`, `apps/server/src/conversations-of.ts`, `apps/server/src/builder/assistant/assistant.ts`, `apps/server/src/builder/assistant/instructions.ts`, `apps/server/src/builder/conversation/public.ts`, `apps/server/src/builder/conversation/builder.ts`, `apps/server/src/builder/conversation/instructions.ts`, `apps/server/src/builder/app-data/context.ts`, `apps/server/src/builder/agents/agent.ts`, `apps/server/src/builder/agents/controller.ts`, `apps/server/src/builder/data-tools/mounted.test.ts` (novo).
    - **Referência a seguir:** a porta tardia de `conversationsOf` em `apps/server/src/conversations-of.ts:186-193` (`door`) e `main.ts:158-165` (`connectors: () => connectors`); o objeto de `tools` do Assistente em `assistant.ts:235-250` e `AVAILABLE_TOOLS` em `:82-97`; `builderInstructions` em `apps/server/src/builder/conversation/instructions.ts:28-66` e a sua chamada em `builder.ts:126-132`; o `tools` do Builder em `builder.ts:140-156` e o `admitted` em `:55-66`; `runToolsOf` do agente salvo em `agent.ts:256-305`, com o `scope` lido do `plan` em `:264` e `neverAsking` (`:224-233`); `HOW_TO_READ` em `apps/server/src/builder/app-data/context.ts:19-25`.
    - **O que sai:** em `HOW_TO_READ` (`context.ts:22`), a frase "Count a read on the real data with `app_data_check`, and see a few rows with `app_data_read`; the Project app reads the same table through `db`. A copy has no row count here: ask `app_data_check`." sai.
    - **O que entra:**
      ```ts
      // apps/server/src/main.ts: o `data` que a parte 1 cria (e a 2.1 ampliou) entra em conversationsOf({...}):
      companyData: (scope, context) => data(scope, context)   // chamada tardia, como `send: (version) => apps.sendFromBuilder(version)` em :155

      // apps/server/src/conversations-of.ts
      // ConversationsDeps ganha: companyData: (scope: SessionScope, context?: DataContext) => CompanyData
      // passa companyData a createAssistant, agentsAlive e createBuilderConversations
      // (o nome não é `data`: createBuilder já tem `data: BuilderData`, builder.ts:110)

      // apps/server/src/builder/assistant/assistant.ts
      // Deps ganha companyData; em assistantAgent:
      const dataOf: DataOf = async (requestContext, { threadId }) => {
        const scope = await scopeOf(requestContext)          // context.ts:48-58
        return scope === undefined ? undefined : deps.companyData(scope, { by: { agent: 'ASSISTANT', threadId } })
      }
      // tools: { ...o de hoje, ...dataTools({ dataOf, log: deps.log }) }   // depois de assistantConnectorTools
      // AVAILABLE_TOOLS ganha ...Object.values(DATA_TOOL)
      // instructions.ts: depois de fixedSystem(FIXED), { role: 'system', content: dataOrder() }

      // apps/server/src/builder/conversation/builder.ts
      // createBuilder deps ganha companyData (e createBuilderConversations, conversation/public.ts:62-84)
      const dataOf: DataOf = async (requestContext, { threadId }) => {
        const ids = await admitted(requestContext)
        if (ids === undefined) return undefined
        const chosen = (await granted(requestContext)).map((each) => each.connectionId)
        return deps.companyData({ companyId: ids.companyId, personId: ids.personId,
          place: { kind: 'PROJECT', projectId: ids.projectId }, chosen }, { by: { agent: 'BUILDER', threadId } })
      }
      // tools: { ...o de hoje, ...dataTools({ dataOf, log: deps.log }) }   // no fim, para a ordem de :144 mudar só no fim

      // apps/server/src/builder/conversation/instructions.ts, em builderInstructions:
      return `${fillPrompt({ ...o de hoje })}\n\n${dataOrder()}`
      // um bloco próprio, fora de dataContext: dataContext devolve '' num Projeto sem cópia (context.ts:77-78)

      // apps/server/src/builder/app-data/context.ts, HOW_TO_READ (:22), a frase nova:
      'Count a read on the real data with `app_data_check`, and see the columns and a few rows of a copy with `data_describe`, in the order of `## Company data`; the Project app reads the same table through `db`. A copy has no row count here: ask `app_data_check`.'

      // apps/server/src/builder/agents/agent.ts
      // AgentDeps (:112-129) ganha companyData; controller.ts Deps (:200) também
      // em runToolsOf, dentro de neverAsking({...}) de ofTheAgent, com o scope já lido em :264:
      ...dataTools({ dataOf: async (_requestContext, { threadId }) =>
        deps.companyData(scope, { by: { agent: 'AGENT', agentId: frozen.agentId, threadId } }), log: deps.log }),
      // frozen.agentId é o parâmetro de runToolsOf (agent.ts:256-260)
      // instructions (:338-349): depois de fixedSystem(FIXED), { role: 'system', content: dataOrder() }
      ```
      O que as ferramentas passam em `by`: o agente (`ASSISTANT`, `BUILDER` ou `AGENT` com o `agentId`) e a conversa da chamada (`threadId`). Nenhuma fonte da parte 3 o lê; a parte 4 o grava no Registro de dados. Nenhum dos três passa `turn` nesta parte, então `live` e `funnel` continuam `NOT_GRANTED` para eles.
      O `scope` do agente salvo tem o lugar `PROJECT` do agente e `agentVersion` (`agent.ts:203-209`). Ele lê pela liberação do Projeto dele, como o Builder (resposta do fundador à P1, no índice); a regra por papel de quem pergunta é entrada da parte 7.
      Efeito que esta unidade aceita: pôr `dataTools` em `ofTheAgent` também os põe no programa do modo código, porque `codeModeOf(ofTheAgent, machines.codeMode)` é feito do mesmo objeto (`agent.ts:290`). O agente salvo numa máquina pode chamar as duas de dentro do programa.
      O Construtor (`apps/server/src/builder/construtor/construtor.ts:197-222`) não muda. `context.ts` fica na lista de migração: a mudança é de texto e não muda import (decisão `L2`).
    - **Testes:** `apps/server/src/builder/data-tools/mounted.test.ts` (novo). Um turno de cada agente com o dublê de modelo; a primeira chamada ao modelo (`Sent`, `apps/server/src/platform/test-anthropic-body.ts:9-21`) traz `tools`, `descriptions`, `schemas` e `system`. Casos:
      - "o Assistente, o Builder e o agente salvo oferecem data_describe e data_query com a mesma descrição e o mesmo esquema": o Assistente por `assisting` (`apps/server/src/builder/assistant/test-assistant.ts:74-141`), o Builder por `conversing` como em `apps/server/src/builder/app-data/access.test.ts:37-55`, o agente salvo por `agentsOn` (`apps/server/src/builder/agents/test-agents.ts:55`). Compare `descriptions[DATA_TOOL.describe]` e `schemas[DATA_TOOL.query]` dos três.
      - "o Construtor não oferece data_describe nem data_query".
      - "a ordem do agente está nas instruções dos três, também num Projeto sem cópia": `Sent.system` contém `## Company data`, com o Builder num Projeto sem cópia liberada.
      - "o bloco de dados do Builder não manda ver linhas com app_data_read": um Projeto com uma cópia liberada (`releasing`, `apps/server/src/hub/copies/test-released.ts:49-93`); `Sent.system` contém `data_describe` no bloco `## Data` e não contém `see a few rows with \`app_data_read\``.
      Os testes `apps/server/src/builder/conversation/permissions.test.ts:240-261` e `apps/server/src/builder/app-data/context.test.ts` (o caso de `:72`, bloco vazio sem cópia) passam; um caso de `context.test.ts` que cite a frase antiga troca para a nova.
    - **Mutações à mão:** (a) tire `...Object.values(DATA_TOOL)` de `AVAILABLE_TOOLS`: o caso do Assistente falha (o controlador tira a ferramenta). (b) Tire `...dataTools(...)` de `runToolsOf`: o caso do agente salvo falha. (c) Mova `dataOrder()` do Builder para dentro de `dataContext`: "também num Projeto sem cópia" falha. (d) Volte a frase antiga de `HOW_TO_READ`: o último caso falha.
    - **Pronto quando:** `mounted.test.ts`, `permissions.test.ts`, `context.test.ts` e `apps/server/src/builder/assistant/assistant.test.ts` passam, `npm run typecheck` e `npm run deps` passam, e um turno do Assistente com o dublê de modelo mostra `data_describe` e `data_query` em `Sent.tools`.
    - _Requisitos: 1.1, 1.2, 1.4, 1.7, 1.8_
  - [ ] 3.3 Ponto de conferência do grupo 3
    - Rode `apps/server/src/builder/data-tools/tools.test.ts`, `apps/server/src/builder/data-tools/mounted.test.ts`, `apps/server/src/builder/conversation/permissions.test.ts`, `apps/server/src/builder/app-data/context.test.ts` e `apps/server/src/builder/assistant/assistant.test.ts` no comando do servidor; `scripts/rules-doors.test.ts`; `npm run test:unit -w @conexus/web -- src/builder/conversation/tool-row.test.tsx`. Depois `npm run check` e `npm run quality` inteiro em segundo plano.
    - Passos 6 e 7 da skill `conexus-build`: rode o servidor (`npm run build -w @conexus/server` e um turno do Assistente com o dublê), pstack `deslop` e `no-comments`, as mutações das duas unidades feitas e desfeitas com o resultado anotado (testing T27), `npm run check` verde antes de cada commit.
    - Linhas da tabela de referência no PR: "As duas ferramentas | `app-data/tools.ts:65-86`, `typed-reads.ts:97-126` | modelo `text-to-sql` do Mastra | nativo (`createTool`)" e "A ordem | `app-data/context.ts:19-25` | a amostra antes da consulta | nativo (texto)".
    - A CI roda `npm run check` (com `quality --fast`), os quatro pedaços do servidor (`TEST_SHARD`) e `npm test -w @conexus/web`.

- [ ] 4. Grupo 4: os cenários gravados e a origem até a tela (um PR; depois dele, a QA)
  - [ ] 4.1 O `at` da leitura ao vivo, os cenários `data-query` e `reads`, e as perguntas com resposta conhecida (um commit)
    - **Arquivos:** `apps/server/src/builder/connectors/connector-tools.ts`, `apps/server/src/builder/connectors/connector-tools-scope.test.ts`, `packages/hub-api/src/assistant.ts`, `scripts/record.ts`, `scripts/record-calls.ts`, `apps/server/src/platform/recordings/mastra/data-query.jsonl` (novo, gerado), `apps/server/src/platform/recordings/mastra/reads.jsonl` (gerado de novo), `apps/server/src/builder/data-tools/test-data.ts` (novo), `apps/web/src/builder/conversation/test-recorded.ts`, `apps/server/src/builder/assistant/test-scorecard.ts`, `apps/server/src/builder/assistant/assistant.scorecard.test.ts`.
    - **Referência a seguir:** `readOn` em `apps/server/src/builder/connectors/connector-tools.ts:218-235` (o OK sem `whole` volta em `:230`, o corte com `whole` em `:231-234`); `ReadCut` em `packages/hub-api/src/assistant.ts:85-91`; o cenário `reads` (`scripts/record.ts:12-14`, `:89`, `:137`, `:148`) e o `connector_read` inventado de `RECORDED_TOOLS` (`:242-258`); `READS_CALLS`/`READS_PROMPT` (`scripts/record-calls.ts:18-40`); `nativeRecording` em `apps/server/src/platform/test-recordings.ts:77-89`; `recordedPart` e `SubagentPart` em `apps/web/src/builder/conversation/test-recorded.ts:127-163`; o placar em `test-scorecard.ts:32-55`, `:169-178` (`failed`) e `:211-227` (`judged`); o caso com modelo real em `assistant.scorecard.test.ts:82-127`.
    - **O que sai:** `reads.jsonl` de hoje, trocado pela gravação nova.
    - **O que entra:**
      ```ts
      // apps/server/src/builder/connectors/connector-tools.ts, em readOn:
      //   const answered = await access.read(...)
      //   const at = new Date().toISOString()                 // a hora em que a resposta voltou
      //   OK sem whole (:230): return answered.kind === 'OK' ? { ...answered, at } : answered
      //   OK com whole: const { whole, ...cut } = answered; return { ...cut, at } e saveWhole(..., whole, { ...cut, at })
      // packages/hub-api/src/assistant.ts: ReadCut ganha at: z.iso.datetime().optional()
      // scripts/record.ts: o connector_read inventado devolve { kind: 'OK', value, complete: true, at: new Date().toISOString() }

      // apps/server/src/builder/data-tools/test-data.ts. O contrato sobre fontes fixas, conteúdo inventado (`S40`)
      export function recordedData(): CompanyData
      //  companyData({ now: () => AT, sources: { catalog: () => CATALOG com sankhya_vendas (sistema "Matriz",
      //    conector "sankhya", lastRun COMPLETE terminada às 08:45 de 2026-11-14), rows: 6 linhas de
      //    PADARIA_SOL_MATRIZ.notas (complete false),
      //    query: { kind: 'ROWS', columns: ['total'], rows: [[TOTAL_OUTUBRO]], complete: true, used: ['sankhya_vendas'] },
      //    live e funnel: NOT_GRANTED } })
      //  TOTAL_OUTUBRO = soma de soldBy(PADARIA_SOL_MATRIZ, '2026-10') (packages/connectors/src/sankhya/fake-sales.ts:100-109)

      // scripts/record-calls.ts
      export const DATA_QUERY_PROMPT = 'Quanto a Padaria Sol vendeu em outubro de 2026?'
      export const DATA_QUERY_CALLS: Block[][] = [
        [{ type: 'tool_use', name: 'data_describe', input: {} }],
        [{ type: 'tool_use', name: 'data_describe', input: { table: 'sankhya_vendas' } }],
        [{ type: 'tool_use', name: 'data_query', input: { sql: OCTOBER_SQL } }],
        [{ type: 'text', text: 'Em outubro de 2026 a Padaria Sol vendeu **R$ 24.560,70**, de sankhya_vendas.' }],
      ]
      // OCTOBER_SQL = `select sum("VLRNOTA") as total from sync.sankhya_vendas where "DTNEG" >= '2026-10-01' and "DTNEG" < '2026-11-01'`

      // scripts/record.ts: 'data-query' em Scenario (:82-95), em CALLS (:133-143) e em asked (:146-152);
      // RECORDED_TOOLS ganha ...dataTools({ dataOf: async () => recordedData(), log }) de apps/server/src/builder/data-tools/public.ts;
      // recordedData fica com este nome: é o ajudante de teste desta parte (a parte 4 renomeia o embrulho dela)
      // o comentário de :2 ganha o nome do cenário

      // apps/web/src/builder/conversation/test-recorded.ts, ao lado de SubagentPart (:154-163):
      export const DataPart = /* a parte tool-invocation das ferramentas de dado, no molde de SubagentPart */
      ```
      Grave com `npm run record -- data-query` e `npm run record -- reads`. Os arquivos saem em `apps/server/src/platform/recordings/mastra/`, com a primeira linha que nomeia a biblioteca e a versão (testing T26). O resultado guardado de cada chamada é o resultado real das ferramentas, e é dele que os testes de tela de 4.2 e 4.3 leem.
      No placar, `Data` (`test-scorecard.ts:27`) ganha `'CP'` (o dado copiado do Sankhya). Entra `COPY_QUESTIONS: readonly CopyQuestion[]`, separada das 27 do fundador (o teste de `assistant.scorecard.test.ts:62-80` conta 27 e fica igual), com `{ n, text, asks: 'OWNER' | 'BUILDER', tables: string[], truth: () => number | string | null, partial?: true, released?: string[] }`:

      | n | Pergunta | Quem pergunta | Tabelas na origem | De onde sai o esperado |
      | --- | --- | --- | --- | --- |
      | c1 | "Quanto vendi em outubro?" | o dono, no Início | `sankhya_vendas` | A soma de `VLRNOTA` das notas de outubro. Cada nota tem `VLRNOTA = cents(soma de VLRTOT dos itens)` (`fake-sales.ts:150-161`). Uma nota por dia por vendedor, 31 dias e 3 vendedores da Matriz (`:41-44`, `:51-76`, `:79-87`): 93 notas. Hoje dá R$ 24.560,70 |
      | c2 | "Quantos clientes ativos temos?" | o dono | `sankhya_clientes` | O número de parceiros com `ATIVO = 'S'` e `CLIENTE = 'S'`: os 4 de `PARCEIROS` (`fake-sales.ts:29-34`), com os padrões da tabela `TGFPAR` (`:125-127`) |
      | c3 | "Qual vendedor mais vendeu no mês?" | o dono | `sankhya_vendas`, `sankhya_vendedores` | O apelido com o maior total de `soldBy(PADARIA_SOL_MATRIZ, '2026-10')` (`fake-sales.ts:100-109`). Hoje dá JOAO, R$ 8.246,20 |
      | c4 | "Quanto pagamos de comissão?" | o dono | nenhuma | Nenhum número. O texto diz que não achou e nomeia uma tabela que existe, e nenhuma chamada tem `kind` de recusa |
      | c5 | "Quanto vendi em outubro?", com a última rodada parcial | o dono | `sankhya_vendas` | O número de c1 e uma palavra de aviso (`/incomplet|parcial/i`) |
      | c6 | No Projeto do CRM: "quais tabelas de cliente eu tenho?" | o Builder | `sankhya_clientes` | O nome `sankhya_clientes` no texto e nenhuma outra tabela de `sync` |

      O teste calcula cada número no próprio teste: pela função do dublê (`soldBy`, `PADARIA_SOL_MATRIZ.parceiros`) e, na rodada que copia, também pela consulta como dono no banco de teste (`asSync`, `apps/server/src/hub/copies/test-copies.ts:249`). Os dois têm de bater. Nenhum número fica escrito à mão no teste. A coluna "Hoje dá" é só para o leitor conferir.
      `failed` (`test-scorecard.ts:169-178`) passa a aceitar como sucesso `CATALOG`, `TABLE` e `ROWS` quando `toolName` é de `DATA_TOOL`. `judgedCopy(asked, parts)` confere: chamou `data_query` (menos c4 e c6), as tabelas de `origin` do último `data_query` são `asked.tables`, e o texto mostra o número com `shows` (`apps/server/src/builder/assistant/test-truths.ts:249`).
    - **Testes:**
      - `apps/server/src/builder/connectors/connector-tools-scope.test.ts` ganha "uma leitura OK leva a hora em que voltou", com e sem `whole` (`at` entre o antes e o depois da chamada; molde `:33-58`).
      - `apps/server/src/platform/recordings.test.ts` passa com os dois arquivos (cabeçalho e `LEAK`). Os testes de tela que leem `reads` (`apps/web/src/builder/agents/test-connection-tools.ts`) passam sem mudança.
      - Em `apps/server/src/builder/assistant/assistant.scorecard.test.ts`: caso "as perguntas do dado copiado: cada uma com tabela, número e origem esperados, calculados do dublê" (sem modelo); caso "o placar do dado copiado julga certo um turno que consulta e cita a origem, e errado um que lê o sistema ao vivo" com o dublê de modelo sobre `assisting` e as cópias ligadas por `releasing(t, ..., ['vendas', 'vendedores', 'clientes'], [])` (`apps/server/src/hub/copies/test-released.ts:49-93`), o dublê compondo a resposta com o número que leu no resultado de `data_query` (testing T28, molde `reader()` em `apps/server/src/builder/assistant/assistant.eval.test.ts:39-77`); caso "não achei é resposta" com c4, que confere prosa e nenhuma recusa; caso "o modelo de verdade, as perguntas do dado copiado", que pula com `opt-in: set CONEXUS_EVAL_REAL_MODEL ...` sem a variável (molde `:82-127`).
    - **Mutações à mão:** (a) tire o `at` do retorno sem `whole` em `readOn`: "uma leitura OK leva a hora" falha no caso sem `whole`. (b) Em `failed`, tire a exceção de `DATA_TOOL`: o caso que julga certo falha. (c) Em `judgedCopy`, não confira as tabelas da origem: o turno do dublê que cita `sankhya_clientes` para c1 passa a ser julgado certo; acrescente esse turno como caso negativo.
    - **Pronto quando:** `npm run record -- data-query` e `npm run record -- reads` gravam sem `LEAK`, `connector-tools-scope.test.ts` e `assistant.scorecard.test.ts` passam, e o caso do modelo real pula com `opt-in:`.
    - _Requisitos: 4.4, 5.8, 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ] 4.2 As linhas das duas ferramentas, o corpo com a consulta e os textos de recusa (um commit; telas `p3-02`, `p3-06`, `p3-07`)
    - **Arquivos:** `apps/web/src/builder/conversation/data-specs.ts`, `apps/web/src/builder/conversation/tool-spec.ts`, `apps/web/src/builder/conversation/tool-row.tsx`, `apps/web/src/builder/conversation/data-specs.test.tsx` (novo).
    - **Referência a seguir:** `presentRead` e `rowsText` em `apps/web/src/builder/conversation/connector-specs.ts:250-305` (a frase por estado, o detalhe ao lado); `refusal` de `ToolSpec` (`tool-spec.ts:106-107`) e `Refusal` (`:68`); `Block` de `tool-row.tsx:129` (um `case` por `ToolBody`); `Button` de `apps/web/src/ui/button.tsx` (variante `ghost`, tamanho `sm`).
    - **O que sai:** as linhas mínimas da 3.1 trocam pelas completas.
    - **O que entra:**
      ```ts
      // apps/web/src/builder/conversation/data-specs.ts
      const Catalogued = z.looseObject({ kind: z.literal('CATALOG'), tables: z.array(z.unknown()) })
      const Tabled = z.looseObject({ kind: z.literal('TABLE'), name: z.string(),
        sample: z.object({ rows: z.array(z.unknown()), more: z.boolean() }) })
      const Queried = z.looseObject({ kind: z.literal('ROWS'), rows: z.array(z.unknown()), complete: z.boolean(),
        origin: z.array(z.looseObject({ table: z.string() })) })
      const Refused = z.looseObject({ kind: z.enum(['NOT_IN_ROLE', 'TABLE_UNAVAILABLE', 'CATALOG_UNAVAILABLE',
        'QUERY_REFUSED', 'QUERY_TOO_LARGE', 'DEADLINE', 'NOT_IN_CATALOG', 'NOT_GRANTED']) })

      const REFUSED_TEXT = {
        NOT_IN_ROLE: 'Seu papel não lê esta tabela. Peça a quem administra a empresa.',
        TABLE_UNAVAILABLE: 'Não conseguiu ler a tabela agora.',
        CATALOG_UNAVAILABLE: 'Não conseguiu ler a tabela agora.',
        QUERY_REFUSED: 'A consulta não rodou.',
        QUERY_TOO_LARGE: 'A consulta trouxe dados demais.',
        DEADLINE: 'A consulta demorou demais.',
        NOT_IN_CATALOG: 'Essa tabela não está no catálogo.',
        NOT_GRANTED: LOCAL_REFUSALS.NOT_GRANTED,          // connector-specs.ts:144-148
      } as const satisfies Record<z.infer<typeof Refused>['kind'], string>

      function presentDescribe(tool, status): Presented
      //  table = stringArg(tool.args, 'table')
      //  recusa -> said(REFUSED_TEXT[kind]); status error/denied -> said(sem tabela ? 'Não conseguiu ler o catálogo agora.' : REFUSED_TEXT.TABLE_UNAVAILABLE)
      //  sem tabela: 'Consultando o catálogo' | 'Consultou o catálogo', detalhe `${n} tabelas` ('1 tabela')
      //  com tabela: `Vendo ${table}` | `Viu ${table}`, detalhe rowsText da amostra: '5 linhas, há mais' quando more
      function presentQuery(tool, status): Presented
      //  enquanto roda, sem resultado: 'Consultando os dados' (a tabela só se sabe pelo resultado)
      //  feita: tabelas = origin[].table; `Consultou ${tabelas.join(', ')}`, detalhe '1 linha' | 'n linhas' | ', há mais'
      //  origem vazia: 'Consultou os dados'
      function dataRefusal(result: unknown): Refusal | undefined   // Refused.safeParse(result).success ? 'SAID' : undefined

      export const DATA_SPECS: Record<(typeof DATA_TOOL)[keyof typeof DATA_TOOL], ToolSpec> = {
        [DATA_TOOL.describe]: { ...da 3.1, present: presentDescribe, refusal: dataRefusal },
        [DATA_TOOL.query]: { ...da 3.1, body: 'query', present: presentQuery, refusal: dataRefusal },
      }
      // tool-spec.ts: ToolBody ganha 'query'
      // tool-row.tsx, Block: case 'query' ->
      //   <pre className={BLOCK}>{shown(stringArg(tool.args, 'sql') ?? '')}</pre>
      //   <Button variant="ghost" size="sm" onClick={copyQuery}>Copiar a consulta</Button>
      //   copyQuery = () => navigator.clipboard.writeText(sql).then(
      //     () => setCopied('DONE'), (cause) => { console.error('QUERY_NOT_COPIED', cause); setCopied('FAILED') })
      //   'DONE' -> o botão diz 'Consulta copiada'; 'FAILED' -> o texto de `L4` ao lado
      ```
      Telas que esta unidade constrói: `p3-02` (as linhas e o corpo), `p3-06` (a linha diz "Não conseguiu ler a tabela agora.") e `p3-07` (as mesmas linhas no `BUILDER_ROOM`, `apps/web/src/builder/conversation/room.ts:80`). Peças de `apps/web/src/ui/`: `button.tsx`, e o `trace.tsx` que `ToolLine` já usa. A linha nasce recolhida como toda linha (`ToolRow`, `tool-row.tsx:370`).
    - **Testes:** `apps/web/src/builder/conversation/data-specs.test.tsx` (novo), com as partes do cenário `data-query` lidas por `recordedPart('data-query', DataPart, ...)` (4.1). Um teste troca só o `result` da parte gravada para a recusa que prova, como `source()` troca o endereço em `apps/web/src/builder/conversation/sources.test.tsx:20-30`. Casos: "o catálogo: Consultou o catálogo, 7 tabelas" (a contagem que o cenário gravou); "a amostra: Viu sankhya_vendas, 5 linhas, há mais"; "rodando: Consultando os dados"; "a consulta: Consultou sankhya_vendas, 1 linha"; "aberta, a linha mostra a consulta e Copiar a consulta põe o texto na área de transferência" (`navigator.clipboard.writeText` espionado com `vi.spyOn`); "cada recusa diz o seu texto" (`test.each` sobre `REFUSED_TEXT`); "um resultado fora do esquema dá a linha genérica" ("Consultou os dados", sem detalhe); "na sala do Builder, as mesmas linhas" (`BUILDER_ROOM`). O caso de `tool-row.test.tsx:185-215` continua passando.
    - **Mutações à mão:** (a) troque `more` por `false` em `presentDescribe`: "a amostra" falha. (b) Tire `NOT_IN_ROLE` de `REFUSED_TEXT` (a linha cai em `failed`): "cada recusa" falha. (c) Tire o `onClick`: "Copiar a consulta" falha.
    - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/conversation/data-specs.test.tsx src/builder/conversation/tool-row.test.tsx` passa, e a linha aberta mostra a consulta gravada com o botão **Copiar a consulta**.
    - _Requisitos: 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 5.7_
  - [ ] 4.3 O bloco Fontes com a origem do dado e a leitura ao vivo (um commit; telas `p3-01`, `p3-04`, `p3-05`)
    - **Arquivos:** `apps/web/src/builder/conversation/sources.ts`, `apps/web/src/builder/conversation/sources.tsx`, `apps/web/src/builder/conversation/sources.test.tsx`, `apps/web/sources.layout.test.ts`.
    - **Referência a seguir:** `sourcesOf` e `sourceOf` em `apps/web/src/builder/conversation/sources.ts:26-46`; `fromParts` em `rows.ts:248-265`; `Sources` em `sources.tsx:4-34`; as palavras do conector, `words.name(connector)` (`apps/web/src/builder/conversation/connector-specs.ts:134-138`); `dayGroupOf` e `clockOf` em `apps/web/src/platform/dates.ts:12-14`, `:48-53`.
    - **O que sai:** `MessageSource` de hoje (`sources.ts:8-13`) vira o caso `web` da união. Nenhum chamador lê os campos sem passar pelo `kind` depois desta unidade.
    - **O que entra:**
      ```ts
      // apps/web/src/builder/conversation/sources.ts
      export type MessageSource =
        | { kind: 'web'; url: string; title: string | undefined; domain: string; linked: boolean }
        | { kind: 'data'; connector: string; system: string; table: string; at: string | null;
            state: 'FRESH' | 'PARTIAL' | 'STOPPED' | 'LIVE' }
      const DataOrigin = z.looseObject({ system: z.string(), connector: z.string(), table: z.string(),
        copiedAt: z.iso.datetime().nullable(), lastRun: z.enum(['COMPLETE', 'PARTIAL', 'ERROR', 'INTERRUPTED', 'NONE']) })
      const DataResult = z.union([
        z.looseObject({ kind: z.literal('ROWS'), origin: z.array(DataOrigin) }),
        z.looseObject({ kind: z.literal('TABLE'), origin: DataOrigin }),
      ])
      const LiveResult = ReadCut.extend({ at: z.iso.datetime() })   // de @conexus/hub-api
      export function sourcesOf(parts: readonly MastraMessagePart[]): MessageSource[]
      //  as de web como hoje, com kind: 'web'
      //  cada parte 'tool-invocation' com state 'result':
      //    toolName data_query ou data_describe com args.table -> DataResult.safeParse(result); cada origem ->
      //      { kind: 'data', connector, system, table, at: copiedAt,
      //        state: COMPLETE->FRESH, PARTIAL->PARTIAL, ERROR|INTERRUPTED|NONE->STOPPED }
      //    toolName connector_read, ou um nome `<conector>_<operação>` -> LiveResult.safeParse(result) ->
      //      { kind: 'data', connector: o conector (o nome antes do primeiro _, ou o da conexão em args),
      //        system: args.connection, table: args.operation, at, state: 'LIVE' }
      //    resultado fora do esquema -> nenhuma fonte (critério 4.10)
      //  sem repetir: a chave de dado é `${connector}:${system}:${table}`, a de web a url
      // rows.ts não muda: fromParts já chama sourcesOf(message.parts) (:262)

      // apps/web/src/builder/conversation/sources.tsx
      //  kind 'web' como hoje; kind 'data': <li> com `${words.name(connector)} · ${table} · ${quando}` em text-fact,
      //  as palavras por useRoom().connectors (room.ts)
      //  quando: FRESH 'copiado hoje às 08:45' | PARTIAL 'rodada parcial, copiado hoje às 08:45'
      //          STOPPED 'parada, copiado hoje às 08:45' | LIVE 'lido agora, às 10:02' | at nulo 'ainda sem cópia'
      //  'hoje' / 'ontem' / 'em 17/10/2026' por dayGroupOf(at, new Date()) e dayOf; a hora por clockOf(at)
      //  key: a chave de sourcesOf
      ```
      Telas que esta unidade constrói: `p3-01` (a fonte com conector, tabela e hora), `p3-04` (rodada parcial ou parada) e `p3-05` (lido agora). Peças: o `Sources` de hoje, sem peça nova de `apps/web/src/ui/`.
    - **Testes:** `apps/web/src/builder/conversation/sources.test.tsx` ganha, com as partes de `recordedPart('data-query', DataPart)` e as de `reads` regravadas na 4.1 para a leitura ao vivo:
      - "a fonte do dado: Sankhya · sankhya_vendas · copiado hoje às 08:45" (o relógio do teste fixo com `vi.setSystemTime` no dia da cópia gravada);
      - "a rodada parcial diz rodada parcial";
      - "a rodada com erro diz parada";
      - "a mesma tabela lida duas vezes aparece uma vez";
      - "a fonte da leitura ao vivo diz lido agora, às" com a hora do `at` gravado;
      - "um resultado fora do esquema não vira fonte";
      - o caso de web de hoje (`:44-60`) com `kind: 'web'`.
      `apps/web/sources.layout.test.ts` ganha a fonte de dado a 390 px sem passar da largura (testing T23).
    - **Mutações à mão:** (a) mapeie `PARTIAL` para `FRESH`: "a rodada parcial" falha. (b) Tire a chave de dado do conjunto que evita repetir: "a mesma tabela" falha. (c) Use `system` no lugar de `words.name(connector)`: "a fonte do dado" falha.
    - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/conversation/sources.test.tsx` e `npm run test:browser -w @conexus/web` (que roda `sources.layout.test.ts`) passam.
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.10_
  - [ ] 4.4 Ponto de conferência do grupo 4
    - Rode `apps/server/src/builder/assistant/assistant.scorecard.test.ts`, `apps/server/src/builder/connectors/connector-tools-scope.test.ts` e `apps/server/src/platform/recordings.test.ts` no comando do servidor; `npm run test:unit -w @conexus/web -- src/builder/conversation/data-specs.test.tsx src/builder/conversation/sources.test.tsx src/builder/conversation/tool-row.test.tsx`; `npm run test:browser -w @conexus/web`. Depois `npm run check` e `npm run quality` inteiro em segundo plano.
    - Passos 6 e 7 da skill `conexus-build`: a tela olhada num navegador real a 1366 e 390 px, nos dois temas, com o Hub local e os dublês (testing T23): a resposta com fonte, a linha aberta, uma recusa. pstack `deslop` e `no-comments`, as mutações das três unidades com o resultado (testing T27), `npm run check` verde antes de cada commit.
    - Linha da tabela de referência no PR: "A origem até a tela | `sources.ts:8-24`, `tool-registry.ts:244` | o resultado da ferramenta, que o Mastra guarda; `writer.custom` não chega vivo sob o controlador | nativo".
    - A CI roda `npm run check`, os pedaços do servidor e `npm test -w @conexus/web` (unit, browser e sweep).
  - [ ] 4.5 QA das telas `p3-01` a `p3-07` (não é commit)
    - Um agente que não construiu roda a skill `conexus-qa` no commit candidato do grupo 4 (testing T25): o Hub local com os dublês, o roteiro "Quanto vendi em outubro?" como dono, a matriz de estados do escopo (vazio, carregando, erro, recusa, não achou, atrasado), a 1366 e 390 px, nos dois temas. O relatório vai no PR do grupo 4 antes da revisão.

- [ ] 5. Grupo 5: a conformidade aceita um mundo assíncrono (um PR só da conformidade: exceção registrada à regra de duas ou três unidades, porque a mudança de conformidade vai sozinha, `docs/steps/trilhas/dados.md:72-78`; pode esperar a parte 5) (entra depois da unidade 6.1 da parte 4)
  - [ ] 5.1 `runDataConformance` com `make(t)` assíncrono (um commit)
    - **Arquivos:** `packages/hub-api/src/company-data-conformance.ts`.
    - **Referência a seguir:** `runDataConformance` em `packages/hub-api/src/company-data-conformance.ts:305-313`; `copiesOn(t)` em `apps/server/src/hub/copies/test-copies.ts:137` (assíncrona, pede `t`), o motivo da mudança.
    - **O que sai:** a assinatura `make: () => DataWorld`.
    - **O que entra:**
      ```ts
      import type { TestContext } from 'node:test'
      /** What every implementation of the data track's sources passes against its fake connector, with no network. */
      export function runDataConformance(
        name: string,
        make: (t: TestContext) => DataWorld | Promise<DataWorld>,
      ): void {
        describe(name, () => {
          for (const [law, run] of LAWS)
            it(law, async (t) => {
              const world = await make(t)
              await run(world, companyData({ sources: world.sources, now: () => AT }))
            })
        })
      }
      ```
      `fakeWorld` (`packages/hub-api/src/company-data.test.ts:102-144`) não muda: uma função síncrona sem parâmetro cabe no tipo novo.
    - **Testes:** `packages/hub-api/src/company-data.test.ts` roda as 19 leis como antes. Um caso novo, "a conformidade espera o mundo assíncrono e passa o TestContext", chama `runDataConformance` com `async (t) => { made.push(t); return fakeWorld() }` e confere, num `after`, que `made` tem um `TestContext` por lei.
    - **Mutações à mão:** (a) tire o `await` de `make(t)`: as leis do caso novo falham (o mundo é uma promessa). (b) Chame `make()` sem `t`: o caso novo falha.
    - **Pronto quando:** `npm test -w @conexus/hub-api` passa com as 19 leis e o caso novo.
    - _Requisitos: 7.1_
  - [ ] 5.2 Ponto de conferência do grupo 5
    - Rode `npm test -w @conexus/hub-api`, `npm run typecheck` e `npm run check`; `npm run quality` inteiro em segundo plano.
    - Passos 6 e 7 da skill `conexus-build`: pstack `deslop` e `no-comments`, as duas mutações da 5.1 com o resultado (testing T27).
    - Linha da tabela de referência no PR: "A conformidade com mundo assíncrono | `company-data-conformance.ts:305-313` | `node:test`, `TestContext` | nativo".
    - A CI roda `npm run check` e os testes de todos os pacotes. O PR muda só a conformidade.

- [ ] 6. Grupo 6: a lista de migração e a conformidade inteira (um PR; pode esperar a parte 5) (entra depois da unidade 6.1 da parte 4, que dá ao catálogo a tabela retida)
  - [ ] 6.1 O teste que impede a lista de crescer (um commit)
    - **Arquivos:** `scripts/rules-doors.test.ts`. `.dependency-cruiser.cjs` e `apps/server/src/builder/app-data/context.ts` não mudam (decisão `L2`).
    - **Referência a seguir:** `scripts/rules-doors.test.ts:44-85` (o diretório plantado e as asserções); `SERVER` em `.dependency-cruiser.cjs:4`, `CONTRACT_MIGRATION` em `:22-56` (os nomes curtos em `:24-53`, o mapeamento em `:55` e o caminho de `packages/app` em `:56`) e a regra em `:100-110`, com `pathNot` em `:107`.
    - **O que sai:** nada.
    - **O que entra:**
      ```ts
      // scripts/rules-doors.test.ts
      import { createRequire } from 'node:module'
      /** A lista de hoje, que só diminui: um nome a menos passa e atualiza esta lista no mesmo commit. */
      const MIGRATION_TODAY = ['agents/agent', /* ...os 30 nomes curtos de .dependency-cruiser.cjs:24-53... */ 'tools/check']
        .map((file) => `^apps/server/src/builder/${file}\\.ts$`)       // o mesmo mapeamento de :55
        .concat('^packages/app/src/connectors\\.ts$')                    // :56
      function grown(listed: readonly string[]): string[] {
        return listed.filter((one) => !MIGRATION_TODAY.includes(one))
      }
      test('a lista de migração do contrato não cresce', () => {
        const config = createRequire(import.meta.url)(join(ROOT, '.dependency-cruiser.cjs'))
        const rule = config.forbidden.find((one) => one.name === 'agents-and-apps-reach-data-only-through-the-contract')
        const listed = rule.from.pathNot.slice(2)        // os dois primeiros são os testes e TEST_HELPER (:107)
        assert.deepEqual(grown(listed), [])
      })
      ```
    - **Testes:** `scripts/rules-doors.test.ts` ganha "a lista de migração do contrato não cresce"; "um nome novo na lista falha", que chama `grown([...MIGRATION_TODAY, '^apps/server/src/builder/app-data/check\\.ts$'])` e espera esse nome de volta; e "nenhum caminho de builder/data-tools/ está na lista".
    - **Mutações à mão:** (a) acrescente `'app-data/check'` a `CONTRACT_MIGRATION`: "não cresce" falha. (b) Acrescente `'data-tools/tools'`: "não cresce" e o terceiro caso falham.
    - **Pronto quando:** `node scripts/test-run.ts --test-timeout=120000 --test-reporter=./scripts/test-reporter.ts scripts/rules-doors.test.ts` e `npm run deps` passam.
    - _Requisitos: 6.1, 6.2, 6.3_
  - [ ] 6.2 `live`, `funnel`, o turno preso e `runDataConformance` contra a implementação real (um commit)
    - **Arquivos:** `apps/server/src/hub/data/live.ts` (novo), `apps/server/src/hub/data/funnel.ts` (novo), `apps/server/src/hub/data/public.ts`, `apps/server/src/hub/data/conformance.test.ts` (novo).
    - **Referência a seguir:** `AssistantConnectors.read` (`apps/server/src/hub/connectors/assistant-port.ts:56-66`, implementação `:307-332`) e `write` (`:68`, `:334-336`); `WriteRequest` e `Written` (`apps/server/src/hub/connectors/write-record.ts:32-62`); `Speaker` importado de `../identity/public.ts` em `write-record.ts:16`; `TurnKey` exportado em `apps/server/src/hub/connectors/public.ts:62`; `fixturesOf` em `packages/hub-api/src/company-data-conformance.ts:58-75`; o mundo falso `fakeWorld` (`packages/hub-api/src/company-data.test.ts:102-144`) como forma do mundo real; `plantedBy` em `apps/server/src/hub/copies/test-sources.ts:212-242` (como plantar uma cópia v2).
    - **O que sai:** as linhas `NOT_GRANTED` fixas de `live` e `funnel` em `sourcesFor`. A assinatura de `createCompanyData` não muda: a 2.1 já a pôs com `context?: { by?: ReadBy; turn?: TurnBinding }`. O mundo real nasce com o que a parte 4 pede a `DataWorld`: Bruno, no papel Vendas, perguntando no lugar `COMPANY`, e `withheld: { table: 'sankhya_clientes', query: 'select 1 from sync.sankhya_clientes' }` (parte 4, unidade 5.1). Nenhuma lei pula.
    - **O que entra:**
      ```ts
      // apps/server/src/hub/data/public.ts, em sourcesFor(deps, scope, context) da 2.1:
      //  const turn = context?.turn
      //  live:   turn === undefined ? async () => ({ kind: 'NOT_GRANTED' }) : (a) => liveOf(deps, scope, turn, a)
      //  funnel: turn === undefined ? async () => ({ kind: 'NOT_GRANTED' }) : (a) => funnelOf(deps, scope, turn, a)
      //  context.by continua sem leitor nesta parte
      // DataDeps.connectors passa a Pick<Connectors, 'catalogSystems' | 'assistant'>
      // os consumidores do grupo 3 passam só { by } e continuam valendo

      // apps/server/src/hub/data/live.ts
      export async function liveOf(deps, scope, turn: TurnBinding, a: { connection, operation, input, signal? }): Promise<LiveAnswer>
      //  const answered = await deps.connectors().assistant.read(scope,
      //    { connectionId: a.connection, turn: turn.turn, operation: a.operation, input: a.input, signal: a.signal })
      //  switch (answered.kind):
      //    'OK' -> { kind: 'OK', value: answered.whole, ...(answered.empty === true ? { empty: true } : {}) }
      //    'NOT_IN_ROLE' -> { kind: 'NOT_IN_ROLE' }          // tira role e operation
      //    'REFUSED' | 'AUTH_REFUSED' | 'TOKEN_EXPIRED' | 'UNREADABLE' -> { kind, native }
      //    'BUSY' -> { kind, waitMs }; 'UNREACHABLE' | 'DEADLINE' | 'NOT_GRANTED' | 'CALLS_SPENT' -> { kind }
      //    default: answered satisfies never
      // apps/server/src/hub/data/funnel.ts
      export async function funnelOf(deps, scope, turn: TurnBinding, a: ActRequest & Signal)
      //  deps.connectors().assistant.write({ scope, connectionId: a.connection, operation: a.operation, input: a.input,
      //    threadId: a.call.thread, toolCallId: a.call.toolCall, ...turn, signal: a.signal })   // turn, speaker e, numa versão, agentId e number
      //  'WRITE_OPEN' -> { ...answer, since: answer.since.toISOString() }; os outros kinds, com o seu par; satisfies never
      ```
      O construtor confere cada `kind` de `AssistantRead` e de `Written | Spent` contra a união do contrato: o `switch` só compila se cada um tiver par.
    - **Testes:** `apps/server/src/hub/data/conformance.test.ts` (novo): `runDataConformance('as fontes do Hub sobre o dublê do Sankhya', realWorld)`, com a assinatura da 5.1. `realWorld(t)` é assíncrona e monta sobre `copiesOn(t)` (`apps/server/src/hub/copies/test-copies.ts:137-204`):
      - O que o mundo liga para `fixturesOf` e para as leis (`packages/hub-api/src/company-data-conformance.ts:58-81`, `:113-125`, `:134-147`, `:175-185`):
        1. `copiesOn(t, { ...TEST_TUNING, runPages: 2 })`, e a cópia `vendas`, v1 `QUERY`, ligada e rodada (`on.enable('vendas')`, `on.run`): o teto de páginas a deixa `PARTIAL` (`CAP`), como `apps/server/src/hub/copies/run.test.ts:118-122`. `describesSystemsAndTables` pede uma tabela com a última rodada `PARTIAL` (`:124`).
        2. Uma cópia v2 de uma leitura com entrada fixa, sobre `pedidos` do Sankhya (`packages/connectors/src/sankhya/operations/vendas.ts:16-29`), com `input: { codigoEmpresa: <a Matriz do dublê>, confirmada: true }`, plantada no molde de `plantedBy` com `connector_id = 'sankhya'` e a conexão da Matriz (`on.connectionId`).
        3. Uma cópia v2 de uma leitura com entrada vazia, para `readsTheCopyWithoutInput` (`:134-147`): `empresas` (`packages/connectors/src/sankhya/operations/cadastros.ts:7-15`), que só pede `page`, e a página é do motor; `input: {}`, plantada do mesmo jeito na Matriz.
        4. Uma segunda conexão Sankhya `ACTIVE` na empresa de Ana, para `readsLiveAnotherConnection` (`:175-185`): `linkSankhya(on.hub, on.ana, on.connections, on.fake.credential, undefined, 'Filial')` e `testOf` (`apps/server/src/hub/connectors/test-connections.ts:162-170`, molde `apps/server/src/builder/conversation/conversation-connectors.test.ts:43-48`). Ela declara a mesma leitura `pedidos`, e nenhuma cópia a lê.
        5. A leitura que nenhuma cópia serve é `notasFiscais` (`vendas.ts:31`), e a ação é `lancarPedido` (`vendas.ts:181-183`); o sistema Sankhya já declara as duas.
        O catálogo do lugar `COMPANY` de Ana traz as duas conexões e as três cópias.
      - `queries.reads = 'select count(*) from sync.sankhya_vendas'`, `queries.outside` sobre uma tabela plantada em `sync` (`asSync`, `:249`), `queries.refused = 'select nao_existe from sync.sankhya_vendas'`.
      - As fontes: `sourcesFor(wrappedDeps, scope, { turn })`, com `turn` de um turno da conversa de teste e o `speaker` de Ana. `reached` e `gave` são registrados por um embrulho de cada fonte que `sourcesFor` devolve.
      - `down('catalog')`: `wrappedDeps.database` embrulha o banco do Hub, e o seu `read` lança `new Failure('DATABASE_UNAVAILABLE')` depois do `down`; `catalogOf` (parte 1) o traduz em `CATALOG_UNAVAILABLE`. `down('rows')` e `down('query')`: `wrappedDeps.copies().tableRows` e `wrappedDeps.companyPostgres.readCopies` passam a devolver a resposta `UNAVAILABLE` da parte 1.
    - **Mutações à mão:** (a) em `liveOf`, troque `answered.whole` por `answered.value`: a lei 7 ("com o valor do sistema") falha. (b) Em `sourcesFor`, ignore `turn` e devolva `NOT_GRANTED` em `live`: as leis de leitura ao vivo falham. (c) Em `queryOf`, devolva as linhas antes da checagem do catálogo: a nova 2 ("não devolve linha nenhuma") falha.
    - **Pronto quando:** `apps/server/src/hub/data/conformance.test.ts` passa no comando do servidor, com as 19 leis.
    - _Requisitos: 7.1, 7.2, 7.3_
  - [ ] 6.3 Ponto de conferência do grupo 6
    - Rode `scripts/rules-doors.test.ts`, `apps/server/src/hub/data/conformance.test.ts`, `apps/server/src/hub/data/query.test.ts` e o `data.test.ts` da parte 1; depois `npm run deps`, `npm run check` e `npm run quality` inteiro em segundo plano.
    - Passos 6 e 7 da skill `conexus-build`: pstack `deslop` e `no-comments`, as mutações das duas unidades com o resultado (testing T27), `npm run check` verde antes de cada commit.
    - Linhas da tabela de referência no PR: "A lista que só diminui | `.dependency-cruiser.cjs:22` | nenhuma | remendo pequeno: um teste" e "`live` e `funnel` | `assistant-port.ts:56`, `:68` | nenhuma | embrulhado".
    - A CI roda `npm run check` (com `npm run deps` e `npm run test:scripts`) e os pedaços do servidor.

## Notas

- **`L1`, decidida. A escrita volta como `NOT_IN_ROLE`.** Medido pelo redator num PostgreSQL 17.10 descartável (o banco das empresas é o 18, e a unidade 2.1 prova no teste), como um login que só tem `SELECT` em `sync` e numa transação só de leitura: `EXPLAIN (VERBOSE, FORMAT JSON)` de `INSERT`, `UPDATE` ou `DELETE` falha com `42501`, porque o `EXPLAIN` confere a permissão antes de rodar. A resposta segue o código do banco, sem leitor de SQL nosso: `42501` é `NOT_IN_ROLE`; `CREATE` e mais de uma instrução são `QUERY_REFUSED` com `42601`. Nada é escrito em nenhum caso. A frase ao modelo de `NOT_IN_ROLE` em `data_query` é a do `design.md`, `C3`. A frase da tela não muda.
- **`L2`, decidida. `context.ts` fica na lista nesta parte.** O bloco "## Data" usa `mode`, `accounts`, `proposedHere`, `unreleased` e `proposals` (`apps/server/src/hub/copies/project-view.ts:22-42`), e o `Catalog` não tem nenhum deles. O arquivo sai da lista com `connectors/copy-propose`, numa spec futura. Os arquivos fora da lista desta parte são os de `builder/data-tools/`, que nascem fora dela. A 3.2 só troca uma frase de `HOW_TO_READ`.
- **`L3`, decidida. O turno e quem fala vêm do turno preso.** `assistant.read` pede `turn: TurnKey` (`assistant-port.ts:56-66`), e `assistant.write` pede `turn` e `speaker` (`write-record.ts:32-45`). A assinatura é uma só nas partes 3 e 4: `createCompanyData(deps)(scope, context?: { by?: ReadBy; turn?: TurnBinding })`, posta na 2.1. O contrato não muda. Sem `turn`, `live` e `funnel` respondem `NOT_GRANTED`. `ReadBy` é da parte 4 (o Registro de dados); aqui as ferramentas o passam e ninguém o lê.
- **`L4`. Textos que o escopo não deu.** A falha de **Copiar a consulta** (proposta: "Não deu para copiar. Selecione a consulta e copie."), a fonte de uma tabela sem rodada ("ainda sem cópia"), a hora de outro dia ("copiado ontem às", "copiado em 17/10/2026 às"), o nome da fonte ao vivo (o conector e a conexão, "Sankhya · Matriz", como a linha de hoje), e o estado vazio do escopo ("Ainda não há sistema ligado. Ligue um em Integrações.", que o desenho não dá a nenhuma peça). O construtor usa as propostas e o PR as lista para a palavra do fundador.
- **Bruno no Início.** Nesta parte o Catálogo do Início só lista tabelas para dono e administrador (parte 1). A pergunta do escopo "Bruno, no Início" roda aqui com o dono. Bruno, membro, recebe o Catálogo vazio até a parte 4.
- **Os grupos de contrato e as trilhas.** O grupo 1 leva só o contrato e a conformidade, mais a linha provisória declarada no corpo do PR, como `D19`. A fonte `query` é da trilha Dados e vai sozinha no grupo 2. Os consumidores vão no grupo 3 (`docs/steps/trilhas/dados.md:78`). A mudança de `runDataConformance` é de conformidade e vai sozinha no grupo 5, antes do mundo real do grupo 6.
- **A linha mínima de tela no grupo 3.** Pôr `DATA_TOOL` em `BUILDER_TOOL` faz `TOOLS` exigir as duas linhas (`tool-registry.ts:47`, tipo `Record<RowTool, ToolSpec>`), e o caso de `tool-row.test.tsx:185` exige frase para todo nome de `CLOSED_TOOLS`. Por isso a 3.1 traz a linha mínima e a 4.2 a completa. Pelo mesmo motivo a 3.1 põe os nomes em `READ`.
- **A coluna `_pass`.** A consulta tira `_pass` do resultado, como `askApp` já faz para o agente (`apps/server/src/hub/apps/app-database.ts:223-233`, critério 34 da Capacidade 3).
- **O Sankhya real.** Nenhum teste da CI lê o Sankhya real. A leitura dele acontece só no uso de fechamento do fundador (delivery L17), com a cópia `vendas` ligada na empresa dele.

## Grafo de dependência das tarefas

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1", "5.1"] },
    { "id": 4, "tasks": ["2.2", "5.2"] },
    { "id": 5, "tasks": ["3.1"] },
    { "id": 6, "tasks": ["3.2"] },
    { "id": 7, "tasks": ["3.3"] },
    { "id": 8, "tasks": ["4.1", "6.1", "6.2"] },
    { "id": 9, "tasks": ["4.2", "4.3", "6.3"] },
    { "id": 10, "tasks": ["4.4"] },
    { "id": 11, "tasks": ["4.5"] }
  ]
}
```
