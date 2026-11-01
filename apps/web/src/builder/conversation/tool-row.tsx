import { ProposedApp, ShownFile } from '@conexus/hub-api'
import { Link, useParams } from '@tanstack/react-router'
import { FileTextIcon } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../ui/trace.tsx'
import { refusedResult } from './assistant-specs.ts'
import { readOutcome } from './connector-specs.ts'
import { useSecondsSince } from './elapsed.ts'
import type { Room } from './room.ts'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { durationOf } from './text.ts'
import type { Edit } from './tool-args.ts'
import { editOf, shown } from './tool-args.ts'
import type { ToolBody, ToolStatus } from './tool-registry.ts'
import { presentTool, readable, specOf, toolStatus } from './tool-registry.ts'

const BLOCK =
  'max-h-64 overflow-auto rounded-control bg-surface-3 p-sm font-mono text-fact text-text-2 whitespace-pre-wrap wrap-break-word'

function textOf(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value === '' ? undefined : value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function fieldOf(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = Reflect.get(obj, key)
    return typeof val === 'string' ? val : undefined
  }
  return undefined
}

/** The clock of a call that runs, from when the screen first heard of it. */
function Since({ at }: { at: number | undefined }) {
  const [mounted] = useState(Date.now)
  const seconds = useSecondsSince(at ?? mounted)
  return (
    <TraceDescription aria-hidden="true" className="shrink-0 text-fact">
      ({durationOf(seconds)})
    </TraceDescription>
  )
}

function opens(tool: ToolItem, status: ToolStatus, room: Room): boolean {
  // A refusal the Assistant's tool answered is said by its line; only a connection to link again has more to say.
  if (refusedResult(tool, room) !== undefined) return readOutcome(tool.result)?.kind === 'REAUTH'
  if (status === 'error' || status === 'denied') return true
  if (tool.output !== undefined && tool.output.length > 0) return true
  if (tool.result !== undefined && tool.result !== null) return true
  return (
    tool.args !== undefined &&
    tool.args !== null &&
    typeof tool.args === 'object' &&
    Object.keys(tool.args).length > 0
  )
}

function Reason({ tool }: { tool: ToolItem }) {
  const reason =
    tool.errorText ?? textOf(tool.result) ?? 'Ocorreu um erro ao executar a ferramenta.'
  return <pre className={cn(BLOCK, 'text-danger')}>{shown(reason)}</pre>
}

function Side(props: { sign: '-' | '+'; text: string; className: string }) {
  const { sign, text, className } = props
  if (text === '') return null
  const lines = text.split('\n').map((line, at) => ({ line, at }))
  return (
    <div className={className}>
      {lines.map((row) => (
        <div key={row.at} className="flex whitespace-pre-wrap">
          <span aria-hidden="true" className="w-4 shrink-0 select-none">
            {sign}
          </span>
          <span className="min-w-0 wrap-break-word">{row.line}</span>
        </div>
      ))}
    </div>
  )
}

function Change({ edit }: { edit: Edit }) {
  if ('content' in edit) {
    return (
      <fieldset aria-label="Arquivo escrito" className="m-0 min-w-0 border-0 p-0">
        <pre className={BLOCK}>{shown(edit.content)}</pre>
      </fieldset>
    )
  }
  return (
    <fieldset
      aria-label="Mudança no arquivo"
      className={cn(BLOCK, 'm-0 flex min-w-0 flex-col border-0')}
    >
      <Side sign="-" text={shown(edit.before)} className="text-danger" />
      <Side sign="+" text={shown(edit.after)} className="text-success" />
    </fieldset>
  )
}

function Block({ tool, body }: { tool: ToolItem; body: ToolBody }) {
  const detail = presentTool(tool, 'done').detail
  switch (body) {
    case 'command': {
      const output = tool.output ?? textOf(tool.result)
      return (
        <>
          <pre className={BLOCK}>
            {[`$ ${shown(detail ?? '')}`, output === undefined ? undefined : shown(output)]
              .filter(Boolean)
              .join('\n')}
          </pre>
          {tool.exitCode !== undefined && tool.exitCode !== 0 && (
            <p className="text-fact text-text-2">
              O comando terminou com o código {tool.exitCode}.
            </p>
          )}
        </>
      )
    }
    case 'file': {
      const result = textOf(tool.result)
      const display = result !== undefined ? shown(result) : detail ? `$ cat ${detail}` : ''
      return <pre className={BLOCK}>{display}</pre>
    }
    case 'list': {
      const result = textOf(tool.result)
      return <pre className={BLOCK}>{result !== undefined ? shown(result) : (detail ?? '')}</pre>
    }
    case 'skill': {
      const name = fieldOf(tool.args, 'name') ?? fieldOf(tool.result, 'name')
      const instructions =
        fieldOf(tool.args, 'instructions') ??
        fieldOf(tool.result, 'instructions') ??
        (typeof tool.result === 'string' ? tool.result : undefined)
      return (
        <>
          {name && <div className="font-semibold text-text">{name}</div>}
          {instructions && <pre className={BLOCK}>{shown(instructions)}</pre>}
        </>
      )
    }
    default: {
      const args =
        typeof tool.args === 'object' && tool.args !== null && Object.keys(tool.args).length > 0
      const result = tool.result === undefined ? undefined : (textOf(tool.result) ?? '')
      return (
        <div className="flex min-w-0 flex-col gap-xs font-mono text-fact text-text-2">
          <div className="font-sans font-semibold text-text">{readable(tool.toolName)}</div>
          {args && (
            <div className="flex flex-col gap-xxs">
              <span className="font-sans text-text-2">Argumentos:</span>
              <pre className={BLOCK}>{shown(textOf(tool.args) ?? '')}</pre>
            </div>
          )}
          {result !== undefined && (
            <div className="flex flex-col gap-xxs">
              <span className="font-sans text-text-2">Resultado:</span>
              <pre className={BLOCK}>{shown(result)}</pre>
            </div>
          )}
        </div>
      )
    }
  }
}

/** Where a connection that asks to be linked again is linked: Integrações. */
function Reconnect() {
  const companyId = useParams({ strict: false, select: (params) => params.companyId })
  if (companyId === undefined) return null
  return (
    <Link
      to="/companies/$companyId/integrations"
      params={{ companyId }}
      className="w-fit text-label underline"
    >
      Abrir Integrações
    </Link>
  )
}

/** The Assistant's shown file, a button that opens it beside the chat. */
function ShownLine(props: {
  file: Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>
  /** The screen heard the call as it ran: the file opens by itself, once; a conversation read afterwards waits for the click. */
  live: boolean
}) {
  const { file } = props
  const room = useRoom()
  const open = useEffectEvent(() => room.openFile?.(file))
  useEffect(() => {
    if (props.live) open()
  }, [props.live])
  return (
    <Button
      aria-label={`Abrir ${file.name}`}
      aria-pressed={room.openedPath === file.path}
      onClick={() => room.openFile?.(file)}
      className="w-fit max-w-full"
    >
      <FileTextIcon aria-hidden="true" />
      <span className="truncate">{file.name}</span>
    </Button>
  )
}

/** The Assistant's proposal: the request it summarized, and **Criar app**. */
function ProposalCard({ summary }: { summary: string }) {
  const room = useRoom()
  return (
    <div className="flex flex-col items-start gap-sm rounded-card border border-line bg-surface p-md">
      <p className="whitespace-pre-wrap break-words text-text">{summary}</p>
      <Button variant="primary" onClick={() => room.createApp?.(summary)}>
        Criar app
      </Button>
    </div>
  )
}

function Body({ tool, status }: { tool: ToolItem; status: ToolStatus }) {
  const room = useRoom()
  if (refusedResult(tool, room) !== undefined) return <Reconnect />
  const body = specOf(tool.toolName)?.body ?? 'generic'
  const edit = editOf(body, tool.args)
  const failed = status === 'error' || status === 'denied'
  return (
    <div className="flex min-w-0 flex-col gap-xs pt-xs">
      {failed && <Reason tool={tool} />}
      {edit !== undefined ? <Change edit={edit} /> : !failed && <Block tool={tool} body={body} />}
    </div>
  )
}

/**
 * A line of tool invocation (Criterion 8).
 * Opens on the body its tool's row in the table names.
 */
export function ToolRow({ tool }: { tool: ToolItem }) {
  const room = useRoom()
  const status = toolStatus(tool, room)
  const shownTool = presentTool(tool, status, room)
  // Only a command that is still saying its output shows it as it comes; the person's click rules after.
  const [chosen, setChosen] = useState<boolean>()
  const open = chosen ?? (status === 'running' && tool.output !== undefined)
  const failed = status === 'error' || status === 'denied'
  const lineStatus = failed ? 'error' : status === 'running' ? 'running' : undefined
  const side = shownTool.beside ? (
    <TraceDescription className="min-w-0 max-w-1/2 truncate">{shownTool.detail}</TraceDescription>
  ) : status === 'running' ? (
    <Since at={tool.startedAt} />
  ) : null
  const line = (
    <TraceLine status={lineStatus}>
      <TraceIcon>
        <shownTool.icon />
      </TraceIcon>
      <TraceTitle className={shownTool.beside ? 'flex-1 whitespace-normal' : undefined}>
        {shownTool.sentence}
      </TraceTitle>
      {side}
    </TraceLine>
  )

  const shownFile = ShownFile.safeParse(tool.result).data
  if (
    specOf(tool.toolName)?.body === 'shown' &&
    status === 'done' &&
    shownFile?.kind !== 'SHOW_REFUSED' &&
    shownFile !== undefined
  )
    return <ShownLine file={shownFile} live={tool.startedAt !== undefined} />
  const proposed =
    specOf(tool.toolName)?.body === 'proposal' && status === 'done'
      ? ProposedApp.safeParse(tool.result).data
      : undefined
  if (proposed !== undefined) return <ProposalCard summary={proposed.summary} />

  if (!opens(tool, status, room)) return line

  return (
    <TraceCollapsible open={open} onOpenChange={setChosen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Body tool={tool} status={status} />
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
