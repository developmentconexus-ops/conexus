import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NetworkDomain } from './network.ts'

const OPENABLE: readonly [typed: string, stored: string][] = [
  ['exemplo.com', 'exemplo.com'],
  ['Exemplo.COM', 'exemplo.com'],
  ['münchen.de', 'xn--mnchen-3ya.de'],
  ['api.exemplo.com.br', 'api.exemplo.com.br'],
  ['*.exemplo.com', '*.exemplo.com'],
  ['*.exemplo.com.br', '*.exemplo.com.br'],
  ['*.München.de', '*.xn--mnchen-3ya.de'],
  ['github.io', 'github.io'],
  ['note2b.app', 'note2b.app'],
]

const REFUSED: Readonly<Record<string, readonly string[]>> = {
  'um IP': ['1.2.3.4', '127.1', '2130706433', '[::1]'],
  'um nome só': ['localhost', 'intranet', '*', ''],
  'porta ou caminho': [
    'exemplo.com/a',
    'exemplo.com/',
    'exemplo.com\\a',
    'exemplo.com:8443',
    'exemplo.com:443',
    'exemplo.com?a=1',
    'exemplo.com?',
    'exemplo.com#a',
    'ana@exemplo.com',
    '@exemplo.com',
    'https://exemplo.com',
    '%65xemplo.com',
    'exemplo.com\n',
    ' exemplo.com',
  ],
  'estrela no meio': ['a.*.exemplo.com', '*.*.exemplo.com', '**.exemplo.com', 'api*.exemplo.com'],
  'estrela sobre sufixo público': [
    '*.com',
    '*.com.br',
    '*.co.uk',
    '*.github.io',
    '*.cloudfront.net',
  ],
  'nome sob e2b': ['e2b.app', '49999-abc.e2b.app', 'api.e2b.dev', '*.e2b.dev', '*.x.e2b.app'],
  'nome sob localhost': ['foo.localhost', '*.foo.localhost', 'Foo.LOCALHOST'],
  'texto que não é nome de máquina': ['exemplo.com.', 'a..exemplo.com', '-a.com', "a'b.com"],
}

test('a forma do domínio: o que abre sai em minúsculas e punycode', () => {
  for (const [typed, stored] of OPENABLE) assert.equal(NetworkDomain.parse(typed), stored, typed)
})

for (const [why, names] of Object.entries(REFUSED))
  test(`a forma do domínio: recusa ${why}`, () => {
    for (const typed of names)
      assert.equal(NetworkDomain.safeParse(typed).success, false, JSON.stringify(typed))
  })
