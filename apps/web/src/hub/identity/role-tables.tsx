import type { CopyId, Role } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { useId } from 'react'
import { Checkbox } from '../../ui/checkbox.tsx'

const COPIED_TITLE = 'Dados copiados'
const NO_COPIED = 'Nenhuma tabela copiada'
/** The sentence under the systems: unmarking a table does not take the live read away. */
export const LIVE_STAYS =
  'Desmarcar uma tabela não tira a leitura ao vivo do sistema. Ela segue as operações marcadas acima.'

/** A copy the role may be marked for: its table name, what it keeps, and the roles that read it today. */
export type RoleTable = Readonly<{
  id: CopyId
  name: string
  about: string
  readers: readonly Role[]
}>
/** By connector id of the kit, the copies of that connector. */
export type RoleTables = Readonly<Record<string, readonly RoleTable[]>>
export type SaveTables = (role: Role, copies: readonly CopyId[]) => Promise<void>

function CopiedTable(props: {
  table: RoleTable
  checked: boolean
  readOnly: boolean
  onChange: (on: boolean) => void
}): ReactNode {
  const { table } = props
  const id = useId()
  return (
    <li className="flex items-start gap-sm border-t border-line py-sm first:border-t-0">
      <Checkbox
        id={id}
        checked={props.checked}
        disabled={props.readOnly}
        onCheckedChange={props.onChange}
      />
      <label htmlFor={id} className="flex min-w-0 flex-1 flex-col">
        <span className="text-fact wrap-anywhere">{table.name}</span>
        <span className="text-text-2 wrap-anywhere">{table.about}</span>
      </label>
    </li>
  )
}

/** The copies of one system, each with a box: the tables the role reads through the conversation and the agents. */
export function CopiedTables(props: {
  tables: readonly RoleTable[]
  marked: ReadonlySet<CopyId>
  readOnly: boolean
  onChange: (id: CopyId, on: boolean) => void
}): ReactNode {
  return (
    <div className="flex flex-col gap-xs">
      <h4 className="font-body text-label font-semibold">{COPIED_TITLE}</h4>
      {props.tables.length === 0 ? (
        <p className="text-text-2">{NO_COPIED}</p>
      ) : (
        <ul className="flex flex-col">
          {props.tables.map((table) => (
            <CopiedTable
              key={table.id}
              table={table}
              checked={props.marked.has(table.id)}
              readOnly={props.readOnly}
              onChange={(on) => props.onChange(table.id, on)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
