import type { AgentDetail, CompanyId, ProjectId } from '@conexus/hub-api'
import { ComputerIcon, GlobeIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { DialogBody, DialogFooter } from '../../ui/dialog.tsx'
import { Switch } from '../../ui/switch.tsx'
import { ROW } from '../assistant/public.ts'
import { COMPUTER_TOOL, CONEXUS_TOOLS, WEB_TOOL } from './text.ts'
import type { Saving } from './use-draft-save.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Part = { scope: Scope; agent: AgentDetail }

/** A row of the chooser: the logo plate, the name, what sits at its end, and a switch, the pieces of the "+" menu. */
function ChoiceRow(props: {
  id: string
  leading: ReactNode
  title: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <li className={cn(ROW, 'justify-between')}>
      <label htmlFor={props.id} className="flex min-w-0 flex-1 items-center gap-sm">
        {props.leading}
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{props.title}</span>
        </span>
      </label>
      <Switch id={props.id} checked={props.checked} onCheckedChange={props.onChange} />
    </li>
  )
}

function Group(props: { title: string; children: ReactNode }) {
  return (
    <section aria-label={props.title} className="flex flex-col">
      <h4 className="flex h-row items-center gap-sm px-sm font-body text-label font-semibold">
        {props.title}
      </h4>
      <ul className="flex flex-col">{props.children}</ul>
    </section>
  )
}

/** The group of Conexus's own tools: the web search and the Computador. */
function ConexusGroup(props: {
  chosen: { web: boolean; machine: boolean }
  onToggle: { web: () => void; machine: () => void }
}) {
  const { chosen, onToggle } = props
  return (
    <Group title={CONEXUS_TOOLS}>
      <ChoiceRow
        id="tool-web"
        leading={<GlobeIcon aria-hidden="true" className="size-5 shrink-0" />}
        title={WEB_TOOL}
        checked={chosen.web}
        onChange={onToggle.web}
      />
      <ChoiceRow
        id="tool-machine"
        leading={<ComputerIcon aria-hidden="true" className="size-5 shrink-0" />}
        title={COMPUTER_TOOL}
        checked={chosen.machine}
        onChange={onToggle.machine}
      />
    </Group>
  )
}

/**
 * The window of the Ferramentas section: Conexus's own tools. A connection's tools are chosen under
 * that connection in Ligações, never here (decision E4, one list). Nothing is saved until **Usar as escolhidas**.
 */
export function Chooser(props: Part & { saving: Saving; onClose: () => void }) {
  const { agent } = props
  const [web, setWeb] = useState(agent.draft.web)
  const [machine, setMachine] = useState(agent.draft.machine)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-md">
      <DialogBody className="flex flex-col gap-md">
        <ConexusGroup
          chosen={{ web, machine }}
          onToggle={{
            web: () => setWeb((now) => !now),
            machine: () => setMachine((now) => !now),
          }}
        />
      </DialogBody>
      <DialogFooter>
        {props.saving.error !== undefined && (
          <p role="alert" className="text-danger">
            {props.saving.error}
          </p>
        )}
        <Button
          variant="primary"
          disabled={props.saving.pending}
          onClick={() => props.saving.save({ web, machine }, props.onClose)}
        >
          Usar as escolhidas
        </Button>
        <Button variant="ghost" onClick={props.onClose}>
          Cancelar
        </Button>
      </DialogFooter>
    </div>
  )
}
