import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { HOOK_SCRIPT, setup } from './setup-harness.ts'

// What the hook step alone reads: none of the tokens setup-server.sh needs (founder, 2026-10-18: B).
const NO_TOKENS = {
  RUNNER_URL: undefined,
  RUNNER_VERSION: undefined,
  RUNNER_SHA256: undefined,
  TUNNEL_TOKEN_FILE: undefined,
  RUNNER_TOKEN_FILE: undefined,
}

test('o gancho sozinho roda sem token, instala git e o gancho, e reinicia o runner já instalado', () => {
  const service = 'LANG=C\n'
  const { run, calls, env: used, config } = setup('', '', NO_TOKENS, false, service, HOOK_SCRIPT)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.includes('timeout-for apt-get install -y git'))
  const env = readFileSync(join(config, '..', 'runner', '.env'), 'utf8')
  assert.equal(
    env,
    `LANG=C\nACTIONS_RUNNER_HOOK_JOB_STARTED=${join(config, 'runner-job-started.sh')}\n`,
  )
  assert.ok(!calls.some((call) => call.startsWith('svc.sh')))
  writeFileSync(join(config, '..', 'runner', '.service'), 'actions.runner.hub.service\n')
  const again = spawnSync('/bin/bash', [HOOK_SCRIPT], {
    encoding: 'utf8',
    env: { ...used, CALLS: join(config, '..', 'again.log') },
  })
  assert.equal(again.status, 0, again.stderr)
  const restarted = readFileSync(join(config, '..', 'again.log'), 'utf8').split('\n')
  assert.deepEqual(
    restarted.filter((call) => call.startsWith('svc.sh')),
    ['svc.sh stop', 'svc.sh start'],
  )
})

const MIRROR_URL = 'https://github.com/owner/repo.git'
function hookAlone(extra: Record<string, string>) {
  return setup('', '', { ...NO_TOKENS, ...extra }, false, '', HOOK_SCRIPT)
}

test('com o endereço do GitHub, o gancho prepara o espelho de main só para o runner, sem chave', () => {
  const { run, calls, env } = hookAlone({ MIRROR_URL })
  assert.equal(run.status, 0, run.stderr)
  const at = env.MIRROR_DIR
  const git = `sudo -u runner git --git-dir=${at}`
  assert.deepEqual(
    calls.filter((call) => call.includes(at)),
    [
      `install -d -o runner -g runner -m 0700 ${at}`,
      `${git} init --quiet --bare --initial-branch=main`,
      `${git} config remote.origin.url ${MIRROR_URL}`,
      `timeout-for ${git} fetch --no-tags origin refs/heads/main:refs/heads/main`,
      `${git} fetch --no-tags origin refs/heads/main:refs/heads/main`,
    ],
  )
})

test('recusa um endereço que não é o https do GitHub, antes de tocar o espelho', () => {
  for (const url of ['https://example.invalid/x.git', 'git@github.com:owner/repo.git']) {
    const { run, calls } = hookAlone({ MIRROR_URL: url })
    assert.equal(run.status, 1)
    assert.match(run.stderr, /MIRROR_URL must be https:\/\/github.com\/<owner>\/<repo>.git/)
    assert.ok(!calls.some((call) => call.startsWith('sudo')), url)
  }
})

test('sem endereço e sem espelho, o gancho fica instalado e diz que recusa tudo', () => {
  const { run, calls } = hookAlone({})
  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stderr, /no mirror of main at .*: the hook refuses every job until/)
  assert.ok(!calls.some((call) => call.startsWith('sudo')))
})

test('o gancho cria a pasta dos registros de versão só para o runner', () => {
  const { run, calls, env } = hookAlone({})
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.includes(`install -d -o runner -g runner -m 0700 ${env.RELEASES_DIR}`))
})

test('se o espelho falha, o .env já nomeia o gancho e a falha é do espelho', () => {
  const { run, calls, config } = setup(
    '',
    '',
    { ...NO_TOKENS, MIRROR_URL, FAIL_FETCH: '1' },
    false,
    'LANG=C\n',
    HOOK_SCRIPT,
  )
  assert.notEqual(run.status, 0)
  assert.doesNotMatch(run.stdout, /mirror of main ready/)
  const env = readFileSync(join(config, '..', 'runner', '.env'), 'utf8')
  assert.equal(
    env,
    `LANG=C\nACTIONS_RUNNER_HOOK_JOB_STARTED=${join(config, 'runner-job-started.sh')}\n`,
  )
  assert.ok(calls.some((call) => call.includes(' fetch ')))
})
