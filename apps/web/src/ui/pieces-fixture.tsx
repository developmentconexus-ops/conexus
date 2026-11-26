import '../brand/tokens.css'
import { CSPProvider } from '@base-ui/react/csp-provider'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { ConexusMark } from '../brand/mark.tsx'
import type { ShowcaseEntry, ShowcaseGroup } from './showcase/types.ts'
import { SHOWCASE } from './showcase.ts'
import { TooltipProvider } from './tooltip.tsx'

// Every piece of ui/ on one page, in each state and in both themes, served only to the layout tests,
// which watch it under the Hub's CSP (web W22, testing T23) and never built into the product.
const GROUPS = [...new Set(SHOWCASE.map((entry) => entry.group))]

function Body({ entry }: { entry: ShowcaseEntry }) {
  return (
    <div className="flex flex-col gap-lg p-lg">
      {entry.typical()}
      <div className="flex flex-col gap-lg md:flex-row md:flex-wrap md:items-start">
        {entry.states.map(([state, render]) => (
          <figure key={state} className="flex min-w-0 flex-col gap-xs">
            <figcaption className="font-mono text-eyebrow text-text-2">{state}</figcaption>
            {render()}
          </figure>
        ))}
      </div>
    </div>
  )
}

function Block({ entry }: { entry: ShowcaseEntry }) {
  return (
    <article data-file={entry.file} className="flex flex-col gap-sm border-b border-line pb-xl">
      <h3 className="font-display text-title">{entry.name}</h3>
      <p className="text-text-2">{entry.when}</p>
      <div data-band="light" className="scheme-light bg-surface">
        <Body entry={entry} />
      </div>
      <div data-band="dark" data-theme="dark" className="scheme-dark bg-surface text-text">
        <Body entry={entry} />
      </div>
    </article>
  )
}

function Group({ group }: { group: ShowcaseGroup }) {
  return (
    <section id={group} className="flex flex-col gap-xl">
      <h2 className="font-display text-title">{group}</h2>
      {SHOWCASE.filter((entry) => entry.group === group).map((entry) => (
        <Block key={entry.file} entry={entry} />
      ))}
    </section>
  )
}

function Pieces() {
  return (
    <TooltipProvider>
      <main className="mx-auto flex w-full max-w-page flex-col gap-3xl p-lg">
        <header className="flex flex-col gap-md">
          <ConexusMark working size={48} />
          <h1 className="font-display text-title">Peças</h1>
          <nav aria-label="Grupos" className="flex flex-wrap gap-md">
            {GROUPS.map((group) => (
              <a key={group} href={`#${group}`} className="text-label underline">
                {group}
              </a>
            ))}
          </nav>
        </header>
        {GROUPS.map((group) => (
          <Group key={group} group={group} />
        ))}
      </main>
    </TooltipProvider>
  )
}

const router = createRouter({
  routeTree: createRootRoute({ component: Pieces }),
  history: createMemoryHistory({ initialEntries: ['/'] }),
})

const root = document.getElementById('root')
if (root !== null) {
  createRoot(root).render(
    <CSPProvider disableStyleElements>
      <RouterProvider router={router} />
    </CSPProvider>,
  )
}
