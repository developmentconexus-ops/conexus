import type { AgentDetail, CompanyId, ProjectId, ToolVersionId } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogFooter } from '../../ui/dialog.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Switch } from '../../ui/switch.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { accountsQuery, modelLabel } from '../model-accounts/public.ts'
import { sendTool, toolsQuery } from './queries.ts'
import { GONE_CONNECTION, NO_CONNECTIONS, NO_TOOLS, reasonText, UNCONFIRMED_SAVE } from './text.ts'
import { ToolForm } from './tool-form.tsx'
import type { Saving } from './use-draft-save.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
const SAME = 'same'

function Section(props: { title: string; children: React.ReactNode; error?: string | undefined }) {
  return (
    <section
      aria-label={props.title}
      className="flex flex-col gap-sm border-b border-line py-md last:border-b-0"
    >
      <h3 className="font-display text-title">{props.title}</h3>
      {props.children}
      {props.error !== undefined && (
        <p role="alert" className="text-danger">
          {props.error}
        </p>
      )}
    </section>
  )
}

function Instructions({ agent, saving }: { agent: AgentDetail; saving: Saving }) {
  const [text, setText] = useState(agent.draft.instructions)
  return (
    <Section title="Instruções">
      <Textarea
        aria-label="Instruções"
        className="min-h-40"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          if (text !== agent.draft.instructions) void saving.save({ instructions: text })
        }}
      />
    </Section>
  )
}

function ModelSection({
  companyId,
  agent,
  saving,
}: {
  companyId: CompanyId
  agent: AgentDetail
  saving: Saving
}) {
  const read = useQuery(accountsQuery(companyId))
  const models =
    read.data?.choices.mine.flatMap((provider) => provider.models.map((one) => one.id)) ?? []
  const items = [
    { value: SAME, label: 'O modelo de quem conversa' },
    ...models.map((id) => ({ value: id, label: modelLabel(id) })),
  ]
  return (
    <Section title="Modelo">
      <Select
        value={agent.draft.model ?? SAME}
        items={items}
        onValueChange={(next) => {
          const model = models.find((id) => id === next) ?? null
          void saving.save({ model })
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

function Connections({ agent, saving }: { agent: AgentDetail; saving: Saving }) {
  const chosen = agent.draft.connections
  const gone = chosen.filter((id) => !agent.offered.some((one) => one.connectionId === id))
  function change(id: (typeof chosen)[number], on: boolean) {
    void saving.save({ connections: on ? [...chosen, id] : chosen.filter((one) => one !== id) })
  }
  return (
    <Section title="Ligações">
      {agent.offered.length === 0 && gone.length === 0 && (
        <p className="text-text-2">{NO_CONNECTIONS}</p>
      )}
      {agent.offered.map((one) => (
        <Toggle
          key={one.connectionId}
          label={`${one.connector === 'sankhya' ? 'Sankhya' : one.connector} · ${one.name}`}
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

function toggled(set: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(set)
  if (!next.delete(key)) next.add(key)
  return next
}

function Chooser(props: { scope: Scope; agent: AgentDetail; saving: Saving; onClose: () => void }) {
  const { scope, agent } = props
  const read = useQuery(toolsQuery(scope))
  const chosenIds = new Set(agent.tools.map((one) => one.id))
  const [picked, setPicked] = useState<ReadonlySet<string>>(chosenIds)
  const [ready, setReady] = useState<ReadonlySet<string>>(new Set())
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  async function confirm() {
    const tools: ToolVersionId[] = (read.data?.tools ?? []).flatMap((tool) => {
      if (!picked.has(tool.id)) return []
      return [agent.tools.find((one) => one.id === tool.id)?.version.id ?? tool.latest.id]
    })
    const readies = (read.data?.ready ?? []).filter((one) =>
      ready.has(`${one.connectionId}:${one.operation}`),
    )
    const saved = await props.saving.save({
      tools,
      ...(readies.length > 0 && {
        ready: readies.map(({ connectionId, operation }) => ({ connectionId, operation })),
      }),
    })
    if (saved) props.onClose()
  }
  return (
    <div className="flex flex-col gap-md">
      <ul className="flex flex-col gap-xs">
        {read.data?.tools.map((tool) => (
          <li key={tool.id}>
            <label className="flex items-start gap-sm">
              <input
                type="checkbox"
                className="mt-1 accent-accent"
                checked={picked.has(tool.id)}
                onChange={() => setPicked((now) => toggled(now, tool.id))}
              />
              <span className="flex flex-col">
                <span>{tool.slug}</span>
                <span className="text-label text-text-2">{tool.description}</span>
              </span>
            </label>
          </li>
        ))}
        {read.data?.ready.map((one) => {
          const key = `${one.connectionId}:${one.operation}`
          return (
            <li key={key}>
              <label className="flex items-start gap-sm">
                <input
                  type="checkbox"
                  className="mt-1 accent-accent"
                  checked={ready.has(key)}
                  onChange={() => setReady((now) => toggled(now, key))}
                />
                <span className="flex flex-col">
                  <span>{one.slug}</span>
                  <span className="text-label text-text-2">{one.summary} · pronta do conector</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {props.saving.error !== undefined && (
        <p role="alert" className="text-danger">
          {props.saving.error}
        </p>
      )}
      <DialogFooter>
        <Button disabled={props.saving.pending} onClick={() => void confirm()}>
          Usar as escolhidas
        </Button>
        <Button variant="ghost" onClick={props.onClose}>
          Cancelar
        </Button>
      </DialogFooter>
    </div>
  )
}

function Creator(props: { scope: Scope; agent: AgentDetail; saving: Saving; onClose: () => void }) {
  const { scope, agent } = props
  const queryClient = useQueryClient()
  const create = useMutation(sendTool)
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
      error={error}
      submitLabel="Criar ferramenta"
      onCancel={props.onClose}
      onSubmit={(input) => {
        setError(undefined)
        setRefused(undefined)
        void (async () => {
          try {
            const key = crypto.randomUUID()
            const { tool } = await create.mutateAsync({
              params: scope,
              body: input,
              attemptKey: key,
            })
            await queryClient.invalidateQueries({ queryKey: toolsQuery(scope).queryKey })
            const kept = agent.tools.map((one) => one.version.id)
            const saved = await props.saving.save({ tools: [...kept, tool.latest.id] })
            if (saved) props.onClose()
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

function Tools(props: { scope: Scope; agent: AgentDetail; saving: Saving }) {
  const { agent, saving } = props
  const [mode, setMode] = useState<'choose' | 'create'>()
  function close() {
    setMode(undefined)
  }
  return (
    <Section
      title="Ferramentas"
      error={saving.refused?.field === 'tools' ? reasonText(saving.refused.reason) : undefined}
    >
      {agent.tools.length === 0 && <p className="text-text-2">{NO_TOOLS}</p>}
      <ul className="flex flex-col divide-y divide-line">
        {agent.tools.map((tool) => (
          <li key={tool.id} className="flex items-center justify-between gap-sm py-xs">
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{tool.slug}</span>
              <span className="truncate text-label text-text-2">
                {tool.version.description} · lê
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-xs">
              <span className="text-label text-text-2">v{tool.version.number}</span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Tirar ${tool.slug}`}
                onClick={() =>
                  void saving.save({
                    tools: agent.tools
                      .filter((one) => one.id !== tool.id)
                      .map((one) => one.version.id),
                  })
                }
              >
                Tirar
              </Button>
            </span>
          </li>
        ))}
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
          description={
            mode === 'create'
              ? 'Uma leitura de uma ligação do Projeto, com valores fixos.'
              : 'As que o Projeto pode usar.'
          }
        >
          {mode === 'choose' && <Chooser {...props} onClose={close} />}
          {mode === 'create' && <Creator {...props} onClose={close} />}
        </DialogContent>
      </Dialog>
    </Section>
  )
}

/**
 * The configuration of an agent's draft, field by field editable (step 24.3, U5, criterion 27): the
 * sections of the Studio's agent page, each saved by the `PATCH` of the draft through the agent's queue.
 */
export function ConfigPanel(props: { scope: Scope; agent: AgentDetail; saving: Saving }) {
  const { scope, agent, saving } = props
  return (
    <section aria-label="Configuração" className="flex flex-col">
      <Instructions key={agent.draft.instructions} agent={agent} saving={saving} />
      <ModelSection companyId={scope.companyId} agent={agent} saving={saving} />
      <Section title="Memória">
        <Toggle
          label="Memória observacional"
          checked={agent.draft.memory.observational}
          onChange={(observational) => void saving.save({ memory: { observational } })}
        />
      </Section>
      <Connections agent={agent} saving={saving} />
      <Tools scope={scope} agent={agent} saving={saving} />
      <Section title="Lê">
        <Toggle
          label="Lê a web"
          checked={agent.draft.web}
          onChange={(web) => void saving.save({ web })}
        />
      </Section>
      {saving.error !== undefined && (
        <p role="alert" className="pt-sm text-danger">
          {saving.error}
        </p>
      )}
    </section>
  )
}
