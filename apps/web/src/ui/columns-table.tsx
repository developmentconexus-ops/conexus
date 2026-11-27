import { FramedTable, TableBody, TableCell, TableRow } from './table.tsx'

/**
 * A table's columns as a framed table: the name, the type and the description; under 768 px the type
 * and description go under the name. `padded` gives the cells the `sm` side padding.
 */
export function ColumnsTable(props: {
  label: string
  heads: readonly [string, string, string]
  columns: readonly {
    name: string
    type: string | null
    description: string | null
  }[]
  padded?: boolean
}) {
  const [name, type, description] = props.heads
  return (
    <FramedTable
      aria-label={props.label}
      columns={[
        { name },
        { name: type, leavesOnPhone: true, width: 'lg:w-40' },
        { name: description, leavesOnPhone: true, width: 'lg:w-80' },
      ]}
      showHeader
    >
      <TableBody>
        {props.columns.map((column) => (
          <TableRow key={column.name}>
            <TableCell className={props.padded ? 'whitespace-normal px-sm' : 'whitespace-normal'}>
              <span className="flex flex-col">
                <span className="font-mono text-fact">{column.name}</span>
                <span className="text-text-2 md:hidden">
                  {[column.type, column.description]
                    .filter((part) => part !== null && part !== '')
                    .join(' · ')}
                </span>
              </span>
            </TableCell>
            <TableCell className={props.padded ? 'px-sm max-md:hidden' : 'max-md:hidden'}>
              <span className="text-text-2">{column.type}</span>
            </TableCell>
            <TableCell
              className={
                props.padded
                  ? 'whitespace-normal px-sm max-md:hidden'
                  : 'whitespace-normal max-md:hidden'
              }
            >
              <span className="text-text-2">{column.description}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </FramedTable>
  )
}
