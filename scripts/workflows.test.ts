import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

type Step = {
  id?: string
  name?: string
  uses?: string
  run?: string
  with?: Record<string, unknown>
  env?: Record<string, string>
}
type Job = {
  if?: string
  needs?: string | string[]
  permissions?: Record<string, string>
  'runs-on': unknown
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
const RECORDED_TEMPLATE = ['${{', 'needs.record.outputs.template', '}}'].join(' ')
const BUILT_TEMPLATE = ['${{', 'needs.template.outputs.template', '}}'].join(' ')
const publish = workflow('publish.yml')
const rollback = workflow('rollback.yml')
const ci = workflow('ci.yml')

/** Only a GitHub-hosted machine is not the server: a label list, a group or a bare label may reach it. */
function onServer(job: Job): boolean {
  const labels = job['runs-on']
  return !(typeof labels === 'string' && labels.startsWith('ubuntu-'))
}

test('o Release publica o Hub depois da imagem e do template, e a borda depois do Hub', () => {
  assert.deepEqual(publish.jobs.deploy?.needs, ['image', 'template'])
  assert.equal(publish.jobs.edge?.needs, 'deploy')
})

test('os zips do Recados saem de uma máquina nova do GitHub, depois da imagem conferir main', () => {
  assert.equal(publish.jobs.apps?.needs, 'image')
  assert.equal(publish.jobs.apps?.['runs-on'], 'ubuntu-24.04')
  assert.equal(publish.jobs['apps-release']?.needs, 'apps')
  assert.equal(publish.jobs['apps-release']?.['runs-on'], 'ubuntu-24.04')
})

test('nenhum trabalho que instala dependências tem um token que escreve no repositório', () => {
  for (const workflow of [publish, rollback, ci]) {
    for (const [name, job] of Object.entries(workflow.jobs)) {
      if (job.permissions?.contents !== 'write') continue
      const installs = job.steps.filter(
        (step) =>
          step.uses?.startsWith('actions/checkout@') ||
          step.uses === './.github/actions/install' ||
          /\bnpm\b/.test(step.run ?? ''),
      )
      assert.deepEqual(installs, [], name)
    }
  }
})

test('a volta acha o registro antes de mexer na borda, e põe a borda de volta antes do Hub', () => {
  assert.equal(rollback.jobs.record?.needs, undefined)
  assert.equal(rollback.jobs.edge?.needs, 'record')
  assert.deepEqual(rollback.jobs.rollback?.needs, ['record', 'edge'])
})

test('a imagem do Release nasce numa máquina nova do GitHub, e o resto roda no runner do servidor', () => {
  assert.equal(publish.jobs.image?.['runs-on'], 'ubuntu-24.04')
  const server = [...Object.entries(publish.jobs), ...Object.entries(rollback.jobs)].filter(
    ([name]) => !['image', 'template', 'apps', 'apps-release'].includes(name),
  )
  for (const [name, job] of server) assert.deepEqual(job['runs-on'], ['self-hosted', 'hub'], name)
})

test('cada trabalho do Release usa o commit que o gancho conferiu, não a tag', () => {
  const checkouts = Object.values(publish.jobs).flatMap((job) =>
    job.steps.filter((step) => step.uses?.startsWith('actions/checkout@')),
  )
  assert.equal(checkouts.length, 5)
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
    (step) => step.run === 'infra/deploy.sh "$REFERENCE" "$TEMPLATE"',
  )
  assert.equal(deploy?.env?.REFERENCE, RECORDED)
  assert.equal(deploy?.env?.TEMPLATE, RECORDED_TEMPLATE)
  assert.equal(
    record?.outputs?.template,
    ['${{', 'steps.reference.outputs.template', '}}'].join(' '),
  )
  assert.match(find?.run ?? '', /read -r reference template <<< "\$found"/)
  for (const job of Object.values(rollback.jobs))
    for (const step of job.steps) assert.doesNotMatch(step.run ?? '', /imagetools/)
})

test('o Release sobe e registra o digest com o template do mesmo commit, o registro depois do deploy', () => {
  const steps = publish.jobs.deploy?.steps ?? []
  const deploy = steps.findIndex((step) => step.run === 'infra/deploy.sh "$REFERENCE" "$TEMPLATE"')
  const record = steps.findIndex(
    (step) => step.run === 'infra/releases.sh record "$VERSION" "$REFERENCE" "$TEMPLATE"',
  )
  assert.ok(deploy >= 0 && record > deploy, `${deploy} ${record}`)
  for (const at of [deploy, record]) assert.equal(steps[at]?.env?.TEMPLATE, BUILT_TEMPLATE)
})

test('o template nasce do commit do Release numa máquina nova do GitHub, depois da imagem conferir main', () => {
  const job = publish.jobs.template
  assert.equal(job?.needs, 'image')
  assert.equal(job?.['runs-on'], 'ubuntu-24.04')
  assert.deepEqual(job?.permissions, { contents: 'read' })
  assert.equal(job?.outputs?.template, ['${{', 'steps.build.outputs.template', '}}'].join(' '))
  const build = job?.steps.find((step) => step.id === 'build')
  assert.match(build?.run ?? '', /node infra\/e2b\/template\.ts/)
  assert.match(build?.run ?? '', /\^HUB_E2B_TEMPLATE=\(conexus-builder:\[0-9a-f\]\{7,40\}\)\$/)
})

test('a chave da E2B vem só do segredo do GitHub e só ao passo do build, nunca ecoada', () => {
  const key = ['${{', 'secrets.E2B_API_KEY', '}}'].join(' ')
  for (const [file, workflow] of Object.entries({ publish, rollback, ci })) {
    for (const [name, job] of Object.entries(workflow.jobs)) {
      for (const step of job.steps) {
        const holds = JSON.stringify(step).includes('E2B_API_KEY')
        const isBuild = file === 'publish' && name === 'template' && step.id === 'build'
        assert.equal(holds, isBuild, `${file}: ${name}: ${step.id ?? step.name ?? step.uses}`)
      }
    }
  }
  const build = publish.jobs.template?.steps.find((step) => step.id === 'build')
  assert.deepEqual(build?.env, { E2B_API_KEY: key })
  assert.doesNotMatch(build?.run ?? '', /E2B_API_KEY/)
})

test('reiniciar o Hub mantém o template no ar, ou experimenta o que a pessoa der', () => {
  const restart = workflow('restart.yml')
  const step = restart.jobs.restart?.steps.find((step) => step.run?.includes('infra/deploy.sh'))
  assert.equal(step?.run, 'infra/deploy.sh --restart "$TEMPLATE"')
  assert.equal(step?.env?.TEMPLATE, ['${{', 'inputs.template', '}}'].join(' '))
})

test('a CI roda em máquinas do GitHub e não usa segredo, porque um pull request de fora a dispara', () => {
  for (const [name, job] of Object.entries(ci.jobs))
    assert.equal(job['runs-on'], 'ubuntu-24.04', name)
  assert.doesNotMatch(text('ci.yml'), /\bsecrets\b/)
})

test('só o Release e o disparo manual chegam ao runner do servidor', () => {
  for (const name of readdirSync(FOLDER)) {
    const file = workflow(name)
    if (!Object.values(file.jobs).some(onServer)) continue
    for (const event of Object.keys(file.on))
      assert.ok(['release', 'workflow_dispatch'].includes(event), `${name}: ${event}`)
  }
})

test('todo trabalho no runner do servidor passa pelo ambiente production do GitHub', () => {
  for (const name of readdirSync(FOLDER))
    for (const [id, job] of Object.entries(workflow(name).jobs))
      if (onServer(job)) assert.equal(job.environment, 'production', `${name}: ${id}`)
})

test('o agregador espera todos os trabalhos da CI, e sem linha de remoção a prova é o plano, não um pulo', () => {
  const others = Object.keys(ci.jobs).filter((name) => name !== 'ci')
  assert.deepEqual([ci.jobs.ci?.needs].flat().toSorted(), others.toSorted())
  const results = ci.jobs.ci?.steps[0]?.env?.RESULTS ?? ''
  for (const name of others.filter((name) => name !== 'removals')) {
    assert.ok(results.includes(`needs.${name}.result`), name)
  }
  assert.match(
    results,
    /needs\.removals\.result == 'skipped' && needs\.removals-plan\.result == 'success' && needs\.removals-plan\.outputs\.selected == '0' && 'success' \|\| needs\.removals\.result/,
  )
  assert.equal(ci.jobs.removals?.needs, 'removals-plan')
  assert.equal(ci.jobs.removals?.if, "needs.removals-plan.outputs.selected != '0'")
})

test('o plano das remoções lê o pull request pelo ambiente e roda todas as linhas quando o plano diz', () => {
  const plan = ci.jobs['removals-plan']?.steps.find((step) => step.id === 'plan')
  assert.match(plan?.env?.BASE ?? '', /^\$\{\{ github\.event_name == 'pull_request' && /)
  const pullRequest = plan?.env?.PULL_REQUEST ?? ''
  for (const field of [
    'github.event.pull_request.title',
    'github.head_ref',
    'github.event.pull_request.labels.*.name',
  ]) {
    assert.ok(pullRequest.includes(`toJSON(${field})`), field)
  }
  assert.doesNotMatch(plan?.run ?? '', /\$\{\{/)
  assert.match(
    plan?.run ?? '',
    /node scripts\/removals\.ts --plan \$\{BASE:\+--base "\$BASE" --pull-request "\$PULL_REQUEST"\}/,
  )
  assert.match(plan?.run ?? '', /if \.everything then "" else env\.BASE end/)
  assert.ok(ci.on.pull_request && JSON.stringify(ci.on.pull_request).includes('labeled'))
})

test('toda instalação do npm guarda o cache de download sob o hash do lockfile', () => {
  const install = parse(readFileSync(resolve(FOLDER, '../actions/install/action.yml'), 'utf8'))
  const setups = [
    ...install.runs.steps,
    ...Object.values(ci.jobs).flatMap((job) => job.steps),
  ].filter((step: Step) => step.uses?.startsWith('actions/setup-node@'))
  assert.ok(setups.length >= 2)
  for (const step of setups) {
    assert.equal(step.with?.cache, 'npm')
    assert.equal(step.with?.['cache-dependency-path'], 'package-lock.json')
  }
})
