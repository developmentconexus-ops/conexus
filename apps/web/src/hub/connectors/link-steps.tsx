import type {
  CompanyId,
  ConnectorEntry,
  LakeInterval,
  LakeTablesOfConnection,
} from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { DialogBody, DialogFooter } from '../../ui/dialog.tsx'
import { Field, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { Spinner } from '../../ui/spinner.tsx'
import { IntervalField } from './interval-field.tsx'
import type { Picks } from './lake-pick.ts'
import { isFuture, limitedCount, nameOf, prefixOf } from './lake-pick.ts'
import { LakePicker } from './lake-picker.tsx'
import {
  ASK_COPY_MANAGER,
  BACK,
  CLOSE,
  CONTINUE,
  everyText,
  LINK_AND_COPY,
  LINKING,
  MANUAL_HELP,
  markedText,
  PICK_ONE,
  PREFIX,
  PREFIX_HELP,
  REVIEW,
  readingText,
  reviewSinceText,
  SEE_IN_DATA,
  STARTED,
  TESTING_LINE,
} from './lake-text.ts'
import { intervalText } from './lake-words.ts'
import { SinceField } from './since-field.tsx'
import { WORKING_TEXT } from './text.ts'

type Lake = LakeTablesOfConnection

/** The two lines the window shows while the Hub tests the keys and then reads what the system offers. */
export function TestingStep(props: {
  phase: 'TEST' | 'READ'
  system: string
  onClose: () => void
}) {
  const line = props.phase === 'TEST' ? TESTING_LINE : readingText(props.system)
  return (
    <>
      <DialogBody>
        <p role="status" className="flex max-w-message items-center gap-md">
          <Spinner label={line} />
          <span>{line}</span>
        </p>
      </DialogBody>
      <DialogFooter>
        <div className="flex flex-wrap gap-md">
          <Button onClick={props.onClose}>Cancelar</Button>
        </div>
      </DialogFooter>
    </>
  )
}

/** "O que copiar": the tables by subject, the prefix they share, and what the date does to them. */
export function ChooseStep(props: {
  entry: ConnectorEntry
  lake: Lake
  picks: Picks
  since: string
  /** Set when the window opened here, from the section: the date was not asked at the access. */
  askSince: boolean
  refusal: string | null
  onPicks: (picks: Picks) => void
  onSince: (since: string) => void
  onNext: () => void
  onBack: (() => void) | null
}) {
  const { lake, picks, since } = props
  const count = picks.marked.size
  const limited = limitedCount(lake.tables, picks, since)
  return (
    <>
      <DialogBody>
        <div className="flex min-w-0 flex-col gap-lg">
          {props.askSince && <SinceField value={since} onChange={props.onSince} />}
          <Field className="sm:max-w-column">
            <FieldLabel htmlFor="lake-prefix">{PREFIX}</FieldLabel>
            <Input
              id="lake-prefix"
              className="font-mono text-base md:text-fact"
              value={prefixOf(props.entry.id)}
              readOnly
            />
            <p className="text-text-2">{PREFIX_HELP}</p>
          </Field>
          <LakePicker
            entry={props.entry}
            tables={lake.tables}
            picks={picks}
            refusal={props.refusal}
            search
            onPicks={props.onPicks}
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <p className="text-text-2 tabular-nums">
          {count === 0 ? PICK_ONE : markedText(count, limited)}
        </p>
        {props.refusal !== null && <Alert tone="danger">{props.refusal}</Alert>}
        <div className="flex flex-wrap gap-md">
          <Button
            variant="primary"
            disabled={count === 0 || isFuture(since)}
            onClick={props.onNext}
          >
            {CONTINUE}
          </Button>
          {props.onBack && <Button onClick={props.onBack}>{BACK}</Button>}
        </div>
      </DialogFooter>
    </>
  )
}

/** "Quando copiar": how often, and the review of what will be linked, with the name each table gets. */
export function WhenStep(props: {
  entry: ConnectorEntry
  lake: Lake
  picks: Picks
  since: string
  interval: LakeInterval
  saving: boolean
  error: string | null
  onInterval: (interval: LakeInterval) => void
  onLink: () => void
  onBack: () => void
}) {
  const { lake, picks } = props
  const marked = lake.tables.filter((one) => picks.marked.has(one.source))
  const prefix = prefixOf(props.entry.id)
  return (
    <>
      <DialogBody>
        <div className="flex max-w-message flex-col gap-xl">
          <IntervalField value={props.interval} onChange={props.onInterval}>
            <p className="text-text-2">
              {props.interval === 'MANUAL' ? MANUAL_HELP : everyText(intervalText(props.interval))}
            </p>
          </IntervalField>
          <section aria-label={REVIEW} className="flex flex-col gap-sm">
            <SectionTitle>{REVIEW}</SectionTitle>
            <ul className="flex flex-col">
              {marked.map((table) => (
                <li
                  key={table.source}
                  className="flex flex-col gap-xs border-b border-line py-sm first:border-t sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="font-medium">{table.label}</span>
                  <span className="font-mono text-fact">{nameOf(prefix, table, picks)}</span>
                </li>
              ))}
            </ul>
            <p className="text-text-2 tabular-nums">{reviewSinceText(props.since)}</p>
          </section>
        </div>
      </DialogBody>
      <DialogFooter>
        {props.error !== null && <Alert tone="danger">{props.error}</Alert>}
        <div className="flex flex-wrap gap-md">
          <Button variant="primary" disabled={props.saving} onClick={props.onLink}>
            {props.saving ? LINKING : LINK_AND_COPY}
          </Button>
          <Button disabled={props.saving} onClick={props.onBack}>
            {BACK}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

/** "Ligado": the first load began, or the connection is linked and there is nothing here to copy. */
export function LinkedStep(props: {
  companyId: CompanyId
  outcome: 'STARTED' | 'NO_COPY' | 'NOT_ALLOWED'
  onClose: () => void
}) {
  return (
    <>
      <DialogBody>
        <div role="status" className="flex max-w-message flex-col gap-md">
          <p className="font-medium">{props.outcome === 'STARTED' ? STARTED : WORKING_TEXT}</p>
          {props.outcome === 'NOT_ALLOWED' && <p className="text-text-2">{ASK_COPY_MANAGER}</p>}
        </div>
      </DialogBody>
      <DialogFooter>
        <div className="flex flex-wrap gap-md">
          {props.outcome === 'STARTED' && (
            <Button
              variant="primary"
              render={
                <Link to="/companies/$companyId/data" params={{ companyId: props.companyId }} />
              }
            >
              {SEE_IN_DATA}
            </Button>
          )}
          <Button
            variant={props.outcome === 'STARTED' ? 'default' : 'primary'}
            onClick={props.onClose}
          >
            {CLOSE}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
