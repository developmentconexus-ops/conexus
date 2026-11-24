const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/
const LIST_ITEM = /^ {0,3}(?:[-*+]|\d{1,9}[.)])(?:[ \t]|$)/
const INDENTED = /^(?:\t| {2,})/
const DEFINITION = /^ {0,3}\[[^\]]+\]:/

// Both are runs of one character, so `startsWith` is "same marker, at least as long".
function closesFence(line: string, marker: string): boolean {
  return FENCE_CLOSE.exec(line)?.[1]?.startsWith(marker) ?? false
}

function startsBlock(line: string, inList: boolean): boolean {
  if (INDENTED.test(line)) return false
  return !(inList && LIST_ITEM.test(line))
}

/** A block's text and the line it starts at, which stays the same as the answer grows. */
export type Block = { start: number; text: string }

/**
 * Cuts markdown into top-level blocks so a growing answer parses its last block and not all of
 * them. Joined again, the blocks are the input. Every rule only merges: a block too big costs a
 * parse, a construct cut in two changes what it draws. A link definition resolves across blank
 * lines, which no line rule sees, so reaching one outside a fence keeps the whole text as one.
 */
export function splitBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n')
  const starts = [0]
  let fence: string | undefined
  let started = false
  let broken = false
  let inList = false

  for (const [index, line] of lines.entries()) {
    if (fence) {
      if (closesFence(line, fence)) fence = undefined
      continue
    }
    if (line.trim() === '') {
      broken = started
      continue
    }
    if (DEFINITION.test(line)) return [{ start: 0, text: markdown }]
    if (broken && startsBlock(line, inList)) {
      starts.push(index)
      started = false
    }
    if (!started) inList = LIST_ITEM.test(line)
    started = true
    broken = false
    fence = FENCE_OPEN.exec(line)?.[1]
  }

  return starts.map((start, at) => {
    const end = starts[at + 1]
    const block = lines.slice(start, end ?? lines.length).join('\n')
    return { start, text: end === undefined ? block : `${block}\n` }
  })
}
