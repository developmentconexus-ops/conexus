import { ASSISTANT_CONTROLLER, ASSISTANT_TOOL, BUILDER_TOOL, ShownFile } from '@conexus/hub-api'
import { BuildingIcon, PresentationIcon, RocketIcon } from 'lucide-react'
import { readOutcome } from './connector-specs.ts'
import type { Room } from './room.ts'
import type { ToolItem } from './rows.ts'
import type { ToolSpec } from './tool-spec.ts'

/** The rows of the Assistant's own tools (step 24.1, U4); the connector tools it shares are in `connector-specs.ts`. */
export const ASSISTANT_SPECS: Record<
  (typeof ASSISTANT_TOOL)[keyof typeof ASSISTANT_TOOL],
  ToolSpec
> = {
  [ASSISTANT_TOOL.overview]: {
    icon: BuildingIcon,
    running: 'Olhando os Projetos e as ligações da empresa',
    done: 'Olhou os Projetos e as ligações da empresa',
    failed: 'Não conseguiu olhar a empresa',
    verb: 'olhou a empresa',
    body: 'generic',
    groups: true,
  },
  [ASSISTANT_TOOL.showFile]: {
    icon: PresentationIcon,
    running: 'Preparando um arquivo para mostrar',
    done: 'Mostrou um arquivo',
    failed: 'Não conseguiu mostrar o arquivo',
    verb: 'mostrou',
    detailKey: 'path',
    body: 'shown',
    groups: false,
  },
  [ASSISTANT_TOOL.proposeApp]: {
    icon: RocketIcon,
    running: 'Preparando o pedido do app',
    done: 'Propôs um app',
    failed: 'Não conseguiu propor o app',
    verb: 'propôs',
    body: 'proposal',
    groups: false,
  },
}

/**
 * What the Assistant's tool answered instead of doing: a read the connection refused, a file it
 * could not show. Both come back as a result, not as an error of the call, so the row reads them.
 */
export function refusedResult(
  tool: Pick<ToolItem, 'toolName' | 'result'>,
  room: Room,
): 'READ' | 'SHOW' | undefined {
  if (room.controller !== ASSISTANT_CONTROLLER) return undefined
  if (tool.toolName === BUILDER_TOOL.connectorRead) {
    const kind = readOutcome(tool.result)?.kind
    return kind === 'REFUSED' || kind === 'REAUTH' ? 'READ' : undefined
  }
  if (tool.toolName === ASSISTANT_TOOL.showFile)
    return ShownFile.safeParse(tool.result).data?.kind === 'SHOW_REFUSED' ? 'SHOW' : undefined
  return undefined
}
