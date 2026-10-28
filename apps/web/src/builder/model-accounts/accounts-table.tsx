import type { ReactNode } from 'react'
import { FramedTable } from '../../ui/table.tsx'

const COLUMNS = [
  { name: 'Ordem', width: 'md:w-14' },
  { name: 'Conta' },
  { name: 'Estado', leavesOnPhone: true, width: 'md:w-56' },
  { name: 'Ações', width: 'md:w-32' },
]

/** The table of one owner's accounts: a body per provider, each its own queue (`Queue`). On a phone the state moves under the name. */
export function AccountsTable({ children }: { children: ReactNode }) {
  return <FramedTable columns={COLUMNS}>{children}</FramedTable>
}
