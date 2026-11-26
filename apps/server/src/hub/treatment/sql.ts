import { TableRef } from '@conexus/hub-api'
import type { Named } from '../../platform/failure.ts'
import {
  EntityContextType,
  TableDeclareType,
  TrinoEntityCollector,
  TrinoSQL,
} from './trino-parser.mjs'

export type ModelSql =
  | Readonly<{ kind: 'QUERY'; inputs: TableRef[] }>
  | Readonly<{
      kind: 'REFUSED'
      code:
        | 'TREATMENT_SQL_INVALID'
        | 'TREATMENT_SQL_NOT_A_QUERY'
        | 'TREATMENT_SQL_TEMPLATE'
        | 'TREATMENT_INPUT_UNQUALIFIED'
      detail: Pick<Named, 'position' | 'table'>
    }>

const trino = new TrinoSQL()
const JINJA = /\{[{%#]/
const A_QUERY = /^(select|with)\b/i
const AREA_AND_TABLE = /^("?)(\w+)\1\.("?)(\w+)\3$/
const ONE_QUOTED_NAME = /^(?:"(?:[^"]|"")*"|`(?:[^`]|``)*`)$/

function refused(
  code: Extract<ModelSql, { kind: 'REFUSED' }>['code'],
  detail: Pick<Named, 'position' | 'table'> = {},
): ModelSql {
  return { kind: 'REFUSED', code, detail }
}

function tableRefOf(written: string): TableRef | undefined {
  const [, , layer, , table] = AREA_AND_TABLE.exec(written.toLowerCase()) ?? []
  return TableRef.safeParse({ layer, table }).data
}

export function readModelSql(sql: string): ModelSql {
  if (JINJA.test(sql)) return refused('TREATMENT_SQL_TEMPLATE')
  const [error] = trino.validate(sql)
  if (error !== undefined) {
    const position = { line: error.startLine, column: error.startColumn }
    return refused('TREATMENT_SQL_INVALID', { position })
  }
  const [statement, second] = trino.splitSQLByStatement(sql) ?? []
  if (statement === undefined || second !== undefined || !A_QUERY.test(statement.text)) {
    return refused('TREATMENT_SQL_NOT_A_QUERY')
  }
  // `getAllEntities` parses again without the library's error strategy and prints to the console on
  // a valid `join ... on true`, so the same collector walks the tree `parse` builds.
  const collector = new TrinoEntityCollector(sql, trino.getAllTokens(sql))
  trino.listen(collector, trino.parse(sql))
  const inputs = new Map<string, TableRef>()
  for (const entity of collector.getEntities()) {
    if (entity.entityContextType !== EntityContextType.TABLE) continue
    // The collector binds a CTE by its unquoted text, so a CTE named "raw.x" would pass the real
    // table raw.x off as itself.
    const dottedName = ONE_QUOTED_NAME.test(entity.text) && entity.text.includes('.')
    if (!dottedName && entity.declareType === TableDeclareType.EXPRESSION) continue
    const input = tableRefOf(entity.text)
    if (input === undefined) {
      return refused('TREATMENT_INPUT_UNQUALIFIED', { table: entity.text })
    }
    inputs.set(`${input.layer}.${input.table}`, input)
  }
  const sorted = [...inputs].sort(([a], [b]) => a.localeCompare(b))
  return { kind: 'QUERY', inputs: sorted.map(([, input]) => input) }
}
