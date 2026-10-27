import type { Effort, ModelId, Provider } from '@conexus/hub-api'
import { runningEffort } from '@conexus/hub-api'
import { SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from '../../ui/combobox.tsx'
import { InputGroupAddon } from '../../ui/input-group.tsx'
import { Slider } from '../../ui/slider.tsx'
import { modelLabel } from './model-label.ts'
import { ProviderMark } from './provider-mark.tsx'
import { EFFORT_LABELS, plain } from './text.ts'

/** Models shown at once: the registry holds thousands, and a search narrows them. */
const SHOWN = 50

type Option = { value: ModelId; label: string; provider: string }
type Group = { value: string; items: Option[] }

/** The level the person reads and sets, for a model that lists more than `off`. */
export type EffortChoice = { value: Effort; onChange: (effort: Effort) => void }

/**
 * One model of the registry as `provider/model`, picked from a search over groups by provider,
 * each model beside its provider's mark. With `effort`, the popup also holds the levels the model
 * accepts, and none when it accepts only one. The button holds the name and, lighter beside it,
 * the level, only when there is one and only from `md`: `off` is not named, and under `md` the
 * popup holds the level. Both sit in a box one line high, so when they do not fit together the
 * level yields first and only then the name truncates. With `chevron` off the button is a pill in
 * a row, as the Claude app draws it. `name` is the button's accessible name and `heading` the
 * popup's title. Esc closes the popup and returns focus to the button.
 */
export function ModelPicker(props: {
  providers: readonly Provider[]
  value: ModelId | null
  name: string
  heading?: string
  /** A line at the foot of the popup, for what the person should know when choosing. */
  note?: string
  id?: string
  className?: string
  onChange: (model: ModelId) => void
  effort?: EffortChoice
  /** Off where the button is a pill in a row, as the Claude app's composer draws it. */
  chevron?: boolean
}) {
  const [search, setSearch] = useState('')
  const { groups, matched } = useMemo(
    () => groupsOf(props.providers, search),
    [props.providers, search],
  )
  const levels = props.providers
    .flatMap((provider) => provider.models)
    .find((one) => one.id === props.value)?.efforts
  const current: Option | null =
    props.value === null
      ? null
      : { value: props.value, label: modelLabel(props.value), provider: providerOf(props.value) }
  const choice =
    props.effort !== undefined && levels !== undefined && levels.length > 1
      ? { effort: props.effort, levels }
      : null
  const running = choice === null ? undefined : runningEffort(choice.levels, choice.effort.value)

  return (
    <Combobox
      items={groups}
      value={current}
      isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
      onValueChange={(next: Option | null) => next !== null && props.onChange(next.value)}
      inputValue={search}
      onInputValueChange={setSearch}
      filter={null}
    >
      <ComboboxTrigger
        id={props.id}
        aria-label={props.name}
        chevron={props.chevron}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'max-w-full min-w-0 shrink',
          props.className,
        )}
      >
        {current !== null && <ProviderMark provider={current.provider} />}
        <span className="flex h-lh min-w-0 flex-wrap gap-x-xs overflow-hidden">
          <span className="truncate text-text">{current?.label ?? 'Escolha um modelo'}</span>
          {running !== undefined && running !== 'off' && (
            <span className="shrink-0 font-normal text-text-2 max-md:hidden">
              {EFFORT_LABELS[running]}
            </span>
          )}
        </span>
      </ComboboxTrigger>
      <ComboboxContent className="w-80 min-w-0" align="end" side="top">
        {props.heading !== undefined && (
          <p className="px-md pt-md text-label text-text-2">{props.heading}</p>
        )}
        <div className="p-sm">
          <ComboboxInput showTrigger={false} placeholder="Buscar modelo" aria-label="Buscar modelo">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
          </ComboboxInput>
        </div>
        <ComboboxEmpty>
          {props.providers.length === 0
            ? 'Conecte uma conta de modelo'
            : 'Nenhum modelo encontrado.'}
        </ComboboxEmpty>
        <ComboboxList>
          {(group: Group) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(option: Option) => (
                  <ComboboxItem key={option.value} value={option}>
                    <ProviderMark provider={option.provider} className="text-text-2" />
                    <span className="truncate">{option.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
        {matched > SHOWN && (
          <p className="px-md py-xs text-label text-text-2">
            {`Mostrando ${SHOWN} de ${matched} modelos. Busque para ver os outros.`}
          </p>
        )}
        {choice !== null && <EffortLevels levels={choice.levels} effort={choice.effort} />}
        {props.note !== undefined && (
          <p className="px-md py-xs text-fact text-text-2">{props.note}</p>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

/** The provider of `provider/model`, the part before the slash. */
function providerOf(model: ModelId): string {
  return model.slice(0, model.indexOf('/'))
}

/** The models that match the search, up to what shows at once, grouped by provider. */
function groupsOf(providers: readonly Provider[], search: string) {
  const wanted = plain(search.trim())
  const groups: Group[] = []
  let count = 0
  let matched = 0
  for (const provider of providers) {
    const items: Option[] = []
    for (const model of provider.models) {
      const label = modelLabel(model.id)
      if (!plain(label).includes(wanted) && !plain(model.id).includes(wanted)) continue
      matched += 1
      if (count >= SHOWN) continue
      count += 1
      items.push({ value: model.id, label, provider: provider.id })
    }
    if (items.length > 0) groups.push({ value: provider.name, items })
  }
  return { groups, matched }
}

/** "Raciocínio": the level named above a pill with a stop per level, as the old picker drew it. */
function EffortLevels(props: { levels: readonly [Effort, ...Effort[]]; effort: EffortChoice }) {
  const [dragged, setDragged] = useState<number | null>(null)
  const saved = props.levels.indexOf(runningEffort(props.levels, props.effort.value))
  const shown = props.levels[dragged ?? saved]
  return (
    <div className="flex flex-col gap-sm border-t border-line p-md">
      <span className="text-label text-text">Raciocínio</span>
      <span aria-hidden="true" className="self-center text-label text-accent-text">
        {shown === undefined ? '' : EFFORT_LABELS[shown]}
      </span>
      <Slider
        label="Raciocínio"
        min={0}
        max={props.levels.length - 1}
        step={1}
        value={dragged ?? saved}
        getAriaValueText={(_text, index) => {
          const level = props.levels[index]
          return level === undefined ? '' : EFFORT_LABELS[level]
        }}
        onValueChange={(next) => setDragged(next)}
        onValueCommitted={(next) => {
          setDragged(null)
          const level = props.levels[next]
          if (level !== undefined && level !== props.effort.value) props.effort.onChange(level)
        }}
      />
    </div>
  )
}
