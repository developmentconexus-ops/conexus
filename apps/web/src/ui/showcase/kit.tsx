import type { ReactNode } from 'react'
import type { ShowcaseEntry, ShowcaseGroup } from './types.ts'

export const HOVER = { 'data-preview': 'hover' } as const
export const FOCUS = { 'data-preview': 'focus' } as const
export const ACTIVE = { 'data-preview': 'active' } as const
export function noop() {
  return undefined
}
/** A frame that contains what the page fixes to the screen, so a sidebar or a page draws inside it. */
export function Boxed({ children, tall }: { children: ReactNode; tall?: true }) {
  return (
    <div
      className={`relative w-full transform-gpu overflow-auto border border-line ${tall ? 'h-96' : 'h-56'}`}
    >
      {children}
    </div>
  )
}

export function entry(
  file: ShowcaseEntry['file'],
  group: ShowcaseGroup,
  when: string,
  typical: ShowcaseEntry['typical'],
  states: ShowcaseEntry['states'] = [],
): ShowcaseEntry {
  const name = (file.split('/').at(-1) ?? file)
    .replace('.tsx', '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  return { file, name, group, when, typical, states }
}
