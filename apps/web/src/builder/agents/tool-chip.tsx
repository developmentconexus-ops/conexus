import type { AgentTool } from '@conexus/hub-api'
import { Logo } from '../assistant/public.ts'

/** A tool the draft chose: its connector's logo, the name a person reads and the version the agent holds. */
export function ToolChip(props: { logo: string | undefined; title: string; tool: AgentTool }) {
  return (
    <li className="flex min-w-0 items-center gap-xs rounded-control border border-line px-sm py-xs">
      <Logo logo={props.logo} />
      <span className="truncate">{props.title}</span>
      <span className="shrink-0 text-fact text-text-2">v{props.tool.version.number}</span>
    </li>
  )
}
