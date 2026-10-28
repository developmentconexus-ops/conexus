import type { ReactNode } from 'react'
import { Table, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'

/** The table of one owner's accounts: a body per provider, each its own queue (`Queue`). On a phone the state moves under the name. */
export function AccountsTable({ children }: { children: ReactNode }) {
  const phone = useIsMobile()
  return (
    <div className="overflow-hidden rounded-object border border-line bg-surface">
      <Table>
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead>Ordem</TableHead>
            <TableHead>Conta</TableHead>
            {!phone && <TableHead>Estado</TableHead>}
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        {children}
      </Table>
    </div>
  )
}
