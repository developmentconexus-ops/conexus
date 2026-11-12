import type { Connector, CopyDefinitionV2, Operation, PersonalKind } from '@conexus/connectors'
import { personalHolding } from '@conexus/connectors'
import type { CompanyId, PersonId } from '@conexus/hub-api'
import { listReadOf } from './list-read.ts'
import type { Deps } from './rows.ts'
import { personalKindsOf } from './rows.ts'

/**
 * The kind of each column of a version 2 definition: the one of the most specific declared path
 * that holds the column's `path` (the path itself, or one above it); a column no path holds has no
 * kind and is not listed.
 */
function personalColumnsOf(
  definition: CopyDefinitionV2,
  operation: Pick<Operation<unknown, unknown, 'read'>, 'personal'>,
): ReadonlyMap<string, PersonalKind> {
  const declared = operation.personal ?? []
  const kinds = new Map<string, PersonalKind>()
  for (const { name, path } of definition.columns) {
    const [deepest] = personalHolding(declared, path)
    if (deepest !== undefined) kinds.set(name, deepest.kind)
  }
  return kinds
}

/** The kinds a copy keeps: the ones its columns hold. */
function keptKindsOf(
  definition: CopyDefinitionV2,
  operation: Pick<Operation<unknown, unknown, 'read'>, 'personal'>,
): PersonalKind[] {
  return [...new Set(personalColumnsOf(definition, operation).values())]
}

/** The kind of each column in a connector of the kit's; none when the connector or its list read is not there. */
export function personalColumnsIn(
  kit: Connector | undefined,
  definition: CopyDefinitionV2,
): ReadonlyMap<string, PersonalKind> {
  const found = kit === undefined ? undefined : listReadOf(kit, definition)
  return found === undefined ? new Map() : personalColumnsOf(definition, found.operation)
}

/**
 * The kinds the copy keeps that its owner's role holds now, read at each page, as an app's version
 * before the field reads (decision F1): a copy bound before the Ligar checked the kinds never keeps
 * more than who bound it sees, and none when that person left.
 */
export async function keptNow(
  deps: Deps,
  a: {
    companyId: CompanyId
    enabledBy: PersonId
    definition: CopyDefinitionV2
    operation: Pick<Operation<unknown, unknown, 'read'>, 'personal'>
  },
): Promise<PersonalKind[]> {
  const kept = keptKindsOf(a.definition, a.operation)
  if (kept.length === 0) return kept
  const { companyId, enabledBy } = a
  const held = await personalKindsOf(deps, { person: { id: enabledBy }, companyId }, enabledBy)
  return kept.filter((kind) => held.includes(kind))
}
