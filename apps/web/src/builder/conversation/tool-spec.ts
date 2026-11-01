import type { ASSISTANT_TOOL, CARD_TOOLS, ClosedTool, TASK_TOOLS } from '@conexus/hub-api'
import type { LucideIcon } from 'lucide-react'

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
  | 'generic'

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
}
