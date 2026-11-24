import { CodeBlock, CodeBlockContent, CodeBlockLine } from '../../ui/code-block.tsx'

export function QueryBlock({ query }: { query: string }) {
  return (
    <CodeBlock>
      <CodeBlockContent>
        {query
          .split('\n')
          .map((text, number) => ({ number, text }))
          .map((line) => (
            <CodeBlockLine key={line.number}>{line.text}</CodeBlockLine>
          ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}
