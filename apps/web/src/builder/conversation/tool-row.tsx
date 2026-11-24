import { TestedResult, ToolSearchResult } from '@conexus/hub-api'
import { Link, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import type { ToolLineBeside, ToolLineState } from '../../ui/ai/tool-line.tsx'
import { ToolLine } from '../../ui/ai/tool-line.tsx'
import { cn } from '../../ui/cn.ts'
import { TraceDescription } from '../../ui/trace.tsx'
import { failureDetail } from './connector-specs.ts'
import { useSecondsSince } from './elapsed.ts'
import type { Room } from './room.ts'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { durationOf } from './text.ts'
import type { Edit } from './tool-args.ts'
import { editOf, shown, stringArg } from './tool-args.ts'
import {
  Answer,
  asksToReconnect,
  BLOCK,
  Generic,
  Library,
  Program,
  QueryBlock,
  Reason,
  Research,
  SkillBlock,
  textOf,
} from './tool-bodies.tsx'
import { cardOf } from './tool-cards.tsx'
import type { ToolBody, ToolStatus } from './tool-registry.ts'
import { presentTool, readable, specOf, toolStatus } from './tool-registry.ts'

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
  // A refusal the Assistant's tool answered is said by its line; a refusal with its own fields has more to say.
  const refusal = specOf(tool.toolName, room)?.refusal?.(tool.result)
  if (refusal !== undefined) return refusal !== 'SAID'
  if (status === 'error' || status === 'denied')
    return failureDetail(tool, room) !== null || asksToReconnect(tool, room)
  if (tool.output !== undefined && tool.output.length > 0) return true
  if (tool.result !== undefined && tool.result !== null) return true
  return (
    tool.args !== undefined &&
    tool.args !== null &&
    typeof tool.args === 'object' &&
    Object.keys(tool.args).length > 0
  )
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

/** The heading of an open row: its sentence in Portuguese, or the readable name for a tool outside the table. */
function titleOf(toolName: string, room: Room) {
  return specOf(toolName, room)?.done ?? readable(toolName)
}

/** What the line says beside its sentence, which the open row says whole. */
function besideOf(tool: ToolItem, room: Room): string | undefined {
  const presented = presentTool(tool, 'done', room)
  return presented.beside ? presented.detail : undefined
}

function Block({ tool, body }: { tool: ToolItem; body: ToolBody }) {
  const room = useRoom()
  const detail = presentTool(tool, 'done', room).detail
  const title = titleOf(tool.toolName, room)
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
    case 'skill':
      return <SkillBlock tool={tool} />
    case 'library': {
      const found = ToolSearchResult.safeParse(tool.result).data
      return found === undefined ? <Generic tool={tool} title={title} /> : <Library found={found} />
    }
    case 'answer': {
      const tested = TestedResult.safeParse(tool.result).data
      return tested?.kind === 'ANSWERED' ? (
        <Answer text={tested.text} called={tested.tools.length} />
      ) : (
        <Generic tool={tool} title={title} />
      )
    }
    case 'research':
      return <Research tool={tool} title={title} />
    case 'program':
      return <Program tool={tool} title={title} />
    case 'query':
      return <QueryBlock sql={stringArg(tool.args, 'sql') ?? ''} />
    default:
      return <Generic tool={tool} title={title} said={besideOf(tool, room)} />
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

function Body({ tool, status }: { tool: ToolItem; status: ToolStatus }) {
  const room = useRoom()
  const spec = specOf(tool.toolName, room)
  if (spec?.refusal?.(tool.result) === 'RECONNECT' || asksToReconnect(tool, room))
    return <Reconnect />
  if (spec?.refusal?.(tool.result) === 'DETAILED')
    return (
      <div className="flex min-w-0 flex-col gap-xs pt-xs">
        <Generic tool={tool} title={spec.failed} said={presentTool(tool, status, room).detail} />
      </div>
    )
  const body = spec?.body ?? 'generic'
  const edit = editOf(body, tool.args)
  const failed = status === 'error' || status === 'denied'
  return (
    <div className="flex min-w-0 flex-col gap-xs pt-xs">
      {failed && <Reason tool={tool} />}
      {edit !== undefined ? <Change edit={edit} /> : !failed && <Block tool={tool} body={body} />}
    </div>
  )
}

/** What the line says beside its sentence: the detail the tool names, or the clock of a call that runs. */
function besideLine(
  presented: ReturnType<typeof presentTool>,
  status: ToolStatus,
  startedAt: ToolItem['startedAt'],
): ToolLineBeside {
  if (presented.beside) return { kind: 'DETAIL', text: presented.detail ?? '' }
  if (status === 'running') return { kind: 'CLOCK', clock: <Since at={startedAt} /> }
  return { kind: 'NONE' }
}

function lineState(status: ToolStatus): ToolLineState {
  if (status === 'error' || status === 'denied') return { kind: 'FAILED' }
  return status === 'running' ? { kind: 'RUNNING' } : { kind: 'DONE' }
}

/**
 * A line of tool invocation (Criterion 8).
 * Opens on the body its tool's row in the table names.
 */
export function ToolRow({ tool }: { tool: ToolItem }) {
  const room = useRoom()
  const status = toolStatus(tool, room)
  const special = status === 'done' ? cardOf(tool, room) : undefined
  if (special !== undefined) return special
  const presented = presentTool(tool, status, room)
  return (
    <ToolLine
      icon={presented.icon}
      sentence={presented.sentence}
      state={lineState(status)}
      beside={besideLine(presented, status, tool.startedAt)}
      body={opens(tool, status, room) ? <Body tool={tool} status={status} /> : undefined}
    />
  )
}
