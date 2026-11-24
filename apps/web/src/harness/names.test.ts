import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { test } from 'node:test'
import { FAILURES } from '@conexus/hub-api'
import ts from 'typescript'

const SRC = join(import.meta.dirname, '..')
const OLD_NAMES = /\b(Builder|Construtor|Assistente)\b/

function sourcesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourcesIn(path)
    const isSource = /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')
    const isTest = /\.test\.tsx?$/.test(entry.name) || entry.name.startsWith('test-')
    return isSource && !isTest && entry.name !== 'routeTree.gen.ts' ? [path] : []
  })
}

function textsIn(path: string): { text: string; line: number }[] {
  const tree = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const found: { text: string; line: number }[] = []
  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      const line = tree.getLineAndCharacterOfPosition(node.getStart()).line + 1
      found.push({ text: node.text, line })
    }
    node.forEachChild(visit)
  }
  visit(tree)
  return found
}

test('nenhum texto da web diz "Builder", "Construtor" ou "Assistente" como quem fala', () => {
  const said = sourcesIn(SRC).flatMap((path) =>
    textsIn(path)
      .filter(({ text }) => OLD_NAMES.test(text))
      .map(({ text, line }) => `${relative(SRC, path)}:${line} ${text.trim()}`),
  )
  assert.deepEqual(said, [])
})

test('nenhuma frase de falha do Hub diz "Builder", "Construtor" ou "Assistente"', () => {
  const said = Object.entries(FAILURES).flatMap(([code, row]) =>
    [row.phrase, row.action]
      .filter((text) => OLD_NAMES.test(text))
      .map((text) => `${code} ${text}`),
  )
  assert.deepEqual(said, [])
})
