import type {
  CompanyId,
  Connection,
  ConnectorEntry,
  LakeInterval,
  LakeTablesOfConnection,
} from '@conexus/hub-api'
import { LAKE_INTERVAL_DEFAULT } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf, unconfirmedText } from '../../platform/hub.ts'
import { setServerError, setWriteError, useSchemaForm } from '../../ui/form.tsx'
import type { Picks } from './lake-pick.ts'
import { copyBody, NO_PICKS, prefixOf } from './lake-pick.ts'
import { lakeTablesPrefix, lakeTablesQuery, sendLakeCopy } from './lake-queries.ts'
import { NAME, schemaOf, suggestedName } from './link-fields.tsx'
import { useMay } from './may.ts'
import { connectionKeys, connectionsPrefix, sendLink, sendReconnect, sendTest } from './queries.ts'
import type { Refusal } from './said.tsx'

type Lake = LakeTablesOfConnection

/** Where the window is, as one state: what each step holds exists only in that step (code C21). */
export type Stage =
  | { step: 'ACCESS' }
  | { step: 'TESTING'; phase: 'TEST' | 'READ' }
  | { step: 'REFUSED'; answer: Refusal }
  | { step: 'CHOOSE'; lake: Lake }
  | { step: 'WHEN'; lake: Lake }
  | { step: 'LINKED'; outcome: 'STARTED'; tables: number }
  | { step: 'LINKED'; outcome: 'NO_COPY' | 'NOT_ALLOWED' }

const UNCONFIRMED = unconfirmedText('a ligação', 'Tente de novo.')
const NAME_REFUSALS: ReadonlySet<string> = new Set(['COPY_NAME_INVALID', 'COPY_NAME_TAKEN'])
const LIST_CHANGED: ReadonlySet<string> = new Set(['CONNECTION_NAME_TAKEN', 'CONNECTOR_UNKNOWN'])

export function barOf(stage: Stage): number | null {
  switch (stage.step) {
    case 'ACCESS':
    case 'REFUSED':
      return 0
    case 'TESTING':
      return 1
    case 'CHOOSE':
      return 2
    case 'WHEN':
      return 3
    case 'LINKED':
      return null
  }
}

/** The step that follows a working test: the tables to choose from, or "Ligado" when there is nothing to choose or no right to. */
function afterRead(lake: Lake, mayManageCopies: boolean): Stage {
  if (!mayManageCopies) return { step: 'LINKED', outcome: 'NOT_ALLOWED' }
  if (lake.lake.kind === 'UNAVAILABLE' || lake.tables.length === 0) {
    return { step: 'LINKED', outcome: 'NO_COPY' }
  }
  return { step: 'CHOOSE', lake }
}

type Props = {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  resume?: { connection: Connection; lake: Lake }
}

/** What the window holds while it moves: the step and what each step reads. */
function useWindowState(props: Props) {
  const { resume } = props
  const [stage, setStage] = useState<Stage>(
    resume ? { step: 'CHOOSE', lake: resume.lake } : { step: 'ACCESS' },
  )
  const [connection, setConnection] = useState<Connection | undefined>(resume?.connection)
  const [since, setSince] = useState('')
  const [picks, setPicks] = useState<Picks>(NO_PICKS)
  const [interval, setInterval] = useState<LakeInterval>(LAKE_INTERVAL_DEFAULT)
  const [error, setError] = useState<string | null>(null)
  const [nameRefusal, setNameRefusal] = useState<string | null>(null)
  return {
    ...{ stage, setStage, connection, setConnection, since, setSince, picks, setPicks },
    ...{ interval, setInterval, error, setError, nameRefusal, setNameRefusal },
  }
}

type State = ReturnType<typeof useWindowState>

function markStale(queryClient: QueryClient, companyId: CompanyId, target: Connection) {
  for (const queryKey of [...connectionKeys(companyId, target.id), connectionsPrefix(companyId)]) {
    void queryClient.invalidateQueries({ queryKey })
  }
}

/** The access: the keys sealed by the Hub, the test, and the read of what the system offers. */
function useAccess(props: Props, state: State) {
  const { companyId, entry } = props
  const { connection, setConnection, setStage, setPicks } = state
  const may = useMay()
  const queryClient = useQueryClient()
  const attempt = useAttemptKey()
  const link = useMutation(sendLink)
  const reconnect = useMutation(sendReconnect)
  const test = useMutation(sendTest)
  const form = useSchemaForm(schemaOf(entry), {
    [NAME]: suggestedName(entry, props.connections),
    ...Object.fromEntries(entry.fields.map((field) => [field.name, ''])),
  })

  async function keys(values: Record<string, string>): Promise<Connection> {
    const { [NAME]: name = '', ...credential } = values
    if (connection) {
      const sent = await reconnect.mutateAsync({
        params: { companyId, connectionId: connection.id },
        body: { credential },
      })
      return sent.connection
    }
    const sent = await attempt((attemptKey) =>
      link.mutateAsync({
        params: { companyId },
        body: { connector: entry.id, name, credential },
        attemptKey,
      }),
    )
    return sent.connection
  }

  async function read(target: Connection) {
    setStage({ step: 'TESTING', phase: 'READ' })
    const lake = await queryClient.fetchQuery({
      ...lakeTablesQuery(companyId, target.id),
      staleTime: 0,
    })
    setPicks(NO_PICKS)
    setStage(afterRead(lake, may.manageCopies))
  }

  async function submit(values: Record<string, string>) {
    let target: Connection
    try {
      target = await keys(values)
    } catch (failure) {
      if (failure instanceof HubFailure && LIST_CHANGED.has(failure.code)) {
        void queryClient.invalidateQueries({ queryKey: connectionsPrefix(companyId) })
      }
      setWriteError(form, failure, UNCONFIRMED, {
        CONNECTION_NAME_INVALID: NAME,
        CONNECTION_NAME_TAKEN: NAME,
      })
      return
    }
    setConnection(target)
    markStale(queryClient, companyId, target)
    setStage({ step: 'TESTING', phase: 'TEST' })
    try {
      const answer = await test.mutateAsync({ params: { companyId, connectionId: target.id } })
      markStale(queryClient, companyId, target)
      if (answer.result !== 'WORKING') {
        setStage({ step: 'REFUSED', answer })
        return
      }
      await read(target)
    } catch (failure) {
      setStage({ step: 'ACCESS' })
      setServerError(form, failure)
    }
  }

  return { form, submit }
}

/** "Ligar e copiar agora": the one `PUT` that sets the copy; a refused name sends the person back to choose. */
function useFinish(props: Props, state: State) {
  const { companyId, entry } = props
  const { connection, picks, interval, since, setStage, setError, setNameRefusal } = state
  const queryClient = useQueryClient()
  const save = useMutation(sendLakeCopy)

  async function finish(lake: Lake) {
    if (!connection) throw new RangeError('The window links a connection before it copies')
    setError(null)
    setNameRefusal(null)
    try {
      await save.mutateAsync({
        params: { companyId, connectionId: connection.id },
        body: copyBody({ prefix: prefixOf(entry.id), tables: lake.tables, picks, interval, since }),
      })
    } catch (failure) {
      if (failure instanceof HubFailure && NAME_REFUSALS.has(failure.code)) {
        setNameRefusal(sentenceOf(failure))
        setStage({ step: 'CHOOSE', lake })
        return
      }
      setError(sentenceOf(failure))
      return
    }
    void queryClient.invalidateQueries({ queryKey: lakeTablesPrefix(companyId, connection.id) })
    const tables = lake.tables.filter((one) => picks.marked.has(one.source)).length
    setStage({ step: 'LINKED', outcome: 'STARTED', tables })
  }

  return { finish, saving: save.isPending }
}

/** The window's state and what moves it: the keys, the test, the read, and the one `PUT` that sets the copy. */
export function useLinkFlow(props: Props) {
  const state = useWindowState(props)
  const access = useAccess(props, state)
  const copy = useFinish(props, state)
  return { ...state, ...access, ...copy }
}
