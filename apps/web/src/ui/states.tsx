import type { FailureCode } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ConexusWordmark } from '../brand/mark.tsx'
import { useInitialAction } from '../platform/initial.ts'
import { Button, buttonVariants } from './button.tsx'
import { useInFrame } from './frame.tsx'
import { PageTitle } from './list.tsx'
import { Skeleton } from './skeleton.tsx'

/** A whole page, centred; inside a frame, the content area without a second `main` (web W34). */
function Centred({ children }: { children: ReactNode }) {
  const inner = (
    <div className="flex max-w-message flex-col items-center gap-lg text-center">{children}</div>
  )
  if (useInFrame()) return <div className="grid flex-1 place-items-center">{inner}</div>
  return <main className="grid min-h-dvh place-items-center bg-canvas p-lg">{inner}</main>
}

/**
 * The router's wait while a page loads (web W17): inside a frame the frame stays and only the
 * content becomes a skeleton; with no frame yet, the wordmark.
 */
export function Loading() {
  if (useInFrame()) {
    return (
      <div role="status" aria-label="Carregando" className="flex flex-col gap-lg">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="w-full max-w-message" />
        <Skeleton className="w-2/3 max-w-message" />
      </div>
    )
  }
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
      {!useInFrame() && <ConexusWordmark />}
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

function InitialLink() {
  const initial = useInitialAction()
  return (
    <Link to={initial.to} className={buttonVariants()}>
      {initial.label}
    </Link>
  )
}

/**
 * A page that does not exist for this person. Inside a frame it stays in the content area with
 * "Ir para o início"; alone, the root's way back. `hint` is one more line a place adds.
 */
export function NotFound({ hint }: { hint?: string }) {
  const inFrame = useInFrame()
  return (
    <Centred>
      {!inFrame && <ConexusWordmark />}
      <PageTitle>{FAILURES.NOT_FOUND.phrase}</PageTitle>
      <p className="text-text-2">{FAILURES.NOT_FOUND.action}</p>
      {hint !== undefined && <p className="text-text-2">{hint}</p>}
      {inFrame ? (
        <Link to="/" className={buttonVariants()}>
          Ir para o início
        </Link>
      ) : (
        <InitialLink />
      )}
    </Centred>
  )
}

/** A list with nothing in it yet: one sentence in the grey of a subtitle (web W22). */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-text-2">{children}</p>
}
