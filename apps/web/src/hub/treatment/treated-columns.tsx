import type { TreatedTable } from '@conexus/hub-api'
import { ColumnsTable } from '../../ui/columns-table.tsx'
import { COLUMN_COLUMNS, COLUMNS_LABEL } from './text.ts'

export type Treated = Extract<TreatedTable, { layer: 'tratado' }>

/** The Colunas tab: the name, the type in the treated table and the copied column's description; under 768 px the type and description go under the name. */
export function Columns({ table }: { table: Treated }) {
  return <ColumnsTable label={COLUMNS_LABEL} heads={COLUMN_COLUMNS} columns={table.columns} />
}
