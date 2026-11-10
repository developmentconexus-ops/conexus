import type { CompanyId, CopyId, CopyRun } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { CodeBlock, CodeBlockContent, CodeBlockLine } from '../../ui/code-block.tsx'
import { PageTitle, SectionTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import type { Note } from './copy-list.tsx'
import { CopyMenu, NoteLine, StateBadge } from './copy-list.tsx'
import { copyRunsQuery } from './queries.ts'
import {
  BACK_TO_COPIES,
  COPIED_TITLE,
  countText,
  durationText,
  INTERVAL_LABEL,
  NO_RUNS_YET,
  outcomeText,
  RUNS_TITLE,
  windowText,
} from './text.ts'

function RunRow({ run }: { run: CopyRun }) {
  return (
    <TableRow>
      <TableCell className="tabular-nums">{dayAndHour(run.startedAt)}</TableCell>
      <TableCell className="tabular-nums">{durationText(run)}</TableCell>
      <TableCell className="text-right tabular-nums">{countText(run.read)}</TableCell>
      <TableCell className="text-right tabular-nums">{countText(run.written)}</TableCell>
      <TableCell className="whitespace-normal">{outcomeText(run)}</TableCell>
    </TableRow>
  )
}

function Runs(props: {
  runs: CopyRun[]
  next: Parameters<typeof Pager>[0]['next']
  page?: string
}) {
  if (props.runs.length === 0) return <p className="text-text-2">{NO_RUNS_YET}</p>
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead className="text-right">Lidas</TableHead>
            <TableHead className="text-right">Gravadas</TableHead>
            <TableHead>Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.runs.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </TableBody>
      </Table>
      <Pager next={props.next} param="page" page={props.page} list="Rodadas" />
    </>
  )
}

/**
 * **Uma cópia** (Capacidade 2, U4; web W29, W34): what it copies (the query in mono, scrolling inside
 * its box; the key; the window it rereads), its actions, and its runs, newest first, 20 to a page.
 * The route's loader has already refused a copy the Hub does not have.
 */
export function CopyDetail(props: { companyId: CompanyId; copyId: CopyId; page?: string }) {
  const { companyId, copyId, page } = props
  const read = useQuery(copyRunsQuery(companyId, copyId, page))
  const [note, setNote] = useState<Note>()
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { copy, runs, next } = read.data
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-lg">
      <Link
        to="/companies/$companyId/copies"
        params={{ companyId }}
        className="inline-flex items-center gap-xs text-label text-text-2"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
        {BACK_TO_COPIES}
      </Link>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-md">
        <div className="flex min-w-0 flex-wrap items-center gap-md">
          <PageTitle className="min-w-0 break-words">{copy.label}</PageTitle>
          <StateBadge copy={copy} />
          <span className="text-text-2">
            {copy.interval === null
              ? copy.connection.name
              : `${copy.connection.name} · a cada ${INTERVAL_LABEL[copy.interval]}`}
          </span>
        </div>
        <CopyMenu companyId={companyId} copy={copy} onNote={setNote} />
      </div>
      {note !== undefined && <NoteLine note={note} />}
      <section aria-label={COPIED_TITLE} className="flex min-w-0 flex-col gap-md">
        <SectionTitle>{COPIED_TITLE}</SectionTitle>
        <CodeBlock>
          <CodeBlockContent>
            {copy.shown.query
              .split('\n')
              .map((text, number) => ({ number, text }))
              .map((line) => (
                <CodeBlockLine key={line.number}>{line.text}</CodeBlockLine>
              ))}
          </CodeBlockContent>
        </CodeBlock>
        <p className="break-words">
          <span className="text-text-2">Chave </span>
          <span className="font-mono text-fact">{copy.shown.key.join(', ')}</span>
        </p>
        <p className="break-words">
          <span className="text-text-2">Janela </span>
          {windowText(copy.shown.window)}
        </p>
      </section>
      <section aria-label={RUNS_TITLE} className="flex min-w-0 flex-col gap-md">
        <SectionTitle>{RUNS_TITLE}</SectionTitle>
        <Runs runs={runs} next={next} page={page} />
      </section>
    </div>
  )
}
