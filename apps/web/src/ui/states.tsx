import type { FailureCode } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ConexusWordmark } from '../brand/mark.tsx'
import { useInitialAction } from '../platform/initial.ts'
import { Button, buttonVariants } from './button.tsx'
import { PageTitle } from './list.tsx'

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
      <PageTitle>Não foi possível abrir o Conexus</PageTitle>
      <p role="alert">
        {row.phrase} {row.action}
      </p>
      {row.actionKind === 'INITIAL' && <InitialLink />}
      {row.actionKind === 'RETRY' && (
        <Button variant="primary" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </Centred>
  )
}

/** A part of a page that could not load: the sentence and "Tentar de novo". */
export function ReadFailure({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-md">
      <p role="alert" className="text-danger">
        {text}
      </p>
      <Button onClick={onRetry}>Tentar de novo</Button>
    </div>
  )
}

function InitialLink() {
  const initial = useInitialAction()
  return (
    <Link to={initial.to} className={buttonVariants()}>
      {initial.label}
    </Link>
  )
}

export function NotFound() {
  return <NotFoundWithHint />
}

/** `hint` is one more line a place adds to every not-found of its own. */
export function NotFoundWithHint({ hint }: { hint?: string }) {
  return (
    <Centred>
      <ConexusWordmark />
      <PageTitle>{FAILURES.NOT_FOUND.phrase}</PageTitle>
      <p className="text-text-2">{FAILURES.NOT_FOUND.action}</p>
      {hint !== undefined && <p className="text-text-2">{hint}</p>}
      <InitialLink />
    </Centred>
  )
}

/** A list with nothing in it yet: one sentence in the grey of a subtitle (web W22). */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-text-2">{children}</p>
}
