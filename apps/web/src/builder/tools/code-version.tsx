import type { ToolVersionDetail } from '@conexus/hub-api'
import { Badge } from '../../ui/badge.tsx'
import { CodeBlock, CodeBlockContent, CodeBlockLine } from '../../ui/code-block.tsx'
import { IN_CODE, readNames, testText } from './text.ts'

type CodeVersionDetail = Extract<ToolVersionDetail, { kind: 'CODE' }>

/** The mark of a tool the Construtor wrote in code, in the list and on the tool's page. */
export function CodeBadge() {
  return <Badge className="ml-sm align-middle">{IN_CODE}</Badge>
}

/** A version of a tool in code (step 24.4): what it reads, the code the Construtor wrote and the test that passed. */
export function CodeVersion(props: {
  connection: string
  labels: Record<string, string>
  version: CodeVersionDetail
}) {
  const { version } = props
  return (
    <>
      <span className="text-fact text-text-2">
        Lê: {props.connection} · {readNames(version.reads, props.labels)}
      </span>
      <CodeBlock>
        <CodeBlockContent>
          {[...version.source.split('\n').entries()].map(([at, line]) => (
            <CodeBlockLine key={at}>{line}</CodeBlockLine>
          ))}
        </CodeBlockContent>
      </CodeBlock>
      <span className="text-fact text-text-2">{testText(version.test)}</span>
    </>
  )
}
