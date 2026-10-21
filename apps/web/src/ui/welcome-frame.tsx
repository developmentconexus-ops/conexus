import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ConexusWordmark } from '../brand/mark.tsx'
import { cn } from './cn.ts'
import { PageTitle } from './list.tsx'

const STEPS = [1, 2, 3, 4] as const

/**
 * The frame of an owner's first entry (web W33): the mark and "Passo n de 4" with `exit` above, the
 * progress, an optional "Voltar", and the step's title over its content, in one column.
 */
export function WelcomeFrame(props: {
  step: 1 | 2 | 3 | 4
  title: string
  back?: Pick<LinkProps, 'to' | 'params'>
  exit: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-14 items-center gap-md border-b border-line bg-surface px-lg">
        <ConexusWordmark word="md" />
        <p className="ml-auto text-label text-text-2">Passo {props.step} de 4</p>
        {props.exit}
      </header>
      <main className="flex flex-1 justify-center p-lg md:items-center">
        <div className="flex w-full max-w-message flex-col gap-xl">
          <div aria-hidden="true" className="flex gap-xs">
            {STEPS.map((step) => (
              <span
                key={step}
                className={cn('h-1 flex-1 rounded-pill', step <= props.step ? 'bg-ink' : 'bg-line')}
              />
            ))}
          </div>
          {props.back && (
            <Link {...props.back} className="flex w-fit items-center gap-xs text-label text-text-2">
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              Voltar
            </Link>
          )}
          <PageTitle className="text-display">{props.title}</PageTitle>
          {props.children}
        </div>
      </main>
    </div>
  )
}
