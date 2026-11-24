import type { AgentDetail, CompanyId, ProjectId } from '@conexus/hub-api'
import { useId } from 'react'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { Switch } from '../../ui/switch.tsx'

type Scope = { companyId: CompanyId; projectId: ProjectId }
export type Part = { scope: Scope; agent: AgentDetail }

/** One section of the agent's page: the name on the left, the value on the right, busy while its write is on its way and its refusal under it until it saves. */
export function Section(props: {
  title: string
  children: React.ReactNode
  busy?: boolean
  error?: string | undefined
}) {
  const id = useId()
  return (
    <SettingsSection id={id} title={props.title} compact>
      <div aria-busy={props.busy} className="flex min-w-0 flex-col gap-sm">
        {props.children}
        {props.error !== undefined && (
          <p role="alert" className="text-danger">
            {props.error}
          </p>
        )}
      </div>
    </SettingsSection>
  )
}

export function Toggle(props: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-md">
      <label htmlFor={id}>{props.label}</label>
      <Switch id={id} checked={props.checked} onCheckedChange={props.onChange} />
    </div>
  )
}
