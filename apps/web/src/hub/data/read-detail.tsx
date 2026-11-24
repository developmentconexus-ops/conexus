import type { CompanyId, DataReadEntry, PersonId } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { QueryBlock } from '../copies/public.ts'
import type { ReadNames } from './text.ts'
import { agentOf, placeOf, resultWord, TEXT, whatOf, whenOf } from './text.ts'

type Opened = { read: DataReadEntry; companyId: CompanyId; viewer: PersonId }

/** The conversation's page, when the screens have one for the read's agent and place. */
function conversationLink({ read, companyId }: Opened): ReactNode {
  const { threadId: conversationId, project } = read
  const className = buttonVariants()
  if (conversationId === null) return null
  if (project === null) {
    if (read.agent !== 'ASSISTANT') return null
    const to = '/companies/$companyId/conversations/$conversationId'
    return (
      <Link className={className} to={to} params={{ companyId, conversationId }}>
        {TEXT.openConversation}
      </Link>
    )
  }
  // A Projeto deleted since took its conversations with it.
  if (project.name === null) return null
  const params = { companyId, projectId: project.id, conversationId }
  switch (read.agent) {
    case 'ASSISTANT':
      return (
        <Link
          className={className}
          to="/companies/$companyId/projects/$projectId/assistant/$conversationId"
          params={params}
        >
          {TEXT.openConversation}
        </Link>
      )
    case 'BUILDER':
      return (
        <Link
          className={className}
          to="/companies/$companyId/projects/$projectId/conversations/$conversationId"
          params={params}
        >
          {TEXT.openConversation}
        </Link>
      )
    case 'CONSTRUTOR':
      return (
        <Link
          className={className}
          to="/companies/$companyId/projects/$projectId/agents/agent-builder/$conversationId"
          params={params}
        >
          {TEXT.openConversation}
        </Link>
      )
    case 'AGENT':
      if (read.agentId === null) return null
      return (
        <Link
          className={className}
          to="/companies/$companyId/projects/$projectId/agents/$agentId/$conversationId"
          params={{ ...params, agentId: read.agentId }}
        >
          {TEXT.openConversation}
        </Link>
      )
    case 'APP':
      return null
    default:
      return read.agent satisfies never
  }
}

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
 * query that named no table), the query, the outcome, the rows and the time; nothing it read. **Abrir a conversa** only for the viewer's own
 * read, since a conversation opens only for its person (decision E4 (a)).
 */
export function ReadDetail(props: Opened & { names: ReadNames }) {
  const { read, names, viewer } = props
  const live = read.verb === 'LIVE'
  return (
    <dl className="flex flex-col gap-lg">
      <Fact term="Quem">{read.person.name}</Fact>
      <Fact term="Agente">{agentOf(read, names)}</Fact>
      {read.threadId !== null && (
        <Fact term="Conversa">
          <span className="flex flex-col items-start gap-sm">
            <span>{placeOf(read.project)}</span>
            {read.person.id === viewer && conversationLink(props)}
          </span>
        </Fact>
      )}
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
