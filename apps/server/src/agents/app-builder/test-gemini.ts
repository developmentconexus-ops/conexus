import type { TestContext } from 'node:test'
import { z } from 'zod'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/'
const GeminiAsked = z.object({
  tools: z.array(z.object({ functionDeclarations: z.array(z.object({ name: z.string() })) })),
})

/**
 * Stands in for Gemini's API beside the Anthropic double: one text answer, in its stream or its
 * JSON form, and the tools each call offered. It puts back the `fetch` it found, if still its own.
 */
export function plantGemini(t: TestContext): string[][] {
  const offered: string[][] = []
  const before = globalThis.fetch
  async function gemini(input: string | URL | Request, init?: RequestInit) {
    const url = input instanceof Request ? input.url : String(input)
    if (!url.startsWith(GEMINI_URL)) return before(input, init)
    const asked = GeminiAsked.safeParse(JSON.parse(String(init?.body)))
    const names = asked.success ? asked.data.tools.flatMap((tool) => tool.functionDeclarations) : []
    offered.push(names.map((tool) => tool.name).sort())
    const chunk = {
      candidates: [
        { content: { role: 'model', parts: [{ text: 'Resposta' }] }, finishReason: 'STOP' },
      ],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
    }
    if (!url.includes(':streamGenerateContent')) return Response.json(chunk)
    const headers = { 'content-type': 'text/event-stream' }
    return new Response(`data: ${JSON.stringify(chunk)}\n\n`, { headers })
  }
  globalThis.fetch = gemini
  t.after(() => {
    if (globalThis.fetch === gemini) globalThis.fetch = before
  })
  return offered
}
