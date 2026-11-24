import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { ChoiceSelect } from '../../ui/select.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { accountsQuery, modelLabel } from '../model-accounts/public.ts'
import { Connections } from './connections-section.tsx'
import type { Part } from './section.tsx'
import { Section, Toggle } from './section.tsx'
import { SAME_MODEL } from './text.ts'
import { Tools } from './tools-section.tsx'
import { useDraftSave } from './use-draft-save.ts'
import { Versions } from './versions.tsx'

const SAME = 'same'

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
    { value: SAME, label: SAME_MODEL },
    ...models.map((id) => ({ value: id, label: modelLabel(id) })),
  ]
  return (
    <Section title="Modelo" busy={saving.pending} error={saving.error}>
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      <ChoiceSelect
        label="Modelo"
        value={agent.draft.model ?? SAME}
        items={items}
        disabled={read.data === undefined}
        onValueChange={(next) => {
          const model = models.find((id) => id === next) ?? null
          saving.save({ model })
        }}
      />
    </Section>
  )
}

function MemorySection({ scope, agent }: Part) {
  const saving = useDraftSave(scope, agent.id)
  return (
    <Section title="Memória" busy={saving.pending} error={saving.error}>
      <Toggle
        label="Memória observacional"
        checked={agent.draft.memory.observational}
        onChange={(observational) => saving.save({ memory: { observational } })}
      />
    </Section>
  )
}

/**
 * The agent's page (step 24.3, U5, criterion 27): its draft's configuration is the page itself, a
 * section after another with the name on the left and the value on the right, each saved by the
 * `PATCH` of the draft after the agent's earlier writes, each with its own refusal, and the
 * versions last.
 */
export function ConfigPanel(part: Part) {
  return (
    <div className="flex flex-col">
      <Instructions {...part} />
      <ModelSection {...part} />
      <MemorySection {...part} />
      <Tools {...part} />
      <Connections {...part} />
      <Versions
        companyId={part.scope.companyId}
        projectId={part.scope.projectId}
        agent={part.agent}
      />
    </div>
  )
}
