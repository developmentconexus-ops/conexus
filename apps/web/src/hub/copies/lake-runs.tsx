import type { CompanyId, LakeRun, LakeTableId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon } from 'lucide-react'
import { Button } from '../../ui/button.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { lakeTableRunsQuery } from './lake-queries.ts'
import { RunBadge, whenText } from './lake-state.tsx'
import { Failed } from './lake-tabs.tsx'
import {
  cpuPeakText,
  lengthText,
  MACHINE,
  MACHINE_CPU,
  MACHINE_LENGTH,
  MACHINE_MEMORY,
  MACHINE_SIZE,
  machineSizeText,
  memoryPeakText,
  NEVER_RAN,
  NO_MACHINE,
  NO_VALUE,
  RUN_COLUMNS,
  RUN_COLUMNS_LABEL,
  RUNS_FAILED,
  runKindText,
  wholeRoundText,
} from './text.ts'

type Ended = Exclude<LakeRun, { outcome: 'RUNNING' }>

function Measure(props: { label: string; children: string }) {
  return (
    <div className="flex flex-col gap-xs">
      <dt className="text-text-2">{props.label}</dt>
      <dd className="tabular-nums">{props.children}</dd>
    </div>
  )
}

/** What the machine spent in the round, said for the round and never for one table; a round that was not measured says so. */
function MachineBody(props: { run: Ended; tables: number }) {
  const { machine } = props.run
  if (machine === null) return <p className="text-text-2">{NO_MACHINE}</p>
  return (
    <div className="flex flex-col gap-sm">
      <dl className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        <Measure label={MACHINE_SIZE}>{machineSizeText(machine)}</Measure>
        <Measure label={MACHINE_LENGTH}>
          {lengthText(props.run.startedAt, props.run.endedAt)}
        </Measure>
        <Measure label={MACHINE_MEMORY}>{memoryPeakText(machine)}</Measure>
        <Measure label={MACHINE_CPU}>{cpuPeakText(machine)}</Measure>
      </dl>
      <p className="text-text-2">{wholeRoundText(props.tables)}</p>
    </div>
  )
}

function Machine(props: { run: Ended; tables: number }) {
  return (
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="group -ml-2.5" />}>
        <ChevronDownIcon aria-hidden="true" className="group-data-[panel-open]:rotate-180" />
        {MACHINE}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-sm">
          <MachineBody run={props.run} tables={props.tables} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function lengthOf(run: LakeRun): string {
  return run.outcome === 'RUNNING' ? NO_VALUE : lengthText(run.startedAt, run.endedAt)
}

function kindOf(run: LakeRun): string {
  return run.outcome === 'RUNNING' ? NO_VALUE : runKindText(run)
}

function readOf(run: LakeRun): string {
  return run.outcome === 'RUNNING' ? NO_VALUE : run.read.toLocaleString('pt-BR')
}

function RunRows(props: { run: LakeRun; system: string; tables: number }) {
  const { run } = props
  const phone = useIsMobile()
  const detail = run.outcome === 'RUNNING' ? null : run
  return (
    <>
      <TableRow className="border-b-0">
        <TableCell className="whitespace-normal px-sm">
          <span className="flex flex-col gap-xs">
            <span className="tabular-nums">{whenText(run.startedAt)}</span>
            {phone && (
              <>
                {detail !== null && (
                  <span className="text-text-2">
                    {kindOf(run)} · {readOf(run)} linhas · {lengthOf(run)}
                  </span>
                )}
                <span>
                  <RunBadge run={run} />
                </span>
              </>
            )}
          </span>
        </TableCell>
        {!phone && (
          <>
            <TableCell className="px-sm">
              <span className="text-text-2">{kindOf(run)}</span>
            </TableCell>
            <TableCell className="px-sm">
              <span className="tabular-nums">{readOf(run)}</span>
            </TableCell>
            <TableCell className="px-sm">
              <span className="tabular-nums">{lengthOf(run)}</span>
            </TableCell>
            <TableCell className="px-sm">
              <RunBadge run={run} />
            </TableCell>
          </>
        )}
      </TableRow>
      {detail !== null && (
        <TableRow>
          <TableCell
            colSpan={phone ? 1 : RUN_COLUMNS.length}
            className="whitespace-normal px-sm pt-0"
          >
            {detail.outcome === 'ERROR' && <Failed run={detail} system={props.system} />}
            <div className="mt-sm">
              <Machine run={detail} tables={props.tables} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

/** The rounds of the copy that carried the table, newest first as the Hub sends them. */
export function Runs(props: {
  companyId: CompanyId
  tableId: LakeTableId
  system: string
  tables: number
}) {
  const runs = useQuery(lakeTableRunsQuery(props.companyId, props.tableId))
  if (runs.isPending) return <Skeleton className="h-24 w-full" />
  if (runs.isError) return <ReadFailure text={RUNS_FAILED} onRetry={() => void runs.refetch()} />
  if (runs.data.length === 0) return <Empty>{NEVER_RAN}</Empty>
  return (
    <FramedTable
      aria-label={RUN_COLUMNS_LABEL}
      columns={[
        { name: RUN_COLUMNS[0] },
        { name: RUN_COLUMNS[1], leavesOnPhone: true, width: 'lg:w-60' },
        { name: RUN_COLUMNS[2], leavesOnPhone: true, width: 'lg:w-32' },
        { name: RUN_COLUMNS[3], leavesOnPhone: true, width: 'lg:w-28' },
        { name: RUN_COLUMNS[4], leavesOnPhone: true, width: 'lg:w-36' },
      ]}
      showHeader
    >
      <TableBody>
        {runs.data.map((run) => (
          <RunRows key={run.id} run={run} system={props.system} tables={props.tables} />
        ))}
      </TableBody>
    </FramedTable>
  )
}
