import { ASSISTANT_CONTROLLER, Effort, ModelId } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { z } from 'zod'

/** The model and effort the Hub kept for each conversation changed here; the session reads them back. */
export type ChosenModels = Map<string, { model: string; effort: string }>

const ModelChoiceBody = z.object({ modelId: ModelId, thinkingLevel: Effort })

/** The session's change of model, Mastra's own route: kept for the session's read, or the answer the test gives. */
export function modelWrite(
  session: string,
  held: { chosen: ChosenModels; answers: { model?: () => Response | undefined } },
  note: (request: Request) => Promise<unknown>,
) {
  return http.post(`${session}/model`, async ({ request, params }) => {
    const body = await note(request)
    const replaced = held.answers.model?.()
    if (replaced) return replaced
    const { modelId, thinkingLevel } = ModelChoiceBody.parse(body)
    held.chosen.set(String(params.id), { model: modelId, effort: thinkingLevel })
    return HttpResponse.json({ ok: true })
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
