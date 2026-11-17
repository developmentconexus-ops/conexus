import type { ReactNode } from 'react'
import { cn } from './cn.ts'
import { PageTitle } from './list.tsx'

// A page's title with its actions at the end; the actions wrap under the title when the box is
// narrow. With an intro under the title, the actions line up with the top of it.
export function PageHeader(props: { title: string; actions: ReactNode; intro?: ReactNode }) {
  return (
    <div
      className={cn(
        'flex flex-wrap justify-between gap-md',
        props.intro === undefined ? 'items-center' : 'items-start',
      )}
    >
      {props.intro === undefined ? (
        <PageTitle>{props.title}</PageTitle>
      ) : (
        <div className="flex min-w-0 flex-col gap-xs">
          <PageTitle>{props.title}</PageTitle>
          {props.intro}
        </div>
      )}
      {props.actions}
    </div>
  )
}
