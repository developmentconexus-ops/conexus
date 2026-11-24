/** What the model reads of a provider's answer at most (code C79): Codex's default for a tool's output, 10 000 tokens at 4 characters each. The record keeps it all. */
const TOLD_CHARACTERS = 40_000

/** What a refusal's message may take of it: the failed-read words repeat the message, so it counts twice and the body has the rest. */
const MESSAGE_CHARACTERS = 10_000

/** A text for the model: whole up to the cap, past it its start and its end, as Claude Code keeps a long tool error; counted in characters, so a cut never splits one in two. */
export function toldText(text: string, limit = TOLD_CHARACTERS): string {
  if (text.length <= limit) return text
  const characters = Array.from(text)
  if (characters.length <= limit) return text
  const half = Math.floor(limit / 2)
  const cut = characters.length - 2 * half
  return `${characters.slice(0, half).join('')}…[${cut} characters cut]…${characters.slice(-half).join('')}`
}

/** A body for the model: as it came up to the cap, past it the cut of its JSON. */
export function toldBody(body: unknown, limit = TOLD_CHARACTERS): unknown {
  const text = JSON.stringify(body)
  if (text === undefined) return body
  const told = toldText(text, limit)
  return told === text ? body : told
}

/**
 * A provider's refusal as the model reads all of it, its message (said twice) and its body within
 * the one ceiling; the record the Hub made keeps the answer whole.
 */
export function toldNative<T extends { message: string | null; body: unknown }>(native: T): T {
  const message = native.message === null ? null : toldText(native.message, MESSAGE_CHARACTERS)
  const spent = message === null ? 0 : 2 * Array.from(message).length
  return { ...native, message, body: toldBody(native.body, TOLD_CHARACTERS - spent) }
}
