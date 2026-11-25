import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CheckReport } from '@conexus/app/check'
import { STEP_NAMES } from '@conexus/app/check'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { title } from '../../harness/routes/test-conversation.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import type { BuilderCheck } from './runs/context.ts'

export const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const
export const CHECK = { type: 'tool_use', name: 'conexus_check', input: {} } as const
export const FIX = {
  type: 'tool_use',
  name: 'mastra_workspace_execute_command',
  input: { description: 'Rodando um teste', command: 'echo y >> a.ts' },
} as const

export const PASSED: CheckReport = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}
/** `tipos` refuses a handler's answer; the steps after it are skipped. */
export const FAILED: CheckReport = {
  ok: false,
  steps: STEP_NAMES.map((name, at) => {
    if (at < 2) return { name, state: 'passed', problems: [] }
    if (at > 2) return { name, state: 'skipped', problems: [] }
    const problem = { file: 'server/handlers.ts', line: 13, column: 5, code: 'TS2322' }
    return { name, state: 'failed', problems: [{ ...problem, message: 'Type mismatch.' }] }
  }),
}

/** What the machine's check does on each call, in order; past the plan, it passes. */
export type Plan = (CheckReport | 'platform')[]

/**
 * The machine's check program, a script of the test's: the n-th call prints the n-th report of
 * the plan, or exits 2 as the program does when the machine fails it (Chromium absent, a step past
 * its minute). `calls` counts how many times it ran.
 */
export function checking(folder: string, plan: Plan) {
  mkdirSync(folder, { recursive: true })
  for (const [at, step] of plan.entries()) {
    const file = join(folder, `check-${at + 1}`)
    writeFileSync(file, step === 'platform' ? '' : JSON.stringify(step))
  }
  writeFileSync(join(folder, 'check-passed'), JSON.stringify(PASSED))
  const program = join(folder, 'check')
  writeFileSync(
    program,
    [
      '#!/bin/sh',
      `n=$(( $(cat '${folder}/check-count' 2>/dev/null || echo 0) + 1 ))`,
      `echo $n > '${folder}/check-count'`,
      `report='${folder}/check-'$n; [ -f "$report" ] || report='${folder}/check-passed'`,
      '[ -s "$report" ] || exit 2',
      'cat "$report"',
    ].join('\n'),
  )
  chmodSync(program, 0o755)
  function calls(): number {
    const count = join(folder, 'check-count')
    return existsSync(count) ? Number(readFileSync(count, 'utf8')) : 0
  }
  return { calls }
}

export type Blocks = Extract<Reply, { kind: 'blocks' }>['blocks']

/**
 * The model's turn: the first step's blocks, then text each time it is asked again; given a `fix`,
 * it answers each failed end of the turn with those blocks before it ends again.
 */
export function turnOf(blocks: Blocks, fix?: Blocks) {
  const asked: Sent[] = []
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    asked.push(call)
    if (asked.length === 1 && blocks.length > 0) return { kind: 'blocks', blocks }
    const told = reportsIn(call).length > 0 && asked.length % 2 === 1
    if (fix !== undefined && told) return { kind: 'blocks', blocks: fix }
    return { kind: 'text', text: 'Pronto.' }
  }
  return { asked, answer }
}

const TOLD_AS = 'as conexus_check returns it: '

/** The check in one text the model read: a tool's result, or the words of a failed end of the turn. */
function checkIn(text: string): BuilderCheck[] {
  if (text.startsWith('{"') && text.includes('"machine"')) return [JSON.parse(text)]
  const at = text.indexOf(TOLD_AS)
  if (at < 0) return []
  return [JSON.parse(text.slice(at + TOLD_AS.length, text.lastIndexOf('}') + 1))]
}

/** The checks the model read in one call, in order. */
export function checksIn(call: Sent | undefined): BuilderCheck[] {
  return (call?.texts ?? []).flatMap(checkIn)
}

/** The machine's reports in `checksIn`. */
export function reportsIn(call: Sent | undefined): CheckReport[] {
  return checksIn(call).map(({ machine }) => machine)
}

type Invocation = Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']

/** The `conexus_check` calls of a turn, each as its last `tool-invocation` part says it. */
export function checkCalls(parts: MastraMessagePart[]): Invocation[] {
  const last = new Map<string, Invocation>()
  for (const part of parts) {
    if (part.type === 'tool-invocation' && part.toolInvocation.toolName === 'conexus_check') {
      last.set(part.toolInvocation.toolCallId, part.toolInvocation)
    }
  }
  return [...last.values()]
}
