import type { DataReadEntry } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { QueryBlock } from '../copies/public.ts'
import type { ReadNames } from './text.ts'
import { agentOf, placeOf, resultWord, whatOf, whenOf } from './text.ts'

type Copied = 'IDLE' | 'DONE' | 'FAILED'

/** The query whole, and the button that copies it. */
function Query({ sql }: { sql: string }) {
  const [copied, setCopied] = useState<Copied>('IDLE')
  async function copy() {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied('DONE')
    } catch (cause) {
      console.error('READ_QUERY_NOT_COPIED', cause)
      setCopied('FAILED')
    }
  }
  return (
    <div className="flex min-w-0 flex-col gap-sm">
      <QueryBlock query={sql} />
      <div className="flex flex-wrap items-center gap-sm">
        <Button size="sm" onClick={() => void copy()}>
          {copied === 'DONE' ? 'Consulta copiada' : 'Copiar a consulta'}
        </Button>
        {copied === 'FAILED' && (
          <p className="text-fact text-text-2">
            Não deu para copiar. Selecione a consulta e copie.
          </p>
        )}
      </div>
    </div>
  )
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <dt className="text-label text-text-2">{term}</dt>
      <dd className="min-w-0 wrap-anywhere">{children}</dd>
    </div>
  )
}

/** The title of an open read (founder, P8). */
export function readTitle(read: DataReadEntry, now: Date): string {
  return `Leitura de ${whenOf(read.at, now)}`
}

/**
 * One read opened (`p4-05`): who, the agent, the conversation, the tables or the operation (none for a
 * query that named no table), the query, the outcome, the rows and the time; nothing it read.
 */
export function ReadDetail(props: { read: DataReadEntry; names: ReadNames }) {
  const { read, names } = props
  const live = read.verb === 'LIVE'
  return (
    <dl className="flex flex-col gap-lg">
      <Fact term="Quem">{read.person.name}</Fact>
      <Fact term="Agente">{agentOf(read)}</Fact>
      {read.threadId !== null && <Fact term="Conversa">{placeOf(read.project)}</Fact>}
      {read.threadId === null && read.project !== null && (
        <Fact term="Projeto">{placeOf(read.project)}</Fact>
      )}
      {(live || read.tables.length > 0) && (
        <Fact term={live ? 'Operação' : 'Tabelas'}>
          <span className={live ? undefined : 'font-mono'}>{whatOf(read, names)}</span>
        </Fact>
      )}
      {read.query !== null && (
        <Fact term="Consulta">
          <Query sql={read.query} />
        </Fact>
      )}
      <Fact term="Resultado">
        <span title={read.outcome}>{resultWord(read.outcome)}</span>
      </Fact>
      <Fact term="Linhas">{read.rows === null ? '–' : read.rows.toLocaleString('pt-BR')}</Fact>
      <Fact term="Tempo">{`${read.ms.toLocaleString('pt-BR')} ms`}</Fact>
    </dl>
  )
}
