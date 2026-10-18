import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, '../infra/publish-edge.sh')
const dir = mkdtempSync(join(tmpdir(), 'conexus-edge-'))
after(() => rmSync(dir, { recursive: true, force: true }))

const TOKEN = 'cloudflare-token-value'
const KEY = 'a1'.repeat(32)
// The stub records its arguments and whether its own environment holds the token; the third call
// can be made to fail.
const WRANGLER = `#!/bin/bash
stdin=""
# The bytes wrangler reads, counted: a newline would count.
if [ "$1" = secret ]; then stdin="$(wc --bytes)"; fi
echo "wrangler $* [token-in-env=\${CLOUDFLARE_API_TOKEN:+yes}]\${stdin:+ [stdin=$stdin]}" >> "$CALLS"
if [ "$(wc -l < "$CALLS")" = "\${STUB_FAIL_AT:-0}" ]; then echo "the upload failed" >&2; exit 1; fi
`

function publish(
  options: {
    edge?: boolean
    content?: string
    mode?: number
    failAt?: number
    user?: string
    keyMode?: number
    key?: string
  } = {},
) {
  const root = mkdtempSync(join(dir, 'release-'))
  if (options.edge !== false) {
    mkdirSync(join(root, 'apps/edge'), { recursive: true })
    mkdirSync(join(root, 'node_modules/.bin'), { recursive: true })
    writeFileSync(join(root, 'node_modules/.bin/wrangler'), WRANGLER)
    chmodSync(join(root, 'node_modules/.bin/wrangler'), 0o755)
  }
  const file = join(root, 'cloudflare.env')
  writeFileSync(
    file,
    options.content ?? `CLOUDFLARE_API_TOKEN=${TOKEN}\nCLOUDFLARE_ACCOUNT_ID=account\n`,
  )
  chmodSync(file, options.mode ?? 0o400)
  const key = join(root, 'app-login-key')
  writeFileSync(key, options.key ?? `${KEY}\n`)
  chmodSync(key, options.keyMode ?? 0o400)
  const calls = join(root, 'calls')
  writeFileSync(calls, '')
  // A stub `id` stands for a runner that is not the file's owner.
  const bin = join(root, 'bin')
  mkdirSync(bin)
  if (options.user !== undefined) {
    writeFileSync(join(bin, 'id'), `#!/bin/bash\necho ${options.user}\n`)
    chmodSync(join(bin, 'id'), 0o755)
  }
  const run = spawnSync('bash', [SCRIPT], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      CALLS: calls,
      CLOUDFLARE_ENV_FILE: file,
      APP_LOGIN_KEY_FILE: key,
      STUB_FAIL_AT: String(options.failAt ?? 0),
    },
  })
  const recorded = readFileSync(calls, 'utf8').split('\n').filter(Boolean)
  return { run, recorded, file }
}

test('publica o muro, o exemplo no espaço de nomes, a chave e o despachante, nessa ordem', () => {
  const { run, recorded, file } = publish()
  assert.equal(run.status, 0, run.stderr)
  assert.deepEqual(recorded, [
    `wrangler deploy --env-file ${file} --config wrangler.outbound.jsonc [token-in-env=]`,
    `wrangler deploy --env-file ${file} --config example/wrangler.jsonc --dispatch-namespace conexus-apps [token-in-env=]`,
    `wrangler secret put APP_LOGIN_KEY --env-file ${file} [token-in-env=] [stdin=${KEY.length}]`,
    `wrangler deploy --env-file ${file} [token-in-env=]`,
  ])
  assert.match(run.stdout, /edge published\n$/)
})

test('o token e a chave não estão na linha de comando, no ambiente do script nem na saída', () => {
  const { run, recorded } = publish()
  assert.equal(run.status, 0, run.stderr)
  const seen = `${recorded.join('\n')}${run.stdout}${run.stderr}`
  assert.doesNotMatch(seen, new RegExp(TOKEN))
  assert.doesNotMatch(seen, new RegExp(KEY))
})

for (const [label, text] of [
  ['com espaço', `${KEY} \n`],
  ['com CR', `${KEY}\r\n`],
  ['curta', 'a1\n'],
  ['maiúscula', `${KEY.toUpperCase()}\n`],
]) {
  test(`recusa a chave ${label}, que daria outras senhas: nada se publica`, () => {
    const { run, recorded } = publish({ key: text })
    assert.equal(run.status, 1)
    assert.match(run.stderr, /is not 64 hexadecimal digits/)
    assert.deepEqual(recorded, [])
  })
}

test('recusa a chave legível por outros: nada se publica', () => {
  const { run, recorded } = publish({ keyMode: 0o644 })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /app-login-key must be readable by its owner only/)
  assert.deepEqual(recorded, [])
})

test('um passo que falha para os seguintes e falha a publicação', () => {
  const { run, recorded } = publish({ failAt: 2 })
  assert.equal(run.status, 1)
  assert.equal(recorded.length, 2)
  assert.match(run.stderr, /the upload failed/)
  assert.doesNotMatch(run.stdout, /edge published/)
})

test('um Release sem apps/edge deixa a borda como está e diz isso', () => {
  const { run, recorded } = publish({ edge: false })
  assert.equal(run.status, 0, run.stderr)
  assert.equal(run.stdout, 'this release has no apps/edge; the edge stays as it is\n')
  assert.deepEqual(recorded, [])
})

test('recusa um arquivo legível por outros, vazio ou sem a chave', () => {
  const open = publish({ mode: 0o644 })
  assert.equal(open.run.status, 1)
  assert.match(open.run.stderr, /must be readable by its owner only/)
  const empty = publish({ content: '' })
  assert.equal(empty.run.status, 1)
  assert.match(empty.run.stderr, /missing or empty: /)
  const noAccount = publish({ content: `CLOUDFLARE_API_TOKEN=${TOKEN}\n` })
  assert.equal(noAccount.run.status, 1)
  assert.match(noAccount.run.stderr, /has no CLOUDFLARE_ACCOUNT_ID/)
  assert.deepEqual([...open.recorded, ...empty.recorded, ...noAccount.recorded], [])
})

test('recusa um arquivo cujo dono não é quem publica', () => {
  const { run, recorded } = publish({ user: 'someone-else' })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /must be readable by its owner only, and the owner must be someone-else/)
  assert.deepEqual(recorded, [])
})
