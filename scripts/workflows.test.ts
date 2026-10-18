import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

type Step = {
  name?: string
  uses?: string
  run?: string
  with?: Record<string, unknown>
  env?: Record<string, string>
}
type Job = {
  needs?: string | string[]
  'runs-on': string | string[]
  environment?: string
  outputs?: Record<string, string>
  steps: Step[]
}
type Workflow = { on: Record<string, unknown>; jobs: Record<string, Job> }

const FOLDER = resolve(import.meta.dirname, '../.github/workflows')

function text(name: string): string {
  return readFileSync(resolve(FOLDER, name), 'utf8')
}

function workflow(name: string): Workflow {
  return parse(text(name))
}

// The workflows' own expressions, as GitHub reads them.
const SHA = ['${{', 'github.sha', '}}'].join(' ')
const VERSION = ['${{', 'inputs.version', '}}'].join(' ')
const RECORDED = ['${{', 'needs.record.outputs.reference', '}}'].join(' ')
const publish = workflow('publish.yml')
const rollback = workflow('rollback.yml')
const ci = workflow('ci.yml')

test('o Release publica o Hub depois da imagem, e a borda depois do Hub', () => {
  assert.equal(publish.jobs.deploy?.needs, 'image')
  assert.equal(publish.jobs.edge?.needs, 'deploy')
})

test('a volta acha o registro antes de mexer na borda, e põe a borda de volta antes do Hub', () => {
  assert.equal(rollback.jobs.record?.needs, undefined)
  assert.equal(rollback.jobs.edge?.needs, 'record')
  assert.deepEqual(rollback.jobs.rollback?.needs, ['record', 'edge'])
})

test('a imagem do Release nasce numa máquina nova do GitHub, e o resto roda no runner do servidor', () => {
  assert.equal(publish.jobs.image?.['runs-on'], 'ubuntu-24.04')
  const server = [...Object.entries(publish.jobs), ...Object.entries(rollback.jobs)].filter(
    ([name]) => name !== 'image',
  )
  for (const [name, job] of server) assert.deepEqual(job['runs-on'], ['self-hosted', 'hub'], name)
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
  const record = rollback.jobs.record
  const find = record?.steps.find((step) => step.run?.includes('infra/releases.sh find "$VERSION"'))
  assert.ok(find, 'the record job finds no record')
  assert.equal(
    record?.outputs?.reference,
    ['${{', 'steps.reference.outputs.reference', '}}'].join(' '),
  )
  const deploy = rollback.jobs.rollback?.steps.find(
    (step) => step.run === 'infra/deploy.sh "$REFERENCE"',
  )
  assert.equal(deploy?.env?.REFERENCE, RECORDED)
  for (const job of Object.values(rollback.jobs))
    for (const step of job.steps) assert.doesNotMatch(step.run ?? '', /imagetools/)
})

test('o Release registra o digest depois que o deploy deu certo', () => {
  const steps = publish.jobs.deploy?.steps ?? []
  const deploy = steps.findIndex((step) => step.run === 'infra/deploy.sh "$REFERENCE"')
  const record = steps.findIndex(
    (step) => step.run === 'infra/releases.sh record "$VERSION" "$REFERENCE"',
  )
  assert.ok(deploy >= 0 && record > deploy, `${deploy} ${record}`)
})

test('a CI roda em máquinas do GitHub e não usa segredo, porque um pull request de fora a dispara', () => {
  for (const [name, job] of Object.entries(ci.jobs))
    assert.equal(job['runs-on'], 'ubuntu-24.04', name)
  assert.doesNotMatch(text('ci.yml'), /secrets\./)
})

test('só o Release e o disparo manual chegam ao runner do servidor', () => {
  for (const name of readdirSync(FOLDER)) {
    const file = workflow(name)
    const onServer = Object.values(file.jobs).some((job) =>
      [job['runs-on']].flat().includes('self-hosted'),
    )
    if (!onServer) continue
    for (const event of Object.keys(file.on))
      assert.ok(['release', 'workflow_dispatch'].includes(event), `${name}: ${event}`)
  }
})

test('todo trabalho no runner do servidor passa pelo ambiente production do GitHub', () => {
  for (const name of readdirSync(FOLDER))
    for (const [id, job] of Object.entries(workflow(name).jobs))
      if ([job['runs-on']].flat().includes('self-hosted'))
        assert.equal(job.environment, 'production', `${name}: ${id}`)
})
