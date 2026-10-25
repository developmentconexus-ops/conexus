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
  const { ANA } = await import('./fixtures.ts')
  const { refusal } = await import('./test-hub.tsx')
  const server = setupServer(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json({ state: 'SIGNED_IN', person: ANA }),
    ),
    http.get('*/api/companies', () =>
      HttpResponse.json({ companies: [], mayOperate: false, next: { kind: 'END' } }),
    ),
    http.get('*/api/companies/:companyId', () => refusal('SESSION_REQUIRED')),
  )
  server.listen({ onUnhandledFrame: 'error' })
  try {
    const { Conexus, createConexus } = await import('../main.tsx')
    const conexus = createConexus(
      createMemoryHistory({ initialEntries: [`/companies/${'a'.repeat(32)}/projects`] }),
    )
    // The first test mounted main.tsx into #root; this one reads only its own render.
    const page = within(render(<Conexus conexus={conexus} />).container)
    expect(await page.findByText('Sua sessão terminou. Entre de novo para continuar.')).toBeTruthy()
    expect(conexus.router.state.location.pathname).toBe('/login')
    expect(conexus.router.state.location.search).toEqual({
      reason: 'session-ended',
      redirect: `/companies/${'a'.repeat(32)}/projects`,
    })
    expect(conexus.queryClient.getQueryCache().getAll()).toEqual([])
  } finally {
    server.close()
  }
})

test('401: duas leituras que acham a sessão terminada em momentos diferentes levam a um só /login, com a página de origem', async () => {
  const { ANA } = await import('./fixtures.ts')
  const { refusal } = await import('./test-hub.tsx')
  const here = `/companies/${'a'.repeat(32)}/projects`
  const server = setupServer(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json({ state: 'SIGNED_IN', person: ANA }),
    ),
    http.get('*/api/companies', () =>
      HttpResponse.json({ companies: [], mayOperate: false, next: { kind: 'END' } }),
    ),
    http.get('*/api/companies/:companyId', () => refusal('SESSION_REQUIRED')),
  )
  server.listen({ onUnhandledFrame: 'error' })
  try {
    const { Conexus, createConexus } = await import('../main.tsx')
    const conexus = createConexus(createMemoryHistory({ initialEntries: [here] }))
    const page = within(render(<Conexus conexus={conexus} />).container)
    expect(await page.findByText('Sua sessão terminou. Entre de novo para continuar.')).toBeTruthy()
    const { companyQuery } = await import('../hub/identity/queries.ts')
    const { CompanyId } = await import('@conexus/hub-api')
    // Another read, already in flight when the first 401 landed, answers later: on /login now.
    await conexus.queryClient
      .fetchQuery(companyQuery(CompanyId.parse('a'.repeat(32))))
      .catch(() => undefined)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(conexus.router.state.location.pathname).toBe('/login')
    expect(conexus.router.state.location.search).toEqual({
      reason: 'session-ended',
      redirect: here,
    })
    expect(conexus.router.history.length).toBe(2)
  } finally {
    server.close()
  }
})
