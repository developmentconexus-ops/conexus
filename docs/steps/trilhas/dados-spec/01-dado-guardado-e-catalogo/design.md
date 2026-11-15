# Documento de desenho: parte 1, o dado guardado e o catálogo

Base: `main` do Conexus em `0d4c5730`. Todo caminho é relativo à raiz do repositório. Os rótulos de prova são os do escopo: **[visto]** é arquivo aberto nesta spec, ****, **** e **** são seções dos estudos, **[ideia nossa]** é proposta sem referência.

## Visão geral

No fim desta parte a página **Dados** toma o lugar da página **Cópias** (decisão E1a). Ela mostra cada tabela copiada, de qual sistema veio, o que cada coluna guarda e de quando é a última cópia. Por baixo, o Hub passa a implementar `DataSources.catalog` e `DataSources.rows` do contrato de acesso, que hoje ninguém implementa [visto, `packages/hub-api/src/company-data.ts:148-157`].

A parte muda pouca coisa do que existe. Não cria tabela no banco do Hub. Cria uma coluna, um login de leitura no banco de cada empresa e uma pasta de servidor.

| O que entra | Onde |
| --- | --- |
| A regra de nome `sistema_tabela` (`T1`) | `apps/server/src/hub/copies/enable.ts`, `propose.ts` |
| Descrição nas cópias da versão 1 e nas cinco cópias do Sankhya | `packages/connectors/src/kernel/copy.ts`, `packages/connectors/src/sankhya/copies.ts`, `apps/server/src/hub/copies/store.ts` |
| O login de leitura `conexus_read` e a amostra de 5 linhas (`T7`) | `apps/server/src/platform/copy-sql.ts`, `apps/server/src/hub/copies/` |
| A coluna inativa | `packages/connectors/src/kernel/list.ts`, `apps/server/src/hub/copies/` |
| O contrato: rótulo, descrição obrigatória, coluna inativa | `packages/hub-api/src/company-data.ts`, `copy-shown.ts`, `company-data-conformance.ts` |
| `DataSources.catalog` e `DataSources.rows` | pasta nova `apps/server/src/hub/data/` |
| A página Dados | `apps/web/src/hub/copies/` e as rotas `copies.*` |

O que fica de fora: a edição de descrição (parte 6, decisão `T6`), a camada Negócio com conceitos (parte 5), a escolha de quem lê cada tabela (parte 4), a declaração "só ao vivo" (parte 2), armazém novo, transformações e histórico de linha.

## Arquitetura

```
                 apps/web: página Dados (Bruto | Negócio | Apps)
                        │ listCopies, listCopyRuns, sampleCopy, listAppTables
                        ▼
apps/server/src/hub/copies ──────────────► banco do Hub: copies.copy (+ column_state)
        │  enable, run, sample                    ▲
        │                                         │ lê
        ▼                                apps/server/src/hub/data (novo)
platform/copy-sql.ts                       catalog()  rows()
        │  conexus_sync escreve            implementa DataSources
        │  conexus_read lê                         │
        ▼                                          ▼
banco da empresa: esquema sync            packages/hub-api: companyData()
```

Três camadas com nome, sem mudar esquema nenhum (decisão N1a). **Bruto** é o esquema `sync` [visto, `apps/server/src/platform/copy-sql.ts:9-10`]. **Negócio** são os conceitos aprovados da Ontologia, vazio até a parte 5. **Apps** é o esquema `app_<projeto>` de cada Projeto [visto, `packages/hub-api/src/app-login.ts`].

O Mastra não tem peça de catálogo. O catálogo é código nosso sobre o que o Postgres e o Hub já guardam.

## Componentes e interfaces

### `C1`. A regra de nome (`T1`)

Hoje a cópia ligada de um modelo recebe o id do modelo como nome: `...{ name: model.id, label: model.label }` [visto, `apps/server/src/hub/copies/enable.ts:73`]. O Sankhya dá `clientes`, `vendas` [visto, `packages/connectors/src/sankhya/copies.ts:42`, `:82`].

Muda para o sistema na frente. Um prefixo por fonte é o padrão de um catálogo que junta várias fontes.

```ts
// apps/server/src/hub/copies/naming.ts (novo)
import { CopyName } from '../connectors/public.ts'

/** `mercado-livre` + `pedidos` = `mercado_livre_pedidos`. O id do conector troca `-` por `_`. */
export function copyPrefixOf(connectorId: string): string {
  return `${connectorId.replaceAll('-', '_')}_`
}
export function modelCopyName(connectorId: string, modelId: string): CopyName {
  return CopyName.parse(`${copyPrefixOf(connectorId)}${modelId}`)
}
```

- `enable.ts:73` passa a usar `modelCopyName(linked.connectorId, model.id)`.
- `propose.ts` recusa a proposta cujo nome não começa com `copyPrefixOf(connector)`, com o item `COPY_NAME_PREFIX` na resposta `MALFORMED`. `ProposeAnswer` não tem tipo de falha, e o Construtor já lê os itens [visto, `apps/server/src/hub/connectors/builder-port.ts:72-82`]. O Construtor já recebe essa regra como texto. A recusa a torna lei.
- `CopyName` aceita 40 caracteres [visto, `packages/connectors/src/kernel/copy.ts:9-13`]. A ordem de `propose` não muda: um nome que passa disso continua recusado no `CopyName.safeParse`, com o item do zod de hoje [visto, `apps/server/src/hub/copies/propose.ts:20-22`, `:219-223`]. `namePrefixIssue` confere só o prefixo, depois que o conector é conhecido [visto, `propose.ts:228-230`].

**As cópias que já existem não mudam de nome.** Um app publicado lê `sync.vendas` por uma consulta fixa. Renomear a tabela quebra o app sem erro de build. Quem quer o nome novo apaga a cópia e a liga de novo. Esta é a decisão técnica `D4` do índice.

### `C2`. Descrição em toda tabela e coluna

O catálogo escolhe a tabela pela descrição: "sem comentário, a ferramenta fica sem descrição". Hoje a versão 2 tem descrição obrigatória de tabela e opcional de coluna [visto, `packages/connectors/src/kernel/copy.ts:122`, `:129`]. A versão 1 não tem nenhuma [visto, `copy.ts:56-68`], e os modelos do kit são todos da versão 1 [visto, `copy.ts:178`].

O estudo anterior deixou a escolha entre dar o campo à versão 1 ou levar as cinco cópias à versão 2. A spec dá o campo à versão 1. A versão 2 lê de uma operação de lista do conector, e o Sankhya copia por consulta paginada [visto, `packages/connectors/src/sankhya/copy-read.ts:153-166`]. Levar as cinco à versão 2 pede cinco operações novas no Sankhya, que nenhum marco pede.

```ts
// packages/connectors/src/kernel/copy.ts, dentro de CopyDefinitionV1
description: z.string().trim().min(1).max(500).optional(),
columns: z.array(z.object({
  name: CopyColumnName,
  type: CopyColumnType,
  description: z.string().trim().min(1).max(200).optional(),
})).min(1).max(100),
```

Os dois campos são opcionais no esquema porque a definição guardada é lida de novo a cada rodada (code C27) [visto, `apps/server/src/hub/copies/store.ts:133`], e as linhas antigas não os têm. A obrigação fica em três lugares:

1. **O modelo do kit.** `CopyModel` passa a exigir descrição de tabela e de cada coluna: `defineConnector` recusa o modelo sem elas, em `assertCopy` [visto, `packages/connectors/src/kernel/definition.ts:132-139`]. As cinco cópias do Sankhya ganham os textos (tabela na seção Modelo de dados).
2. **A proposta do Construtor.** `propose.ts` recusa a coluna sem descrição com o item `COPY_COLUMN_UNDESCRIBED` em `definition.columns.<i>.description`, na resposta `MALFORMED`.
3. **A rodada preenche o que falta.** A cópia ligada antes desta parte guarda a definição sem descrição. No começo de cada rodada, se a cópia veio de um modelo (`copy.model` não nulo) e a definição guardada não tem descrição, a rodada copia do modelo de hoje só as descrições que faltam. Nunca troca uma descrição que existe. Primeiro manda os `COMMENT ON` que `ensureCopyTable` já sabe mandar [visto, `apps/server/src/platform/copy-sql.ts:63-88`, `:140-163`], e só depois grava a definição. Se o banco da empresa falha, a rodada termina `DATABASE_DOWN` e a definição continua sem descrição para a próxima. Gravar `definition` pede a permissão `UPDATE(definition)` (Modelo de dados).

`shownOf` deixa de devolver `null` para a versão 1 [visto, `store.ts:207-210`] e lê os dois campos.

O passo 3 não faz a cópia seguir o modelo. A definição continua sendo da empresa, copiada ao ligar [visto, `apps/server/src/hub/copies/tables.ts:34-38`]. Só a descrição ausente é preenchida.

### `C3`. O login de leitura `conexus_read`

Hoje só dois logins tocam `sync`: `conexus_sync`, que é o dono e escreve [visto, `copy-sql.ts:8-9`], e os logins de cada Projeto, que leem as cópias liberadas [visto, `copy-sql.ts:331-347`]. Nenhum serve para ler fora de um Projeto.

Entra um login que só lê, no molde do login de leitura do Projeto [visto, `apps/server/src/platform/app-read.ts:41-67`]. A senha é derivada da chave, como os outros (decisão 0043) [visto, `copy-sql.ts:131`].

```ts
// apps/server/src/platform/copy-sql.ts
export const READ_LOGIN = 'conexus_read'

/** O login que lê todo o esquema sync e nada mais; repetível. Roda depois de ensureSync. */
export async function ensureReader(context: Context, owner: DatabaseUrl): Promise<SqlAnswer>
//  const signal = budget()   (copy-sql.ts:95-98, como ensureSync em :108); todo nome de papel e de esquema por quoted(),
//  como readSettings (app-read.ts:41-52): scripts/check-migrations.ts:21 recusa SET logo depois de aspas
//  1. missingLogins(context, owner, [READ_LOGIN], signal)            -> CREATE ROLE ... LOGIN
//  2. ALTER ROLE conexus_read SET search_path = sync
//     ALTER ROLE conexus_read SET default_transaction_read_only = on
//     ALTER ROLE conexus_read SET statement_timeout = APP_CALL_LIMITS.statementTimeoutMs
//     ALTER ROLE conexus_read SET transaction_timeout = APP_CALL_LIMITS.transactionTimeoutMs
//  3. SET LOCAL ROLE conexus_sync   (o dono já o segura por SET, copy-sql.ts:117)
//     GRANT USAGE ON SCHEMA sync TO conexus_read
//     GRANT SELECT ON ALL TABLES IN SCHEMA sync TO conexus_read
//     ALTER DEFAULT PRIVILEGES IN SCHEMA sync GRANT SELECT ON TABLES TO conexus_read
//  uma transação, com a repetição em 42710 que ensureSync já faz (copy-sql.ts:123-124)

export async function readerAddress(context: Context, host: string): Promise<DatabaseUrl>
//  igual a syncAddress (copy-sql.ts:128-133), com o login pedido

// SyncRead, e não CopyRead: esse nome já existe em apps/server/src/hub/connectors/copy-port.ts:46
export type SyncRead =
  | { kind: 'ROWS'; results: readonly ReadResult[] }
  | { kind: 'REFUSED'; sqlstate: string }
  | { kind: 'NO_LOGIN' }
  | { kind: 'TOO_LARGE' }
  | { kind: 'TIMEOUT' }
  | { kind: 'UNAVAILABLE'; cause?: string }

/** As consultas como um login de leitura, numa transação só de leitura. O que o PostgreSQL recusa é recusado. */
export async function readCopies(
  context: Context, reader: DatabaseUrl, statements: readonly SqlStatement[], signal: AbortSignal,
): Promise<SyncRead>
//  context.transport(reader, statements, signal, { readOnly: true }) e o mesmo switch de readApp (app-read.ts:120-155)
```

`readCopies` repete a forma de `readApp` de propósito e não a importa: `app-read.ts` é da Plataforma e fala de Projeto, e `copy-sql.ts` é da trilha Dados [visto, `docs/steps/trilhas/dados.md:33`, `:37-39`].

Quem chama `ensureReader`:

- `enableCopy`, logo depois de `ensureSync` [visto, `apps/server/src/hub/copies/enable.ts:142`].
- Qualquer leitura que receba `NO_LOGIN`: chama `ensureReader` com o dono e tenta uma vez de novo. É o que a leitura do Projeto faz com `ensureReadLogin` [visto, `app-read.ts:17-26`, `:148`], e a repetição com o dono em `apps/server/src/hub/apps/app-database.ts:182-211` (`askApp`). Assim a empresa que já tinha cópias ganha o login na primeira leitura.

O login nasce nesta parte, e não na 3 (decisão técnica `D6` do índice). Por que um login, e não o papel assumido por transação: a prova foi rodada no Postgres 18 e o teste do ataque direto da parte 4 a repete. A parte 4 acrescenta um login por papel com a mesma função.

### `C4`. A amostra de uma tabela

```ts
// packages/hub-api/src/copies.ts
export const COPY_SAMPLE_ROWS = 5   // T7
export const CopySample = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
  /** Falso quando a tabela tem mais linhas que a amostra. */
  complete: z.boolean(),
})
export const sampleCopy = defineOperation({
  id: 'sampleCopy', summary: 'Shows the first rows of a copy’s table, five at most, to whoever reads its rows.',
  access: 'session', method: 'GET', path: `${BASE}/{copyId}/sample`, bodyLimit: 1024,
  input: { params: OfCopy },
  success: { status: 200, body: z.object({ sample: CopySample }) },
  failures: [...ONE_FAILURES, 'COPY_DATABASE_UNAVAILABLE'],   // ONE_FAILURES já traz NOT_FOUND e COPY_NOT_FOUND, molde listCopyRuns
})
```

```ts
// apps/server/src/hub/copies/sample.ts (novo)
export async function sampleOf(deps, input: InCompany & { copyId }): Promise<CopySample>
//  1. database.read(personScope): admitMember(action: 'readCopyRows'); storedCopy(); deps.projects.readyDatabaseOf(tx, companyId) dá o host (como syncOf, store.ts:183-190)
//  2. colunas = definition.columns.map(name)   // as colunas do motor (_pass, _account, _account_name) ficam fora (data D31)
//  3. readCopies(reader, [{ text: `SELECT ${colunas.map(quoted)} FROM ${tableOf(name)} LIMIT 6` }], signal)
//  4. ROWS -> rows.slice(0, 5), complete = rows.length <= 5
//     REFUSED 42P01 (tabela ainda não criada) -> amostra vazia, complete true
//     NO_LOGIN -> ensureReader e uma nova tentativa
//     demais -> Failure('COPY_DATABASE_UNAVAILABLE'), com o log COPY_SAMPLE_FAILED
```

A ação `readCopyRows` é nova em `ACTIONS` [visto, `apps/server/src/hub/identity/admission.ts:66-135`]. Nesta parte ela admite só dono e administrador, com o mesmo `statement` de `manageConnections`. A parte 4 a troca pela regra do papel. O desenvolvedor vê colunas e rodadas, e ganha a amostra na parte 4.

### `C5`. A coluna que some na origem

Decisão sua: a coluna fica, marcada inativa. É o que o Lakeflow Connect faz: a coluna apagada na origem fica "inactive" e não é apagada.

O Lakeflow lê o esquema da origem. Uma API não tem esquema, e muitas omitem o campo vazio. Então a regra precisa de um sinal que não acuse a coluna que só está vazia:

> Uma coluna fica **inativa** quando já veio com valor numa passada completa anterior e não veio em nenhuma linha da última passada completa que leu a origem inteira e trouxe ao menos uma linha. Ela volta a **ativa** na primeira passada, de qualquer tipo, em que vier numa linha.

- "Não veio" é o caminho ausente na linha. Hoje `cellOf` trata ausente e nulo do mesmo jeito [visto, `packages/connectors/src/kernel/list.ts:74-76`]. `present` nasce em `cellsOf` [visto, `list.ts:105-117`], com `valueAt` que dá `undefined` no caminho ausente [visto, `packages/connectors/src/kernel/operation.ts:105-113`]: o conjunto das colunas cujo caminho existe em ao menos uma linha da página. `listPageOf` o devolve na página [visto, `list.ts:164-185`]. Não há função `rowsOf` em `list.ts`.
- "Leu a origem inteira" é a passada que começa sem posição guardada e não filtra por alteração: `source.position === null && (since === null || definition.changedSince === null)`. `since` sozinho não basta: `passed` grava `watermark` no fim de toda passada [visto, `apps/server/src/hub/copies/sources.ts:136-142`], e `datesOf` tira `since` dele [visto, `apps/server/src/hub/copies/source-pass.ts:38-46`]. Quem ignora `since` na cópia sem `changedSince` é `listInputOf` [visto, `packages/connectors/src/kernel/list.ts:33`].
- Vale só para a versão 2. Na versão 1 a origem é uma consulta nossa, e a coluna que some faz o Sankhya recusar a consulta: a rodada termina em erro e a tabela aparece **Parada**, que é a verdade.
- Limite conhecido: a cópia que só lê o que mudou não detecta a coluna que sumiu depois da primeira passada. Uma passada completa de vez em quando não está em nenhum marco.

A rodada junta os `present` das páginas e das fontes. O caminho é `pageV2` [visto, `apps/server/src/hub/connectors/copy-port.ts:282-287`], depois `pageStep` [visto, `source-pass.ts:138-159`], e por fim `ended` [visto, `run.ts:89-132`]. A passada conta como inteira só se toda fonte começou a rodada com `position` nula e, ou sem `since`, ou numa definição sem `changedSince` [visto, `source-pass.ts:194`, `:38-46`], e a rodada leu ao menos uma linha. No fim de uma rodada `COMPLETE` ela grava o estado na coluna nova `copies.copy.column_state`. `shownOf(connector, definition, columnState)` ganha o terceiro parâmetro e põe `inactiveSince` em cada coluna.

### `C6`. O contrato

A mudança passa pelo processo da issue `contrato`: um PR pequeno que muda só o contrato e a conformidade [visto, `docs/steps/trilhas/dados.md:60-66`]. A exceção é a decisão `D19` do índice: o PR leva também as linhas `inactiveSince: null` que fazem o repositório compilar (`shownOf`, `routes.test.ts:158` e `:268`, `builder/app-data/context.test.ts:33` e as fixtures da tela), listadas no corpo do PR.

```ts
// packages/hub-api/src/copy-shown.ts
columns: z.array(z.object({
  name: z.string(), type: z.string(), description: z.string().nullable(),
  /** Desde quando a origem parou de mandar a coluna; null enquanto ela vem. */
  inactiveSince: z.iso.datetime().nullable(),
})),

// packages/hub-api/src/company-data.ts
export const CatalogTable = z.object({
  name: z.string(),
  /** O nome que a pessoa lê: o rótulo da cópia. */
  label: z.string(),
  /** Obrigatória: o agente escolhe a tabela por ela. */
  description: z.string().min(1),
  columns: CopyShown.shape.columns,
  kept: TableKept,
})
```

`TABLE_PAGE_ROWS = 200` entra no contrato como o tamanho da página que `rows` devolve (decisão técnica `D5` do índice). A lei 2 de hoje já diz que uma leitura que uma cópia guarda é servida da tabela [visto, `packages/hub-api/src/company-data-conformance.ts:265-268`], então a página é o que o consumidor recebe no lugar da leitura ao vivo, e não uma amostra. A amostra de 5 linhas é da rota `sampleCopy` (`C4`) e da ferramenta de descrever (parte 3).

Lei na conformidade: **toda tabela do catálogo traz descrição**. A conformidade já lê todo catálogo por `Described.parse` [visto, `packages/hub-api/src/company-data-conformance.ts:44-48`], então o `min(1)` faz toda lei falhar num mundo com uma tabela sem descrição, sem assert novo e sem exportar `LAWS` (`:260`). A lei de descrever (`:113-125`) passa a nomear a descrição no seu texto. O caso recusado é um teste de `Catalog.safeParse` e `Described.safeParse` em `packages/hub-api/src/company-data.test.ts`.

### `C7`. `DataSources.catalog` e `DataSources.rows`

Pasta nova `apps/server/src/hub/data/`, da trilha Dados. Ela entra na constante `DATA` do verificador de dependências [visto, `.dependency-cruiser.cjs:20`] e na lista do que a trilha possui [visto, `docs/steps/trilhas/dados.md:31-35`].

```ts
// apps/server/src/hub/data/public.ts
export type DataDeps = {
  database: Database; identity: IdentityPorts; log: FailureLog
  connectors: () => Pick<Connectors, 'catalogSystems'>   // porta nova de hub/connectors (decisão 0056: só ele importa o kit)
  copies: () => CopyService['data']                     // catalogTables e tableRows, portas novas de hub/copies (code C8)
}
/** O contrato já preso a quem pergunta e onde. O `SessionScope` é o de hub/connectors/scope.ts. */
export function createCompanyData(deps: DataDeps): (scope: SessionScope) => CompanyData
//  = (scope) => companyData({ sources: sourcesFor(deps, scope), now: () => new Date() })
```

```ts
// apps/server/src/hub/data/catalog.ts
export async function catalogOf(deps, scope, signal): Promise<Described>
//  uma leitura do Hub (database.read com personScope):
//  systems: no lugar COMPANY, cada conexão ACTIVE da empresa; no lugar PROJECT, só as ACTIVE liberadas ao Projeto (C21, hub/connectors/scope.ts:5) -> { connection, connector, name, reads, actions }
//           pela porta connectors.catalogSystems(tx, scope), que lê offeredIn(tx, idsOf(scope)) (definido em hub/connectors/builder-port.ts:139; a chamada de molde é assistant-port.ts:140-143); reads e actions saem de operationsOf(connector)
//           (hub/connectors/catalog-subjects.ts:7-9), pelo efeito de EFFECT_OF (:4)
//  tables:  pela porta copies.catalogTables(tx, { companyId, only }) (hub/copies/catalog-view.ts, novo); cada cópia visível no lugar -> {
//             name, label,
//             description: shown.description ?? label,
//             columns: shown.columns,
//             kept: { kind: 'COPY', connections, source: shown.source, lastRun: a última rodada que terminou } }
//  visível no lugar:
//    place COMPANY -> toda cópia da empresa, se o papel é dono ou administrador; nenhuma para os outros (a parte 4 abre por papel)
//    place PROJECT -> as cópias liberadas ao Projeto (copies.project_copy), como hoje
//  Failure('DATABASE_UNAVAILABLE') do Hub -> { kind: 'CATALOG_UNAVAILABLE' }; qualquer outra falha sobe

// apps/server/src/hub/data/rows.ts
export async function rowsOf(deps, scope, { table, signal }): Promise<Page>
//  pela porta copies.tableRows({ companyId, name, limit: TABLE_PAGE_ROWS, signal }) (hub/copies/read-table.ts, novo),
//  a mesma leitura de sampleOf (C4), pelo nome da tabela, com LIMIT TABLE_PAGE_ROWS + 1:
//  uma página de até 200 linhas como objetos coluna -> valor, complete = não veio a linha a mais
//  UNAVAILABLE, TIMEOUT, TOO_LARGE, REFUSED 42P01 -> { kind: 'TABLE_UNAVAILABLE' }, com o log DATA_ROWS_FAILED
```

`lastRun` é a última rodada que terminou, e não a que está aberta: o contrato diz "The last run that ended" [visto, `company-data.ts:37-38`]. A lista da página usa a aberta quando há [visto, `apps/server/src/hub/copies/list.ts:60-82`], e continua assim.

`live` e `funnel` são da parte 3. Nesta parte eles respondem `NOT_GRANTED`, e nenhum consumidor os chama.

### `C8`. A página Dados

A página Cópias de hoje vira a página Dados. Os componentes ficam em `apps/web/src/hub/copies/` e mudam de forma.

| Tela do escopo | O que muda | Peça de hoje |
| --- | --- | --- |
| `p1-01` Dados, Bruto | A lista agrupa por sistema e ganha descrição. As propostas do Construtor ficam no topo | `CopyList` [visto, `apps/web/src/hub/copies/copy-list.tsx:400`], `ProposalTableRow` [`copy-proposal.tsx:229`], `CopyMenu` [`copy-list.tsx:140`] |
| `p1-02` Tabela, Colunas | A página de uma cópia ganha abas. Colunas é a primeira | `copy-detail.tsx:121` |
| `p1-03` Tabela, Amostra | Aba nova, com `sampleCopy`. Dono e administrador | nenhuma |
| `p1-04` coluna inativa | Aviso no topo e a marca **Inativa desde** na coluna | nenhuma |
| `p1-05` Tabela, Rodadas | As rodadas de hoje viram uma aba | `copy-detail.tsx:121` |
| `p1-06` Dados, Apps | As tabelas de cada app por Projeto, com `listAppTables` | `DataPage` [visto, `apps/web/src/hub/apps/data.tsx:116`] |
| `p1-07` Negócio vazio | Estado vazio com a explicação do que é um conceito | `Empty` de `apps/web/src/ui/states.tsx` |
| `p1-08` a `p1-10` | Vazio, carregando e erro | `Empty` e `ReadFailure` de `ui/states.tsx`, `Skeleton` de `ui/skeleton.tsx` |

- **Rotas.** `copies.index.tsx` e `copies.$copyId.tsx` passam a `data.index.tsx` e `data.$copyId.tsx` [visto, `apps/web/src/routes/_app/companies/$companyId/copies.index.tsx:6`, `copies.$copyId.tsx:13`]. O endereço antigo redireciona para o novo, porque há links e endereços guardados que apontam para ele [visto, `apps/web/src/routes/_app/companies/$companyId/route.tsx:89`, `apps/web/src/hub/projects/project-copies.tsx:72`]. O cartão de proposta na conversa não aponta para a página; só o texto `MANAGERS_ENABLE` a nomeia [visto, `apps/web/src/hub/copies/text.ts:45`].
- **Trilho.** O item **Cópias** vira **Dados**, no mesmo lugar e com a mesma condição `may.manageCopies` [visto, `apps/web/src/routes/_app/companies/$companyId/route.tsx:87`]. O membro passa a ver o item na parte 4 (tela `p1-11`).
- **Abas.** As camadas e as abas da tabela ficam no endereço, com `apps/web/src/ui/tabs.tsx`, como o Projeto já faz [visto, `apps/web/src/hub/projects/area.tsx:48`].
- **Busca.** No cliente, sobre a lista já carregada, como as outras listas do Hub [visto, `apps/web/src/builder/assistant/choice-list.tsx:21-26`]. `matches` só baixa a caixa, então a busca desta página tira também os acentos (NFD sem diacríticos).
- **Textos.** Em `apps/web/src/hub/copies/text.ts`.

A forma da lista segue o conteúdo de um catálogo de dados (descrição, origem, frescor), e não a forma dele: três abas fixas, sem árvore e sem pasta.

## Modelo de dados

### Banco do Hub

Uma coluna, numa migração que só acrescenta (data D6):

```ts
// apps/server/src/hub/copies/tables.ts, tabela copy
// O estado de cada coluna da origem: quando veio pela última vez e desde quando não vem (parte 1, C5).
columnState: jsonb('column_state').notNull().default({}),
// check: jsonb_typeof(column_state) = 'object'
```

Forma, lida de novo por um esquema zod a cada uso (code C27):

```ts
const ColumnState = z.record(z.string(), z.object({
  seenAt: z.iso.datetime(),                    // a última passada em que a coluna veio numa linha
  inactiveSince: z.iso.datetime().nullable(),  // o começo da passada que a deu por sumida
}))
```

Quem escreve: a rodada, em `ended` [visto, `apps/server/src/hub/copies/run.ts:89-132`]. Quem lê: `shownOf` (data D18).

Duas permissões novas para `hub_company`, num PR próprio com a palavra do fundador (data D11): `UPDATE(column_state)` para a rodada gravar o estado, e `UPDATE(definition)` para a rodada preencher a descrição (`C2`, passo 3). Hoje o login do Hub não atualiza nenhuma das duas [visto, `apps/server/database-grants.sql:373-381`].

### Banco da empresa

Um login novo, `conexus_read`, com `USAGE` em `sync` e `SELECT` em todas as tabelas dele, as de hoje e as futuras. Nenhuma tabela nova.

### As descrições das cinco cópias do Sankhya

As tabelas e colunas são as que a decisão 0063 mediu num Sankhya real [visto, `packages/connectors/src/sankhya/copies.ts:4-8`]. Os textos são desta spec, e o construtor os copia como estão.

| Cópia | Descrição da tabela |
| --- | --- |
| `clientes` | Parceiros do Sankhya: clientes e fornecedores, um por linha, com nome, tipo de pessoa e se está ativo. |
| `vendedores` | Vendedores do Sankhya, um por linha, com o apelido e se está ativo. |
| `produtos` | Produtos do Sankhya, um por linha, com descrição, referência, grupo, unidade e marca. |
| `vendas` | Cabeçalho de cada venda e pedido de venda do Sankhya: data, cliente, vendedor, valor e situação. Uma linha por nota. |
| `itens_venda` | Itens de cada venda e pedido de venda do Sankhya: produto, quantidade, valor unitário e total. Uma linha por item. |

| Coluna | Descrição |
| --- | --- |
| `CODPARC` | Código do parceiro no Sankhya. |
| `NOMEPARC` | Nome do parceiro. |
| `RAZAOSOCIAL` | Razão social do parceiro. |
| `TIPPESSOA` | Tipo de pessoa: F física, J jurídica. |
| `ATIVO` | S quando o cadastro está ativo, N quando não. |
| `CLIENTE` | S quando o parceiro é cliente. |
| `FORNECEDOR` | S quando o parceiro é fornecedor. |
| `DTALTER` | Data e hora da última alteração do registro no Sankhya. |
| `CODVEND` | Código do vendedor no Sankhya. |
| `APELIDO` | Apelido do vendedor. |
| `CODPROD` | Código do produto no Sankhya. |
| `DESCRPROD` | Descrição do produto. |
| `REFERENCIA` | Referência do produto. |
| `CODGRUPOPROD` | Código do grupo do produto. |
| `DESCRGRUPOPROD` | Nome do grupo do produto. |
| `CODVOL` | Unidade de venda. |
| `MARCA` | Marca do produto. |
| `NUNOTA` | Número único da nota no Sankhya. É a chave da venda. |
| `NUMNOTA` | Número da nota fiscal. |
| `CODEMP` | Código da empresa (filial) da venda. |
| `CODTIPOPER` | Código do tipo de operação (TOP). |
| `TIPMOV` | Tipo de movimento: V venda, P pedido de venda. |
| `DTNEG` | Data da negociação. |
| `VLRNOTA` | Valor total da nota. |
| `STATUSNOTA` | Situação da nota no Sankhya. |
| `SEQUENCIA` | Sequência do item dentro da nota. |
| `QTDNEG` | Quantidade negociada do item. |
| `VLRUNIT` | Valor unitário do item. |
| `VLRTOT` | Valor total do item. |

A coluna `CGC_CPF` de `clientes` recebe a descrição "CPF ou CNPJ do parceiro. Retido em toda leitura." A regra nova de `assertCopy` recusa uma coluna sem descrição, e a coluna só sai da cópia na parte 4 (decisão E5a).

## Propriedades de correção

Cada propriedade diz o que vale para toda entrada, e os critérios que valida.

1. **Nome com o sistema na frente.** Para todo conector e todo modelo, a cópia ligada do modelo tem nome `prefixo(conector) + modelo`, e para toda proposta aceita o nome começa com o prefixo do conector dela. *Valida: requisitos 1.1, 1.2, 1.3.*
2. **Descrição nunca vazia no catálogo.** Para toda cópia, `catalog()` devolve a tabela com `description` de ao menos um caractere. *Valida: requisitos 2.1, 2.5, 6.2.*
3. **Preencher não troca.** Para toda definição guardada, preencher as descrições que faltam deixa iguais as que existiam, e rodar duas vezes dá o mesmo que rodar uma. *Valida: requisito 2.4.*
4. **O login de leitura não escreve e não sai de `sync`.** Para toda consulta mandada como `conexus_read`, uma escrita é recusada e uma tabela fora de `sync` é recusada. *Valida: requisitos 3.1, 3.2.*
5. **A amostra nunca passa de 5 linhas e nunca traz coluna do motor.** *Valida: requisitos 4.1, 4.3.*
6. **Inativa só depois de vista.** Para toda sequência de passadas, uma coluna só fica inativa se veio numa passada completa anterior, e volta a ativa na primeira passada em que vier. *Valida: requisitos 5.1 a 5.4.*
7. **O catálogo lista o que o lugar pode ler, e só isso.** Num Projeto, as tabelas do catálogo são exatamente as cópias liberadas a ele. Na empresa, são todas as cópias para o dono e o administrador, e nenhuma para os outros papéis. *Valida: requisitos 6.3, 6.4.*

## Tratamento de erros

Nenhum erro é engolido: nada de `catch` genérico, `.catch(() => null)` nem pulo silencioso. Cada falha tem um nome, um log e uma resposta.

| Onde | O que falha | Resposta | Log |
| --- | --- | --- | --- |
| `catalogOf` | O banco do Hub não respondeu | `{ kind: 'CATALOG_UNAVAILABLE' }` [visto, `company-data.ts:51`] | `DATA_CATALOG_FAILED` |
| `rowsOf` | O banco da empresa não respondeu, passou do prazo ou do tamanho | `{ kind: 'TABLE_UNAVAILABLE' }` [visto, `company-data.ts:106-107`]. A tabela não é lida ao vivo no lugar | `DATA_ROWS_FAILED` com o motivo |
| `sampleOf` | O mesmo, na rota | 503 `COPY_DATABASE_UNAVAILABLE` | `COPY_SAMPLE_FAILED` |
| `sampleOf`, `rowsOf` | `NO_LOGIN` | `ensureReader` e uma nova tentativa. Se repetir, a linha de cima | `COPY_READER_MADE` |
| `sampleOf` | A tabela ainda não existe (`42P01`) | Amostra vazia, `complete: true` | nenhum: é o estado antes da primeira rodada |
| `rowsOf` | A tabela ainda não existe (`42P01`) | `{ kind: 'TABLE_UNAVAILABLE' }` | `DATA_ROWS_FAILED` com o motivo `NO_TABLE` |
| `ensureReader` | O banco recusou | A resposta do banco sobe para quem chamou, que falha com `COPY_DATABASE_UNAVAILABLE` | `COPY_DATABASE_FAILED` com o SQLSTATE [visto, `enable.ts:156-159`] |
| `propose` | Nome sem o prefixo, coluna sem descrição | A resposta `MALFORMED` volta ao Construtor com os itens `COPY_NAME_PREFIX` e `COPY_COLUMN_UNDESCRIBED` | o log de recusa que `propose` já faz |
| A rodada, ao preencher descrição | O modelo não existe mais no kit | A rodada segue sem preencher. A tabela mostra o rótulo como descrição | `COPY_MODEL_GONE`, uma vez por rodada |
| A página Dados | A leitura falhou | "Não deu para ler o catálogo agora." com **Tentar de novo**. Nunca dado velho como novo | o do cliente HTTP |

## Estratégia de teste

Os testes da CI usam dublês. Nenhum teste desta parte lê o Sankhya real.

**Onde cada coisa é provada**

| O que | Como | Modelo a seguir |
| --- | --- | --- |
| Regra de nome e descrição do modelo | Teste do kit e teste de rota de `enableCopy` com o dublê do Sankhya | `packages/connectors/src/sankhya/sankhya.test.ts:13`, `apps/server/src/hub/copies/test-copies.ts` |
| `ensureReader`, `readCopies` | Banco de empresa descartável. Uma escrita e uma tabela de fora são recusadas pelo banco | `apps/server/src/platform/test-company-postgres.ts:119`, recusas `42501` em `apps/server/src/hub/copies/grants.test.ts:63-92` |
| Coluna inativa | Teste do kit para `present`, e teste da rodada com um dublê que para de mandar um campo | `packages/connectors/src/kernel/list-fixture.ts` |
| Contrato | A lei nova na conformidade, com o caso recusado | `packages/hub-api/src/company-data.test.ts:146` |
| `catalogOf`, `rowsOf` | Pela porta pública do servidor, com o Hub de teste (testing T5) | `apps/server/src/hub/copies/test-copies.ts` |
| Página Dados | Teste de tela ao lado, com msw e `hubServer()` | `apps/web/src/hub/copies/test-hub.tsx:291`, `copy-list.test.tsx` |
| As telas | QA em navegador real, a 1366 e 390 px, nos dois temas (testing T23, `T25`) | skill `conexus-qa` |

**As leis de conformidade desta parte**

1. Toda tabela do catálogo traz descrição.
2. O catálogo de um Projeto lista só as cópias liberadas a ele.
3. `read` de uma tabela devolve no máximo `TABLE_PAGE_ROWS` linhas (200) e `complete: false` quando há mais.
4. O banco da empresa calado dá `TABLE_UNAVAILABLE`, e nenhuma leitura ao vivo acontece no lugar. Esta já é lei [visto, `company-data-conformance.ts:260-302`]. A conformidade inteira (`runDataConformance`) não roda contra a implementação desta parte, porque as outras leis pedem `live` e `funnel`, que respondem `NOT_GRANTED` até a parte 3. Nesta parte as leis 1 a 4 são provadas pela porta `hub.data` do Hub de teste, e a corrida inteira entra na parte 3.

**As perguntas com resposta conhecida**

Usam a empresa do exemplo, a Lume, com o dublê do Sankhya e os seus dois apps de teste. Ilustram e não viram regra.

| Pergunta | Resposta esperada |
| --- | --- |
| Lea liga as cinco cópias do Sankhya. Que tabelas a página Dados mostra? | `sankhya_clientes`, `sankhya_itens_venda`, `sankhya_produtos`, `sankhya_vendas`, `sankhya_vendedores`, cada uma com a descrição da tabela acima |
| Lea abre `sankhya_vendas`, aba Colunas | 11 colunas, cada uma com tipo e descrição. Nenhuma `_pass` |
| Lea abre a aba Amostra | 5 linhas do dublê, e a marca de que há mais |
| No Projeto do CRM, com `sankhya_clientes` liberada, o que `describe()` devolve? | Uma tabela, `sankhya_clientes`, com `kept.lastRun` da última rodada completa |
| O dublê para de mandar um campo de uma cópia da versão 2 | Depois da próxima passada completa, a coluna aparece **Inativa desde** a data, e continua na lista |

**Mutações à mão (testing T27).** Cada tarefa lista as linhas-chave a mutar. As desta parte: o prefixo em `modelCopyName`, o `LIMIT` da amostra, a condição "já vista" da coluna inativa, o filtro de Projeto do catálogo e `default_transaction_read_only`.

## Tabela de referência

Uma linha por peça que o roteiro de uso toca, com o veredito da regra `C75`: **nativo** usa a peça como ela é, **embrulhado** a usa por trás de uma função nossa, **remendo** é código nosso onde não há peça.

| Peça | Hoje no `main` | Referência | Veredito |
| --- | --- | --- | --- |
| Nome da tabela | `enable.ts:73` | Um prefixo por fonte, o padrão de um catálogo que junta fontes | nativo (uma função pura) |
| Descrição de tabela e coluna | `copy.ts:122`, `:129`, `copy-sql.ts:63-88` | `COMMENT ON` do Postgres. Comentário como campo próprio de cada tabela e coluna, o padrão de um catálogo de dados | nativo |
| Login de leitura | `app-read.ts:41-67` | Papéis e `GRANT` do Postgres. A prova foi rodada no Postgres 18 (`D1` do índice) | nativo |
| Amostra | nenhuma | Uma amostra de 5 linhas ao lado da descrição, o padrão de um catálogo de dados | nativo (`SELECT ... LIMIT`) |
| Coluna inativa | nenhuma | Lakeflow Connect | remendo: uma API não tem esquema, então o sinal é nosso. A regra "só depois de vista" é [ideia nossa] |
| Catálogo | `store.ts:200-215`, `list.ts:119-161` | "It's the core of everything". `information_schema` filtrado pelo privilégio | embrulhado: junta o que o Hub já guarda. O Mastra não tem peça de catálogo |
| Página Dados | `copy-list.tsx:400`, `copy-detail.tsx:121` | O conteúdo de um catálogo de dados: descrição, origem, frescor | nativo (as peças de `apps/web/src/ui/`) |
