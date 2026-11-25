import type { ConstrutorConversationSummary } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { renameRoute } from '../../harness/room/test-rename.tsx'
import { BUILDER_CHAT } from './test-agents.ts'

/** The Construtor's conversations of a Projeto, and the rename of one, over the ones a test holds. */
export function construtorRoutes(input: {
  held: {
    construtor?: ConstrutorConversationSummary[]
    answers?: { openConstrutor?: () => Response | undefined }
  }
  projectApi: string
  session: string
  note: (request: Request) => Promise<unknown>
}) {
  const { held, projectApi, session, note } = input
  return [
    renameRoute(session, () => held.construtor ?? [], note),
    http.get(`${projectApi}/construtor/conversations`, () =>
      HttpResponse.json({ conversations: held.construtor ?? [] }),
    ),
    http.post(`${projectApi}/construtor/conversations`, async ({ request }) => {
      await note(request)
      const replaced = held.answers?.openConstrutor?.()
      if (replaced) return replaced
      const made = {
        id: BUILDER_CHAT,
        title: null,
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      }
      held.construtor = [made, ...(held.construtor ?? [])]
      return HttpResponse.json({ conversation: made }, { status: 201 })
    }),
  ]
}
