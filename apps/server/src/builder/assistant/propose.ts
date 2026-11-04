import { posix } from 'node:path'
import type { Briefing, ProposedApp, ProposeRefused } from '@conexus/hub-api'
import {
  ASSISTANT_TOOL,
  ProposeAppInput,
  ProposedApp as ProposedAppSchema,
  ProposeRefused as ProposeRefusedSchema,
  SHOWN_TEXT_MAX,
} from '@conexus/hub-api'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { AssistantMachines } from './machine.ts'
import { withFile } from './machine-file.ts'

const BRIEFING_EXTENSIONS = ['.md', '.txt']

const ToModel = z.union([ProposeRefusedSchema, ProposedAppSchema])

function refused(reason: ProposeRefused['reason']): ProposeRefused {
  return { kind: 'PROPOSE_REFUSED', reason }
}

type Machines = Pick<AssistantMachines, 'serving'>

/**
 * The two hand-offs to the Builder (step 24.3.2), one per place, so the model never chooses
 * between them: each says when to call it and when not, and what the person then sees.
 */
function handOffs() {
  const twoButtons = `The card has a second button, Continuar aqui, that sends you the person's words "Continuar aqui": they want to go on with you first, so go on with them and do not propose again until they ask for it or the request changes, since a second card for the same need only asks them to choose twice.`
  const notFor = `Do not call it for a question, a table, a chart or a file, which you answer yourself, nor for a request that repeats at a time, which is propose_automation. Before calling, write the briefing as a Markdown file among your files.`
  return {
    app: {
      id: ASSISTANT_TOOL.proposeApp,
      description: `Hands a need to the Builder, which makes apps. The person sees a button, Criar app, that creates a new Projeto and sends your summary and briefing to its Builder; nothing happens until they touch it. Call it when the person wants an app: a screen they will use every day, a record people keep filling or a process several people follow, also when Conexus can serve only part of it. Call it in the turn in which you know what the app is for, after the research the request asks for; a one-sentence request is enough, such as someone who wants the team's orders out of a spreadsheet. What neither the data nor the person settled, such as who uses the app, which rule counts or what a code means, goes in the briefing as an open question, also where a connector's skill says to ask the person: the Builder asks those questions on its cards before it plans, so a question from you makes the person answer twice. ${twoButtons} ${notFor}`,
      next: 'The person sees Criar app. The Builder plans from your briefing and asks its open questions. Do not propose again unless the need changes.',
    },
    change: {
      id: ASSISTANT_TOOL.proposeAppChange,
      description: `Hands a change of this Projeto's app to its Builder. The person sees a button, Mandar ao Builder, that opens a new conversation of this Projeto's Builder with your summary and briefing; nothing happens until they touch it. Call it when the person wants this app to change, to show or record something new, or to fix how it works, in the turn in which you know what the change is for, after the research it asks for. What neither the data nor the person settled goes in the briefing as an open question, also where a connector's skill says to ask the person: the Builder asks those questions on its cards before it plans, so a question from you makes the person answer twice. ${twoButtons} ${notFor}`,
      next: 'The person sees Mandar ao Builder. The Builder plans from your briefing and asks its open questions. Do not propose again unless the change asked changes.',
    },
  } as const
}

/**
 * The briefing the model named, read now from the conversation's machine and kept with the call
 * (as `show_file`), or why it cannot be.
 */
async function briefingOf(
  machines: Machines,
  requestContext: Parameters<Machines['serving']>[0] | undefined,
  path: string,
): Promise<Briefing | ProposeRefused> {
  const read = await withFile(machines, requestContext, path, async (files, found) => {
    if (!BRIEFING_EXTENSIONS.includes(posix.extname(found.name).toLowerCase())) {
      return refused('NOT_TEXT')
    }
    if (found.bytes > SHOWN_TEXT_MAX) return refused('TOO_LARGE')
    const content = await files.readFile(found.path, { encoding: 'utf-8' })
    return { name: found.name, content: String(content) }
  })
  return 'kind' in read && read.kind !== 'PROPOSE_REFUSED' ? refused(read.kind) : read
}

/**
 * `propose_app` (Início) and `propose_app_change` (a Projeto's conversation): the Assistant hands a
 * need to the Builder with a summary and the path of a briefing it wrote (Mastra Code's
 * `submit_plan({ path })`). Neither creates anything: the output, which Mastra stores with the
 * call, is what the screen's button sends. The model reads only what happens next, or the refusal.
 */
export function proposeTools(machines: Machines) {
  const offs = handOffs()
  function proposeTool(off: (typeof offs)[keyof typeof offs]) {
    return createTool({
      id: off.id,
      description: off.description,
      inputSchema: ProposeAppInput,
      execute: async (input, { requestContext }): Promise<ProposedApp | ProposeRefused> => {
        const briefing = await briefingOf(machines, requestContext, input.briefing)
        return 'kind' in briefing ? briefing : { summary: input.summary, briefing }
      },
      // Only what happens next, or the refusal. Mastra's own refusal of the input is of another
      // shape and reaches the model as Mastra wrote it.
      toModelOutput: (output) => {
        const said = ToModel.safeParse(output)
        if (!said.success) return undefined
        const value = 'kind' in said.data ? said.data : { proposed: true, next: off.next }
        return { type: 'json', value }
      },
    })
  }
  return { app: proposeTool(offs.app), change: proposeTool(offs.change) }
}
