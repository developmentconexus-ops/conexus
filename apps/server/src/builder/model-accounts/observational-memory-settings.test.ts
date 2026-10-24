import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf } from '../../hub/identity/test-hub.ts'
import { company, connect } from './test-defaults.ts'

const MODEL = 'openai/gpt-5'

test('the company configures Observer and Reflector independently and restores Auto', async (t) => {
  const { hub, ana, carla, accounts, base } = await company(t)
  await connect(hub, ana, accounts, 'openai')
  const path = `${base}/observational-memory-models`
  assert.deepEqual((await call(hub, ana, 'GET', path)).json(), { observer: null, reflector: null })

  const observer = await call(hub, ana, 'PUT', path, { role: 'observer', model: MODEL })
  assert.equal(observer.statusCode, 200)
  assert.deepEqual(observer.json(), { observer: MODEL, reflector: null })
  const reflector = await call(hub, ana, 'PUT', path, { role: 'reflector', model: MODEL })
  assert.deepEqual(reflector.json(), { observer: MODEL, reflector: MODEL })

  // A different member reads the same company preference, but cannot change it.
  assert.deepEqual((await call(hub, carla, 'GET', path)).json(), {
    observer: MODEL,
    reflector: MODEL,
  })
  const refused = await call(hub, carla, 'PUT', path, { role: 'observer', model: null })
  assert.equal(refused.statusCode, 404)
  assert.equal(codeOf(refused), 'NOT_FOUND')

  const reset = await call(hub, ana, 'PUT', path, { role: 'observer', model: null })
  assert.deepEqual(reset.json(), { observer: null, reflector: MODEL })
})

test('an explicit model without an eligible account is refused', async (t) => {
  const { hub, ana, base } = await company(t)
  const refused = await call(hub, ana, 'PUT', `${base}/observational-memory-models`, {
    role: 'observer',
    model: 'openai/gpt-5',
  })
  assert.equal(refused.statusCode, 422)
  assert.equal(codeOf(refused), 'MODEL_NO_ACCOUNT')
})

test('a model the picker does not offer is refused and nothing is saved', async (t) => {
  const { hub, ana, accounts, base } = await company(t)
  await connect(hub, ana, accounts, 'openai')
  const path = `${base}/observational-memory-models`
  const refused = await call(hub, ana, 'PUT', path, {
    role: 'reflector',
    model: 'openai/not-a-model',
  })
  assert.equal(refused.statusCode, 422)
  assert.equal(codeOf(refused), 'MODEL_UNKNOWN')
  assert.deepEqual((await call(hub, ana, 'GET', path)).json(), { observer: null, reflector: null })
})
