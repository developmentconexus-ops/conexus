import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from './auth.ts'
import type { Connector } from './definition.ts'
import type { Operation, OperationId, ProviderAnswer } from './operation.ts'
import { OPERATION_CLASSES, requestOf } from './operation.ts'
import { toRequest } from './request.ts'

export type Fake = Readonly<{
  credential: Readonly<Record<string, string>> // invented values only (S40)
  handle(request: Request): Promise<Response>
  serve(): Promise<Readonly<{ origin: string; close(): Promise<void> }>> // node:http on 127.0.0.1
}>

async function answerOf(response: Response): Promise<ProviderAnswer> {
  const text = await response.text()
  return {
    status: response.status,
    body: text === '' ? undefined : z.unknown().parse(JSON.parse(text)),
  }
}

async function login(
  connector: Connector,
  fake: Fake,
  credential: Readonly<Record<string, string>>,
) {
  const request = toRequest(connector, tokenRequest(connector.auth, credential), null)
  return readToken(connector.auth, await answerOf(await fake.handle(request)))
}

/** Every request the probes build, as text: the URL, the headers and the body. */
async function textOf(request: Request): Promise<string> {
  const headers = [...request.headers].map(([name, value]) => `${name}:${value}`).join('\n')
  return `${request.url}\n${headers}\n${await request.clone().text()}`
}

/** What every connector passes, against its fake, with no network (node:test describe/it). */
export function runConformance(connector: Connector, fake: Fake): void {
  const door = Object.values(connector.readDoor ?? {})
  const all: readonly Operation<unknown, unknown>[] = [...connector.operations, ...door]

  describe(connector.id, () => {
    it('declares unique ids, a semver version and subjects that each have an operation and a part of the skill', () => {
      assert.equal(new Set(all.map((operation) => operation.id)).size, all.length)
      assert.match(connector.version, /^\d+\.\d+\.\d+$/)
      const { content, references } = connector.skill
      for (const [subject, label] of Object.entries(connector.subjects)) {
        assert.ok(content.includes(subject) && content.includes(label), `SKILL.md names ${subject}`)
        const operations = connector.operations.filter((operation) => operation.subject === subject)
        if (operations.length === 0) continue // the door's entries are named in SKILL.md itself
        const part = references[`${subject}.md`]
        assert.ok(part, `${subject} has a part of the skill`)
        for (const operation of operations)
          assert.ok(part.includes(operation.id), `${subject}.md names ${operation.id}`)
      }
      for (const operation of door) assert.ok(content.includes(operation.id), operation.id)
      assert.ok(
        content.split('\n').length < 500,
        'SKILL.md stays under the 500 lines Mastra recommends',
      )
    })

    it('gives each operation a class, a summary and a probe, and each read idempotent', () => {
      for (const operation of all) {
        assert.ok(OPERATION_CLASSES.includes(operation.class), operation.id)
        assert.ok(operation.summary.length > 0 && operation.label.length > 0, operation.id)
        assert.equal(typeof operation.probe, 'function', operation.id)
        if (operation.class === 'read') assert.equal(operation.idempotent, true, operation.id)
      }
    })

    it('answers each probe, in order, with a value its output schema accepts', async () => {
      const token = await login(connector, fake, fake.credential)
      assert.equal(token.kind, 'OK')
      if (token.kind !== 'OK') return
      const earlier = new Map<OperationId, unknown>()
      for (const operation of all) {
        const input = operation.probe(earlier)
        assert.notEqual(input, null, `${operation.id} has a probe the fake can answer`)
        const request = toRequest(connector, requestOf(operation, input), token.accessToken)
        const answered = operation.answer(await answerOf(await fake.handle(request)))
        assert.equal(answered.kind, 'OK', operation.id)
        if (answered.kind !== 'OK') continue
        earlier.set(operation.id, answered.value)
      }
    })

    it('refuses a wrong key at the login', async () => {
      const wrong = Object.fromEntries(
        Object.keys(fake.credential).map((name) => [name, 'wrong-value']),
      )
      assert.deepEqual(await login(connector, fake, wrong), { kind: 'AUTH_REFUSED' })
    })

    it('puts no credential value in any request but the login', async () => {
      const values = Object.values(fake.credential)
      for (const operation of all) {
        const input = operation.probe(new Map())
        if (input === null) continue
        const text = await textOf(toRequest(connector, requestOf(operation, input), 'bearer'))
        for (const value of values)
          assert.ok(!text.includes(value), `${operation.id} leaks a credential value`)
      }
      const loginText = await textOf(
        toRequest(connector, tokenRequest(connector.auth, fake.credential), null),
      )
      for (const value of values) assert.ok(loginText.includes(value))
    })
  })
}
