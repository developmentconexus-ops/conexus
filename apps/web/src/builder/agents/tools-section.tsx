import { GlobeIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { Logo, ROW, useConnectorCatalog } from '../assistant/public.ts'
import { Chooser } from './chooser.tsx'
import { Creator } from './creator.tsx'
import type { Part } from './section.tsx'
import { Section } from './section.tsx'
import {
  ADD_FROM_LIBRARY,
  connectionOf,
  NO_TOOLS,
  newVersionText,
  readOfTool,
  toolFact,
  toolTitle,
  WEB_TOOL,
} from './text.ts'
import { useDraftSave } from './use-draft-save.ts'

function WebRow(props: { onRemove: () => void }) {
  return (
    <li className={cn(ROW, 'justify-between')}>
      <span className="flex min-w-0 flex-1 items-center gap-sm">
        <GlobeIcon aria-hidden="true" className="size-5 shrink-0" />
        <span className="truncate">{WEB_TOOL}</span>
      </span>
      <Button size="sm" variant="ghost" aria-label={`Tirar ${WEB_TOOL}`} onClick={props.onRemove}>
        Tirar
      </Button>
    </li>
  )
}

/** **Ferramentas**: the tools the draft chose, each with its connector's logo, its version and what it does; the web is one of them. */
export function Tools(props: Part) {
  const { agent } = props
  const saving = useDraftSave(props.scope, agent.id)
  const catalog = useConnectorCatalog(props.scope.companyId)
  const [mode, setMode] = useState<'choose' | 'create'>()
  const several = agent.offered.length > 1
  function close() {
    setMode(undefined)
  }
  return (
    <Section
      title="Ferramentas"
      busy={saving.pending}
      error={saving.refused?.field === 'tools' ? saving.refused.reason : saving.error}
    >
      {agent.tools.length === 0 && !agent.draft.web && <p className="text-text-2">{NO_TOOLS}</p>}
      <ul className="flex flex-col">
        {agent.tools.map((tool) => {
          const described = { ...tool, description: tool.version.description }
          const title = toolTitle(described, agent.offered)
          const connection = connectionOf(agent.offered, tool.connectionId)
          return (
            <li key={tool.id} className={cn(ROW, 'h-auto min-h-row justify-between py-xs')}>
              <span className="flex min-w-0 flex-1 items-center gap-sm">
                <Logo logo={catalog.logo(connection?.connector ?? '')} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{title}</span>
                  {readOfTool(described, agent.offered) === undefined && (
                    <span className="truncate text-fact text-text-2">{tool.slug}</span>
                  )}
                  {connection !== undefined && (
                    <span className="truncate text-fact text-text-2">
                      {toolFact(
                        catalog.name(connection.connector),
                        several ? connection.name : undefined,
                        tool.effect,
                      )}
                    </span>
                  )}
                  {tool.latest.number > tool.version.number && (
                    <span className="flex flex-wrap items-center gap-xs">
                      <span className="text-fact text-text-2">
                        {newVersionText(tool.latest.number)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          saving.save((now) => ({
                            tools: now.tools.map((one) =>
                              one.id === tool.id ? tool.latest.id : one.version.id,
                            ),
                          }))
                        }
                      >
                        Usar a versão {tool.latest.number}
                      </Button>
                    </span>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-xs">
                <span className="text-fact text-text-2">v{tool.version.number}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Tirar ${title}`}
                  onClick={() =>
                    saving.save((now) => ({
                      tools: now.tools
                        .filter((one) => one.id !== tool.id)
                        .map((one) => one.version.id),
                    }))
                  }
                >
                  Tirar
                </Button>
              </span>
            </li>
          )
        })}
        {agent.draft.web && <WebRow onRemove={() => saving.save({ web: false })} />}
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
