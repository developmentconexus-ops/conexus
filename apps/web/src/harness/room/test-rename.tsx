import { HttpResponse, http } from 'msw'
import { z } from 'zod'
import { refusal } from '../../platform/test-hub.tsx'

const RenameBody = z.object({ title: z.string() })

/** Mastra's rename of a thread behind the guard, over the conversations a test holds. */
export function renameRoute(
  session: string,
  listed: () => { id: string; title: string | null }[],
  note: (request: Request) => Promise<unknown>,
) {
  return http.put(`${session}/threads/:threadId`, async ({ request, params }) => {
    const { title } = RenameBody.parse(await note(request))
    const found = listed().find((one) => one.id === params.threadId)
    if (!found) return refusal('CONVERSATION_NOT_FOUND')
    found.title = title
    return HttpResponse.json({ ok: true })
  })
}
