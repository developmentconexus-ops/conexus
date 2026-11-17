import { parseSync } from 'libpg-query'
import { z } from 'zod'
import type { ReadResult } from '../../platform/app-sql.ts'

export type PlanVerdict = Readonly<
  | { kind: 'READS'; tables: readonly string[] }
  | { kind: 'OUTSIDE'; reason: 'SCHEMA' | 'FUNCTION' | 'REG_TYPE' }
  | { kind: 'UNREADABLE' }
>

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

function planNodes(node: PlanNode): PlanNode[] {
  return [node, ...(node.Plans ?? []).flatMap(planNodes)]
}

function lastName(names: readonly z.infer<typeof NameNode>[]): string {
  return names.at(-1)?.String.sval ?? ''
}

type Names = { functions: string[]; types: string[] }

/** Every function called and every type cast to, anywhere in the statement's tree. */
function namesIn(tree: unknown, found: Names): void {
  if (Array.isArray(tree)) {
    for (const each of tree) namesIn(each, found)
    return
  }
  if (typeof tree !== 'object' || tree === null) return
  for (const [key, value] of Object.entries(tree)) {
    const call = key === 'FuncCall' ? Call.safeParse(value) : undefined
    const cast = key === 'TypeCast' ? Cast.safeParse(value) : undefined
    if (call?.success) found.functions.push(lastName(call.data.funcname))
    if (cast?.success) found.types.push(lastName(cast.data.typeName.names))
    namesIn(value, found)
  }
}

/**
 * What the query reads: the plan's relations must all sit in `sync`, and the statement calls no
 * function that reads by name and casts to no `reg*` type. The login of the role is the wall; this
 * keeps a name from reaching around it (decision R.3).
 */
export function planVerdict(sql: string, explained: ReadResult): PlanVerdict {
  const parsed = Explained.safeParse(explained.rows[0]?.[0])
  if (!parsed.success) return { kind: 'UNREADABLE' }
  const nodes = planNodes(parsed.data[0].Plan)
  if (nodes.some(({ Schema }) => Schema !== undefined && Schema !== 'sync')) {
    return { kind: 'OUTSIDE', reason: 'SCHEMA' }
  }
  const found: Names = { functions: [], types: [] }
  namesIn(parseSync(sql).stmts, found)
  if (found.functions.some((name) => REFUSED_FUNCTIONS.some((one) => one.test(name)))) {
    return { kind: 'OUTSIDE', reason: 'FUNCTION' }
  }
  if (found.types.some((name) => name.startsWith('reg'))) {
    return { kind: 'OUTSIDE', reason: 'REG_TYPE' }
  }
  const tables = nodes.flatMap((node) =>
    node.Schema === 'sync' && node['Relation Name'] !== undefined ? [node['Relation Name']] : [],
  )
  return { kind: 'READS', tables: [...new Set(tables)] }
}
