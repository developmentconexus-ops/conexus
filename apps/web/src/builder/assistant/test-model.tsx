import { ASSISTANT_CONTROLLER, setAssistantModel } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'

/** The model and effort the Hub kept for each conversation changed here; the session reads them back. */
export type ChosenModels = Map<string, { model: string; effort: string }>

/** The Hub's write of a conversation's model: kept for the session's read, or the answer the test gives. */
export function modelWrite(
  base: string,
  held: { chosen: ChosenModels; answers: { model?: () => Response | undefined } },
  note: (request: Request) => Promise<unknown>,
) {
  return http.put(`${base}/conversations/:id/model`, async ({ request, params }) => {
    const body = await note(request)
    const replaced = held.answers.model?.()
    if (replaced) return replaced
    const kept = setAssistantModel.input.body.parse(body)
    held.chosen.set(String(params.id), kept)
    return HttpResponse.json(kept)
  })
}

/** Mastra's state of an Assistant session: the model it began on, or the one the Hub kept after a change. */
export function sessionState(chosen: ChosenModels, id: string) {
  const kept = chosen.get(id)
  return {
    controllerId: ASSISTANT_CONTROLLER,
    sessionId: id,
    resourceId: 'company:c1:person:p1',
    threadId: id,
    modeId: 'ask',
    modelId: kept?.model ?? 'anthropic/claude-sonnet-4',
    running: false,
    tasks: [],
    settings: { thinkingLevel: kept?.effort ?? 'off' },
  }
}
