import {
  BookOpenIcon,
  CircleAlertIcon,
  ClipboardCheckIcon,
  FilePenIcon,
  FilePlusIcon,
  FileTextIcon,
  HistoryIcon,
  SearchIcon,
  TerminalIcon,
  WrenchIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../ui/trace.tsx'
import { useSecondsShown } from './elapsed.ts'
import type { ToolPart } from './fold.ts'
import { lineDiff } from './line-diff.ts'
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
  check: ClipboardCheckIcon,
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
          : 'check' in subject
            ? subject.check
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

type Detail = NonNullable<ToolPart['detail']>

const BLOCK =
  'max-h-64 overflow-auto rounded-control bg-surface-3 p-sm font-mono text-fact text-text-2 whitespace-pre-wrap wrap-break-word'
const CHANGES = { ' ': '', '-': 'text-danger', '+': 'text-success' } as const

const STEP_STATES = {
  passed: 'passou',
  failed: 'falhou',
  skipped: 'não rodou',
  informed: 'avisou',
} as const

function failedCheck(detail: Detail): boolean {
  return detail.kind === 'check' && detail.steps.some(({ state }) => state === 'failed')
}

function failedExit(detail: Detail): number | undefined {
  return detail.kind === 'command' && detail.exitCode !== null && detail.exitCode !== 0
    ? detail.exitCode
    : undefined
}

/** What the row opens on: the command and its output's end, a file's start, an edit's lines. */
function Opened({ detail }: { detail: Detail }) {
  const cut = detail.cut ? '…' : undefined
  if (detail.kind === 'command') {
    const code = failedExit(detail)
    return (
      <div className="flex min-w-0 flex-col gap-xs">
        <pre className={BLOCK}>
          {[`$ ${detail.command}`, ...(cut ? [cut] : []), ...detail.output].join('\n')}
        </pre>
        {code !== undefined && (
          <p className="text-danger text-fact">O comando terminou com o código {code}.</p>
        )}
      </div>
    )
  }
  if (detail.kind === 'check') {
    const lines = detail.steps.flatMap(({ name, state, problems }) => [
      `${name}: ${STEP_STATES[state]}`,
      ...problems.map(
        ({ file, line, message }) =>
          `  ${file === null ? '' : `${file}${line === null ? '' : `:${line}`} `}${message}`,
      ),
    ])
    return <pre className={BLOCK}>{[...lines, cut].filter(Boolean).join('\n')}</pre>
  }
  if (detail.kind === 'file') return <pre className={BLOCK}>{[detail.content, cut].join('\n')}</pre>
  return (
    <pre className={BLOCK}>
      {lineDiff(detail.before, detail.after).map((line) => (
        <span key={line.place} className={`block ${CHANGES[line.change]}`}>
          {`${line.change} ${line.text}`}
        </span>
      ))}
      {cut}
    </pre>
  )
}

/**
 * One tool, as a sentence of what it does or did; a command still running says for how long. A
 * row with a detail opens on it, as the Factory's tool card does (`ToolCard.tsx:41,54,64` at
 * ce7e9c30c1): a running command open on its output as it grows, closed once it ends, unless the
 * person opened or closed it; a row with nothing more to say does not open.
 */
export function ToolRow({ tool }: { tool: ToolPart }) {
  const [chosen, setChosen] = useState<boolean>()
  const { detail } = tool
  const code = detail === undefined ? undefined : failedExit(detail)
  const failed = code !== undefined || (detail !== undefined && failedCheck(detail))
  const line = (
    <TraceLine className="flex-wrap" status={failed ? 'error' : statusOf(tool.state)}>
      <ToolIcon tool={tool} />
      <TraceTitle className="max-w-full shrink-0 whitespace-normal">{sentenceOf(tool)}</TraceTitle>
      <Subject subject={tool.subject} />
      {tool.kind === 'run_command' && tool.state === 'running' && <Running />}
    </TraceLine>
  )
  if (detail === undefined) return line
  const growing = tool.state === 'running' && detail.kind === 'command'
  return (
    <TraceCollapsible open={chosen ?? growing} onOpenChange={setChosen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Opened detail={detail} />
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
