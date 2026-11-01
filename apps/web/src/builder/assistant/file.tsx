import type { CompanyId, ConversationId, FailureCode, ShownFile } from '@conexus/hub-api'
import { assistantFilePath, Problem } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { DownloadIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { hubClientFetch, sentenceOfCode } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Markdown } from '../conversation/public.ts'
import { FILE_EMPTY, FILE_MACHINE_GONE, FILE_NOT_THERE, FILE_TOO_LARGE_TEXT } from './text.ts'

type Shown = Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>

/** The images the Hub's CSP lets the page draw from its own address; every other file is saved. */
const DRAWN = ['image/png', 'image/jpeg', 'image/svg+xml']

/** What the Hub said of a file the page could not draw, in the person's words. */
const SAID: Partial<Record<FailureCode, string>> = {
  FILE_NOT_FOUND: FILE_NOT_THERE,
  FILE_GONE: FILE_MACHINE_GONE,
  FILE_TOO_LARGE: FILE_TOO_LARGE_TEXT,
}

/** Reads the route again to learn why the image did not come: the image tag says only that it failed. */
async function whyNot(url: string): Promise<string> {
  const response = await hubClientFetch(url)
  if (response.ok) return sentenceOfCode('INTERNAL_UNEXPECTED')
  try {
    const problem = Problem.parse(await response.json())
    return SAID[problem.code] ?? sentenceOfCode(problem.code)
  } catch {
    // An answer that is not the Hub's problem body names no failure of ours to say.
    return sentenceOfCode('INTERNAL_UNEXPECTED')
  }
}

function Picture(props: { url: string; name: string }) {
  const [state, setState] = useState<'LOADING' | 'DRAWN' | 'FAILED'>('LOADING')
  const [attempt, setAttempt] = useState(0)
  const why = useQuery({
    queryKey: ['assistant', 'file-failure', props.url, attempt],
    queryFn: () => whyNot(props.url),
    enabled: state === 'FAILED',
    retry: false,
  })
  if (state === 'FAILED')
    return (
      <div className="flex flex-col items-start gap-md">
        <p role="alert" className="text-danger">
          {why.data ?? sentenceOfCode('INTERNAL_UNEXPECTED')}
        </p>
        <Button
          onClick={() => {
            setState('LOADING')
            setAttempt(attempt + 1)
          }}
        >
          Tentar de novo
        </Button>
      </div>
    )
  return (
    <>
      {state === 'LOADING' && (
        <div role="status" aria-label="Carregando">
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      <img
        key={attempt}
        src={props.url}
        alt={props.name}
        onLoad={() => setState('DRAWN')}
        onError={() => setState('FAILED')}
        className={cn('max-w-full', state === 'LOADING' && 'hidden')}
      />
    </>
  )
}

function Body(props: { companyId: CompanyId; conversationId: ConversationId; shown: Shown }) {
  const { shown } = props
  if (shown.kind === 'TEXT') {
    if (shown.content === '') return <p className="text-text-2">{FILE_EMPTY}</p>
    return shown.media === 'text/markdown' ? (
      <Markdown text={shown.content} />
    ) : (
      <pre className="whitespace-pre-wrap break-words font-mono text-fact">{shown.content}</pre>
    )
  }
  if (shown.bytes === 0) return <p className="text-text-2">{FILE_EMPTY}</p>
  if (DRAWN.includes(shown.media)) {
    return <Picture url={assistantFilePath({ ...props, path: shown.path })} name={shown.name} />
  }
  return (
    <p className="text-text-2">
      {shown.name} · {shown.media} · {bytesText(shown.bytes)}
    </p>
  )
}

function bytesText(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

/**
 * The file the Assistant showed, beside the chat (web W31's panel in the Prévia's place): a text as
 * Markdown or as plain text, an image drawn from the conversation's file route (same origin,
 * `img-src 'self'`), any other file by its name, size and type. Every file has **Baixar**, a link to
 * the route: the Hub answers it with the headers that keep the browser from running it (S24).
 */
export function FilePanel(props: {
  companyId: CompanyId
  conversationId: ConversationId
  shown: Shown
  onClose?: () => void
}) {
  const { shown } = props
  const url = assistantFilePath({ ...props, path: shown.path })
  return (
    <section aria-label={shown.name} className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="flex items-center justify-between gap-sm border-b border-line px-md py-sm">
        <h2 className="min-w-0 truncate font-medium">{shown.name}</h2>
        <div className="flex shrink-0 items-center gap-xs">
          <a
            href={url}
            download={shown.name}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-xs')}
          >
            <DownloadIcon aria-hidden="true" />
            Baixar
          </a>
          {props.onClose !== undefined && (
            <Button size="icon" variant="ghost" aria-label="Fechar" onClick={props.onClose}>
              <XIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-md">
        <Body companyId={props.companyId} conversationId={props.conversationId} shown={shown} />
      </div>
    </section>
  )
}
