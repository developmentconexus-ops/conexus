import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { SearchIcon } from 'lucide-react'
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Alert } from './alert.tsx'
import { listRow } from './block.tsx'
import { cn } from './cn.ts'
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
} from './combobox.tsx'
import { InputGroupAddon } from './input-group.tsx'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel } from './select.tsx'
import { Skeleton } from './skeleton.tsx'

/** A search shows from this many rows, fixed items included (the founder: "7 ou mais"). */
export const SEARCH_FROM = 7

export function matches(text: string, query: string): boolean {
  return text.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
}

export type PickerItem<V extends string> = { value: V; label: string }
export type PickerGroup<V extends string> = {
  label: string | undefined
  items: readonly PickerItem<V>[]
}

export type PickerMore =
  | { kind: 'END' }
  | { kind: 'MORE'; loading: boolean; label: string; onMore: () => void }

export type PickerRead =
  | { kind: 'LOADING' }
  | { kind: 'READY' }
  | { kind: 'FAILED'; sentence: string }

/**
 * The search of whoever uses the piece: the text goes back through `onText`, and the piece shows
 * the groups as they come, unfiltered. On closing, the Combobox itself sends `onText('')`.
 */
type PickerSearch = { text: string; onText: (text: string) => void }

type PickerProps<V extends string> = {
  /** The name of the list and of its trigger for a screen reader. */
  label: string
  /** The question the open list shows above its rows, when the place asks one. */
  title?: string
  /** The place's trigger, given to the `render` of the Base UI trigger. */
  trigger: ReactElement
  groups: readonly PickerGroup<V>[]
  value: V | undefined
  /** The chosen item, kept in the Combobox's `items` even outside the groups shown. */
  chosen: PickerItem<V> | undefined
  onPick: (value: V) => void
  more: PickerMore
  read: PickerRead
  /** With it, the Combobox with its field in the popup; without, the Base UI Select. */
  search: PickerSearch | undefined
  searchLabel: string
  noMatch: string
  /** The place's empty, when no group has an item: a sentence and, if any, an action. */
  empty: ReactElement
}

const POPUP = 'w-72 min-w-0 max-w-(--available-width)'
// The check of the chosen item is the one ipê glyph, on a neutral row (design V57).
const CHOSEN = 'data-selected:bg-transparent data-selected:text-text [&_svg]:text-accent-text'
// The Combobox's item at the height of `listRow`: 32px, 44 on touch (design V58).
const ITEM =
  'h-row gap-md py-0 text-label pointer-coarse:h-11 data-selected:bg-transparent data-selected:text-text [&_svg]:text-accent-text'
const SKELETON_ROWS = ['first', 'second', 'third']

function Title({ text }: { text: string | undefined }) {
  return text === undefined ? null : (
    <p aria-hidden="true" className="px-md pt-sm text-label text-text-2">
      {text}
    </p>
  )
}

function idOf<V extends string>(group: PickerGroup<V>): string | undefined {
  return group.items[0]?.value
}

function Under(props: { read: PickerRead; more: PickerMore }) {
  const { read, more } = props
  return (
    <>
      {read.kind === 'LOADING' &&
        SKELETON_ROWS.map((row) => (
          <div key={row} className={cn(listRow, 'px-md')}>
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      {read.kind === 'FAILED' && (
        <Alert tone="danger" className="px-md py-xs">
          {read.sentence}
        </Alert>
      )}
      {more.kind === 'MORE' && (
        <div className="px-xs pb-xs">
          <button
            type="button"
            className={cn(
              listRow,
              'rounded-control text-left text-text hover:bg-surface-3 disabled:opacity-50',
            )}
            disabled={more.loading}
            onClick={more.onMore}
          >
            {more.label}
          </button>
        </div>
      )}
    </>
  )
}

/**
 * Choosing one item of a list that may be long (web W22): the Base UI Combobox in server-search
 * mode with a `search`, the Base UI Select without one, the same groups in both.
 */
export function Picker<V extends string>(props: PickerProps<V>): ReactElement {
  const [heldSelect, setHeldSelect] = useState(false)
  const filled = props.groups.filter((group) => group.items.length > 0)
  const search = heldSelect ? undefined : props.search
  return search === undefined ? (
    <SelectPicker {...props} groups={withChosen(filled, props.chosen)} onOpen={setHeldSelect} />
  ) : (
    <SearchPicker {...props} groups={filled} search={search} />
  )
}

/** The groups with the chosen item added when none holds it, so its label outlives the Hub's window. */
function withChosen<V extends string>(
  groups: readonly PickerGroup<V>[],
  chosen: PickerItem<V> | undefined,
): readonly PickerGroup<V>[] {
  const inside = groups.some((group) => group.items.some((item) => item.value === chosen?.value))
  return chosen === undefined || inside ? groups : [...groups, { label: undefined, items: [chosen] }]
}

function SelectPicker<V extends string>(
  props: PickerProps<V> & { onOpen: (open: boolean) => void },
) {
  return (
    <Select<V>
      value={props.value ?? null}
      onValueChange={(next) => {
        if (next !== null) props.onPick(next)
      }}
      onOpenChange={props.onOpen}
    >
      <SelectPrimitive.Trigger render={props.trigger} aria-label={props.label} />
      <SelectContent
        aria-label={props.label}
        aria-busy={props.read.kind === 'LOADING'}
        className={POPUP}
        align="start"
        alignItemWithTrigger={false}
        before={<Title text={props.title} />}
        after={
          <>
            {props.groups.length === 0 && props.read.kind === 'READY' && (
              <div className="px-md pb-sm text-label text-text-2">{props.empty}</div>
            )}
            <Under read={props.read} more={props.more} />
          </>
        }
      >
        {props.groups.map((group) => (
          <SelectGroup key={idOf(group)}>
            {group.label !== undefined && <SelectLabel>{group.label}</SelectLabel>}
            {group.items.map((item) => (
              <SelectItem key={item.value} value={item.value} className={CHOSEN}>
                <span className="truncate">{item.label}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

function SearchPicker<V extends string>(props: PickerProps<V> & { search: PickerSearch }) {
  const { groups, search } = props
  const known = useMemo(() => withChosen(groups, props.chosen), [groups, props.chosen])
  const items = useMemo(
    () =>
      ComboboxPrimitive.createItems<PickerItem<V>, V>(known, {
        getValue: (item) => item.value,
        getLabel: (item) => item.label,
      }),
    [known],
  )
  // `items` are the records known, the chosen one included; `filteredItems` is the Hub's window,
  // so a search with no answer leaves the list empty and `ComboboxEmpty` shows `noMatch`.
  const shown = search.text.trim() === '' ? known : groups
  return (
    <Combobox<V, false, PickerItem<V>>
      items={items}
      filteredItems={shown}
      filter={null}
      value={props.value ?? null}
      onValueChange={(next) => {
        if (next !== null) props.onPick(next)
      }}
      inputValue={search.text}
      onInputValueChange={(text, { reason }) => {
        if (reason !== 'item-press') search.onText(text)
      }}
    >
      <ComboboxPrimitive.Trigger render={props.trigger} aria-label={props.label} />
      <ComboboxContent
        aria-label={props.label}
        aria-busy={props.read.kind === 'LOADING'}
        className={POPUP}
      >
        <Title text={props.title} />
        <div className="p-xs">
          <ComboboxInput
            showTrigger={false}
            aria-label={props.searchLabel}
            placeholder={props.searchLabel}
          >
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
          </ComboboxInput>
        </div>
        <ComboboxEmpty className="justify-start px-md">
          {props.read.kind === 'READY' && (search.text.trim() === '' ? props.empty : props.noMatch)}
        </ComboboxEmpty>
        <ComboboxList aria-label={props.label} className="max-h-64">
          {(group: PickerGroup<V>) => (
            <ComboboxGroup key={idOf(group)} items={[...group.items]}>
              {group.label !== undefined && <ComboboxLabel>{group.label}</ComboboxLabel>}
              <ComboboxCollection>
                {(item: PickerItem<V>) => (
                  <ComboboxItem key={item.value} value={item.value} className={ITEM}>
                    <span className="truncate">{item.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
        <Under read={props.read} more={props.more} />
      </ComboboxContent>
    </Combobox>
  )
}
