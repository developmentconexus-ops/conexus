import type { CompanyId, DataReadFilters } from '@conexus/hub-api'
import { DATA_READS_EXPORT_DAYS } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog.tsx'
import { Field, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { readsCsv, saveCsv } from './csv.ts'
import { exportReads } from './queries.ts'
import type { ReadNames } from './text.ts'
import { TEXT } from './text.ts'

/** A day as the date field holds it, `YYYY-MM-DD`, in the browser's zone. */
function dayOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** The local midnight a `YYYY-MM-DD` day starts at, `after` days later. */
function midnightOf(day: string, after = 0): Date {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  return new Date(year, month - 1, date + after)
}

/** The last day of the 31 the export may take from `from`, and the first it may take up to `to`. */
const SPAN = DATA_READS_EXPORT_DAYS - 1

/**
 * **Exportar**: the reads of the filters of now in the days De to Até, both kept, at most 31 days
 * (criterion 82); the Hub gets the local midnight of De and of the day after Até (code C40). The
 * file is made here from the Hub's answer, which says when it stopped at 5,000.
 */
export function ExportReads(props: {
  companyId: CompanyId
  filters: DataReadFilters
  names: ReadNames
  disabled: boolean
}) {
  const today = dayOf(new Date())
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(dayOf(midnightOf(today, -SPAN)))
  const [to, setTo] = useState(today)
  const send = useMutation(exportReads)
  // `isPending` turns on only after the next render, and a double click's second arrives first.
  const sending = useRef(false)
  const valid = from !== '' && to !== '' && from <= to && to <= dayOf(midnightOf(from, SPAN))
  function exported() {
    if (sending.current) return
    sending.current = true
    send.mutate(
      {
        params: { companyId: props.companyId },
        query: {
          ...props.filters,
          from: midnightOf(from).toISOString(),
          to: midnightOf(to, 1).toISOString(),
        },
      },
      {
        onSettled: () => {
          sending.current = false
        },
        onSuccess: (answer) => {
          saveCsv(readsCsv(answer.reads, props.names), `registro-de-dados-${from}-${to}.csv`)
          if (answer.complete) setOpen(false)
        },
      },
    )
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) return
        // A reset drops the call's own callbacks: the export closed mid-way may be asked again.
        send.reset()
        sending.current = false
      }}
    >
      <DialogTrigger render={<Button disabled={props.disabled} />}>
        {TEXT.exportTitle}
      </DialogTrigger>
      <DialogContent title={TEXT.exportTitle} description={TEXT.exportAbout}>
        <div className="grid grid-cols-2 gap-md">
          <Field>
            <FieldLabel htmlFor="export-from">{TEXT.from}</FieldLabel>
            <Input
              id="export-from"
              type="date"
              value={from}
              min={dayOf(midnightOf(to, -SPAN))}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="export-to">{TEXT.to}</FieldLabel>
            <Input
              id="export-to"
              type="date"
              value={to}
              min={from}
              max={dayOf(midnightOf(from, SPAN))}
              onChange={(event) => setTo(event.target.value)}
            />
          </Field>
        </div>
        {send.data?.complete === false && <p>{TEXT.cut}</p>}
        <div className="flex flex-wrap items-center gap-md">
          <Button variant="primary" disabled={!valid || send.isPending} onClick={exported}>
            {send.isPending ? TEXT.exporting : TEXT.exportTitle}
          </Button>
          {send.isError && <Alert tone="danger">{sentenceOf(send.error)}</Alert>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
