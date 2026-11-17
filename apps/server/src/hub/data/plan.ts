import { parseSync } from 'libpg-query'
import { z } from 'zod'
import type { ReadResult } from '../../platform/app-sql.ts'

type Outside = Readonly<{ kind: 'OUTSIDE'; reason: 'SCHEMA' | 'FUNCTION' | 'REG_TYPE' }>

export type PlanVerdict = Readonly<
  { kind: 'READS'; tables: readonly string[] } | Outside | { kind: 'UNREADABLE' }
>

/** What the statement says before it runs: a verdict that stops it, or nothing against it. */
export type StatementVerdict = Outside | Readonly<{ kind: 'CLEAR' }>

/** The functions that read an object by a name or a query text, whatever schema it sits in. */
const REFUSED_FUNCTIONS: readonly RegExp[] = [
  /^query_to_/,
  /^cursor_to_/,
  /^table_to_/,
  /^schema_to_/,
  /^database_to_/,
  /^pg_/,
  /^to_reg/,
  /^has_.*_privilege$/,
  /^current_setting$/,
  /^set_config$/,
  /^ts_stat$/,
  /^ts_rewrite$/,
]

type PlanNode = { 'Relation Name'?: string; Schema?: string; Plans?: PlanNode[] }

const PlanNode: z.ZodType<PlanNode> = z.lazy(() =>
  z.looseObject({
    'Relation Name': z.string().optional(),
    Schema: z.string().optional(),
    Plans: z.array(PlanNode).optional(),
  }),
)
const Explained = z.tuple([z.looseObject({ Plan: PlanNode })])

const NameNode = z.object({ String: z.object({ sval: z.string() }) })
const Call = z.object({ funcname: z.array(NameNode).min(1) })
const Cast = z.object({ typeName: z.object({ names: z.array(NameNode).min(1) }) })
const Relation = z.object({ schemaname: z.string().optional(), relname: z.string() })

type Names = { functions: string[]; types: string[]; relations: z.infer<typeof Relation>[] }

function lastName(names: readonly z.infer<typeof NameNode>[]): string {
  return names.at(-1)?.String.sval ?? ''
}

const TAKERS = {
  FuncCall: (value: unknown, found: Names) => {
    const call = Call.safeParse(value)
    if (call.success) found.functions.push(lastName(call.data.funcname))
  },
  TypeCast: (value: unknown, found: Names) => {
    const cast = Cast.safeParse(value)
    if (cast.success) found.types.push(lastName(cast.data.typeName.names))
  },
  RangeVar: (value: unknown, found: Names) => {
    const relation = Relation.safeParse(value)
    if (relation.success) found.relations.push(relation.data)
  },
} as const

function isTaker(key: string): key is keyof typeof TAKERS {
  return key in TAKERS
}

/** Every function called, type cast to and relation named, anywhere in the statements' tree. */
function namesIn(tree: unknown, found: Names): void {
  if (typeof tree !== 'object' || tree === null) return
  for (const [key, value] of Object.entries(tree)) {
    if (isTaker(key)) TAKERS[key](value, found)
    namesIn(value, found)
  }
}

function outsideSync({ schemaname, relname }: z.infer<typeof Relation>): boolean {
  return schemaname === undefined ? relname.startsWith('pg_') : schemaname !== 'sync'
}

/**
 * What the text names before anything runs: a relation outside `sync`, a function that reads by
 * name or by query text, a cast to a `reg*` type. The login of the role is the wall; this keeps a
 * name, or an error that quotes one, from reaching around it (decision R.3). Text the parser
 * refuses is left clear: PostgreSQL gives that refusal itself, and runs nothing.
 */
export function statementVerdict(sql: string): StatementVerdict {
  const found: Names = { functions: [], types: [], relations: [] }
  try {
    namesIn(parseSync(sql).stmts, found)
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { kind: 'CLEAR' }
  }
  if (found.relations.some(outsideSync)) return { kind: 'OUTSIDE', reason: 'SCHEMA' }
  if (found.functions.some((name) => REFUSED_FUNCTIONS.some((one) => one.test(name)))) {
    return { kind: 'OUTSIDE', reason: 'FUNCTION' }
  }
  if (found.types.some((name) => name.startsWith('reg'))) {
    return { kind: 'OUTSIDE', reason: 'REG_TYPE' }
  }
  return { kind: 'CLEAR' }
}

function relationsOf(node: PlanNode): PlanNode[] {
  const own = node['Relation Name'] === undefined ? [] : [node]
  return [...own, ...(node.Plans ?? []).flatMap(relationsOf)]
}

/** What the plan reads: every relation in it must sit in `sync`; a function scan has none, and its name was judged before. */
export function planVerdict(explained: ReadResult): PlanVerdict {
  const parsed = Explained.safeParse(explained.rows[0]?.[0])
  if (!parsed.success) return { kind: 'UNREADABLE' }
  const relations = relationsOf(parsed.data[0].Plan)
  if (relations.some(({ Schema }) => Schema !== 'sync')) {
    return { kind: 'OUTSIDE', reason: 'SCHEMA' }
  }
  const tables = relations.flatMap((node) => node['Relation Name'] ?? [])
  return { kind: 'READS', tables: [...new Set(tables)] }
}
