import { expect, test, vi } from 'vitest'

test('montar a página não compila código em tempo de execução, que a CSP do Hub reporta', async () => {
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
  vi.unstubAllGlobals()
  expect(constructed).toEqual([])
})
