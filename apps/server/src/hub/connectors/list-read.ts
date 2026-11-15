import type { Connector, CopyDefinitionV2, Operation } from '@conexus/connectors'
import { listInputNames, listInputOf } from '@conexus/connectors'

function isListRead(
  operation: Operation<unknown, unknown>,
  id: string,
): operation is Operation<unknown, unknown, 'read'> {
  return operation.id === id && operation.class === 'read' && operation.list !== undefined
}

/** The list read a version 2 definition names, among the connector's operations; none when it declares no such read. */
export function listReadOf(connector: Connector, definition: CopyDefinitionV2) {
  const operation = connector.operations.find((each) =>
    isListRead(each, definition.source.operation),
  )
  const list = operation?.list
  return operation === undefined || list === undefined ? undefined : { operation, list }
}

/** What the operation and fixed input of a proposal fail against the connector's list read: the read is not one that lists rows, or the input names what the paging fills. */
export function sourceIssuesOf(
  connector: Connector,
  source: { operation: string; input: Readonly<Record<string, unknown>> },
): string[] {
  const { operation: id, input } = source
  const found = connector.operations.find((each) => isListRead(each, id))
  if (found?.list === undefined)
    return [`definition.source.operation: ${id} is not a read of ${connector.id} that lists rows.`]
  const filled = new Set(listInputNames(found.list))
  return Object.keys(input)
    .filter((each) => filled.has(each))
    .map((name) => `definition.source.input.${name}: the copy's paging fills ${name}.`)
}

/** What a proposal's version 2 definition fails against the connector's list read: a path and a message each, none when it fits. */
export function listIssuesOf(connector: Connector, definition: CopyDefinitionV2): string[] {
  const { operation: id } = definition.source
  const found = listReadOf(connector, definition)
  if (found === undefined) return sourceIssuesOf(connector, definition.source)
  const { operation, list } = found
  const issues: string[] = sourceIssuesOf(connector, definition.source)
  if (definition.changedSince !== null) {
    const column = definition.columns.find((each) => each.name === definition.changedSince?.column)
    if (list.changed === null)
      issues.push(`definition.changedSince: ${id} does not filter by change; copy it whole.`)
    else if (column?.path !== list.changed.field)
      issues.push(`definition.changedSince.column: its column's path is ${list.changed.field}.`)
  }
  if (issues.length > 0) return issues
  const value = listInputOf({ list, definition, position: null, since: null })
  const parsed = operation.input.safeParse(value)
  if (parsed.success) return []
  return parsed.error.issues.map(
    (issue) => `${['definition.source.input', ...issue.path].join('.')}: ${issue.message}`,
  )
}
