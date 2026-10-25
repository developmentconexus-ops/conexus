import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import type { CheckReport } from '@conexus/app/check'
import { STEP_NAMES } from '@conexus/app/check'
import { PreviewData } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { folder } from '../../hub/apps/test-versions.ts'
import type { Anthropic, Reply, Sent } from '../../platform/test-anthropic.ts'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { conversing, title } from './test-conversation.ts'

const PASSED: CheckReport = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}
const FAILED: CheckReport = {
  ok: false,
  steps: STEP_NAMES.map((name, at) => {
    if (at === 0) {
      const problem = { file: 'server/handlers.ts', line: 1, column: 1, code: 'TS2322' }
      return { name, state: 'failed', problems: [{ ...problem, message: 'Type mismatch.' }] }
    }
    return { name, state: 'skipped', problems: [] }
  }),
}

/**
 * What the end of the turn's check does each time: passes and leaves the version where the
 * template's check leaves it (`node_modules/.conexus/version`), passes and leaves a link there in
 * its place, fails, or cannot run (exit 2).
 */
export type Checked = 'passed' | 'linked' | 'failed' | 'platform'

/**
 * The machine's check program of the test Hub (`testBuilderPorts`): the n-th call does the n-th of
 * `plan`, and passes past it. The version it leaves is the small Recados of the Versões tab's tests.
 */
export function checking(machineFolder: string, plan: readonly Checked[]) {
  const version = join(machineFolder, 'built-version')
  const sent = folder()
  mkdirSync(version, { recursive: true })
  for (const file of sent.files) {
    const path = join(version, file.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, Buffer.from(file.base64, 'base64'))
  }
  writeFileSync(join(version, 'manifest.json'), JSON.stringify(sent.manifest))
  writeFileSync(join(machineFolder, 'check-plan'), plan.join('\n'))
  writeFileSync(join(machineFolder, 'check-passed.json'), JSON.stringify(PASSED))
  writeFileSync(join(machineFolder, 'check-failed.json'), JSON.stringify(FAILED))
  const count = join(machineFolder, 'check-count')
  const program = join(machineFolder, 'check')
  writeFileSync(
    program,
    [
      '#!/bin/sh',
      // Called as `check --root <app folder>`.
      'out="$2/node_modules/.conexus/version"',
      `n=$(( $(cat '${count}' 2>/dev/null || echo 0) + 1 ))`,
      `echo $n > '${count}'`,
      `step=$(sed -n "\${n}p" '${machineFolder}/check-plan')`,
      '[ "$step" = platform ] && exit 2',
      `[ "$step" = failed ] && exec cat '${machineFolder}/check-failed.json'`,
      'rm -rf "$out" && mkdir -p "$(dirname "$out")"',
      `if [ "$step" = linked ]; then ln -s '${version}' "$out"; else cp -r '${version}' "$out"; fi`,
      `cat '${machineFolder}/check-passed.json'`,
    ].join('\n'),
  )
  chmodSync(program, 0o755)
  return { calls: () => (existsSync(count) ? Number(readFileSync(count, 'utf8')) : 0) }
}

const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const

/** A model that writes a file in its first step and answers after; `asked` keeps its calls. */
export function writing(): { asked: Sent[]; answer: Anthropic['answer'] } {
  const asked: Sent[] = []
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    asked.push(call)
    if (asked.length === 1) return { kind: 'blocks', blocks: [WRITE] }
    return { kind: 'text', text: 'Pronto.' }
  }
  return { asked, answer }
}

/**
 * `conversing`, with the Projeto's company database on the test server as Neon would give it, so
 * a turn's version can go to the app, and the check's `plan`.
 */
export async function previewing(
  t: TestContext,
  plan: readonly Checked[] = ['passed'],
  answer: Anthropic['answer'] = writing().answer,
) {
  const subject = await conversing(t, answer)
  const { hub, companyId, projectId } = subject
  const [neonProject] = hub.neon.projects()
  if (neonProject === undefined) throw new Error('no company database')
  hub.neon.ownedBy(neonProject.id, await createCompanyDatabase(t))
  const check = checking(hub.builder.folder, plan)
  const project = `/api/companies/${companyId}/projects/${projectId}`
  return { ...subject, check, project, versions: `${project}/versions` }
}

/** What each `data-conexus-preview` part says, in order. */
export function previewsIn(parts: MastraMessagePart[]): PreviewData[] {
  return parts.flatMap((part) =>
    part.type === 'data-conexus-preview' ? [PreviewData.parse(part.data)] : [],
  )
}
