import type { AgentDetail, CompanyId, ProjectId, ToolVersionId } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Dialog, DialogContent, DialogFooter } from '../../ui/dialog.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Switch } from '../../ui/switch.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import {
  Logo,
  matches,
  ROW,
  SEARCH_FROM,
  Search,
  useConnectorCatalog,
} from '../assistant/public.ts'
import { accountsQuery, modelLabel } from '../model-accounts/public.ts'
import { Chooser } from './chooser.tsx'
import { sendTool } from './queries.ts'
import {
  connectionOf,
  GONE_CONNECTION,
  NO_CONNECTIONS,
  NO_TOOLS,
  toolTitle,
  UNCONFIRMED_SAVE,
} from './text.ts'
import { ToolForm } from './tool-form.tsx'
import type { Saving } from './use-draft-save.ts'
import { useDraftSave } from './use-draft-save.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Part = { scope: Scope; agent: AgentDetail }
type Dialogue = Part & { saving: Saving; onClose: () => void }
const SAME = 'same'

/** One section of the panel: busy while its write is on its way, and its refusal under it until it saves. */
function Section(props: {
  title: string
  children: React.ReactNode
  busy?: boolean
  error?: string | undefined
}) {
  return (
    <section
      aria-label={props.title}
      aria-busy={props.busy}
      className="flex flex-col gap-sm border-b border-line py-md last:border-b-0"
    >
      <h3 className="font-body text-label font-semibold">{props.title}</h3>
      {props.children}
      {props.error !== undefined && (
        <p role="alert" className="text-danger">
          {props.error}
        </p>
      )}
    </section>
  )
}

function Instructions({ scope, agent }: Part) {
  const saving = useDraftSave(scope, agent.id)
  const saved = agent.draft.instructions
  const [text, setText] = useState(saved)
  const [seen, setSeen] = useState(saved)
  if (saved !== seen) {
    setSeen(saved)
    // Another writer's text takes the field only while the field holds nothing the person has not saved.
    if (text === seen && saving.error === undefined) setText(saved)
  }
  return (
    <Section title="Instruções" busy={saving.pending} error={saving.error}>
      <Textarea
        aria-label="Instruções"
        className="min-h-40"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          if (text !== saved || saving.error !== undefined) saving.save({ instructions: text })
        }}
      />
    </Section>
  )
}

function ModelSection({ scope, agent }: Part) {
  const saving = useDraftSave(scope, agent.id)
  const read = useQuery(accountsQuery(scope.companyId))
  const models =
    read.data?.choices.mine.flatMap((provider) => provider.models.map((one) => one.id)) ?? []
  const items = [
    { value: SAME, label: 'O modelo de quem conversa' },
    ...models.map((id) => ({ value: id, label: modelLabel(id) })),
  ]
  return (
    <Section title="Modelo" busy={saving.pending} error={saving.error}>
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      <Select
        value={agent.draft.model ?? SAME}
        items={items}
        disabled={read.data === undefined}
        onValueChange={(next) => {
          const model = models.find((id) => id === next) ?? null
          saving.save({ model })
        }}
      >
        <SelectTrigger aria-label="Modelo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Section>
  )
}

function Toggle(props: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-md">
      <label htmlFor={id}>{props.label}</label>
      <Switch id={id} checked={props.checked} onCheckedChange={props.onChange} />
    </div>
  )
}

function Connections({ scope, agent }: Part) {
  const saving = useDraftSave(scope, agent.id)
  const catalog = useConnectorCatalog(scope.companyId)
  const chosen = agent.draft.connections
  const gone = chosen.filter((id) => !agent.offered.some((one) => one.connectionId === id))
  function change(id: (typeof chosen)[number], on: boolean) {
    saving.save((now) => {
      const others = now.draft.connections.filter((one) => one !== id)
      return { connections: on ? [...others, id] : others }
    })
  }
  return (
    <Section title="Ligações" busy={saving.pending} error={saving.error}>
      {agent.offered.length === 0 && gone.length === 0 && (
        <p className="text-text-2">{NO_CONNECTIONS}</p>
      )}
      {agent.offered.map((one) => (
        <Toggle
          key={one.connectionId}
          label={`${catalog.name(one.connector)} · ${one.name}`}
          checked={chosen.includes(one.connectionId)}
          onChange={(on) => change(one.connectionId, on)}
        />
      ))}
      {gone.map((id) => (
        <div key={id} className="flex items-center justify-between gap-md text-danger">
          <span>{GONE_CONNECTION}</span>
          <Button size="sm" variant="ghost" onClick={() => change(id, false)}>
            Tirar
          </Button>
        </div>
      ))}
    </Section>
  )
}

function Creator(props: Dialogue) {
  const { scope, agent } = props
  const create = useMutation(sendTool)
  const attempt = useAttemptKey()
  const [error, setError] = useState<string>()
  const [refused, setRefused] = useState<{
    field: string | undefined
    reason: string | undefined
  }>()
  return (
    <ToolForm
      offered={agent.offered}
      pending={create.isPending || props.saving.pending}
      refused={refused}
      error={error ?? props.saving.error}
      submitLabel="Criar ferramenta"
      onCancel={props.onClose}
      onSubmit={(input) => {
        setError(undefined)
        setRefused(undefined)
        void (async () => {
          try {
            const { tool } = await attempt((attemptKey) =>
              create.mutateAsync({ params: scope, body: input, attemptKey }),
            )
            props.saving.save(
              (now) => ({ tools: [...now.tools.map((one) => one.version.id), tool.latest.id] }),
              props.onClose,
            )
          } catch (failure) {
            if (failure instanceof HubFailure) {
              setRefused({ field: failure.field, reason: failure.reason })
            }
            setError(writeFailureText(failure, UNCONFIRMED_SAVE))
          }
        })()
      }}
    />
  )
}

function Tools(props: Part) {
  const { agent } = props
  const saving = useDraftSave(props.scope, agent.id)
  const catalog = useConnectorCatalog(props.scope.companyId)
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
      {agent.tools.length === 0 && <p className="text-text-2">{NO_TOOLS}</p>}
      <ul className="flex flex-col">
        {agent.tools.map((tool) => {
          const title = toolTitle({ ...tool, description: tool.version.description }, agent.offered)
          return (
            <li key={tool.id} className={cn(ROW, 'justify-between')}>
              <span className="flex min-w-0 flex-1 items-center gap-sm">
                <Logo
                  logo={catalog.logo(
                    connectionOf(agent.offered, tool.connectionId)?.connector ?? '',
                  )}
                />
                <span className="truncate">{title}</span>
                {title === tool.version.description && (
                  <span className="shrink-0 font-mono text-fact text-text-2">{tool.slug}</span>
                )}
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
      </ul>
      <div className="flex flex-wrap gap-sm">
        <Button size="sm" onClick={() => setMode('choose')}>
          Escolher
        </Button>
        <Button size="sm" onClick={() => setMode('create')}>
          Criar
        </Button>
      </div>
      <Dialog open={mode !== undefined} onOpenChange={(open) => !open && close()}>
        <DialogContent
          size="fields"
          title={mode === 'create' ? 'Criar ferramenta' : 'Escolher ferramentas'}
        >
          {mode === 'choose' && <Chooser {...props} saving={saving} onClose={close} />}
          {mode === 'create' && <Creator {...props} saving={saving} onClose={close} />}
        </DialogContent>
      </Dialog>
    </Section>
  )
}

/** A section of one switch, saved alone. */
function SwitchSection(
  props: Part & {
    title: string
    label: string
    checked: boolean
    fields: (on: boolean) => Parameters<Saving['save']>[0]
  },
) {
  const saving = useDraftSave(props.scope, props.agent.id)
  return (
    <Section title={props.title} busy={saving.pending} error={saving.error}>
      <Toggle
        label={props.label}
        checked={props.checked}
        onChange={(on) => saving.save(props.fields(on))}
      />
    </Section>
  )
}

/**
 * The configuration of an agent's draft, field by field editable (step 24.3, U5, criterion 27): the
 * sections of the Studio's agent page, each saved by the `PATCH` of the draft after the agent's
 * earlier writes, each with its own refusal.
 */
export function ConfigPanel(part: Part) {
  const { draft } = part.agent
  return (
    <section aria-label="Configuração" className="flex flex-col">
      <Instructions {...part} />
      <ModelSection {...part} />
      <SwitchSection
        {...part}
        title="Memória"
        label="Memória observacional"
        checked={draft.memory.observational}
        fields={(observational) => ({ memory: { observational } })}
      />
      <Connections {...part} />
      <Tools {...part} />
      <SwitchSection
        {...part}
        title="Lê"
        label="Lê a web"
        checked={draft.web}
        fields={(web) => ({ web })}
      />
    </section>
  )
}
