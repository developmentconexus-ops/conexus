import type { ProjectSource } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { FileIcon, FolderTreeIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '../../ui/code-block.tsx'
import { Sheet, SheetContent } from '../../ui/sheet.tsx'
import { Empty, Loading, ReadFailure } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { FileTree, firstShown, treeOf } from './file-tree.tsx'
import type { Token } from './highlight.ts'
import { highlighted } from './highlight.ts'
import { fileQuery, sourceQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

function Code(props: { path: string; text: string }) {
  const { path, text } = props
  const [painted, setPainted] = useState<{ path: string; text: string; lines: Token[][] }>()
  useEffect(() => {
    let current = true
    void highlighted(path, text).then(
      (lines) => current && lines && setPainted({ path, text, lines }),
    )
    return () => {
      current = false
    }
  }, [path, text])
  const lines =
    painted?.path === path && painted.text === text
      ? painted.lines
      : text
          .replace(/\n$/, '')
          .split('\n')
          .map((line) => [{ text: line, className: '' }])
  return (
    <CodeBlockContent>
      {[...lines.entries()].map(([at, tokens]) => (
        <CodeBlockLine key={at}>
          {[...tokens.entries()].map(([from, token]) => (
            <span key={from} className={token.className || undefined}>
              {token.text}
            </span>
          ))}
        </CodeBlockLine>
      ))}
    </CodeBlockContent>
  )
}

function FileText(props: { commit: string; path: string }) {
  const { companyId, projectId } = route.useParams()
  const text = useQuery({ ...fileQuery({ companyId, projectId, ...props }), retry: false })
  if (text.isPending) return <Loading />
  if (text.isError) return <p role="alert">{sentenceOf(text.error)}</p>
  return (
    <CodeBlock aria-label={`Conteúdo de ${props.path}`} role="region" className="min-h-0">
      <CodeBlockHeader>
        <FileIcon aria-hidden="true" className="size-4 shrink-0" />
        <CodeBlockTitle>{props.path}</CodeBlockTitle>
      </CodeBlockHeader>
      <Code path={props.path} text={text.data.text} />
    </CodeBlock>
  )
}

function Files(props: { source: ProjectSource; commit: string }) {
  const { source, commit } = props
  const phone = useIsMobile()
  const [chosen, setChosen] = useState<string>()
  const [listing, setListing] = useState(false)
  const nodes = treeOf(source.files.map((file) => file.path))
  if (source.files.length === 0) return <Empty>Este app ainda está vazio</Empty>
  const path = source.files.some((file) => file.path === chosen)
    ? chosen
    : (firstShown(nodes) ?? source.files[0]?.path)
  const tree = (
    <FileTree
      nodes={nodes}
      chosen={path}
      onChoose={(next) => {
        setChosen(next)
        setListing(false)
      }}
    />
  )
  if (phone) {
    return (
      <div className="flex min-h-0 flex-col gap-md">
        <div className="flex items-center gap-sm">
          <Button onClick={() => setListing(true)}>
            <FolderTreeIcon aria-hidden="true" />
            Arquivos
          </Button>
          <span className="min-w-0 break-all font-mono text-fact">{path}</span>
        </div>
        <Sheet open={listing} onOpenChange={setListing}>
          <SheetContent title="Arquivos do app" closeLabel="Fechar arquivos">
            <div className="min-h-0 overflow-y-auto">{tree}</div>
          </SheetContent>
        </Sheet>
        {path !== undefined && <FileText commit={commit} path={path} />}
      </div>
    )
  }
  return (
    <div className="grid min-h-0 items-start gap-md md:grid-cols-[16rem_1fr]">
      <div className="sticky top-0 max-h-[calc(100dvh-10rem)] overflow-auto">{tree}</div>
      {path !== undefined && <FileText commit={commit} path={path} />}
    </div>
  )
}

/**
 * The Código tab: the files of the Projeto's current version, read from the Hub's own Git, one at
 * a time. It reads again when the stream says a version was saved.
 */
export function Source() {
  const { companyId, projectId } = route.useParams()
  const read = useQuery(sourceQuery(companyId, projectId))
  if (read.isPending) return <Loading />
  if (read.isError) {
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  const source = read.data
  const { commit, savedAt } = source
  if (commit === null || savedAt === null) {
    return <Empty>Nenhuma versão guardada ainda. Peça um app na Conversa.</Empty>
  }
  return (
    <div className="flex flex-col gap-md">
      <p className="text-text-2">
        Versão {source.version}, guardada em {dayAndHour(savedAt)}
      </p>
      <Files source={source} commit={commit} />
    </div>
  )
}
