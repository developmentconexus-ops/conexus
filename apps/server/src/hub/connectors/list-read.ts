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

/** What a proposal's version 2 definition fails against the connector's list read: a path and a message each, none when it fits. */
export function listIssuesOf(connector: Connector, definition: CopyDefinitionV2): string[] {
  const { operation: id, input } = definition.source
  const found = listReadOf(connector, definition)
  if (found === undefined)
    return [`definition.source.operation: ${id} is not a read of ${connector.id} that lists rows.`]
  const { operation, list } = found
  const issues: string[] = []
  if (definition.changedSince !== null) {
    const column = definition.columns.find((each) => each.name === definition.changedSince?.column)
    if (list.changed === null)
      issues.push(`definition.changedSince: ${id} does not filter by change; copy it whole.`)
    else if (column?.path !== list.changed.field)
      issues.push(`definition.changedSince.column: its column's path is ${list.changed.field}.`)
  }
  const filled = new Set(listInputNames(list))
  for (const name of Object.keys(input).filter((each) => filled.has(each)))
    issues.push(`definition.source.input.${name}: the copy's paging fills ${name}.`)
  if (issues.length > 0) return issues
  const value = listInputOf({ list, definition, position: null, since: null })
  const parsed = operation.input.safeParse(value)
  if (parsed.success) return []
  return parsed.error.issues.map(
    (issue) => `${['definition.source.input', ...issue.path].join('.')}: ${issue.message}`,
  )
}
