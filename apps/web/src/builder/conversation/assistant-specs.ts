import { ASSISTANT_TOOL, BUILDER_TOOL, ShownFile } from '@conexus/hub-api'
import { BuildingIcon, PresentationIcon, RocketIcon } from 'lucide-react'
import { CONNECTOR_SPECS, presentRead, readRefusal } from './connector-specs.ts'
import type { RowTool, ToolSpec } from './tool-spec.ts'

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
    refusal: (result) =>
      ShownFile.safeParse(result).data?.kind === 'SHOW_REFUSED' ? 'SAID' : undefined,
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
