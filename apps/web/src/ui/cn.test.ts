import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cn } from './cn.ts'

test('a brand size and a colour both stay; a later size, radius or spacing of the brand wins', () => {
  assert.equal(cn('text-label text-text-2'), 'text-label text-text-2')
  assert.equal(cn('text-eyebrow text-text-2', 'text-on-ink'), 'text-eyebrow text-on-ink')
  assert.equal(cn('text-label', 'text-body'), 'text-body')
  assert.equal(cn('rounded-control', 'rounded-pill'), 'rounded-pill')
  assert.equal(cn('px-md', 'px-sm'), 'px-sm')
})
