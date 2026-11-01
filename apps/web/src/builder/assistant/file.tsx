import type { CompanyId, ConversationId, ShownFile } from '@conexus/hub-api'
import { assistantFilePath, Problem } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { DownloadIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { hubClientFetch, sentenceOfCode } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Markdown } from '../conversation/public.ts'
import { FILE_EMPTY } from './text.ts'

type Shown = Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>

/** The images the Hub's CSP lets the page draw from its own address; every other file is saved. */
const DRAWN = ['image/png', 'image/jpeg', 'image/svg+xml']

/** The Hub's refusal of the file route, in the person's words. */
async function refusalOf(response: Response): Promise<string> {
  try {
    const problem = Problem.parse(await response.json())
    return sentenceOfCode(problem.code)
  } catch {
    // An answer that is not the Hub's problem body names no failure of ours to say.
    return sentenceOfCode('INTERNAL_UNEXPECTED')
  }
}

/** Reads the route again to learn why the image did not come: the image tag says only that it failed. */
async function whyNot(url: string): Promise<string> {
  const response = await hubClientFetch(url)
  return response.ok ? sentenceOfCode('INTERNAL_UNEXPECTED') : refusalOf(response)
}

/**
 * Saves the file the route answers (web W9: the Hub's own fetch, so a refusal is read, not left to
 * the browser's download manager): the bytes become a blob that an `<a download>` saves. Answers
 * the refusal's sentence, or nothing once saved.
 */
async function save(file: { url: string; name: string }): Promise<string | undefined> {
  const response = await hubClientFetch(file.url)
  if (!response.ok) return refusalOf(response)
  const href = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = href
  link.download = file.name
  link.click()
  URL.revokeObjectURL(href)
  return undefined
}

function Picture(props: { url: string; name: string }) {
  const [state, setState] = useState<'LOADING' | 'DRAWN' | 'FAILED'>('LOADING')
  const [attempt, setAttempt] = useState(0)
  const why = useMutation({ mutationFn: whyNot, meta: { keepCache: true } })
  if (state === 'FAILED')
    return (
      <ReadFailure
        text={why.data ?? sentenceOfCode('INTERNAL_UNEXPECTED')}
        onRetry={() => {
          setState('LOADING')
          setAttempt(attempt + 1)
          why.reset()
        }}
      />
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
        onError={() => {
          setState('FAILED')
          why.mutate(props.url)
        }}
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
 * `img-src 'self'`), any other file by its name, size and type. Every file has **Baixar**, which
 * reads the route with the Hub's fetch and saves the bytes, or says why it could not; the Hub
 * answers the route with the headers that keep the browser from running it (S24).
 */
export function FilePanel(props: {
  companyId: CompanyId
  conversationId: ConversationId
  shown: Shown
  onClose?: () => void
}) {
  const { shown } = props
  const url = assistantFilePath({ ...props, path: shown.path })
  const download = useMutation({ mutationFn: save, meta: { keepCache: true } })
  const refusal =
    download.data ?? (download.isError ? sentenceOfCode('INTERNAL_UNEXPECTED') : undefined)
  return (
    <section aria-label={shown.name} className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="flex items-center justify-between gap-sm border-b border-line px-md py-sm">
        <h2 className="min-w-0 truncate font-medium">{shown.name}</h2>
        <div className="flex shrink-0 items-center gap-xs">
          <Button
            size="sm"
            className="gap-xs"
            disabled={download.isPending}
            onClick={() => download.mutate({ url, name: shown.name })}
          >
            <DownloadIcon aria-hidden="true" />
            Baixar
          </Button>
          {props.onClose !== undefined && (
            <Button size="icon" variant="ghost" aria-label="Fechar" onClick={props.onClose}>
              <XIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-md overflow-auto p-md">
        {refusal !== undefined && (
          <ReadFailure text={refusal} onRetry={() => download.mutate({ url, name: shown.name })} />
        )}
        <Body companyId={props.companyId} conversationId={props.conversationId} shown={shown} />
      </div>
    </section>
  )
}
