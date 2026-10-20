import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import type { Provider } from '@conexus/hub-api'
import { Effort, providerOfModel } from '@conexus/hub-api'
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
import { EFFORT_LABELS, plain } from './text.ts'

/** Models shown at once: the registry holds thousands, and a search narrows them. */
const SHOWN = 50

type Option = { value: string; label: string }
type Group = { value: string; items: Option[] }

/** The level the person reads and sets, for a model that lists more than `off`. */
export type EffortChoice = { value: Effort; onChange: (effort: Effort) => void }

/**
 * One model of the registry as `provider/model`, picked from a search over groups by provider.
 * With `effort`, the popup also holds the levels the model accepts, and none when it accepts only
 * `off`. `name` is the button's accessible name. Esc closes the popup and returns focus to the button.
 */
export function ModelPicker(props: {
  providers: readonly Provider[]
  value: string | null
  name: string
  id?: string
  className?: string
  onChange: (model: string) => void
  effort?: EffortChoice
}) {
  const [search, setSearch] = useState('')
  const { groups, matched } = useMemo(
    () => groupsOf(props.providers, search),
    [props.providers, search],
  )
  const picked = props.value === null ? null : providerOfModel(props.value)
  const provider = props.providers.find((one) => one.id === picked)
  const levels = provider?.models.find((one) => `${provider.id}/${one.id}` === props.value)?.efforts
  const current: Option | null =
    props.value === null
      ? null
      : { value: props.value, label: props.value.slice(props.value.indexOf('/') + 1) }
  const choice =
    props.effort !== undefined && levels !== undefined && levels.length > 1
      ? { effort: props.effort, levels }
      : null

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
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'max-w-full min-w-0 shrink',
          props.className,
        )}
      >
        <span className="truncate text-text">{current?.label ?? 'Escolha um modelo'}</span>
        {choice !== null && (
          <span className="shrink-0 text-text-2">{EFFORT_LABELS[choice.effort.value]}</span>
        )}
      </ComboboxTrigger>
      <ComboboxContent className="w-72 min-w-0" align="start" side="top">
        <div className="p-xs">
          <ComboboxInput
            showTrigger={false}
            placeholder="Buscar modelo"
            aria-label="Buscar modelo"
          />
        </div>
        <ComboboxEmpty>Nenhum modelo encontrado.</ComboboxEmpty>
        <ComboboxList>
          {(group: Group) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(option: Option) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
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
      </ComboboxContent>
    </Combobox>
  )
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
      if (!plain(model.id).includes(wanted)) continue
      matched += 1
      if (count >= SHOWN) continue
      count += 1
      items.push({ value: `${provider.id}/${model.id}`, label: model.id })
    }
    if (items.length > 0) groups.push({ value: provider.name, items })
  }
  return { groups, matched }
}

function EffortLevels(props: { levels: readonly Effort[]; effort: EffortChoice }) {
  return (
    <div className="flex flex-col gap-xs border-t border-line p-md">
      <span id="effort-title" className="text-fact text-text-2">
        Raciocínio
      </span>
      <RadioGroup
        aria-labelledby="effort-title"
        value={props.effort.value}
        onValueChange={(next) => props.effort.onChange(Effort.parse(next))}
        className="flex flex-wrap gap-xs"
      >
        {props.levels.map((level) => (
          <Radio.Root
            key={level}
            value={level}
            className="rounded-control border border-line px-sm py-xs text-label text-text-2 data-checked:border-accent data-checked:bg-accent-soft data-checked:text-accent-text"
          >
            {EFFORT_LABELS[level]}
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  )
}
