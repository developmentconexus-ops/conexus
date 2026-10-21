import {
  BookOpenIcon,
  CircleAlertIcon,
  FilePenIcon,
  FilePlusIcon,
  FileTextIcon,
  HistoryIcon,
  SearchIcon,
  TerminalIcon,
  WrenchIcon,
} from 'lucide-react'
import { TraceDescription, TraceIcon, TraceLine, TraceTitle } from '../../ui/trace.tsx'
import { useSecondsShown } from './elapsed.ts'
import type { ToolPart } from './fold.ts'
import { Anchor } from './markdown.tsx'
import { durationOf } from './text.ts'
import { sentenceOf } from './tool-text.ts'

const ICONS = {
  read_page: BookOpenIcon,
  search_web: SearchIcon,
  recall: HistoryIcon,
  write_file: FilePlusIcon,
  edit_file: FilePenIcon,
  read_file: FileTextIcon,
  run_command: TerminalIcon,
  other: WrenchIcon,
} as const satisfies Record<ToolPart['kind'], unknown>

export function ToolIcon({ tool }: { tool: ToolPart }) {
  const Icon =
    tool.state === 'error' || tool.state === 'denied' ? CircleAlertIcon : ICONS[tool.kind]
  return (
    <TraceIcon>
      <Icon />
    </TraceIcon>
  )
}

function Subject({ subject }: Pick<ToolPart, 'subject'>) {
  if (subject === null) return null
  const link = 'url' in subject
  const label =
    'query' in subject
      ? subject.query
      : 'path' in subject
        ? subject.path
        : 'command' in subject
          ? subject.command
          : (subject.title ?? URL.parse(subject.url)?.hostname ?? subject.url)
  return (
    <TraceDescription className="min-w-24 flex-1 basis-24 truncate font-mono text-fact">
      {link ? <Anchor href={subject.url}>{label}</Anchor> : label}
    </TraceDescription>
  )
}

function statusOf(state: ToolPart['state']) {
  if (state === 'completed') return undefined
  return state === 'denied' ? 'error' : state
}

/** How long a command has run, for the eye: "(40 s)". */
function Running() {
  const seconds = useSecondsShown()
  return (
    <TraceDescription aria-hidden="true" className="shrink-0 text-fact">
      ({durationOf(seconds)})
    </TraceDescription>
  )
}

/** One tool, as a sentence of what it does or did; a command still running says for how long. */
export function ToolRow({ tool }: { tool: ToolPart }) {
  return (
    <TraceLine className="flex-wrap" status={statusOf(tool.state)}>
      <ToolIcon tool={tool} />
      <TraceTitle className="max-w-full shrink-0 whitespace-normal">{sentenceOf(tool)}</TraceTitle>
      <Subject subject={tool.subject} />
      {tool.kind === 'run_command' && tool.state === 'running' && <Running />}
    </TraceLine>
  )
}
