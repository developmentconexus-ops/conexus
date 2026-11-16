import type { CompanyId, CopyId, CopyReaders, Role } from '@conexus/hub-api'
import { fixedNameOf } from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { List, Row } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import {
  OPEN_IN_ROLES,
  peopleText,
  READER_HEADS,
  READERS_CHANGE,
  READERS_NOTE,
  READS_ALWAYS,
  READS_MARKED,
} from './text.ts'

type Listed = { readers: readonly CopyReaders[] }
type Reader = CopyReaders['roles'][number]

/** The roles that read one copy, in the order the Hub listed them; nothing while the list is not read. */
export function readersOf(readers: Listed | undefined, copyId: CopyId): Reader[] | undefined {
  return readers?.readers.find((one) => one.copyId === copyId)?.roles
}

/** Whether a role reads every table with no mark: the owner and the administrator, never by the label. */
function readsAlways(role: Role): boolean {
  const fixed = fixedNameOf(role)
  return fixed === 'owner' || fixed === 'admin'
}

function readsText(role: Role): string {
  return readsAlways(role) ? READS_ALWAYS : READS_MARKED
}

function OpenRole({ companyId, role }: { companyId: CompanyId; role: Role }) {
  return (
    <Link
      to="/companies/$companyId/settings/roles"
      params={{ companyId }}
      search={{ role }}
      className={buttonVariants({ size: 'sm' })}
    >
      {OPEN_IN_ROLES}
    </Link>
  )
}

function ReaderRow(props: { companyId: CompanyId; reader: Reader; mayChange: boolean }) {
  const { companyId, reader, mayChange } = props
  return (
    <TableRow>
      <TableCell>{reader.label}</TableCell>
      <TableCell className="text-right tabular-nums">{reader.members}</TableCell>
      <TableCell>{readsText(reader.role)}</TableCell>
      <TableCell className="text-right">
        {mayChange && !readsAlways(reader.role) && (
          <OpenRole companyId={companyId} role={reader.role} />
        )}
      </TableCell>
    </TableRow>
  )
}

function ReaderPhoneRow(props: { companyId: CompanyId; reader: Reader; mayChange: boolean }) {
  const { companyId, reader, mayChange } = props
  return (
    <Row>
      <div className="flex min-w-0 flex-col items-start gap-xs px-sm py-md">
        <span className="font-medium">{reader.label}</span>
        <span className="break-words text-text-2 tabular-nums">
          {`${peopleText(reader.members)} · ${readsText(reader.role)}`}
        </span>
        {mayChange && !readsAlways(reader.role) && (
          <OpenRole companyId={companyId} role={reader.role} />
        )}
      </div>
    </Row>
  )
}

/** The **Quem lê** tab: the roles that read this table, how many people hold each, and how each reads it. */
export function ReadersTab(props: {
  companyId: CompanyId
  copyId: CopyId
  read: UseQueryResult<Listed>
  mayChange: boolean
}) {
  const { companyId, copyId, read, mayChange } = props
  const phone = useIsMobile()
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError) {
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  const readers = readersOf(read.data, copyId) ?? []
  const rows = { companyId, mayChange }
  return (
    <div className="flex min-w-0 flex-col gap-md">
      {phone ? (
        <List>
          {readers.map((reader) => (
            <ReaderPhoneRow key={reader.role} reader={reader} {...rows} />
          ))}
        </List>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {READER_HEADS.map((head) => (
                <TableHead key={head} className={head === 'Pessoas' ? 'text-right' : undefined}>
                  {head}
                </TableHead>
              ))}
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readers.map((reader) => (
              <ReaderRow key={reader.role} reader={reader} {...rows} />
            ))}
          </TableBody>
        </Table>
      )}
      <p className="text-text-2">
        {mayChange ? `${READERS_NOTE} ${READERS_CHANGE}` : READERS_NOTE}
      </p>
    </div>
  )
}
