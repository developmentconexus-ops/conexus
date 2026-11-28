import type { CompanyId, DataReadEntry, DataReadFilters, PersonId } from '@conexus/hub-api'
import { DataReadAgent, DataReadResult } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Drawer, DrawerContent, DrawerTrigger } from '../../ui/drawer.tsx'
import { Pager } from '../../ui/pager.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'
import { Sheet, SheetContent } from '../../ui/sheet.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty } from '../../ui/states.tsx'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ExportReads } from './export-reads.tsx'
import { dataReadsQuery } from './queries.ts'
import { ReadDetail, readTitle } from './read-detail.tsx'
import type { ReadNames } from './text.ts'
import {
  AGENT_WORD,
  agentOf,
  filtersLabel,
  placeOf,
  RESULT_WORD,
  resultWord,
  TEXT,
  whatOf,
  whenOf,
} from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/data-reads')

/** What a filter's menu shows for no filter; the select holds no empty value. */
const ANY = '*'

type Choice = { value: string; label: string }

/** The people, the tables and the names the page reads from their owners. */
export type DataReadsLists = Readonly<{
  people: readonly { id: PersonId; name: string }[]
  tables: readonly string[]
  names: ReadNames
  viewer: PersonId
}>

const COLUMNS = [
  { name: 'Quando', width: 'lg:w-36' },
  { name: 'Quem', leavesOnPhone: true, width: 'lg:w-40' },
  { name: 'Agente', leavesOnPhone: true, width: 'lg:w-44' },
  { name: 'O que foi lido', leavesOnPhone: true },
  { name: 'Resultado', leavesOnPhone: true, width: 'lg:w-36' },
  { name: 'Linhas', leavesOnPhone: true, width: 'lg:w-20' },
] as const

function filtersOf(search: ReturnType<typeof route.useSearch>): DataReadFilters {
  const { person, agent, table, outcome } = search
  return { person, agent, table, outcome }
}

/** The four filters, each in the address; changing one goes back to the first page (web W18). */
function Filters({ lists, filters }: { lists: DataReadsLists; filters: DataReadFilters }) {
  const navigate = route.useNavigate()
  function set(name: keyof DataReadFilters, value: string | null) {
    const next = value === null || value === ANY ? undefined : value
    void navigate({ search: (old) => ({ ...old, [name]: next, page: undefined, read: undefined }) })
  }
  function all(label: string, items: Choice[]) {
    return [{ value: ANY, label }, ...items]
  }
  const menus = [
    {
      name: 'person' as const,
      label: 'Pessoa',
      items: all(
        TEXT.every,
        lists.people.map(({ id, name }) => ({ value: id, label: name })),
      ),
    },
    {
      name: 'agent' as const,
      label: 'Agente',
      items: all(
        TEXT.everyone,
        DataReadAgent.options.map((agent) => ({ value: agent, label: AGENT_WORD[agent] })),
      ),
    },
    {
      name: 'table' as const,
      label: 'Tabela',
      items: all(
        TEXT.every,
        lists.tables.map((table) => ({ value: table, label: table })),
      ),
    },
    {
      name: 'outcome' as const,
      label: 'Resultado',
      items: all(
        TEXT.everyone,
        DataReadResult.options.map((result) => ({ value: result, label: RESULT_WORD[result] })),
      ),
    },
  ]
  return menus.map((menu) => (
    <div key={menu.name} className="flex min-w-0 flex-col gap-xs">
      <span aria-hidden="true" className="text-label text-text-2">
        {menu.label}
      </span>
      <ChoiceSelect
        label={menu.label}
        value={filters[menu.name] ?? ANY}
        items={menu.items}
        onValueChange={(value) => set(menu.name, value)}
        className="w-full md:w-44"
      />
    </div>
  ))
}

function onCount(filters: DataReadFilters): number {
  return Object.values(filters).filter((value) => value !== undefined).length
}

/** A phone keeps the filters in a sheet from below, opened from "Filtros (n)". */
function PhoneFilters(props: { lists: DataReadsLists; filters: DataReadFilters }) {
  const [open, setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger render={<Button />}>{filtersLabel(onCount(props.filters))}</DrawerTrigger>
      <DrawerContent title="Filtros">
        <div className="flex flex-col gap-md pb-md">
          <Filters {...props} />
          <ClearFilters />
          <Button variant="primary" onClick={() => setOpen(false)}>
            {TEXT.sheet}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

const NO_FILTERS = { person: undefined, agent: undefined, table: undefined, outcome: undefined }

/** Every filter off, back to the first page; `inRow` sits level with the filters' fields. */
function ClearFilters({ inRow = false }: { inRow?: boolean }) {
  return (
    <Link
      className={cn('text-label underline', inRow ? 'flex h-9 items-center' : 'self-start')}
      to="."
      search={(old) => ({ ...old, ...NO_FILTERS, page: undefined, read: undefined })}
    >
      {TEXT.clear}
    </Link>
  )
}

/** The row's own cells: on a phone two lines in one cell, "quando · quem · agente" over "o que · resultado · linhas". */
function ReadRow(props: { read: DataReadEntry; names: ReadNames; phone: boolean; now: Date }) {
  const { read, names, phone, now } = props
  const when = (
    <Link to="." search={(old) => ({ ...old, read: read.id })} className="underline">
      {whenOf(read.at, now)}
    </Link>
  )
  const agent = agentOf(read)
  const place = read.project === null ? null : placeOf(read.project)
  const rows = read.rows === null ? '–' : read.rows.toLocaleString('pt-BR')
  const result = <span title={read.outcome}>{resultWord(read.outcome)}</span>
  const what = <span className="font-mono wrap-anywhere">{whatOf(read, names)}</span>
  if (phone) {
    return (
      <TableRow>
        <TableCell className="whitespace-normal px-sm">
          <span className="flex min-w-0 flex-col gap-xs">
            <span className="wrap-anywhere">
              {when} · {read.person.name} · {agent}
              {place && <span className="text-text-2"> {place}</span>}
            </span>
            <span className="wrap-anywhere text-label text-text-2">
              {what} · {result} · {rows}
            </span>
          </span>
        </TableCell>
      </TableRow>
    )
  }
  return (
    <TableRow>
      <TableCell className="px-sm">{when}</TableCell>
      <TableCell className="truncate px-sm">{read.person.name}</TableCell>
      <TableCell className="whitespace-normal px-sm">
        <span className="flex min-w-0 flex-col">
          <span className="wrap-anywhere">{agent}</span>
          {place && <span className="wrap-anywhere text-label text-text-2">{place}</span>}
        </span>
      </TableCell>
      <TableCell className="whitespace-normal px-sm">{what}</TableCell>
      <TableCell className="px-sm">{result}</TableCell>
      <TableCell className="px-sm text-right tabular-nums">{rows}</TableCell>
    </TableRow>
  )
}

/** The read the address opens (`?read=`), among the page's; one gone from it is not found. */
function OpenRead(props: {
  reads: readonly DataReadEntry[]
  companyId: CompanyId
  lists: DataReadsLists
  now: Date
}) {
  const { read: id } = route.useSearch()
  const navigate = route.useNavigate()
  const read = props.reads.find((one) => one.id === id)
  return (
    <Sheet
      open={id !== undefined}
      onOpenChange={(open) => {
        if (!open) void navigate({ search: (old) => ({ ...old, read: undefined }) })
      }}
    >
      <SheetContent
        side="right"
        closeLabel="Fechar"
        title={read === undefined ? TEXT.notFound : readTitle(read, props.now)}
      >
        {read !== undefined && <ReadDetail read={read} names={props.lists.names} />}
      </SheetContent>
    </Sheet>
  )
}

/**
 * Configurações, **Registro de dados** (`p4-04` to `p4-06`): the company's reads newest first, 50
 * a page, the filters in the address, a read opened in a panel and **Exportar**. Only an owner or
 * an administrator reaches it (founder, D1 (a)).
 */
export function DataReads({ lists }: { lists: DataReadsLists }) {
  const { companyId } = route.useParams()
  const search = route.useSearch()
  const filters = filtersOf(search)
  const { data } = useSuspenseQuery(dataReadsQuery(companyId, filters, search.page))
  const phone = useIsMobile()
  const now = new Date()
  const filtered = onCount(filters) > 0
  return (
    <section className="flex min-w-0 flex-col gap-lg">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div className="flex min-w-0 flex-wrap items-end gap-md">
          {phone ? (
            <PhoneFilters lists={lists} filters={filters} />
          ) : (
            <>
              <Filters lists={lists} filters={filters} />
              {/* With rows on the screen; the empty state has its own (founder, "3. A"). */}
              {filtered && data.reads.length > 0 && <ClearFilters inRow />}
            </>
          )}
        </div>
        <ExportReads
          companyId={companyId}
          filters={filters}
          names={lists.names}
          disabled={data.reads.length === 0}
        />
      </div>
      {data.reads.length === 0 ? (
        <div className="flex flex-col items-start gap-sm">
          <Empty>{filtered ? TEXT.emptyFiltered : TEXT.empty}</Empty>
          {filtered ? <ClearFilters /> : <p className="text-text-2">{TEXT.emptyMore}</p>}
        </div>
      ) : (
        <FramedTable aria-label="Registro de dados" columns={COLUMNS} showHeader={!phone}>
          <TableBody>
            {data.reads.map((read) => (
              <ReadRow key={read.id} read={read} names={lists.names} phone={phone} now={now} />
            ))}
          </TableBody>
        </FramedTable>
      )}
      <Pager next={data.next} param="page" page={search.page} list="Registro de dados" />
      <OpenRead reads={data.reads} companyId={companyId} lists={lists} now={now} />
    </section>
  )
}

/** The page while it loads: the frame stays, and the rows are skeletons (web W17). */
export function DataReadsPending() {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-md">
      <Skeleton className="h-9 w-2/3" />
      {['a', 'b', 'c', 'd', 'e'].map((row) => (
        <Skeleton key={row} className="h-10 w-full" />
      ))}
    </div>
  )
}
