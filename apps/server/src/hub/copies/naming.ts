import type { ConnectorId } from '@conexus/hub-api'
import { CopyName } from '../connectors/public.ts'

/** `mercado-livre` + `pedidos` = `mercado_livre_pedidos`: the connector's id with `-` as `_`. */
export function copyPrefixOf(connectorId: ConnectorId): string {
  return `${connectorId.replaceAll('-', '_')}_`
}

export function modelCopyName(connectorId: ConnectorId, model: string): CopyName {
  return CopyName.parse(`${copyPrefixOf(connectorId)}${model}`)
}

/** The refusal's item when a proposed name lacks the connector's prefix; none when it has it. */
export function namePrefixIssue(connectorId: ConnectorId, name: CopyName): string | undefined {
  const prefix = copyPrefixOf(connectorId)
  return name.startsWith(prefix)
    ? undefined
    : `name: COPY_NAME_PREFIX: the name starts with "${prefix}".`
}
