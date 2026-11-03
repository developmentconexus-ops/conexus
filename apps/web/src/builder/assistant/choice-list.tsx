import { SearchIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group.tsx'

/** The words that go first under 26 rem of box: the row keeps its controls and loses these. */
export const WORDS = '@max-[26rem]:sr-only'

export const CHIP =
  'h-control-sm min-w-[2rem] shrink-0 justify-center gap-xs px-xs text-fact text-text-2'

/** The Hub's reads are plain lists: a search shows from this many rows (the founder: "7 ou mais"). */
export const SEARCH_FROM = 7

export const LIST = 'flex max-h-64 flex-col overflow-y-auto'
export const ROW =
  'flex h-row w-full shrink-0 items-center gap-sm rounded-control px-sm text-left text-label text-text hover:bg-surface-3'

export function matches(text: string, query: string): boolean {
  return text.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
}

/** The search of a list, shown only once the list has `SEARCH_FROM` rows. */
export function Search(props: { label: string; value: string; onChange: (query: string) => void }) {
  return (
    <InputGroup className="h-control">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={props.label}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </InputGroup>
  )
}
