import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APICallError } from '@ai-sdk/provider'
import { callFailureOf } from './errors.ts'

const NOW = Date.parse('2026-11-13T12:00:00Z')
const HOUR = 60 * 60_000

function refused(statusCode: number, message: string, type = 'invalid_request_error') {
  const responseBody = JSON.stringify({ type: 'error', error: { type, message } })
  return new APICallError({
    message,
    url: 'https://x.test',
    requestBodyValues: {},
    statusCode,
    responseBody,
  })
}

test('um 400 de saldo ou de limite de gasto é limite de crédito; um 400 de formato segue desconhecido', () => {
  const credit = refused(400, 'Your credit balance is too low to access the Anthropic API.')
  assert.deepEqual(callFailureOf(credit, NOW), { kind: 'limited', until: new Date(NOW + 6 * HOUR) })
  const spend = refused(400, 'You have reached your specified workspace API usage limits.')
  assert.deepEqual(callFailureOf(spend, NOW), { kind: 'limited', until: new Date(NOW + 6 * HOUR) })
  const signature = refused(400, 'messages.11.content.0: Invalid `signature` in `thinking` block')
  assert.deepEqual(callFailureOf(signature, NOW), { kind: 'unknown', status: 400 })
})
