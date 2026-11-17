import { SearchIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group.tsx'

// The one search box with a magnifier: shadcn's `InputGroup` with an addon and a `search` input.
// The browser's own clear button is left out; the field is cleared by editing it.
export function SearchField(props: {
  label: string
  value: string
  onChange: (query: string) => void
}) {
  return (
    <InputGroup className="h-control">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={props.label}
        placeholder={props.label}
        className="[&::-webkit-search-cancel-button]:appearance-none"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </InputGroup>
  )
}
