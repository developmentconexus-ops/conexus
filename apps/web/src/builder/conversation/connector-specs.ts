import { BUILDER_TOOL } from '@conexus/hub-api'
import { DatabaseIcon, NotebookPenIcon, NotebookTextIcon } from 'lucide-react'
import type { ToolSpec } from './tool-spec.ts'

const { connectorRead, connectorNotes, connectorNoteSave } = BUILDER_TOOL

/** The rows of the tools of a Projeto's granted connections (card of step 20, U5). */
export const CONNECTOR_SPECS: Record<
  typeof connectorRead | typeof connectorNotes | typeof connectorNoteSave,
  ToolSpec
> = {
  [connectorRead]: {
    icon: DatabaseIcon,
    running: 'Lendo um sistema da empresa',
    done: 'Leu um sistema da empresa',
    failed: 'Não conseguiu ler o sistema da empresa',
    verb: 'leu sistema',
    body: 'generic',
    groups: true,
  },
  [connectorNotes]: {
    icon: NotebookTextIcon,
    running: 'Relendo o caderno do sistema',
    done: 'Releu o caderno do sistema',
    failed: 'Não conseguiu reler o caderno',
    verb: 'releu caderno',
    body: 'generic',
    groups: true,
  },
  [connectorNoteSave]: {
    icon: NotebookPenIcon,
    running: 'Anotando no caderno do sistema',
    done: 'Anotou no caderno do sistema',
    failed: 'Não conseguiu anotar no caderno',
    verb: 'anotou',
    body: 'generic',
    groups: true,
  },
}
