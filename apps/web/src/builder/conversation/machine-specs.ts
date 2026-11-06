import { MACHINE_TOOL, ShownFile } from '@conexus/hub-api'
import { PresentationIcon } from 'lucide-react'
import type { ToolSpec } from './tool-spec.ts'

/** The rows of the tools every conversation with a machine shares (step 24.4, U1). */
export const MACHINE_SPECS: Record<(typeof MACHINE_TOOL)[keyof typeof MACHINE_TOOL], ToolSpec> = {
  [MACHINE_TOOL.showFile]: {
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
}
