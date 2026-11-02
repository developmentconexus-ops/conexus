import type { ReactNode } from 'react'
import { PageTitle } from '../../ui/list.tsx'

/**
 * A company's Início (web W29), on one axis (design V59): `aside` first, for what the company still
 * needs, then the greeting `title` centred over `start`, the box that starts a Projeto or a
 * conversation, and `below`, the blocks the person's role reads.
 */
export function Home(props: {
  aside?: ReactNode
  title: string
  start: ReactNode
  below?: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-axis flex-col gap-3xl pb-2xl min-[1600px]:max-w-axis-wide">
      {props.aside}
      <section aria-labelledby="start-title" className="flex flex-col gap-xl">
        <PageTitle className="text-balance text-center text-display max-md:text-display-narrow">
          <span id="start-title">{props.title}</span>
        </PageTitle>
        {props.start}
      </section>
      {props.below}
    </div>
  )
}
