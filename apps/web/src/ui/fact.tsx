import type { ReactNode } from 'react'

/** One labelled fact of a `<dl>`: the label above its value on a phone, beside it from `sm`. */
export function Fact(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xs border-b border-line py-sm sm:flex-row sm:gap-lg">
      <dt className="text-text-2 sm:w-44 sm:shrink-0">{props.label}</dt>
      <dd className="min-w-0 break-words">{props.children}</dd>
    </div>
  )
}
