import assert from 'node:assert/strict'
import { test } from 'node:test'
import { flakyTests } from './rerun-state.ts'

type Child = { line: number; column: number; name: string }

function child(line: number, name: string, column = 3): Child {
  return { line, column, name }
}

function entry(name: string, attempt: number, children: Child[] = []) {
  return { name, children, passed_on_attempt: attempt }
}

test('só o que passou na segunda tentativa é instável, e o teste de um grupo leva o nome do grupo', () => {
  const state = [
    { 'a.test.ts:5:3': entry('ok', 0) },
    {
      'a.test.ts:5:3': entry('ok', 0),
      'a.test.ts:6:3': entry('instável', 1),
      'a.test.ts:4:1': entry('grupo', 1, [child(5, 'ok'), child(6, 'instável')]),
      'b.test.ts:2:1': entry('solto', 1),
    },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [
    { file: 'a.test.ts', name: 'grupo › instável' },
    { file: 'b.test.ts', name: 'solto' },
  ])
})

test('um grupo que passou tarde sem teste tardio é instável por si, como um gancho que falhou uma vez', () => {
  const state = [
    { 'a.test.ts:4:1': entry('grupo', 1, [child(5, 'ok')]), 'a.test.ts:5:3': entry('ok', 0) },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [{ file: 'a.test.ts', name: 'grupo' }])
})

test('sem segunda tentativa nada é instável', () => {
  assert.deepEqual(flakyTests(JSON.stringify([{ 'a.test.ts:1:1': entry('ok', 0) }])), [])
  assert.deepEqual(flakyTests('[]'), [])
})

test('testes gerados no mesmo ponto de um laço levam o arquivo e o nome, nunca a linha nem a ordem', () => {
  const state = [
    {
      'a.test.ts:4:3': entry('gerado 1', 0),
      'a.test.ts:4:3:(1)': entry('gerado 2', 1),
      'a.test.ts:4:3:(263)': entry('gerado 264', 1),
    },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [
    { file: 'a.test.ts', name: 'gerado 2' },
    { file: 'a.test.ts', name: 'gerado 264' },
  ])
})

test('o teste gerado de um grupo leva o nome do grupo, e o grupo não é instável por ele', () => {
  const state = [
    {
      'a.test.ts:7:27': entry('filho 1', 0),
      'a.test.ts:7:27:(1)': entry('filho 2', 1),
      'a.test.ts:6:1': entry('grupo', 1, [child(7, 'filho 1', 27), child(7, 'filho 2', 27)]),
    },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [
    { file: 'a.test.ts', name: 'grupo › filho 2' },
  ])
})

test('dois grupos gerados no mesmo ponto: o teste instável leva o nome do seu grupo, não o do outro', () => {
  const state = [
    {
      'a.test.ts:4:1': entry('largura 320', 1, [child(5, 'sem rolagem 320')]),
      'a.test.ts:4:1:(1)': entry('largura 390', 0, [child(5, 'sem rolagem 390')]),
      'a.test.ts:5:3': entry('sem rolagem 320', 1),
      'a.test.ts:5:3:(1)': entry('sem rolagem 390', 0),
    },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [
    { file: 'a.test.ts', name: 'largura 320 › sem rolagem 320' },
  ])
})

test('o mesmo teste no mesmo ponto de dois grupos não leva o nome de um deles, que seria chute', () => {
  const state = [
    {
      'a.test.ts:4:1': entry('largura 320', 1, [child(5, 'sem rolagem')]),
      'a.test.ts:4:1:(1)': entry('largura 390', 1, [child(5, 'sem rolagem')]),
      'a.test.ts:5:3': entry('sem rolagem', 1),
      'a.test.ts:5:3:(1)': entry('sem rolagem', 0),
    },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [{ file: 'a.test.ts', name: 'sem rolagem' }])
})

test('uma chave do estado fora de arquivo:linha:coluna lança, em vez de esconder o teste instável', () => {
  const state = [{ 'a.test.ts:4': entry('instável', 1) }]
  assert.throws(() => flakyTests(JSON.stringify(state)), /fora do formato: a\.test\.ts:4$/)
})
