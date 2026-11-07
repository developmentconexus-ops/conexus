import type { AgentDetail, ToolVersionId } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { Button } from '../../ui/button.tsx'
import { Checkbox } from '../../ui/checkbox.tsx'
import { newVersionText } from './text.ts'

/** The version ids of the agent's tools, but the ones named: what a change of the list starts from. */
export function versionsOf(
  now: AgentDetail,
  without: ReadonlySet<string> = new Set(),
): ToolVersionId[] {
  return now.tools.filter((one) => !without.has(one.id)).map((one) => one.version.id)
}

/** One tool of a connection as a line: the mark, the title with what it says under it, and the newer version it offers. */
export function Line(props: {
  id: string
  title: string
  detail?: string | undefined
  warning?: string | undefined
  checked: boolean
  disabled: boolean
  onChange: (on: boolean) => void
  /** The chosen tool, when a newer version of it exists. */
  newer?: { number: number; onUse: () => void } | undefined
  /** A word beside the title, as "escreve" marks a write. */
  tag?: string | undefined
  /** What sits under the line once it is marked, as a write's key. */
  below?: ReactNode
}) {
  return (
    <li className="flex flex-wrap items-start gap-sm py-xs">
      <Checkbox
        id={props.id}
        checked={props.checked}
        disabled={props.disabled}
        onCheckedChange={props.onChange}
      />
      <label htmlFor={props.id} className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-baseline gap-x-sm">
          <span>{props.title}</span>
          {props.tag !== undefined && <span className="text-fact text-text-2">{props.tag}</span>}
        </span>
        {props.detail !== undefined && (
          <span className="text-fact text-text-2">{props.detail}</span>
        )}
        {props.warning !== undefined && (
          <span className="text-fact text-danger">{props.warning}</span>
        )}
      </label>
      {props.newer !== undefined && (
        <span className="flex flex-wrap items-center gap-xs">
          <span className="text-fact text-text-2">{newVersionText(props.newer.number)}</span>
          <Button size="sm" onClick={props.newer.onUse}>
            Usar a versão {props.newer.number}
          </Button>
        </span>
      )}
      {props.below !== undefined && <div className="basis-full pl-xl">{props.below}</div>}
    </li>
  )
}
