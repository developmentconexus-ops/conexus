import assert from 'node:assert/strict'
import { test } from 'node:test'
import { masked } from './mask.ts'

// Output as `git`, `npm` and a path print it, which a person reads to see what was saved.
const SAMPLES = [
  'fa2dba1 Merge pull request #249 from developmentconexus-ops/feat/conexus-e14-cards',
  'commit fa2dba17c04b29b5ab2f9ee6f6b6fdb3b5e0d5d1',
  '100644 blob 997f430a4a5dd6e2b9f8c1ac0d8a5b6e2ac4f7d1\t.agents/skills/conexus-build/SKILL.md',
  '"integrity": "sha512-Jd3yQ8h0o4cT7lZbXa2eKfVnU1sPqRm9wYxN5tLg6BvH8uCiDzAe0oS4kFrWjEG3pMh1nQdTy7XcVb2LaZ9uw==",',
  '/home/user/app/node_modules/typescript/lib/typescript.js',
  'src/builder/conversation/some-long-directory/another-long-directory-name/mask.test.ts',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
]

test('a saída que a pessoa lê (commit, árvore, integridade, caminho) passa sem mudança', () => {
  for (const sample of SAMPLES) assert.equal(masked(sample), sample)
})

test('um segredo sem nome ao lado só é mascarado pelo prefixo do provedor', () => {
  const unnamed = 'q8Zr3VtN1xLw5Hc7Pd2Bm9Ks4Ja6Fe0YgUo8TnRiXb3C'
  assert.equal(masked(unnamed), unnamed, 'the accepted loss: no shape, no name')
  // Joined here so the file holds no string a secret scanner would take for a real token.
  const made = (prefix: string, rest: string) => prefix + rest
  for (const token of [
    made('glpat', '-xYz1234567890abcdefg'),
    made('ghs', '_16C7e42F292c6912E7710c838347Ae178B4a'),
    made('npm', '_a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ'),
    made('AIza', 'SyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q'),
  ]) {
    assert.equal(masked(`using ${token} now`), 'using *** now', token)
  }
})
