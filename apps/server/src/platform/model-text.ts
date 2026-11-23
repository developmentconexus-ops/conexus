/** What the model reads of a provider's answer at most (code C79): Codex's default for a tool's output, 10 000 tokens at 4 characters each. The record keeps it all. */
const TOLD_CHARACTERS = 40_000

/** A text for the model: whole up to the cap, past it its start and its end, as Claude Code keeps a long tool error; counted in characters, so a cut never splits one in two. */
export function toldText(text: string): string {
  if (text.length <= TOLD_CHARACTERS) return text
  const characters = Array.from(text)
  if (characters.length <= TOLD_CHARACTERS) return text
  const half = TOLD_CHARACTERS / 2
  const cut = characters.length - TOLD_CHARACTERS
  return `${characters.slice(0, half).join('')}…[${cut} characters cut]…${characters.slice(-half).join('')}`
}

/** A body for the model: as it came up to the cap, past it the cut of its JSON. */
export function toldBody(body: unknown): unknown {
  const text = JSON.stringify(body)
  if (text === undefined) return body
  const told = toldText(text)
  return told === text ? body : told
}
