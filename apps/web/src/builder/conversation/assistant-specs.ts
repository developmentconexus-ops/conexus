import type { MACHINE_TOOL } from '@conexus/hub-api'
import { ASSISTANT_TOOL, BUILDER_TOOL, ProposeRefused } from '@conexus/hub-api'
import { BuildingIcon, RocketIcon, TimerIcon } from 'lucide-react'
import { CONNECTOR_SPECS, presentRead, readRefusal } from './connector-specs.ts'
import type { RowTool, ToolSpec } from './tool-spec.ts'

/** A hand-off to the Builder that found no briefing to send: the line says it, and the model writes it again. */
function proposalRefusal(result: unknown) {
  return ProposeRefused.safeParse(result).success ? 'SAID' : undefined
}

/**
 * The rows of the Assistant's own tools (step 24.1, U4); the connector tools it shares are in
 * `connector-specs.ts`, its machine's in `machine-specs.ts`.
 */
export const ASSISTANT_SPECS: Record<
  Exclude<
    (typeof ASSISTANT_TOOL)[keyof typeof ASSISTANT_TOOL],
    (typeof MACHINE_TOOL)[keyof typeof MACHINE_TOOL]
  >,
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
  [ASSISTANT_TOOL.proposeApp]: {
    icon: RocketIcon,
    running: 'Preparando o pedido do app',
    done: 'Propôs um app',
    failed: 'Não conseguiu propor o app',
    verb: 'propôs',
    body: 'proposal',
    groups: false,
    refusal: proposalRefusal,
  },
  [ASSISTANT_TOOL.proposeAppChange]: {
    icon: RocketIcon,
    running: 'Preparando o pedido de mudança do app',
    done: 'Propôs uma mudança do app',
    failed: 'Não conseguiu propor a mudança do app',
    verb: 'propôs',
    body: 'proposal',
    groups: false,
    refusal: proposalRefusal,
  },
  [ASSISTANT_TOOL.proposeAutomation]: {
    icon: TimerIcon,
    running: 'Preparando a automação',
    done: 'Propôs uma automação',
    failed: 'Não conseguiu propor a automação',
    verb: 'propôs',
    body: 'automation',
    groups: false,
  },
}

/**
 * The rows the Assistant's room draws over the table: its `connector_read` names the connection and
 * the rows brought, and says a refusal the connection answered. One lookup (`specOf`) serves every
 * place a row asks how it reads.
 */
export const ASSISTANT_OVERRIDES: Partial<Record<RowTool, ToolSpec>> = {
  [BUILDER_TOOL.connectorRead]: {
    ...CONNECTOR_SPECS[BUILDER_TOOL.connectorRead],
    present: presentRead,
    refusal: readRefusal,
  },
}
