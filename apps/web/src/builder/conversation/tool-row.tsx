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

/** What the tool was about: the page, as a link only when its address is http(s), or the search. */
function Subject({ subject }: Pick<ToolPart, 'subject'>) {
  if (subject === null) return null
  if ('query' in subject)
    return (
      <TraceDescription className="min-w-0 truncate font-mono text-fact">
        {subject.query}
      </TraceDescription>
    )
  const label = subject.title ?? URL.parse(subject.url)?.hostname ?? subject.url
  return (
    <TraceDescription className="min-w-0 truncate font-mono text-fact">
      <Anchor href={subject.url}>{label}</Anchor>
    </TraceDescription>
  )
}

/** One tool, as a sentence of what it does or did; the arguments and the result never reach the screen. */
export function ToolRow({ tool }: { tool: ToolPart }) {
  return (
    <TraceLine status={tool.state === 'completed' ? undefined : tool.state}>
      <ToolIcon tool={tool} />
      <TraceTitle>{sentenceOf(tool)}</TraceTitle>
      <Subject subject={tool.subject} />
    </TraceLine>
  )
}
