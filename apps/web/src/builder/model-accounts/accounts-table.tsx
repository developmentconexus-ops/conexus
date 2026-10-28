import type { ReactNode } from 'react'
import { FramedTable } from '../../ui/table.tsx'

const COLUMNS = [
  { name: 'Ordem' },
  { name: 'Conta' },
  { name: 'Estado', leavesOnPhone: true },
  { name: 'Ações' },
]

/** The table of one owner's accounts: a body per provider, each its own queue (`Queue`). On a phone the state moves under the name. */
export function AccountsTable({ children }: { children: ReactNode }) {
  return <FramedTable columns={COLUMNS}>{children}</FramedTable>
}
