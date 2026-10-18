import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

type Step = { name?: string; uses?: string; run?: string; with?: Record<string, unknown> }
type Workflow = { jobs: Record<string, { needs?: string; steps: Step[] }> }

function workflow(name: string): Workflow {
  return parse(readFileSync(resolve(import.meta.dirname, '../.github/workflows', name), 'utf8'))
}

// The workflows' own expressions, as GitHub reads them.
const SHA = ['${{', 'github.sha', '}}'].join(' ')
const VERSION = ['${{', 'inputs.version', '}}'].join(' ')
const publish = workflow('publish.yml')
const rollback = workflow('rollback.yml')

test('o Release publica o Hub depois da imagem, e a borda depois do Hub', () => {
  assert.equal(publish.jobs.deploy?.needs, 'image')
  assert.equal(publish.jobs.edge?.needs, 'deploy')
})

test('a volta põe a borda de volta antes do Hub', () => {
  assert.equal(rollback.jobs.edge?.needs, undefined)
  assert.equal(rollback.jobs.rollback?.needs, 'edge')
})

test('cada trabalho do Release usa o commit que o gancho conferiu, não a tag', () => {
  const checkouts = Object.values(publish.jobs).flatMap((job) =>
    job.steps.filter((step) => step.uses?.startsWith('actions/checkout@')),
  )
  assert.equal(checkouts.length, 3)
  for (const step of checkouts) assert.equal(step.with?.ref, SHA)
})

test('a volta da borda recusa uma versão fora de main antes do npm ci e do token', () => {
  const steps = rollback.jobs.edge?.steps ?? []
  const tag = steps.findIndex((step) => step.with?.ref === VERSION)
  assert.equal(steps[tag]?.with?.['fetch-depth'], 0)
  const check = steps.findIndex((step) =>
    /^\s*if ! git merge-base --is-ancestor HEAD origin\/main; then\n\s*echo .*\n\s*exit 1\n/m.test(
      step.run ?? '',
    ),
  )
  const install = steps.findIndex((step) => step.uses === './tooling/.github/actions/install')
  const publishEdge = steps.findIndex((step) => step.run === 'tooling/infra/publish-edge.sh')
  assert.ok(tag >= 0 && install >= 0 && publishEdge >= 0)
  assert.ok(tag < check && check < install && install < publishEdge, `${tag} ${check} ${install}`)
})

test('a volta lê o registro do servidor antes do deploy, sem perguntar à GHCR', () => {
  const steps = rollback.jobs.rollback?.steps ?? []
  const find = steps.findIndex((step) => step.run?.includes('infra/releases.sh find "$VERSION"'))
  const deploy = steps.findIndex((step) => step.run === 'infra/deploy.sh "$REFERENCE"')
  assert.ok(find >= 0 && deploy >= 0 && find < deploy, `${find} ${deploy}`)
  for (const step of steps) assert.doesNotMatch(step.run ?? '', /imagetools/)
})

test('o Release registra o digest depois que o deploy deu certo', () => {
  const steps = publish.jobs.deploy?.steps ?? []
  const deploy = steps.findIndex((step) => step.run === 'infra/deploy.sh "$REFERENCE"')
  const record = steps.findIndex(
    (step) => step.run === 'infra/releases.sh record "$VERSION" "$REFERENCE"',
  )
  assert.ok(deploy >= 0 && record > deploy, `${deploy} ${record}`)
})
