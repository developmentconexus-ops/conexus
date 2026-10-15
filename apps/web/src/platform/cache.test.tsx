import { createMemoryHistory } from '@tanstack/react-router'
import { render, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { expect, test, vi } from 'vitest'

// Nothing here imports the contract at the top: its schemas must be built after jitless.ts runs.
test('montar a página e ler uma resposta do Hub não compilam código em tempo de execução, que a CSP do Hub reporta', async () => {
  const constructed: unknown[][] = []
  const NativeFunction = globalThis.Function
  vi.stubGlobal(
    'Function',
    new Proxy(NativeFunction, {
      construct(target, args) {
        constructed.push(args)
        return Reflect.construct(target, args)
      },
    }),
  )
  document.body.innerHTML = '<div id="root"></div>'
  await import('../main.tsx')
  // Zod probes on the first object it parses, in whichever copy built the contract's schemas.
  const { HubStatus } = await import('@conexus/hub-api')
  HubStatus.parse({
    version: 'v0.1.0',
    lastStart: { state: 'NONE' },
    previousStart: { state: 'NONE' },
  })
  vi.unstubAllGlobals()
  expect(constructed).toEqual([])
})

test('401: uma leitura que acha a sessão terminada leva a /login com "Sua sessão terminou." e o endereço de volta', async () => {
  const { FAILURES, Problem } = await import('@conexus/hub-api')
  const ana = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
  const ended = Problem.parse({
    type: 'urn:conexus:problem:SESSION_REQUIRED',
    title: FAILURES.SESSION_REQUIRED.phrase,
    status: 401,
    code: 'SESSION_REQUIRED',
    traceId: 'a1b2c3',
  })
  const server = setupServer(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json({ state: 'SIGNED_IN', person: ana }),
    ),
    http.get('*/api/status', () => HttpResponse.json(ended, { status: 401 })),
  )
  server.listen({ onUnhandledFrame: 'error' })
  try {
    const { Conexus, createConexus } = await import('../main.tsx')
    const conexus = createConexus(createMemoryHistory({ initialEntries: ['/?from=link'] }))
    // The first test mounted main.tsx into #root; this one reads only its own render.
    const page = within(render(<Conexus conexus={conexus} />).container)
    expect(await page.findByText('Sua sessão terminou. Entre de novo para continuar.')).toBeTruthy()
    expect(conexus.router.state.location.pathname).toBe('/login')
    expect(conexus.router.state.location.search).toEqual({
      reason: 'session-ended',
      redirect: '/?from=link',
    })
    expect(conexus.queryClient.getQueryCache().getAll()).toEqual([])
  } finally {
    server.close()
  }
})
