import type { ProjectId } from '@conexus/hub-api'
import {
  ASSISTANT_TOOL,
  ATTEMPT_KEY_HEADER,
  ConversationId,
  handAssistantProposal,
} from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS } from '../../platform/test-hub.tsx'
import type { BuilderAnswers } from './test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  builderConversation,
  COMPANY_ROOT,
  OFFERED,
  SALES,
  toolSaid,
} from './test-hub.tsx'

const PROPOSED = { summary: 'Um app de encomendas' }
export const PROPOSED_SUMMARY = PROPOSED.summary
export const BUILDER_CONVERSATION = ConversationId.parse('66666666-6666-4666-8666-666666666666')
const HANDOFFS = `*/api/companies/${COMPANY.id}/assistant/conversations/:id/handoffs`
type Handed = { key: string | null; body: unknown }

/** The proposal of a call as Mastra stores it: the summary and the briefing the tool read. */
export function proposalSaid(tool: string = ASSISTANT_TOOL.proposeApp, id = 'tool-1') {
  const briefing = { name: 'briefing.md', content: '## Quem usa\n\nO time de vendas, todo dia.' }
  return toolSaid(tool, PROPOSED, { ...PROPOSED, briefing }, id)
}

/** The fake Hub of the card of an app the Assistant proposed (step 24.3.2, U3): its route, the permission read, its screens. */
export function proposalScreens(server: ReturnType<typeof setupServer>) {
  const { at } = assistantScreens(server)
  return {
    /** The Hub's hand-off route, answering what `answer` says for each touch, and noting each one. */
    handing(answer: (touch: number) => Response | undefined = () => undefined) {
      const handed: Handed[] = []
      server.use(
        http.post(HANDOFFS, async ({ request }) => {
          handed.push({ key: request.headers.get(ATTEMPT_KEY_HEADER), body: await request.json() })
          const replaced = answer(handed.length)
          if (replaced) return replaced
          return HttpResponse.json(
            handAssistantProposal.success.body.parse({
              projectId: PEDIDOS.id,
              conversationId: BUILDER_CONVERSATION,
              released: [SALES],
              refused: [],
            }),
            { status: 201 },
          )
        }),
      )
      return handed
    },
    /** The company's connections read, as the owner or a member makes it. */
    mayManage(may: boolean) {
      server.use(
        http.get('*/api/companies/:companyId/connections', () =>
          HttpResponse.json({ connectors: [], connections: [], mayManage: may }),
        ),
      )
    },
    proposing(
      messages = [proposalSaid()],
      path = `${COMPANY_ROOT}/conversations/${ASKED}`,
      projectId: ProjectId | null = null,
      connections = OFFERED,
      builderAnswers: BuilderAnswers = {},
    ) {
      return at(path, {
        conversations: [assistantConversation({ messages, projectId, connections })],
        builder: [builderConversation({ id: BUILDER_CONVERSATION })],
        builderAnswers,
      })
    },
  }
}
