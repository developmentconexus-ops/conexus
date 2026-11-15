import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DIAGRAM_FRAME } from '@conexus/hub-api'
import { servingWeb } from './test-web-server.ts'

test('o quadro de desenho: a sua política, emoldurável pela página do Hub; os arquivos dele saem com CORS', async (t) => {
  const app = await servingWeb(t, ['index.html', 'diagram-frame.html', 'assets/frame-abc12345.js'])
  for (const method of ['GET', 'HEAD'] as const) {
    const frame = await app.inject({ method, url: DIAGRAM_FRAME.path })
    assert.equal(frame.statusCode, 200, method)
    assert.equal(frame.headers['content-security-policy'], DIAGRAM_FRAME.policy)
    assert.equal(frame.headers['x-frame-options'], 'SAMEORIGIN')
  }
  const script = await app.inject({ url: '/assets/frame-abc12345.js' })
  assert.equal(script.headers['access-control-allow-origin'], '*')
  const page = await app.inject({ url: '/login' })
  assert.match(String(page.headers['content-security-policy']), /style-src 'self';/)
  assert.equal(page.headers['x-frame-options'], 'DENY')
})
