import { SUBAGENT_TOOL } from '@conexus/hub-api'
import { CircleAlertIcon, TelescopeIcon } from 'lucide-react'
import { z } from 'zod'
import { stringArg } from './tool-args.ts'
import type { Refusal, ToolSpec } from './tool-spec.ts'
import { headOf } from './tool-spec.ts'

/** What Mastra's `subagent` tool answers: the helper's findings, or its failure, as text. */
export const Researched = z.object({ content: z.string(), isError: z.boolean().optional() })

/** The text Mastra gives a research the person stopped, said in Portuguese by the row. */
export const STOPPED = '[Aborted by user]'

/** A research that failed answers its failure as a result, not as an error of the call. */
function researchRefusal(result: unknown): Refusal | undefined {
  return Researched.safeParse(result).data?.isError === true ? 'SAID' : undefined
}

const RESEARCH: Pick<ToolSpec, 'running' | 'done' | 'failed'> = {
  running: 'Pesquisando',
  done: 'Pesquisou',
  failed: 'A pesquisa falhou',
}

/**
 * The row of the helper that reads (U12): "Pesquisando" with the question cut beside it, and, open,
 * the findings as the message they are.
 */
export const RESEARCH_SPECS: Record<typeof SUBAGENT_TOOL, ToolSpec> = {
  [SUBAGENT_TOOL]: {
    icon: TelescopeIcon,
    ...RESEARCH,
    verb: 'pesquisou',
    detailKey: 'task',
    detailBeside: true,
    body: 'research',
    groups: false,
    refusal: researchRefusal,
    // The question stays cut beside the sentence in every status, a failed one too.
    present: (tool, status) => ({
      icon: status === 'error' || status === 'denied' ? CircleAlertIcon : TelescopeIcon,
      sentence: headOf(RESEARCH, status),
      detail: stringArg(tool.args, 'task'),
      beside: true,
    }),
  },
}
