import type { FailureCode, ToolSearchResult } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { cn } from '../../ui/cn.ts'
import { failureDetail, thrownOf } from './connector-specs.ts'
import { ProgramSuccess } from './machine-specs.ts'
import { Markdown } from './markdown.tsx'
import type { Room } from './room.ts'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { calledText, READY_TOOL } from './text.ts'
import { shown } from './tool-args.ts'
import { specOf } from './tool-registry.ts'

export const BLOCK =
  'max-h-64 overflow-auto rounded-control bg-surface-3 p-sm font-mono text-fact text-text-2 whitespace-pre-wrap wrap-break-word'

export function textOf(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value === '' ? undefined : value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function Labelled({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-xxs">
      <span className="font-sans text-text-2">{label}</span>
      <pre className={BLOCK}>{shown(text)}</pre>
    </div>
  )
}

/** A call's arguments and result; `said` is what its line says beside the sentence, here whole. */
export function Generic({ tool, title, said }: { tool: ToolItem; title: string; said?: string }) {
  const args =
    typeof tool.args === 'object' && tool.args !== null && Object.keys(tool.args).length > 0
  const result = tool.result === undefined ? undefined : (textOf(tool.result) ?? '')
  return (
    <div className="flex min-w-0 flex-col gap-xs font-mono text-fact text-text-2">
      <div className="font-sans font-semibold text-text">{title}</div>
      {said !== undefined && <div className="font-sans text-text">{said}</div>}
      {args && <Labelled label="Argumentos:" text={textOf(tool.args) ?? ''} />}
      {result !== undefined && <Labelled label="Resultado:" text={result} />}
    </div>
  )
}

/**
 * A program the agent ran: only what it returned, and what it logged when it logged anything. Not
 * the program's code and not Mastra's envelope around the result (the founder, step 24.4 U5).
 */
export function Program({ tool, title }: { tool: ToolItem; title: string }) {
  const done = ProgramSuccess.safeParse(tool.result).data
  const result = textOf(done?.result)
  const logs = done?.logs?.map((line) => textOf(line) ?? '').join('\n')
  return (
    <div className="flex min-w-0 flex-col gap-xs font-mono text-fact text-text-2">
      <div className="font-sans font-semibold text-text">{title}</div>
      {result !== undefined && <Labelled label="Resultado:" text={result} />}
      {logs !== undefined && logs !== '' && <Labelled label="Registros:" text={logs} />}
    </div>
  )
}

/** What a library search found: one line per tool, with its connector's logo, its name and its version (or "pronta"). */
export function Library({ found }: { found: ToolSearchResult }) {
  const { connectors } = useRoom()
  const lines = [
    ...found.tools.map((one) => ({
      key: one.id,
      connectionId: one.connectionId,
      name: one.description,
      fact: `v${one.latest.number}`,
    })),
    ...found.ready.map((one) => ({
      key: `${one.connectionId}-${one.operation}`,
      connectionId: one.connectionId,
      name: one.label,
      fact: READY_TOOL,
    })),
  ]
  return (
    <ul className="m-0 flex min-w-0 list-none flex-col gap-xs p-0">
      {lines.map((line) => {
        const logo = connectors.logoOf(line.connectionId)
        return (
          <li key={line.key} className="flex min-w-0 items-center gap-sm">
            {logo !== undefined && <ConnectorLogo small entry={{ logo }} />}
            <span className="min-w-0 flex-1 truncate text-text">{line.name}</span>
            <span className="shrink-0 text-fact text-text-2">{line.fact}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** The agent's answer to the Construtor's test question, and how many tools it called. */
export function Answer({ text, called }: { text: string; called: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <Markdown text={text} />
      {called > 0 && <p className="text-fact text-text-2">{calledText(called)}</p>}
    </div>
  )
}

function isFailureCode(code: string): code is FailureCode {
  return Object.hasOwn(FAILURES, code)
}

/** A tool that failed with the Hub's own code (the machine that would not start) says the code's sentence, not the code. */
function reasonOf(tool: ToolItem): string {
  const text = tool.errorText ?? textOf(tool.result)
  if (text === undefined) return 'Ocorreu um erro ao executar a ferramenta.'
  const code = text.trim()
  return isFailureCode(code) ? sentenceOfCode(code) : text
}

/** Whether the agent's read failed with a kind that asks the person to link the connection again. */
export function asksToReconnect(tool: ToolItem, room: Room): boolean {
  const kind = thrownOf(tool)?.kind
  return kind !== undefined && specOf(tool.toolName, room)?.reconnects?.includes(kind) === true
}

export function Reason({ tool }: { tool: ToolItem }) {
  const detail = failureDetail(tool, useRoom())
  if (detail === null) return null
  if (detail === undefined)
    return <pre className={cn(BLOCK, 'text-danger')}>{shown(reasonOf(tool))}</pre>
  return (
    <>
      <p className="font-semibold text-danger">{detail.label}</p>
      {detail.message !== undefined && (
        <pre className={cn(BLOCK, 'text-danger')}>{shown(detail.message)}</pre>
      )}
    </>
  )
}
