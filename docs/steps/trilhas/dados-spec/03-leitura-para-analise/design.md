# Documento de desenho: parte 3, a leitura para análise

> Os grupos 3 e 4 desta parte foram construídos pelo cartão A pergunta respondida com a origem, fechado em 2026-11-16, e o que ele decidiu vale sobre este texto. Uma tabela cuja conexão não está em `systems` é lida, e a origem vem do registro gravado da cópia, com o estado da conexão (`NAMED` ou `NOT_GIVEN`): onde esta parte manda responder `CATALOG_UNAVAILABLE` e registrar `DATA_ORIGIN_UNREAD` nesse caso, o texto está superado (a emenda de 2026-11-15, "1. A"). O registro do cartão está em [aprovações](../../../../approvals/a-pergunta-respondida-com-a-origem.md).

Base: `main` do Conexus em `0d4c5730`. Todo caminho é relativo à raiz do repositório. Depende da parte 1: o catálogo, o login `conexus_read` e `readCopies`. Os rótulos de prova são os do escopo.

## Visão geral

No fim desta parte a pessoa pergunta ao Assistente quanto vendeu no mês. Ele descreve o catálogo, vê 5 linhas da tabela, consulta com uma consulta só de leitura e responde com o sistema, a tabela e a hora da cópia. É o marco `D2` [visto, `docs/roadmap.md:46`]. O Builder e um agente salvo usam as mesmas duas ferramentas.

| O que entra | Onde |
| --- | --- |
| O pedido de consulta no contrato | `packages/hub-api/src/company-data.ts`, `company-data-conformance.ts` |
| `DataSources.query` | `apps/server/src/hub/data/query.ts` |
| As duas ferramentas, `data_describe` e `data_query` | pasta nova `apps/server/src/builder/data-tools/` |
| A ordem do agente, escrita uma vez | `apps/server/src/builder/data-tools/order.ts` |
| A origem até a tela, no bloco Fontes | `apps/web/src/builder/conversation/` |
| Os arquivos de `builder/data-tools/`, que nascem fora da lista de migração, e o teste que impede a lista de crescer | `apps/server/src/builder/data-tools/`, `.dependency-cruiser.cjs`, `scripts/rules-doors.test.ts` |
| `DataSources.live` e `DataSources.funnel`, e a conformidade inteira contra a implementação real | `apps/server/src/hub/data/` |

O que fica de fora: a leitura por conceito (`concept_read`, parte 5 e marco `D4`), a busca por significado (decisão 0065), uma ferramenta separada de gerar SQL, a porta para agentes de fora (parte 8), e a mudança das leituras tipadas ao vivo para o contrato, que sai com o marco `D4`.

## Arquitetura

```
 Assistente            Builder             agente salvo
 assistant.ts:239      builder.ts:145      agent.ts:280
      └────────────┬───────┴──────────┬────────┘
                   ▼                  ▼
        builder/data-tools: data_describe, data_query   (só importa @conexus/hub-api)
                   │  CompanyData já preso a quem pergunta e onde
                   ▼
        packages/hub-api: companyData()  describe | read TABLE | read QUERY
                   ▼
        hub/data: catalog()  rows()  query()            (parte 1 + esta)
                   │                    │
        banco do Hub (catálogo)     banco da empresa, como o login de leitura
                                    EXPLAIN (VERBOSE, FORMAT JSON) + a consulta,
                                    uma transação só de leitura
```

O resultado da ferramenta leva a origem. A tela lê a origem do resultado guardado e a mostra no bloco **Fontes**.

A regra do verificador de dependências continua valendo: as ferramentas dos agentes só importam o contrato [visto, `.dependency-cruiser.cjs:101-110`]. A pasta nova `builder/data-tools/` entra na constante `AGENTS_AND_APPS` [visto, `.dependency-cruiser.cjs:21`] e não entra na lista de migração.

### O que cada referência faz no mesmo ponto

| Ponto | Referência | O que a spec faz |
| --- | --- | --- |
| Duas ferramentas: inspecionar e executar | O modelo oficial de agente SQL do Mastra [visto, o modelo oficial de agente SQL do Mastra 1.82, `introspect-database.ts:7-54` e `execute-sql.ts:14-44`] | Igual. Diferente: o modelo do Mastra filtra a consulta por expressão regular e lança `Error`. Aqui quem recusa é o banco, e a ferramenta devolve a recusa tipada |
| A amostra antes da consulta | Um agente que não olha o dado erra o nome do campo, e uma amostra de 5 linhas evita isso | Igual: descrever uma tabela devolve as colunas e 5 linhas |
| "Não achei" é resposta | Uma não resposta é mensagem, e não erro | Igual: a ordem do agente diz isso |
| Tabelas usadas e a consulta a um clique | Uma resposta que mostra as tabelas usadas e a consulta | Igual. A hora da cópia na resposta é [ideia nossa] |
| A ferramenta como função da requisição | `tools` dinâmico do Mastra [visto, `node_modules/@mastra/core/dist/agent/types.d.ts:675`] | Já é o que os três agentes fazem [visto, `apps/server/src/builder/assistant/assistant.ts:235-250`] |

## Componentes e interfaces

### `C1`. O pedido de consulta no contrato

Hoje o verbo ler não tem filtro, colunas, limite nem SQL [visto, `packages/hub-api/src/company-data.ts:66-75`]. A mudança passa pela issue `contrato`: um PR que muda só o contrato e a conformidade [visto, `docs/steps/trilhas/dados.md:72-78`].

```ts
// packages/hub-api/src/company-data.ts
export const QUERY_ROWS = 200
export const QUERY_SQL_MAX = 4000   // o mesmo teto de app_data_read (apps/server/src/builder/app-data/tools.ts:12)

export const ReadRequest = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('TABLE'), table: z.string() }),
  z.object({ kind: z.literal('OPERATION'), connection: ConnectionId, operation: OperationId, input: z.unknown() }),
  /** Uma consulta só de leitura sobre as tabelas do catálogo. Quem recusa é o banco. */
  z.object({ kind: z.literal('QUERY'), sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
])

// ReadAnswer ganha:
z.object({
  kind: z.literal('QUERY'),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
  /** Falso quando a consulta trouxe mais linhas que QUERY_ROWS. */
  complete: z.boolean(),
  /** As tabelas do catálogo que a consulta leu, cada uma com quem a guarda e a última rodada. */
  tables: z.array(z.object({ table: z.string(), kept: TableKept })),
}),
/** O banco recusou a consulta: erro de sintaxe, coluna que não existe, mais de uma instrução. O SQLSTATE vai inteiro. */
z.object({ kind: z.literal('QUERY_REFUSED'), sqlstate: z.string().regex(/^[0-9A-Z]{5}$/) }),
z.object({ kind: z.literal('QUERY_TOO_LARGE') }),

// O que a fonte de consulta devolve, exportado: o servidor anota queryOf com ele.
// NOT_IN_ROLE e DEADLINE estão em membros com enum (company-data.ts:85-86), e Extract daria never para eles.
export type QueryPage =
  | Readonly<{ kind: 'ROWS'; columns: string[]; rows: unknown[][]; complete: boolean; used: readonly string[] }>
  | Extract<ReadAnswer, { kind: 'QUERY_REFUSED' | 'QUERY_TOO_LARGE' | 'TABLE_UNAVAILABLE' }>
  | Readonly<{ kind: 'NOT_IN_ROLE' }>
  | Readonly<{ kind: 'DEADLINE' }>

// DataSources ganha:
/** A consulta como o login de leitura de quem pergunta, e os nomes das tabelas que ela leu. */
query(a: Signal & Readonly<{ sql: string }>): Promise<QueryPage>
```

Na conformidade, `Gave<K extends 'rows' | 'live' | 'funnel'>` [visto, `packages/hub-api/src/company-data-conformance.ts:15`] ganha `'query'`.

`companyData().read` ganha o caso `QUERY`:

```ts
case 'QUERY': {
  const answered = await sources.query({ sql: request.sql, signal })
  if (answered.kind !== 'ROWS') return answered
  const tables = answered.used.map((name) => catalog.tables.find((t) => t.name === name))
  // Uma tabela lida que não está no catálogo de quem pergunta: o contrato não devolve as linhas.
  if (tables.some((t) => t === undefined)) return NOT_IN_CATALOG
  return { kind: 'QUERY', columns, rows, complete, tables: tables.map((t) => ({ table: t.name, kept: t.kept })) }
}
```

Leis novas na conformidade, cada uma com o caso recusado [visto, `packages/hub-api/src/company-data-conformance.ts:260-302` para a forma]:

1. Uma consulta devolve as linhas com cada tabela lida e quem a guarda.
2. Uma consulta que leu uma tabela fora do catálogo não devolve linha nenhuma.
3. A recusa do banco volta inteira, com o SQLSTATE, e nada é lido ao vivo no lugar.
4. Sem catálogo, a consulta não chega ao banco.
5. O sinal de cancelamento chega à consulta.

### `C2`. `DataSources.query`

```ts
// apps/server/src/hub/data/public.ts: DataDeps (parte 1) ganha o que a consulta usa, e a ligação
// `const data = createCompanyData(...)` que a parte 1 já faz em main.ts e no test-hub passa a entregá-los:
//   projects: ProjectPorts (readyDatabaseOf), companyPostgres: CompanyPostgres, neon: NeonProjects (ownerConnection), os mesmos tipos de `apps/server/src/hub/copies/store.ts:92-94`
// personScope (apps/server/src/hub/copies/store.ts:112) não sai pelo public.ts de hub/copies:
// queryOf monta o mesmo escopo `{ kind: 'COMPANY', companyId, personId }` por conta própria.

// apps/server/src/hub/data/query.ts
export async function queryOf(deps, scope, { sql, signal }): Promise<QueryPage>
//  1. numa só deps.database.read, como catalogOf (parte 1, C7):
//     proof = await deps.identity.admitMember({ tx, companyId, personId, action: 'readCompany' })
//     ready = await deps.projects.readyDatabaseOf(tx, companyId), como syncOf (apps/server/src/hub/copies/store.ts:183-190)
//     sem host -> TABLE_UNAVAILABLE
//  2. o endereço do login de leitura do lugar, com o papel tirado de proof:
//     lugar COMPANY e deps.identity.allows(proof.role, 'readCopyRows') -> deps.companyPostgres.readerAddress(host)
//                      (parte 1, C3: conexus_read); a parte 4 troca essa regra por readerOf
//     lugar COMPANY sem readCopyRows -> { kind: 'NOT_IN_ROLE' }
//     lugar PROJECT -> deps.companyPostgres.readAddress(host, projectId), o login de leitura do Projeto
//                      (apps/server/src/platform/company-postgres.ts:173, app-read.ts:29-35)
//  3. deps.companyPostgres.readCopies(reader, [
//       { text: `EXPLAIN (VERBOSE, FORMAT JSON) ${sql}` },
//       { text: sql },
//     ], deadline(signal))
//  4. ROWS -> used = relationsOf(results[0])      // nomes com "Schema": "sync"
//             plano fora da forma -> deps.log.error({ companyId, personId }, 'DATA_PLAN_UNREAD') e só então
//             a falha INTERNAL_UNEXPECTED; nenhuma linha sai
//             a coluna _pass sai de results[1], como withoutPassColumn (apps/server/src/hub/apps/app-database.ts:213-221, :223-233)
//             rows = results[1].rows.slice(0, QUERY_ROWS); complete = results[1].rows.length <= QUERY_ROWS
//     REFUSED 42501 (insufficient_privilege) -> { kind: 'NOT_IN_ROLE' }
//     REFUSED outro  -> { kind: 'QUERY_REFUSED', sqlstate }
//     TOO_LARGE      -> { kind: 'QUERY_TOO_LARGE' }
//     TIMEOUT        -> { kind: 'DEADLINE' }
//     NO_LOGIN       -> o dono por deps.neon.ownerConnection(neonProjectId), depois
//                       COMPANY: ensureReader(owner) (parte 1, C3); PROJECT: deps.companyPostgres.ensureReadLogin(owner, projectId);
//                       e uma nova tentativa, como askApp (apps/server/src/hub/apps/app-database.ts:174-206)
//     UNAVAILABLE    -> { kind: 'TABLE_UNAVAILABLE' }, com o log DATA_QUERY_FAILED

/** Os nomes das tabelas de `sync` que o plano lê: todo nó com "Relation Name" e "Schema" = "sync".
 *  O plano chega já lido, porque a coluna de EXPLAIN (FORMAT JSON) é do tipo json e o driver a converte.
 *  O valor passa por safeParse do esquema do plano; um texto, ou qualquer outra forma, é plano fora da forma
 *  (undefined), e queryOf registra DATA_PLAN_UNREAD. Nenhum JSON.parse, nenhum SyntaxError solto. */
export function relationsOf(explained: ReadResult): string[] | undefined
```

Por que `EXPLAIN` e não um leitor de SQL nosso. O plano é o que o PostgreSQL vai executar, e ele nomeia cada tabela. A prova do login por papel não rodou o `EXPLAIN (VERBOSE)`. Ele foi medido pelo redator num PostgreSQL 17.10 descartável; o banco das empresas é o 18, e a unidade 2.1 prova no teste. Um leitor de SQL nosso é lógica paralela ao banco e erra em visão, CTE e apelido.

Por que as duas instruções na mesma transação. O transporte roda as instruções numa transação só, todas ou nenhuma, e a de leitura devolve um resultado por instrução [visto, `apps/server/src/platform/app-sql.ts:20-32`, `company-postgres.ts:124-138`]. Cada instrução vai pelo protocolo estendido, que recusa um segundo comando no mesmo texto com `42601` [visto, `apps/server/src/platform/test-company-postgres.ts:59-62`; provado em `apps/server/src/builder/agents/app-data.test.ts:170-195`, caso `'SELECT 1; SELECT 2'`]. Medido pelo redator num PostgreSQL 17.10 descartável (o banco das empresas é o 18, e a unidade 2.1 prova no teste), como um login que só tem `SELECT` em `sync`: `EXPLAIN (VERBOSE, FORMAT JSON)` de um `SELECT` devolve o plano com `"Relation Name"` e `"Schema": "sync"` em cada nó que lê uma tabela, também por uma CTE, e o de uma visão nomeia a tabela de baixo; o de `CREATE TABLE` falha com `42601`; o de `INSERT`, `UPDATE` e `DELETE` falha com `42501` (o `EXPLAIN` confere a permissão antes de rodar), e nada roda. Esse `42501` cai no mapeamento para `NOT_IN_ROLE` abaixo. Decisão `L1`: a escrita volta `NOT_IN_ROLE`; `CREATE` e mais de uma instrução voltam `QUERY_REFUSED` com `42601`.

O que guarda a leitura é o login, e não o texto. Não há filtro nosso antes do banco: "What PostgreSQL refuses is refused" [visto, `apps/server/src/platform/app-read.ts:108-112`]. O login de leitura só segura `SELECT` em `sync`, roda em transação só de leitura e não é membro de papel nenhum (parte 1, `C3`).

O prazo: `AbortSignal.any([signal, AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)])`, como `app_data_read` [visto, `apps/server/src/builder/app-data/tools.ts:56-59`].

Limite conhecido: uma consulta que lê uma tabela por dentro de uma função, como `query_to_xml`, não mostra a tabela no plano. O banco ainda recusa o que o login não lê. A resposta vem sem a tabela na origem, e a ferramenta diz ao modelo que a origem não foi identificada.

### `C3`. As duas ferramentas

Pasta nova `apps/server/src/builder/data-tools/`. Ela só importa `@conexus/hub-api` e `@mastra/core`. Os nomes entram em `packages/hub-api/src/tools.ts`, ao lado de `BUILDER_TOOL` [visto, `packages/hub-api/src/tools.ts:48-59`]:

```ts
export const DATA_TOOL = { describe: 'data_describe', query: 'data_query' } as const
export const DESCRIBE_SAMPLE_ROWS = 5   // T7
```

```ts
// apps/server/src/builder/data-tools/tools.ts
import { createTool } from '@mastra/core/tools'   // node_modules/@mastra/core/dist/docs/references/reference-tools-create-tool.md

/** O contrato já preso à conversa; undefined quando a conversa não tem escopo. */
/** `threadId` é a conversa da chamada (`context.agent?.threadId`, node_modules/@mastra/core/dist/tools/types.d.ts:172-183):
 *  cada agente o põe no `by` que passa a `data(scope, { by })`. */
export type DataOf = (requestContext: RequestContext, call: Readonly<{ threadId?: string }>) => Promise<CompanyData | undefined>

/** `log` é o que cada agente já recebe (FailureLog de apps/server/src/platform/failure.ts:12-15, só o tipo). */
export function dataTools({ dataOf, log }: { dataOf: DataOf; log: Pick<FailureLog, 'error'> }): ToolsInput {
  return {
    [DATA_TOOL.describe]: createTool({
      id: DATA_TOOL.describe,
      description: DESCRIBE_DESCRIPTION,
      inputSchema: z.object({ table: z.string().max(40).optional() }),
      execute: async ({ table }, { requestContext, abortSignal, agent }) => {
        const data = requestContext === undefined ? undefined : await dataOf(requestContext, { threadId: agent?.threadId })
        if (data === undefined) return NOT_GRANTED
        return table === undefined
          ? listed(await data.describe({ signal: abortSignal }))
          : described(table, await data.describe({ signal: abortSignal }),
                      await data.read({ kind: 'TABLE', table, signal: abortSignal }))
      },
    }),
    [DATA_TOOL.query]: createTool({
      id: DATA_TOOL.query,
      description: QUERY_DESCRIPTION,
      inputSchema: z.object({ sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
      execute: async ({ sql }, { requestContext, abortSignal, agent }) => {
        const data = requestContext === undefined ? undefined : await dataOf(requestContext, { threadId: agent?.threadId })
        if (data === undefined) return NOT_GRANTED
        const answer = await data.read({ kind: 'QUERY', sql, signal: abortSignal })
        // O nome e o conector do sistema de cada tabela saem do catálogo: kept.connections[0] -> systems[]
        if (answer.kind !== 'QUERY') return refused(answer)
        const described = await data.describe({ signal: abortSignal })
        return described.kind === 'CATALOG' ? queried(answer, described, log) : refused(described)
      },
    }),
  }
}
```

A ferramenta não lança nas recusas. Ela devolve um objeto com `kind`, como as ferramentas de hoje [visto, `apps/server/src/builder/connectors/connector-tools.ts:58`, `:207-215`]. A única falha que sobe é a do plano ilegível (`DATA_PLAN_UNREAD`, `C2`), já registrada por `queryOf`: sem saber de onde as linhas vieram, a ferramenta não as devolve.

Uma tabela cujo `kept.connections[0]` não está em `systems` é uma resposta do catálogo fora do esquema. A ferramenta não usa o id da conexão como nome: registra `DATA_ORIGIN_UNREAD` com a tabela e a conexão e responde `CATALOG_UNAVAILABLE`, com a frase dela e sem linha nenhuma.

O que cada uma devolve ao modelo:

```ts
// data_describe()  -> o catálogo, curto
{ kind: 'CATALOG',
  systems: [{ name, connector, reads: [{ operation, label, summary }] }],
  tables:  [{ name, label, description, system, connector, copiedAt, lastRun }] }      // sem colunas: a lista cabe no contexto

// data_describe({ table }) -> uma tabela
{ kind: 'TABLE', name, label, description,
  columns: [{ name, type, description, inactiveSince }],
  sample: { rows: [...até 5], more: boolean },
  origin: Origin }

// data_query({ sql })
{ kind: 'ROWS', columns, rows, complete, origin: Origin[] }

type Origin = {
  system: string          // o nome do sistema, do catálogo (systems[].name, o nome da conexão)
  connector: string       // o conector do sistema (systems[].connector), que a tela traduz em "Sankhya"
  table: string
  copiedAt: string | null // quando a última rodada terminou
  lastRun: 'COMPLETE' | 'PARTIAL' | 'ERROR' | 'INTERRUPTED' | 'NONE'
}
```

As recusas, cada uma com uma frase em inglês para o modelo, como as de hoje [visto, `connector-tools.ts:171-186`]:

| `kind` | Quando | `reason` ao modelo |
| --- | --- | --- |
| `NOT_IN_CATALOG` | A tabela não existe no catálogo de quem pergunta | "No such table in the catalog. Call data_describe with no table to list them." |
| `NOT_IN_ROLE` | O papel não lê | "PostgreSQL denied this statement: the role of the person does not read one of its tables, or the statement is not a read. Say so; do not look for the data elsewhere." |
| `QUERY_REFUSED` | O banco recusou | "PostgreSQL refused the query (SQLSTATE x). 42601 is a syntax error, 42703 a column that does not exist, 42P01 a table that does not exist, 25006 a write. Correct it and try again." |
| `QUERY_TOO_LARGE` | Passou de 1 MiB | "The answer is too large. Aggregate or add LIMIT." |
| `DEADLINE` | Passou do prazo | "The query took too long. Narrow it." |
| `TABLE_UNAVAILABLE` | O banco da empresa não respondeu | "The company's database did not answer. Do not read the system live in its place; tell the person to try again." |
| `CATALOG_UNAVAILABLE` | O Hub não respondeu | "The catalog did not answer. Tell the person to try again." |

`described` corta a página de até 200 linhas do contrato para 5 (`DESCRIBE_SAMPLE_ROWS`). O contrato serve a página e a ferramenta mostra a amostra.

**Onde as ferramentas entram.** Os três agentes montam as ferramentas em lugares diferentes, e as duas novas entram nos três:

| Agente | Onde monta | O que muda |
| --- | --- | --- |
| Assistente | O objeto de `tools` [visto, `apps/server/src/builder/assistant/assistant.ts:239-249`] e o conjunto fechado `AVAILABLE_TOOLS` [`assistant.ts:82-97`]. Sem o nome ali o controlador tira a ferramenta | `...dataTools({ dataOf, log })` e os dois nomes |
| Builder | `tools` de `createCodingAgent` [visto, `apps/server/src/builder/conversation/builder.ts:140-156`] e `TOOL_CLOSURE` [`apps/server/src/builder/conversation/permissions.ts:62-65`], com `CLOSED_TOOLS` [`packages/hub-api/src/tools.ts:62-68`] | O mesmo |
| Agente salvo | `runToolsOf`, dentro de `ofTheAgent` [visto, `apps/server/src/builder/agents/agent.ts:269-273`; a regra de nunca perguntar vem do regime `THE_WRITE_ASKS` da ficha, `askingOnlyByOwnRule` em `apps/server/src/builder/controller-kit/mount.ts`] | O mesmo. O lugar é o Projeto do agente. Efeito: as duas também entram no programa do modo código, que é feito de `ofTheAgent` [visto, `agent.ts:274`, `codeModeOf(ofTheAgent, machines.codeMode)`] |

O Construtor de agentes (`apps/server/src/builder/construtor/`) não recebe as ferramentas: a 24.6 está congelada [visto, `docs/roadmap.md:20`].

**Como a conversa recebe o `CompanyData`.** A parte 1 já cria `const data = createCompanyData(...)` em `main.ts` e no Hub de teste (parte 1, unidade 4.2). O servidor entrega esse mesmo `data` aos três agentes como uma porta, na raiz do servidor, onde `deps.connectors` já é entregue; nenhum segundo `createCompanyData` nasce. `dataOf` lê o escopo da conversa com a função que cada agente já tem (`scopeOf` no Assistente [visto, `assistant.ts:236`], o `plan` do agente salvo, que lê `agentRunIn` [visto, `agent.ts:79-81`]) e chama a porta como `data(scope, { by })`: o Assistente com `{ agent: 'ASSISTANT', threadId }`, o Builder com `{ agent: 'BUILDER', threadId }` e o agente salvo com `{ agent: 'AGENT', agentId, threadId }`. A parte 3 não lê `by`; a parte 4 o grava.

**O lugar e quem lê.** O escopo da conversa já diz o lugar [visto, `apps/server/src/hub/connectors/scope.ts:5-20`]:

- Lugar `COMPANY`, a conversa do Início: as tabelas que o papel da pessoa lê.
- Lugar `PROJECT`, o Builder e o agente salvo: as cópias liberadas ao Projeto, como `app_data_read` já lê [visto, `apps/server/src/builder/app-data/tools.ts:65-86`]. O login é o de leitura do Projeto, que já tem `SELECT` nelas [visto, `apps/server/src/platform/copy-sql.ts:331-347`]. Resposta do fundador à P1, no índice. O agente salvo lê nesta spec pela liberação do Projeto dele; a regra por papel de quem pergunta é entrada da parte 7.

O caminho de busca do login do Projeto é o esquema do app [visto, `apps/server/src/platform/app-read.ts:45`], e o do login `conexus_read` é `sync`. Por isso a ordem do agente manda escrever a tabela com o esquema, `sync.sankhya_vendas`, que vale nos dois.

### `C4`. A ordem do agente, escrita uma vez

```ts
// apps/server/src/builder/data-tools/order.ts
/** A ordem que os três agentes seguem para ler dado copiado. Uma função, um texto. */
export function dataOrder(): string
```

O texto, em inglês como os outros blocos de instrução:

```
## Company data
To answer with the company's copied data, go in this order:
1. data_describe with no table: the tables this person may read, with what each holds.
2. data_describe with the table: its columns and five rows. Read the rows before you write a query.
3. data_query with one read-only PostgreSQL SELECT. Name each table with its schema (sync.sankhya_vendas). Aggregate in SQL and add LIMIT.
State the number and where it came from: the system, the table and when it was last copied, as the answer's `origin` gives them.
When the last run was partial or failed, say that the number may be incomplete.
When no table holds what was asked, say so and name what exists that is close. That is an answer, not an error.
A table read is never replaced by a live read of the system.
```

Onde entra: nas instruções do Assistente [visto, `apps/server/src/builder/assistant/instructions.ts:44-70`], nas instruções do agente salvo e, no Builder, como um bloco próprio em `builderInstructions` [visto, `apps/server/src/builder/conversation/instructions.ts:28-66`], depois do prompt preenchido. Fora de `dataContext`, porque ele devolve `''` num Projeto sem cópia [visto, `apps/server/src/builder/app-data/context.ts:77-78`], e a ordem vale mesmo sem cópia.

`HOW_TO_READ` manda ver linhas com `app_data_read` [visto, `context.ts:21-22`], o que contradiz o passo 2 da ordem. A frase
"Count a read on the real data with `app_data_check`, and see a few rows with `app_data_read`; the Project app reads the same table through `db`. A copy has no row count here: ask `app_data_check`."
passa a ser
"Count a read on the real data with `app_data_check`, and see the columns and a few rows of a copy with `data_describe`, in the order of `## Company data`; the Project app reads the same table through `db`. A copy has no row count here: ask `app_data_check`."
O arquivo continua na lista de migração: a mudança é de texto e não muda import. A frase "cópia primeiro" do Builder [visto, `context.ts:15-17`, `SOURCE_RULE`] fica: ela sai no marco `D4` [visto, `docs/roadmap.md:48`].

### `C5`. A origem até a tela

O estudo anterior propôs mandar a origem por `context.writer.custom` com um tipo `data-*`. O mapa do `main` mostrou que esse caminho não serve aqui: sob o controlador, um `data-*` de ferramenta que não é do Mastra não chega vivo ao cliente. O motor só traduz em evento os tipos que conhece, e os outros caem no `default: break` [visto, `@mastra/core` 1.82, `agent-controller/session-run-engine.ts:1618-1619`]. O próprio `main` já registra isso [visto, `apps/server/src/builder/model-accounts/processors.ts:66-68`].

O caminho nativo e já provado no repositório é o resultado da ferramenta. A tela já lê o resultado guardado de cada chamada para montar a linha [visto, `apps/web/src/builder/conversation/tool-registry.ts:244`, `connector-specs.ts:169`]. A origem vai no resultado (`origin`, em `C3`), e a tela a lê dali. Nada novo no fluxo.

| Tela do escopo | O que muda | Peça de hoje |
| --- | --- | --- |
| `p3-01` Resposta com origem | O bloco **Fontes** aceita a origem de um dado: sistema, tabela e "copiado hoje às 08:45" | `sourcesOf` [visto, `apps/web/src/builder/conversation/sources.ts:35`], `Sources` [`sources.tsx:4`], chamado em `rows.ts:262` |
| `p3-02` Como cheguei | As linhas das duas ferramentas, com a consulta e **Copiar a consulta** no corpo | `ToolRow` [`tool-row.tsx:370`], `Body` [`tool-row.tsx:270`], `TOOLS` [`tool-registry.ts:47`] |
| `p3-03` Não achei | Nada na tela: é texto do agente | nenhuma |
| `p3-04` Cópia atrasada | A fonte diz "rodada parcial" ou "parada", com a hora | o mesmo bloco Fontes |
| `p3-05` Ao vivo | A fonte de uma leitura ao vivo diz "lido agora, às 10:02" | a linha de leitura ao vivo [`connector-specs.ts:281`] |
| `p3-06` O banco não respondeu | A linha da ferramenta diz "Não conseguiu ler a tabela agora." | `refusal` do spec [`tool-spec.ts:68`] |
| `p3-07` O Builder | As mesmas linhas no Projeto | `BUILDER_ROOM` [`room.ts:80`] |

```ts
// apps/web/src/builder/conversation/sources.ts
export type MessageSource =
  | { kind: 'web'; url: string; title: string; domain: string; linked: boolean }   // o de hoje
  | { kind: 'data'; connector: string; system: string; table: string; at: string | null; state: 'FRESH' | 'PARTIAL' | 'STOPPED' | 'LIVE' }

/** As fontes de uma resposta: as páginas da web da parte `source` e a origem de cada leitura de dado do turno. */
export function sourcesOf(parts): MessageSource[]
//  as de dado saem do resultado das chamadas data_query e data_describe({ table }) da mesma mensagem:
//  Origin -> { kind: 'data', connector, system, table, at: copiedAt, state }; sem repetir a mesma tabela
```

A fonte escreve o conector pelas palavras do conector, `words.name(connector)` [visto, `apps/web/src/builder/conversation/connector-specs.ts:134-138`], e não pelo nome da conexão: "Sankhya · sankhya_vendas · copiado hoje às 08:45".

Um arquivo novo, `apps/web/src/builder/conversation/data-specs.ts`, dá o spec das duas ferramentas, no molde de `APP_DATA_SPECS` [visto, `apps/web/src/builder/conversation/app-data-specs.ts:21`]:

| Ferramenta | Rodando | Feita | Detalhe | Recusa |
| --- | --- | --- | --- | --- |
| `data_describe` sem tabela | "Consultando o catálogo" | "Consultou o catálogo" | "7 tabelas" | "Não conseguiu ler o catálogo agora." |
| `data_describe` com tabela | "Vendo sankhya_vendas" | "Viu sankhya_vendas" | "5 linhas, há mais" | "Seu papel não lê esta tabela. Peça a quem administra a empresa." |
| `data_query` | "Consultando os dados" (sem resultado, a tabela ainda não se sabe) | "Consultou sankhya_vendas" | "1 linha" | por `kind`, na tabela abaixo |

| `kind` | Texto na tela |
| --- | --- |
| `NOT_IN_ROLE` | "Seu papel não lê esta tabela. Peça a quem administra a empresa." |
| `TABLE_UNAVAILABLE`, `CATALOG_UNAVAILABLE` | "Não conseguiu ler a tabela agora." |
| `QUERY_REFUSED` | "A consulta não rodou." |
| `QUERY_TOO_LARGE` | "A consulta trouxe dados demais." |
| `DEADLINE` | "A consulta demorou demais." |
| `NOT_IN_CATALOG` | "Essa tabela não está no catálogo." |

O texto "Seu papel não lê ..." da decisão `T4` não existe no `main` de hoje: a busca não o achou, e uma leitura recusada por papel cai hoje em "Não conseguiu ler o sistema da empresa." [visto, `apps/web/src/builder/conversation/connector-specs.ts:131`, `:176`]. A captura que o escopo cita é de uma rodada de QA. Esta parte cria o texto para a tabela copiada. O texto da leitura ao vivo com o nome da operação fica como está.

A consulta visível a quem lê a tabela, recolhida, é a decisão E3a. A linha da ferramenta já nasce recolhida, e o corpo mostra a entrada da chamada. Quem vê a conversa é quem perguntou, que lê as tabelas que a consulta tocou.

A hora de uma leitura ao vivo (`p3-05`): a ferramenta de leitura tipada passa a pôr `at` no resultado, com a hora em que a resposta chegou [visto, `apps/server/src/builder/connectors/typed-reads.ts:97-126`]. A leitura tipada e `connector_read` devolvem o que `readOn` devolve [visto, `apps/server/src/builder/connectors/connector-tools.ts:218-235`], e o `at` entra ali, uma vez para as duas, nos dois retornos de OK: o OK sem `whole`, que volta direto em `:230`, e o corte com `whole`, em `:231-234`. O `connector_read` inventado do cenário gravado (`scripts/record.ts:242-258`) passa a pôr `at` também, e o cenário `reads` é gravado de novo. A tela a mostra como fonte `LIVE`.

### `C6`. Os arquivos que nascem fora da lista de migração

A lista tem 31 arquivos que ainda chegam ao dado por fora do contrato [visto, `.dependency-cruiser.cjs:23-56`]. Um comentário diz "nothing joins the list" [visto, `.dependency-cruiser.cjs:22`], e nada o impõe.

- **O teste que impede a lista de crescer.** `scripts/rules-doors.test.ts` ganha um caso que lê a lista do arquivo de configuração e a compara com uma lista fixa no teste. A configuração guarda as expressões já mapeadas (`^apps/server/src/builder/agents/agent\.ts$`, `.dependency-cruiser.cjs:55-56`), e a lista fixa guarda os nomes curtos e os mapeia do mesmo jeito antes de comparar. Um nome novo falha. Um nome a menos passa, e o construtor atualiza a lista fixa no mesmo commit.
- **Os primeiros fora da lista.** Os arquivos de `apps/server/src/builder/data-tools/` nascem fora dela: a pasta entra em `AGENTS_AND_APPS` e importa só o contrato. `apps/server/src/builder/app-data/context.ts` não sai nesta parte. O bloco "## Data" do Builder usa o que `Catalog` não traz [visto, `apps/server/src/hub/copies/project-view.ts:22-42`, `context.ts:51-108`]: o modo de cada cópia, as colunas de conta, as cópias liberadas a outros Projetos e as propostas abertas do Builder. As propostas e a liberação são o fluxo de propor uma cópia, e não a leitura do dado. Pôr esses campos no catálogo misturaria os dois no contrato. O arquivo sai da lista junto com `connectors/copy-propose`, na spec que levar a proposta de cópia para o verbo `act` do contrato.

Os 31 saem cada um com o seu consumidor, fora desta parte. Nenhum sai aqui.

### `C7`. `live`, `funnel` e a conformidade inteira

`DataSources.live` e `DataSources.funnel` são adaptadores finos sobre o que já existe:

```ts
// apps/server/src/hub/data/live.ts
//  live({ connection, operation, input, signal }) ->
//    deps.connectors().assistant.read(scope, { connectionId: connection, turn, operation, input, signal })
//    (apps/server/src/hub/connectors/assistant-port.ts:56-66, :307-332)
//    a porta pede `turn: TurnKey`, que conta as 50 chamadas da resposta; ele vem do turno preso (abaixo)
//  cada `kind` da resposta tem um par no contrato; o switch termina em `satisfies never`
//  NOT_IN_ROLE { role, operation } -> { kind: 'NOT_IN_ROLE' }

// apps/server/src/hub/data/funnel.ts
//  funnel(request) -> deps.connectors().assistant.write({ ...request, scope })
//    (assistant-port.ts:68, :334; o funil em apps/server/src/hub/connectors/write.ts:158-187)
//    WriteRequest (apps/server/src/hub/connectors/write-record.ts:32-45) pede threadId e toolCallId
//    (ActRequest.call os traz), e também turn e speaker (Person, ou Version com agentId e number),
//    que vêm do turno preso (abaixo)
```

O turno e quem fala são fatos da conversa, como o escopo, e não do dado. Eles entram onde o escopo entra, e o contrato não muda. A assinatura é uma só nas partes 3 e 4, e a unidade 2.1 já a põe, para nenhum PR depois mudá-la:

```ts
// apps/server/src/hub/data/public.ts
/** O turno de uma chamada: a chave que conta as chamadas da resposta, e quem fala (write-record.ts:32-45). */
// TurnKey de '../connectors/public.ts' (:62); Speaker de '../identity/public.ts', como write-record.ts:16;
// PersonId e AgentId de '@conexus/hub-api'
export type TurnBinding = Readonly<{ turn: TurnKey }> &
  (
    | Readonly<{ speaker: Readonly<{ kind: 'PERSON'; personId: PersonId }> }>
    | Readonly<{ speaker: Extract<Speaker, { kind: 'VERSION' }>; agentId: AgentId; number: number }>
  )
/** Quem lê: o agente e a conversa. A forma e a leitura são da parte 4 (o Registro de dados,
 *  ../04-governanca-minima/design.md, ReadBy); a parte 3 a declara com essa forma, passa adiante e não a lê. */
export type ReadBy = Readonly<{ agent: 'ASSISTANT' | 'BUILDER' | 'AGENT' | 'APP'; agentId?: string; threadId?: string }>
export type DataContext = Readonly<{ by?: ReadBy; turn?: TurnBinding }>
export function createCompanyData(deps: DataDeps): (scope: SessionScope, context?: DataContext) => CompanyData
//   (scope, context) => companyData({ sources: sourcesFor(deps, scope, context), now: () => new Date() })
//   sem `context.turn`, `live` e `funnel` respondem NOT_GRANTED; describe, rows e query não usam `turn`
//   nenhuma fonte da parte 3 lê `context.by`
// sourcesFor passa a ser exportado: o mundo real da conformidade embrulha as fontes que ele monta
```

Com as quatro fontes implementadas, `runDataConformance` roda contra a implementação real [visto, `packages/hub-api/src/company-data-conformance.ts:305-313`], num teste do servidor com o Hub de teste e os dublês do kit. Hoje ela recebe `make: () => DataWorld`, síncrona e sem `TestContext`, e o Hub de teste é assíncrono e pede `t` [visto, `apps/server/src/hub/copies/test-copies.ts:137`]. Por isso a conformidade passa a aceitar `make: (t: TestContext) => DataWorld | Promise<DataWorld>`, numa mudança só do contrato e da conformidade, antes do mundo real. O mundo falso de hoje continua valendo sem mudança.

O mundo real liga o que `fixturesOf` e as leis pedem [visto, `company-data-conformance.ts:58-75`, `:113-125`, `:134-147`, `:175-185`]: a cópia `vendas` (v1, `QUERY`) com a última rodada `PARTIAL`, pelo teto de páginas (`runPages: 2`, como `apps/server/src/hub/copies/run.test.ts:118-122`); uma cópia v2 de uma leitura do Sankhya com entrada fixa (`pedidos`, `packages/connectors/src/sankhya/operations/vendas.ts:16-29`); uma cópia v2 de uma leitura com entrada vazia (`empresas`, `packages/connectors/src/sankhya/operations/cadastros.ts:7-15`, que só pede a página, e a página é do motor); uma segunda conexão Sankhya `ACTIVE` na empresa, com a mesma leitura `pedidos`, que nenhuma cópia lê; uma leitura que nenhuma cópia serve (`notasFiscais`, `vendas.ts:31`) e a ação `lancarPedido` (`vendas.ts:181-183`). O catálogo cai por um embrulho do banco do Hub nas dependências das fontes, que lança `new Failure('DATABASE_UNAVAILABLE')`, e `catalogOf` (parte 1) o traduz em `CATALOG_UNAVAILABLE`.

Nenhum consumidor chama `live` nem `funnel` nesta parte. Este grupo pode esperar a parte 5 sem atrasar o marco `D2`, e fica por último nas tarefas.

## Modelo de dados

Nenhuma tabela e nenhuma coluna nova. O contrato ganha um caso no pedido e três na resposta (`C1`). O resultado de cada ferramenta fica guardado na mensagem do Mastra, como todo resultado de ferramenta, e é dele que a tela lê a origem.

## Propriedades de correção

1. **Só leitura.** Para toda consulta com `INSERT`, `UPDATE` ou `DELETE`, o banco recusa com `42501`, que é o que um login só de `SELECT` recebe ao tentar escrever, a resposta é `NOT_IN_ROLE`, e nenhuma linha muda. *Valida: requisito 2.3.*
2. **Uma instrução só, e nada de esquema.** Para todo texto com mais de uma instrução, ou com `CREATE`, nada roda e a resposta é `QUERY_REFUSED` com `42601`. *Valida: requisito 2.4.*
3. **Toda linha tem origem no catálogo.** Para toda resposta `QUERY`, cada tabela em `tables` está no catálogo de quem perguntou, e uma consulta que leu uma tabela fora dele não devolve linha. *Valida: requisitos 2.2, 3.1.*
4. **O corte é dito.** Para toda consulta com mais de 200 linhas, a resposta traz 200 e `complete: false`. *Valida: requisito 2.5.*
5. **A tabela parada não é lida ao vivo.** Para toda falha do banco da empresa, nenhuma leitura ao vivo acontece. *Valida: requisito 5.3.*
6. **As três montagens dão as mesmas ferramentas.** O Assistente, o Builder e o agente salvo recebem os mesmos dois nomes com a mesma descrição e o mesmo esquema de entrada. *Valida: requisito 1.1.*
7. **A lista de migração só diminui.** *Valida: requisito 6.1.*

## Tratamento de erros

Nenhum erro é engolido. A ferramenta devolve a recusa com `kind`, e o servidor registra a causa.

| Onde | O que falha | Resposta | Log |
| --- | --- | --- | --- |
| `queryOf` | O banco recusou a consulta | `QUERY_REFUSED` com o SQLSTATE | nenhum: é erro do modelo, e ele corrige |
| `queryOf` | `42501`, o login não lê a tabela | `NOT_IN_ROLE` | `DATA_READ_REFUSED`, com a pessoa e sem a consulta (security S41) |
| `queryOf` | O banco da empresa calado | `TABLE_UNAVAILABLE` | `DATA_QUERY_FAILED` com a causa |
| `queryOf` | Passou do prazo | `DEADLINE` | `DATA_QUERY_FAILED` com `TIMEOUT` |
| `queryOf` | Passou de 1 MiB | `QUERY_TOO_LARGE` | nenhum |
| `queryOf` | O plano não tem a forma esperada (`relationsOf` devolve `undefined`) | Falha `INTERNAL_UNEXPECTED`, depois do log: a ferramenta não devolve linhas sem saber de onde vieram | `DATA_PLAN_UNREAD`, registrado por `queryOf` antes de lançar |
| `dataTools` | Uma tabela do catálogo nomeia uma conexão que não está em `systems` | `CATALOG_UNAVAILABLE`, sem linha | `DATA_ORIGIN_UNREAD`, com a tabela e a conexão |
| `dataTools` | A conversa sem escopo | `NOT_GRANTED` | nenhum, como hoje [visto, `typed-reads.ts:112-114`] |
| A tela | Resultado de ferramenta que não passa no esquema | A linha genérica da ferramenta, sem a fonte. Nunca uma fonte inventada | nenhum |

## Estratégia de teste

Os testes da CI usam dublês: o dublê do Sankhya do kit, um banco de empresa descartável e o modelo de dublê gravado. Nenhum teste da CI lê o Sankhya real.

| O que | Como | Modelo a seguir |
| --- | --- | --- |
| O contrato | As cinco leis novas na conformidade, com o mundo falso | `packages/hub-api/src/company-data.test.ts:103-146` |
| `queryOf`, `relationsOf` | Banco de empresa descartável com duas tabelas. O plano de uma junção nomeia as duas. Uma escrita, duas instruções e uma tabela sem permissão são recusadas | `apps/server/src/platform/test-company-postgres.ts:119`, `apps/server/src/hub/copies/grants.test.ts:63-92` |
| As ferramentas | Teste de ferramenta com dublês, pela porta pública | `apps/server/src/builder/connectors/connector-tools-scope.test.ts:12-58` |
| As três montagens | Um teste lista as ferramentas de cada agente e compara | os testes de cada agente |
| A forma guardada do resultado | Um cenário gravado do fluxo nativo, `data-query`, com `npm run record` (testing T26) | `scripts/record.ts:82-95`, `apps/server/src/platform/test-recordings.ts:77-89` |
| A tela | Teste de tela com o cenário gravado: a linha, o corpo e o bloco Fontes | `apps/web/src/builder/assistant/refusals.test.tsx:70-100`, `apps/web/src/builder/conversation/sources.test.tsx` |
| A conformidade inteira | `runDataConformance` contra a implementação real | `packages/hub-api/src/company-data-conformance.ts:305-313` |

**As perguntas com resposta conhecida.** As 27 perguntas de hoje leem os sistemas falsos ao vivo, e nenhuma lê cópia [visto, `apps/server/src/builder/assistant/test-scorecard.ts:58-161`]. Entram perguntas sobre o dado copiado, com a tabela, o número e a origem esperados. O dado é o banco de vendas do dublê do Sankhya [visto, `packages/connectors/src/sankhya/fake-sales.ts:197`], copiado por uma rodada de verdade para o banco de teste. Os números saem do dublê, e o construtor os calcula com uma consulta no teste, não à mão.

| Pergunta | Quem pergunta | Tabela esperada | O que a resposta tem de trazer |
| --- | --- | --- | --- |
| "Quanto vendi em outubro?" | Bruno, no Início | `sankhya_vendas` | A soma de `VLRNOTA` do mês no dublê, a tabela e a hora da cópia |
| "Quantos clientes ativos temos?" | Lea | `sankhya_clientes` | A contagem do dublê |
| "Qual vendedor mais vendeu no mês?" | Lea | `sankhya_vendas` e `sankhya_vendedores` | O apelido do dublê, com as duas tabelas na origem |
| "Quanto pagamos de comissão?" | Lea | nenhuma | "Não achei", com o que existe de parecido. Nenhuma ferramenta falha |
| "Quanto vendi em outubro?", com a última rodada parcial | Bruno | `sankhya_vendas` | O número e o aviso de que pode estar incompleto |
| No Projeto do CRM: "quais tabelas de cliente eu tenho?" | o Builder | `sankhya_clientes` | A tabela liberada ao Projeto, e nenhuma outra |

A conferência de cada pergunta entra na função que o placar já tem [visto, `test-scorecard.ts:169-178`]: a ferramenta chamada, a tabela na origem e o número no texto.

**A rodada com modelo real.** O placar roda com modelo real quando `CONEXUS_EVAL_REAL_MODEL` está ligada, e sem ela o teste pula com `opt-in:` [visto, `apps/server/src/builder/assistant/assistant.eval.test.ts:127`]. As perguntas acima rodam assim contra o dublê do Sankhya.

**A leitura do Sankhya real.** Acontece num lugar só: o uso de fechamento do fundador (delivery L17), na empresa dele, com a cópia `vendas` já ligada. Ele pergunta "Quanto vendi em outubro?" e confere o número no Sankhya. É só leitura: a cópia lê por `SELECT`, e a pergunta lê a cópia.

**Mutações à mão (testing T27).** As linhas-chave: o `EXPLAIN` antes da consulta, o filtro `"Schema" = "sync"`, o corte em `QUERY_ROWS`, o `NOT_IN_CATALOG` da tabela fora do catálogo, o mapeamento de `42501`, e o corte em 5 da amostra.

## Tabela de referência

| Peça | Hoje no `main` | Referência | Veredito |
| --- | --- | --- | --- |
| Pedido de consulta | `company-data.ts:66-75` | Uma ferramenta que executa SQL de leitura e recusa o resto | nativo (o banco executa e recusa) |
| Quais tabelas a consulta leu | nenhuma | Uma resposta que lista as tabelas que a consulta usou | nativo (`EXPLAIN` do Postgres) |
| As duas ferramentas | `app-data/tools.ts:65-86`, `typed-reads.ts:97-126` | O modelo `text-to-sql` do Mastra, duas ferramentas | nativo (`createTool`) |
| A ordem | `app-data/context.ts:19-25` | A amostra antes da consulta, ensinada por texto | nativo (texto) |
| A origem até a tela | `sources.ts:8-24`, `tool-registry.ts:244` | O resultado da ferramenta, que o Mastra guarda. `writer.custom` não chega vivo sob o controlador | nativo. Troca a recomendação do estudo anterior, com a prova |
| A lista que só diminui | `.dependency-cruiser.cjs:22` | nenhuma | remendo pequeno: um teste, [ideia nossa] |
| `live` e `funnel` | `assistant-port.ts:56`, `:68` | nenhuma | embrulhado |
