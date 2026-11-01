import type { ASSISTANT_TOOL, CARD_TOOLS, ClosedTool, TASK_TOOLS } from '@conexus/hub-api'
import type { LucideIcon } from 'lucide-react'
import type { ToolItem } from './rows.ts'

/** The tools that draw a row: the cards draw a card and the task tools the panel; the Assistant's own add three. */
export type RowTool =
  | Exclude<ClosedTool, (typeof CARD_TOOLS)[keyof typeof CARD_TOOLS] | (typeof TASK_TOOLS)[number]>
  | (typeof ASSISTANT_TOOL)[keyof typeof ASSISTANT_TOOL]

/** What a row opens on (Factory `ToolBody`, `ToolCard.tsx:32-67`). */
export type ToolBody =
  | 'file'
  | 'list'
  | 'command'
  | 'edit'
  | 'write'
  | 'skill'
  | 'shown'
  | 'proposal'
  | 'automation'
  | 'generic'

export type ToolStatus = 'running' | 'done' | 'error' | 'denied'

/** The icon and words of a row's line. */
export type Presented = { icon: LucideIcon; sentence: string; detail?: string; beside: boolean }

/**
 * What a result that is a refusal asks of the row: `SAID` is all the line says, `RECONNECT` adds the
 * way to link the connection again.
 */
export type Refusal = 'SAID' | 'RECONNECT'

/** How one tool of the closed set reads on the screen: the one owner of its words (code C26). */
export type ToolSpec = {
  icon: LucideIcon
  running: string
  done: string
  /** The sentence of a failure; the argument follows it when there is one. */
  failed: string
  /** The verb a group's summary lists ("4 ferramentas: leu, procurou"). */
  verb: string
  /** The argument the sentence names: a path, a pattern, a URL. */
  detailKey?: string
  /** The argument shows beside the sentence, cut, instead of after it (the web's long URLs and queries). */
  detailBeside?: true
  body: ToolBody
  /** Joins a run of three or more as one group (criterion 9). */
  groups: boolean
  /** The Assistant's tools answer a refusal as a result, not as an error of the call: the row reads it. */
  refusal?: (result: unknown) => Refusal | undefined
  /** The row's own icon and words, instead of the table's by status. */
  present?: (
    tool: Pick<ToolItem, 'args' | 'result'>,
    status: ToolStatus,
    connectorName: (connector: string) => string,
  ) => Presented
}
