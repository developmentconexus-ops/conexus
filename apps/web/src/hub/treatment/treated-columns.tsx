import type { TreatedTable } from '@conexus/hub-api'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { COLUMN_COLUMNS, COLUMNS_LABEL } from './text.ts'

export type Treated = Extract<TreatedTable, { layer: 'tratado' }>

/** The Colunas tab: the name, the type in the treated table and the copied column's description; under 768 px the type and description go under the name. */
export function Columns({ table }: { table: Treated }) {
  return (
    <FramedTable
      aria-label={COLUMNS_LABEL}
      columns={[
        { name: COLUMN_COLUMNS[0] },
        { name: COLUMN_COLUMNS[1], leavesOnPhone: true, width: 'lg:w-40' },
        { name: COLUMN_COLUMNS[2], leavesOnPhone: true, width: 'lg:w-80' },
      ]}
      showHeader
    >
      <TableBody>
        {table.columns.map((column) => (
          <TableRow key={column.name}>
            <TableCell className="whitespace-normal">
              <span className="flex flex-col">
                <span className="font-mono text-fact">{column.name}</span>
                <span className="text-text-2 md:hidden">
                  {[column.type, column.description]
                    .filter((part) => part !== null && part !== '')
                    .join(' · ')}
                </span>
              </span>
            </TableCell>
            <TableCell className="max-md:hidden">
              <span className="text-text-2">{column.type}</span>
            </TableCell>
            <TableCell className="whitespace-normal max-md:hidden">
              <span className="text-text-2">{column.description}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </FramedTable>
  )
}
