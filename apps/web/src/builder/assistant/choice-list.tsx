import { SearchIcon } from 'lucide-react'
import { listRow } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group.tsx'

/** The words that go first under 26 rem of box: the row keeps its controls and loses these. */
export const WORDS = '@max-[26rem]:sr-only'

export const CHIP =
  'h-control-sm min-w-[2rem] shrink-0 justify-center gap-xs px-xs text-fact text-text-2'

export const LIST = 'flex max-h-64 flex-col overflow-y-auto'
export const ROW = cn(
  listRow,
  'shrink-0 gap-sm rounded-control text-left text-text hover:bg-surface-3',
)

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
        placeholder={props.label}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </InputGroup>
  )
}
