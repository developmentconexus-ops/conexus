import type { MessagePart } from '@conexus/hub-api'

export type ToolPart = Extract<MessagePart, { type: 'tool' }>

/** A line of an answer: one part, or the tools that run three or more in a row, folded. */
export type Row = { kind: 'part'; part: MessagePart } | { kind: 'group'; tools: ToolPart[] }

/** From this many tools in a row they fold into one line (`playground-ui` `group-consecutive.ts`). */
export const TOOL_GROUP_MIN = 3

/** The rows of an answer: a run of tools folds, and a text, a thought, a notice or a failure ends it. */
export function fold(parts: readonly MessagePart[]): Row[] {
  const rows: Row[] = []
  let run: ToolPart[] = []
  function close() {
    if (run.length >= TOOL_GROUP_MIN) rows.push({ kind: 'group', tools: run })
    else for (const tool of run) rows.push({ kind: 'part', part: tool })
    run = []
  }
  for (const part of parts) {
    if (part.type === 'tool') run.push(part)
    else {
      close()
      rows.push({ kind: 'part', part })
    }
  }
  close()
  return rows
}
