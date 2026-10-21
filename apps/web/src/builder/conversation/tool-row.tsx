import { BookOpenIcon, CircleAlertIcon, HistoryIcon, SearchIcon, WrenchIcon } from 'lucide-react'
import { TraceDescription, TraceIcon, TraceLine, TraceTitle } from '../../ui/trace.tsx'
import type { ToolPart } from './fold.ts'
import { Anchor } from './markdown.tsx'
import { sentenceOf } from './tool-text.ts'

const ICONS = {
  read_page: BookOpenIcon,
  search_web: SearchIcon,
  recall: HistoryIcon,
  other: WrenchIcon,
} as const satisfies Record<ToolPart['kind'], unknown>

export function ToolIcon({ tool }: { tool: ToolPart }) {
  const Icon = tool.state === 'error' ? CircleAlertIcon : ICONS[tool.kind]
  return (
    <TraceIcon>
      <Icon />
    </TraceIcon>
  )
}

function Subject({ subject }: Pick<ToolPart, 'subject'>) {
  if (subject === null) return null
  const label =
    'query' in subject
      ? subject.query
      : (subject.title ?? URL.parse(subject.url)?.hostname ?? subject.url)
  return (
    <TraceDescription className="min-w-24 flex-1 basis-24 truncate font-mono text-fact">
      {'query' in subject ? label : <Anchor href={subject.url}>{label}</Anchor>}
    </TraceDescription>
  )
}

/** One tool, as a sentence of what it does or did. */
export function ToolRow({ tool }: { tool: ToolPart }) {
  return (
    <TraceLine className="flex-wrap" status={tool.state === 'completed' ? undefined : tool.state}>
      <ToolIcon tool={tool} />
      <TraceTitle className="max-w-full shrink-0 whitespace-normal">{sentenceOf(tool)}</TraceTitle>
      <Subject subject={tool.subject} />
    </TraceLine>
  )
}
