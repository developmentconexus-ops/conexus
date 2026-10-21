import type { MessagePart } from '@conexus/hub-api'

export type ToolPart = Extract<MessagePart, { type: 'tool' }>

export type Row = { kind: 'part'; part: MessagePart } | { kind: 'group'; tools: ToolPart[] }

/** Mirrors `playground-ui` `group-consecutive.ts`. */
const TOOL_GROUP_MIN = 3

export function fold(parts: readonly MessagePart[]): Row[] {
  const rows: Row[] = []
  let run: ToolPart[] = []
  function close() {
    if (run.length >= TOOL_GROUP_MIN) rows.push({ kind: 'group', tools: run })
    else for (const tool of run) rows.push({ kind: 'part', part: tool })
    run = []
  }
  for (const part of parts) {
    // A file the turn wrote is for the Código tab: the tool row already says it in words.
    if (part.type === 'file') continue
    if (part.type === 'tool') run.push(part)
    else {
      close()
      rows.push({ kind: 'part', part })
    }
  }
  close()
  return rows
}
