import { ASSISTANT_TOOL, ProposedApp } from '@conexus/hub-api'
import { createTool } from '@mastra/core/tools'

/**
 * `propose_app` (step 24.1, U4, `A1`): when what the person asks is a screen of every day, the
 * Assistant summarizes the need and the screen shows **Criar app**, which hands the summary to the
 * Builder of a new Projeto. The tool does nothing itself: it answers its summary, which Mastra
 * stores with the call and the screen draws. Only a conversation outside a Projeto is offered it.
 */
export const proposeAppTool = createTool({
  id: ASSISTANT_TOOL.proposeApp,
  description:
    'Offers the person a button, Criar app, to hand a need to the Builder of a new Projeto. Call it when what they ask for is a screen they will use every day, a record people keep filling or a process several people follow, and also when Conexus cannot do the whole need yet but an app serves part of it. Summarize the need in a few lines: who uses it, what they record or see, and which systems it reads.',
  inputSchema: ProposedApp,
  execute: async ({ summary }): Promise<ProposedApp> => ({ summary }),
})
