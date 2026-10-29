import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

const INFRA = resolve(import.meta.dirname, '../infra')

test('a imagem do Hub traz o git e a pasta dos repositórios é um volume do usuário do Hub (0051)', () => {
  const dockerfile = readFileSync(join(INFRA, 'hub.Dockerfile'), 'utf8')
  const last = dockerfile.slice(dockerfile.lastIndexOf('\nFROM '))
  assert.match(last, /apt-get install[^\n]*\bgit\b/)
  assert.match(
    last,
    /mkdir -p \/var\/lib\/conexus\/git && chown node:node \/var\/lib\/conexus\/git/,
  )
  const compose = parse(readFileSync(join(INFRA, 'compose.yaml'), 'utf8'))
  assert.deepEqual(compose.services.hub.volumes, ['hub_git:/var/lib/conexus/git'])
  assert.ok('hub_git' in compose.volumes)
  assert.equal(compose.services.hub.environment.HUB_GIT_ROOT, '/var/lib/conexus/git')
  assert.equal(
    compose.services.hub.environment.HUB_GIT_COPY_KEY_FILE,
    '/run/secrets/hub_git_copy_key',
  )
  assert.ok(compose.services.hub.secrets.includes('hub_git_copy_key'))
  assert.equal(
    compose.services.hub.environment.HUB_E2B_API_KEY_FILE,
    '/run/secrets/hub_e2b_api_key',
  )
  assert.ok(compose.services.hub.secrets.includes('hub_e2b_api_key'))
  // The template comes beside the image from deploy.sh, never fixed here nor read from hub.env.
  assert.equal(
    compose.services.hub.environment.HUB_E2B_TEMPLATE,
    ['$', "{HUB_E2B_TEMPLATE:?HUB_E2B_TEMPLATE must name the Builder's template}"].join(''),
  )
})

test('o log de cada serviço gira: json-file, dez megabytes, cinco arquivos (S42)', () => {
  const compose = parse(readFileSync(join(INFRA, 'compose.yaml'), 'utf8'))
  for (const [name, service] of Object.entries<{ logging?: unknown }>(compose.services)) {
    assert.deepEqual(
      service.logging,
      { driver: 'json-file', options: { 'max-size': '10m', 'max-file': '5' } },
      name,
    )
  }
})
