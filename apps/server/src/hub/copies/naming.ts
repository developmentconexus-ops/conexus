import type { ConnectorId } from '@conexus/hub-api'
import { CopyName, copyPrefixOf } from '../connectors/public.ts'

export function modelCopyName(connectorId: ConnectorId, model: string): CopyName {
  return CopyName.parse(`${copyPrefixOf(connectorId)}${model}`)
}

export function namePrefixIssue(connectorId: ConnectorId, name: CopyName): string | undefined {
  const prefix = copyPrefixOf(connectorId)
  return name.startsWith(prefix)
    ? undefined
    : `name: COPY_NAME_PREFIX: the name starts with "${prefix}".`
}
