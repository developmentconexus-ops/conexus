import type {
  CompanyId,
  Connection,
  ConnectorEntry,
  LakeTablesOfConnection,
} from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { useState } from 'react'
import { sentenceOf, sentenceOfCode } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { CopiedTables } from './lake-copied.tsx'
import {
  CHOOSE_WHAT,
  LAKE_TABLES,
  LINES_STAY,
  NOTHING_COPIED,
  readingDictionaryText,
} from './lake-text.ts'
import { LinkWindow } from './link-window.tsx'
import { useMay } from './may.ts'

type Lake = LakeTablesOfConnection

/** A connection with no copy: what it says, and the window that picks up at "O que copiar" (T.33). */
function NoCopy(props: {
  companyId: CompanyId
  connection: Connection
  entry: ConnectorEntry
  lake: Lake
}) {
  const [choosing, setChoosing] = useState(false)
  const may = useMay()
  const notReady = props.lake.lake.kind === 'NOT_READY'
  return (
    <section aria-label={LAKE_TABLES} className="flex flex-col gap-md">
      <SectionTitle>{LAKE_TABLES}</SectionTitle>
      <p className="font-medium">{NOTHING_COPIED}</p>
      {notReady ? (
        <p className="max-w-message text-text-2">{sentenceOfCode('COPY_LAKE_NOT_READY')}</p>
      ) : (
        <p className="max-w-message text-text-2">{LINES_STAY}</p>
      )}
      {may.manageCopies && !notReady && (
        <div>
          <Button variant="primary" onClick={() => setChoosing(true)}>
            {CHOOSE_WHAT}
          </Button>
        </div>
      )}
      {choosing && (
        <LinkWindow
          companyId={props.companyId}
          entry={props.entry}
          connections={[]}
          resume={{ connection: props.connection, lake: props.lake }}
          onClose={() => setChoosing(false)}
        />
      )}
    </section>
  )
}

/**
 * "Tabelas no lago": the aba Tabelas of a connection that copies. It reads the tables the kit
 * declares with the lake's marks, and shows what a connection with no copy, a copy and a lake not
 * ready each say.
 */
export function LakeTables(props: {
  companyId: CompanyId
  connection: Connection
  entry: ConnectorEntry
  read: UseQueryResult<Lake>
}) {
  const may = useMay()
  const { read } = props
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  if (read.data === undefined) {
    return (
      <p role="status" className="text-text-2">
        {readingDictionaryText(props.entry.name)}
      </p>
    )
  }
  const lake = read.data
  if (!lake.tables.some((one) => one.copy.kind === 'MARKED')) {
    return (
      <NoCopy
        companyId={props.companyId}
        connection={props.connection}
        entry={props.entry}
        lake={lake}
      />
    )
  }
  return (
    <CopiedTables
      companyId={props.companyId}
      connectionId={props.connection.id}
      entry={props.entry}
      lake={lake}
      editable={may.manageCopies}
    />
  )
}
