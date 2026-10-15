import type { FailureCode } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { ConexusWordmark } from '../brand/mark.tsx'
import { Button } from './button.tsx'

function Centred({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-lg">
      <div className="flex max-w-message flex-col items-center gap-lg text-center">{children}</div>
    </main>
  )
}

/** The router's wait while a page loads (web W17). */
export function Loading() {
  return (
    <Centred>
      <ConexusWordmark arrive />
      <p role="status" className="text-text-2">
        Abrindo o Conexus
      </p>
    </Centred>
  )
}

/** A page that could not open: the failure's words by code, and "Tentar de novo" only on RETRY. */
export function Failure({ code, onRetry }: { code: FailureCode; onRetry: () => void }) {
  const row = FAILURES[code]
  return (
    <Centred>
      <ConexusWordmark />
      <h1 className="font-display text-title">Não foi possível abrir o Conexus</h1>
      <p role="alert">
        {row.phrase} {row.action}
      </p>
      {row.actionKind === 'RETRY' && (
        <Button variant="primary" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </Centred>
  )
}

export function NotFound() {
  return (
    <Centred>
      <ConexusWordmark />
      <h1 className="font-display text-title">{FAILURES.NOT_FOUND.phrase}</h1>
      <p className="text-text-2">{FAILURES.NOT_FOUND.action}</p>
    </Centred>
  )
}
