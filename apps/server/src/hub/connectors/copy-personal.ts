import type { Connector, CopyDefinitionV2, Operation, PersonalKind } from '@conexus/connectors'
import { listReadOf } from './list-read.ts'

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
    const holding = declared
      .filter((field) => path === field.path || path.startsWith(`${field.path}.`))
      .toSorted((a, b) => b.path.length - a.path.length)
    const [deepest] = holding
    if (deepest !== undefined) kinds.set(name, deepest.kind)
  }
  return kinds
}

/** The kinds a copy keeps: the ones its columns hold. */
export function keptKindsOf(
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
