import type { LanguageModelMiddleware } from 'ai'

/**
 * Each step's answer without the body of its request. Mastra keeps every step's output, request
 * included, until the session's next run, so a conversation's last turn held every prompt it sent
 * (`@mastra/core@1.82.0` `MastraModelOutput` `#bufferedSteps[].request.body`); nothing of ours or
 * Mastra's reads it back.
 */
export const bodylessMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  wrapStream: async ({ doStream }) => {
    const { request: _request, ...answer } = await doStream()
    return answer
  },
}
