import type { CompanyId, ModelFallback, ModelId, Provider } from '@conexus/hub-api'
import { MODEL_FALLBACK_MAX_LENGTH } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'
import type { RefObject } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { Label } from '../../ui/label.tsx'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { Switch } from '../../ui/switch.tsx'
import { modelLabel } from './model-label.ts'
import { ModelPicker } from './model-picker.tsx'
import { sendFallback } from './queries.ts'
import { refusalText } from './text.ts'
import type { Move } from './use-move-feedback.ts'
import { useMoveFeedback } from './use-move-feedback.ts'

function swapped(chain: readonly ModelId[], index: number, by: -1 | 1): ModelId[] {
  const next = [...chain]
  const other = next[index + by]
  const here = next[index]
  if (other === undefined || here === undefined) return next
  next[index + by] = here
  next[index] = other
  return next
}

/**
 * The company's automatic switch: when the accounts of the model a turn started with run out, the
 * turn goes on with the next model of this chain. Off until someone turns it on. Each change is
 * one write at the revision read, like the accounts' arrows: the controls wait for the answer, and
 * the section shows what the Hub holds (code C26).
 */
export function ModelFallbackSection(props: {
  companyId: CompanyId
  providers: readonly Provider[]
  fallback: ModelFallback
}) {
  const { fallback } = props
  const switchId = useId()
  const send = useMutation(sendFallback)
  const switchRef = useRef<HTMLElement>(null)
  const section = useRef<HTMLElement>(null)
  const switched = useRef(false)
  const chain = fallback.chain
  const feedback = useMoveFeedback<HTMLOListElement>(
    chain.map((model) => ({ id: model, label: modelLabel(model) })),
    'da troca',
    send.isPending,
  )

  // The switch is disabled while its write runs, which drops its focus: it returns with the answer.
  useEffect(() => {
    if (send.isPending || !switched.current) return
    switched.current = false
    switchRef.current?.focus()
  })

  function save(next: { enabled: boolean; chain: readonly ModelId[] }, onSaved?: () => void) {
    send.mutate(
      {
        params: { companyId: props.companyId },
        body: { enabled: next.enabled, chain: [...next.chain], revision: fallback.revision },
      },
      { onError: feedback.forget, onSuccess: onSaved },
    )
  }

  function move(index: number, direction: Move) {
    const model = chain[index]
    if (model === undefined) return
    feedback.expect(model, direction)
    save({ enabled: fallback.enabled, chain: swapped(chain, index, direction === 'up' ? -1 : 1) })
  }

  return (
    <SettingsSection
      ref={section}
      id="fallback"
      title="Troca automática"
      description="O Builder tenta as contas nesta ordem; quando as contas de um modelo acabam, a conversa segue com o próximo modelo da fila."
    >
      <div className="flex items-center gap-sm">
        <Switch
          id={switchId}
          ref={switchRef}
          checked={fallback.enabled}
          disabled={send.isPending}
          onCheckedChange={(enabled) => {
            switched.current = true
            save({ enabled, chain })
          }}
        />
        <Label htmlFor={switchId}>Trocar para o próximo modelo quando as contas acabarem</Label>
      </div>
      <ChainList
        chain={chain}
        busy={send.isPending}
        box={feedback.box}
        onMove={move}
        onRemove={(model) =>
          save({ enabled: fallback.enabled, chain: chain.filter((one) => one !== model) }, () =>
            section.current?.focus(),
          )
        }
      />
      <p role="status" className="sr-only">
        {feedback.said}
      </p>
      <AddModel
        providers={props.providers}
        chain={chain}
        busy={send.isPending}
        onAdd={(model, onSaved) =>
          save({ enabled: fallback.enabled, chain: [...chain, model] }, () => {
            onSaved()
            section.current?.focus()
          })
        }
      />
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
    </SettingsSection>
  )
}

/** The switch's models in order, each with its arrows and a way out of the queue. */
function ChainList(props: {
  chain: readonly ModelId[]
  busy: boolean
  box: RefObject<HTMLOListElement | null>
  onMove: (index: number, direction: Move) => void
  onRemove: (model: ModelId) => void
}) {
  const { chain, busy } = props
  if (chain.length === 0) return <p className="text-text-2">Nenhum modelo na fila</p>
  return (
    <ol ref={props.box} className="flex flex-col rounded-object border border-line bg-surface">
      {chain.map((model, index) => (
        <li
          key={model}
          className="flex items-center gap-md border-line border-b px-md py-xs last:border-b-0"
        >
          <span className="w-4 font-mono text-fact text-text-2">{index + 1}</span>
          <span className="min-w-0 flex-1 break-words">{modelLabel(model)}</span>
          <span className="flex gap-sm">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Subir ${modelLabel(model)}`}
              data-move={`${model}:up`}
              disabled={index === 0 || busy}
              onClick={() => props.onMove(index, 'up')}
            >
              <ArrowUpIcon aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Descer ${modelLabel(model)}`}
              data-move={`${model}:down`}
              disabled={index === chain.length - 1 || busy}
              onClick={() => props.onMove(index, 'down')}
            >
              <ArrowDownIcon aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Tirar ${modelLabel(model)}`}
              disabled={busy}
              onClick={() => props.onRemove(model)}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** The model to add to the queue, chosen from the company's providers; the field empties once it is saved. */
function AddModel(props: {
  providers: readonly Provider[]
  chain: readonly ModelId[]
  busy: boolean
  onAdd: (model: ModelId, onSaved: () => void) => void
}) {
  const pickerId = useId()
  const [picked, setPicked] = useState<ModelId | null>(null)
  const added =
    picked !== null &&
    !props.chain.includes(picked) &&
    props.chain.length < MODEL_FALLBACK_MAX_LENGTH
      ? picked
      : null
  return (
    <div className="flex flex-wrap items-end gap-md">
      <Field className="min-w-0 max-w-column flex-1">
        <FieldLabel htmlFor={pickerId}>Modelo da troca</FieldLabel>
        <ModelPicker
          id={pickerId}
          providers={props.providers}
          value={picked}
          name="Modelo da troca"
          className="justify-between border-line bg-surface"
          onChange={setPicked}
        />
      </Field>
      <Button
        disabled={added === null || props.busy}
        onClick={() => added !== null && props.onAdd(added, () => setPicked(null))}
      >
        Adicionar à fila
      </Button>
    </div>
  )
}
