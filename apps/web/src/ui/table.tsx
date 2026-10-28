import type { ComponentProps } from 'react'
import { cn } from './cn.ts'
import { useIsMobile } from './use-mobile.ts'

// Copied from shadcn's base-nova `table`, painted with the brand's hairlines. The rows keep their
// table display at every width, so a screen reader still hears a table on a phone.
function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-body', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('border-line border-b transition-colors hover:bg-surface-3/50', className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 whitespace-nowrap px-md text-left align-middle font-medium text-label text-text-2',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('whitespace-nowrap px-md py-md align-middle', className)}
      {...props}
    />
  )
}

/**
 * One column of a `FramedTable`'s hidden header; `leavesOnPhone` columns move under the name there,
 * and `width` (a class, for `md` and up) is shared by every table that names the column.
 */
export type FramedColumn = { name: string; leavesOnPhone?: boolean; width?: string }

/** A settings table in its frame: the hairline border, a screen-reader-only header and the columns that leave on a phone. */
export function FramedTable({
  columns,
  children,
  ...props
}: { columns: readonly FramedColumn[] } & ComponentProps<'table'>) {
  const phone = useIsMobile()
  const shown = columns.filter((column) => !(phone && column.leavesOnPhone))
  return (
    <div className="overflow-hidden rounded-object border border-line bg-surface">
      <Table {...props} className={cn('md:table-fixed', props.className)}>
        <colgroup>
          {shown.map((column) => (
            <col key={column.name} className={column.width} />
          ))}
        </colgroup>
        <TableHeader className="sr-only">
          <TableRow>
            {shown.map((column) => (
              <TableHead key={column.name}>{column.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        {children}
      </Table>
    </div>
  )
}
