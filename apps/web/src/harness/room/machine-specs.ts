import { MACHINE_TOOL, ShownFile } from '@conexus/hub-api'
import { CircleAlertIcon, CodeIcon, PresentationIcon } from 'lucide-react'
import { z } from 'zod'
import type { ToolSpec } from './tool-spec.ts'
import { headOf } from './tool-spec.ts'

/**
 * What Mastra's `execute_typescript` answers (`CodeModeToolResult`, in its code mode reference):
 * the program's value and its logs, or the error when it threw or ran out of time.
 */
export const ProgramSuccess = z.object({
  success: z.literal(true),
  result: z.unknown(),
  logs: z.array(z.unknown()).optional(),
})

const ProgramFailure = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string(), name: z.string().optional() }),
})

const ERROR_MAX = 200
const TIMED_OUT = 'O programa passou do tempo'

/** The sentence of a program that failed: the time it ran out of, or the program's own error, cut. */
function failureSentence(result: unknown, failed: string): string {
  const { error } = ProgramFailure.parse(result)
  if (error.name === 'TimeoutError') return TIMED_OUT
  const first = error.message.split('\n')[0] ?? ''
  return `${failed}: ${first.length > ERROR_MAX ? `${first.slice(0, ERROR_MAX)}…` : first}`
}

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
  [MACHINE_TOOL.codeMode]: {
    icon: CodeIcon,
    running: 'Rodando o programa',
    done: 'Rodou um programa',
    failed: 'O programa falhou',
    verb: 'rodou programa',
    body: 'program',
    groups: false,
    refusal: (result) => (ProgramFailure.safeParse(result).success ? 'SAID' : undefined),
    present: (tool, status) => {
      const failed = status === 'error' || status === 'denied'
      const spec = MACHINE_SPECS[MACHINE_TOOL.codeMode]
      const said = ProgramFailure.safeParse(tool.result).success
      return {
        icon: failed ? CircleAlertIcon : CodeIcon,
        sentence: said ? failureSentence(tool.result, spec.failed) : headOf(spec, status),
        beside: false,
      }
    },
  },
}
