import type { ToolSearchResult } from '@conexus/hub-api'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { Markdown } from './markdown.tsx'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { calledText, READY_TOOL } from './text.ts'
import { shown } from './tool-args.ts'

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

export function Generic({ tool, title }: { tool: ToolItem; title: string }) {
  const args =
    typeof tool.args === 'object' && tool.args !== null && Object.keys(tool.args).length > 0
  const result = tool.result === undefined ? undefined : (textOf(tool.result) ?? '')
  return (
    <div className="flex min-w-0 flex-col gap-xs font-mono text-fact text-text-2">
      <div className="font-sans font-semibold text-text">{title}</div>
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
