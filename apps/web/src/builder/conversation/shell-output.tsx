import type { MessagePart } from '@conexus/hub-api'

type Shell = Extract<MessagePart, { type: 'shell' }>

/** The last lines a command printed, and how it ended when it did not end well. */
export function ShellOutput({ part }: { part: Shell }) {
  const failed = part.exitCode !== null && part.exitCode !== 0
  return (
    <figure className="flex min-w-0 flex-col gap-xs">
      <pre className="max-h-64 overflow-auto rounded-control bg-surface-3 p-sm font-mono text-fact text-text-2">
        {part.lines.join('\n')}
      </pre>
      {failed && (
        <figcaption className="text-danger text-fact">
          O comando terminou com o código {part.exitCode}.
        </figcaption>
      )}
    </figure>
  )
}
