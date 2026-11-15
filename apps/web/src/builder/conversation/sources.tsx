import type { MessageSource } from './sources.ts'

/** Where a model's answer found what it says: each page's title and domain, under the message. */
export function Sources({ sources }: { sources: readonly MessageSource[] }) {
  return (
    <section
      aria-label="Fontes"
      className="flex min-w-0 flex-col gap-xs px-md text-fact text-text-2"
    >
      <h3 className="font-semibold text-text">Fontes</h3>
      <ul className="m-0 flex min-w-0 list-none flex-col gap-xs p-0">
        {sources.map((source) => (
          <li key={source.url} className="flex min-w-0 flex-wrap gap-x-sm">
            <span className="min-w-0 break-words">
              {source.linked ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text underline underline-offset-2"
                >
                  {source.title ?? source.url}
                </a>
              ) : (
                source.title
              )}
            </span>
            {source.domain !== '' && <span className="min-w-0 break-all">{source.domain}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
