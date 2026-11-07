import type { AgentDetail } from '@conexus/hub-api'
import { ComputerIcon, GlobeIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { ROW } from '../assistant/public.ts'
import { Chooser } from './chooser.tsx'
import { Creator } from './creator.tsx'
import type { Part } from './section.tsx'
import { Section } from './section.tsx'
import { ADD_FROM_LIBRARY, COMPUTER_TOOL, NO_TOOLS, WEB_TOOL } from './text.ts'
import type { Saving } from './use-draft-save.ts'
import { useDraftSave } from './use-draft-save.ts'

/** A tool of Conexus's own that the draft chose: the web search, the Computador. */
function ConexusRow(props: { icon: ReactNode; title: string; onRemove: () => void }) {
  return (
    <li className={cn(ROW, 'justify-between')}>
      <span className="flex min-w-0 flex-1 items-center gap-sm">
        {props.icon}
        <span className="truncate">{props.title}</span>
      </span>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Tirar ${props.title}`}
        onClick={props.onRemove}
      >
        Tirar
      </Button>
    </li>
  )
}

/** The draft's own Conexus tools it chose, each with its **Tirar**: the web search and the Computador. */
function ConexusRows(props: { draft: AgentDetail['draft']; saving: Saving }) {
  const { draft, saving } = props
  return (
    <>
      {draft.web && (
        <ConexusRow
          icon={<GlobeIcon aria-hidden="true" className="size-5 shrink-0" />}
          title={WEB_TOOL}
          onRemove={() => saving.save({ web: false })}
        />
      )}
      {draft.machine && (
        <ConexusRow
          icon={<ComputerIcon aria-hidden="true" className="size-5 shrink-0" />}
          title={COMPUTER_TOOL}
          onRemove={() => saving.save({ machine: false })}
        />
      )}
    </>
  )
}

/** **Ferramentas**: Conexus's own tools the draft chose; a connection's tools sit under it in **Ligações** (decision E4, one list). */
export function Tools(props: Part) {
  const { agent } = props
  const saving = useDraftSave(props.scope, agent.id)
  const [mode, setMode] = useState<'choose' | 'create'>()
  function close() {
    setMode(undefined)
  }
  return (
    <Section
      title="Ferramentas"
      busy={saving.pending}
      error={saving.refused?.field === 'tools' ? saving.refused.reason : saving.error}
    >
      {!agent.draft.web && !agent.draft.machine && <p className="text-text-2">{NO_TOOLS}</p>}
      <ul className="flex flex-col">
        <ConexusRows draft={agent.draft} saving={saving} />
      </ul>
      <div className="flex flex-wrap gap-sm">
        <Button size="sm" onClick={() => setMode('choose')}>
          {ADD_FROM_LIBRARY}
        </Button>
        <Button size="sm" onClick={() => setMode('create')}>
          Criar
        </Button>
      </div>
      <Dialog open={mode !== undefined} onOpenChange={(open) => !open && close()}>
        <DialogContent
          size="fields"
          title={mode === 'create' ? 'Criar ferramenta' : ADD_FROM_LIBRARY}
        >
          {mode === 'choose' && <Chooser {...props} saving={saving} onClose={close} />}
          {mode === 'create' && <Creator {...props} saving={saving} onClose={close} />}
        </DialogContent>
      </Dialog>
    </Section>
  )
}
