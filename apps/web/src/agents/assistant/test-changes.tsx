import { HttpResponse, http } from 'msw'
import { refusal } from '../../platform/test-hub.tsx'

type Kept = { conversation: { id: string; title: string | null } }

/** The Hub's deletion and rename of a conversation, over the conversations a test holds. */
export function changesOf<T extends Kept>(
  base: string,
  held: { conversations: T[]; answers: { remove?: () => Response | undefined } },
  note: (request: Request) => Promise<unknown>,
) {
  return [
    http.delete(`${base}/conversations/:id`, async ({ request, params }) => {
      await note(request)
      const replaced = held.answers.remove?.()
      if (replaced) return replaced
      const at = held.conversations.findIndex(({ conversation }) => conversation.id === params.id)
      if (at < 0) return refusal('CONVERSATION_NOT_FOUND')
      held.conversations.splice(at, 1)
      return new HttpResponse(null, { status: 204 })
    }),
    http.patch(`${base}/conversations/:id`, async ({ request, params }) => {
      const body = await note(request)
      const found = held.conversations.find(({ conversation }) => conversation.id === params.id)
      if (!found) return refusal('CONVERSATION_NOT_FOUND')
      const title =
        typeof body === 'object' && body !== null && 'title' in body ? String(body.title) : ''
      found.conversation = { ...found.conversation, title }
      return HttpResponse.json({ title })
    }),
  ]
}
