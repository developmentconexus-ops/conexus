import assert from 'node:assert/strict'
import { test } from 'node:test'
import example from './index.ts'

const CALLER = { personId: 'p1', personName: 'Ana Souza', projectId: 'j1', projectName: 'Pedidos' }

test('o exemplo mostra a pessoa e o Projeto, de props.caller, sem script', async () => {
  const response = example.fetch(
    new Request('https://x.example.com/'),
    {},
    {
      props: { caller: CALLER },
    },
  )
  const html = await response.text()
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8')
  assert.match(html, /<p>Olá, Ana Souza\. Este é o app do Projeto Pedidos\.<\/p>/)
  assert.ok(!html.includes('<script'))
})

test('o exemplo escapa o que a pessoa escreveu no nome', async () => {
  const response = example.fetch(
    new Request('https://x.example.com/'),
    {},
    {
      props: { caller: { ...CALLER, personName: `Ana <img src=x onerror="a('&')">` } },
    },
  )
  assert.match(
    await response.text(),
    /<p>Olá, Ana &lt;img src=x onerror=&quot;a\(&#39;&amp;&#39;\)&quot;&gt;\. Este é/,
  )
})
