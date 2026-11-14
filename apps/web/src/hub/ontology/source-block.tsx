import type { ConceptPage } from '@conexus/hub-api'
import { CodeBlock, CodeBlockContent, CodeBlockLine } from '../../ui/code-block.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { plural, SEE_QUERY, SOURCE_GONE, when } from './text.ts'

/** A query behind **Ver a consulta**, in mono, scrolling inside its box. */
export function Query({ sql }: { sql: string }) {
  return (
    <Collapsible className="flex flex-col gap-xs">
      <CollapsibleTrigger className="w-fit text-text-2 underline">{SEE_QUERY}</CollapsibleTrigger>
      <CollapsibleContent>
        <CodeBlock>
          <CodeBlockContent>
            {[...sql.split('\n').entries()].map(([at, line]) => (
              <CodeBlockLine key={at}>{line}</CodeBlockLine>
            ))}
          </CodeBlockContent>
        </CodeBlock>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Where a concept is read from: the connection by its name, the query and what its proof counted. */
export function SourceBlock({ page }: { page: ConceptPage }) {
  const { source } = page
  if (source === null) return null
  return (
    <div className="flex flex-col gap-xs">
      <p className="break-words">
        <span className="text-text-2">Lido de </span>
        {source.connectionName ?? SOURCE_GONE}
      </p>
      <Query sql={source.sql} />
      {source.proof !== null && (
        <p className="text-text-2 tabular-nums">
          {`Prova: ${plural(source.proof.rows, 'linha', 'linhas')} em ${when(source.proof.ranAt)}`}
        </p>
      )}
    </div>
  )
}
