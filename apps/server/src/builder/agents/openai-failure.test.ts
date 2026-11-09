import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ACCESS, ACCOUNT_ID, plantCodex } from '../../platform/test-openai-codex.ts'
import { codexModel } from '../model-accounts/public.ts'

// The refusal as the agent's tool throws it (criterion 34); the content is invented (S40).
const FAILURE = JSON.stringify({
  kind: 'REFUSED',
  status: 400,
  code: 'BAD_REQUEST',
  message: 'Ocorreu algum erro inesperado! O produto [999] enviado não existe.',
  body: { error: { code: 'BAD_REQUEST', details: 'O produto [999] enviado não existe.' } },
})

test('a recusa chega inteira ao OpenAI: o provedor não marca erro, e a function_call_output leva o texto inteiro, que começa pelo kind', async (t) => {
  const codex = plantCodex(t)
  codex.responses = () => ({ status: 400 })
  const model = codexModel('gpt-5.6-luna', { access: ACCESS, accountId: ACCOUNT_ID })
  await assert.rejects(async () =>
    model.doStream({
      prompt: [
        { role: 'user', content: [{ type: 'text', text: 'Lance o pedido' }] },
        {
          role: 'assistant',
          content: [
            { type: 'tool-call', toolCallId: 'call_planted', toolName: 'tool_lancar', input: {} },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_planted',
              toolName: 'tool_lancar',
              output: { type: 'error-text', value: FAILURE },
            },
          ],
        },
      ],
    }),
  )
  const request = Object(JSON.parse(String(codex.calls[0]?.body)))
  const [output] = request.input.filter(
    (item: { type?: string }) => item.type === 'function_call_output',
  )
  assert.equal(output.call_id, 'call_planted')
  assert.equal(output.output, FAILURE)
  assert.ok(String(output.output).startsWith('{"kind":"REFUSED"'))
  assert.equal(Reflect.has(output, 'is_error'), false, 'the Responses API has no failure mark')
})
