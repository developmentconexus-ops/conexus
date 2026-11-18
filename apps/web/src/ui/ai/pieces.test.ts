import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import ts from 'typescript'

// Criteria 21 and 23 of the front-end foundation card: a piece of ui/ai/ says nothing of its own,
// and the showcase draws every member of every union a piece exports.
const AI = import.meta.dirname
const SHOWCASE = join(AI, '..', 'showcase')
const SPOKEN = new Set(['aria-label', 'placeholder', 'title', 'alt', 'label'])
const LETTER = /\p{L}/u

function treeOf(name: string, text: string): ts.SourceFile {
  return ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function visit(node: ts.Node, see: (node: ts.Node) => void): void {
  see(node)
  node.forEachChild((child) => visit(child, see))
}

function where(tree: ts.SourceFile, node: ts.Node): string {
  return `${tree.fileName}:${tree.getLineAndCharacterOfPosition(node.getStart()).line + 1}`
}

/** The text a literal says, or a literal inside `{…}`; undefined for anything computed. */
function said(node: ts.Node | undefined): string | undefined {
  if (node === undefined) return undefined
  if (ts.isJsxExpression(node)) return said(node.expression)
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
    ? node.text
    : undefined
}

function phrasesIn(name: string, text: string): string[] {
  const tree = treeOf(name, text)
  const found: string[] = []
  visit(tree, (node) => {
    const between =
      ts.isJsxText(node) ||
      (ts.isJsxExpression(node) && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)))
    const spoken = ts.isJsxAttribute(node) && SPOKEN.has(node.name.getText(tree))
    const words = ts.isJsxText(node)
      ? node.text
      : between || spoken
        ? said(spoken ? node.initializer : node)
        : undefined
    if (words !== undefined && LETTER.test(words))
      found.push(`${where(tree, node)} ${node.getText(tree).trim()}`)
  })
  return found
}

function membersIn(name: string, text: string): string[] {
  const tree = treeOf(name, text)
  const members: string[] = []
  visit(tree, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) return
    if (!node.modifiers?.some((one) => one.kind === ts.SyntaxKind.ExportKeyword)) return
    if (!ts.isUnionTypeNode(node.type)) return
    const kinds = node.type.types.map((member) => {
      if (!ts.isTypeLiteralNode(member)) return undefined
      const kind = member.members.find(
        (one) => ts.isPropertySignature(one) && one.name.getText(tree) === 'kind',
      )
      const type = kind !== undefined && ts.isPropertySignature(kind) ? kind.type : undefined
      return type !== undefined && ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)
        ? type.literal.text
        : undefined
    })
    if (kinds.every((kind) => kind !== undefined))
      members.push(...kinds.map((kind) => `${node.name.text}.${kind}`))
  })
  return members
}

function labelsIn(name: string, text: string): Map<string, string[]> {
  const tree = treeOf(name, text)
  const labels = new Map<string, string[]>()
  visit(tree, (node) => {
    if (!ts.isCallExpression(node) || node.expression.getText(tree) !== 'entry') return
    const [file, , , , states] = node.arguments
    if (file === undefined || !ts.isStringLiteral(file) || !file.text.startsWith('ai/')) return
    const drawn =
      states !== undefined && ts.isArrayLiteralExpression(states)
        ? states.elements.flatMap((state) => {
            const label = ts.isArrayLiteralExpression(state) ? state.elements[0] : undefined
            return label !== undefined && ts.isStringLiteral(label) ? [label.text] : []
          })
        : []
    labels.set(file.text.slice('ai/'.length), drawn)
  })
  return labels
}

function pieces(): string[] {
  return readdirSync(AI).filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
}

function read(folder: string, file: string): string {
  return readFileSync(join(folder, file), 'utf8')
}

test('nenhuma peça de ui/ai/ tem frase própria', () => {
  assert.deepEqual(
    phrasesIn(
      'sources.tsx',
      [
        '<section aria-label="Fontes"><h3>Fontes</h3>{label}</section>',
        "<section aria-label={'Fontes'}><h3>{'Fontes'}</h3>{label}</section>",
        '<section aria-label={`Fontes`}><h3>{`Fontes`}</h3>{label}</section>',
      ].join('\n'),
    ),
    [
      'sources.tsx:1 aria-label="Fontes"',
      'sources.tsx:1 Fontes',
      "sources.tsx:2 aria-label={'Fontes'}",
      "sources.tsx:2 {'Fontes'}",
      'sources.tsx:3 aria-label={`Fontes`}',
      'sources.tsx:3 {`Fontes`}',
    ],
    'the check finds a planted phrase',
  )
  const found = pieces().flatMap((file) => phrasesIn(file, read(AI, file)))
  assert.deepEqual(found, [], 'a piece of ui/ai/ writes a phrase of its own')
})

test('cada membro de cada união de ui/ai/ tem estado na vitrine', () => {
  assert.deepEqual(
    membersIn(
      'x.tsx',
      "export type S = { kind: 'A' } | { kind: 'B'; n: number }\ntype T = { kind: 'C' } | { kind: 'D' }",
    ),
    ['S.A', 'S.B'],
    'the check reads an exported union',
  )
  const drawn = new Map<string, string[]>()
  for (const file of readdirSync(SHOWCASE).filter((one) => one.endsWith('.tsx')))
    for (const [piece, labels] of labelsIn(file, read(SHOWCASE, file))) drawn.set(piece, labels)
  const missing = pieces().flatMap((file) => {
    const labels = drawn.get(file) ?? []
    return membersIn(file, read(AI, file))
      .filter(
        (member) => !labels.some((label) => label === member || label.startsWith(`${member} `)),
      )
      .map((member) => `${file} ${member}`)
  })
  assert.ok(pieces().length > 0, 'ui/ai/ has pieces')
  assert.deepEqual(missing, [], 'a member of a union has no state in the showcase')
})
