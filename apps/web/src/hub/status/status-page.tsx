import { FAILURES } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { ConexusWordmark } from '../../brand/mark.tsx'
import { HubFailure } from '../../platform/hub.ts'
import { statusQuery } from './queries.ts'

const PHRASE = 'O Conexus está no ar.'

export function StatusPage() {
  const status = useQuery(statusQuery)
  const failure = status.error instanceof HubFailure ? status.error.code : 'INTERNAL_UNEXPECTED'
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-lg font-body text-text">
      <div className="flex flex-col items-center gap-xl text-center">
        <ConexusWordmark size="lg" arrive />
        {status.isError ? (
          <p role="alert" className="text-title">
            {FAILURES[failure].phrase}
          </p>
        ) : (
          <p className="text-title">{PHRASE}</p>
        )}
        {status.data && (
          <p className="font-mono text-fact tabular-nums text-text-2">{status.data.version}</p>
        )}
      </div>
    </main>
  )
}
