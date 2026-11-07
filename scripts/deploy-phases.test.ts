import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deploy, NEW_TEMPLATE, OLD_TEMPLATE, SECRETS } from './deploy-harness.ts'

/** The phases the script named on stderr, in order, without the text after the colon's subject. */
function phasesOf(stderr: string): string[] {
  return stderr
    .split('\n')
    .filter((line) => line.startsWith('deploy: '))
    .map((line) => line.slice('deploy: '.length))
}

test('cada fase diz o que começa antes de começar, na ordem em que o deploy as executa', () => {
  const { run } = deploy('hub@sha256:new', { running: 'hub@sha256:old' })
  assert.equal(run.status, 0, run.stderr)
  const phases = phasesOf(run.stderr)
  const order = [
    'checking hub.env',
    'looking for the running Hub',
    'reading the image and the template of the running Hub',
    'pulling hub@sha256:new',
    ...SECRETS.map((name) => `checking the secret ${name} in hub@sha256:new`),
    'reading the migrate label of hub@sha256:new',
    'migrating with hub@sha256:new, attempt 1 of 3',
    'reading the reseal label of hub@sha256:new',
    'resealing with hub@sha256:new',
    `starting the Hub from hub@sha256:new with ${NEW_TEMPLATE}`,
  ]
  const at = order.map((text) => phases.findIndex((phase) => phase.startsWith(text)))
  assert.ok(
    at.every((index) => index >= 0),
    `${JSON.stringify(at)}\n${run.stderr}`,
  )
  assert.deepEqual(
    at,
    [...at].sort((a, b) => a - b),
  )
})

test('o --restart e a volta atrás também dizem a fase antes de começar', () => {
  const restart = deploy('--restart', { running: 'hub@sha256:old' })
  assert.equal(restart.run.status, 0, restart.run.stderr)
  assert.ok(
    phasesOf(restart.run.stderr).some((phase) =>
      phase.startsWith('recreating the Hub from hub@sha256:old'),
    ),
  )
  const back = deploy('hub@sha256:new', { running: 'hub@sha256:old', upStatus: 1 })
  assert.equal(back.run.status, 1)
  assert.ok(
    phasesOf(back.run.stderr).some((phase) =>
      phase.startsWith(`going back to hub@sha256:old with ${OLD_TEMPLATE}`),
    ),
  )
})

test('um pull sem resposta em 120 s diz isso e termina vermelho antes dos segredos e de migrate', () => {
  const { run, count } = deploy('hub@sha256:new', { running: 'hub@sha256:old', pullStatus: 124 })
  assert.equal(run.status, 124)
  assert.match(run.stderr, /no answer in 120 s: docker pull --quiet hub@sha256:new/)
  assert.equal(count('--entrypoint test'), 0)
  assert.equal(count('run --rm migrate'), 0)
  assert.equal(count(' up '), 0)
})

test('um Docker sem resposta ao ler o rótulo termina vermelho: não vira "sem migrations"', () => {
  const { run, count } = deploy('hub@sha256:new', { running: 'hub@sha256:old', inspectStatus: 124 })
  assert.equal(run.status, 124)
  assert.match(run.stderr, /no answer in 90 s: docker image inspect/)
  assert.doesNotMatch(run.stdout, /no migrations in/)
  assert.equal(count('run --rm migrate'), 0)
  assert.equal(count(' up '), 0)
})
